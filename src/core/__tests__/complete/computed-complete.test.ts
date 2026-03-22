import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { computed } from "../../computed";

describe("computed - Complete Coverage", () => {
  describe("error handling in computation", () => {
    it("should handle errors during computation and rethrow", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const count = reactive(0);
      const errorComputed = computed(() => {
        if (count.value === 1) {
          throw new Error("Computation error");
        }
        return count.value * 2;
      });

      // First access should work
      expect(errorComputed.value).toBe(0);

      // Trigger error
      count.value = 1;

      // Should throw error and log it
      expect(() => errorComputed.value).toThrow("Computation error");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error computing value:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it("should restore previous computed context after error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const count = reactive(0);
      const outer = computed(() => {
        const inner = computed(() => {
          if (count.value === 1) {
            throw new Error("Inner error");
          }
          return count.value * 2;
        });

        try {
          return inner.value;
        } catch (e) {
          return -1;
        }
      });

      expect(outer.value).toBe(0);

      count.value = 1;
      expect(outer.value).toBe(-1);

      consoleSpy.mockRestore();
    });
  });

  describe("subscriber error handling", () => {
    it("should handle errors in subscribers", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const count = reactive(0);
      const doubled = computed(() => count.value * 2);

      // Subscribe with error-throwing callback
      doubled.subscribe(() => {
        throw new Error("Subscriber error");
      });

      // Access to mark as not dirty
      expect(doubled.value).toBe(0);

      // Change value to trigger subscriber
      count.value = 1;

      // Access again to trigger recomputation
      expect(doubled.value).toBe(2);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in computed subscriber:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("chained computed values", () => {
    it("should track dependencies between computed values", () => {
      const count = reactive(0);
      const doubled = computed(() => count.value * 2);
      const quadrupled = computed(() => doubled.value * 2);

      expect(quadrupled.value).toBe(0);

      count.value = 5;
      expect(quadrupled.value).toBe(20);
    });

    it("should handle multiple levels of computed chaining", () => {
      const a = reactive(1);
      const b = computed(() => a.value * 2);
      const c = computed(() => b.value * 2);
      const d = computed(() => c.value * 2);

      expect(d.value).toBe(8);

      a.value = 2;
      expect(d.value).toBe(16);
    });
  });
});
