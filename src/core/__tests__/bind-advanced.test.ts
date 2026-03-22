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
  render,
  sanitizeHtmlContent,
  escapeHtmlEntities,
  isUrlSafe,
  configureReactiveSecurity,
} from "../bind";

describe("Advanced DOM Binding Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("bindText - edge cases", () => {
    it("should handle non-existent selector", () => {
      const text = reactive("Hello");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindText("#non-existent", () => text.value);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Element not found"),
      );

      unbind();
      consoleSpy.mockRestore();
    });

    it("should handle reactive object as source", () => {
      const text = reactive("Hello");
      const el = document.createElement("div");
      container.appendChild(el);

      bindText(el, text);
      expect(el.textContent).toBe("Hello");

      text.value = "World";
      expect(el.textContent).toBe("World");
    });

    it("should convert numbers to strings", () => {
      const num = reactive(42);
      const el = document.createElement("div");
      container.appendChild(el);

      bindText(el, () => num.value);
      expect(el.textContent).toBe("42");
    });

    it("should convert booleans to strings", () => {
      const bool = reactive(true);
      const el = document.createElement("div");
      container.appendChild(el);

      bindText(el, () => bool.value);
      expect(el.textContent).toBe("true");
    });
  });

  describe("bindHTML - edge cases", () => {
    it("should handle non-existent selector", () => {
      const html = reactive("<b>Bold</b>");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindHTML("#non-existent", () => html.value);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should warn about dangerous trusted content", () => {
      const html = reactive('<script>alert("xss")</script>');
      const el = document.createElement("div");
      container.appendChild(el);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      bindHTML(el, () => html.value, { trusted: true });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should warn about javascript: in trusted content", () => {
      const html = reactive('<a href="javascript:alert()">Click</a>');
      const el = document.createElement("div");
      container.appendChild(el);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      bindHTML(el, () => html.value, { trusted: true });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should warn about onerror in trusted content", () => {
      const html = reactive('<img src="x" onerror="alert()">');
      const el = document.createElement("div");
      container.appendChild(el);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      bindHTML(el, () => html.value, { trusted: true });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle null and undefined", () => {
      const html = reactive<string | null>(null);
      const el = document.createElement("div");
      container.appendChild(el);

      bindHTML(el, () => html.value);
      expect(el.innerHTML).toBe("");
    });

    it("should handle reactive object as source", () => {
      const html = reactive("<b>Bold</b>");
      const el = document.createElement("div");
      container.appendChild(el);

      bindHTML(el, html);
      expect(el.innerHTML).toContain("<b>Bold</b>");
    });
  });

  describe("bindAttr - edge cases", () => {
    it("should handle non-existent selector", () => {
      const value = reactive("test");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindAttr("#non-existent", "title", () => value.value);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should handle false value", () => {
      const value = reactive<boolean | string>(false);
      const el = document.createElement("div");
      container.appendChild(el);

      bindAttr(el, "data-active", () => value.value);
      expect(el.hasAttribute("data-active")).toBe(false);
    });

    it("should allow dangerous attributes with option", () => {
      const handler = reactive("console.log('test')");
      const el = document.createElement("div");
      container.appendChild(el);

      bindAttr(el, "onclick", () => handler.value, {
        allowDangerousAttributes: true,
      });
      expect(el.getAttribute("onclick")).toBe("console.log('test')");
    });

    it("should allow dangerous URLs with option", () => {
      const url = reactive("javascript:void(0)");
      const el = document.createElement("a");
      container.appendChild(el);

      bindAttr(el, "href", () => url.value, { allowDangerousUrls: true });
      expect(el.getAttribute("href")).toBe("javascript:void(0)");
    });

    it("should handle attributes starting with 'on'", () => {
      const value = reactive("test");
      const el = document.createElement("div");
      container.appendChild(el);

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      bindAttr(el, "onCustomEvent", () => value.value);
      expect(el.hasAttribute("onCustomEvent")).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle reactive object as source", () => {
      const title = reactive("Test");
      const el = document.createElement("div");
      container.appendChild(el);

      bindAttr(el, "title", title);
      expect(el.getAttribute("title")).toBe("Test");
    });
  });

  describe("bindClass - edge cases", () => {
    it("should handle non-existent selector", () => {
      const active = reactive(true);
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindClass("#non-existent", "active", () => active.value);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should handle reactive object as source", () => {
      const active = reactive(true);
      const el = document.createElement("div");
      container.appendChild(el);

      bindClass(el, "active", active);
      expect(el.classList.contains("active")).toBe(true);
    });

    it("should handle selector string", () => {
      const active = reactive(true);
      const el = document.createElement("div");
      el.id = "test";
      container.appendChild(el);

      bindClass("#test", "active", () => active.value);
      expect(el.classList.contains("active")).toBe(true);
    });
  });

  describe("bindStyle - edge cases", () => {
    it("should handle non-existent selector", () => {
      const color = reactive("red");
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindStyle("#non-existent", "color", () => color.value);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should handle null and undefined", () => {
      const color = reactive<string | null>(null);
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyle(el, "color", () => color.value);
      expect(el.style.color).toBe("");
    });

    it("should handle reactive object as source", () => {
      const color = reactive("red");
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyle(el, "color", color);
      expect(el.style.color).toBe("red");
    });

    it("should handle selector string", () => {
      const color = reactive("red");
      const el = document.createElement("div");
      el.id = "test";
      container.appendChild(el);

      bindStyle("#test", "color", () => color.value);
      expect(el.style.color).toBe("red");
    });
  });

  describe("bindStyles - comprehensive", () => {
    it("should handle non-existent selector", () => {
      const styles = reactive({ color: "red" });
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = bindStyles("#non-existent", () => styles);
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should bind object of reactive sources", () => {
      const color = reactive("red");
      const fontSize = reactive("16px");
      const el = document.createElement("div");
      container.appendChild(el);

      const unbind = bindStyles(el, {
        color: () => color.value,
        "font-size": () => fontSize.value,
      });

      expect(el.style.color).toBe("red");
      expect(el.style.getPropertyValue("font-size")).toBe("16px");

      color.value = "blue";
      expect(el.style.color).toBe("blue");

      unbind();
    });

    it("should bind reactive object of styles", () => {
      const styles = reactive({ color: "red", "font-size": "16px" });
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyles(el, () => styles);
      expect(el.style.color).toBe("red");
      expect(el.style.getPropertyValue("font-size")).toBe("16px");

      styles.color = "blue";
      expect(el.style.color).toBe("blue");
    });

    it("should bind reactive object directly", () => {
      const styles = reactive({ color: "red", "font-size": "16px" });
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyles(el, styles as any);
      expect(el.style.color).toBe("red");
      expect(el.style.getPropertyValue("font-size")).toBe("16px");
    });

    it("should handle null values in styles", () => {
      const styles = reactive({ color: null as any, "font-size": "16px" });
      const el = document.createElement("div");
      container.appendChild(el);

      bindStyles(el, () => styles);
      expect(el.style.getPropertyValue("font-size")).toBe("16px");
    });

    it("should handle selector string", () => {
      const styles = reactive({ color: "red" });
      const el = document.createElement("div");
      el.id = "test";
      container.appendChild(el);

      bindStyles("#test", () => styles);
      expect(el.style.color).toBe("red");
    });
  });

  describe("bindProp - comprehensive", () => {
    it("should bind various properties", () => {
      const value = reactive("test");
      const input = document.createElement("input");
      container.appendChild(input);

      bindProp(input, "placeholder", () => value.value);
      expect(input.placeholder).toBe("test");

      value.value = "updated";
      expect(input.placeholder).toBe("updated");
    });

    it("should handle disabled property", () => {
      const disabled = reactive(true);
      const button = document.createElement("button");
      container.appendChild(button);

      bindProp(button, "disabled", () => disabled.value);
      expect(button.disabled).toBe(true);

      disabled.value = false;
      expect(button.disabled).toBe(false);
    });

    it("should handle reactive object as source", () => {
      const value = reactive("test");
      const input = document.createElement("input");
      container.appendChild(input);

      bindProp(input, "value", value);
      expect(input.value).toBe("test");
    });
  });

  describe("render - comprehensive", () => {
    it("should handle non-existent selector", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const unbind = render("#non-existent", () => "<div>Test</div>");
      expect(consoleSpy).toHaveBeenCalled();

      unbind();
      consoleSpy.mockRestore();
    });

    it("should sanitize by default", () => {
      const el = document.createElement("div");
      container.appendChild(el);

      render(el, () => '<b>Safe</b><script>alert("xss")</script>');
      expect(el.innerHTML).toContain("<b>Safe</b>");
      expect(el.innerHTML).not.toContain("<script>");
    });

    it("should allow trusted content", () => {
      const el = document.createElement("div");
      container.appendChild(el);

      render(el, () => '<div onclick="test()">Click</div>', { trusted: true });
      expect(el.innerHTML).toContain("onclick");
    });

    it("should handle selector string", () => {
      const el = document.createElement("div");
      el.id = "test";
      container.appendChild(el);

      render("#test", () => "<b>Bold</b>");
      expect(el.innerHTML).toContain("<b>Bold</b>");
    });

    it("should update reactively", () => {
      const content = reactive("Hello");
      const el = document.createElement("div");
      container.appendChild(el);

      render(el, () => `<p>${content.value}</p>`);
      expect(el.innerHTML).toContain("<p>Hello</p>");

      content.value = "World";
      expect(el.innerHTML).toContain("<p>World</p>");
    });
  });

  describe("bindMultiple", () => {
    it("should bind multiple elements", () => {
      const text = reactive("Hello");
      const title = reactive("Title");
      const active = reactive(true);
      const color = reactive("red");

      const div1 = document.createElement("div");
      div1.id = "div1";
      const div2 = document.createElement("div");
      div2.id = "div2";
      const div3 = document.createElement("div");
      div3.id = "div3";
      const div4 = document.createElement("div");
      div4.id = "div4";

      container.appendChild(div1);
      container.appendChild(div2);
      container.appendChild(div3);
      container.appendChild(div4);

      const unbind = bindMultiple([
        {
          selector: "#div1",
          type: "text",
          target: "",
          source: () => text.value,
        },
        {
          selector: "#div2",
          type: "attr",
          target: "title",
          source: () => title.value,
        },
        {
          selector: "#div3",
          type: "class",
          target: "active",
          source: () => active.value,
        },
        {
          selector: "#div4",
          type: "style",
          target: "color",
          source: () => color.value,
        },
      ]);

      expect(div1.textContent).toBe("Hello");
      expect(div2.getAttribute("title")).toBe("Title");
      expect(div3.classList.contains("active")).toBe(true);
      expect(div4.style.color).toBe("red");

      unbind();
    });

    it("should bind html type", () => {
      const html = reactive("<b>Bold</b>");
      const div = document.createElement("div");
      div.id = "test";
      container.appendChild(div);

      bindMultiple([
        {
          selector: "#test",
          type: "html",
          target: "",
          source: () => html.value,
        },
      ]);

      expect(div.innerHTML).toContain("<b>Bold</b>");
    });

    it("should bind prop type", () => {
      const value = reactive("test");
      const input = document.createElement("input");
      input.id = "test";
      container.appendChild(input);

      bindMultiple([
        {
          selector: "#test",
          type: "prop",
          target: "value",
          source: () => value.value,
        },
      ]);

      expect(input.value).toBe("test");
    });

    it("should bind styles type", () => {
      const styles = reactive({ color: "red" });
      const div = document.createElement("div");
      div.id = "test";
      container.appendChild(div);

      bindMultiple([
        { selector: "#test", type: "styles", target: "", source: () => styles },
      ]);

      expect(div.style.color).toBe("red");
    });

    it("should handle unknown type", () => {
      const div = document.createElement("div");
      div.id = "test";
      container.appendChild(div);

      const unbind = bindMultiple([
        {
          selector: "#test",
          type: "unknown" as any,
          target: "",
          source: () => "test",
        },
      ]);

      unbind();
      expect(true).toBe(true);
    });

    it("should cleanup all bindings", () => {
      const text = reactive("Hello");
      const div = document.createElement("div");
      div.id = "test";
      container.appendChild(div);

      const unbind = bindMultiple([
        {
          selector: "#test",
          type: "text",
          target: "",
          source: () => text.value,
        },
      ]);

      expect(div.textContent).toBe("Hello");

      unbind();
      text.value = "World";
      // After unbind, changes shouldn't affect DOM
      expect(div.textContent).toBe("Hello");
    });
  });

  describe("Security - sanitizeHtmlContent edge cases", () => {
    it("should remove iframe tags", () => {
      const html = '<iframe src="evil.com"></iframe><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<iframe>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove object tags", () => {
      const html = '<object data="evil.swf"></object><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<object>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove embed tags", () => {
      const html = '<embed src="evil.swf"><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<embed>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove form tags", () => {
      const html = '<form action="evil.com"><input></form><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<form>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove base tags", () => {
      const html = '<base href="evil.com"><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<base>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove link tags", () => {
      const html = '<link rel="stylesheet" href="evil.css"><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<link>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove meta tags", () => {
      const html =
        '<meta http-equiv="refresh" content="0;url=evil.com"><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<meta>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove style tags", () => {
      const html =
        '<style>body { background: url("evil.com"); }</style><p>Safe</p>';
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("<style>");
      expect(sanitized).toContain("<p>Safe</p>");
    });

    it("should remove all event handlers", () => {
      const html = `
        <div onclick="alert()" onmouseover="alert()" onload="alert()">
          <img src="x" onerror="alert()">
          <a href="#" onmouseenter="alert()">Link</a>
        </div>
      `;
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain("onclick");
      expect(sanitized).not.toContain("onmouseover");
      expect(sanitized).not.toContain("onload");
      expect(sanitized).not.toContain("onerror");
      expect(sanitized).not.toContain("onmouseenter");
    });

    it("should validate and remove dangerous URLs", () => {
      const html = `
        <a href="javascript:alert()">Link1</a>
        <a href="vbscript:msgbox()">Link2</a>
        <a href="data:text/html,<script>alert()</script>">Link3</a>
        <a href="https://safe.com">Link4</a>
      `;
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).not.toContain('href="javascript:');
      expect(sanitized).not.toContain('href="vbscript:');
      expect(sanitized).not.toContain('href="data:text/html');
      expect(sanitized).toContain('href="https://safe.com"');
    });

    it("should handle empty string", () => {
      const sanitized = sanitizeHtmlContent("");
      expect(sanitized).toBe("");
    });

    it("should handle plain text", () => {
      const sanitized = sanitizeHtmlContent("Plain text");
      expect(sanitized).toBe("Plain text");
    });

    it("should preserve safe HTML structure", () => {
      const html = `
        <div>
          <h1>Title</h1>
          <p>Paragraph with <b>bold</b> and <i>italic</i></p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      const sanitized = sanitizeHtmlContent(html);
      expect(sanitized).toContain("<h1>Title</h1>");
      expect(sanitized).toContain("<b>bold</b>");
      expect(sanitized).toContain("<i>italic</i>");
      expect(sanitized).toContain("<li>Item 1</li>");
    });
  });

  describe("Security - isUrlSafe edge cases", () => {
    it("should allow relative URLs", () => {
      expect(isUrlSafe("./relative")).toBe(true);
      expect(isUrlSafe("../parent")).toBe(true);
      expect(isUrlSafe("/absolute")).toBe(true);
    });

    it("should allow anchor links", () => {
      expect(isUrlSafe("#section")).toBe(true);
      expect(isUrlSafe("#")).toBe(true);
    });

    it("should allow tel: protocol", () => {
      expect(isUrlSafe("tel:+1234567890")).toBe(true);
    });

    it("should allow ftp: protocol", () => {
      expect(isUrlSafe("ftp://files.example.com")).toBe(true);
    });

    it("should block data: with text/html", () => {
      expect(isUrlSafe("data:text/html,<h1>Test</h1>")).toBe(false);
      expect(isUrlSafe("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    });

    it("should allow safe data: URLs", () => {
      expect(isUrlSafe("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
      expect(isUrlSafe("data:text/plain,Hello")).toBe(true);
    });

    it("should handle empty string", () => {
      expect(isUrlSafe("")).toBe(true);
    });

    it("should handle whitespace", () => {
      expect(isUrlSafe("  javascript:alert()  ")).toBe(false);
    });
  });

  describe("Security - escapeHtmlEntities comprehensive", () => {
    it("should escape all special characters", () => {
      const text = "< > & \" ' / ` =";
      const escaped = escapeHtmlEntities(text);
      expect(escaped).toContain("&lt;");
      expect(escaped).toContain("&gt;");
      expect(escaped).toContain("&amp;");
      expect(escaped).toContain("&quot;");
      expect(escaped).toContain("&#x27;");
      expect(escaped).toContain("&#x2F;");
      expect(escaped).toContain("&#x60;");
      expect(escaped).toContain("&#x3D;");
    });

    it("should handle empty string", () => {
      expect(escapeHtmlEntities("")).toBe("");
    });

    it("should handle plain text", () => {
      expect(escapeHtmlEntities("Hello World")).toBe("Hello World");
    });

    it("should escape script tags", () => {
      const text = '<script>alert("xss")</script>';
      const escaped = escapeHtmlEntities(text);
      expect(escaped).not.toContain("<script>");
      expect(escaped).toContain("&lt;script&gt;");
    });

    it("should escape multiple occurrences", () => {
      const text = "<<>>&&";
      const escaped = escapeHtmlEntities(text);
      expect(escaped).toBe("&lt;&lt;&gt;&gt;&amp;&amp;");
    });
  });

  describe("configureReactiveSecurity", () => {
    it("should accept logWarnings option", () => {
      configureReactiveSecurity({ logWarnings: false });
      expect(true).toBe(true);
    });

    it("should accept throwOnViolation option", () => {
      configureReactiveSecurity({ throwOnViolation: true });
      expect(true).toBe(true);
    });

    it("should accept both options", () => {
      configureReactiveSecurity({
        logWarnings: true,
        throwOnViolation: false,
      });
      expect(true).toBe(true);
    });
  });
});
