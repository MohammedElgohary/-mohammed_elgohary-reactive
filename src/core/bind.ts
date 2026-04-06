/**
 * Reactive DOM Binding
 */

import type {
  BindingSource,
  BindingOptions,
  MultiBinding,
} from "../types/binding";
import {
  bindText,
  bindHTML,
  bindAttr,
  bindProp,
  bindClass,
  bindStyle,
  bindStyles,
} from "./bindings";

export * from "./bindings";
export {
  configureReactiveSecurity,
  sanitizeHtml as sanitizeHtmlContent,
  isValidUrl as isUrlSafe,
  escapeHtmlEntities,
} from "./security";

// ============================================================================
// Multiple Bindings
// ============================================================================

export function bindMultiple(bindings: MultiBinding[]): () => void {
  const stops = bindings.map((b) => {
    switch (b.type) {
      case "text":
        return bindText(b.selector, b.source);
      case "html":
        return bindHTML(b.selector, b.source);
      case "attr":
        return bindAttr(b.selector, b.target!, b.source);
      case "prop":
        return bindProp(b.selector, b.target!, b.source);
      case "class":
        return bindClass(b.selector, b.target!, b.source);
      case "style":
        return bindStyle(b.selector, b.target!, b.source);
      case "styles":
        return bindStyles(b.selector, b.source);
      default:
        return () => {};
    }
  });
  return () => stops.forEach((s) => s());
}

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
