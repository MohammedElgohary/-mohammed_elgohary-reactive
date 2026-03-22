/**
 * Reactive - unified function for all JavaScript data types
 */

import type { Reactive, Unsubscribe } from "../types";
import { getActiveSubscriber } from "./dependency";
import { scheduleNotification } from "./batch";

// Cache to avoid double-wrapping the same object
const reactiveObjects = new WeakMap<object, object>();

// Objects marked as non-reactive via markRaw()
const rawMarkers = new WeakSet<object>();

export function markRaw<T extends object>(obj: T): T {
  rawMarkers.add(obj);
  return obj;
}

export function isRaw(obj: object): boolean {
  return rawMarkers.has(obj);
}

// ============================================================================
// Internal helpers
// ============================================================================

function track(subscribers: Set<() => void>): void {
  const active = getActiveSubscriber();
  if (active) subscribers.add(active);
}

function notify(subscribers: Set<() => void>, notifyParent?: () => void): void {
  // snapshot to avoid mutation during iteration
  const copy = Array.from(subscribers);
  copy.forEach((cb) => scheduleNotification(cb));
  if (notifyParent) scheduleNotification(notifyParent);
}

function makeReactive<T>(value: T, notifyParent?: () => void): T {
  if (value === null || typeof value !== "object") return value;
  if (rawMarkers.has(value as object)) return value;
  if (
    value instanceof Promise ||
    value instanceof WeakMap ||
    value instanceof WeakSet
  )
    return value;

  if (Array.isArray(value))
    return createReactiveArray(value, notifyParent) as any;
  if (value instanceof Map)
    return createReactiveMap(value, notifyParent) as any;
  if (value instanceof Set)
    return createReactiveSet(value, notifyParent) as any;
  if (value instanceof Date)
    return createReactiveDate(value, notifyParent) as any;
  if (value instanceof RegExp)
    return createReactiveRegExp(value, notifyParent) as any;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    return createReactiveTypedArray(value as any, notifyParent) as any;
  }

  return createReactiveObject(value as any, notifyParent) as any;
}

// ============================================================================
// Array
// ============================================================================

const ARRAY_MUTATING_METHODS = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
];

function createReactiveArray<T extends any[]>(
  arr: T,
  notifyParent?: () => void,
): T {
  if (reactiveObjects.has(arr)) return reactiveObjects.get(arr) as T;

  const subscribers = new Set<() => void>();
  const notifySubs = () => notify(subscribers, notifyParent);

  const proxy = new Proxy(arr, {
    get(target, key) {
      track(subscribers);
      const value = Reflect.get(target, key);

      if (
        typeof key === "string" &&
        ARRAY_MUTATING_METHODS.includes(key) &&
        typeof value === "function"
      ) {
        return function (...args: any[]) {
          const result = value.apply(target, args);
          notifySubs();
          return result;
        };
      }

      if (
        typeof key !== "symbol" &&
        value !== null &&
        typeof value === "object"
      ) {
        return makeReactive(value, notifySubs);
      }

      return value;
    },

    set(target, key, value) {
      const old = Reflect.get(target, key);
      if (!Object.is(old, value)) {
        Reflect.set(target, key, value);
        notifySubs();
      }
      return true;
    },

    deleteProperty(target, key) {
      const had = Reflect.has(target, key);
      if (had) {
        Reflect.deleteProperty(target, key);
        notifySubs();
      }
      return had;
    },
  });

  reactiveObjects.set(arr, proxy);
  return proxy as T;
}

// ============================================================================
// Map
// ============================================================================

const MAP_MUTATING_METHODS = ["set", "delete", "clear"];

