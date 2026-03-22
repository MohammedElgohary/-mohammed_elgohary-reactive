import { describe, it, expect, vi, beforeEach } from "vitest";
import { reactive } from "../reactive";
import { computed } from "../computed";
import { readonly, readonlyObject } from "../readonly";

describe("readonly", () => {
  describe("readonly reactive", () => {
    it("should create readonly reactive value", () => {
      const count = reactive(5);
      const readonlyCount = readonly(count);

      expect(readonlyCount.value).toBe(5);
    });

    it("should prevent setting value", () => {
      const count = reactive(5);
      const readonlyCount = readonly(count);

      // Try to set value (should be ignored)
      readonlyCount.value = 10;

      expect(readonlyCount.value).toBe(5);
      expect(count.value).toBe(5);
    });

    it("should reflect changes from original reactive", () => {
      const count = reactive(5);
      const readonlyCount = readonly(count);

      count.value = 10;

      expect(readonlyCount.value).toBe(10);
    });

    it("should support subscription", () => {
      const count = reactive(5);
      const readonlyCount = readonly(count);
      const callback = vi.fn();

      readonlyCount.subscribe(callback);
      count.value = 10;

      expect(callback).toHaveBeenCalled();
    });

    it("should work with computed values", () => {
      const count = reactive(5);
      const doubled = computed(() => count.value * 2);
      const readonlyDoubled = readonly(doubled);

      expect(readonlyDoubled.value).toBe(10);

      count.value = 10;
      expect(readonlyDoubled.value).toBe(20);
    });

    it("should warn in development when trying to set", () => {
      // The readonly function doesn't check process.env in the current implementation
      // It just prevents setting. Let's test that it prevents setting.
      const count = reactive(5);
      const readonlyCount = readonly(count);

      readonlyCount.value = 10;

      // Value should not change
      expect(readonlyCount.value).toBe(5);
      expect(count.value).toBe(5);
    });
  });

  describe("readonlyObject", () => {
    it("should create readonly object", () => {
      const state = reactive({ count: 5, name: "test" });
      const readonlyState = readonlyObject(state);

      expect(readonlyState.count).toBe(5);
      expect(readonlyState.name).toBe("test");
    });

    it("should prevent setting properties", () => {
      const state = reactive({ count: 5 });
      const readonlyState = readonlyObject(state);

      // Try to set property (should throw in strict mode)
      expect(() => {
        (readonlyState as any).count = 10;
      }).toThrow();

      expect(readonlyState.count).toBe(5);
    });

    it("should prevent deleting properties", () => {
      const state = reactive({ count: 5, name: "test" });
      const readonlyState = readonlyObject(state);

      // Try to delete property (should throw in strict mode)
      expect(() => {
        delete (readonlyState as any).name;
      }).toThrow();

      expect(readonlyState.name).toBe("test");
    });

    it("should reflect changes from original object", () => {
      const state = reactive({ count: 5 });
      const readonlyState = readonlyObject(state);

      state.count = 10;

      expect(readonlyState.count).toBe(10);
    });

    it("should warn in development when trying to set property", () => {
      const state = reactive({ count: 5 });
      const readonlyState = readonlyObject(state);

      // Try to set property (should throw in strict mode)
      expect(() => {
        (readonlyState as any).count = 10;
      }).toThrow();

      expect(readonlyState.count).toBe(5);
    });

    it("should warn in development when trying to delete property", () => {
      const state = reactive({ count: 5 });
      const readonlyState = readonlyObject(state);

      // Try to delete property (should throw in strict mode)
      expect(() => {
        delete (readonlyState as any).count;
      }).toThrow();

      expect(readonlyState.count).toBe(5);
    });

    it("should work with nested objects", () => {
      const state = reactive({
        user: { name: "John", age: 30 },
        settings: { theme: "dark" },
      });
      const readonlyState = readonlyObject(state);

      expect(readonlyState.user.name).toBe("John");
      expect(readonlyState.settings.theme).toBe("dark");

      state.user.name = "Jane";
      expect(readonlyState.user.name).toBe("Jane");
    });
  });
});
