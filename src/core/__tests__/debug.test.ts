import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reactive } from "../reactive";
import { computed } from "../computed";
import {
  setDebug,
  isDebugEnabled,
  trackReactive,
  getDebugInfo,
  logTrackedReactive,
  clearDebugTracking,
} from "../debug";

describe("debug", () => {
  beforeEach(() => {
    clearDebugTracking();
    setDebug(false);
  });

  afterEach(() => {
    clearDebugTracking();
    setDebug(false);
  });

  describe("setDebug and isDebugEnabled", () => {
    it("should enable debug mode", () => {
      expect(isDebugEnabled()).toBe(false);
      setDebug(true);
      expect(isDebugEnabled()).toBe(true);
    });

    it("should disable debug mode", () => {
      setDebug(true);
      expect(isDebugEnabled()).toBe(true);
      setDebug(false);
      expect(isDebugEnabled()).toBe(false);
    });
  });

  describe("trackReactive", () => {
    it("should not track when debug is disabled", () => {
      const count = reactive(0);
      trackReactive(count);
      const info = getDebugInfo(count);
      expect(info).toBeNull();
    });

    it("should track reactive value when debug is enabled", () => {
      setDebug(true);
      const count = reactive(0);
      trackReactive(count);
      const info = getDebugInfo(count);

      expect(info).not.toBeNull();
      expect(info?.type).toBe("reactive");
      expect(info?.value).toBe(0);
      expect(info?.subscribers).toBe(0);
    });

    it("should track computed value", () => {
      setDebug(true);
      const count = reactive(5);
      const doubled = computed(() => count.value * 2);
      trackReactive(doubled, "computed");
      const info = getDebugInfo(doubled);

      expect(info).not.toBeNull();
      expect(info?.type).toBe("computed");
    });

    it("should track subscriber count", () => {
      setDebug(true);
      const count = reactive(0);
      trackReactive(count);

      const unsubscribe1 = count.subscribe(() => {});
      let info = getDebugInfo(count);
      expect(info?.subscribers).toBe(1);

      const unsubscribe2 = count.subscribe(() => {});
      info = getDebugInfo(count);
      expect(info?.subscribers).toBe(2);

      unsubscribe1();
      info = getDebugInfo(count);
      expect(info?.subscribers).toBe(1);

      unsubscribe2();
      info = getDebugInfo(count);
      expect(info?.subscribers).toBe(0);
    });

    it("should track value changes in history", () => {
      setDebug(true);
      const count = reactive(0);
      trackReactive(count);

      count.value = 5;
      count.value = 10;

      const info = getDebugInfo(count);
      expect(info?.history.length).toBeGreaterThanOrEqual(2);
      expect(info?.value).toBe(10);
    });

    it("should warn when tracking already tracked value", () => {
      setDebug(true);
      const count = reactive(0);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      trackReactive(count);
      trackReactive(count); // Try to track again

      expect(warnSpy).toHaveBeenCalledWith(
        "Reactive value is already being tracked."
      );
      warnSpy.mockRestore();
    });

    it("should limit history to 100 entries", () => {
      setDebug(true);
      const count = reactive(0);
      trackReactive(count);

      // Make 150 changes
      for (let i = 1; i <= 150; i++) {
        count.value = i;
      }

      const info = getDebugInfo(count);
      expect(info?.history.length).toBeLessThanOrEqual(100);
    });
  });

  describe("getDebugInfo", () => {
    it("should return null when debug is disabled", () => {
      const count = reactive(0);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const info = getDebugInfo(count);

      expect(info).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        "Debug mode is not enabled. Call setDebug(true) first."
      );
      warnSpy.mockRestore();
    });

    it("should return null for untracked reactive", () => {
      setDebug(true);
      const count = reactive(0);
      const info = getDebugInfo(count);
      expect(info).toBeNull();
    });

    it("should return debug info for tracked reactive", () => {
      setDebug(true);
      const count = reactive(5);
      trackReactive(count);

      const info = getDebugInfo(count);
      expect(info).not.toBeNull();
      expect(info?.type).toBe("reactive");
      expect(info?.value).toBe(5);
      expect(info?.subscribers).toBe(0);
      expect(info?.history).toBeInstanceOf(Array);
    });
  });

  describe("logTrackedReactive", () => {
    it("should warn when debug is disabled", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      logTrackedReactive();

      expect(warnSpy).toHaveBeenCalledWith(
        "Debug mode is not enabled. Call setDebug(true) first."
      );
      warnSpy.mockRestore();
    });

    it("should log message when no values are tracked", () => {
      setDebug(true);
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logTrackedReactive();

      expect(logSpy).toHaveBeenCalledWith(
        "No reactive values are currently being tracked."
      );
      logSpy.mockRestore();
    });

    it("should log tracked values", () => {
      setDebug(true);
      const count = reactive(5);
      trackReactive(count);

      const groupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
      const groupEndSpy = vi
        .spyOn(console, "groupEnd")
        .mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      logTrackedReactive();

      expect(groupSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
      expect(groupEndSpy).toHaveBeenCalled();

      groupSpy.mockRestore();
      groupEndSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe("clearDebugTracking", () => {
    it("should clear all tracked values", () => {
      setDebug(true);
      const count1 = reactive(0);
      const count2 = reactive(0);

      trackReactive(count1);
      trackReactive(count2);

      expect(getDebugInfo(count1)).not.toBeNull();
      expect(getDebugInfo(count2)).not.toBeNull();

      clearDebugTracking();

      expect(getDebugInfo(count1)).toBeNull();
      expect(getDebugInfo(count2)).toBeNull();
    });
  });
});
