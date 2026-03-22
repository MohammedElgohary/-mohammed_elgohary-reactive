/**
 * Reactive DOM Binding
 */

import { effect } from "./effect";
import type { Reactive } from "../types/reactive";
import type {
  BindingSource,
  BindingOptions,
  SecurityConfig,
} from "../types/binding";

// ============================================================================
// Security
// ============================================================================

let SECURITY_CONFIG: SecurityConfig = {
  logWarnings: true,
  throwOnViolation: false,
};

export function configureReactiveSecurity(options: {
  logWarnings?: boolean;
  throwOnViolation?: boolean;
}) {
  SECURITY_CONFIG = { ...SECURITY_CONFIG, ...options };
}

const DANGEROUS_ATTRIBUTES = new Set([
  "formaction",
  "xlink:href",
  "data",
  "srcdoc",
]);

const DANGEROUS_PROPERTIES = new Set([
  "innerHTML",
  "outerHTML",
  "insertAdjacentHTML",
  "srcdoc",
]);

const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "action",
  "formaction",
  "poster",
]);

function logSecurityWarning(message: string) {
  if (SECURITY_CONFIG.logWarnings)
    console.warn(`🔒 Reactive Security: ${message}`);
  if (SECURITY_CONFIG.throwOnViolation)
    throw new Error(`Security violation: ${message}`);
}

function isValidUrl(url: string): boolean {
  const t = url.trim().toLowerCase();
  return (
    !t.startsWith("javascript:") &&
    !t.startsWith("vbscript:") &&
    !t.startsWith("data:text/html")
  );
}

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return str.replace(/[&<>"'`=/]/g, (c) => map[c]);
}

function sanitizeHtml(html: string): string {
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(
      /<(iframe|object|embed|form|base|link|meta|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(
      /<(iframe|object|embed|form|base|link|meta|style)\b[^>]*\/?>/gi,
      "",
    );

  if (typeof DOMParser === "undefined") return clean;

  const doc = new DOMParser().parseFromString(clean, "text/html");
  doc
    .querySelectorAll("script,iframe,object,embed,form,base,link,meta,style")
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || DANGEROUS_ATTRIBUTES.has(name)) {
        el.removeAttribute(attr.name);
      } else if (URL_ATTRIBUTES.has(name) && !isValidUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body?.innerHTML ?? clean;
}

// ============================================================================
// Helpers
// ============================================================================

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function getValue<T>(source: BindingSource<T>): T {
  if (typeof source === "function") return (source as () => T)();
  return (source as Reactive<T>).value;
}

function getElement(selector: string | Element): Element | null {
  if (typeof document === "undefined") return null;
  return typeof selector === "string"
    ? document.querySelector(selector)
    : selector;
}

// ============================================================================
// Core binding functions
// ============================================================================

export function bindText<T>(
  selector: string | Element,
  source: BindingSource<T>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }
  return effect(() => {
    el.textContent = String(getValue(source) ?? "");
  });
}

export function bindHTML<T>(
  selector: string | Element,
  source: BindingSource<T>,
  options: BindingOptions = {},
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }
  return effect(() => {
    const html = String(getValue(source) ?? "");
    if (options.trusted) {
      if (
        /<script/i.test(html) ||
        /javascript:/i.test(html) ||
        /onerror\s*=/i.test(html)
      ) {
        console.warn(
          "🔒 Reactive Security: Trusted content contains potentially dangerous HTML",
        );
      }
      el.innerHTML = html;
    } else {
      el.innerHTML = sanitizeHtml(html);
    }
  });
}

export function bindAttr<T>(
  selector: string | Element,
  attribute: string,
  source: BindingSource<T>,
  options: {
    allowDangerousAttributes?: boolean;
    allowDangerousUrls?: boolean;
  } = {},
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }

  const attrLower = attribute.toLowerCase();
  if (
    !options.allowDangerousAttributes &&
    (attrLower.startsWith("on") || DANGEROUS_ATTRIBUTES.has(attrLower))
  ) {
    logSecurityWarning(`Cannot bind to dangerous attribute "${attribute}".`);
    return () => {};
  }

  return effect(() => {
    const value = getValue(source);
    if (value == null || value === false) {
      el.removeAttribute(attribute);
    } else {
      const str = String(value);
      if (
        !options.allowDangerousUrls &&
        URL_ATTRIBUTES.has(attrLower) &&
        !isValidUrl(str)
      ) {
        logSecurityWarning(`Invalid URL blocked for "${attribute}": ${str}`);
        return;
      }
      el.setAttribute(attribute, str);
    }
  });
}

