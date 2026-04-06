/**
 * Reactive Security — sanitization and URL validation logic
 */

import type { SecurityConfig } from "../types/binding";

let SECURITY_CONFIG: SecurityConfig = {
  logWarnings: true,
  throwOnViolation: false,
};

export function configureReactiveSecurity(options: {
  logWarnings?: boolean;
  throwOnViolation?: boolean;
}) {
  SECURITY_CONFIG = { ...SECURITY_CONFIG, ...options };
}

export const DANGEROUS_ATTRIBUTES = new Set([
  "formaction",
  "xlink:href",
  "data",
  "srcdoc",
]);

export const DANGEROUS_PROPERTIES = new Set([
  "innerHTML",
  "outerHTML",
  "insertAdjacentHTML",
  "srcdoc",
]);

export const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "action",
  "formaction",
  "poster",
]);

export function logSecurityWarning(message: string) {
  if (SECURITY_CONFIG.logWarnings)
    console.warn(`🔒 Reactive Security: ${message}`);
  if (SECURITY_CONFIG.throwOnViolation)
    throw new Error(`Security violation: ${message}`);
}

export function isValidUrl(url: string): boolean {
  const t = url.trim().toLowerCase();
  return (
    !t.startsWith("javascript:") &&
    !t.startsWith("vbscript:") &&
    !t.startsWith("data:text/html")
  );
}

export function escapeHtmlEntities(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return str.replace(/[&<>"'`=/]/g, (c) => map[c]);
}

export function sanitizeHtml(html: string): string {
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(
      /<(iframe|object|embed|form|base|link|meta|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(
      /<(iframe|object|embed|form|base|link|meta|style)\b[^>]*\/?>/gi,
      "",
    );

  if (typeof DOMParser === "undefined") return clean;

  const doc = new DOMParser().parseFromString(clean, "text/html");
  doc
    .querySelectorAll("script,iframe,object,embed,form,base,link,meta,style")
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || DANGEROUS_ATTRIBUTES.has(name)) {
        el.removeAttribute(attr.name);
      } else if (URL_ATTRIBUTES.has(name) && !isValidUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body?.innerHTML ?? clean;
}
