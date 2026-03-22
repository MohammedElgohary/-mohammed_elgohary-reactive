/**
 * Action/event handling types
 */

export interface ActionOptions {
  /** Automatically call preventDefault() */
  preventDefault?: boolean;

  /** Automatically call stopPropagation() */
  stopPropagation?: boolean;

  /** Automatically call stopImmediatePropagation() */
  stopImmediatePropagation?: boolean;

  /** Use capture phase */
  capture?: boolean;

  /** Remove listener after first invocation */
  once?: boolean;

  /** Passive event listener (improves scroll performance) */
  passive?: boolean;
}

export type ActionHandler<E extends Event = Event> = (event: E) => void;

export type KeyFilter = string | string[] | ((event: KeyboardEvent) => boolean);

/** All standard HTML element events */
export type HTMLElementEventMap = {
  click: MouseEvent;
  dblclick: MouseEvent;
  mousedown: MouseEvent;
  mouseup: MouseEvent;
  mousemove: MouseEvent;
  mouseenter: MouseEvent;
  mouseleave: MouseEvent;
  mouseover: MouseEvent;
  mouseout: MouseEvent;
  contextmenu: MouseEvent;
  keydown: KeyboardEvent;
  keyup: KeyboardEvent;
  keypress: KeyboardEvent;
  focus: FocusEvent;
  blur: FocusEvent;
  focusin: FocusEvent;
  focusout: FocusEvent;
  submit: SubmitEvent;
  reset: Event;
  change: Event;
  input: Event;
  invalid: Event;
  drag: DragEvent;
  dragstart: DragEvent;
  dragend: DragEvent;
  dragenter: DragEvent;
  dragleave: DragEvent;
  dragover: DragEvent;
  drop: DragEvent;
  copy: ClipboardEvent;
  cut: ClipboardEvent;
  paste: ClipboardEvent;
  touchstart: TouchEvent;
  touchend: TouchEvent;
  touchmove: TouchEvent;
  touchcancel: TouchEvent;
  pointerdown: PointerEvent;
  pointerup: PointerEvent;
  pointermove: PointerEvent;
  pointerenter: PointerEvent;
  pointerleave: PointerEvent;
  pointerover: PointerEvent;
  pointerout: PointerEvent;
  pointercancel: PointerEvent;
  gotpointercapture: PointerEvent;
  lostpointercapture: PointerEvent;
  wheel: WheelEvent;
  animationstart: AnimationEvent;
  animationend: AnimationEvent;
  animationiteration: AnimationEvent;
  animationcancel: AnimationEvent;
  transitionstart: TransitionEvent;
  transitionend: TransitionEvent;
  transitionrun: TransitionEvent;
  transitioncancel: TransitionEvent;
  scroll: Event;
  resize: UIEvent;
  load: Event;
  error: ErrorEvent;
  abort: Event;
  select: Event;
};

/** Element event map — used by bindAction for TypeScript autocomplete */
export type ElementEventMapType<E extends HTMLElement> = E extends
  | HTMLInputElement
  | HTMLTextAreaElement
  ? HTMLElementEventMap & { input: InputEvent; change: Event }
  : E extends HTMLFormElement
    ? HTMLElementEventMap & { submit: SubmitEvent }
    : HTMLElementEventMap;
