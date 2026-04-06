/**
 * Property and Class Binding
 */

import { effect } from "../effect";
import { getElement, getValue } from "./utils";
import { DANGEROUS_PROPERTIES } from "../security";
import type { BindingSource } from "../../types/binding";

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
