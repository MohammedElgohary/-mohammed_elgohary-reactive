/**
 * Computed values - derived reactive values that update automatically
 */

import type { Computed, Unsubscribe } from "../types";
import {
  pushSubscriber,
  popSubscriber,
  getActiveSubscriber,
} from "./dependency";

export interface ComputedWithDispose<T> extends Computed<T> {
  dispose(): void;
}

export function computed<T>(fn: () => T): ComputedWithDispose<T> {
  let value: T;
  let isDirty = true;
  let isDisposed = false;
  const subscribers = new Set<() => void>();

  const markDirty = () => {
    if (isDirty) return;
    isDirty = true;
    subscribers.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error("Error in computed subscriber:", e);
      }
    });
  };

  const recompute = () => {
    pushSubscriber(markDirty);
    try {
      value = fn();
      isDirty = false;
    } catch (e) {
      console.error("Error computing value:", e);
      throw e;
    } finally {
      popSubscriber();
    }
  };

  return {
    get value(): T {
      if (isDisposed) return value;
      const active = getActiveSubscriber();
      if (active) subscribers.add(active);
      if (isDirty) recompute();
      return value;
    },

    subscribe(callback: () => void): Unsubscribe {
      // Eagerly evaluate to establish dependency tracking
      if (isDirty) recompute();
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },

    dispose() {
      isDisposed = true;
      subscribers.clear();
      // Mark dirty so if somehow accessed after dispose it won't return stale
      isDirty = true;
    },
  };
}
