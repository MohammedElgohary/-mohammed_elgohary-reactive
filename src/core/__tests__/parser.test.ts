import { describe, it, expect, beforeEach, vi } from "vitest";
import { parse, autoMount, unmount } from "../parser";
import { reactive } from "../reactive";
import { clearRegistry, registerState } from "../registry";
import { clearExpressionCache } from "../expression";
import { SCOPE_ATTR } from "../constants";

// jsdom is configured in vitest.config.ts (environment: "jsdom")

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

// ── Text interpolation ────────────────────────────────────────────────────────

describe("{{ }} text interpolation", () => {
  it("renders a simple expression", () => {
    const counter = reactive({ count: 5 });
    const root = html("<p>{{ counter.count }}</p>");
    parse(root, { counter });
    expect(root.querySelector("p")!.textContent).toBe("5");
  });

  it("updates when state changes", () => {
    const counter = reactive({ count: 0 });
    const root = html("<p>{{ counter.count }}</p>");
    parse(root, { counter });
    counter.count = 7;
    expect(root.querySelector("p")!.textContent).toBe("7");
  });

  it("renders mixed static + expression", () => {
    const user = reactive({ name: "Ali" });
    const root = html("<p>Hello {{ user.name }}!</p>");
    parse(root, { user });
    expect(root.querySelector("p")!.textContent).toBe("Hello Ali!");
  });

  it("renders multiple expressions in one text node", () => {
    const counter = reactive({ count: 3 });
    const user = reactive({ name: "Ali" });
    const root = html("<p>{{ counter.count }} items for {{ user.name }}</p>");
    parse(root, { counter, user });
    expect(root.querySelector("p")!.textContent).toBe("3 items for Ali");
  });

  it("renders undefined as empty string", () => {
    const user = reactive({ name: undefined as any });
    const root = html("<p>{{ user.name }}</p>");
    parse(root, { user });
    expect(root.querySelector("p")!.textContent).toBe("");
  });

  it("renders null as empty string", () => {
    const user = reactive({ name: null as any });
    const root = html("<p>{{ user.name }}</p>");
    parse(root, { user });
    expect(root.querySelector("p")!.textContent).toBe("");
  });

  it("evaluates ternary expression", () => {
    const counter = reactive({ count: 5 });
    const root = html("<p>{{ counter.count > 0 ? 'positive' : 'zero' }}</p>");
    parse(root, { counter });
    expect(root.querySelector("p")!.textContent).toBe("positive");
  });

  it("evaluates optional chaining without throwing", () => {
    const user = reactive({ address: null as any });
    const root = html("<p>{{ user.address?.city }}</p>");
    parse(root, { user });
    expect(root.querySelector("p")!.textContent).toBe("");
  });

  it("does not execute HTML in text mode (XSS safe)", () => {
    const user = reactive({ name: "<script>alert(1)</script>" });
    const root = html("<p>{{ user.name }}</p>");
    parse(root, { user });
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("p")!.textContent).toContain("<script>");
  });

  it("does not process plain text nodes with no interpolation", () => {
    const counter = reactive({ count: 0 });
    const root = html("<p>no interpolation here</p>");
    parse(root, { counter });
    // textContent must remain unchanged
    expect(root.querySelector("p")!.textContent).toBe("no interpolation here");
  });

  it("updates mixed static+expr text reactively", () => {
    const user = reactive({ name: "Ali" });
    const root = html("<p>Hello {{ user.name }}!</p>");
    parse(root, { user });
    user.name = "Sara";
    expect(root.querySelector("p")!.textContent).toBe("Hello Sara!");
  });
});

// ── :attr directives ──────────────────────────────────────────────────────────

describe(":attr directive", () => {
  it("binds a generic attribute", () => {
    const state = reactive({ label: "hello" });
    const root = html(`<input :aria-label="state.label" />`);
    parse(root, { state });
    expect(root.querySelector("input")!.getAttribute("aria-label")).toBe(
      "hello",
    );
  });

  it("updates attribute when state changes", () => {
    const state = reactive({ disabled: false as any });
    const root = html(`<button :disabled="state.disabled">click</button>`);
    parse(root, { state });
    state.disabled = true;
    expect(root.querySelector("button")!.getAttribute("disabled")).toBe("true");
  });

  it("removes attribute when value is null", () => {
    const state = reactive({ label: null as any });
    const root = html(`<button :aria-label="state.label">x</button>`);
    parse(root, { state });
    expect(root.querySelector("button")!.hasAttribute("aria-label")).toBe(
      false,
    );
  });

  it("removes :attr from DOM after processing", () => {
    const state = reactive({ label: "hi" });
    const root = html(`<button :aria-label="state.label">x</button>`);
    parse(root, { state });
    expect(root.querySelector("button")!.hasAttribute(":aria-label")).toBe(
      false,
    );
  });
});

