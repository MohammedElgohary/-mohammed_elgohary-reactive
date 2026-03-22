import { describe, it, expect, vi } from "vitest";
import { reactive } from "../reactive";
import { computed } from "../computed";

describe("computed", () => {
  it("should create computed value", () => {
    const count = reactive(5);
    const doubled = computed(() => count.value * 2);
    expect(doubled.value).toBe(10);
  });

  it("should update when dependency changes", () => {
    const count = reactive(5);
    const doubled = computed(() => count.value * 2);

    count.value = 10;
    expect(doubled.value).toBe(20);
  });

  it("should be lazy evaluated", () => {
    const count = reactive(5);
    const fn = vi.fn(() => count.value * 2);
    const doubled = computed(fn);

    expect(fn).not.toHaveBeenCalled();
    doubled.value; // Access to trigger evaluation
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should cache result", () => {
    const count = reactive(5);
    const fn = vi.fn(() => count.value * 2);
    const doubled = computed(fn);

    doubled.value;
    doubled.value;
    doubled.value;

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should recompute when dependency changes", () => {
    const count = reactive(5);
    const fn = vi.fn(() => count.value * 2);
    const doubled = computed(fn);

    doubled.value;
    count.value = 10;
    doubled.value;

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should handle multiple dependencies", () => {
    const a = reactive(2);
    const b = reactive(3);
    const sum = computed(() => a.value + b.value);

    expect(sum.value).toBe(5);
    a.value = 5;
    expect(sum.value).toBe(8);
    b.value = 10;
    expect(sum.value).toBe(15);
  });

  it("should handle nested computed", () => {
    const count = reactive(2);
    const doubled = computed(() => count.value * 2);
    const quadrupled = computed(() => doubled.value * 2);

    expect(quadrupled.value).toBe(8);
    count.value = 5;
    expect(quadrupled.value).toBe(20);
  });

  it("should notify subscribers", () => {
    const count = reactive(5);
    const doubled = computed(() => count.value * 2);
    const callback = vi.fn();

    doubled.value; // Access to establish dependency
    doubled.subscribe(callback);
    count.value = 10;

    expect(callback).toHaveBeenCalled();
  });

  it("should be readonly", () => {
    const count = reactive(5);
    const doubled = computed(() => count.value * 2);

    expect(() => {
      (doubled as any).value = 100;
    }).toThrow();
  });

  it("should handle complex computations", () => {
    const items = reactive({ list: [1, 2, 3, 4, 5] });
    const sum = computed(() => items.list.reduce((a, b) => a + b, 0));
    const average = computed(() => sum.value / items.list.length);

    expect(sum.value).toBe(15);
    expect(average.value).toBe(3);

    items.list.push(6);
    expect(sum.value).toBe(21);
    expect(average.value).toBe(3.5);
  });

  it("should handle conditional dependencies", () => {
    const flag = reactive(true);
    const a = reactive(10);
    const b = reactive(20);
    const result = computed(() => (flag.value ? a.value : b.value));

    expect(result.value).toBe(10);
    flag.value = false;
    expect(result.value).toBe(20);
    a.value = 100;
    expect(result.value).toBe(20); // Should not recompute
    b.value = 200;
    expect(result.value).toBe(200);
  });
});
