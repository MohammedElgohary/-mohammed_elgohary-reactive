/**
 * Dependency tracking system
 *
 * Uses a stack for correct nested effect/computed handling.
 * Also exports the legacy get/set API that tests depend on.
 */

import type { Computed } from "../types";

// Stack-based tracking — top of stack is the active subscriber
const effectStack: Array<() => void> = [];

export function getActiveSubscriber(): (() => void) | null {
  return effectStack.length > 0 ? effectStack[effectStack.length - 1] : null;
}

export function pushSubscriber(fn: () => void): void {
  effectStack.push(fn);
}

export function popSubscriber(): void {
  effectStack.pop();
}

// ── Legacy API (kept for backward compatibility with existing tests) ──────────

let _activeEffect: (() => void) | null = null;
let _activeComputed: Computed<any> | null = null;

export function getActiveEffect(): (() => void) | null {
  return _activeEffect;
}

export function setActiveEffect(fn: (() => void) | null): void {
  _activeEffect = fn;
}

export function getActiveComputed<T = any>(): Computed<T> | null {
  return _activeComputed as Computed<T> | null;
}

export function setActiveComputed<T = any>(c: Computed<T> | null): void {
  _activeComputed = c;
}
