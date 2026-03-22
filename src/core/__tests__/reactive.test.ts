import { describe, it, expect, vi } from "vitest";
import { reactive } from "../reactive";
import { effect } from "../effect";

describe("reactive", () => {
  describe("primitive values", () => {
    it("should create reactive primitive", () => {
      const count = reactive(0);
      expect(count.value).toBe(0);
    });

    it("should update primitive value", () => {
      const count = reactive(0);
      count.value = 5;
      expect(count.value).toBe(5);
    });

    it("should notify subscribers on primitive change", () => {
      const count = reactive(0);
      const callback = vi.fn();
      count.subscribe(callback);

      count.value = 5;
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("should not notify if value is the same", () => {
      const count = reactive(5);
      const callback = vi.fn();
      count.subscribe(callback);

      count.value = 5;
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle string values", () => {
      const name = reactive("John");
      expect(name.value).toBe("John");
      name.value = "Jane";
      expect(name.value).toBe("Jane");
    });

    it("should handle boolean values", () => {
      const flag = reactive(true);
      expect(flag.value).toBe(true);
      flag.value = false;
      expect(flag.value).toBe(false);
    });

    it("should handle null and undefined", () => {
      const nullValue = reactive(null);
      const undefinedValue = reactive(undefined);
      expect(nullValue.value).toBe(null);
      expect(undefinedValue.value).toBe(undefined);
    });
  });

  describe("object values", () => {
    it("should create reactive object", () => {
      const user = reactive({ name: "John", age: 30 });
      expect(user.name).toBe("John");
      expect(user.age).toBe(30);
    });

    it("should update object properties", () => {
      const user = reactive({ name: "John", age: 30 });
      user.name = "Jane";
      expect(user.name).toBe("Jane");
    });

    it("should notify subscribers on object property change", () => {
      const user = reactive({ name: "John" });
      const callback = vi.fn();

      // Use effect to track changes
      effect(() => {
        user.name; // Access property to track
        callback();
      });

      user.name = "Jane";
      expect(callback).toHaveBeenCalledTimes(2); // Once on initial run, once on change
    });

    it("should handle nested objects", () => {
      const state = reactive({
        user: {
          name: "John",
          profile: {
            bio: "Developer",
          },
        },
      });

      expect(state.user.profile.bio).toBe("Developer");
      state.user.profile.bio = "Designer";
      expect(state.user.profile.bio).toBe("Designer");
    });

    it("should handle arrays", () => {
      const items = reactive({ list: [1, 2, 3] });
      expect(items.list).toEqual([1, 2, 3]);
      items.list.push(4);
      expect(items.list).toEqual([1, 2, 3, 4]);
    });
  });

  describe("subscription management", () => {
    it("should allow multiple subscribers", () => {
      const count = reactive(0);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      count.subscribe(callback1);
      count.subscribe(callback2);

      count.value = 5;
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it("should unsubscribe correctly", () => {
      const count = reactive(0);
      const callback = vi.fn();
      const unsubscribe = count.subscribe(callback);

      unsubscribe();
      count.value = 5;
      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle multiple unsubscribes", () => {
      const count = reactive(0);
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const unsub1 = count.subscribe(callback1);
      const unsub2 = count.subscribe(callback2);

      unsub1();
      count.value = 5;

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle rapid updates", () => {
      const count = reactive(0);
      const callback = vi.fn();
      count.subscribe(callback);

      for (let i = 1; i <= 100; i++) {
        count.value = i;
      }

      expect(callback).toHaveBeenCalledTimes(100);
      expect(count.value).toBe(100);
    });

    it("should handle circular references", () => {
      const obj1 = reactive({ name: "obj1", ref: null as any });
      const obj2 = reactive({ name: "obj2", ref: obj1 });
      obj1.ref = obj2;

      expect(obj1.ref.name).toBe("obj2");
      expect(obj2.ref.name).toBe("obj1");
    });

    it("should handle Date objects", () => {
      const date = new Date("2024-01-01");
      const state = reactive({ date });
      expect(state.date.getFullYear()).toBe(2024);
    });

    it("should handle Map and Set", () => {
      const state = reactive({
        map: new Map([["key", "value"]]),
        set: new Set([1, 2, 3]),
      });

      expect(state.map.get("key")).toBe("value");
      expect(state.set.has(1)).toBe(true);
    });
  });

  describe("special types", () => {
    it("should handle Map mutations", () => {
      const map = reactive(new Map([["key1", "value1"]]));
      const callback = vi.fn();

      effect(() => {
        map.size;
        callback();
      });
      callback.mockClear();

      map.set("key2", "value2");
      expect(callback).toHaveBeenCalled();
      expect(map.get("key2")).toBe("value2");
    });

    it("should handle Map delete", () => {
      const map = reactive(new Map([["key1", "value1"]]));
      const callback = vi.fn();

      effect(() => {
        map.size;
        callback();
      });
      callback.mockClear();

      map.delete("key1");
      expect(callback).toHaveBeenCalled();
      expect(map.has("key1")).toBe(false);
    });

    it("should handle Map clear", () => {
      const map = reactive(new Map([["key1", "value1"]]));
      const callback = vi.fn();

      effect(() => {
        map.size;
        callback();
      });
      callback.mockClear();

      map.clear();
      expect(callback).toHaveBeenCalled();
      expect(map.size).toBe(0);
    });

    it("should handle Map forEach", () => {
      const map = reactive(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ])
      );
      const values: string[] = [];

      map.forEach((value) => {
        values.push(value);
      });

      expect(values).toEqual(["value1", "value2"]);
    });

    it("should handle Map iteration", () => {
      const map = reactive(
        new Map([
          ["key1", "value1"],
          ["key2", "value2"],
        ])
      );
      const entries = Array.from(map.entries());

      expect(entries).toEqual([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
    });

    it("should handle Set add", () => {
      const set = reactive(new Set([1, 2]));
      const callback = vi.fn();

      effect(() => {
        set.size;
        callback();
      });
      callback.mockClear();

      set.add(3);
      expect(callback).toHaveBeenCalled();
      expect(set.has(3)).toBe(true);
    });

    it("should handle Set delete", () => {
      const set = reactive(new Set([1, 2, 3]));
      const callback = vi.fn();

      effect(() => {
        set.size;
        callback();
      });
      callback.mockClear();

      set.delete(2);
      expect(callback).toHaveBeenCalled();
      expect(set.has(2)).toBe(false);
    });

    it("should handle Set clear", () => {
      const set = reactive(new Set([1, 2, 3]));
      const callback = vi.fn();

      effect(() => {
        set.size;
        callback();
      });
      callback.mockClear();

      set.clear();
      expect(callback).toHaveBeenCalled();
      expect(set.size).toBe(0);
    });

    it("should handle Set forEach", () => {
      const set = reactive(new Set([1, 2, 3]));
      const values: number[] = [];

      set.forEach((value) => {
        values.push(value);
      });

      expect(values).toEqual([1, 2, 3]);
    });

    it("should handle Set iteration", () => {
      const set = reactive(new Set([1, 2, 3]));
      const values = Array.from(set.values());

      expect(values).toEqual([1, 2, 3]);
    });

    it("should handle Date setters", () => {
      const date = reactive(new Date(2024, 0, 1));
      const callback = vi.fn();

      effect(() => {
        date.getFullYear();
        callback();
      });
      callback.mockClear();

      date.setFullYear(2025);
      expect(callback).toHaveBeenCalled();
      expect(date.getFullYear()).toBe(2025);
    });

    it("should handle RegExp lastIndex", () => {
      const regex = reactive(/test/g);
      const callback = vi.fn();

      effect(() => {
        regex.lastIndex;
        callback();
      });
      callback.mockClear();

      regex.exec("test test");
      expect(callback).toHaveBeenCalled();
    });

    it("should handle Error properties", () => {
      const error = reactive(new Error("test"));
      const callback = vi.fn();

      effect(() => {
        error.message;
        callback();
      });
      callback.mockClear();

      error.message = "updated";
      expect(callback).toHaveBeenCalled();
      expect(error.message).toBe("updated");
    });

    it("should handle TypedArray", () => {
      const arr = reactive(new Uint8Array([1, 2, 3]));
      const callback = vi.fn();

      effect(() => {
        arr[0];
        callback();
      });
      callback.mockClear();

      arr[0] = 10;
      expect(callback).toHaveBeenCalled();
      expect(arr[0]).toBe(10);
    });

    it("should handle TypedArray fill", () => {
      const arr = reactive(new Uint8Array([1, 2, 3]));
      const callback = vi.fn();

      effect(() => {
        arr[0];
        callback();
      });
      callback.mockClear();

      arr.fill(5);
      expect(callback).toHaveBeenCalled();
      expect(arr[0]).toBe(5);
    });

    it("should handle WeakMap (non-reactive)", () => {
      const wm = reactive(new WeakMap());
      expect(wm).toBeInstanceOf(WeakMap);
    });

    it("should handle WeakSet (non-reactive)", () => {
      const ws = reactive(new WeakSet());
      expect(ws).toBeInstanceOf(WeakSet);
    });

    it("should handle Promise (immutable)", () => {
      const promise = reactive(Promise.resolve(42));
      expect(promise).toBeInstanceOf(Promise);
    });

    it("should handle ArrayBuffer", () => {
      const buffer = reactive(new ArrayBuffer(8));
      expect(buffer).toBeInstanceOf(ArrayBuffer);
    });

    it("should handle null", () => {
      const value = reactive(null);
      expect(value.value).toBe(null);
    });

    it("should handle undefined", () => {
      const value = reactive(undefined);
      expect(value.value).toBe(undefined);
    });

    it("should handle symbol", () => {
      const sym = Symbol("test");
      const value = reactive(sym);
      expect(value.value).toBe(sym);
    });

    it("should handle bigint", () => {
      const value = reactive(BigInt(123));
      expect(value.value).toBe(BigInt(123));
    });
  });
});
