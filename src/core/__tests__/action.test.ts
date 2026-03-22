import { describe, it, expect, vi, beforeEach } from "vitest";
import { reactive } from "../reactive";
import {
  onClick,
  onInput,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  onKey,
  onMouseEnter,
  onMouseLeave,
} from "../action";

describe("action", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("onClick", () => {
    it("should handle click events", () => {
      const button = document.createElement("button");
      container.appendChild(button);
      const handler = vi.fn();

      onClick(button, handler);
      button.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with selector", () => {
      const button = document.createElement("button");
      button.id = "test-btn";
      container.appendChild(button);
      const handler = vi.fn();

      onClick("#test-btn", handler);
      button.click();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should return cleanup function", () => {
      const button = document.createElement("button");
      container.appendChild(button);
      const handler = vi.fn();

      const cleanup = onClick(button, handler);
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);

      cleanup();
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("onInput", () => {
    it("should handle input events", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onInput(input, handler);
      input.dispatchEvent(new Event("input"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should update reactive value", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const value = reactive("");

      onInput(input, (e) => {
        value.value = (e.target as HTMLInputElement).value;
      });

      input.value = "test";
      input.dispatchEvent(new Event("input"));

      expect(value.value).toBe("test");
    });
  });

  describe("onChange", () => {
    it("should handle change events", () => {
      const select = document.createElement("select");
      container.appendChild(select);
      const handler = vi.fn();

      onChange(select, handler);
      select.dispatchEvent(new Event("change"));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("onSubmit", () => {
    it("should handle submit events", () => {
      const form = document.createElement("form");
      container.appendChild(form);
      const handler = vi.fn((e) => e.preventDefault());

      onSubmit(form, handler);
      form.dispatchEvent(new Event("submit"));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("onFocus and onBlur", () => {
    it("should handle focus events", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onFocus(input, handler);
      input.dispatchEvent(new Event("focus"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle blur events", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onBlur(input, handler);
      input.dispatchEvent(new Event("blur"));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("onKeyDown and onKeyUp", () => {
    it("should handle keydown events", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onKeyDown(input, handler);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle keyup events", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onKeyUp(input, handler);
      input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("onKey", () => {
    it("should filter by key", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onKey(input, "Enter", handler);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(handler).toHaveBeenCalledTimes(1);

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(handler).toHaveBeenCalledTimes(1); // Should not trigger
    });

    it("should filter by multiple keys", () => {
      const input = document.createElement("input");
      container.appendChild(input);
      const handler = vi.fn();

      onKey(input, ["Enter", "Escape"], handler);
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(handler).toHaveBeenCalledTimes(1);

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      expect(handler).toHaveBeenCalledTimes(2);

      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      expect(handler).toHaveBeenCalledTimes(2); // Should not trigger
    });
  });

  describe("onMouseEnter and onMouseLeave", () => {
    it("should handle mouseenter events", () => {
      const div = document.createElement("div");
      container.appendChild(div);
      const handler = vi.fn();

      onMouseEnter(div, handler);
      div.dispatchEvent(new Event("mouseenter"));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle mouseleave events", () => {
      const div = document.createElement("div");
      container.appendChild(div);
      const handler = vi.fn();

      onMouseLeave(div, handler);
      div.dispatchEvent(new Event("mouseleave"));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
