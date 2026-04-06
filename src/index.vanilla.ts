/**
 * Reactive — Vanilla JS / Browser build
 */

import * as ReactiveCore from "./core";

// Manually attach to global scope for browser compatibility
if (typeof window !== "undefined") {
  (window as any).Reactive = (window as any).Reactive || {};
  Object.assign((window as any).Reactive, ReactiveCore);
}

export * from "./core";

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
  InputOptions,
  SecurityConfig,
  MultiBinding,
} from "./types";

export type { ComputedWithDispose } from "./core/computed";
export type { AsyncComputed, AsyncComputedOptions } from "./core/computedAsync";
