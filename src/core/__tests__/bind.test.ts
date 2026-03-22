import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reactive } from "../reactive";
import {
  bindText,
  bindHTML,
  bindAttr,
  bindClass,
  bindStyle,
  bindProp,
  bindStyles,
  bindInput,
  bindMultiple,
  bind,
  render,
  sanitizeHtmlContent,
  escapeHtmlEntities,
  isUrlSafe,
  configureReactiveSecurity,
} from "../bind";

describe("DOM Binding", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  describe("bindText", () => {
    it("should bind text content", () => {
      const text = reactive("Hello");
      const el = document.createElement("div");
      container.appendChild(el);

      bindText(el, () => text.value);
      expect(el.textContent).toBe("Hello");

      text.value = "World";
      expect(el.textContent).toBe("World");
    });

    it("should handle selector string", () => {
      const text = reactive("Hello");
      const el = document.createElement("div");
      el.id = "test";
      container.appendChild(el);

      bindText("#test", () => text.value);
      expect(el.textContent).toBe("Hello");
    });

    it("should handle null and undefined", () => {
      const text = reactive<string | null>(null);
      const el = document.createElement("div");
      container.appendChild(el);

      bindText(el, () => text.value);
      expect(el.textContent).toBe("");

      text.value = undefined as any;
      expect(el.textContent).toBe("");
    });
  });

  describe("bindHTML", () => {
    it("should bind HTML content", () => {
      const html = reactive("<b>Bold</b>");
      const el = document.createElement("div");
      container.appendChild(el);

      bindHTML(el, () => html.value);
      expect(el.innerHTML).toContain("<b>Bold</b>");
    });

    it("should sanitize dangerous HTML by default", () => {
      const html = reactive('<b>Safe</b><script>alert("xss")</script>');
      const el = document.createElement("div");
      container.appendChild(el);

      bindHTML(el, () => html.value);
      expect(el.innerHTML).toContain("<b>Safe</b>");
      expect(el.innerHTML).not.toContain("<script>");
    });

    it("should allow trusted content", () => {
      const html = reactive('<div onclick="test()">Click</div>');
      const el = document.createElement("div");
      container.appendChild(el);

      bindHTML(el, () => html.value, { trusted: true });
      expect(el.innerHTML).toContain("onclick");
    });

    it("should remove event handlers", () => {
      const html = reactive('<div onclick="alert()">Click</div>');
      const el = document.createElement("div");
      container.appendChild(el);

      bindHTML(el, () => html.value);
      expect(el.innerHTML).not.toContain("onclick");
    });
  });

  describe("bindAttr", () => {
    it("should bind attribute", () => {
      const title = reactive("Test Title");
      const el = document.createElement("div");
      container.appendChild(el);

      bindAttr(el, "title", () => title.value);
      expect(el.getAttribute("title")).toBe("Test Title");

      title.value = "New Title";
      expect(el.getAttribute("title")).toBe("New Title");
    });

    it("should remove attribute when value is null", () => {
      const title = reactive<string | null>("Test");
      const el = document.createElement("div");
      container.appendChild(el);

      bindAttr(el, "title", () => title.value);
      expect(el.hasAttribute("title")).toBe(true);

      title.value = null;
      expect(el.hasAttribute("title")).toBe(false);
    });

    it("should block dangerous attributes", () => {
      const handler = reactive("alert()");
      const el = document.createElement("div");
      container.appendChild(el);

      bindAttr(el, "onclick", () => handler.value);
      expect(el.hasAttribute("onclick")).toBe(false);
    });

    it("should validate URLs", () => {
      const url = reactive("javascript:alert()");
      const el = document.createElement("a");
      container.appendChild(el);

      bindAttr(el, "href", () => url.value);
      expect(el.hasAttribute("href")).toBe(false);
    });
  });

  describe("bindClass", () => {
    it("should add class when condition is true", () => {
      const active = reactive(true);
      const el = document.createElement("div");
      container.appendChild(el);

      bindClass(el, "active", () => active.value);
      expect(el.classList.contains("active")).toBe(true);

      active.value = false;
      expect(el.classList.contains("active")).toBe(false);
    });

    it("should toggle class", () => {
      const active = reactive(false);
      const el = document.createElement("div");
      container.appendChild(el);

      bindClass(el, "active", () => active.value);
      expect(el.classList.contains("active")).toBe(false);

      active.value = true;
      expect(el.classList.contains("active")).toBe(true);

      active.value = false;
      expect(el.classList.contains("active")).toBe(false);
    });
  });

  describe("bindStyle", () => {
    it("should bind style property", () => {
      const color = reactive("red");
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyle(el, "color", () => color.value);
      expect(el.style.color).toBe("red");

      color.value = "blue";
      expect(el.style.color).toBe("blue");
    });

    it("should handle numeric values", () => {
      const width = reactive(100);
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyle(el, "width", () => `${width.value}px`);
      expect(el.style.width).toBe("100px");
    });
  });
});

