import { describe, it, expect, vi } from "vitest";
import { reactive } from "../reactive";
import { effect } from "../effect";
import { batch } from "../batch";

describe("batch", () => {
  it("should batch multiple updates", () => {
    const count1 = reactive(0);
    const count2 = reactive(0);
    const fn = vi.fn(() => count1.value + count2.value);

    effect(fn);
    fn.mockClear();

    batch(() => {
      count1.value = 5;
      count2.value = 10;
    });

    // Should only run once after batch completes
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should handle nested batches", () => {
    const count = reactive(0);
    const fn = vi.fn(() => count.value);

    effect(fn);
    fn.mockClear();

    batch(() => {
      count.value = 1;
      batch(() => {
        count.value = 2;
      });
      count.value = 3;
    });

    // Should only run once after all batches complete
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should execute batch function", () => {
    const count = reactive(0);
    let executed = false;

    batch(() => {
      count.value = 5;
      executed = true;
    });

    expect(executed).toBe(true);
    expect(count.value).toBe(5);
  });

  it("should handle errors in batch", () => {
    const count = reactive(0);
    const fn = vi.fn(() => count.value);

    effect(fn);
    fn.mockClear();

    expect(() => {
      batch(() => {
        count.value = 5;
        throw new Error("Test error");
      });
    }).toThrow("Test error");

    // Should still flush updates even after error
    expect(fn).toHaveBeenCalled();
  });

  it("should not batch without explicit batch call", () => {
    const count = reactive(0);
    const fn = vi.fn(() => count.value);

    effect(fn);
    fn.mockClear();

    count.value = 1;
    count.value = 2;
    count.value = 3;

    // Should run for each update
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
