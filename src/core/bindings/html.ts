/**
 * HTML Binding
 */

import { effect } from "../effect";
import type { BindingSource, BindingOptions } from "../../types/binding";
import { getElement, getValue } from "./utils";
import { sanitizeHtml } from "../security";

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
