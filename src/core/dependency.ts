/**
 * Dependency tracking system
 *
 * Uses a stack for correct nested effect/computed handling.
 */

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