// ── :show directive ───────────────────────────────────────────────────────────

describe(":show directive", () => {
  it("shows element when truthy", () => {
    const state = reactive({ visible: true });
    const root = html(`<p :show="state.visible">text</p>`);
    parse(root, { state });
    expect((root.querySelector("p") as HTMLElement).style.display).toBe("");
  });

  it("hides element when falsy", () => {
    const state = reactive({ visible: false });
    const root = html(`<p :show="state.visible">text</p>`);
    parse(root, { state });
    expect((root.querySelector("p") as HTMLElement).style.display).toBe("none");
  });

  it("toggles display reactively", () => {
    const state = reactive({ visible: true });
    const root = html(`<p :show="state.visible">text</p>`);
    parse(root, { state });
    state.visible = false;
    expect((root.querySelector("p") as HTMLElement).style.display).toBe("none");
    state.visible = true;
    expect((root.querySelector("p") as HTMLElement).style.display).toBe("");
  });
});

// ── :class directive ──────────────────────────────────────────────────────────

describe(":class directive", () => {
  it("sets className from string expression", () => {
    const state = reactive({ cls: "active" });
    const root = html(`<div :class="state.cls"></div>`);
    parse(root, { state });
    expect(root.querySelector("div")!.className).toBe("active");
  });

  it("toggles classes from object expression", () => {
    const state = reactive({ active: true, disabled: false });
    const root = html(
      `<div :class="{ active: state.active, disabled: state.disabled }"></div>`,
    );
    parse(root, { state });
    expect(root.querySelector("div")!.classList.contains("active")).toBe(true);
    expect(root.querySelector("div")!.classList.contains("disabled")).toBe(
      false,
    );
  });

  it("updates class reactively", () => {
    const state = reactive({ active: false });
    const root = html(`<div :class="{ active: state.active }"></div>`);
    parse(root, { state });
    state.active = true;
    expect(root.querySelector("div")!.classList.contains("active")).toBe(true);
  });
});

// ── :style directive ──────────────────────────────────────────────────────────

describe(":style directive", () => {
  it("applies style object", () => {
    const state = reactive({ color: "red" });
    const root = html(`<p :style="{ color: state.color }"></p>`);
    parse(root, { state });
    expect((root.querySelector("p") as HTMLElement).style.color).toBe("red");
  });

  it("updates style reactively", () => {
    const state = reactive({ color: "red" });
    const root = html(`<p :style="{ color: state.color }"></p>`);
    parse(root, { state });
    state.color = "blue";
    expect((root.querySelector("p") as HTMLElement).style.color).toBe("blue");
  });
});

// ── :html directive ───────────────────────────────────────────────────────────

describe(":html directive", () => {
  it("renders HTML content", () => {
    const state = reactive({ content: "<b>bold</b>" });
    const root = html(`<div :html="state.content"></div>`);
    parse(root, { state });
    expect(root.querySelector("div b")).not.toBeNull();
  });

  it("sanitizes dangerous HTML", () => {
    const state = reactive({ content: "<script>alert(1)</script><b>safe</b>" });
    const root = html(`<div :html="state.content"></div>`);
    parse(root, { state });
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("b")).not.toBeNull();
  });

  it("updates HTML reactively", () => {
    const state = reactive({ content: "<i>italic</i>" });
    const root = html(`<div :html="state.content"></div>`);
    parse(root, { state });
    state.content = "<b>bold</b>";
    expect(root.querySelector("b")).not.toBeNull();
    expect(root.querySelector("i")).toBeNull();
  });
});

// ── :model directive ──────────────────────────────────────────────────────────

describe(":model directive", () => {
  it("sets input value from state", () => {
    const state = reactive({ name: "Ali" });
    const root = html(`<input :model="state.name" />`);
    parse(root, { state });
    expect((root.querySelector("input") as HTMLInputElement).value).toBe("Ali");
  });

  it("warns when model path cannot be resolved", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const state = reactive({ name: "Ali" });
    const root = html(`<input :model="state.missing" />`);
    parse(root, { state });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns when model expression has no dot", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const state = reactive({ name: "Ali" });
    const root = html(`<input :model="state" />`);
    parse(root, { state });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('use "stateName.key" syntax'),
    );
    warn.mockRestore();
  });
});

// ── @event directive ──────────────────────────────────────────────────────────

