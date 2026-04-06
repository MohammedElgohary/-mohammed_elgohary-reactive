/**
 * Template Parser — walks the DOM, detects which state each node references,
 * stamps the scope attribute automatically, and wires scoped reactive bindings.
 *
 * Supported syntax:
 *   {{ expr }}         — text interpolation
 *   :attr="expr"       — attribute binding
 *   :class="expr"      — class binding
 *   :style="expr"      — style object binding
 *   :model="expr"      — two-way input binding
 *   :show="expr"       — visibility (display toggle)
 *   :html="expr"       — inner HTML (sanitized)
 *   @event="statement" — event handler
 *
 * Performance model:
 *   - State-name regexes are compiled once per name and reused across all nodes.
 *   - Each DOM node is bound only to the states it actually references.
 *   - collectExprs + detectNodeScope are merged into a single pass so each node's
 *     attributes and text content are scanned exactly once.
 *   - parseInterpolations returns [] on plain strings (no regex cost).
 *   - Expression compilation uses destructured parameters instead of `with()`,
 *     allowing V8 to optimise the generated function body.
 *   - Expressions are cached by (scopeKeys + expr) so each unique combination
 *     compiles exactly once.
 *   - Live NodeList / NamedNodeMap iteration avoids Array.from() allocations.
 *
 * SEO:
 *   The initial HTML is left intact — {{ }} expressions are resolved on
 *   DOMContentLoaded, so server-rendered content is visible before JS runs.
 *
 * Security:
 *   - Expressions run inside new Function() with a sandboxed destructured scope.
 *   - No eval(), no global access beyond the registered state names.
 *   - :html uses the existing sanitizeHtml pipeline from bind.ts.
 *   - Event handlers receive only the state scope + $event.
 */

import { bindText, bindAttr, bindStyles, bindHTML } from "./bind";
import { bindAction } from "./action";
import { effect } from "./effect";
import {
  evaluate,
  execute,
  parseInterpolations,
  isStaticExpression,
} from "./expression";
import {
  buildScope,
  getStateNames,
  registerState,
  discoverWindowStates,
} from "./registry";
import { processIf, processElse, processFor, processModel } from "./directives";
import { SCOPE_ATTR } from "./constants";

// ── Modifiers ───────────────────────────────────────────────────────────────

interface ParsedModifiers {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  self?: boolean;
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
  debounce?: number;
  number?: boolean;
  trim?: boolean;
  keys?: string[];
}

/**
 * Parse a list of dot-separated modifiers into an options object.
 * Handles unified dot-syntax like .debounce.300 and key modifiers like .enter.
 */
function parseModifiers(modifiers: string[]): ParsedModifiers {
  const options: ParsedModifiers = {};
  const map: Record<string, keyof ParsedModifiers> = {
    prevent: "preventDefault",
    stop: "stopPropagation",
    self: "self",
    once: "once",
    capture: "capture",
    passive: "passive",
    number: "number",
    trim: "trim",
  };

  for (let i = 0; i < modifiers.length; i++) {
    const mod = modifiers[i];
    if (map[mod]) {
      (options as any)[map[mod]] = true;
    } else if (mod === "debounce") {
      const next = modifiers[i + 1];
      const isNum = next && /^\d+$/.test(next);
      options.debounce = isNum ? parseInt(next, 10) : 300;
      if (isNum) i++;
    } else {
      (options.keys ??= []).push(mod);
    }
  }
  return options;
}

// ── Style Injection ─────────────────────────────────────────────────────────

/**
 * Automatically inject the "cloak" CSS to prevent flash of unstyled {{ }} expressions.
 * Injects body { opacity: 0 } immediately, which is revealed by autoMount().
 */
function injectCloakCSS(): void {
  if (typeof document === "undefined" || document.getElementById("r-cloak"))
    return;
  const style = document.createElement("style");
  style.id = "r-cloak";
  style.textContent = `
    body:not(.r-ready) { opacity: 0; }
    body.r-ready { opacity: 1; transition: opacity 0.1s ease-in; }
  `;
  document.head.appendChild(style);
}

