/**
 * Batch updates - coalesce multiple reactive changes into a single notification pass
 */

let isBatching = false;
const pending = new Set<() => void>();

export function batch<T>(fn: () => T): T {
  if (isBatching) {
    return fn();
  }

  isBatching = true;
  let result: T;
  try {
    result = fn();
  } finally {
    isBatching = false;
    const callbacks = Array.from(pending);
    pending.clear();
    callbacks.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error("Batch notification error:", e);
      }
    });
  }
  return result!;
}

/** Internal — used by reactive to schedule notifications */
export function scheduleNotification(callback: () => void): void {
  if (isBatching) pending.add(callback);
  else callback();
}

/** Returns true while inside a batch() call */
export function isBatchingUpdates(): boolean {
  return isBatching;
}
