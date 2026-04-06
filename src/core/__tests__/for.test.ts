
import { describe, it, expect, beforeEach } from "vitest";
import { reactive } from "../reactive";
import { mount } from "../parser";

describe(":for directive", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should render a list of items", async () => {
    document.body.innerHTML = `
      <div id="app">
        <ul>
          <li :for="item in state.items">{{ item }}</li>
        </ul>
      </div>
    `;

    const state = reactive({ items: ["A", "B", "C"] });
    mount({ state });

    const lis = document.querySelectorAll("li");
    expect(lis.length).toBe(3);
    expect(lis[0].textContent).toBe("A");
    expect(lis[1].textContent).toBe("B");
    expect(lis[2].textContent).toBe("C");

    state.items.push("D");
    const lis2 = document.querySelectorAll("li");
    expect(lis2.length).toBe(4);
    expect(lis2[3].textContent).toBe("D");

    state.items = ["X"];
    const lis3 = document.querySelectorAll("li");
    expect(lis3.length).toBe(1);
    expect(lis3[0].textContent).toBe("X");
  });

  it("should support nested properties in :for", async () => {
    document.body.innerHTML = `
      <div id="app">
        <div :for="user in state.users" class="user">
          <span>{{ user.name }}</span>
        </div>
      </div>
    `;

    const state = reactive({
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" }
      ]
    });
    mount({ state });

    const users = document.querySelectorAll(".user");
    expect(users.length).toBe(2);
    expect(users[0].textContent?.trim()).toBe("Alice");
    expect(users[1].textContent?.trim()).toBe("Bob");

    state.users[0].name = "Alicia";
    expect(users[0].textContent?.trim()).toBe("Alicia");
  });
});
