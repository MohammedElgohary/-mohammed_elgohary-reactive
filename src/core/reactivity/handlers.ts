/**
 * Proxy Handlers for various types
 */

import { reactiveObjects, track, notify, rawMarkers, RAW_SYMBOL } from "./core";

// ============================================================================
// Internal helper to dispatch to specific creators
// ============================================================================

export function makeReactive<T>(value: T, notifyParent?: () => void): T {
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

  const propSubs = new Map<string | symbol, Set<() => void>>();
  const getSubs = (key: string | symbol) => {
    if (!propSubs.has(key)) propSubs.set(key, new Set());
    return propSubs.get(key)!;
  };

  const notifyKey = (key: string | symbol) => {
    const subs = propSubs.get(key);
    if (subs) notify(subs, notifyParent);
    else if (notifyParent) notify(new Set(), notifyParent);
  };

  const proxy = new Proxy(arr, {
    get(target, key) {
      if (key === RAW_SYMBOL) return target;
      track(getSubs(key));
      const value = Reflect.get(target, key);

      if (
        typeof key === "string" &&
        ARRAY_MUTATING_METHODS.includes(key) &&
        typeof value === "function"
      ) {
        return function (...args: any[]) {
          const result = (value as Function).apply(target, args);
          notifyKey("length"); // Most mutations affect length
          notifyKey(key);
          return result;
        };
      }

      if (typeof value === "function") {
        return (value as Function).bind(proxy);
      }

      if (
        typeof key !== "symbol" &&
        value !== null &&
        typeof value === "object"
      ) {
        return makeReactive(value, () => notifyKey(key));
      }

      return value;
    },

    set(target, key, value) {
      const old = Reflect.get(target, key);
      if (!Object.is(old, value)) {
        Reflect.set(target, key, value);
        notifyKey(key);
        if (key === "length") {
          // If length decreases, notify removed indices
          // Simplified: notify all subscribers for now or a specific range
        }
      }
      return true;
    },

    deleteProperty(target, key) {
      const had = Reflect.has(target, key);
      if (had) {
        Reflect.deleteProperty(target, key);
        notifyKey(key);
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

  const globalSubs = new Set<() => void>();
  const keySubs = new Map<any, Set<() => void>>();
  const getSubs = (key: any) => {
    if (!keySubs.has(key)) keySubs.set(key, new Set());
    return keySubs.get(key)!;
  };

  const notifyKey = (key: any) => {
    const subs = keySubs.get(key);
    if (subs) notify(subs, notifyParent);
    notify(globalSubs, notifyParent); // Also notify global subscribers
  };

  const proxy = new Proxy(map, {
    get(target, key) {
      if (key === RAW_SYMBOL) return target;
      const value = Reflect.get(target, key);

      if (key === "size") {
        track(globalSubs);
        return target.size;
      }

      if (typeof value !== "function") return value;

      if (typeof key === "string" && MAP_MUTATING_METHODS.includes(key)) {
        return function (...args: any[]) {
          const result = value.apply(target, args);
          if (key === "set") notifyKey(args[0]);
          else if (key === "delete") notifyKey(args[0]);
          else if (key === "clear") {
            keySubs.forEach((_, k) => notifyKey(k));
            notify(globalSubs, notifyParent);
          }
          return result;
        };
      }

      if (key === "get") {
        return (k: K) => {
          track(getSubs(k));
          const result = target.get(k);
          return result !== null && typeof result === "object"
            ? makeReactive(result, () => notifyKey(k))
            : result;
        };
      }

      if (
        key === "forEach" ||
        key === "keys" ||
        key === "values" ||
        key === "entries" ||
        key === Symbol.iterator
      ) {
        return function (...args: any[]) {
          track(globalSubs); // Tracking everything
          const result = (value as Function).apply(target, args);
          // If result is an iterator, we should potentially wrap it, but for now just track global
          return result;
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
      if (key === RAW_SYMBOL) return target;

      if (key === "size") {
        track(subscribers);
        return target.size;
      }

      const value = Reflect.get(target, key);

      if (typeof value !== "function") return value;

      if (typeof key === "string" && SET_MUTATING_METHODS.includes(key)) {
        return function (...args: any[]) {
          const result = value.apply(target, args);
          notifySubs();
          return result;
        };
      }

      if (
        key === "forEach" ||
        key === "has" ||
        key === "values" ||
        key === "entries" ||
        key === "keys" ||
        key === Symbol.iterator
      ) {
        return function (...args: any[]) {
          track(subscribers);
          const result = (value as Function).apply(target, args);
          return result;
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
      if (key === RAW_SYMBOL) return target;
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
      if (key === RAW_SYMBOL) return target;
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
      if (key === RAW_SYMBOL) return target;
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

  const propSubs = new Map<string | symbol, Set<() => void>>();

  const getSubs = (key: string | symbol): Set<() => void> => {
    if (!propSubs.has(key)) propSubs.set(key, new Set());
    return propSubs.get(key)!;
  };

  const notifyKey = (key: string | symbol) => {
    const subs = propSubs.get(key);
    if (subs) notify(subs, notifyParent);
    else if (notifyParent) notify(new Set(), notifyParent); // Fallback
  };

  const proxy = new Proxy(obj, {
    get(target, key) {
      if (key === RAW_SYMBOL) return target;
      track(getSubs(key));
      const value = Reflect.get(target, key);

      if (typeof value === "function") {
        return (value as Function).bind(proxy);
      }

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
