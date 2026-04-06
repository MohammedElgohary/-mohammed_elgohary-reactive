/**
 * Attribute Binding
 */

import { effect } from "../effect";
import { getElement, getValue } from "./utils";
import {
  DANGEROUS_ATTRIBUTES,
  URL_ATTRIBUTES,
  logSecurityWarning,
  isValidUrl,
} from "../security";
import type { BindingSource } from "../../types/binding";

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
