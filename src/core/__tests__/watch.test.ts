import { describe, it, expect, vi } from "vitest";
import { reactive } from "../reactive";
import { computed } from "../computed";
import { watch, watchMultiple, watchProperty } from "../watch";

describe("watch", () => {
  it("should watch reactive value", () => {
    const count = reactive(0);
    const callback = vi.fn();

    watch(count, callback);
    count.value = 5;

    expect(callback).toHaveBeenCalledWith(5, 0);
  });

  it("should watch computed value", () => {
    const count = reactive(5);
    const doubled = computed(() => count.value * 2);
    const callback = vi.fn();

    watch(doubled, callback);
    count.value = 10;

    expect(callback).toHaveBeenCalledWith(20, 10);
  });

  it("should watch function", () => {
    const state = reactive({ count: 0 });
    const callback = vi.fn();

    watch(() => state.count, callback);
    state.count = 5;

    expect(callback).toHaveBeenCalledWith(5, 0);
  });

  it("should support immediate option", () => {
    const count = reactive(5);
    const callback = vi.fn();

    watch(count, callback, { immediate: true });

    expect(callback).toHaveBeenCalledWith(5, 5);
  });

  it("should return cleanup function", () => {
    const count = reactive(0);
    const callback = vi.fn();

    const stop = watch(count, callback);
    count.value = 5;
    expect(callback).toHaveBeenCalledTimes(1);

    stop();
    count.value = 10;
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should support cleanup in callback", () => {
    const count = reactive(0);
    const cleanup = vi.fn();
    const callback = vi.fn(() => cleanup);

    watch(count, callback);
    count.value = 5;
    expect(cleanup).not.toHaveBeenCalled();

    count.value = 10;
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe("watchMultiple", () => {
  it("should watch multiple sources", () => {
    const count1 = reactive(0);
    const count2 = reactive(0);
    const callback = vi.fn();

    watchMultiple([count1, count2], callback);

    count1.value = 5;
    expect(callback).toHaveBeenCalledWith([5, 0], [0, 0]);

    count2.value = 10;
    expect(callback).toHaveBeenCalledWith([5, 10], [5, 0]);
  });

  it("should support immediate option", () => {
    const count1 = reactive(5);
    const count2 = reactive(10);
    const callback = vi.fn();

    watchMultiple([count1, count2], callback, { immediate: true });

    expect(callback).toHaveBeenCalledWith([5, 10], [5, 10]);
  });

  it("should only trigger when values change", () => {
    const count1 = reactive(0);
    const count2 = reactive(0);
    const callback = vi.fn();

    watchMultiple([count1, count2], callback);

    count1.value = 0; // Same value
    expect(callback).not.toHaveBeenCalled();

    count1.value = 5; // Different value
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe("watchProperty", () => {
  it("should watch object property", () => {
    const state = reactive({ count: 0, name: "test" });
    const callback = vi.fn();

    watchProperty(state, "count", callback);

    state.count = 5;
    expect(callback).toHaveBeenCalledWith(5, 0);

    state.name = "changed";
    expect(callback).toHaveBeenCalledTimes(1); // Should not trigger
  });

  it("should support immediate option", () => {
    const state = reactive({ count: 5 });
    const callback = vi.fn();

    watchProperty(state, "count", callback, { immediate: true });

    expect(callback).toHaveBeenCalledWith(5, 5);
  });
});
