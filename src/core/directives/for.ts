/**
 * :for directive
 */

import { effect } from "../effect";
import { evaluate } from "../expression";
import type { DirectiveContext } from "./types";

export function processFor(ctx: DirectiveContext) {
  const { el, value, scope, names = [], walkTree, buildNameRegexes } = ctx;
  const cleanups: (() => void)[] = [];

  const match = value.match(/^\s*(\w+)\s+in\s+(.+)\s*$/);
  if (!match) {
    console.warn(
      `[reactive] :for="${value}" — invalid syntax. Use "item in items"`,
    );
    return { cleanups };
  }

  const [_, itemName, collectionExpr] = match;
  const placeholder = document.createComment(` :for="${value}" `);

  // Create a template from the original element before modifying it
  const template = el.cloneNode(true) as Element;
  // Remove the :for directive from the template so it doesn't loop infinitely
  const forAttrName =
    Array.from(template.attributes).find((a) => a.name.startsWith(":for"))
      ?.name || ":for";
  template.removeAttribute(forAttrName);

  // If the element is currently in the DOM, replace it with a placeholder.
  // If not (e.g. we are parsing a detached clone), we should still insert the
  // placeholder so that walkTree can skip the template correctly.
  if (el.parentNode) {
    el.parentNode.replaceChild(placeholder, el);
  } else {
    // If no parent, we can't replace it, but we MUST hide it or mark it
    // so it doesn't appear in the final output.
    // This happens when the root of walkTree has a :for directive.
    (el as any)._isTemplate = true;
    if (el instanceof HTMLElement) el.style.display = "none";
  }

  const instanceMap = new Map<any, { el: Element; cleanup: () => void }>();

  cleanups.push(
    effect(() => {
      const collection = evaluate(collectionExpr, scope);
      if (!Array.isArray(collection)) return;

      const currentItems = new Set(collection);

      // Remove old
      for (const [item, instance] of instanceMap.entries()) {
        if (!currentItems.has(item)) {
          instance.el.remove();
          instance.cleanup();
          instanceMap.delete(item);
        }
      }

      // Add/Reorder
      const newNames = [...names, itemName];
      const newRegexes = buildNameRegexes(newNames);
      let prevNode: Node = placeholder;

      collection.forEach((item) => {
        let instance = instanceMap.get(item);
        if (!instance) {
          const clone = template.cloneNode(true) as Element;
          const localScope = { ...scope, [itemName]: item };
          // Recursively parse the clone with the NEW names (including the loop variable)
          const stop = walkTree(clone, localScope, newNames, newRegexes);
          instance = { el: clone, cleanup: stop };
          instanceMap.set(item, instance);
        }

        if (instance.el.previousSibling !== prevNode) {
          prevNode.parentNode?.insertBefore(instance.el, prevNode.nextSibling);
        }
        prevNode = instance.el;
      });
    }),
  );

  (el as any)._placeholder = placeholder;
  return { cleanups };
}
