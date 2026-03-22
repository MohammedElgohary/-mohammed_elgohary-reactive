/**
 * Core reactive types
 */

export interface Reactive<T> {
  value: T;
  subscribe(callback: () => void): () => void;
}

export interface Computed<T> {
  readonly value: T;
  subscribe(callback: () => void): () => void;
}

export type EffectCleanup = () => void;
export type EffectFn = () => unknown;
export type Unsubscribe = () => void;

export interface EffectOptions {
  /** Called when the effect throws an error instead of logging to console */
  onError?: (error: unknown) => void;
}
