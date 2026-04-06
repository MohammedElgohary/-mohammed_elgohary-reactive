/**
 * Types for the template parser and expression evaluator.
 */

/** A single part of a parsed interpolation template string. */
export type InterpolationPart =
  | { type: "static"; value: string }
  | { type: "expr"; value: string };

/**
 * The merged scope object passed to expression evaluation.
 * Keys are registered state names, values are reactive state objects.
 *
 * @example
 * // Given:
 * const counter = reactive({ count: 0 });
 * const user    = reactive({ name: "Ali" });
 * scope is: { counter, user }
 */
export type TemplateScope = Record<string, any>;
