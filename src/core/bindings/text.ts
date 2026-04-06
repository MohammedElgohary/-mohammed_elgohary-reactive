/**
 * Text Binding
 */

import { effect } from "../effect";
import type { BindingSource } from "../../types/binding";
import { getElement, getValue } from "./utils";

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
