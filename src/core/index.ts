/**
 * Core reactive system — public exports
 */

export { reactive } from "./reactive";
export { computed } from "./computed";
export { computedAsync } from "./computedAsync";
export { effect } from "./effect";
export { batch, isBatchingUpdates } from "./batch";
export { readonly, readonlyObject } from "./readonly";
export { watch, watchMultiple, watchProperty } from "./watch";
export {
  ref,
  toRaw,
  markRaw,
  isRaw,
  shallowReactive,
  isReactive,
  isComputed,
} from "./utils";
export {
  setDebug,
  isDebugEnabled,
  trackReactive,
  getDebugInfo,
  logTrackedReactive,
  clearDebugTracking,
} from "./debug";

export {
  bindText,
  bindHTML,
  bindAttr,
  bindClass,
  bindStyle,
  bindStyles,
  bindInput,
  bindProp,
  bindMultiple,
  bind,
  render,
  escapeHtmlEntities,
  sanitizeHtmlContent,
  isUrlSafe,
  configureReactiveSecurity,
} from "./bind";

export {
  bindAction,
  onClick,
  onDblClick,
  onInput,
  onChange,
  onSubmit,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
  onScroll,
  onKey,
  onEnter,
  onEscape,
} from "./action";

// Template parser — primary API
export { mount, unmount, parse, autoMount } from "./parser";

// Registry — for advanced use
export {
  registerState,
  unregisterState,
  clearRegistry,
  buildScope,
  getStateNames,
} from "./registry";

// Expression utilities — for advanced use
export {
  evaluate,
  execute,
  compileExpression,
  compileStatement,
  parseInterpolations,
  clearExpressionCache,
} from "./expression";

// Types
export type { ComputedWithDispose } from "./computed";
export type { AsyncComputed, AsyncComputedOptions } from "./computedAsync";
export type { InterpolationPart, TemplateScope } from "../types/parser";
export type {
  Reactive,
  Computed,
  EffectFn,
  EffectCleanup,
  EffectOptions,
  Unsubscribe,
} from "../types/reactive";
export type {
  BindingSource,
  BindingOptions,
  SecurityConfig,
  MultiBinding,
} from "../types/binding";
export type { ActionOptions, ActionHandler, KeyFilter } from "../types/action";
export type { WatchSource, WatchCallback, WatchOptions } from "../types/watch";
