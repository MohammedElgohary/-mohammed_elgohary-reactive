/**
 * Primitive Reactivity
 */

import { track, notify } from "./core";
import type { Reactive, Unsubscribe } from "../../types";

export function createReactivePrimitive<T>(initialValue: T): Reactive<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  return {
    get value(): T {
      track(subscribers);
      return value;
    },
    set value(newValue: T) {
      if (!Object.is(value, newValue)) {
        value = newValue;
        notify(subscribers);
      }
    },
    subscribe(callback: () => void): Unsubscribe {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
}
