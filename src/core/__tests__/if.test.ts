import { describe, it, expect, beforeEach } from "vitest";
import { reactive } from "../reactive";
import { mount } from "../parser";

describe(":if directive", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should remove element when condition is false", async () => {
    document.body.innerHTML = `
      <div id="app">
        <div id="target" :if="state.show">Hello</div>
      </div>
    `;

    const state = reactive({ show: true });
    mount({ state });

    const target = document.getElementById("target");
    expect(target).not.toBeNull();
    expect(target?.textContent).toBe("Hello");

    state.show = false;
    expect(document.getElementById("target")).toBeNull();
    // Should have a placeholder (comment node)
    expect(document.getElementById("app")?.innerHTML).toContain(
      '<!-- :if="state.show" -->',
    );

    state.show = true;
    const restored = document.getElementById("target");
    expect(restored).not.toBeNull();
    expect(restored?.textContent).toBe("Hello");
  });

  it("should re-bind directives when condition becomes true again", async () => {
    document.body.innerHTML = `
      <div id="app">
        <div id="target" :if="state.show">
          <button id="btn" @click="state.count++">Increment</button>
          <span id="count">{{ state.count }}</span>
        </div>
      </div>
    `;

    const state = reactive({ show: true, count: 0 });
    mount({ state });

    const btn = document.getElementById("btn");
    const count = document.getElementById("count");
    expect(btn).not.toBeNull();
    expect(count?.textContent).toBe("0");

    btn?.click();
    expect(count?.textContent).toBe("1");

    state.show = false;
    expect(document.getElementById("target")).toBeNull();

    state.show = true;
    const restoredBtn = document.getElementById("btn");
    const restoredCount = document.getElementById("count");
    expect(restoredBtn).not.toBeNull();
    expect(restoredCount?.textContent).toBe("1");

    restoredBtn?.click();
    expect(restoredCount?.textContent).toBe("2");
  });
});
