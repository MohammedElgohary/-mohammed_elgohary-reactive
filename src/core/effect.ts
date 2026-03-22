/**
 * Effects - run side effects when reactive dependencies change
 */

import type {
  EffectFn,
  EffectCleanup,
  EffectOptions,
  Unsubscribe,
} from "../types";
import { pushSubscriber, popSubscriber } from "./dependency";

export function effect(fn: EffectFn, options?: EffectOptions): Unsubscribe {
  let cleanup: EffectCleanup | undefined;
  let isDisposed = false;
  let isRunning = false;

  const handleError = (e: unknown, context: string) => {
    if (options?.onError) {
      options.onError(e);
    } else {
      const label = context
        ? `Error in effect ${context}:`
        : "Error in effect:";
      console.error(label, e);
    }
  };

  const run = () => {
    if (isDisposed || isRunning) return;
    isRunning = true;

    // Run previous cleanup before re-executing
    if (cleanup) {
      try {
        cleanup();
      } catch (e) {
        handleError(e, "cleanup");
      }
      cleanup = undefined;
    }

    pushSubscriber(run);
    try {
      const result = fn();
      if (typeof result === "function") cleanup = result as EffectCleanup;
    } catch (e) {
      handleError(e, "");
    } finally {
      popSubscriber();
      isRunning = false;
    }
  };

  run();

  return () => {
    isDisposed = true;
    if (cleanup) {
      try {
        cleanup();
      } catch (e) {
        handleError(e, "cleanup on stop");
      }
      cleanup = undefined;
    }
  };
}
