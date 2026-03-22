/**
 * Utility functions
 */

import { reactive, markRaw } from "./reactive";
import type { Reactive, Computed } from "../types";

/** Alias for reactive() — familiar to Vue users */
export function ref<T>(value: T): Reactive<T> {
  return reactive(value) as Reactive<T>;
}

/** Extract the raw value from a reactive primitive wrapper */
export function toRaw<T>(r: Reactive<T> | T): T {
  if (r && typeof r === "object" && "value" in r && "subscribe" in r) {
    return (r as Reactive<T>).value;
  }
  return r as T;
}

/**
 * Returns true if the value is a reactive primitive wrapper
 * (i.e. created by reactive() with a non-object value, or ref()).
 */
export function isReactive(value: unknown): value is Reactive<any> {
  return (
    value !== null &&
    typeof value === "object" &&
    "value" in (value as object) &&
    "subscribe" in (value as object) &&
    typeof (value as any).subscribe === "function"
  );
}

/**
 * Returns true if the value is a computed value.
 * Computed values have a readonly .value and a .subscribe method but no setter.
 */
export function isComputed(value: unknown): value is Computed<any> {
  if (!isReactive(value)) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, "value");
  // computed values have a getter but no setter on .value
  return !!descriptor?.get && !descriptor?.set;
}

/**
 * Shallow reactive — only top-level properties are tracked.
 * Nested objects are NOT wrapped in a Proxy.
 */
export function shallowReactive<T extends Record<string, any>>(obj: T): T {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== null && typeof val === "object") markRaw(val);
  }
  return reactive(obj) as T;
}

export { markRaw, isRaw } from "./reactive";
