/**
 * Reactive - unified function for all JavaScript data types
 */

import type { Reactive } from "../types";
import { markReactiveProxy } from "./registry";
import { scheduleAutoMount } from "./parser";
import { makeReactive } from "./reactivity/handlers";
import { createReactivePrimitive } from "./reactivity/primitive";

export { markRaw, isRaw, toRaw } from "./reactivity/core";

// ============================================================================
// Public API
// ============================================================================

export function reactive<T>(
  initialValue: T,
): T extends object ? T : Reactive<T> {
  let result: any;

  if (initialValue === null) result = createReactivePrimitive(initialValue);
  else if (typeof initialValue === "object")
    result = makeReactive(initialValue);
  else result = createReactivePrimitive(initialValue);

  if (typeof initialValue === "object" && initialValue !== null) {
    markReactiveProxy(result);
  }

  scheduleAutoMount();

  return result;
}
