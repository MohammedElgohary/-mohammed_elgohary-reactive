/**
 * Internal constants and generated names for obfuscation.
 */

/**
 * Generates a random valid JavaScript variable name.
 */
function generateRandomName(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const allChars = chars + "0123456789";
  let name = chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 1; i < length; i++) {
    name += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  return name;
}

// Generate once per load, but keep stable in tests for consistency
export const SCOPE_ATTR =
  typeof process !== "undefined" && process.env.NODE_ENV === "test"
    ? "data-scope"
    : generateRandomName(6);

export const SCOPE_VAR =
  typeof process !== "undefined" && process.env.NODE_ENV === "test"
    ? "__scope__"
    : generateRandomName();

/**
 * List of globals to block in expressions to prevent access to sensitive APIs.
 * This is not a foolproof sandbox but blocks common attack vectors.
 */
export const BANNED_GLOBALS = [
  "window",
  "document",
  "globalThis",
  "Function",
  "eval",
  "fetch",
  "XMLHttpRequest",
  "navigator",
  "localStorage",
  "sessionStorage",
  "indexedDB",
];
