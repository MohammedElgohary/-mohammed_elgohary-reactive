/**
 * Readonly reactive wrappers
 */

import type { Reactive, Computed } from "../types";

export function readonly<T>(
  source: Reactive<T> | Computed<T>,
): Computed<T> & { value: T } {
  return {
    get value(): T {
      return source.value;
    },
    set value(_: T) {
      console.warn("Cannot assign to a readonly reactive value.");
    },
    subscribe: source.subscribe.bind(source),
  };
}

/**
 * Creates a Proxy that throws on any set or delete attempt (strict readonly object).
 * Reflects reads through to the original reactive object so changes are visible.
 */
export function readonlyObject<T extends Record<string, any>>(
  obj: T,
): Readonly<T> {
  return new Proxy(obj, {
    get(target, key) {
      return Reflect.get(target, key);
    },
    set() {
      throw new TypeError(
        "Cannot assign to read only property of a readonly object",
      );
    },
    deleteProperty() {
      throw new TypeError("Cannot delete property of a readonly object");
    },
  }) as Readonly<T>;
}