export function bindProp<T>(
  selector: string | Element,
  property: string,
  source: BindingSource<T>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }

  if (DANGEROUS_PROPERTIES.has(property)) {
    console.error(
      `Security: Cannot bind to dangerous property "${property}". Use bindHTML() instead.`,
    );
    return () => {};
  }

  return effect(() => {
    (el as any)[property] = getValue(source);
  });
}

export function bindClass(
  selector: string | Element,
  className: string,
  condition: BindingSource<boolean>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }
  return effect(() => {
    getValue(condition)
      ? el.classList.add(className)
      : el.classList.remove(className);
  });
}

export function bindStyle<T>(
  selector: string | Element,
  property: string,
  source: BindingSource<T>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }
  return effect(() => {
    (el as HTMLElement).style.setProperty(
      property,
      String(getValue(source) ?? ""),
    );
  });
}

export function bindStyles(
  selector: string | Element,
  styles:
    | Record<string, BindingSource<any>>
    | BindingSource<Record<string, any>>
    | Reactive<Record<string, any>>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }

  if (
    typeof styles === "function" ||
    ("value" in styles && typeof (styles as any).value === "object") ||
    ("subscribe" in styles && typeof (styles as any).subscribe === "function")
  ) {
    return effect(() => {
      const obj = getValue(styles as BindingSource<Record<string, any>>);
      if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([prop, val]) => {
          (el as HTMLElement).style.setProperty(
            camelToKebab(prop),
            String(val ?? ""),
          );
        });
      }
    });
  }

  // Detect reactive object passed directly (e.g. reactive({ color: "red" }))
  // — values are primitives, not BindingSources
  const firstVal = Object.values(styles as Record<string, any>)[0];
  if (
    firstVal !== undefined &&
    typeof firstVal !== "function" &&
    (typeof firstVal !== "object" || firstVal === null)
  ) {
    return effect(() => {
      Object.entries(styles as Record<string, any>).forEach(([prop, val]) => {
        (el as HTMLElement).style.setProperty(
          camelToKebab(prop),
          String(val ?? ""),
        );
      });
    });
  }

  const stops = Object.entries(
    styles as Record<string, BindingSource<any>>,
  ).map(([prop, src]) =>
    effect(() => {
      (el as HTMLElement).style.setProperty(
        camelToKebab(prop),
        String(getValue(src) ?? ""),
      );
    }),
  );
  return () => stops.forEach((s) => s());
}

export function render(
  selector: string | Element,
  template: () => string,
  options: BindingOptions = {},
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }
  return effect(() => {
    const html = template();
    el.innerHTML = options.trusted ? html : sanitizeHtml(html);
  });
}

export function bindInput<
  T extends string | number | boolean | Date | FileList | string[],
>(selector: string | Element, source: Reactive<T>): () => void;
export function bindInput<T extends Record<string, any>, K extends keyof T>(
  selector: string | Element,
  obj: T,
  key: K,
): () => void;
export function bindInput(
  selector: string | Element,
  sourceOrObj: any,
  key?: any,
): () => void {
  // Overload: bindInput(el, obj, key) — wrap obj[key] as a reactive-like source
  if (key !== undefined) {
    const proxy: Reactive<any> = {
      get value() {
        return sourceOrObj[key];
      },
      set value(v: any) {
        sourceOrObj[key] = v;
      },
      subscribe(cb: () => void) {
        return effect(() => {
          void sourceOrObj[key];
          cb();
        });
      },
    };
    return bindInputCore(selector, proxy);
  }
  return bindInputCore(selector, sourceOrObj);
}

