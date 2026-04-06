import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { reactive } from "../reactive";
import { unmount } from "../parser";
import { clearRegistry } from "../registry";

describe("Automatic Zero-config Mounting", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    clearRegistry();
    // Mock window to simulate global variables
    (window as any).counter = undefined;
  });

  afterEach(() => {
    unmount();
    delete (window as any).counter;
  });

  it("should automatically mount when reactive() is called if assigned to window", async () => {
    // 1. Define a reactive object and assign it to window (simulating a global script)
    const counter = reactive({ count: 42 });
    (window as any).counter = counter;

    // 2. Add some HTML with interpolation
    document.body.innerHTML = "<p>{{ counter.count }}</p>";

    // 3. Wait for the microtask scheduled by reactive() to run
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    // 4. Verify the DOM was parsed automatically
    expect(document.body.querySelector("p")!.textContent).toBe("42");

    // 5. Verify it is reactive
    counter.count = 100;
    expect(document.body.querySelector("p")!.textContent).toBe("100");
  });

  it("should handle multiple reactive objects automatically", async () => {
    const counter = reactive({ count: 1 });
    const user = reactive({ name: "Ali" });
    (window as any).counter = counter;
    (window as any).user = user;

    document.body.innerHTML = "<div>{{ user.name }}: {{ counter.count }}</div>";

    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    expect(document.body.querySelector("div")!.textContent).toBe("Ali: 1");

    counter.count++;
    user.name = "Sara";
    expect(document.body.querySelector("div")!.textContent).toBe("Sara: 2");
  });

  it("should fail if assigned with const (not on window)", async () => {
    // This simulates 'const x = reactive()' in a script tag (not a module)
    // In actual browsers, this doesn't land on 'window'
    reactive({ value: 1 });
    // Not assigning to window!

    document.body.innerHTML = "<span>{{ myState.value }}</span>";
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    // Should NOT be parsed because myState is not in registry
    expect(document.body.querySelector("span")!.textContent).toBe(
      "{{ myState.value }}",
    );
  });

  it("should work with var (on window)", async () => {
    // This simulates 'var x = reactive()'
    const myStateVar = reactive({ value: 1 });
    (window as any).myStateVar = myStateVar;

    document.body.innerHTML = "<span>{{ myStateVar.value }}</span>";
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    expect(document.body.querySelector("span")!.textContent).toBe("1");
    delete (window as any).myStateVar;
  });

  it("should be able to call global functions in event handlers", async () => {
    // 1. Define a global function (simulating a script tag)
    const spy = vi.fn();
    (window as any).myGlobalFn = spy;

    // 2. Define a reactive state to trigger autoMount
    const state = reactive({ count: 0 });
    (window as any).state = state;

    // 3. HTML with @click calling the global function
    document.body.innerHTML = '<button @click="myGlobalFn()">Click</button>';

    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    const btn = document.body.querySelector("button")!;
    btn.click();

    expect(spy).toHaveBeenCalled();
    delete (window as any).myGlobalFn;
  });

  it("should support @click=fn (function name without parens)", async () => {
    const spy = vi.fn();
    (window as any).myHandler = spy;

    const state = reactive({ count: 0 });
    (window as any).state = state;

    document.body.innerHTML = '<button @click="myHandler">Click</button>';

    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    const btn = document.body.querySelector("button")!;
    btn.click();

    expect(spy).toHaveBeenCalled();
    delete (window as any).myHandler;
  });

  it("should automatically discover global functions", async () => {
    const myGlobalFn = () => {};
    (window as any).myGlobalFn = myGlobalFn;

    // Trigger discovery via reactive()
    reactive({});

    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    // Should be registered in data-scope
    document.body.innerHTML = '<div @click="myGlobalFn()"></div>';
    // Re-trigger discovery
    reactive({});
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    expect(
      document.body.querySelector("div")!.getAttribute("data-scope"),
    ).toContain("myGlobalFn");

    delete (window as any).myGlobalFn;
  });
});