// Run immediately on load
if (typeof window !== "undefined") {
  injectCloakCSS();
}

// ── Regex cache ───────────────────────────────────────────────────────────────

/**
 * Pre-compiled word-boundary regexes, one per registered state name.
 * Built once in walkTree and reused for every node in the subtree.
 * Avoids constructing `new RegExp(...)` inside the hot per-node loop.
 */
function buildNameRegexes(names: string[]): Map<string, RegExp> {
  const map = new Map<string, RegExp>();
  for (const name of names) {
    map.set(name, new RegExp(`\\b${name}\\b`));
  }
  return map;
}

// ── Scope detection ──────────────────────────────────────────────────────────

/**
 * Given a list of expression strings and the pre-compiled name regexes,
 * return which state names are referenced.
 */
function extractRefs(
  exprs: string[],
  names: string[],
  nameRegexes: Map<string, RegExp>,
): string[] {
  if (exprs.length === 0) return [];
  const refs = new Set<string>();
  for (const name of names) {
    const re = nameRegexes.get(name)!;
    for (const expr of exprs) {
      if (re.test(expr)) {
        refs.add(name);
        break; // no need to test remaining exprs for this name
      }
    }
  }
  return Array.from(refs).sort();
}

/**
 * Collect all expression strings from a node's text content and attributes.
 * Single-pass — used both for ref detection and for binding setup.
 */
function collectExprs(node: Element | Text): string[] {
  const exprs: string[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    const parts = parseInterpolations(text);
    for (const p of parts) {
      if (p.type === "expr") exprs.push(p.value);
    }
    return exprs;
  }

  const el = node as Element;

  // Attribute expressions — iterate live NamedNodeMap directly (no Array.from)
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    if (attr.name.startsWith("@") || attr.name.startsWith(":")) {
      exprs.push(attr.value);
    } else {
      const parts = parseInterpolations(attr.value);
      for (const p of parts) {
        if (p.type === "expr") exprs.push(p.value);
      }
    }
  }

  return exprs;
}

// ── Node processors ──────────────────────────────────────────────────────────

function processTextNode(
  node: Text,
  scope: Record<string, any>,
): (() => void) | null {
  const raw = node.textContent ?? "";
  const parts = parseInterpolations(raw);
  if (parts.length === 0) return null;

  if (parts.length === 1 && parts[0].type === "expr") {
    const expr = parts[0].value;
    return bindText(node as unknown as Element, () => evaluate(expr, scope));
  }

  return effect(() => {
    node.textContent = parts
      .map((p) =>
        p.type === "static" ? p.value : String(evaluate(p.value, scope) ?? ""),
      )
      .join("");
  });
}

