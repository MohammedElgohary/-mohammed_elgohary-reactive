/**
 * Watch - observe reactive values for changes with old/new value tracking
 */

import type {
  Unsubscribe,
  WatchSource,
  WatchCallback,
  WatchOptions,
} from "../types";
import { effect } from "./effect";

// ── Internal single-source watcher ───────────────────────────────────────────

function watchSingle<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options: WatchOptions = {},
): Unsubscribe {
  let oldValue: T;
  let isFirst = true;

  return effect(() => {
    const newValue =
      typeof source === "function" ? source() : (source as any).value;

    if (isFirst) {
      oldValue = newValue;
      isFirst = false;
      if (options.immediate) {
        const cleanup = callback(newValue, newValue);
        if (typeof cleanup === "function") return cleanup;
      }
      return;
    }

    if (!Object.is(oldValue, newValue)) {
      const cleanup = callback(newValue, oldValue);
      oldValue = newValue;
      if (typeof cleanup === "function") return cleanup;
    }
  });
}

// ── Internal multi-source watcher ────────────────────────────────────────────

function watchMany<T extends Array<WatchSource<any>>>(
  sources: T,
  callback: (
    newVals: { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
    oldVals: { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
  ) => void | (() => void),
  options: WatchOptions = {},
): Unsubscribe {
  let oldValues: any[];
  let isFirst = true;

  return effect(() => {
    const newValues = sources.map((s) =>
      typeof s === "function" ? s() : (s as any).value,
    );

    if (isFirst) {
      oldValues = [...newValues];
      isFirst = false;
      if (options.immediate) {
        const cleanup = callback(newValues as any, [...oldValues] as any);
        if (typeof cleanup === "function") return cleanup;
      }
      return;
    }

    if (newValues.some((v, i) => !Object.is(v, oldValues[i]))) {
      const prev = [...oldValues];
      oldValues = [...newValues];
      const cleanup = callback(newValues as any, prev as any);
      if (typeof cleanup === "function") return cleanup;
    }
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Watch a reactive source for changes.
 *
 * Three forms:
 *   watch(source, callback, options?)           — single source or getter
 *   watch([s1, s2, ...], callback, options?)    — multiple sources
 *   watch(obj, "key", callback, options?)       — object property shorthand
 */
export function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions,
): Unsubscribe;
export function watch<T extends Array<WatchSource<any>>>(
  sources: T,
  callback: (
    newVals: { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
    oldVals: { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
  ) => void | (() => void),
  options?: WatchOptions,
): Unsubscribe;
export function watch<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  key: K,
  callback: (newValue: T[K], oldValue: T[K]) => void | (() => void),
  options?: WatchOptions,
): Unsubscribe;
export function watch(
  source: any,
  callbackOrKey: any,
  optionsOrCallback?: any,
  maybeOptions?: WatchOptions,
): Unsubscribe {
  // watch(obj, "key", callback, options?)
  if (typeof callbackOrKey === "string") {
    return watchSingle(
      () => source[callbackOrKey],
      optionsOrCallback,
      maybeOptions ?? {},
    );
  }

  // watch([sources], callback, options?)
  if (Array.isArray(source)) {
    return watchMany(source, callbackOrKey, optionsOrCallback ?? {});
  }

  // watch(source, callback, options?)
  return watchSingle(source, callbackOrKey, optionsOrCallback ?? {});
}

// ── Backward-compatible aliases ───────────────────────────────────────────────

export function watchMultiple<T extends Array<WatchSource<any>>>(
  sources: T,
  callback: (
    newVals: { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
    oldVals: { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
  ) => void | (() => void),
  options: WatchOptions = {},
): Unsubscribe {
  return watchMany(sources, callback, options);
}

export function watchProperty<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  key: K,
  callback: (newValue: T[K], oldValue: T[K]) => void | (() => void),
  options: WatchOptions = {},
): Unsubscribe {
  return watchSingle(() => obj[key], callback, options);
}
