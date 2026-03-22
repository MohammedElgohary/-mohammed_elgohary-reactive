# Security Guide

Reactive includes built-in protection against Cross-Site Scripting (XSS) attacks. This guide explains the security features and best practices.

## Quick Reference

| Scenario              | Solution                  | Example                          |
| --------------------- | ------------------------- | -------------------------------- |
| Display user text     | `bindText()`              | Names, titles, labels            |
| Display user HTML     | `bindHTML()` / `render()` | Comments, posts (auto-sanitized) |
| User data in template | `escapeHtmlEntities()`    | Building HTML with user values   |
| Trusted templates     | `{ trusted: true }`       | Developer-written HTML           |
| Validate URLs         | `isUrlSafe()`             | User-provided links              |
| Clean untrusted HTML  | `sanitizeHtmlContent()`   | API responses, database content  |

## Default Behavior (Safe by Default)

`bindHTML()` and `render()` automatically sanitize HTML:

```javascript
const { bindHTML, render } = Reactive;

// Malicious input is automatically sanitized
const userInput = '<b>Hello</b><script>alert("xss")</script>';

bindHTML("#output", () => userInput);
// Output: <b>Hello</b> (script removed)

render("#list", () => `<div>${userInput}</div>`);
// Output: <div><b>Hello</b></div> (script removed)
```

## Security Utilities

### escapeHtmlEntities(str)

Converts HTML special characters to entities. Use when you want to display HTML as text.

```javascript
const { escapeHtmlEntities } = Reactive;

const input = '<script>alert("xss")</script>';
const escaped = escapeHtmlEntities(input);
// Result: "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
```

**When to use:**

- Displaying code snippets
- Showing user input as plain text
- Building templates with user data

### sanitizeHtmlContent(html)

Removes dangerous tags and attributes but preserves safe HTML formatting.

```javascript
const { sanitizeHtmlContent } = Reactive;

const dirty = '<b>Bold</b><script>bad()</script><a onclick="evil()">link</a>';
const clean = sanitizeHtmlContent(dirty);
// Result: "<b>Bold</b><a>link</a>"
```

**What gets removed:**

- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<base>`, `<link>`, `<meta>` tags
- All `on*` event handlers (`onclick`, `onerror`, `onload`, etc.)
- `javascript:`, `vbscript:`, `data:text/html` URLs

### isUrlSafe(url)

Validates URLs to prevent JavaScript injection.

```javascript
const { isUrlSafe } = Reactive;

isUrlSafe("https://example.com"); // true
isUrlSafe("/path/to/page"); // true
isUrlSafe("javascript:alert('xss')"); // false
isUrlSafe("vbscript:msgbox('xss')"); // false
isUrlSafe("data:text/html,<script>..."); // false
```

## Using { trusted: true }

Skip sanitization for trusted, developer-controlled content:

```javascript
// ✅ Safe - developer-controlled template
render(
  "#app",
  () => `
  <div class="card">
    <h1>${state.title}</h1>
    <p>${state.description}</p>
  </div>
`,
  { trusted: true },
);

// ❌ NEVER do this with user input!
render("#output", () => userInput, { trusted: true }); // DANGEROUS!
```

**Safe to use { trusted: true }:**

- Templates you wrote in your code
- Static HTML from your build process
- Content from a trusted CMS with server-side sanitization

**Never use { trusted: true } for:**

- User comments or posts
- Form input values
- URL parameters
- Data from untrusted APIs

## User Data in Templates

When building templates with user data, escape the user parts:

```javascript
const { escapeHtmlEntities, render } = Reactive;

// User-provided data
const userName = '<script>alert("xss")</script>';
const message = "Hello <b>world</b>";

// Escape user data, keep template structure
render(
  "#comments",
  () => `
  <div class="comment">
    <strong>${escapeHtmlEntities(userName)}</strong>
    <p>${escapeHtmlEntities(message)}</p>
  </div>
`,
  { trusted: true },
);

// Output is safe - user data is escaped
```

## Blocked Attributes and Properties

### bindAttr() Blocks

Event handlers and dangerous attributes are automatically blocked:

```javascript
// These will log an error and do nothing:
bindAttr("#el", "onclick", () => "evil()"); // Blocked
bindAttr("#el", "onerror", () => "evil()"); // Blocked
bindAttr("#el", "onmouseover", () => "evil()"); // Blocked
```

**Blocked attributes:**

- All `on*` event handlers
- `formaction`, `srcdoc`, `xlink:href`, `data`

### bindProp() Blocks

Dangerous properties are blocked:

```javascript
// These will log an error and do nothing:
bindProp("#el", "innerHTML", () => html); // Blocked - use bindHTML()
bindProp("#el", "outerHTML", () => html); // Blocked
```

### URL Validation in bindAttr()

URLs are automatically validated for `href`, `src`, `action`, `formaction`, `poster`, `data`:

```javascript
// Dangerous URLs are blocked with console error:
bindAttr("#link", "href", () => "javascript:alert('xss')"); // Blocked
bindAttr("#img", "src", () => "javascript:evil()"); // Blocked
```

## Escape vs Sanitize

| Method                  | Input                               | Output                    | Use Case        |
| ----------------------- | ----------------------------------- | ------------------------- | --------------- |
| `escapeHtmlEntities()`  | `<b>Bold</b>`                       | `&lt;b&gt;Bold&lt;/b&gt;` | Show as text    |
| `sanitizeHtmlContent()` | `<b>Bold</b><script>bad()</script>` | `<b>Bold</b>`             | Allow safe HTML |

## Best Practices

1. **Use `bindText()` for plain text** - It's always safe
2. **Let `bindHTML()` and `render()` sanitize by default** - Don't use `{ trusted: true }` unless necessary
3. **Escape user data in templates** - Use `escapeHtmlEntities()` for user values
4. **Validate URLs** - Use `isUrlSafe()` before using user-provided URLs
5. **Never trust user input** - Always sanitize or escape data from users, APIs, or databases

## Example: Safe Comment System

```javascript
const { reactive, render, escapeHtmlEntities, sanitizeHtmlContent } = Reactive;

const comments = reactive({ list: [] });

function addComment(author, content, allowHtml = false) {
  comments.list.push({
    author: escapeHtmlEntities(author), // Always escape author name
    content: allowHtml
      ? sanitizeHtmlContent(content) // Allow safe HTML formatting
      : escapeHtmlEntities(content), // Or escape completely
    date: new Date().toISOString(),
  });
}

render(
  "#comments",
  () =>
    comments.list
      .map(
        (c) => `
  <div class="comment">
    <strong>${c.author}</strong>
    <time>${c.date}</time>
    <p>${c.content}</p>
  </div>
`,
      )
      .join(""),
  { trusted: true },
); // Safe because data is pre-sanitized
```

## Interactive Demo

See `examples/02-dom-binding/security.html` for an interactive demonstration of all security features.
