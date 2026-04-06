import { describe, it, expect, beforeEach } from "vitest";
import { reactive } from "../reactive";
import { mount } from "../parser";

describe("Comprehensive Parser Features", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("Structural Directives (:if / :for)", () => {
    it("should handle nested :for loops with scoped access", () => {
      document.body.innerHTML = `
        <div id="app">
          <div :for="category in state.categories" class="category">
            <h3>{{ category.name }}</h3>
            <ul>
              <li :for="item in category.items" class="item">
                {{ category.prefix }}: {{ item }}
              </li>
            </ul>
          </div>
        </div>
      `;

      const state = reactive({
        categories: [
          { name: "Fruits", prefix: "Fruit", items: ["Apple", "Banana"] },
          { name: "Vegetables", prefix: "Veg", items: ["Carrot"] },
        ],
      });

      mount({ state });

      const categories = document.querySelectorAll(".category");
      expect(categories.length).toBe(2);

      const firstItems = categories[0].querySelectorAll(".item");
      expect(firstItems.length).toBe(2);
      expect(firstItems[0].textContent?.trim()).toBe("Fruit: Apple");

      const secondItems = categories[1].querySelectorAll(".item");
      expect(secondItems.length).toBe(1);
      expect(secondItems[0].textContent?.trim()).toBe("Veg: Carrot");

      // Test reactivity in nested loop
      state.categories[0].items.push("Cherry");
      expect(categories[0].querySelectorAll(".item").length).toBe(3);
      expect(
        categories[0].querySelectorAll(".item")[2].textContent?.trim(),
      ).toBe("Fruit: Cherry");
    });

    it("should handle :if combined with :for", async () => {
      document.body.innerHTML = `
        <div id="app">
          <div :for="item in state.items" class="item">
            <span :if="item.visible">{{ item.name }}</span>
          </div>
        </div>
      `;

      const state = reactive({
        items: [
          { name: "A", visible: true },
          { name: "B", visible: false },
          { name: "C", visible: true },
        ],
      });

      mount({ state });

      const items = document.querySelectorAll(".item");
      expect(items.length).toBe(3);
      expect(items[0].querySelector("span")).not.toBeNull();
      expect(items[1].querySelector("span")).toBeNull();
      expect(items[2].querySelector("span")).not.toBeNull();

      state.items[1].visible = true;
      // Wait for batch update
      await new Promise(r => setTimeout(r, 50));
      
      expect(items[1].querySelector("span")).not.toBeNull();
      expect(items[1].querySelector("span")?.textContent).toBe("B");
    });
  });

  describe("Two-way Binding (:model)", () => {
    it("should handle :model with nested properties in :for", () => {
      document.body.innerHTML = `
        <div id="app">
          <div :for="user in state.users">
            <input :model="user.name" class="name-input">
          </div>
        </div>
      `;

      const state = reactive({
        users: [{ name: "Alice" }, { name: "Bob" }],
      });

      mount({ state });

      const inputs = document.querySelectorAll(
        ".name-input",
      ) as NodeListOf<HTMLInputElement>;
      expect(inputs[0].value).toBe("Alice");

      inputs[0].value = "Alicia";
      inputs[0].dispatchEvent(new Event("input"));

      expect(state.users[0].name).toBe("Alicia");
    });

    it("should handle :model.number and :model.trim modifiers", () => {
      document.body.innerHTML = `
        <div id="app">
          <input :model.number="state.age" id="age-input">
          <input :model.trim="state.username" id="user-input">
        </div>
      `;

      const state = reactive({ age: 25, username: "admin" });
      mount({ state });

      const ageInput = document.getElementById("age-input") as HTMLInputElement;
      const userInput = document.getElementById(
        "user-input",
      ) as HTMLInputElement;

      ageInput.value = "30";
      ageInput.dispatchEvent(new Event("input"));
      expect(state.age).toBe(30);
      expect(typeof state.age).toBe("number");

      userInput.value = "  spacer  ";
      userInput.dispatchEvent(new Event("input"));
      expect(state.username).toBe("spacer");
    });
  });

  describe("Event Handlers (@event)", () => {
    it("should handle events with scoped item in :for", () => {
      document.body.innerHTML = `
        <div id="app">
          <div :for="item in state.items">
            <button @click="item.count++" class="btn">{{ item.count }}</button>
          </div>
        </div>
      `;

      const state = reactive({
        items: [{ count: 0 }, { count: 10 }],
      });

      mount({ state });

      const buttons = document.querySelectorAll(".btn");
      buttons[0].dispatchEvent(new Event("click"));
      expect(state.items[0].count).toBe(1);
      expect(buttons[0].textContent).toBe("1");
    });

    it("should handle nested structural directives correctly", async () => {
      document.body.innerHTML = `
        <div id="app">
          <div :for="cat in state.categories" class="cat">
            <h2>{{ cat.name }}</h2>
            <div :for="item in cat.items" class="item">
              {{ item.name }}
            </div>
          </div>
        </div>
      `;

      const state = reactive({
        categories: [{ name: "C1", items: [{ name: "I1" }] }],
      });

      mount({ state });

      const cats = document.querySelectorAll(".cat");
      expect(cats.length).toBe(1);
      expect(cats[0].querySelector("h2")?.textContent).toBe("C1");

      const items = cats[0].querySelectorAll(".item");
      expect(items.length).toBe(1);
      expect(items[0].textContent?.trim()).toBe("I1");

      // Add new category
      state.categories.push({ name: "C2", items: [{ name: "I2" }] });
      await new Promise((r) => setTimeout(r, 0));

      const cats2 = document.querySelectorAll(".cat");
      expect(cats2.length).toBe(2);
      expect(cats2[1].querySelector("h2")?.textContent).toBe("C2");

      const items2 = cats2[1].querySelectorAll(".item");
      expect(items2.length).toBe(1);
      expect(items2[0].textContent?.trim()).toBe("I2");
    });
  });
});