function createReactiveMap<K, V>(
  map: Map<K, V>,
  notifyParent?: () => void,
): Map<K, V> {
  if (reactiveObjects.has(map)) return reactiveObjects.get(map) as Map<K, V>;

  const subscribers = new Set<() => void>();
  const notifySubs = () => notify(subscribers, notifyParent);

  const proxy = new Proxy(map, {
    get(target, key) {
      track(subscribers);
      const value = Reflect.get(target, key);

      if (typeof value !== "function") return value;

      if (typeof key === "string" && MAP_MUTATING_METHODS.includes(key)) {
        return function (...args: any[]) {
          const result = value.apply(target, args);
          notifySubs();
          return result;
        };
      }

      if (key === "get") {
        return (k: K) => {
          const result = target.get(k);
          return result !== null && typeof result === "object"
            ? makeReactive(result, notifySubs)
            : result;
        };
      }

      if (key === "forEach") {
        return (cb: (v: V, k: K, m: Map<K, V>) => void, thisArg?: any) => {
          target.forEach((v, k) => {
            const rv =
              v !== null && typeof v === "object"
                ? makeReactive(v, notifySubs)
                : v;
            cb.call(thisArg, rv as V, k, proxy);
          });
        };
      }

      return value.bind(target);
    },
  });

  reactiveObjects.set(map, proxy);
  return proxy;
}

// ============================================================================
// Set
// ============================================================================

const SET_MUTATING_METHODS = ["add", "delete", "clear"];

function createReactiveSet<T>(set: Set<T>, notifyParent?: () => void): Set<T> {
  if (reactiveObjects.has(set)) return reactiveObjects.get(set) as Set<T>;

  const subscribers = new Set<() => void>();
  const notifySubs = () => notify(subscribers, notifyParent);

  const proxy = new Proxy(set, {
    get(target, key) {
      track(subscribers);
      const value = Reflect.get(target, key);

      if (typeof value !== "function") return value;

      if (typeof key === "string" && SET_MUTATING_METHODS.includes(key)) {
        return function (...args: any[]) {
          const result = value.apply(target, args);
          notifySubs();
          return result;
        };
      }

      if (key === "forEach") {
        return (cb: (v: T, v2: T, s: Set<T>) => void, thisArg?: any) => {
          target.forEach((v) => {
            const rv =
              v !== null && typeof v === "object"
                ? makeReactive(v, notifySubs)
                : v;
            cb.call(thisArg, rv as T, rv as T, proxy);
          });
        };
      }

      return value.bind(target);
    },
  });

  reactiveObjects.set(set, proxy);
  return proxy;
}

// ============================================================================
// Date
// ============================================================================

const DATE_MUTATING_METHODS = [
  "setDate",
  "setFullYear",
  "setHours",
  "setMilliseconds",
  "setMinutes",
  "setMonth",
  "setSeconds",
  "setTime",
  "setUTCDate",
  "setUTCFullYear",
  "setUTCHours",
  "setUTCMilliseconds",
  "setUTCMinutes",
  "setUTCMonth",
  "setUTCSeconds",
  "setYear",
];

function createReactiveDate(date: Date, notifyParent?: () => void): Date {
  if (reactiveObjects.has(date)) return reactiveObjects.get(date) as Date;

  const subscribers = new Set<() => void>();
  const notifySubs = () => notify(subscribers, notifyParent);

  const proxy = new Proxy(date, {
    get(target, key) {
      track(subscribers);
      const value = Reflect.get(target, key);
      if (typeof value === "function") {
        if (typeof key === "string" && DATE_MUTATING_METHODS.includes(key)) {
          return function (...args: any[]) {
            const result = (value as Function).apply(target, args);
            notifySubs();
            return result;
          };
        }
        return (value as Function).bind(target);
      }
      return value;
    },
  });

  reactiveObjects.set(date, proxy);
  return proxy;
}

// ============================================================================
// RegExp
// ============================================================================

function createReactiveRegExp(
  regexp: RegExp,
  notifyParent?: () => void,
): RegExp {
  if (reactiveObjects.has(regexp)) return reactiveObjects.get(regexp) as RegExp;

  const subscribers = new Set<() => void>();
  const notifySubs = () => notify(subscribers, notifyParent);

  const proxy = new Proxy(regexp, {
    get(target, key) {
      track(subscribers);
      const value = Reflect.get(target, key);
      if (typeof value === "function") {
        if (key === "exec" || key === "test") {
          return function (...args: any[]) {
            const result = (value as Function).apply(target, args);
            notifySubs();
            return result;
          };
        }
        return (value as Function).bind(target);
      }
      return value;
    },
    set(target, key, value) {
      const old = Reflect.get(target, key);
      if (!Object.is(old, value)) {
        Reflect.set(target, key, value);
        notifySubs();
      }
      return true;
    },
  });

  reactiveObjects.set(regexp, proxy);
  return proxy;
}

