/**
 * :model directive
 */

import { bindInput } from "../bind";
import { evaluate } from "../expression";
import type { DirectiveContext } from "./types";

export function processModel(ctx: DirectiveContext, options: any) {
  const { el, value, scope } = ctx;
  const cleanups: (() => void)[] = [];
  
  const expr = value.trim();
  const dotIdx = expr.lastIndexOf(".");
  if (dotIdx !== -1) {
    const objExpr = expr.slice(0, dotIdx);
    const key = expr.slice(dotIdx + 1);
    const obj = evaluate(objExpr, scope);
    if (obj && key in obj) {
      cleanups.push(
        bindInput(el as HTMLInputElement, obj, key as any, options),
      );
    } else {
      console.warn(`[reactive] :model="${expr}" — could not resolve`);
    }
  } else {
    console.warn(`[reactive] :model="${expr}" — use "stateName.key" syntax`);
  }
  
  return { cleanups };
}
