/**
 * Binding Utilities
 */

import type { Reactive } from "../../types/reactive";
import type { BindingSource } from "../../types/binding";

export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

export function getValue<T>(source: BindingSource<T>): T {
  if (typeof source === "function") return (source as () => T)();
  return (source as Reactive<T>).value;
}

export function getElement(selector: string | Element): Element | null {
  if (typeof document === "undefined") return null;
  return typeof selector === "string"
    ? document.querySelector(selector)
    : selector;
}
