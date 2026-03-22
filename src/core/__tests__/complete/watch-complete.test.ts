import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { watch, watchMultiple } from "../../watch";

describe("watch - Complete Coverage", () => {
  describe("watch with cleanup", () => {
    it("should call cleanup function on subsequent changes", () => {
      const count = reactive(0);
      const cleanup = vi.fn();

      watch(
        count,
        () => {
          return cleanup;
        },
        { immediate: true }
      );

      expect(cleanup).not.toHaveBeenCalled();

      count.value = 1;
      expect(cleanup).toHaveBeenCalledTimes(1);

      count.value = 2;
      expect(cleanup).toHaveBeenCalledTimes(2);
    });

    it("should handle cleanup function from immediate callback", () => {
      const count = reactive(0);
      const cleanup = vi.fn();

      watch(
        count,
        () => {
          return cleanup;
        },
        { immediate: true }
      );

      // Cleanup should not be called on immediate
      expect(cleanup).not.toHaveBeenCalled();

      // But should be called on next change
      count.value = 1;
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe("watchMultiple with cleanup", () => {
    it("should call cleanup function on subsequent changes", () => {
      const count1 = reactive(0);
      const count2 = reactive(0);
      const cleanup = vi.fn();

      watchMultiple(
        [count1, count2],
        () => {
          return cleanup;
        },
        { immediate: true }
      );

      expect(cleanup).not.toHaveBeenCalled();

      count1.value = 1;
      expect(cleanup).toHaveBeenCalledTimes(1);

      count2.value = 1;
      expect(cleanup).toHaveBeenCalledTimes(2);
    });

    it("should handle cleanup function from immediate callback", () => {
      const count1 = reactive(0);
      const count2 = reactive(0);
      const cleanup = vi.fn();

      watchMultiple(
        [count1, count2],
        () => {
          return cleanup;
        },
        { immediate: true }
      );

      // Cleanup should not be called on immediate
      expect(cleanup).not.toHaveBeenCalled();

      // But should be called on next change
      count1.value = 1;
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it("should not trigger callback when no values changed", () => {
      const count1 = reactive(0);
      const count2 = reactive(0);
      const callback = vi.fn();

      watchMultiple([count1, count2], callback);

      callback.mockClear();

      // Set to same value
      count1.value = 0;
      count2.value = 0;

      // Callback should not be called since values didn't change
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
