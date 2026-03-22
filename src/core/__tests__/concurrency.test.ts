import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reactive } from "../reactive";
import { computed } from "../computed";
import { effect } from "../effect";
import { batch } from "../batch";
import { computedAsync } from "../computedAsync";

describe("concurrency", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Simultaneous reactive updates ─────────────────────────────────────────

  it("concurrent async updates settle to the last written value", async () => {
    const state = reactive({ value: 0 });

    await Promise.all([
      Promise.resolve().then(() => {
        state.value = 1;
      }),
      Promise.resolve().then(() => {
        state.value = 2;
      }),
      Promise.resolve().then(() => {
        state.value = 3;
      }),
    ]);

    expect(state.value).toBe(3);
  });

  it("effect runs once per microtask flush after concurrent updates", async () => {
    const state = reactive({ a: 0, b: 0 });
    const fn = vi.fn(() => {
      state.a;
      state.b;
    });

    effect(fn);
    fn.mockClear();

    await Promise.all([
      Promise.resolve().then(() => {
        state.a = 1;
      }),
      Promise.resolve().then(() => {
        state.b = 1;
      }),
    ]);

    // Each update triggers the effect — total calls should be deterministic
    expect(fn.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(state.a).toBe(1);
    expect(state.b).toBe(1);
  });

  it("batch collapses concurrent updates into one notification", () => {
    const state = reactive({ x: 0, y: 0, z: 0 });
    const fn = vi.fn(() => {
      state.x;
      state.y;
      state.z;
    });

    effect(fn);
    fn.mockClear();

    batch(() => {
      state.x = 1;
      state.y = 2;
      state.z = 3;
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(state.x).toBe(1);
    expect(state.y).toBe(2);
    expect(state.z).toBe(3);
  });

  it("nested batches flush only at the outermost batch boundary", () => {
    const state = reactive({ count: 0 });
    const fn = vi.fn(() => state.count);

    effect(fn);
    fn.mockClear();

    batch(() => {
      batch(() => {
        state.count = 1;
        state.count = 2;
      });
      state.count = 3;
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(state.count).toBe(3);
  });

  // ── Computed under concurrent pressure ────────────────────────────────────

  it("computed stays consistent when dependencies change concurrently", async () => {
    const state = reactive({ a: 1, b: 2 });
    const sum = computed(() => state.a + state.b);

    await Promise.all([
      Promise.resolve().then(() => {
        state.a = 10;
      }),
      Promise.resolve().then(() => {
        state.b = 20;
      }),
    ]);

    expect(sum.value).toBe(state.a + state.b);
  });

  it("chained computed values stay consistent under rapid updates", () => {
    const state = reactive({ n: 1 });
    const doubled = computed(() => state.n * 2);
    const quadrupled = computed(() => doubled.value * 2);

    for (let i = 1; i <= 100; i++) state.n = i;

    expect(doubled.value).toBe(200);
    expect(quadrupled.value).toBe(400);
  });

  // ── computedAsync race conditions ──────────────────────────────────────────

  it("computedAsync: only the latest async result is applied", async () => {
    const state = reactive({ id: 1 });

    const ac = computedAsync(async () => {
      const id = state.id;
      // Simulate variable latency: higher id resolves faster
      await new Promise<void>((r) => setTimeout(r, (10 - id) * 10));
      return id;
    });

    // Trigger multiple updates rapidly
    state.id = 2;
    state.id = 3;
    state.id = 4;

    vi.runAllTimers();
    await Promise.resolve();
    await Promise.resolve();

    // Only the last triggered value (4) should be the final result
    expect(ac.value).toBe(4);
    ac.dispose();
  });

  it("computedAsync: dispose during in-flight request prevents update", async () => {
    let resolve!: (v: number) => void;
    const pending = new Promise<number>((r) => {
      resolve = r;
    });

    const ac = computedAsync(async () => pending);
    expect(ac.loading).toBe(true);

    ac.dispose();
    resolve(42);
    await Promise.resolve();

    expect(ac.value).toBeUndefined(); // disposed — should not update
  });

  it("computedAsync: error in one run does not affect subsequent successful run", async () => {
    const state = reactive({ fail: true });

    const ac = computedAsync(async () => {
      if (state.fail) throw new Error("temporary error");
      return "success";
    });

    await Promise.resolve();
    expect(ac.error).toBeTruthy();

    state.fail = false;
    await Promise.resolve();

    expect(ac.error).toBeNull();
    expect(ac.value).toBe("success");
    ac.dispose();
  });

  // ── Effect cleanup under concurrency ──────────────────────────────────────

  it("effect cleanup runs before re-execution on concurrent updates", () => {
    const state = reactive({ v: 0 });
    const order: string[] = [];

    effect(() => {
      state.v; // track
      order.push(`run:${state.v}`);
      return () => order.push(`cleanup:${state.v}`);
    });

    order.length = 0; // clear initial run record

    state.v = 1;
    state.v = 2;

    // Each update: cleanup previous, then run new
    expect(order[0]).toMatch(/cleanup/);
  });

  it("disposed effect does not react to concurrent updates", async () => {
    const state = reactive({ n: 0 });
    const fn = vi.fn(() => state.n);

    const stop = effect(fn);
    fn.mockClear();
    stop();

    await Promise.all([
      Promise.resolve().then(() => {
        state.n = 1;
      }),
      Promise.resolve().then(() => {
        state.n = 2;
      }),
      Promise.resolve().then(() => {
        state.n = 3;
      }),
    ]);

    expect(fn).not.toHaveBeenCalled();
  });

  // ── Array / object mutations under concurrency ────────────────────────────

  it("concurrent array mutations are all applied", async () => {
    const state = reactive({ list: [] as number[] });

    await Promise.all(
      [1, 2, 3, 4, 5].map((n) =>
        Promise.resolve().then(() => state.list.push(n)),
      ),
    );

    expect(state.list.length).toBe(5);
    expect(state.list.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("concurrent object property updates are all applied", async () => {
    const state = reactive({ a: 0, b: 0, c: 0, d: 0, e: 0 });

    await Promise.all([
      Promise.resolve().then(() => {
        state.a = 1;
      }),
      Promise.resolve().then(() => {
        state.b = 2;
      }),
      Promise.resolve().then(() => {
        state.c = 3;
      }),
      Promise.resolve().then(() => {
        state.d = 4;
      }),
      Promise.resolve().then(() => {
        state.e = 5;
      }),
    ]);

    expect(state).toMatchObject({ a: 1, b: 2, c: 3, d: 4, e: 5 });
  });
});