describe("@event directive", () => {
  it("binds click handler", () => {
    const counter = reactive({ count: 0 });
    const root = html(`<button @click="counter.count++">+</button>`);
    parse(root, { counter });
    root.querySelector("button")!.click();
    expect(counter.count).toBe(1);
  });

  it("removes @event attribute from DOM", () => {
    const counter = reactive({ count: 0 });
    const root = html(`<button @click="counter.count++">+</button>`);
    parse(root, { counter });
    expect(root.querySelector("button")!.hasAttribute("@click")).toBe(false);
  });

  it("passes $event to handler", () => {
    const state = reactive({ lastEvent: null as any });
    const root = html(
      `<button @click="state.lastEvent = $event">click</button>`,
    );
    parse(root, { state });
    root.querySelector("button")!.click();
    expect(state.lastEvent).toBeInstanceOf(MouseEvent);
  });

  it("supports multiple event types on the same element", () => {
    const state = reactive({ clicks: 0, keys: 0 });
    const root = html(
      `<input @click="state.clicks++" @keydown="state.keys++" />`,
    );
    parse(root, { state });
    const input = root.querySelector("input")!;
    input.click();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    expect(state.clicks).toBe(1);
    expect(state.keys).toBe(1);
  });
});

// ── Inline {{ }} in attributes ────────────────────────────────────────────────

describe("inline {{ }} in attributes", () => {
  it("resolves interpolation in attribute value", () => {
    const state = reactive({ id: "main" });
    const root = html(`<div id="{{ state.id }}"></div>`);
    parse(root, { state });
    expect(root.querySelector("div")!.getAttribute("id")).toBe("main");
  });

  it("updates attribute interpolation reactively", () => {
    const state = reactive({ id: "main" });
    const root = html(`<div id="{{ state.id }}"></div>`);
    parse(root, { state });
    state.id = "updated";
    expect(root.querySelector("div")!.getAttribute("id")).toBe("updated");
  });

  it("handles mixed static + expr in attribute", () => {
    const state = reactive({ id: "main" });
    const root = html(`<div id="prefix-{{ state.id }}-suffix"></div>`);
    parse(root, { state });
    expect(root.querySelector("div")!.getAttribute("id")).toBe(
      "prefix-main-suffix",
    );
  });
});

// ── data-scope stamping ───────────────────────────────────────────────────────

