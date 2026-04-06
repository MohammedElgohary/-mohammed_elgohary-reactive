/**
 * Core Reactivity Logic
 */

import { getActiveSubscriber } from "../dependency";
import { scheduleNotification } from "../batch";

export const RAW_SYMBOL = Symbol("raw");
export const reactiveObjects = new WeakMap<object, object>();

export function toRaw<T>(observed: T): T {
  const raw = observed && (observed as any)[RAW_SYMBOL];
  return raw ? toRaw(raw) : observed;
}

// Objects marked as non-reactive via markRaw()
export const rawMarkers = new WeakSet<object>();

export function markRaw<T extends object>(obj: T): T {
  rawMarkers.add(obj);
  return obj;
}

export function isRaw(obj: object): boolean {
  return rawMarkers.has(obj);
}

export function track(subscribers: Set<() => void>): void {
  const active = getActiveSubscriber();
  if (active) subscribers.add(active);
}

export function notify(
  subscribers: Set<() => void> | undefined,
  notifyParent?: () => void,
): void {
  if (subscribers) {
    // snapshot to avoid mutation during iteration
    const copy = Array.from(subscribers);
    copy.forEach((cb) => scheduleNotification(cb));
  }
  if (notifyParent) scheduleNotification(notifyParent);
}
