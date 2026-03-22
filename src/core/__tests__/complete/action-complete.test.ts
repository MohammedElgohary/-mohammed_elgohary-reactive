import { describe, it, expect, vi, beforeEach } from "vitest";
import { onEnter, onEscape } from "../../action";

describe("action - Complete Coverage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("onEnter", () => {
    it("should bind Enter key handler", () => {
      const input = document.createElement("input");
      container.appendChild(input);

      const handler = vi.fn();
      onEnter(input, handler);

      // Simulate Enter key press
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      input.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not trigger on other keys", () => {
      const input = document.createElement("input");
      container.appendChild(input);

      const handler = vi.fn();
      onEnter(input, handler);

      // Simulate other key press
      const event = new KeyboardEvent("keydown", { key: "a" });
      input.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("onEscape", () => {
    it("should bind Escape key handler", () => {
      const input = document.createElement("input");
      container.appendChild(input);

      const handler = vi.fn();
      onEscape(input, handler);

      // Simulate Escape key press
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      input.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should not trigger on other keys", () => {
      const input = document.createElement("input");
      container.appendChild(input);

      const handler = vi.fn();
      onEscape(input, handler);

      // Simulate other key press
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      input.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
