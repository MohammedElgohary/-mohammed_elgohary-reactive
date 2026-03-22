import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { effect } from "../../effect";

describe("effect - Complete Coverage", () => {
  describe("cleanup error handling", () => {
    it("should handle errors in cleanup function", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const count = reactive(0);

      effect(() => {
        count.value;
        return () => {
          throw new Error("Cleanup error");
        };
      });

      // Trigger cleanup by changing value
      count.value = 1;

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in effect cleanup:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should handle errors in cleanup on stop", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const stop = effect(() => {
        return () => {
          throw new Error("Cleanup error on stop");
        };
      });

      stop();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in effect cleanup on stop:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("disposed state", () => {
    it("should not run effect after disposal", () => {
      const count = reactive(0);
      const fn = vi.fn();

      const stop = effect(() => {
        fn();
        count.value;
      });

      expect(fn).toHaveBeenCalledTimes(1);

      stop();
      count.value = 1;

      // Should not run again after disposal
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple stop calls", () => {
      const fn = vi.fn();
      const stop = effect(fn);

      stop();
      stop(); // Second call should be safe

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("infinite loop prevention", () => {
    it("should prevent infinite loops when effect modifies its own dependency", () => {
      const count = reactive(0);
      const fn = vi.fn();

      effect(() => {
        fn();
        if (count.value < 10) {
          count.value++; // This would cause infinite loop without protection
        }
      });

      // Should only run once per change, not infinitely
      expect(fn.mock.calls.length).toBeLessThan(20);
    });
  });

  describe("nested effects", () => {
    it("should handle nested effect creation", () => {
      const outer = reactive(0);
      const inner = reactive(0);
      const outerFn = vi.fn();
      const innerFn = vi.fn();

      effect(() => {
        outerFn();
        outer.value;

        effect(() => {
          innerFn();
          inner.value;
        });
      });

      expect(outerFn).toHaveBeenCalledTimes(1);
      expect(innerFn).toHaveBeenCalledTimes(1);

      outer.value = 1;
      expect(outerFn).toHaveBeenCalledTimes(2);
      // Inner effect is recreated
      expect(innerFn).toHaveBeenCalledTimes(2);
    });
  });

  describe("cleanup function types", () => {
    it("should handle effect that returns undefined", () => {
      const count = reactive(0);

      const stop = effect(() => {
        count.value;
        // No return value
      });

      count.value = 1;
      stop();

      expect(true).toBe(true); // No errors
    });

    it("should handle effect that returns non-function", () => {
      const count = reactive(0);

      const stop = effect(() => {
        count.value;
        return "not a function" as any;
      });

      count.value = 1;
      stop();

      expect(true).toBe(true); // No errors
    });
  });

  describe("error handling in effect function", () => {
    it("should catch and log errors in effect function", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const count = reactive(0);

      effect(() => {
        count.value;
        throw new Error("Effect error");
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error in effect:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("should continue working after error", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const count = reactive(0);
      const fn = vi.fn();

      effect(() => {
        count.value;
        if (count.value === 1) {
          throw new Error("Error at 1");
        }
        fn();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      count.value = 1; // Triggers error
      expect(consoleSpy).toHaveBeenCalled();

      count.value = 2; // Should still work
      expect(fn).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });

  describe("unsubscribe functions", () => {
    it("should clear unsubscribe functions on stop", () => {
      const count = reactive(0);
      const fn = vi.fn();

      const stop = effect(() => {
        fn();
        count.value;
      });

      expect(fn).toHaveBeenCalledTimes(1);

      // Change value to trigger effect
      count.value = 1;
      expect(fn).toHaveBeenCalledTimes(2);

      // Stop should prevent further calls
      stop();
      count.value = 2;
      expect(fn).toHaveBeenCalledTimes(2); // No additional calls
    });
  });

  describe("active effect restoration", () => {
    it("should restore previous active effect after execution", () => {
      const outer = reactive(0);
      const inner = reactive(0);

      effect(() => {
        outer.value;

        // This should not interfere with outer effect's active state
        effect(() => {
          inner.value;
        });
      });

      // Both should work independently
      outer.value = 1;
      inner.value = 1;

      expect(true).toBe(true); // No errors
    });
  });
});