function bindInputCore<
  T extends string | number | boolean | Date | FileList | string[],
>(selector: string | Element, source: Reactive<T>): () => void {
  const el = getElement(selector);
  if (
    !el ||
    !(
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    )
  ) {
    console.warn(`Input element not found: ${selector}`);
    return () => {};
  }

  const isInput = el instanceof HTMLInputElement;
  const inputType = isInput ? el.type.toLowerCase() : "";
  const isCheckbox = inputType === "checkbox";
  const isSelect = el instanceof HTMLSelectElement;
  const eventType = inputType === "file" ? "change" : "input";

  const stopEffect = effect(() => {
    // source may be a primitive reactive ({ value }), a reactive array, or a reactive Date proxy
    const raw = Array.isArray(source)
      ? source
      : source instanceof Date
        ? source
        : source.value;
    // Convert Date to the appropriate string format for the input type
    let value: any = raw;
    if (raw instanceof Date) {
      if (inputType === "date") {
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, "0");
        const d = String(raw.getDate()).padStart(2, "0");
        value = `${y}-${m}-${d}`;
      } else if (inputType === "datetime-local") {
        const y = raw.getFullYear();
        const mo = String(raw.getMonth() + 1).padStart(2, "0");
        const d = String(raw.getDate()).padStart(2, "0");
        const h = String(raw.getHours()).padStart(2, "0");
        const mi = String(raw.getMinutes()).padStart(2, "0");
        value = `${y}-${mo}-${d}T${h}:${mi}`;
      } else if (inputType === "month") {
        const y = raw.getFullYear();
        const m = String(raw.getMonth() + 1).padStart(2, "0");
        value = `${y}-${m}`;
      } else if (inputType === "time") {
        const h = String(raw.getHours()).padStart(2, "0");
        const m = String(raw.getMinutes()).padStart(2, "0");
        value = `${h}:${m}`;
      } else if (inputType === "week") {
        // ISO week: YYYY-Www (local time)
        const d = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
        const dayNum = d.getDay() || 7;
        d.setDate(d.getDate() + 4 - dayNum);
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
        );
        value = `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
      } else {
        value = raw.toISOString();
      }
    }
    if (el instanceof HTMLSelectElement) {
      if (el.multiple && Array.isArray(value)) {
        Array.from(el.options).forEach((opt) => {
          opt.selected = (value as string[]).includes(opt.value);
        });
      } else {
        el.value = String(value ?? "");
      }
    } else if (el instanceof HTMLTextAreaElement) {
      el.value = String(value ?? "");
    } else if (isInput) {
      if (inputType === "checkbox") el.checked = Boolean(value);
      else if (inputType === "radio") el.checked = el.value === String(value);
      else if (inputType === "file") {
        /* read-only */
      } else el.value = String(value ?? "");
    }
  });

  const handleInput = (e: Event) => {
    const t = e.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    if (t instanceof HTMLSelectElement) {
      const newVal = t.multiple
        ? Array.from(t.selectedOptions).map((o) => o.value)
        : t.value;
      if (Array.isArray(source)) {
        // reactive array — splice in place AND expose via .value for compatibility
        (source as any).splice(0, (source as any).length, ...newVal);
        (source as any).value = newVal;
      } else {
        (source as Reactive<any>).value = newVal;
      }
    } else if (t instanceof HTMLTextAreaElement) {
      (source as Reactive<any>).value = t.value;
    } else if (t instanceof HTMLInputElement) {
      const type = t.type.toLowerCase();
      if (type === "checkbox") (source as Reactive<any>).value = t.checked;
      else if (type === "radio") {
        if (t.checked) (source as Reactive<any>).value = t.value;
      } else if (type === "file") {
        if (t.files) (source as Reactive<any>).value = t.files;
      } else if (type === "number" || type === "range") {
        (source as Reactive<any>).value = isNaN(t.valueAsNumber)
          ? 0
          : t.valueAsNumber;
      } else {
        (source as Reactive<any>).value = t.value;
      }
    }
  };

  el.addEventListener(eventType, handleInput);
  if (inputType === "radio") el.addEventListener("change", handleInput);
  if (isCheckbox || isSelect) el.addEventListener("change", handleInput);

  return () => {
    stopEffect();
    el.removeEventListener(eventType, handleInput);
    if (inputType === "radio") el.removeEventListener("change", handleInput);
    if (isCheckbox || isSelect) el.removeEventListener("change", handleInput);
  };
}

export function bindMultiple(
  bindings: Array<{
    selector: string | Element;
    type: "text" | "html" | "attr" | "prop" | "class" | "style" | "styles";
    target: string;
    source: BindingSource<any>;
  }>,
): () => void {
  const stops = bindings.map((b) => {
    switch (b.type) {
      case "text":
        return bindText(b.selector, b.source);
      case "html":
        return bindHTML(b.selector, b.source);
      case "attr":
        return bindAttr(b.selector, b.target, b.source);
      case "prop":
        return bindProp(b.selector, b.target, b.source);
      case "class":
        return bindClass(
          b.selector,
          b.target,
          b.source as BindingSource<boolean>,
        );
      case "style":
        return bindStyle(b.selector, b.target, b.source);
      case "styles":
        return bindStyles(b.selector, b.source);
      default:
        return () => {};
    }
  });
  return () => stops.forEach((s) => s());
}

// ============================================================================
// Security utilities (public)
// ============================================================================

export { escapeHtml as escapeHtmlEntities };
export { sanitizeHtml as sanitizeHtmlContent };
export { isValidUrl as isUrlSafe };

// ============================================================================
// Unified bind function
// ============================================================================

/**
 * Unified bind — auto-detects binding type from arguments.
 *
 * bind(el, source)                  → text or HTML (auto-detected by content)
 * bind(el, source, { trusted })     → HTML with trusted flag
 * bind(el, "class:name", source)    → class binding
 * bind(el, "style:prop", source)    → style binding
 * bind(el, "styles", source)        → multiple styles
 * bind(el, "prop:name", source)     → property binding
 * bind(el, "attrName", source)      → attribute binding
 * bind(el)                          → no-op, returns empty cleanup
 */
export function bind(selector: string | Element, ...args: any[]): () => void {
  if (args.length === 0) {
    console.warn("bind() called with no source");
    return () => {};
  }

  // bind(el, source) or bind(el, source, options)
  if (args.length === 1 || (args.length === 2 && typeof args[0] !== "string")) {
    const source = args[0] as BindingSource<any>;
    const options: BindingOptions = args[1] ?? {};
    // Peek at the current value to decide text vs HTML
    const testVal =
      typeof source === "function" ? source() : (source as any).value;
    const isHtml = typeof testVal === "string" && /<[^>]+>/.test(testVal);
    return isHtml
      ? bindHTML(selector, source, options)
      : bindText(selector, source);
  }

  // bind(el, "qualifier", source, options?)
  const qualifier = args[0] as string;
  const source = args[1] as BindingSource<any>;
  const options = args[2] ?? {};

  if (qualifier.startsWith("class:"))
    return bindClass(selector, qualifier.slice(6), source);
  if (qualifier.startsWith("style:"))
    return bindStyle(selector, qualifier.slice(6), source);
  if (qualifier === "styles") return bindStyles(selector, source);
  if (qualifier.startsWith("prop:"))
    return bindProp(selector, qualifier.slice(5), source);

  // Default: attribute binding
  return bindAttr(selector, qualifier, source, options);
}
