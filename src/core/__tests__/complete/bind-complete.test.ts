import { describe, it, expect, beforeEach } from "vitest";
import { reactive } from "../../reactive";
import { bindInput, bindMultiple, bind } from "../../bind";

describe("bind - Complete Coverage", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("bindInput - date/time inputs", () => {
    it("should handle date input with Date object", () => {
      const input = document.createElement("input");
      input.type = "date";
      container.appendChild(input);

      const date = reactive(new Date("2024-01-15"));
      bindInput(input, date as any);

      expect(input.value).toBe("2024-01-15");
    });

    it("should handle datetime-local input with Date object", () => {
      const input = document.createElement("input");
      input.type = "datetime-local";
      container.appendChild(input);

      const date = reactive(new Date("2024-01-15T10:30:00"));
      bindInput(input, date as any);

      expect(input.value).toContain("2024-01-15");
    });

    it("should handle month input with Date object", () => {
      const input = document.createElement("input");
      input.type = "month";
      container.appendChild(input);

      const date = reactive(new Date("2024-01-15"));
      bindInput(input, date as any);

      expect(input.value).toBe("2024-01");
    });

    it("should handle time input with Date object", () => {
      const input = document.createElement("input");
      input.type = "time";
      container.appendChild(input);

      const date = reactive(new Date("2024-01-15T10:30:00"));
      bindInput(input, date as any);

      expect(input.value).toMatch(/^\d{2}:\d{2}/);
    });

    it("should handle week input with Date object", () => {
      const input = document.createElement("input");
      input.type = "week";
      container.appendChild(input);

      const date = reactive(new Date("2024-01-15"));
      bindInput(input, date as any);

      // Week format is YYYY-Www
      expect(input.value).toMatch(/^\d{4}-W\d{2}/);
    });

    it("should handle date input with string value", () => {
      const input = document.createElement("input");
      input.type = "date";
      container.appendChild(input);

      const dateStr = reactive("2024-01-15");
      bindInput(input, dateStr);

      expect(input.value).toBe("2024-01-15");
    });
  });

  describe("bindInput - user input handling", () => {
    it("should update reactive when date input changes", () => {
      const input = document.createElement("input");
      input.type = "date";
      container.appendChild(input);

      const date = reactive("");
      bindInput(input, date);

      input.value = "2024-01-15";
      input.dispatchEvent(new Event("input"));

      expect(date.value).toBe("2024-01-15");
    });

    it("should update reactive when datetime-local input changes", () => {
      const input = document.createElement("input");
      input.type = "datetime-local";
      container.appendChild(input);

      const date = reactive("");
      bindInput(input, date);

      input.value = "2024-01-15T10:30";
      input.dispatchEvent(new Event("input"));

      expect(date.value).toBe("2024-01-15T10:30");
    });

    it("should update reactive when month input changes", () => {
      const input = document.createElement("input");
      input.type = "month";
      container.appendChild(input);

      const month = reactive("");
      bindInput(input, month);

      input.value = "2024-01";
      input.dispatchEvent(new Event("input"));

      expect(month.value).toBe("2024-01");
    });

    it("should update reactive when week input changes", () => {
      const input = document.createElement("input");
      input.type = "week";
      container.appendChild(input);

      const week = reactive("");
      bindInput(input, week);

      input.value = "2024-W03";
      input.dispatchEvent(new Event("input"));

      expect(week.value).toBe("2024-W03");
    });

    it("should update reactive when time input changes", () => {
      const input = document.createElement("input");
      input.type = "time";
      container.appendChild(input);

      const time = reactive("");
      bindInput(input, time);

      input.value = "10:30";
      input.dispatchEvent(new Event("input"));

      expect(time.value).toBe("10:30");
    });

    it("should handle radio button change event", () => {
      const radio1 = document.createElement("input");
      radio1.type = "radio";
      radio1.name = "choice";
      radio1.value = "option1";
      container.appendChild(radio1);

      const radio2 = document.createElement("input");
      radio2.type = "radio";
      radio2.name = "choice";
      radio2.value = "option2";
      container.appendChild(radio2);

      const choice = reactive("");
      bindInput(radio1, choice);
      bindInput(radio2, choice);

      radio2.checked = true;
      radio2.dispatchEvent(new Event("change"));

      expect(choice.value).toBe("option2");
    });

    it("should handle textarea input", () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      const text = reactive("");
      bindInput(textarea, text);

      textarea.value = "Hello World";
      textarea.dispatchEvent(new Event("input"));

      expect(text.value).toBe("Hello World");
    });

    it("should handle select multiple", () => {
      const select = document.createElement("select");
      select.multiple = true;
      const option1 = document.createElement("option");
      option1.value = "a";
      const option2 = document.createElement("option");
      option2.value = "b";
      const option3 = document.createElement("option");
      option3.value = "c";
      select.appendChild(option1);
      select.appendChild(option2);
      select.appendChild(option3);
      container.appendChild(select);

      const selected = reactive<string[]>([]);
      bindInput(select, selected as any);

      option1.selected = true;
      option3.selected = true;
      select.dispatchEvent(new Event("input"));

      expect((selected as any).value).toEqual(["a", "c"]);
    });

    it("should handle select single", () => {
      const select = document.createElement("select");
      const option1 = document.createElement("option");
      option1.value = "a";
      const option2 = document.createElement("option");
      option2.value = "b";
      select.appendChild(option1);
      select.appendChild(option2);
      container.appendChild(select);

      const selected = reactive("");
      bindInput(select, selected);

      select.value = "b";
      select.dispatchEvent(new Event("input"));

      expect(selected.value).toBe("b");
    });
  });

  describe("bindMultiple", () => {
    it("should bind multiple properties at once", () => {
      const div = document.createElement("div");
      div.id = "test";
      container.appendChild(div);

      const text = reactive("Hello");
      const color = reactive("red");
      const isActive = reactive(true);

      bindMultiple([
        { selector: "#test", type: "text", target: "", source: text },
        { selector: "#test", type: "style", target: "color", source: color },
        {
          selector: "#test",
          type: "class",
          target: "active",
          source: isActive,
        },
      ]);

      expect(div.textContent).toBe("Hello");
      expect(div.style.color).toBe("red");
      expect(div.classList.contains("active")).toBe(true);
    });

    it("should handle unknown binding type", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const text = reactive("Hello");

      const unbind = bindMultiple([
        {
          selector: div,
          type: "unknown" as any,
          target: "",
          source: text,
        },
      ]);

      // Should not throw
      unbind();
    });
  });

  describe("bind - unified function", () => {
    it("should auto-detect HTML content", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const html = reactive("<p>Hello</p>");
      bind(div, html, { trusted: true });

      expect(div.innerHTML).toBe("<p>Hello</p>");
    });

    it("should auto-detect text content", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const text = reactive("Hello");
      bind(div, text);

      expect(div.textContent).toBe("Hello");
    });

    it("should handle class: prefix", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const isActive = reactive(true);
      bind(div, "class:active", isActive);

      expect(div.classList.contains("active")).toBe(true);
    });

    it("should handle style: prefix", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const color = reactive("red");
      bind(div, "style:color", color);

      expect(div.style.color).toBe("red");
    });

    it("should handle styles keyword", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      // Create a reactive primitive that holds a style object
      const styles = reactive({ value: { color: "red", fontSize: "16px" } });

      // bindStyles expects a source with .value property
      const unbind = bind(div, "styles", styles);

      // Wait for effect to run
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");

      unbind();
    });

    it("should handle prop: prefix", () => {
      const input = document.createElement("input");
      container.appendChild(input);

      const value = reactive("test");
      bind(input, "prop:value", value);

      expect(input.value).toBe("test");
    });

    it("should handle attribute binding", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const title = reactive("Test Title");
      bind(div, "title", title);

      expect(div.getAttribute("title")).toBe("Test Title");
    });

    it("should handle invalid arguments", () => {
      const div = document.createElement("div");
      container.appendChild(div);

      const unbind = bind(div);

      // Should not throw
      unbind();
    });
  });
});
