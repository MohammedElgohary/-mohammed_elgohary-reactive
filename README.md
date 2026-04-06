# Reactive

Lightweight, framework-agnostic reactive state management. Zero dependencies.

## Install

```bash
npm install @mohammed_elgohary/reactive
```

## Usage

```typescript
import { reactive, computed, effect } from "@mohammed_elgohary/reactive";

const state = reactive({ count: 0 });
const doubled = computed(() => state.count * 2);

effect(() => {
  console.log(state.count, doubled.value);
});

state.count++; // triggers effect automatically
```

## API

### Core

#### `reactive(value)`

Creates reactive state. Objects are deeply reactive. Supports plain objects, arrays, `Map`, `Set`, `Date`, `RegExp`, typed arrays, and `ArrayBuffer`.

```typescript
const state = reactive({ count: 0, name: "John" });
state.count = 5; // triggers effects
state.user.age = 30; // nested — also reactive
```

Prefer wrapping primitives in an object:

```typescript
// prefer
const state = reactive({ count: 0 });
state.count = 5;

// works but requires .value
const count = reactive(0);
count.value = 5;
```

#### `computed(() => expr)`

Derived value that updates automatically when dependencies change. Lazy — only recomputes when accessed.

```typescript
const doubled = computed(() => state.count * 2);
console.log(doubled.value);
doubled.dispose(); // stop tracking
```

#### `computedAsync(() => Promise<T>, options?)`

Async derived value. Race-condition safe. Reads inside `await` are not tracked — extract them before the first `await`.

```typescript
const user = computedAsync(
  async () => {
    const id = state.userId; // tracked
    return fetch(`/api/users/${id}`).then((r) => r.json());
  },
  { initialValue: null, onError: (err) => console.error(err) },
);

user.value; // resolved data
user.loading; // true while pending
user.error; // last error or null
user.dispose();
```

#### `effect(fn, options?)`

Runs `fn` immediately and re-runs when dependencies change. Returns a stop function.

```typescript
const stop = effect(() => {
  console.log(state.count);
  return () => console.log("cleanup");
});

stop();
effect(() => riskyOp(), { onError: (err) => report(err) });
```

#### `batch(fn)`

Groups multiple updates into a single notification pass.

```typescript
batch(() => {
  state.a = 1;
  state.b = 2;
  state.c = 3;
}); // one notification instead of three
```

#### `watch(source, callback, options?)`

Observes a reactive source and calls `callback(newValue, oldValue)` on change.

```typescript
const stop = watch(
  () => state.count,
  (newVal, oldVal) => console.log(newVal, oldVal),
  { immediate: true },
);

// Multiple sources
watch([() => state.a, () => state.b], ([newA, newB]) =>
  console.log(newA, newB),
);

// Property shorthand
watch(state, "count", (newVal) => console.log(newVal));
```

#### `watchMultiple(sources, callback, options?)`

```typescript
watchMultiple([() => state.a, () => state.b], ([newA, newB]) =>
  console.log(newA, newB),
);
```

#### `watchProperty(obj, key, callback, options?)`

```typescript
watchProperty(state, "count", (newVal, oldVal) => console.log(newVal));
```

---

### DOM Binding

All binding functions return a cleanup function.

```typescript
bindText("#el", () => state.name);

bindHTML("#el", () => state.html);
bindHTML("#el", () => trustedHtml, { trusted: true });

bindAttr("#el", "disabled", () => state.count === 0);
bindAttr("#el", "href", () => state.url);
bindAttr("#el", "href", () => state.url, { allowDangerousUrls: true });

bindClass("#el", "active", () => state.isActive);

bindStyle("#el", "color", () => (state.isError ? "red" : "black"));

bindStyles("#el", {
  "background-color": () => state.bg,
  "font-size": () => `${state.size}px`,
});
bindStyles("#el", state.styles); // reactive object

bindProp("#el", "scrollTop", () => state.scroll);

// Two-way input
const name = reactive("");
bindInput("#input", name);

const state = reactive({ name: "", age: 0 });
bindInput("#name-input", state, "name");
bindInput("#age-input", state, "age");

bindMultiple([
  { selector: "#title", type: "text", target: "", source: () => state.title },
  { selector: "#box", type: "class", target: "active", source: () => state.on },
]);

render("#list", () => items.map((i) => `<li>${i}</li>`).join(""));
render("#app", () => template(), { trusted: true });

// Unified bind
bind("#el", () => state.text);
bind("#el", "class:active", () => state.on);
bind("#el", "style:color", () => state.color);
bind("#el", "styles", state.styles);
bind("#el", "prop:scrollTop", () => state.scroll);
bind("#el", "href", () => state.url);
```

