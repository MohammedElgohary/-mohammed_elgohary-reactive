import { describe, it, expect, beforeEach, vi } from "vitest";
import { parse } from "../parser";
import { reactive } from "../reactive";
import { clearRegistry } from "../registry";
import { clearExpressionCache } from "../expression";

function html(markup: string): HTMLElement {
  const div = document.createElement("div");
  div.innerHTML = markup;
  document.body.appendChild(div);
  return div;
}

beforeEach(() => {
  document.body.innerHTML = "";
  clearRegistry();
  clearExpressionCache();
});

describe("Event Modifiers", () => {
  it("supports .prevent modifier", () => {
    const state = reactive({ count: 0 });
    const root = html(
      `<form @submit.prevent="state.count++"><button type="submit">Submit</button></form>`,
    );
    parse(root, { state });

    const form = root.querySelector("form")!;
    const event = new window.Event("submit", { cancelable: true });
    const preventSpy = vi.spyOn(event, "preventDefault");

    form.dispatchEvent(event);
    expect(state.count).toBe(1);
    expect(preventSpy).toHaveBeenCalled();
  });

  it("supports .stop modifier", () => {
    const state = reactive({ parent: 0, child: 0 });
    const root = html(`
      <div @click="state.parent++">
        <button id="child" @click.stop="state.child++">Click</button>
      </div>
    `);
    parse(root, { state });

    const child = root.querySelector("#child")!;
    child.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

    expect(state.child).toBe(1);
    expect(state.parent).toBe(0);
  });

  it("supports .self modifier", () => {
    const state = reactive({ count: 0 });
    const root = html(`
      <div id="parent" @click.self="state.count++">
        <button id="child">Child</button>
      </div>
    `);
    parse(root, { state });

    const parent = root.querySelector("#parent")!;
    const child = root.querySelector("#child")!;

    child.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(state.count).toBe(0);

    parent.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(state.count).toBe(1);
  });
});

describe("Event Debouncing", () => {
  it("supports @event.debounce.300 modifier (unified dot-syntax)", async () => {
    vi.useFakeTimers();
    const state = reactive({ count: 0 });
    const root = html(
      `<button @click.debounce.300="state.count++">Click</button>`,
    );
    parse(root, { state });

    const btn = root.querySelector("button")!;
    btn.click();
    btn.click();
    btn.click();

    expect(state.count).toBe(0);

    vi.advanceTimersByTime(300);
    expect(state.count).toBe(1);
    vi.useRealTimers();
  });

  it("supports :model.debounce.500 modifier", async () => {
    vi.useFakeTimers();
    const state = reactive({ filters: { search: "" } });
    const root = html(`<input :model.debounce.500="state.filters.search" />`);
    parse(root, { state });

    const input = root.querySelector("input")!;
    input.value = "hello";
    input.dispatchEvent(new window.Event("input"));

    expect(state.filters.search).toBe("");

    vi.advanceTimersByTime(500);
    expect(state.filters.search).toBe("hello");
    vi.useRealTimers();
  });

  it("supports @click.prevent.debounce.300 combined modifiers", async () => {
    vi.useFakeTimers();
    const state = reactive({ count: 0 });
    const root = html(
      `<form @submit.prevent.debounce.300="state.count++"><button type="submit">Submit</button></form>`,
    );
    parse(root, { state });

    const form = root.querySelector("form")!;
    const event = new window.Event("submit", { cancelable: true });
    const preventSpy = vi.spyOn(event, "preventDefault");

    form.dispatchEvent(event);

    // preventDefault MUST be called immediately/synchronously
    expect(preventSpy).toHaveBeenCalled();
    expect(state.count).toBe(0);

    // Handler itself is debounced
    vi.advanceTimersByTime(300);
    expect(state.count).toBe(1);
    vi.useRealTimers();
  });

  it("supports :model.number modifier", () => {
    const state = reactive({ age: 0 });
    const root = html(`<input type="text" :model.number="state.age" />`);
    parse(root, { state });

    const input = root.querySelector("input")!;
    input.value = "25";
    input.dispatchEvent(new window.Event("input"));

    expect(state.age).toBe(25);
    expect(typeof state.age).toBe("number");
  });

  it("supports :model.trim modifier", () => {
    const state = reactive({ name: "" });
    const root = html(`<input type="text" :model.trim="state.name" />`);
    parse(root, { state });

    const input = root.querySelector("input")!;
    input.value = "  hello  ";
    input.dispatchEvent(new window.Event("input"));

    expect(state.name).toBe("hello");
  });
});

describe("Key Modifiers", () => {
  it("supports @keydown.enter modifier", () => {
    const state = reactive({ count: 0 });
    const root = html(`<input @keydown.enter="state.count++" />`);
    parse(root, { state });

    const input = root.querySelector("input")!;

    // Non-enter key
    input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "a" }));
    expect(state.count).toBe(0);

    // Enter key
    input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
    expect(state.count).toBe(1);
  });

  it("supports @keydown.esc modifier", () => {
    const state = reactive({ count: 0 });
    const root = html(`<input @keydown.esc="state.count++" />`);
    parse(root, { state });

    const input = root.querySelector("input")!;

    input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    expect(state.count).toBe(1);
  });
});
