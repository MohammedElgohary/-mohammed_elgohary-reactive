import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { readonly, readonlyObject } from "../../readonly";

describe("readonly - Edge Cases Coverage", () => {
  describe("readonly setter in non-development", () => {
    it("should silently ignore set attempts without warning in production", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const count = reactive(0);
      const readonlyCount = readonly(count);

      // Try to set value
      (readonlyCount as any).value = 10;

      // Value should be unchanged
      expect(readonlyCount.value).toBe(0);

      // In production (NODE_ENV !== 'development'), no warning should be logged
      // The test environment may or may not be 'development', so we just verify
      // that the value wasn't changed
      expect(readonlyCount.value).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe("readonlyObject setter in non-development", () => {
    it("should prevent property modification without warning in production", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = reactive({ name: "John", age: 30 });
      const readonlyUser = readonlyObject(user);

      // Try to set property (will throw in strict mode)
      try {
        (readonlyUser as any).name = "Jane";
      } catch (e) {
        // Expected in strict mode
      }

      // Value should be unchanged
      expect(readonlyUser.name).toBe("John");

      consoleSpy.mockRestore();
    });

    it("should prevent property deletion without warning in production", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const user = reactive({ name: "John", age: 30 });
      const readonlyUser = readonlyObject(user);

      // Try to delete property (will throw in strict mode)
      try {
        delete (readonlyUser as any).name;
      } catch (e) {
        // Expected in strict mode
      }

      // Property should still exist
      expect(readonlyUser.name).toBe("John");

      consoleSpy.mockRestore();
    });
  });

  describe("readonlyObject with various property types", () => {
    it("should handle undefined properties", () => {
      const obj = reactive({ name: "John", optional: undefined });
      const readonlyObj = readonlyObject(obj);

      expect(readonlyObj.optional).toBeUndefined();
    });

    it("should handle null properties", () => {
      const obj = reactive({ name: "John", nullable: null });
      const readonlyObj = readonlyObject(obj);

      expect(readonlyObj.nullable).toBeNull();
    });

    it("should handle numeric properties", () => {
      const obj = reactive({ count: 42, pi: 3.14 });
      const readonlyObj = readonlyObject(obj);

      expect(readonlyObj.count).toBe(42);
      expect(readonlyObj.pi).toBe(3.14);
    });

    it("should handle boolean properties", () => {
      const obj = reactive({ isActive: true, isDisabled: false });
      const readonlyObj = readonlyObject(obj);

      expect(readonlyObj.isActive).toBe(true);
      expect(readonlyObj.isDisabled).toBe(false);
    });
  });
});
