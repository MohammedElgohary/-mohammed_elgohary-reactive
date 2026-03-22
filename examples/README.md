# Reactive Examples

Professional examples demonstrating all features of the Reactive framework.

## 📁 Structure

```
examples/
├── index.html           # Examples gallery
├── README.md            # This file
│
├── 01-basics/           # Core concepts
│   ├── reactive.html    # reactive() - primitives & objects
│   ├── computed.html    # computed() - derived values
│   ├── effect.html      # effect() - side effects
│   └── batch.html       # batch() - grouped updates
│
├── 02-dom-binding/      # DOM binding features
│   ├── bind-text.html   # bindText() - text content
│   ├── bind-input.html  # bindInput() - two-way binding
│   ├── bind-class-style.html  # bindClass() & bindStyle()
│   ├── bind-advanced.html     # bindAttr(), bindProp(), bindMultiple(), render()
│   └── security.html    # XSS protection & sanitization
│
├── 03-watch/            # Watch features
│   ├── watch.html       # watch() - react to changes
│   └── watch-advanced.html    # watchMultiple(), watchProperty()
│
├── 04-utilities/        # Utility functions
│   ├── utilities.html   # ref(), toRaw(), markRaw(), readonly(), shallowReactive()
│   └── debug.html       # setDebug(), trackReactive(), getDebugInfo()
│
├── 05-real-world/       # Complete applications
│   ├── counter.html     # Simple counter
│   ├── todo-list.html   # Todo application
│   ├── shopping-cart.html  # Shopping cart
│   └── computed-async.html # Async computed demo
│
└── 06-integration/      # Combined features
    └── full-app.html    # All features together
```

## 🚀 Quick Start

### Option 1: Open Directly (IIFE Build)

All examples use the IIFE build which works with `file://` protocol.
Simply double-click any HTML file to open it in your browser.

### Option 2: Local Server

For the best experience, use a local server:

```bash
# Using Python
cd reactive/examples
python -m http.server 8000

# Using Node.js
npx http-server

# Then open: http://localhost:8000
```

## 📖 Complete Feature Coverage

### Core Reactivity

| Feature           | Description            | Example                             |
| ----------------- | ---------------------- | ----------------------------------- |
| `reactive()`      | Create reactive values | `01-basics/reactive.html`           |
| `computed()`      | Derived values         | `01-basics/computed.html`           |
| `computedAsync()` | Async derived values   | `05-real-world/computed-async.html` |
| `effect()`        | Side effects           | `01-basics/effect.html`             |
| `batch()`         | Batch updates          | `01-basics/batch.html`              |

### DOM Binding

| Feature          | Description              | Example                                |
| ---------------- | ------------------------ | -------------------------------------- |
| `bindText()`     | Bind text content        | `02-dom-binding/bind-text.html`        |
| `bindHTML()`     | Bind HTML content        | `02-dom-binding/bind-text.html`        |
| `bindInput()`    | Two-way binding          | `02-dom-binding/bind-input.html`       |
| `bindClass()`    | Dynamic classes          | `02-dom-binding/bind-class-style.html` |
| `bindStyle()`    | Dynamic inline style     | `02-dom-binding/bind-class-style.html` |
| `bindStyles()`   | Multiple styles at once  | `02-dom-binding/bind-class-style.html` |
| `bindAttr()`     | Bind HTML attributes     | `02-dom-binding/bind-advanced.html`    |
| `bindProp()`     | Bind DOM properties      | `02-dom-binding/bind-advanced.html`    |
| `bindMultiple()` | Multiple bindings        | `02-dom-binding/bind-advanced.html`    |
| `render()`       | Dynamic HTML content     | `02-dom-binding/bind-advanced.html`    |
| `bind()`         | Unified auto-detect bind | `02-dom-binding/bind-advanced.html`    |

### Security Utilities

