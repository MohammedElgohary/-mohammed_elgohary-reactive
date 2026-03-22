/**
 * Reactive - Minimal Build
 * Core reactivity without debug tools and advanced DOM bindings
 */

// Core reactive primitives only
export { reactive } from "./core/reactive";
export { computed } from "./core/computed";
export { effect } from "./core/effect";
export { batch, isBatchingUpdates } from "./core/batch";
export { readonly } from "./core/readonly";
export { watch } from "./core/watch";
export {
  ref,
  toRaw,
  markRaw,
  isRaw,
  isReactive,
  isComputed,
} from "./core/utils";

// Basic DOM bindings only
export {
  bindText,
  bindHTML,
  bindAttr,
  bindClass,
  bindStyle,
  render,
} from "./core/bind";

// Types
export type {
  Reactive,
  Computed,
  EffectFn,
  EffectCleanup,
  EffectOptions,
  Unsubscribe,
  WatchSource,
  WatchCallback,
  WatchOptions,
  BindingSource,
  BindingOptions,
} from "./types";
export type { ComputedWithDispose } from "./core/computed";