function processElement(
  el: Element,
  scope: Record<string, any>,
  names: string[],
  nameRegexes: Map<string, RegExp>,
  lastIfExpr?: string | null,
): { cleanups: (() => void)[]; ifExpr?: string | null } {
  const cleanups: (() => void)[] = [];

  const attrs = el.attributes;
  const snapshot: { name: string; value: string }[] = [];
  for (let i = 0; i < attrs.length; i++) {
    snapshot.push({ name: attrs[i].name, value: attrs[i].value });
  }

  // 1. :for (highest priority)
  const forAttr = snapshot.find(
    (a) => a.name === ":for" || a.name.startsWith(":for."),
  );
  if (forAttr) {
    el.removeAttribute(forAttr.name);
    return processFor({
      el,
      value: forAttr.value,
      scope,
      names,
      nameRegexes,
      walkTree,
      buildNameRegexes,
    });
  }

  // 2. :if
  const ifAttr = snapshot.find(
    (a) => a.name === ":if" || a.name.startsWith(":if."),
  );
  if (ifAttr) {
    el.removeAttribute(ifAttr.name);
    return processIf({
      el,
      value: ifAttr.value,
      scope,
      names,
      nameRegexes,
      walkTree,
      buildNameRegexes,
    });
  }

  // 3. :else
  const elseAttr = snapshot.find(
    (a) => a.name === ":else" || a.name.startsWith(":else."),
  );
  if (elseAttr) {
    el.removeAttribute(elseAttr.name);
    return processElse(
      {
        el,
        value: elseAttr.value,
        scope,
        names,
        nameRegexes,
        walkTree,
        buildNameRegexes,
      },
      lastIfExpr ?? null,
    );
  }

  for (const { name, value } of snapshot) {
    // ── @event ───────────────────────────────────────────────────────────────
    if (name.startsWith("@")) {
      const fullEvent = name.slice(1);
      const parts = fullEvent.split(".");
      const event = parts[0];
      const options = parseModifiers(parts.slice(1));

      cleanups.push(
        bindAction(
          el as HTMLElement,
          event as any,
          (e: Event) => {
            if (options.keys && e instanceof KeyboardEvent) {
              const key = e.key.toLowerCase();
              const match = options.keys.some((k: string) => {
                if (k === "enter") return key === "enter";
                if (k === "esc" || k === "escape") return key === "escape";
                if (k === "space") return key === " ";
                if (k === "tab") return key === "tab";
                if (k === "up") return key === "arrowup";
                if (k === "down") return key === "arrowdown";
                if (k === "left") return key === "arrowleft";
                if (k === "right") return key === "arrowright";
                return key === k.toLowerCase();
              });
              if (!match) return;
            }
            execute(value, scope, e);
          },
          options,
        ),
      );
      el.removeAttribute(name);
      continue;
    }

    // ── :directives ──────────────────────────────────────────────────────────
    if (name.startsWith(":")) {
      const fullDirective = name.slice(1);
      const parts = fullDirective.split(".");
      const directive = parts[0];
      const options = parseModifiers(parts.slice(1));
      el.removeAttribute(name);

      if (directive === "model") {
        const result = processModel(
          {
            el,
            value,
            scope,
            names,
            nameRegexes,
            walkTree,
            buildNameRegexes,
          },
          options,
        );
        cleanups.push(...result.cleanups);
        continue;
      }

      if (directive === "show") {
        cleanups.push(
          effect(() => {
            (el as HTMLElement).style.display = evaluate(value, scope)
              ? ""
              : "none";
          }),
        );
        continue;
      }

      if (directive === "html") {
        cleanups.push(bindHTML(el, () => evaluate(value, scope)));
        continue;
      }

      if (directive === "class") {
        cleanups.push(
          effect(() => {
            const result = evaluate(value, scope);
            if (typeof result === "string") {
              el.className = result;
            } else if (result && typeof result === "object") {
              Object.entries(result).forEach(([cls, on]) =>
                on ? el.classList.add(cls) : el.classList.remove(cls),
              );
            }
          }),
        );
        continue;
      }

      if (directive === "style") {
        cleanups.push(bindStyles(el, () => evaluate(value, scope)));
        continue;
      }

      // generic :attr
      cleanups.push(bindAttr(el, directive, () => evaluate(value, scope)));
      continue;
    }

    // ── inline {{ }} in attribute values ─────────────────────────────────────
    const parts = parseInterpolations(value);
    if (parts.length > 0) {
      cleanups.push(
        effect(() => {
          el.setAttribute(
            name,
            parts
              .map((p) =>
                p.type === "static"
                  ? p.value
                  : String(evaluate(p.value, scope) ?? ""),
              )
              .join(""),
          );
        }),
      );
    }
  }

  return { cleanups, ifExpr: null };
}

// ── Tree walker ───────────────────────────────────────────────────────────────