| Feature                 | Description                    | Example                        |
| ----------------------- | ------------------------------ | ------------------------------ |
| `escapeHtmlEntities()`  | Escape HTML special characters | `02-dom-binding/security.html` |
| `sanitizeHtmlContent()` | Sanitize untrusted HTML        | `02-dom-binding/security.html` |
| `isUrlSafe()`           | Validate URLs for XSS          | `02-dom-binding/security.html` |

**When to Use Each:**

| Scenario              | Solution                  | Why                                       |
| --------------------- | ------------------------- | ----------------------------------------- |
| Display user text     | `bindText()`              | Auto-escapes, shows as text               |
| Display user HTML     | `bindHTML()` / `render()` | Auto-sanitized, removes dangerous tags    |
| User data in template | `escapeHtmlEntities()`    | Escape user parts in your template        |
| Trusted templates     | `{ trusted: true }`       | Skip sanitization for dev-controlled HTML |
| Validate URLs         | `isUrlSafe()`             | Block javascript:, vbscript: URLs         |
| Clean untrusted HTML  | `sanitizeHtmlContent()`   | Manual sanitization for API data          |

**Security Notes:**

- `bindHTML()` and `render()` sanitize HTML by default (removes `<script>`, `onclick`, etc.)
- Use `{ trusted: true }` option only for trusted developer-controlled content
- `bindAttr()` blocks dangerous attributes like `onclick`, `onerror`
- `bindProp()` blocks dangerous properties like `innerHTML`

### Watch

| Feature           | Description           | Example                        |
| ----------------- | --------------------- | ------------------------------ |
| `watch()`         | Watch single value    | `03-watch/watch.html`          |
| `watchMultiple()` | Watch multiple values | `03-watch/watch-advanced.html` |
| `watchProperty()` | Watch object property | `03-watch/watch-advanced.html` |

### Utilities

| Feature             | Description                  | Example                       |
| ------------------- | ---------------------------- | ----------------------------- |
| `ref()`             | Shorthand for reactive       | `04-utilities/utilities.html` |
| `toRaw()`           | Get original object          | `04-utilities/utilities.html` |
| `markRaw()`         | Prevent reactivity           | `04-utilities/utilities.html` |
| `isRaw()`           | Check if marked raw          | `04-utilities/utilities.html` |
| `isReactive()`      | Check if value is reactive   | `04-utilities/utilities.html` |
| `isComputed()`      | Check if value is a computed | `04-utilities/utilities.html` |
| `readonly()`        | Read-only primitive wrapper  | `04-utilities/utilities.html` |
| `readonlyObject()`  | Read-only object proxy       | `04-utilities/utilities.html` |
| `shallowReactive()` | Shallow reactivity           | `04-utilities/utilities.html` |

### Debug Tools

| Feature                | Description            | Example                   |
| ---------------------- | ---------------------- | ------------------------- |
| `setDebug()`           | Enable/disable debug   | `04-utilities/debug.html` |
| `isDebugEnabled()`     | Check debug status     | `04-utilities/debug.html` |
| `trackReactive()`      | Track reactive values  | `04-utilities/debug.html` |
| `getDebugInfo()`       | Get debug information  | `04-utilities/debug.html` |
| `logTrackedReactive()` | Log all tracked values | `04-utilities/debug.html` |
| `clearDebugTracking()` | Clear tracking         | `04-utilities/debug.html` |

## 🎯 Learning Path

1. **Start with Basics** - Learn `reactive()`, `computed()`, `effect()`
2. **Try DOM Binding** - See how to bind reactive values to the DOM
3. **Explore Watch** - Learn to react to specific value changes
4. **Learn Utilities** - Understand `ref`, `toRaw`, `markRaw`, `readonly`
5. **Debug Tools** - Learn to debug reactive applications
6. **Build Real Apps** - Study the todo list and shopping cart examples
7. **Full Integration** - See all features working together

## 📦 Build Versions

Examples use the full IIFE build. For production, choose the right build:

| Build                      | Size (approx) | Features                 |
| -------------------------- | ------------- | ------------------------ |
| `reactive.minimal.iife.js` | ~5KB          | Core + basic DOM binding |
| `reactive.iife.min.js`     | ~14KB         | Full features            |
