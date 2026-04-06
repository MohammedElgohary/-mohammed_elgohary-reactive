/**
 * Input Binding
 */

import { effect } from "../effect";
import { getElement } from "./utils";
import type { Reactive } from "../../types/reactive";
import type { InputOptions } from "../../types/binding";
import { toRaw } from "../reactivity/core";

export function bindInput<
  T extends string | number | boolean | Date | FileList | string[],
>(
  selector: string | Element,
  source: Reactive<T>,
  options?: InputOptions,
): () => void;
export function bindInput<T extends Record<string, any>, K extends keyof T>(
  selector: string | Element,
  obj: T,
  key: K,
  options?: InputOptions,
): () => void;
export function bindInput(
  selector: string | Element,
  sourceOrObj: any,
  keyOrOptions?: any,
  maybeOptions?: InputOptions,
): () => void {
  const el = getElement(selector);
  if (!el) {
    console.warn(`Element not found: ${selector}`);
    return () => {};
  }

  if (
    !(
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    )
  ) {
    console.warn(
      `bindInput: Element is not an input, select, or textarea:`,
      el,
    );
    return () => {};
  }

  let getter: () => any;
  let setter: (v: any) => void;
  let options: InputOptions;

  if (typeof keyOrOptions === "string") {
    const key = keyOrOptions;
    options = maybeOptions ?? {};
    getter = () => sourceOrObj[key];
    setter = (v) => (sourceOrObj[key] = v);
  } else {
    options = keyOrOptions ?? {};
    // Check if it's a Reactive primitive wrapper
    if (
      sourceOrObj &&
      typeof sourceOrObj === "object" &&
      "value" in sourceOrObj
    ) {
      getter = () => sourceOrObj.value;
      setter = (v) => (sourceOrObj.value = v);
    } else {
      // It's a Proxy (Date, Array, etc.)
      getter = () => sourceOrObj;
      setter = (v) => {
        if (Array.isArray(sourceOrObj) && Array.isArray(v)) {
          sourceOrObj.length = 0;
          sourceOrObj.push(...v);
        } else if (
          sourceOrObj instanceof Date &&
          (v instanceof Date || typeof v === "number" || typeof v === "string")
        ) {
          sourceOrObj.setTime(new Date(v as any).getTime());
        } else {
          console.warn(
            `bindInput: Cannot set value on reactive object without a key`,
          );
        }
      };
    }
  }

  const isRadio = el instanceof HTMLInputElement && el.type === "radio";
  const isCheckbox = el instanceof HTMLInputElement && el.type === "checkbox";
  const isSelect = el instanceof HTMLSelectElement;
  const isMultiple = isSelect && (el as HTMLSelectElement).multiple;
  const isNumber =
    el instanceof HTMLInputElement &&
    (el.type === "number" || el.type === "range");
  const isDate =
    el instanceof HTMLInputElement &&
    ["date", "datetime-local", "month", "week", "time"].includes(el.type);

  const stopEffect = effect(() => {
    const val = toRaw(getter());
    const isDateObject =
      val &&
      typeof val === "object" &&
      typeof (val as any).getTime === "function";

    if (isRadio) {
      (el as HTMLInputElement).checked =
        String(val) === (el as HTMLInputElement).value;
    } else if (isCheckbox) {
      (el as HTMLInputElement).checked = !!val;
    } else if (isMultiple) {
      const vals = Array.isArray(val) ? val.map(String) : [String(val)];
      Array.from((el as HTMLSelectElement).options).forEach((opt) => {
        opt.selected = vals.includes(opt.value);
      });
    } else if (isDate && isDateObject) {
      const d = val as Date;
      if (isNaN(d.getTime())) {
        (el as HTMLInputElement).value = "";
      } else {
        const Y = d.getFullYear();
        const M = String(d.getMonth() + 1).padStart(2, "0");
        const D = String(d.getDate()).padStart(2, "0");
        const h = String(d.getHours()).padStart(2, "0");
        const m = String(d.getMinutes()).padStart(2, "0");

        if (el.type === "date")
          (el as HTMLInputElement).value = `${Y}-${M}-${D}`;
        else if (el.type === "datetime-local")
          (el as HTMLInputElement).value = `${Y}-${M}-${D}T${h}:${m}`;
        else if (el.type === "month")
          (el as HTMLInputElement).value = `${Y}-${M}`;
        else if (el.type === "time")
          (el as HTMLInputElement).value = `${h}:${m}`;
        else if (el.type === "week") {
          const firstDayOfYear = new Date(Y, 0, 1);
          const pastDaysOfYear =
            (d.getTime() - firstDayOfYear.getTime()) / 86400000;
          const week = Math.ceil(
            (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7,
          );
          (el as HTMLInputElement).value =
            `${Y}-W${String(week).padStart(2, "0")}`;
        }
      }
    } else {
      const str = val == null ? "" : String(val);
      if ((el as any).value !== str) {
        (el as any).value = str;
      }
    }
  });

  const listener = (_e: Event) => {
    let newVal: any;
    const currentVal = toRaw(getter());
    const isDateObject =
      currentVal &&
      typeof currentVal === "object" &&
      typeof (currentVal as any).getTime === "function";

    if (isRadio) {
      if ((el as HTMLInputElement).checked)
        newVal = (el as HTMLInputElement).value;
      else return;
    } else if (isCheckbox) {
      newVal = (el as HTMLInputElement).checked;
    } else if (isMultiple) {
      newVal = Array.from((el as HTMLSelectElement).selectedOptions).map(
        (opt) => opt.value,
      );
    } else if (el instanceof HTMLInputElement && el.type === "file") {
      newVal = el.files;
    } else if (isNumber) {
      newVal = (el as HTMLInputElement).valueAsNumber;
      if (isNaN(newVal)) newVal = 0;
    } else if (isDate && isDateObject) {
      newVal =
        (el as HTMLInputElement).valueAsDate ||
        new Date((el as HTMLInputElement).value);
    } else {
      newVal = (el as any).value;
    }

    if (options.number) {
      const n = parseFloat(newVal);
      if (!isNaN(n)) newVal = n;
    }
    if (options.trim && typeof newVal === "string") {
      newVal = newVal.trim();
    }

    setter(newVal);
  };

  let finalListener = listener;
  if (options.debounce) {
    let timeout: any;
    finalListener = (e: Event) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => listener(e), options.debounce);
    };
  }

  el.addEventListener("input", finalListener);
  if (!options.debounce) {
    el.addEventListener("change", finalListener);
  }

  return () => {
    stopEffect();
    el.removeEventListener("input", finalListener);
    el.removeEventListener("change", finalListener);
  };
}
