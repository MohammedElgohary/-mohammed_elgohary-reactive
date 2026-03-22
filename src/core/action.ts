/**
 * Reactive Action Binding - Type-safe event binding for HTML elements
 * Provides full TypeScript autocomplete for all HTML element events
 */

import type {
  ActionOptions,
  ActionHandler,
  KeyFilter,
  ElementEventMapType,
} from "../types/action";

// ============================================
// bindAction - Generic Event Binding
// ============================================

/**
 * Bind an action (event handler) to an element with full TypeScript autocomplete
 *
 * @example
 * ```typescript
 * // With element type inference
 * const input = document.querySelector('input')!;
 * bindAction(input, 'input', (e) => console.log(e.target.value));
 *
 * // With selector string and element type
 * bindAction<HTMLButtonElement>('#btn', 'click', (e) => console.log('clicked'));
 *
 * // With options
 * bindAction('#form', 'submit', (e) => handleSubmit(e), { preventDefault: true });
 * ```
 */
export function bindAction<
  E extends HTMLElement = HTMLElement,
  K extends keyof ElementEventMapType<E> = keyof ElementEventMapType<E>
>(
  selector: string | E,
  event: K,
  handler: (event: ElementEventMapType<E>[K]) => void,
  options?: ActionOptions
): () => void {
  const element =
    typeof selector === "string"
      ? document.querySelector<E>(selector)
      : selector;

  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }

  const wrappedHandler = (e: Event) => {
    if (options?.preventDefault) e.preventDefault();
    if (options?.stopPropagation) e.stopPropagation();
    if (options?.stopImmediatePropagation) e.stopImmediatePropagation();
    handler(e as ElementEventMapType<E>[K]);
  };

  const listenerOptions: AddEventListenerOptions = {
    capture: options?.capture,
    once: options?.once,
    passive: options?.passive,
  };

  element.addEventListener(event as string, wrappedHandler, listenerOptions);

  return () => {
    element.removeEventListener(
      event as string,
      wrappedHandler,
      listenerOptions
    );
  };
}

// ============================================
// Shorthand Functions for Common Events
// ============================================

/** Bind click event */
export function onClick<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<MouseEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "click" as any, handler as any, options);
}

/** Bind double click event */
export function onDblClick<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<MouseEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "dblclick" as any, handler as any, options);
}

/** Bind input event (for input/textarea) */
export function onInput<
  E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
>(
  selector: string | E,
  handler: ActionHandler<InputEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "input" as any, handler as any, options);
}

/** Bind change event */
export function onChange<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<Event>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "change" as any, handler as any, options);
}

/** Bind submit event (for forms) */
export function onSubmit(
  selector: string | HTMLFormElement,
  handler: ActionHandler<SubmitEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "submit" as any, handler as any, {
    preventDefault: true,
    ...options,
  });
}

/** Bind keydown event */
export function onKeyDown<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<KeyboardEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "keydown" as any, handler as any, options);
}

/** Bind keyup event */
export function onKeyUp<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<KeyboardEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "keyup" as any, handler as any, options);
}

/** Bind focus event */
export function onFocus<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<FocusEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "focus" as any, handler as any, options);
}

/** Bind blur event */
export function onBlur<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<FocusEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "blur" as any, handler as any, options);
}

/** Bind mouseenter event */
export function onMouseEnter<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<MouseEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "mouseenter" as any, handler as any, options);
}

/** Bind mouseleave event */
export function onMouseLeave<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<MouseEvent>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "mouseleave" as any, handler as any, options);
}

/** Bind scroll event */
export function onScroll<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<Event>,
  options?: ActionOptions
): () => void {
  return bindAction(selector, "scroll" as any, handler as any, {
    passive: true,
    ...options,
  });
}

// ============================================
// Keyboard Helpers
// ============================================

/**
 * Bind keydown with key filter
 *
 * @example
 * ```typescript
 * onKey('#input', 'Enter', () => submit());
 * onKey('#input', ['Enter', 'Tab'], (e) => handleKey(e));
 * onKey('#input', (e) => e.key === 'Escape', () => close());
 * ```
 */
export function onKey<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  key: KeyFilter,
  handler: ActionHandler<KeyboardEvent>,
  options?: ActionOptions
): () => void {
  const keyHandler = (e: KeyboardEvent) => {
    let shouldHandle = false;

    if (typeof key === "string") {
      shouldHandle = e.key === key;
    } else if (Array.isArray(key)) {
      shouldHandle = key.includes(e.key);
    } else if (typeof key === "function") {
      shouldHandle = key(e);
    }

    if (shouldHandle) {
      handler(e);
    }
  };

  return bindAction(selector, "keydown" as any, keyHandler as any, options);
}

/** Bind Enter key */
export function onEnter<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<KeyboardEvent>,
  options?: ActionOptions
): () => void {
  return onKey(selector, "Enter", handler, options);
}

/** Bind Escape key */
export function onEscape<E extends HTMLElement = HTMLElement>(
  selector: string | E,
  handler: ActionHandler<KeyboardEvent>,
  options?: ActionOptions
): () => void {
  return onKey(selector, "Escape", handler, options);
}
