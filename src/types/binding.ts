/**
 * DOM binding types
 */

import type { Reactive, Computed } from "./reactive";

export type BindingSource<T> = Reactive<T> | Computed<T> | (() => T);

export interface BindingOptions {
  /**
   * Mark content as trusted (skips sanitization)
   * Only use for developer-controlled content, never user input!
   */
  trusted?: boolean;

  /** Skip URL validation for this binding */
  allowDangerousUrls?: boolean;

  /** Skip attribute validation for this binding */
  allowDangerousAttributes?: boolean;
}

export interface SecurityConfig {
  /** Log security warnings to console */
  logWarnings: boolean;

  /** Throw errors for security violations (set to false for production) */
  throwOnViolation: boolean;
}

export interface MultiBinding {
  selector: string | Element;
  type: "text" | "html" | "attr" | "prop" | "class" | "style" | "styles";
  target: string;
  source: BindingSource<any>;
}