// ============================================================================
// TypedArray / ArrayBuffer
// ============================================================================

const TYPED_ARRAY_MUTATING_METHODS = [
  "set",
  "fill",
  "copyWithin",
  "sort",
  "reverse",
];

function createReactiveTypedArray<T extends ArrayBufferView | ArrayBuffer>(
  arr: T,
  notifyParent?: () => void,
): T {
  if (reactiveObjects.has(arr as object))
    return reactiveObjects.get(arr as object) as T;

  const subscribers = new Set<() => void>();
  const notifySubs = () => notify(subscribers, notifyParent);

  const proxy = new Proxy(arr as any, {
    get(target, key) {
      track(subscribers);
      const value = Reflect.get(target, key);
      if (typeof value === "function") {
        if (
          typeof key === "string" &&
          TYPED_ARRAY_MUTATING_METHODS.includes(key)
        ) {
          return function (...args: any[]) {
            const result = (value as Function).apply(target, args);
            notifySubs();
            return result;
          };
        }
        return (value as Function).bind(target);
      }
      return value;
    },
    set(target, key, value) {
      const old = Reflect.get(target, key);
      if (!Object.is(old, value)) {
        Reflect.set(target, key, value);
        notifySubs();
      }
      return true;
    },
  });

  reactiveObjects.set(arr as object, proxy);
  return proxy as T;
}

// ============================================================================
// Plain Object
// ============================================================================

function createReactiveObject<T extends Record<string | symbol, any>>(
  obj: T,
  notifyParent?: () => void,
): T {
  if (reactiveObjects.has(obj)) return reactiveObjects.get(obj) as T;

  // Per-property subscriber sets for granular tracking
  const propSubs = new Map<string | symbol, Set<() => void>>();

  const getSubs = (key: string | symbol): Set<() => void> => {
    if (!propSubs.has(key)) propSubs.set(key, new Set());
    return propSubs.get(key)!;
  };

  const notifyKey = (key: string | symbol) => {
    const subs = propSubs.get(key);
    if (subs) notify(subs, notifyParent);
    else if (notifyParent) scheduleNotification(notifyParent);
  };

  const proxy = new Proxy(obj, {
    get(target, key) {
      track(getSubs(key));
      const value = Reflect.get(target, key);
      if (value !== null && typeof value === "object") {
        return makeReactive(value, () => notifyKey(key));
      }
      return value;
    },

    set(target, key, value) {
      const old = Reflect.get(target, key);
      if (!Object.is(old, value)) {
        Reflect.set(target, key, value);
        notifyKey(key);
      }
      return true;
    },

    deleteProperty(target, key) {
      const had = Reflect.has(target, key);
      if (had) {
        Reflect.deleteProperty(target, key);
        notifyKey(key);
      }
      return true;
    },
  });

  reactiveObjects.set(obj, proxy);
  return proxy;
}

// ============================================================================
// Primitive
// ============================================================================

function createReactivePrimitive<T>(initialValue: T): Reactive<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  return {
    get value(): T {
      track(subscribers);
      return value;
    },
    set value(newValue: T) {
      if (!Object.is(value, newValue)) {
        value = newValue;
        notify(subscribers);
      }
    },
    subscribe(callback: () => void): Unsubscribe {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
  };
}

// ============================================================================
// Public API
// ============================================================================

export function reactive<T>(
  initialValue: T,
): T extends object ? T : Reactive<T> {
  if (initialValue === null)
    return createReactivePrimitive(initialValue) as any;
  if (typeof initialValue === "object")
    return makeReactive(initialValue) as any;
  return createReactivePrimitive(initialValue) as any;
}