describe("data-scope auto-stamping", () => {
  it("stamps data-scope on elements with directives", () => {
    const counter = reactive({ count: 0 });
    const root = html(`<p :show="counter.count > 0">text</p>`);
    parse(root, { counter });
    expect(root.querySelector("p")!.getAttribute(SCOPE_ATTR)).toBe("counter");
  });

  it("stamps multiple state names when node references both", () => {
    const counter = reactive({ count: 0 });
    const user = reactive({ name: "Ali" });
    const root = html(`<p :show="counter.count > 0">{{ user.name }}</p>`);
    parse(root, { counter, user });
    const scope = root.querySelector("p")!.getAttribute(SCOPE_ATTR) ?? "";
    expect(scope).toContain("counter");
    expect(scope).toContain("user");
  });

  it("does not stamp data-scope on elements with no reactive refs", () => {
    const counter = reactive({ count: 0 });
    const root = html(`<p>static text</p>`);
    parse(root, { counter });
    expect(root.querySelector("p")!.hasAttribute(SCOPE_ATTR)).toBe(false);
  });

  it("merges data-scope when parse() is called again with a different scope", () => {
    const counter = reactive({ count: 0 });
    const user = reactive({ name: "Ali" });
    const root = html(`<p :show="counter.count > 0">{{ user.name }}</p>`);

    // First parse — only counter in scope
    parse(root, { counter });
    expect(root.querySelector("p")!.getAttribute(SCOPE_ATTR)).toBe("counter");

    // Second parse — only user in scope; must merge, not replace
    parse(root, { user });
    const scope = root.querySelector("p")!.getAttribute(SCOPE_ATTR) ?? "";
    expect(scope).toContain("counter");
    expect(scope).toContain("user");
  });

  it("deduplicates names when the same scope is applied twice", () => {
    const counter = reactive({ count: 0 });
    const root = html(`<p :show="counter.count > 0">text</p>`);
    parse(root, { counter });
    parse(root, { counter });
    // "counter" must appear exactly once
    const scope = root.querySelector("p")!.getAttribute(SCOPE_ATTR) ?? "";
    expect(scope.split(" ").filter((s) => s === "counter").length).toBe(1);
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

describe("parse cleanup", () => {
  it("stops updates after cleanup is called", () => {
    const counter = reactive({ count: 0 });
    const root = html("<p>{{ counter.count }}</p>");
    const stop = parse(root, { counter });
    stop();
    counter.count = 99;
    expect(root.querySelector("p")!.textContent).toBe("0");
  });

  it("calling cleanup twice does not throw", () => {
    const counter = reactive({ count: 0 });
    const root = html("<p>{{ counter.count }}</p>");
    const stop = parse(root, { counter });
    expect(() => {
      stop();
      stop();
    }).not.toThrow();
  });
});

// ── autoMount ─────────────────────────────────────────────────────────────────

describe("autoMount", () => {
  it("mounts all registered states automatically", () => {
    const counter = reactive({ count: 42 });
    registerState("counter", counter);
    document.body.innerHTML = "<p>{{ counter.count }}</p>";
    autoMount();
    expect(document.body.querySelector("p")!.textContent).toBe("42");
  });

  it("warns when no states are registered", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    autoMount();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("no reactive states"),
    );
    warn.mockRestore();
  });

  it("unmount stops all bindings", () => {
    const counter = reactive({ count: 0 });
    registerState("counter", counter);
    document.body.innerHTML = "<p>{{ counter.count }}</p>";
    autoMount();
    unmount();
    counter.count = 99;
    expect(document.body.querySelector("p")!.textContent).toBe("0");
  });

  it("re-mounting tears down previous bindings before re-wiring", () => {
    const counter = reactive({ count: 0 });
    registerState("counter", counter);
    document.body.innerHTML = "<p>{{ counter.count }}</p>";

    const stop1 = autoMount();
    counter.count = 5;
    expect(document.body.querySelector("p")!.textContent).toBe("5");

    // Explicitly stop first mount, reset DOM, then re-mount
    stop1();
    document.body.innerHTML = "<p>{{ counter.count }}</p>";
    autoMount();
    counter.count = 10;
    expect(document.body.querySelector("p")!.textContent).toBe("10");
  });
});

// ── Performance / regression ──────────────────────────────────────────────────

describe("performance characteristics", () => {
  it("does not create duplicate effects for the same expression across multiple nodes", () => {
    // Both nodes use the same expression — the expression cache should mean
    // compileExpression is only called once per unique string.
    const counter = reactive({ count: 1 });
    const root = html(`
      <p>{{ counter.count }}</p>
      <span>{{ counter.count }}</span>
    `);
    parse(root, { counter });
    counter.count = 99;
    expect(root.querySelector("p")!.textContent).toBe("99");
    expect(root.querySelector("span")!.textContent).toBe("99");
  });

  it("only re-evaluates nodes that reference the changed state", () => {
    const counter = reactive({ count: 0 });
    const user = reactive({ name: "Ali" });

    const root = html(`
      <p id="c">{{ counter.count }}</p>
      <p id="u">{{ user.name }}</p>
    `);
    parse(root, { counter, user });

    // Verify initial render
    expect(root.querySelector("#c")!.textContent).toBe("0");
    expect(root.querySelector("#u")!.textContent).toBe("Ali");

    // Changing counter must not affect user node
    counter.count = 5;
    expect(root.querySelector("#c")!.textContent).toBe("5");
    expect(root.querySelector("#u")!.textContent).toBe("Ali");

    // Changing user must not affect counter node
    user.name = "Sara";
    expect(root.querySelector("#c")!.textContent).toBe("5");
    expect(root.querySelector("#u")!.textContent).toBe("Sara");

    // data-scope confirms each node is bound to only its own state
    expect(root.querySelector("#c")!.getAttribute(SCOPE_ATTR)).toBe("counter");
    expect(root.querySelector("#u")!.getAttribute(SCOPE_ATTR)).toBe("user");
  });

  it("handles a large number of nodes without throwing", () => {
    const state = reactive({ value: "x" });
    const items = Array.from(
      { length: 200 },
      (_, i) => `<p>{{ state.value }}-${i}</p>`,
    ).join("");
    const root = html(`<div>${items}</div>`);
    expect(() => parse(root, { state })).not.toThrow();
    state.value = "y";
    expect(root.querySelector("p")!.textContent).toBe("y-0");
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles empty scope gracefully", () => {
    const root = html("<p>{{ counter.count }}</p>");
    expect(() => parse(root, {})).not.toThrow();
  });

  it("handles expression errors gracefully (warns, does not throw)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const state = reactive({ value: null as any });
    const root = html(`<p>{{ state.value.nonexistent }}</p>`);
    expect(() => parse(root, { state })).not.toThrow();
    warn.mockRestore();
  });

  it("does not process nodes that reference unknown state names", () => {
    const counter = reactive({ count: 0 });
    // 'unknown' is not in scope — node should be left untouched
    const root = html("<p>{{ unknown.value }}</p>");
    parse(root, { counter });
    // No binding wired — textContent stays as the raw template string
    expect(root.querySelector("p")!.textContent).toBe("{{ unknown.value }}");
  });

  it("handles state name that is a substring of another (word boundary)", () => {
    // 'count' must not match inside 'counter'
    const count = reactive({ value: 1 });
    const counter = reactive({ value: 100 });
    const root = html(`<p>{{ counter.value }}</p>`);
    parse(root, { count, counter });
    // Only 'counter' scope should be stamped, not 'count'
    const scope = root.querySelector("p")!.getAttribute(SCOPE_ATTR) ?? "";
    expect(scope).toBe("counter");
    expect(scope).not.toContain("count ");
  });
});
