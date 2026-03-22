/**
 * Async Computed Values - derived reactive values from async functions
 */

import type { Unsubscribe } from "../types";
import { effect } from "./effect";

export interface AsyncComputed<T> {
  /** Current resolved value (undefined while loading for the first time) */
  readonly value: T | undefined;
  /** True while the async function is running */
  readonly loading: boolean;
  /** Error thrown by the last async execution, or null */
  readonly error: unknown;
  /** Subscribe to state changes (loading, value, error) */
  subscribe(callback: () => void): Unsubscribe;
  /** Stop the async computed and clean up */
  dispose(): void;
}

export interface AsyncComputedOptions<T> {
  /** Initial value before the first resolution */
  initialValue?: T;
  /** Called when the async function throws */
  onError?: (error: unknown) => void;
}

/**
 * Creates a computed value from an async function.
 * Automatically re-runs when reactive dependencies accessed inside `fn` change.
 * Handles race conditions — only the latest run updates the state.
 *
 * Dependency tracking note: reactive reads that happen synchronously at the
 * start of `fn` are tracked. Reads inside `await` continuations are not —
 * extract those into variables before the first `await` if you need them tracked.
 *
 * @example
 * const userId = reactive({ id: 1 });
 *
 * const user = computedAsync(async () => {
 *   const id = userId.id; // read synchronously — tracked
 *   const res = await fetch(`/api/users/${id}`);
 *   return res.json();
 * }, { initialValue: null });
 */
export function computedAsync<T>(
  fn: () => Promise<T>,
  options: AsyncComputedOptions<T> = {},
): AsyncComputed<T> {
  let value: T | undefined = options.initialValue;
  let loading = false;
  let error: unknown = null;

  // Each run gets a unique token. We compare by reference so even
  // runId = Infinity (dispose) is handled correctly.
  let currentToken = {};

  const subscribers = new Set<() => void>();

  const notify = () => {
    subscribers.forEach((cb) => {
      try {
        cb();
      } catch {
        /* ignore subscriber errors */
      }
    });
  };

  const stopEffect = effect(() => {
    // Capture a fresh token for this run. Any previous in-flight run holds
    // a reference to the old token — when it resolves it will see the tokens
    // differ and discard the result.
    const token = (currentToken = {});

    loading = true;
    error = null;
    notify();

    // fn() is invoked here, inside the effect's synchronous tracking window.
    // Any reactive reads that happen synchronously at the top of fn() are
    // tracked as dependencies of this effect.
    fn().then(
      (result) => {
        if (token !== currentToken) return; // stale run — discard
        value = result;
        loading = false;
        notify();
      },
      (err) => {
        if (token !== currentToken) return; // stale run — discard
        error = err;
        loading = false;
        options.onError?.(err);
        notify();
      },
    );
  });

  return {
    get value() {
      return value;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },

    subscribe(callback: () => void): Unsubscribe {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },

    dispose() {
      // Rotate the token so any in-flight run is invalidated
      currentToken = {};
      stopEffect();
      subscribers.clear();
    },
  };
}