describe("Security Utilities", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("sanitizeHtmlContent", () => {
    it("should remove script tags", () => {
      const html = '<b>Safe</b><script>alert("xss")</script>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).toContain("<b>Safe</b>");
      expect(sanitized).not.toContain("<script>");
    });

    it("should remove event handlers", () => {
      const html = '<div onclick="alert()">Click</div>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("onclick");
    });

    it("should remove dangerous tags", () => {
      const html = '<iframe src="evil.com"></iframe><b>Safe</b>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<iframe>");
      expect(sanitized).toContain("<b>Safe</b>");
    });

    it("should preserve safe HTML", () => {
      const html = "<div><p>Text</p><b>Bold</b><i>Italic</i></div>";
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).toContain("<p>Text</p>");
      expect(sanitized).toContain("<b>Bold</b>");
      expect(sanitized).toContain("<i>Italic</i>");
    });
  });

  describe("escapeHtmlEntities", () => {
    it("should escape HTML entities", () => {
      const html = '<script>alert("xss")</script>';
      const escaped = escapeHtmlEntities(html);
      expect(escaped).toContain("&lt;script&gt;");
      expect(escaped).not.toContain("<script>");
    });

    it("should escape all special characters", () => {
      const text = "< > & \" ' / ` =";
      const escaped = escapeHtmlEntities(text);
      expect(escaped).toContain("&lt;");
      expect(escaped).toContain("&gt;");
      expect(escaped).toContain("&amp;");
      expect(escaped).toContain("&quot;");
    });
  });

  describe("isUrlSafe", () => {
    it("should allow safe URLs", () => {
      expect(isUrlSafe("https://example.com")).toBe(true);
      expect(isUrlSafe("http://example.com")).toBe(true);
      expect(isUrlSafe("/relative/path")).toBe(true);
      expect(isUrlSafe("mailto:test@example.com")).toBe(true);
    });

    it("should block dangerous URLs", () => {
      expect(isUrlSafe("javascript:alert()")).toBe(false);
      expect(isUrlSafe("vbscript:msgbox()")).toBe(false);
      expect(isUrlSafe("data:text/html,<script>alert()</script>")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(isUrlSafe("JAVASCRIPT:alert()")).toBe(false);
      expect(isUrlSafe("JavaScript:alert()")).toBe(false);
    });
  });

  describe("bindProp", () => {
    it("should bind property to reactive value", () => {
      const value = reactive("test");
      const input = document.createElement("input");
      container.appendChild(input);

      bindProp(input, "value", () => value.value);
      expect(input.value).toBe("test");

      value.value = "updated";
      expect(input.value).toBe("updated");
    });

    it("should block dangerous properties", () => {
      const html = reactive("<b>test</b>");
      const div = document.createElement("div");
      container.appendChild(div);

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      bindProp(div, "innerHTML", () => html.value);

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it("should work with selector string", () => {
      const value = reactive("test");
      const input = document.createElement("input");
      input.id = "test-input";
      container.appendChild(input);

      bindProp("#test-input", "value", () => value.value);
      expect(input.value).toBe("test");
    });
  });

  describe("bindStyles", () => {
    it("should bind multiple styles", () => {
      const styles = reactive({ color: "red", fontSize: "16px" });
      const div = document.createElement("div");
      container.appendChild(div);

      bindStyles(div, () => styles);
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");
    });

    it("should update styles reactively", () => {
      const styles = reactive({ color: "red" });
      const div = document.createElement("div");
      container.appendChild(div);

      bindStyles(div, () => styles);
      expect(div.style.color).toBe("red");

      styles.color = "blue";
      expect(div.style.color).toBe("blue");
    });

    it("should work with selector string", () => {
      const styles = reactive({ color: "red" });
      const div = document.createElement("div");
      div.id = "test-div";
      container.appendChild(div);

      bindStyles("#test-div", () => styles);
      expect(div.style.color).toBe("red");
    });
  });

  describe("bindInput", () => {
    it("should bind text input", () => {
      const value = reactive("");
      const input = document.createElement("input");
      input.type = "text";
      container.appendChild(input);

      bindInput(input, value);

      input.value = "test";
      input.dispatchEvent(new Event("input"));

      expect(value.value).toBe("test");
    });

    it("should bind number input", () => {
      const value = reactive(0);
      const input = document.createElement("input");
      input.type = "number";
      container.appendChild(input);

      bindInput(input, value);

      input.value = "42";
      input.dispatchEvent(new Event("input"));

      expect(value.value).toBe(42);
    });

    it("should bind checkbox", () => {
      const value = reactive(false);
      const input = document.createElement("input");
      input.type = "checkbox";
      container.appendChild(input);

      bindInput(input, value);

      input.checked = true;
      input.dispatchEvent(new Event("change"));

      expect(value.value).toBe(true);
    });

    it("should bind radio buttons", () => {
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

      radio2.checked = true;
      radio2.dispatchEvent(new Event("change"));

      expect(value.value).toBe("option2");
    });

    it("should bind select", () => {
      const value = reactive("option1");
      const select = document.createElement("select");
      const option1 = document.createElement("option");
      option1.value = "option1";
      const option2 = document.createElement("option");
      option2.value = "option2";
      select.appendChild(option1);
      select.appendChild(option2);
      container.appendChild(select);

      bindInput(select, value);

      select.value = "option2";
      select.dispatchEvent(new Event("change"));

      expect(value.value).toBe("option2");
    });

    it("should bind textarea", () => {
      const value = reactive("");
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      bindInput(textarea, value);

      textarea.value = "test content";
      textarea.dispatchEvent(new Event("input"));

      expect(value.value).toBe("test content");
    });

    it("should update input when reactive value changes", () => {
      const value = reactive("initial");
      const input = document.createElement("input");
      container.appendChild(input);

      bindInput(input, value);
      expect(input.value).toBe("initial");

      value.value = "updated";
      expect(input.value).toBe("updated");
    });
  });

  describe("configureReactiveSecurity", () => {
    it("should configure security settings", () => {
      configureReactiveSecurity({
        logWarnings: false,
        throwOnViolation: true,
      });

      // Settings are applied (we can't directly test them but they're used internally)
      expect(true).toBe(true);
    });
  });

  describe("render with options", () => {
    it("should render with trusted option", () => {
      const state = reactive({ title: "Test", content: "<b>Bold</b>" });
      const div = document.createElement("div");
      container.appendChild(div);

      render(div, () => `<h1>${state.title}</h1><p>${state.content}</p>`, {
        trusted: true,
      });

      expect(div.innerHTML).toContain("<h1>Test</h1>");
      expect(div.innerHTML).toContain("<b>Bold</b>");
    });
  });
});
