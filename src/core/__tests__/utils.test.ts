import { describe, it, expect } from "vitest";
import { reactive } from "../reactive";
import { ref, toRaw, markRaw, isRaw, shallowReactive } from "../utils";

describe("utils", () => {
  describe("ref", () => {
    it("should create reactive primitive", () => {
      const count = ref(0);
      expect(count.value).toBe(0);
    });

    it("should be reactive", () => {
      const count = ref(0);
      count.value = 5;
      expect(count.value).toBe(5);
    });

    it("should work with different types", () => {
      const str = ref("hello");
      const bool = ref(true);
      const num = ref(42);

      expect(str.value).toBe("hello");
      expect(bool.value).toBe(true);
      expect(num.value).toBe(42);
    });

    it("should support subscription", () => {
      const count = ref(0);
      let called = false;

      count.subscribe(() => {
        called = true;
      });

      count.value = 5;
      expect(called).toBe(true);
    });
  });

  describe("toRaw", () => {
    it("should get raw value from reactive primitive", () => {
      const count = reactive(5);
      const raw = toRaw(count);
      expect(raw).toBe(5);
    });

    it("should return object as-is for reactive objects", () => {
      const obj = reactive({ count: 5 });
      const raw = toRaw(obj);
      expect(raw).toBe(obj);
    });

    it("should return non-reactive values as-is", () => {
      const num = 42;
      const str = "hello";
      const obj = { count: 5 };

      expect(toRaw(num)).toBe(num);
      expect(toRaw(str)).toBe(str);
      expect(toRaw(obj)).toBe(obj);
    });

    it("should handle null and undefined", () => {
      expect(toRaw(null)).toBe(null);
      expect(toRaw(undefined)).toBe(undefined);
    });
  });

  describe("markRaw and isRaw", () => {
    it("should mark object as raw", () => {
      const obj = { count: 5 };
      expect(isRaw(obj)).toBe(false);

      markRaw(obj);
      expect(isRaw(obj)).toBe(true);
    });

    it("should return the same object", () => {
      const obj = { count: 5 };
      const marked = markRaw(obj);
      expect(marked).toBe(obj);
    });

    it("should work with different object types", () => {
      const arr = [1, 2, 3];
      const map = new Map();
      const set = new Set();

      markRaw(arr);
      markRaw(map);
      markRaw(set);

      expect(isRaw(arr)).toBe(true);
      expect(isRaw(map)).toBe(true);
      expect(isRaw(set)).toBe(true);
    });

    it("should not affect unmarked objects", () => {
      const obj1 = { a: 1 };
      const obj2 = { b: 2 };

      markRaw(obj1);

      expect(isRaw(obj1)).toBe(true);
      expect(isRaw(obj2)).toBe(false);
    });
  });

  describe("shallowReactive", () => {
    it("should create reactive object", () => {
      const state = shallowReactive({ count: 0 });
      expect(state.count).toBe(0);
    });

    it("should be reactive at top level", () => {
      const state = shallowReactive({ count: 0 });
      state.count = 5;
      expect(state.count).toBe(5);
    });

    it("should work with nested objects", () => {
      const state = shallowReactive({
        user: { name: "John" },
        count: 0,
      });

      expect(state.user.name).toBe("John");
      expect(state.count).toBe(0);

      state.count = 5;
      expect(state.count).toBe(5);

      state.user.name = "Jane";
      expect(state.user.name).toBe("Jane");
    });

    it("should handle arrays", () => {
      const state = shallowReactive({ items: [1, 2, 3] });
      expect(state.items).toEqual([1, 2, 3]);

      state.items.push(4);
      expect(state.items).toEqual([1, 2, 3, 4]);
    });

    it("should handle complex nested structures", () => {
      const state = shallowReactive({
        user: {
          profile: {
            name: "John",
            age: 30,
          },
          settings: {
            theme: "dark",
          },
        },
      });

      expect(state.user.profile.name).toBe("John");
      state.user.profile.name = "Jane";
      expect(state.user.profile.name).toBe("Jane");
    });
  });

  describe("integration", () => {
    it("should work together - ref and toRaw", () => {
      const count = ref(5);
      const raw = toRaw(count);
      expect(raw).toBe(5);
    });

    it("should work together - markRaw and reactive", () => {
      const obj = { count: 5 };
      markRaw(obj);
      expect(isRaw(obj)).toBe(true);

      // Even if we make it reactive, the marker persists
      const reactiveObj = reactive(obj);
      expect(isRaw(obj)).toBe(true);
    });

    it("should work together - shallowReactive and toRaw", () => {
      const state = shallowReactive({ count: 5 });
      const raw = toRaw(state);
      expect(raw).toBe(state);
    });
  });
});