---

### Event Binding

All event functions return a cleanup function. Selectors accept `string`, `Element`, `Document`, or `Window`.

```typescript
bindAction("#btn", "click", (e) => console.log(e));
bindAction("#form", "submit", handler, { preventDefault: true });

onClick("#btn", (e) => {});
onDblClick("#btn", (e) => {});
onInput("#input", (e) => {});
onChange("#select", (e) => {});
onSubmit("#form", (e) => {}); // preventDefault on by default
onKeyDown("#el", (e) => {});
onKeyUp("#el", (e) => {});
onFocus("#el", (e) => {});
onBlur("#el", (e) => {});
onMouseEnter("#el", (e) => {});
onMouseLeave("#el", (e) => {});
onScroll("#el", (e) => {}); // passive by default

// Event delegation on document
onClick(document, (e) => {
  const btn = e.target.closest(".my-btn");
  if (btn) handle(btn);
});

// Key helpers
onKey("#input", "Enter", () => submit());
onKey("#input", ["Enter", "Tab"], (e) => handle(e));
onKey(
  "#input",
  (e) => e.ctrlKey && e.key === "s",
  () => save(),
);
onEnter("#input", () => submit());
onEscape("#modal", () => close());
```

`bindAction` options:

```typescript
{
  preventDefault?: boolean
  stopPropagation?: boolean
  stopImmediatePropagation?: boolean
  capture?: boolean
  once?: boolean
  passive?: boolean
  self?: boolean
  debounce?: number
}
```

---

### Utilities

```typescript
ref(value); // alias for reactive()
readonly(source); // read-only wrapper — warns on write
readonlyObject(obj); // Proxy that throws on write/delete
markRaw(obj); // exclude from reactivity
isRaw(obj); // check if marked raw
toRaw(reactive); // extract raw value from primitive reactive
shallowReactive(obj); // only top-level properties reactive
isReactive(value); // true if reactive primitive wrapper
isComputed(value); // true if computed
isBatchingUpdates(); // true inside batch()
```

---

### Debug

```typescript
setDebug(true);
isDebugEnabled();
trackReactive(state);
trackReactive(myComputed, "computed");
getDebugInfo(state);
logTrackedReactive();
clearDebugTracking();
```

### Security

```typescript
escapeHtmlEntities(str);
sanitizeHtmlContent(html);
isUrlSafe(url);
configureReactiveSecurity({ logWarnings, throwOnViolation });
```

---

## Browser (No Build Step)

```html
<script src="https://unpkg.com/@mohammed_elgohary/reactive/dist/reactive.iife.js"></script>
<script>
  const { reactive, mount, bindText, onClick } = Reactive;

  const state = reactive({ count: 0 });
  bindText("#counter", () => state.count);
  onClick("#btn", () => state.count++);
</script>
```

The library automatically injects `body { opacity: 0 }` on load and adds `body.r-ready { opacity: 1 }` after `mount()` completes — preventing flash of unresolved template expressions.

---

## Template Parser

Write reactive UIs directly in HTML. No manual wiring.

```html
<script src="reactive.iife.js"></script>

<body>
  <p>{{ counter.count }}</p>
  <button @click="counter.count++">+</button>
  <input :model="user.name" />
  <p :show="counter.count > 0">Positive!</p>

  <!-- Event Modifiers -->
  <form @submit.prevent="save">
    <button @click.stop="doSomething">Stop Propagation</button>
    <div @click.self="close">Only clicks on me</div>
    <input @input.debounce.500="search" placeholder="Search..." />
    <input
      :model.debounce.300="filters.search"
      placeholder="Debounced model..."
    />
  </form>

  <script>
    const { reactive } = Reactive;
    const counter = reactive({ count: 0 });
    const user = reactive({ name: "Ali" });
    // mount() is called automatically on DOMContentLoaded
  </script>
</body>
```

