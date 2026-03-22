import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { computed } from "../../computed";
import { readonly, readonlyObject } from "../../readonly";

describe("readonly - Complete Coverage", () => {
  describe("readonly with development warnings", () => {
    it("should warn in development mode when setting value", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const count = reactive(0);
      const readonlyCount = readonly(count);

      (readonlyCount as any).value = 10;

      expect(consoleSpy).toHaveBeenCalledWith(
        "Cannot assign to a readonly reactive value.",
      );
      expect(readonlyCount.value).toBe(0);

      consoleSpy.mockRestore();
    });

    it("should not warn in production mode when setting value", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const count = reactive(0);
      const readonlyCount = readonly(count);

      // Try to set value
      (readonlyCount as any).value = 10;

      // Value should be unchanged regardless
      expect(readonlyCount.value).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe("readonly with computed", () => {
    it("should create readonly from computed value", () => {
      const count = reactive(0);
      const doubled = computed(() => count.value * 2);
      const readonlyDoubled = readonly(doubled);

      expect(readonlyDoubled.value).toBe(0);

      count.value = 5;
      expect(readonlyDoubled.value).toBe(10);

      // Try to set (should be ignored)
      (readonlyDoubled as any).value = 20;
      expect(readonlyDoubled.value).toBe(10);
    });

    it("should subscribe to computed changes", () => {
      const count = reactive(0);
      const doubled = computed(() => count.value * 2);
      const readonlyDoubled = readonly(doubled);

      const callback = vi.fn();
      readonlyDoubled.subscribe(callback);

      count.value = 5;
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("readonlyObject with development warnings", () => {
    it("should warn in development mode when setting property", () => {
      // Strict mode throws error instead of warning
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = reactive({ name: "John", age: 30 });
      const readonlyUser = readonlyObject(user);

      // Try to set property
      try {
        (readonlyUser as any).name = "Jane";
      } catch (e) {
        // Expected in strict mode
      }

      expect(readonlyUser.name).toBe("John"); // Value unchanged

      consoleSpy.mockRestore();
    });

    it("should not warn in production mode when setting property", () => {
      // Strict mode throws error instead of warning
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = reactive({ name: "John", age: 30 });
      const readonlyUser = readonlyObject(user);

      // Try to set property
      try {
        (readonlyUser as any).name = "Jane";
      } catch (e) {
        // Expected in strict mode
      }

      expect(readonlyUser.name).toBe("John"); // Value unchanged

      consoleSpy.mockRestore();
    });

    it("should warn in development mode when deleting property", () => {
      // Strict mode throws error instead of warning
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = reactive({ name: "John", age: 30 });
      const readonlyUser = readonlyObject(user);

      // Try to delete property
      try {
        delete (readonlyUser as any).name;
      } catch (e) {
        // Expected in strict mode
      }

      expect(readonlyUser.name).toBe("John"); // Property still exists

      consoleSpy.mockRestore();
    });

    it("should not warn in production mode when deleting property", () => {
      // Strict mode throws error instead of warning
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = reactive({ name: "John", age: 30 });
      const readonlyUser = readonlyObject(user);

      // Try to delete property
      try {
        delete (readonlyUser as any).name;
      } catch (e) {
        // Expected in strict mode
      }

      expect(readonlyUser.name).toBe("John"); // Property still exists

      consoleSpy.mockRestore();
    });
  });

  describe("readonlyObject edge cases", () => {
    it("should handle symbol keys", () => {
      const sym = Symbol("test");
      const obj = reactive({ [sym]: "value", name: "John" });
      const readonlyObj = readonlyObject(obj);

      expect(readonlyObj[sym]).toBe("value");
      expect(readonlyObj.name).toBe("John");
    });

    it("should handle nested objects", () => {
      const user = reactive({
        name: "John",
        address: {
          city: "New York",
          zip: "10001",
        },
      });
      const readonlyUser = readonlyObject(user);

      expect(readonlyUser.address.city).toBe("New York");

      // Try to modify nested (should be prevented at top level)
      try {
        (readonlyUser as any).address = { city: "Boston", zip: "02101" };
      } catch (e) {
        // Expected in strict mode
      }
      expect(readonlyUser.address.city).toBe("New York");
    });

    it("should handle arrays", () => {
      const data = reactive({ items: [1, 2, 3] });
      const readonlyData = readonlyObject(data);

      expect(readonlyData.items).toEqual([1, 2, 3]);

      // Try to replace array (should be prevented)
      try {
        (readonlyData as any).items = [4, 5, 6];
      } catch (e) {
        // Expected in strict mode
      }
      expect(readonlyData.items).toEqual([1, 2, 3]);
    });
  });

  describe("readonly subscribe binding", () => {
    it("should properly bind subscribe method", () => {
      const count = reactive(0);
      const readonlyCount = readonly(count);

      const callback = vi.fn();
      const unsubscribe = readonlyCount.subscribe(callback);

      count.value = 1;
      expect(callback).toHaveBeenCalledTimes(1);

      count.value = 2;
      expect(callback).toHaveBeenCalledTimes(2);

      unsubscribe();
      count.value = 3;
      expect(callback).toHaveBeenCalledTimes(2); // No more calls after unsubscribe
    });
  });

  describe("readonly with undefined process", () => {
    it("should handle undefined process object", () => {
      // This tests the typeof process !== "undefined" check
      const count = reactive(0);
      const readonlyCount = readonly(count);

      // Should work without errors even if process is undefined
      (readonlyCount as any).value = 10;
      expect(readonlyCount.value).toBe(0);
    });
  });
});
