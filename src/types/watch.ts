/**
 * Watch types
 */

import type { Reactive, Computed } from "./reactive";

export type WatchSource<T> = Reactive<T> | Computed<T> | (() => T);

export type WatchCallback<T> = (
  newValue: T,
  oldValue: T,
) => void | (() => void);

export interface WatchOptions {
  /** Run callback immediately with current value on setup */
  immediate?: boolean;
  /**
   * Deep watch — reserved for future use with deep object comparison.
   * Currently the reactivity system tracks dependencies automatically,
   * so this option has no effect on core watch() behavior.
   * It is accepted by useWatch() for API compatibility.
   */
  deep?: boolean;
}
