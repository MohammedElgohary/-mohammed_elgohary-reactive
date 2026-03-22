import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reactive } from "../reactive";
import { computedAsync } from "../computedAsync";

// Flush microtasks — two ticks covers async fn().then() chains
const flush = async () => {
  vi.runAllTimers();
  await Promise.resolve();
  await Promise.resolve();
};

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("computedAsync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Basic ──────────────────────────────────────────────────────────────────

  it("starts in loading state", () => {
    const ac = computedAsync(async () => 42);
    expect(ac.loading).toBe(true);
    expect(ac.value).toBeUndefined();
    expect(ac.error).toBeNull();
    ac.dispose();
  });

  it("uses initialValue before first resolution", () => {
    const ac = computedAsync(async () => 42, { initialValue: 0 });
    expect(ac.value).toBe(0);
    ac.dispose();
  });

  it("resolves and updates value", async () => {
    const ac = computedAsync(async () => 42);
    await flush();
    expect(ac.loading).toBe(false);
    expect(ac.value).toBe(42);
    expect(ac.error).toBeNull();
    ac.dispose();
  });

  it("sets error and clears loading on rejection", async () => {
    const err = new Error("fetch failed");
    const ac = computedAsync(async () => {
      throw err;
    });
    await flush();
    expect(ac.loading).toBe(false);
    expect(ac.error).toBe(err);
    expect(ac.value).toBeUndefined();
    ac.dispose();
  });

  it("calls onError option when async fn throws", async () => {
    const onError = vi.fn();
    const err = new Error("oops");
    const ac = computedAsync(
      async () => {
        throw err;
      },
      { onError },
    );
    await flush();
    expect(onError).toHaveBeenCalledWith(err);
    ac.dispose();
  });

  // ── Reactivity ─────────────────────────────────────────────────────────────

  it("re-runs when a reactive dependency changes", async () => {
    const state = reactive({ id: 1 });
    const fn = vi.fn(async () => state.id * 10);

    const ac = computedAsync(fn);
    await flush();
    expect(ac.value).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);

    state.id = 2;
    await flush();
    expect(ac.value).toBe(20);
    expect(fn).toHaveBeenCalledTimes(2);
    ac.dispose();
  });

  it("notifies subscribers on value change", async () => {
    const state = reactive({ n: 1 });
    const ac = computedAsync(async () => state.n * 2);
    const cb = vi.fn();
    ac.subscribe(cb);

    await flush();
    const before = cb.mock.calls.length;
    state.n = 5;
    await flush();

    expect(cb.mock.calls.length).toBeGreaterThan(before);
    expect(ac.value).toBe(10);
    ac.dispose();
  });

  it("notifies subscribers on error", async () => {
    const state = reactive({ fail: false });
    const ac = computedAsync(async () => {
      if (state.fail) throw new Error("boom");
      return "ok";
    });
    const cb = vi.fn();
    ac.subscribe(cb);

    await flush();
    cb.mockClear();
    state.fail = true;
    await flush();

    expect(cb).toHaveBeenCalled();
    expect(ac.error).toBeTruthy();
    ac.dispose();
  });

  // ── Race conditions ────────────────────────────────────────────────────────

  it("discards stale results — only last run wins", async () => {
    // Key: read the reactive dep synchronously so the effect tracks it,
    // then return a deferred promise that we control externally.
    const state = reactive({ id: 1 });
    const d1 = deferred<string>();
    const d2 = deferred<string>();
    const seen: string[] = [];

    const ac = computedAsync(async () => {
      const id = state.id; // sync read — tracked by effect
      return id === 1 ? d1.promise : d2.promise;
    });

    ac.subscribe(() => {
      if (!ac.loading && ac.value !== undefined) seen.push(ac.value as string);
    });

    await Promise.resolve(); // run 1 started, awaiting d1

    // Trigger run 2 — run 1 is still in-flight
    state.id = 2;
    await Promise.resolve(); // run 2 started, awaiting d2

    // Resolve stale run 1 — token mismatch, must be discarded
    d1.resolve("stale");
    await Promise.resolve();
    await Promise.resolve();
    expect(ac.value).toBeUndefined(); // run 2 still pending
    expect(seen).not.toContain("stale");

    // Resolve fresh run 2
    d2.resolve("fresh");
    await Promise.resolve();
    await Promise.resolve();
    expect(ac.value).toBe("fresh");
    expect(ac.loading).toBe(false);
    expect(seen).not.toContain("stale");
    ac.dispose();
  });

  it("discards stale errors — only last run error wins", async () => {
    const state = reactive({ id: 1 });
    const d1 = deferred<string>();
    const d2 = deferred<string>();

    const ac = computedAsync(async () => {
      const id = state.id; // sync read — tracked
      return id === 1 ? d1.promise : d2.promise;
    });

    await Promise.resolve(); // run 1 started

    state.id = 2;
    await Promise.resolve(); // run 2 started

    // Reject stale run 1 — should be ignored
    d1.reject(new Error("stale error"));
    await Promise.resolve();
    await Promise.resolve();
    expect(ac.error).toBeNull();

    // Resolve fresh run 2
    d2.resolve("fresh");
    await Promise.resolve();
    await Promise.resolve();
    expect(ac.value).toBe("fresh");
    expect(ac.error).toBeNull();
    ac.dispose();
  });

  it("handles rapid dependency changes — only last result applied", async () => {
    const state = reactive({ n: 0 });
    const ac = computedAsync(async () => state.n);

    for (let i = 1; i <= 5; i++) state.n = i;

    await flush();
    expect(ac.value).toBe(5);
    expect(ac.loading).toBe(false);
    ac.dispose();
  });

  it("concurrent updates settle to final state", async () => {
    const state = reactive({ value: 0 });
    const ac = computedAsync(async () => state.value);

    setTimeout(() => {
      state.value = 1;
    }, 10);
    setTimeout(() => {
      state.value = 2;
    }, 20);
    setTimeout(() => {
      state.value = 3;
    }, 30);

    vi.runAllTimers();
    await flush();

    expect(ac.loading).toBe(false);
    expect(ac.value).toBe(3);
    ac.dispose();
  });

  // ── Dispose ────────────────────────────────────────────────────────────────

  it("dispose stops re-runs on dependency change", async () => {
    const state = reactive({ x: 1 });
    const fn = vi.fn(async () => state.x);
    const ac = computedAsync(fn);

    await flush();
    const callCount = fn.mock.calls.length;

    ac.dispose();
    state.x = 99;
    await flush();

    expect(fn.mock.calls.length).toBe(callCount);
  });

  it("dispose prevents in-flight result from updating state", async () => {
    const d = deferred<number>();
    const ac = computedAsync(async () => d.promise);

    ac.dispose();
    d.resolve(999);
    await Promise.resolve();
    await Promise.resolve();

    expect(ac.value).toBeUndefined();
  });

  it("unsubscribe removes callback", async () => {
    const state = reactive({ v: 1 });
    const ac = computedAsync(async () => state.v);
    const cb = vi.fn();

    const unsubscribe = ac.subscribe(cb);
    await flush();
    cb.mockClear();

    unsubscribe();
    state.v = 2;
    await flush();

    expect(cb).not.toHaveBeenCalled();
    ac.dispose();
  });
});
