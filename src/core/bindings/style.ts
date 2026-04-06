/**
 * Style Binding
 */

import { effect } from "../effect";
import { getElement, getValue, camelToKebab } from "./utils";
import type { BindingSource } from "../../types/binding";
import type { Reactive } from "../../types/reactive";

export function bindStyle<T>(
  selector: string | Element,
  property: string,
  source: BindingSource<T>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }
  return effect(() => {
    (el as HTMLElement).style.setProperty(
      property,
      String(getValue(source) ?? ""),
    );
  });
}

export function bindStyles(
  selector: string | Element,
  styles:
    | Record<string, BindingSource<any>>
    | BindingSource<Record<string, any>>
    | Reactive<Record<string, any>>,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }

  if (
    typeof styles === "function" ||
    ("value" in styles && typeof (styles as any).value === "object") ||
    ("subscribe" in styles && typeof (styles as any).subscribe === "function")
  ) {
    return effect(() => {
      const obj = getValue(styles as BindingSource<Record<string, any>>);
      if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([prop, val]) => {
          (el as HTMLElement).style.setProperty(
            camelToKebab(prop),
            String(val ?? ""),
          );
        });
      }
    });
  }

  // Detect reactive object passed directly (e.g. reactive({ color: "red" }))
  const firstVal = Object.values(styles as Record<string, any>)[0];
  if (
    firstVal !== undefined &&
    typeof firstVal !== "function" &&
    (typeof firstVal !== "object" || firstVal === null)
  ) {
    return effect(() => {
      Object.entries(styles as Record<string, any>).forEach(([prop, val]) => {
        (el as HTMLElement).style.setProperty(
          camelToKebab(prop),
          String(val ?? ""),
        );
      });
    });
  }

  const stops = Object.entries(
    styles as Record<string, BindingSource<any>>,
  ).map(([prop, src]) =>
    effect(() => {
      (el as HTMLElement).style.setProperty(
        camelToKebab(prop),
        String(getValue(src) ?? ""),
      );
    }),
  );
  return () => stops.forEach((s) => s());
}
