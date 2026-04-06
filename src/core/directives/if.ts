/**
 * :if and :else directives
 */

import { effect } from "../effect";
import { evaluate } from "../expression";
import type { DirectiveContext } from "./types";

export function processIf(ctx: DirectiveContext) {
  const { el, value, scope, names, nameRegexes, walkTree } = ctx;
  const cleanups: (() => void)[] = [];
  const placeholder = document.createComment(` :if="${value}" `);

  // The template is a clone of the original element.
  // We use this to restore the element when the condition becomes true.
  const template = el.cloneNode(true) as Element;

  let currentEl: Node = el;
  let isInserted = true;
  let subtreeCleanup: (() => void) | null = null;

  // Initial state: if it's not root, we replace it immediately to skip it in walkTree
  if (el.parentNode) {
    const condition = !!evaluate(value, scope);
    if (!condition) {
      el.parentNode.replaceChild(placeholder, el);
      currentEl = placeholder;
      isInserted = false;
    }
  }

  cleanups.push(
    effect(() => {
      const condition = !!evaluate(value, scope);
      if (condition && !isInserted) {
        if (currentEl.parentNode) {
          const clone = template.cloneNode(true) as Element;
          currentEl.parentNode.replaceChild(clone, currentEl);
          currentEl = clone;
          isInserted = true;
          subtreeCleanup = walkTree(clone, scope, names, nameRegexes);
        }
      } else if (!condition && isInserted) {
        if (currentEl.parentNode) {
          currentEl.parentNode.replaceChild(placeholder, currentEl);
          currentEl = placeholder;
          isInserted = false;
          if (subtreeCleanup) {
            subtreeCleanup();
            subtreeCleanup = null;
          }
        } else {
          isInserted = false;
        }
      } else if (condition && isInserted && !subtreeCleanup) {
        subtreeCleanup = walkTree(
          currentEl as Element,
          scope,
          names,
          nameRegexes,
        );
      }
    }),
  );

  (el as any)._placeholder = placeholder;
  return { cleanups, ifExpr: value };
}

export function processElse(ctx: DirectiveContext, lastIfExpr: string | null) {
  const { el, scope, names, nameRegexes, walkTree } = ctx;
  const cleanups: (() => void)[] = [];

  if (!lastIfExpr) {
    console.warn(`[reactive] :else found without a preceding :if`);
    return { cleanups };
  }

  const placeholder = document.createComment(` :else `);
  const template = el.cloneNode(true) as Element;

  let currentEl: Node = el;
  let isInserted = true;
  let subtreeCleanup: (() => void) | null = null;

  // Initial state: if it's not root, we replace it immediately to skip it in walkTree
  if (el.parentNode) {
    const condition = !evaluate(lastIfExpr, scope);
    if (!condition) {
      el.parentNode.replaceChild(placeholder, el);
      currentEl = placeholder;
      isInserted = false;
    }
  }

  cleanups.push(
    effect(() => {
      const condition = !evaluate(lastIfExpr, scope);
      if (condition && !isInserted) {
        if (currentEl.parentNode) {
          const clone = template.cloneNode(true) as Element;
          currentEl.parentNode.replaceChild(clone, currentEl);
          currentEl = clone;
          isInserted = true;
          subtreeCleanup = walkTree(clone, scope, names, nameRegexes);
        }
      } else if (!condition && isInserted) {
        if (currentEl.parentNode) {
          currentEl.parentNode.replaceChild(placeholder, currentEl);
          currentEl = placeholder;
          isInserted = false;
          if (subtreeCleanup) {
            subtreeCleanup();
            subtreeCleanup = null;
          }
        } else {
          isInserted = false;
        }
      } else if (condition && isInserted && !subtreeCleanup) {
        subtreeCleanup = walkTree(
          currentEl as Element,
          scope,
          names,
          nameRegexes,
        );
      }
    }),
  );

  (el as any)._placeholder = placeholder;
  return { cleanups };
}