/**
 * Walk a DOM subtree, auto-detect which state each node references,
 * stamp data-scope, and wire scoped bindings.
 *
 * @param root        — root element to parse
 * @param scope       — merged state scope { counter: {...}, user: {...} }
 * @param names       — known state names for scope detection
 * @param nameRegexes — pre-compiled word-boundary regexes (one per name)
 */
export function walkTree(
  root: Element | Document,
  scope: Record<string, any>,
  names: string[],
  nameRegexes: Map<string, RegExp>,
): () => void {
  const cleanups: (() => void)[] = [];

  const walker = document.createTreeWalker(
    root as Node,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT,
    null,
  );

  let node: Node | null = walker.currentNode;
  let lastIfExpr: string | null = null;
  let isFirst = true;

  while (node) {
    if (!isFirst) {
      node = walker.nextNode();
    }
    isFirst = false;
    if (!node) break;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const exprs = collectExprs(text);
      if (exprs.length > 0) {
        const refs = extractRefs(exprs, names, nameRegexes);
        if (refs.length > 0 || exprs.every(isStaticExpression)) {
          // Stamp scope on parent element
          const parent = text.parentElement;
          if (parent && refs.length > 0) {
            const existing = parent.getAttribute(SCOPE_ATTR);
            const merged = existing
              ? Array.from(new Set([...existing.split(" "), ...refs]))
                  .sort()
                  .join(" ")
              : refs.join(" ");
            parent.setAttribute(SCOPE_ATTR, merged);
          }
          const stop = processTextNode(text, scope);
          if (stop) cleanups.push(stop);
        }
      }
      if (node.textContent?.trim()) {
        lastIfExpr = null;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const exprs = collectExprs(el);
      const hasDirectives = Array.from(el.attributes).some(
        (a) => a.name.startsWith(":") || a.name.startsWith("@"),
      );

      if (exprs.length > 0 || hasDirectives) {
        if (
          hasDirectives ||
          extractRefs(exprs, names, nameRegexes).length > 0 ||
          exprs.every(isStaticExpression)
        ) {
          // Stamp _f only for top-level registered states
          const topLevelRefs = extractRefs(exprs, names, nameRegexes);
          if (topLevelRefs.length > 0) {
            const existing = el.getAttribute(SCOPE_ATTR);
            const merged = existing
              ? Array.from(new Set([...existing.split(" "), ...topLevelRefs]))
                  .sort()
                  .join(" ")
              : topLevelRefs.join(" ");
            el.setAttribute(SCOPE_ATTR, merged);
          }

          // Clear any stale placeholder tracking from previous parse runs
          delete (el as any)._placeholder;

          const result = processElement(
            el,
            scope,
            names,
            nameRegexes,
            lastIfExpr,
          );
          cleanups.push(...result.cleanups);

          if (result.ifExpr) {
            lastIfExpr = result.ifExpr;
          } else if (el.hasAttribute(":else") || (el as any)._placeholder) {
            lastIfExpr = null;
          } else {
            lastIfExpr = null;
          }

          if ((el as any)._placeholder) {
            const ph = (el as any)._placeholder;
            // Only move the walker to the placeholder if it's actually in a tree
            // that the walker can continue from. If it's detached, we should
            // still stop walking the subtree of 'el', but we don't move the walker.
            if (ph.parentNode) {
              walker.currentNode = ph;
            } else {
              // If detached, we can't move walker.currentNode to ph because nextNode()
              // will return null. We must skip the children of el manually or stop.
              // For a root node, stopping is correct.
              if (el === root) break;
            }

            if (el === root) {
              isFirst = false;
            }
          }
        } else {
          lastIfExpr = null;
        }
      } else {
        lastIfExpr = null;
      }
    }
  }

  return () => cleanups.forEach((s) => s());
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * mount() — the recommended single entry point for browser usage.
 *
 * Registers named states and immediately parses the DOM.
 * Replaces the need for stack-trace inference which is unreliable
 * in minified/production builds.
 *
 * @example
 * const counter = reactive({ count: 0 });
 * const user    = reactive({ name: 'Ali' });
 * mount({ counter, user });
 */
export function mount(
  states: Record<string, Record<string, any>>,
  root: Element = document.body,
): () => void {
  _explicitMountCalled = true;
  Object.entries(states).forEach(([name, state]) => registerState(name, state));
  return autoMount(root);
}

/**
 * Parse a DOM subtree against an explicit scope.
 * Low-level — prefer mount() for browser usage.
 */
export function parse(
  root: Element | Document,
  scope: Record<string, any>,
): () => void {
  const names = Object.keys(scope);
  const nameRegexes = buildNameRegexes(names);
  return walkTree(root, scope, names, nameRegexes);
}

/**
 * Auto-mount: reads the global registry, builds the scope,
 * and parses document.body. Called automatically on DOMContentLoaded.
 *
 * This is the zero-config entry point — just define reactive() states
 * and include the script. Nothing else needed.
 *
 * Calling autoMount() while a previous mount is still active will first
 * tear down the previous bindings before re-mounting.
 */
export function autoMount(root: Element = document.body): () => void {
  // Tear down any previous auto-mount before re-mounting.
  if (_autoMountCleanup) {
    _autoMountCleanup();
    _autoMountCleanup = null;
  }

  const scope = buildScope();
  const names = getStateNames();

  if (names.length === 0) {
    console.warn("[reactive] autoMount: no reactive states registered.");
    return () => {};
  }

  const nameRegexes = buildNameRegexes(names);
  const cleanups: (() => void)[] = [];

  const cleanup = walkTree(root, scope, names, nameRegexes);
  cleanups.push(cleanup);

  // ── Enhanced DOM updates: watch for dynamic changes ───────────────────────
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE ||
          node.nodeType === Node.TEXT_NODE
        ) {
          cleanups.push(walkTree(node as Element, scope, names, nameRegexes));
        }
      });
    }
  });

  observer.observe(root, { childList: true, subtree: true });
  cleanups.push(() => observer.disconnect());

  const finalCleanup = () => cleanups.forEach((s) => s());
  _autoMountCleanup = finalCleanup;

  // Reveal body — also set a hard fallback in case this path is skipped
  if (typeof document !== "undefined") {
    document.body.classList.add("r-ready");
  }
  return finalCleanup;
}

