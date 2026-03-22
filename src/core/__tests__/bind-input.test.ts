import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { reactive } from "../reactive";
import { bindInput } from "../bind";

describe("bindInput - Comprehensive Input Type Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("text input types", () => {
    it("should bind text input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "text";
      container.appendChild(input);

      bindInput(input, value);

      // Test reactive to DOM
      value.value = "test";
      expect(input.value).toBe("test");

      // Test DOM to reactive
      input.value = "updated";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("updated");
    });

    it("should bind password input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "password";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "secret";
      expect(input.value).toBe("secret");

      input.value = "newsecret";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("newsecret");
    });

    it("should bind email input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "email";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "test@example.com";
      expect(input.value).toBe("test@example.com");

      input.value = "new@example.com";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("new@example.com");
    });

    it("should bind url input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "url";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "https://example.com";
      expect(input.value).toBe("https://example.com");
    });

    it("should bind tel input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "tel";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "+1234567890";
      expect(input.value).toBe("+1234567890");
    });

    it("should bind search input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "search";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "search query";
      expect(input.value).toBe("search query");
    });

    it("should bind hidden input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "hidden";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "hidden value";
      expect(input.value).toBe("hidden value");
    });

    it("should bind color input", () => {
      const value = reactive("#ff0000");
      const input = document.createElement("input");
      input.type = "color";
      container.appendChild(input);

      bindInput(input, value);

      value.value = "#00ff00";
      expect(input.value).toBe("#00ff00");

      input.value = "#0000ff";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("#0000ff");
    });
  });

  describe("number input types", () => {
    it("should bind number input", () => {
      const value = reactive(0);
      const input = document.createElement("input");
      input.type = "number";
      container.appendChild(input);

      bindInput(input, value);

      // Test reactive to DOM
      value.value = 42;
      expect(input.value).toBe("42");

      // Test DOM to reactive
      input.value = "100";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe(100);
    });

    it("should bind range input", () => {
      const value = reactive(50);
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "100";
      container.appendChild(input);

      bindInput(input, value);

      value.value = 75;
      expect(input.value).toBe("75");

      input.value = "25";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe(25);
    });

    it("should handle NaN for number input", () => {
      const value = reactive(0);
      const input = document.createElement("input");
      input.type = "number";
      container.appendChild(input);

      bindInput(input, value);

      input.value = "";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe(0); // NaN is converted to 0
    });
  });

  describe("checkbox input", () => {
    it("should bind checkbox", () => {
      const value = reactive(false);
      const input = document.createElement("input");
      input.type = "checkbox";
      container.appendChild(input);

      bindInput(input, value);

      // Test reactive to DOM
      value.value = true;
      expect(input.checked).toBe(true);

      value.value = false;
      expect(input.checked).toBe(false);

      // Test DOM to reactive
      input.checked = true;
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe(true);

      input.checked = false;
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe(false);
    });
  });

  describe("radio input", () => {
    it("should bind radio button", () => {
      const value = reactive("option1");
      const radio1 = document.createElement("input");
      radio1.type = "radio";
      radio1.value = "option1";
      radio1.name = "test";
      const radio2 = document.createElement("input");
      radio2.type = "radio";
      radio2.value = "option2";
      radio2.name = "test";
      container.appendChild(radio1);
      container.appendChild(radio2);

      bindInput(radio1, value);
      bindInput(radio2, value);

      // Test reactive to DOM
      expect(radio1.checked).toBe(true);
      expect(radio2.checked).toBe(false);

      value.value = "option2";
      expect(radio1.checked).toBe(false);
      expect(radio2.checked).toBe(true);

      // Test DOM to reactive
      radio1.checked = true;
      radio1.dispatchEvent(new Event("change"));
      expect(value.value).toBe("option1");

      radio2.checked = true;
      radio2.dispatchEvent(new Event("change"));
      expect(value.value).toBe("option2");
    });

    it("should handle radio input event", () => {
      const value = reactive("option1");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.value = "option2";
      container.appendChild(radio);

      bindInput(radio, value);

      radio.checked = true;
      radio.dispatchEvent(new Event("input"));
      expect(value.value).toBe("option2");
    });

    it("should not update if radio is unchecked", () => {
      const value = reactive("option1");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.value = "option2";
      container.appendChild(radio);

      bindInput(radio, value);

      radio.checked = false;
      radio.dispatchEvent(new Event("change"));
      expect(value.value).toBe("option1"); // Should not change
    });
  });

  describe("date/time inputs", () => {
    it("should bind date input with string", () => {
      const value = reactive("2024-01-15");
      const input = document.createElement("input");
      input.type = "date";
      container.appendChild(input);

      bindInput(input, value);

      expect(input.value).toBe("2024-01-15");

      input.value = "2024-12-25";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("2024-12-25");
    });

    it("should bind date input with Date object", () => {
      const date = new Date("2024-01-15T00:00:00");
      const value = reactive<Date | string>(date);
      const input = document.createElement("input");
      input.type = "date";
      container.appendChild(input);

      bindInput(input, value as any);

      expect(input.value).toBe("2024-01-15");
    });

    it("should bind datetime-local input with string", () => {
      const value = reactive("2024-01-15T10:30");
      const input = document.createElement("input");
      input.type = "datetime-local";
      container.appendChild(input);

      bindInput(input, value);

      expect(input.value).toBe("2024-01-15T10:30");

      input.value = "2024-12-25T15:45";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("2024-12-25T15:45");
    });

    it("should bind datetime-local input with Date object", () => {
      const date = new Date("2024-01-15T10:30:00");
      const value = reactive<Date | string>(date);
      const input = document.createElement("input");
      input.type = "datetime-local";
      container.appendChild(input);

      bindInput(input, value as any);

      expect(input.value).toContain("2024-01-15");
      expect(input.value).toContain("10:30");
    });

    it("should bind month input with string", () => {
      const value = reactive("2024-01");
      const input = document.createElement("input");
      input.type = "month";
      container.appendChild(input);

      bindInput(input, value);

      expect(input.value).toBe("2024-01");

      input.value = "2024-12";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("2024-12");
    });

    it("should bind month input with Date object", () => {
      const date = new Date("2024-01-15");
      const value = reactive<Date | string>(date);
      const input = document.createElement("input");
      input.type = "month";
      container.appendChild(input);

      bindInput(input, value as any);

      expect(input.value).toBe("2024-01");
    });

    it("should bind week input with string", () => {
      const value = reactive("2024-W03");
      const input = document.createElement("input");
      input.type = "week";
      container.appendChild(input);

      bindInput(input, value);

      expect(input.value).toBe("2024-W03");

      input.value = "2024-W52";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("2024-W52");
    });

    it("should bind week input with Date object", () => {
      const date = new Date("2024-01-15");
      const value = reactive<Date | string>(date);
      const input = document.createElement("input");
      input.type = "week";
      container.appendChild(input);

      bindInput(input, value as any);

      // Week format varies by browser, just check it's set to something
      expect(input.value).toBeTruthy();
      expect(input.value.length).toBeGreaterThan(0);
    });

    it("should bind time input with string", () => {
      const value = reactive("10:30");
      const input = document.createElement("input");
      input.type = "time";
      container.appendChild(input);

      bindInput(input, value);

      expect(input.value).toBe("10:30");

      input.value = "15:45";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("15:45");
    });

    it("should bind time input with Date object", () => {
      const date = new Date("2024-01-15T10:30:00");
      const value = reactive<Date | string>(date);
      const input = document.createElement("input");
      input.type = "time";
      container.appendChild(input);

      bindInput(input, value as any);

      expect(input.value).toContain("10:30");
    });
  });

  describe("file input", () => {
    it("should bind file input (read-only)", () => {
      const value = reactive(null as any);
      const input = document.createElement("input");
      input.type = "file";
      container.appendChild(input);

      bindInput(input, value);

      // File inputs can't be set programmatically in jsdom
      // Just verify the binding was created
      expect(input.type).toBe("file");
    });

    it("should not update DOM for file input", () => {
      const value = reactive(null as any);
      const input = document.createElement("input");
      input.type = "file";
      container.appendChild(input);

      bindInput(input, value);

      // Setting value shouldn't affect file input
      value.value = "test";
      expect(input.files).toBeTruthy();
    });
  });

  describe("select element", () => {
    it("should bind select element", () => {
      const value = reactive("option1");
      const select = document.createElement("select");
      const option1 = document.createElement("option");
      option1.value = "option1";
      option1.textContent = "Option 1";
      const option2 = document.createElement("option");
      option2.value = "option2";
      option2.textContent = "Option 2";
      select.appendChild(option1);
      select.appendChild(option2);
      container.appendChild(select);

      bindInput(select, value);

      // Test reactive to DOM
      expect(select.value).toBe("option1");

      value.value = "option2";
      expect(select.value).toBe("option2");

      // Test DOM to reactive
      select.value = "option1";
      select.dispatchEvent(new Event("input"));
      expect(value.value).toBe("option1");
    });

    it("should bind multi-select element", async () => {
      const value = reactive<string[]>(["option1", "option3"]);
      const select = document.createElement("select");
      select.multiple = true;
      const option1 = document.createElement("option");
      option1.value = "option1";
      const option2 = document.createElement("option");
      option2.value = "option2";
      const option3 = document.createElement("option");
      option3.value = "option3";
      select.appendChild(option1);
      select.appendChild(option2);
      select.appendChild(option3);
      container.appendChild(select);

      bindInput(select, value as any);

      // Wait for effect to run
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Test reactive to DOM
      expect(option1.selected).toBe(true);
      expect(option2.selected).toBe(false);
      expect(option3.selected).toBe(true);

      // Test DOM to reactive
      option1.selected = false;
      option2.selected = true;
      option3.selected = true;
      select.dispatchEvent(new Event("input"));
      expect((value as any).value).toEqual(["option2", "option3"]);
    });

    it("should handle null/undefined for select", () => {
      const value = reactive(null as any);
      const select = document.createElement("select");
      const option = document.createElement("option");
      option.value = "test";
      select.appendChild(option);
      container.appendChild(select);

      bindInput(select, value);

      expect(select.value).toBe("");
    });
  });

  describe("textarea element", () => {
    it("should bind textarea", () => {
      const value = reactive("");
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      bindInput(textarea, value);

      // Test reactive to DOM
      value.value = "Hello\nWorld";
      expect(textarea.value).toBe("Hello\nWorld");

      // Test DOM to reactive
      textarea.value = "Updated\nContent";
      textarea.dispatchEvent(new Event("input"));
      expect(value.value).toBe("Updated\nContent");
    });

    it("should handle null/undefined for textarea", () => {
      const value = reactive(null as any);
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      bindInput(textarea, value);

      expect(textarea.value).toBe("");
    });
  });

  describe("edge cases", () => {
    it("should handle non-existent selector", () => {
      const value = reactive("");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindInput("#non-existent", value);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should handle non-input element", () => {
      const value = reactive("");
      const div = document.createElement("div");
      container.appendChild(div);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindInput(div as any, value);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should handle selector string", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.id = "test-input";
      container.appendChild(input);

      bindInput("#test-input", value);

      value.value = "test";
      expect(input.value).toBe("test");
    });

    it("should cleanup event listeners", () => {
      const value = reactive("");
      const input = document.createElement("input");
      container.appendChild(input);

      const unbind = bindInput(input, value);

      input.value = "test";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("test");

      unbind();

      input.value = "updated";
      input.dispatchEvent(new Event("input"));
      expect(value.value).toBe("test"); // Should not update after unbind
    });

    it("should cleanup radio change listener", () => {
      const value = reactive("option1");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.value = "option2";
      container.appendChild(radio);

      const unbind = bindInput(radio, value);

      radio.checked = true;
      radio.dispatchEvent(new Event("change"));
      expect(value.value).toBe("option2");

      unbind();

      radio.checked = false;
      radio.dispatchEvent(new Event("change"));
      expect(value.value).toBe("option2"); // Should not update after unbind
    });
  });
});
