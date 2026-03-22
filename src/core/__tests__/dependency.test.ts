import { describe, it, expect, beforeEach } from "vitest";
import { computed } from "../computed";
import {
  getActiveEffect,
  setActiveEffect,
  getActiveComputed,
  setActiveComputed,
} from "../dependency";

describe("dependency", () => {
  beforeEach(() => {
    setActiveEffect(null);
    setActiveComputed(null);
  });

  describe("activeEffect", () => {
    it("should get and set active effect", () => {
      expect(getActiveEffect()).toBeNull();

      const effect = () => {};
      setActiveEffect(effect);

      expect(getActiveEffect()).toBe(effect);
    });

    it("should clear active effect", () => {
      const effect = () => {};
      setActiveEffect(effect);
      expect(getActiveEffect()).toBe(effect);

      setActiveEffect(null);
      expect(getActiveEffect()).toBeNull();
    });

    it("should handle multiple effect changes", () => {
      const effect1 = () => {};
      const effect2 = () => {};

      setActiveEffect(effect1);
      expect(getActiveEffect()).toBe(effect1);

      setActiveEffect(effect2);
      expect(getActiveEffect()).toBe(effect2);

      setActiveEffect(null);
      expect(getActiveEffect()).toBeNull();
    });
  });

  describe("activeComputed", () => {
    it("should get and set active computed", () => {
      expect(getActiveComputed()).toBeNull();

      const comp = computed(() => 42);
      setActiveComputed(comp);

      expect(getActiveComputed()).toBe(comp);
    });

    it("should clear active computed", () => {
      const comp = computed(() => 42);
      setActiveComputed(comp);
      expect(getActiveComputed()).toBe(comp);

      setActiveComputed(null);
      expect(getActiveComputed()).toBeNull();
    });

    it("should handle multiple computed changes", () => {
      const comp1 = computed(() => 1);
      const comp2 = computed(() => 2);

      setActiveComputed(comp1);
      expect(getActiveComputed()).toBe(comp1);

      setActiveComputed(comp2);
      expect(getActiveComputed()).toBe(comp2);

      setActiveComputed(null);
      expect(getActiveComputed()).toBeNull();
    });

    it("should handle typed computed", () => {
      const comp = computed<string>(() => "test");
      setActiveComputed<string>(comp);

      const active = getActiveComputed<string>();
      expect(active).toBe(comp);
      expect(active?.value).toBe("test");
    });
  });

  describe("isolation", () => {
    it("should keep effect and computed separate", () => {
      const effect = () => {};
      const comp = computed(() => 42);

      setActiveEffect(effect);
      setActiveComputed(comp);

      expect(getActiveEffect()).toBe(effect);
      expect(getActiveComputed()).toBe(comp);

      setActiveEffect(null);
      expect(getActiveEffect()).toBeNull();
      expect(getActiveComputed()).toBe(comp);

      setActiveComputed(null);
      expect(getActiveComputed()).toBeNull();
    });
  });
});
