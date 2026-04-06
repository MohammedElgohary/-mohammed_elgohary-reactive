/**
 * Global state registry — maps state names to reactive objects.
 * Used by the template parser to build expression scopes.
 */

import { BANNED_GLOBALS } from "./constants";

const _registry = new Map<string, Record<string, any>>();

// WeakSet of all reactive proxies — used by discoverWindowStates()
const _reactiveProxies = new WeakSet<object>();

/** @internal Mark a proxy so discoverWindowStates() can identify it. */
export function markReactiveProxy(proxy: object): void {
  _reactiveProxies.add(proxy);
}

/**
 * @internal Scan window globals for reactive proxies and auto-register them.
 * Handles the case where `var` declarations land on window.
 */
export function discoverWindowStates(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window)) {
      if (_registry.has(key)) continue;
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) continue;
      const val = (window as any)[key];
      // Register reactive objects OR functions defined by the user (non-native)
      if (
        (val && typeof val === "object" && _reactiveProxies.has(val)) ||
        (typeof val === "function" &&
          !val.toString().includes("[native code]") &&
          !BANNED_GLOBALS.includes(key))
      ) {
        _registry.set(key, val);
      }
    }
  } catch {
    // ignore inaccessible window properties
  }
}

/** Register a named reactive state. Called by mount(). */
export function registerState(name: string, state: Record<string, any>): void {
  if (_registry.has(name)) {
    console.warn(`[reactive] State "${name}" already registered. Overwriting.`);
  }
  _registry.set(name, state);
}

/** Get all registered state names. */
export function getStateNames(): string[] {
  return Array.from(_registry.keys());
}

/** Build a merged scope object for expression evaluation. */
export function buildScope(): Record<string, any> {
  const scope: Record<string, any> = {};
  _registry.forEach((state, name) => {
    scope[name] = state;
  });
  return scope;
}

/** Remove a named state from the registry. */
export function unregisterState(name: string): void {
  _registry.delete(name);
}

/** Clear the entire registry. */
export function clearRegistry(): void {
  _registry.clear();
}
