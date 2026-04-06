/**
 * Expression evaluator — safely evaluates template expressions against a state scope.
 * Used by the template parser to resolve {{ expr }} and directive values.
 */

import { SCOPE_VAR, BANNED_GLOBALS } from "./constants";

// ── Cache ────────────────────────────────────────────────────────────────────

// Two separate maps avoid the fragile "__stmt__" prefix key-collision risk.
const exprCache = new Map<string, (state: Record<string, any>) => any>();
const stmtCache = new Map<
  string,
  (state: Record<string, any>, event?: Event) => void
>();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a sandboxed function for an expression (read-only evaluation).
 */
function buildExprFn(
  keys: string[],
  expr: string,
): (state: Record<string, any>) => any {
  const param = keys.length ? `{ ${keys.join(", ")} }` : "_";
  // Add banned globals as undefined parameters
  const args = [param, ...BANNED_GLOBALS];
  return new Function(...args, `return (${expr})`) as (
    state: Record<string, any>,
  ) => any;
}

/**
 * Build a sandboxed function for a statement (may mutate scope).
 */
function buildStmtFn(
  keys: string[],
  body: string,
): (state: Record<string, any>, event?: Event) => void {
  // Pre-compile name regex to avoid loop overhead
  const nameRegex = keys.length
    ? new RegExp(`(?<![.\\w])\\b(${keys.join("|")})\\b`, "g")
    : null;

  const rewritten = nameRegex
    ? body.replace(nameRegex, (match) => `${SCOPE_VAR}.${match}`)
    : body;

  const args = [SCOPE_VAR, "$event", ...BANNED_GLOBALS];
  // In a browser, the Function constructor creates functions that have
  // access to the global scope. We pass BANNED_GLOBALS as undefined arguments
  // to shadow them and prevent access to sensitive APIs.
  return new Function(...args, `return (${rewritten});`) as (
    state: Record<string, any>,
    event?: Event,
  ) => any;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compile an expression string into a reusable function.
 * The function accepts the full scope object and returns the expression value.
 *
 * Compilation is cached — the same expression string always returns the same fn.
 *
 * @example
 * compileExpression("counter.count + 1", ["counter"])
 * // → ({ counter }) => counter.count + 1
 */
export function compileExpression(
  expr: string,
  scopeKeys: string[] = [],
): (state: Record<string, any>) => any {
  const trimmed = expr.trim();
  const cacheKey = `${scopeKeys.join(",")}|${trimmed}`;

  if (exprCache.has(cacheKey)) return exprCache.get(cacheKey)!;

  let fn: (state: Record<string, any>) => any = () => undefined;
  try {
    fn = buildExprFn(scopeKeys, trimmed);
  } catch {
    console.warn(`[reactive] Failed to compile expression: "${trimmed}"`);
  }

  exprCache.set(cacheKey, fn);
  return fn;
}

/**
 * Evaluate an expression string against a state object.
 * Returns undefined and warns on runtime error.
 */
export function evaluate(expr: string, state: Record<string, any>): any {
  try {
    return compileExpression(expr, Object.keys(state))(state);
  } catch (e) {
    console.warn(`[reactive] Error evaluating expression "${expr}":`, e);
    return undefined;
  }
}

/**
 * Compile a statement (no return value) — used for @event handlers like "count++".
 * Cached separately from expressions to avoid key collisions.
 */
export function compileStatement(
  expr: string,
  scopeKeys: string[] = [],
): (state: Record<string, any>, event?: Event) => any {
  const trimmed = expr.trim();
  const cacheKey = `${scopeKeys.join(",")}|${trimmed}`;

  if (stmtCache.has(cacheKey)) return stmtCache.get(cacheKey)!;

  let fn: (state: Record<string, any>, event?: Event) => any = () => {};
  try {
    fn = buildStmtFn(scopeKeys, trimmed);
  } catch {
    console.warn(`[reactive] Failed to compile statement: "${trimmed}"`);
  }

  stmtCache.set(cacheKey, fn);
  return fn;
}

/**
 * Execute a statement expression against state (for event handlers).
 */
export function execute(
  expr: string,
  state: Record<string, any>,
  event?: Event,
): void {
  try {
    const result = compileStatement(expr, Object.keys(state))(state, event);
    // If the expression evaluates to a function (like "@click=doSomething"), call it.
    if (typeof result === "function") {
      result(event);
    }
  } catch (e) {
    console.warn(`[reactive] Error executing statement "${expr}":`, e);
  }
}

/**
 * Parse a template string and extract all {{ expr }} interpolations.
 * Returns an empty array when there are no {{ }} tokens — callers should
 * check `.length` before doing further work.
 *
 * @example
 * parseInterpolations("Hello {{ name }}, you have {{ count }} items")
 * // → [{ type:"static", value:"Hello " }, { type:"expr", value:"name" }, ...]
 *
 * parseInterpolations("plain text") // → []
 */
export type InterpolationPart =
  | { type: "static"; value: string }
  | { type: "expr"; value: string };

export function parseInterpolations(template: string): InterpolationPart[] {
  // Fast-path: avoid regex overhead when there are no {{ tokens.
  if (!template.includes("{{")) return [];

  const parts: InterpolationPart[] = [];
  const regex = /\{\{\s*([\s\S]+?)\s*\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "static",
        value: template.slice(lastIndex, match.index),
      });
    }
    parts.push({ type: "expr", value: match[1].trim() });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < template.length) {
    parts.push({ type: "static", value: template.slice(lastIndex) });
  }

  return parts;
}

/**
 * Returns true if an expression can be evaluated without any state scope.
 * Used to identify constant expressions like {{ 4 + 4 }} or global-only
 * expressions like {{ Math.PI }} that should be processed immediately.
 */
export function isStaticExpression(expr: string): boolean {
  try {
    const fn = buildExprFn([], expr);
    fn({});
    return true;
  } catch {
    return false;
  }
}

/** Clear both expression caches (useful for testing). */
export function clearExpressionCache(): void {
  exprCache.clear();
  stmtCache.clear();
}