### Zero-config (How it works)

The library automatically detects `reactive()` states defined as window globals. **Note: You must use `var` instead of `const` or `let` in global script tags for this automatic discovery to work, as `const`/`let` do not attach to the `window` object.**

```javascript
<script>
  // Works with zero-config
  var counter = reactive({ count: 0 });
</script>

<script>
  // Does NOT work with zero-config (not on window)
  const user = reactive({ name: "Ali" });

  // You must call mount() explicitly for const/let or modules
  mount({ user });
</script>
```

It schedules a microtask to:

1. Scan the global scope for reactive objects.
2. Register them by their variable names.
3. Parse the DOM and bind expressions.

This allows you to "just use" `reactive()` without any manual wiring for simple scripts.

### Syntax

| Syntax                | Description                               |
| --------------------- | ----------------------------------------- |
| `{{ expr }}`          | Text interpolation                        |
| `:attr="expr"`        | Attribute binding                         |
| `:class="expr"`       | Class binding (string or `{ cls: bool }`) |
| `:style="expr"`       | Style binding (object)                    |
| `:show="expr"`        | Toggle visibility                         |
| `:html="expr"`        | Inner HTML (sanitized)                    |
| `:model="state.key"`  | Two-way input binding                     |
| `:if="expr"`          | Conditional rendering                     |
| `:else`               | Else for conditional rendering            |
| `:for="item in list"` | List rendering                            |
| `@event="statement"`  | Event handler (`$event` available)        |
| `@event.prevent`      | Call `e.preventDefault()`                 |
| `@event.stop`         | Call `e.stopPropagation()`                |
| `@event.self`         | Only trigger if `e.target` is the element |
| `@event.once`         | Trigger once and remove                   |
| `@event.debounce`     | Debounce (default 300ms)                  |
| `@event.debounce.500` | Debounce with custom delay (ms)           |
| `:model.debounce.300` | Debounced two-way binding                 |
| `:model.number`       | Automatically cast input to number        |
| `:model.trim`         | Automatically trim whitespace             |
| `@keydown.enter`      | Trigger only on Enter key                 |
| `@keydown.esc`        | Trigger only on Escape key                |
| `@event.capture`      | Use capture phase                         |
| `@event.passive`      | Passive event listener                    |

### Performance

- **Targeted Updates**: Only the specific properties referenced in an expression are tracked. Changing `state.a` will not re-evaluate expressions that only reference `state.b`.
- **Live DOM**: The parser automatically detects and binds dynamically added elements using `MutationObserver`.
- **Pre-compiled Regexes**: State name detection is optimized with pre-compiled regular expressions.
- **TreeWalker**: Efficient DOM traversal using native browser APIs.

### Security

- **Sandbox**: Expressions are executed in a sandboxed environment that blocks access to sensitive globals like `window`, `document`, `fetch`, and `eval`.
- **Obfuscation**: Internal implementation details (like scope attributes and variable names) are randomized at runtime to prevent tampering.
- **Sanitization**: `:html` binding automatically sanitizes content to prevent XSS.
- **URL Validation**: Attribute bindings for URLs (like `href` and `src`) are validated by default.

### mount({ name: state, ... })

Explicitly register states and parse a specific root element. Recommended for bundlers where states are not global.

```javascript
const counter = reactive({ count: 0 });
const user = reactive({ name: "Ali" });
mount({ counter, user });
```

### parse(root, scope)

Low-level — parse a specific subtree with an explicit scope.

```javascript
const stop = parse(document.querySelector("#app"), { counter, user });
stop(); // tear down bindings
```

### unmount()

Tears down all active bindings and disconnects observers. Useful for SPA navigation or testing.

---

## Bundle Sizes

| Build                   | Size (min+gzip) | Use case              |
| ----------------------- | --------------- | --------------------- |
| `reactive.iife.js`      | ~8.4KB          | Browser (Direct tag)  |
| `reactive.min.js` (ESM) | ~10.6KB         | Bundler (Production)  |
| `reactive.js` (ESM)     | ~12.7KB         | Bundler (Development) |

---

MIT