let _autoMountCleanup: (() => void) | null = null;
let _autoMountPending = false;
let _explicitMountCalled = false;

/**
 * Schedule a deferred autoMount. Safe to call multiple times —
 * only one mount will run per microtask checkpoint.
 * Called automatically by reactive() when it registers a state.
 * Skipped if mount() was already called explicitly by the user.
 */
export function scheduleAutoMount(): void {
  if (_autoMountPending || typeof window === "undefined") return;
  _autoMountPending = true;

  // Hard fallback: always reveal body within 300ms even if mount fails
  setTimeout(() => {
    if (typeof document !== "undefined") {
      document.body.classList.add("r-ready");
    }
  }, 300);

  const run = () => {
    _autoMountPending = false;
    // If the user already called mount() explicitly, don't override it.
    if (_explicitMountCalled) return;
    // Discover any reactive() objects assigned to window globals before
    // checking the registry — this is the zero-config auto-registration path.
    discoverWindowStates();
    if (getStateNames().length > 0) {
      _autoMountCleanup = autoMount();
    }
  };

  if (document.readyState === "loading") {
    // Scripts in <head> — wait for DOM
    document.addEventListener("DOMContentLoaded", () => queueMicrotask(run), {
      once: true,
    });
  } else {
    // Scripts at bottom of <body> or deferred — DOM ready, just wait for
    // remaining synchronous script to finish
    queueMicrotask(run);
  }
}

/**
 * Tear down all auto-mounted bindings (useful for SPA navigation or testing).
 */
export function unmount(): void {
  _autoMountCleanup?.();
  _autoMountCleanup = null;
  _explicitMountCalled = false;
}
