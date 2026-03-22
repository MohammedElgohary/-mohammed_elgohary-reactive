import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { effect } from "../../effect";
import { batch, isBatchingUpdates } from "../../batch";

describe("batch - Complete Coverage", () => {
  describe("isBatchingUpdates", () => {
    it("should return false when not batching", () => {
      expect(isBatchingUpdates()).toBe(false);
    });

    it("should return true during batch", () => {
      let wasBatching = false;

      batch(() => {
        wasBatching = isBatchingUpdates();
      });

      expect(wasBatching).toBe(true);
      expect(isBatchingUpdates()).toBe(false); // After batch
    });
  });

  describe("nested batches", () => {
    it("should handle deeply nested batches", () => {
      const count = reactive(0);
      const fn = vi.fn();

      effect(() => {
        fn();
        count.value;
      });

      fn.mockClear();

      batch(() => {
        count.value = 1;
        batch(() => {
          count.value = 2;
          batch(() => {
            count.value = 3;
          });
        });
      });

      // Should only notify once after all batches complete
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should maintain batching state through nested calls", () => {
      const states: boolean[] = [];

      batch(() => {
        states.push(isBatchingUpdates());
        batch(() => {
          states.push(isBatchingUpdates());
          batch(() => {
            states.push(isBatchingUpdates());
          });
          states.push(isBatchingUpdates());
        });
        states.push(isBatchingUpdates());
      });

      expect(states).toEqual([true, true, true, true, true]);
      expect(isBatchingUpdates()).toBe(false);
    });
  });

  describe("batch with errors", () => {
    it("should restore batching state after error", () => {
      expect(isBatchingUpdates()).toBe(false);

      try {
        batch(() => {
          expect(isBatchingUpdates()).toBe(true);
          throw new Error("Test error");
        });
      } catch (e) {
        // Expected
      }

      expect(isBatchingUpdates()).toBe(false);
    });

    it("should still flush notifications after error", () => {
      const count = reactive(0);
      const fn = vi.fn();

      effect(() => {
        fn();
        count.value;
      });

      fn.mockClear();

      try {
        batch(() => {
          count.value = 1;
          throw new Error("Test error");
        });
      } catch (e) {
        // Expected
      }

      // Should still notify after batch despite error
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("batch return value", () => {
    it("should return the callback return value", () => {
      const result = batch(() => {
        return "test result";
      });

      expect(result).toBe("test result");
    });

    it("should return undefined for void callback", () => {
      const result = batch(() => {
        // No return
      });

      expect(result).toBeUndefined();
    });

    it("should return complex objects", () => {
      const result = batch(() => {
        return { value: 42, nested: { data: "test" } };
      });

      expect(result).toEqual({ value: 42, nested: { data: "test" } });
    });
  });

  describe("batch with multiple reactives", () => {
    it("should batch updates from multiple reactive sources", () => {
      const count1 = reactive(0);
      const count2 = reactive(0);
      const count3 = reactive(0);
      const fn = vi.fn();

      effect(() => {
        fn();
        count1.value;
        count2.value;
        count3.value;
      });

      fn.mockClear();

      batch(() => {
        count1.value = 1;
        count2.value = 2;
        count3.value = 3;
      });

      // Should only notify once
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("batch with computed values", () => {
    it("should batch computed value updates", () => {
      const count = reactive(0);
      const doubled = reactive(0);
      const fn = vi.fn();

      effect(() => {
        fn();
        doubled.value = count.value * 2;
      });

      fn.mockClear();

      batch(() => {
        count.value = 1;
        count.value = 2;
        count.value = 3;
      });

      // Should only notify once
      expect(fn).toHaveBeenCalledTimes(1);
      expect(doubled.value).toBe(6);
    });
  });

  describe("scheduleNotification", () => {
    it("should execute callback immediately when not batching", () => {
      const fn = vi.fn();

      // This is tested indirectly through reactive updates
      const count = reactive(0);
      effect(() => {
        fn();
        count.value;
      });

      fn.mockClear();
      count.value = 1;

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should defer callback when batching", () => {
      const fn = vi.fn();
      const count = reactive(0);

      effect(() => {
        fn();
        count.value;
      });

      fn.mockClear();

      batch(() => {
        count.value = 1;
        // Callback not executed yet
        expect(fn).toHaveBeenCalledTimes(0);
      });

      // Callback executed after batch
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty batch", () => {
    it("should handle empty batch", () => {
      const result = batch(() => {
        // Do nothing
      });

      expect(result).toBeUndefined();
      expect(isBatchingUpdates()).toBe(false);
    });
  });

  describe("batch with synchronous operations", () => {
    it("should complete batch before returning", () => {
      const count = reactive(0);
      const fn = vi.fn();

      effect(() => {
        fn();
        count.value;
      });

      fn.mockClear();

      batch(() => {
        count.value = 1;
        count.value = 2;
      });

      // Effect should have run by now
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
