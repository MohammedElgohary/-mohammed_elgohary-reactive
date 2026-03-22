/**
 * Debug utilities for development
 */

import type { Reactive, Computed } from "../types";

let debugEnabled = false;
// Use Map instead of WeakMap to allow iteration
const trackedReactive = new Map<Reactive<any> | Computed<any>, {
  type: "reactive" | "computed";
  subscribers: number;
  value: any;
  history: Array<{ value: any; timestamp: number }>;
  originalSubscribe?: (callback: () => void) => () => void;
}>();

/**
 * Enable or disable debug mode
 */
export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return debugEnabled;
}

/**
 * Track a reactive value for debugging
 */
export function trackReactive<T>(
  reactive: Reactive<T> | Computed<T>,
  type: "reactive" | "computed" = "reactive"
): void {
  if (!debugEnabled) return;

  // Don't track if already tracked
  if (trackedReactive.has(reactive)) {
    console.warn("Reactive value is already being tracked.");
    return;
  }

  const info = {
    type,
    subscribers: 0,
    value: reactive.value,
    history: [{ value: reactive.value, timestamp: Date.now() }],
    originalSubscribe: reactive.subscribe.bind(reactive),
  };

  trackedReactive.set(reactive, info);

  // Track subscriber count
  const originalSubscribe = reactive.subscribe;
  reactive.subscribe = function (callback: () => void) {
    info.subscribers++;
    const unsubscribe = originalSubscribe.call(this, callback);
    return () => {
      info.subscribers--;
      unsubscribe();
    };
  };

  // Track value changes for reactive values (not computed)
  if (type === "reactive" && "value" in reactive) {
    const descriptor = Object.getOwnPropertyDescriptor(reactive, "value");
    if (descriptor && typeof descriptor.set === "function") {
      const originalSetter = descriptor.set;
      Object.defineProperty(reactive, "value", {
        get: descriptor.get,
        set: (newValue: T) => {
          const oldValue = info.value;
          originalSetter.call(reactive, newValue);
          info.value = newValue;
          info.history.push({ value: newValue, timestamp: Date.now() });
          if (info.history.length > 100) {
            info.history.shift(); // Keep only last 100 changes
          }
        },
        configurable: true,
        enumerable: descriptor.enumerable,
      });
    }
  }
}

/**
 * Get debug info for a reactive value
 */
export function getDebugInfo<T>(
  reactive: Reactive<T> | Computed<T>
): {
  type: "reactive" | "computed";
  subscribers: number;
  value: T;
  history: Array<{ value: T; timestamp: number }>;
} | null {
  if (!debugEnabled) {
    console.warn("Debug mode is not enabled. Call setDebug(true) first.");
    return null;
  }

  return trackedReactive.get(reactive) || null;
}

/**
 * Log all tracked reactive values
 */
export function logTrackedReactive(): void {
  if (!debugEnabled) {
    console.warn("Debug mode is not enabled. Call setDebug(true) first.");
    return;
  }

  if (trackedReactive.size === 0) {
    console.log("No reactive values are currently being tracked.");
    return;
  }

  console.group("🔍 Tracked Reactive Values");
  trackedReactive.forEach((info, reactive) => {
    console.group(`${info.type} (${info.subscribers} subscribers)`);
    console.log("Current value:", info.value);
    console.log("Change history:", info.history);
    console.log("Reactive object:", reactive);
    console.groupEnd();
  });
  console.groupEnd();
}

/**
 * Clear debug tracking
 */
export function clearDebugTracking(): void {
  trackedReactive.clear();
}
