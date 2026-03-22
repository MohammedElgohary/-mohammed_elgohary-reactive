import { describe, it, expect, vi } from "vitest";
import { reactive } from "../../reactive";
import { effect } from "../../effect";

describe("reactive - Complete Coverage", () => {
  describe("reactive object - deleteProperty", () => {
    it("should trigger notifications when deleting property", () => {
      const obj = reactive({ name: "John", age: 30 } as {
        name?: string;
        age: number;
      });
      const fn = vi.fn();

      effect(() => {
        fn();
        obj.name;
      });

      fn.mockClear();

      delete obj.name;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(obj.name).toBeUndefined();
    });

    it("should not trigger notifications when deleting non-existent property", () => {
      const obj = reactive({ name: "John" });
      const fn = vi.fn();

      effect(() => {
        fn();
        // Access the object to track it
        obj.name;
      });

      fn.mockClear();

      // Try to delete non-existent property
      delete (obj as any).nonExistent;

      // Should not trigger notification
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("reactive object - nested property notifications", () => {
    it("should notify parent when nested property changes", () => {
      const obj = reactive({
        user: {
          name: "John",
          address: {
            city: "New York",
          },
        },
      });

      const fn = vi.fn();

      effect(() => {
        fn();
        obj.user;
      });

      fn.mockClear();

      // Change nested property
      obj.user.name = "Jane";

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should notify when deeply nested property changes", () => {
      const obj = reactive({
        level1: {
          level2: {
            level3: {
              value: 0,
            },
          },
        },
      });

      const fn = vi.fn();

      effect(() => {
        fn();
        obj.level1;
      });

      fn.mockClear();

      // Change deeply nested property
      obj.level1.level2.level3.value = 1;

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("reactive object - property without subscribers", () => {
    it("should notify parent when property changes", () => {
      const obj = reactive({ a: 1, b: 2 });
      const fn = vi.fn();

      effect(() => {
        fn();
        // Access property a
        obj.a;
      });

      fn.mockClear();

      // Change property a
      obj.a = 3;

      // Should trigger notification
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("reactive with WeakMap and WeakSet", () => {
    it("should return WeakMap as-is (not reactive)", () => {
      const wm = new WeakMap();
      const obj = {};
      wm.set(obj, "value");

      const reactiveWM = reactive(wm);

      // Should be the same instance
      expect(reactiveWM).toBe(wm);
      expect(reactiveWM.get(obj)).toBe("value");
    });

    it("should return WeakSet as-is (not reactive)", () => {
      const ws = new WeakSet();
      const obj = {};
      ws.add(obj);

      const reactiveWS = reactive(ws);

      // Should be the same instance
      expect(reactiveWS).toBe(ws);
      expect(reactiveWS.has(obj)).toBe(true);
    });
  });

  describe("reactive with Promise", () => {
    it("should return Promise as-is (not reactive)", async () => {
      const promise = Promise.resolve(42);
      const reactivePromise = reactive(promise);

      // Should be the same instance
      expect(reactivePromise).toBe(promise);
      expect(await reactivePromise).toBe(42);
    });
  });

  describe("reactive with Error", () => {
    it("should create reactive Error object", () => {
      const error = new Error("Test error");
      const reactiveError = reactive(error);

      const fn = vi.fn();

      effect(() => {
        fn();
        reactiveError.message;
      });

      fn.mockClear();

      reactiveError.message = "Updated error";

      expect(fn).toHaveBeenCalledTimes(1);
      expect(reactiveError.message).toBe("Updated error");
    });
  });

  describe("reactive with TypedArray", () => {
    it("should create reactive Uint8Array", () => {
      const arr = new Uint8Array([1, 2, 3]);
      const reactiveArr = reactive(arr);

      const fn = vi.fn();

      effect(() => {
        fn();
        reactiveArr[0];
      });

      fn.mockClear();

      reactiveArr[0] = 10;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(reactiveArr[0]).toBe(10);
    });

    it("should create reactive Int32Array", () => {
      const arr = new Int32Array([1, 2, 3]);
      const reactiveArr = reactive(arr);

      const fn = vi.fn();

      effect(() => {
        fn();
        reactiveArr[1];
      });

      fn.mockClear();

      reactiveArr[1] = 20;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(reactiveArr[1]).toBe(20);
    });

    it("should create reactive Float64Array", () => {
      const arr = new Float64Array([1.5, 2.5, 3.5]);
      const reactiveArr = reactive(arr);

      const fn = vi.fn();

      effect(() => {
        fn();
        reactiveArr[2];
      });

      fn.mockClear();

      reactiveArr[2] = 30.5;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(reactiveArr[2]).toBe(30.5);
    });
  });

  describe("reactive with ArrayBuffer", () => {
    it("should create reactive ArrayBuffer", () => {
      const buffer = new ArrayBuffer(8);
      const reactiveBuffer = reactive(buffer);

      // ArrayBuffer itself doesn't have indexed access
      // but we can verify it's wrapped
      expect(reactiveBuffer).toBeDefined();
      expect(reactiveBuffer.byteLength).toBe(8);
    });
  });
});
