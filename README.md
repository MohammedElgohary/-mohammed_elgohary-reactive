# Reactive

Lightweight, framework-agnostic reactive state management. Zero dependencies.

## Install

```bash
npm install reactive
```

## Usage

```typescript
import { reactive, computed, effect } from "reactive";

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

Creates reactive state. Objects are deeply reactive — all nested properties are tracked automatically.

```typescript
const state = reactive({ count: 0, name: "John" });
state.count = 5; // triggers effects
state.user.age = 30; // nested — also reactive
```

Passing a primitive directly works but requires `.value` access, which can feel awkward:

```typescript
// avoid — the .value wrapper is a JS limitation
const count = reactive(0);
count.value = 5;

// prefer — wrap in an object
const state = reactive({ count: 0 });
state.count = 5;
```

#### `computed(() => expr)`

Derived value that updates automatically when dependencies change. Lazy — only recomputes when accessed.

```typescript
const doubled = computed(() => state.count * 2);
console.log(doubled.value); // read via .value
doubled.subscribe(() => {}); // subscribe to changes
doubled.dispose(); // stop tracking dependencies
```

#### `computedAsync(() => Promise<T>, options?)`

Async derived value. Re-runs when reactive dependencies change. Race-condition safe — only the latest run updates state. Reads inside `await` are not tracked; extract them before the first `await`.

```typescript
const user = computedAsync(
  async () => {
    const id = state.userId; // sync read — tracked as dependency
    return fetch(`/api/users/${id}`).then((r) => r.json());
  },
  { initialValue: null },
);

user.value; // resolved data (or initialValue while pending)
user.loading; // true while running
user.error; // Error | null

user.subscribe(() => {
  /* called on any state change */
});
user.dispose(); // stop and clean up
```

#### `effect(fn, options?)`

Runs `fn` immediately and re-runs when dependencies change. Returns a cleanup/stop function. `fn` can return a cleanup function that runs before the next execution.

```typescript
const stop = effect(() => {
  console.log(state.count);
  return () => console.log("cleanup");
});

stop(); // stop the effect

// handle errors instead of logging to console
effect(() => riskyOperation(), { onError: (err) => reportError(err) });
```

#### `batch(fn)`

Groups multiple updates into a single notification pass. Returns the value returned by `fn`.

```typescript
const result = batch(() => {
  state.a = 1;
  state.b = 2;
  state.c = 3;
  return state.a + state.b; // returned to caller
}); // one notification instead of three
```

#### `watch(source, callback, options?)`

Observes a reactive source and calls `callback(newValue, oldValue)` on change. Returns a stop function.

```typescript
// Getter function
const stop = watch(
  () => state.count,
  (newVal, oldVal) => console.log(newVal, oldVal),
  { immediate: true }, // run callback immediately on setup
);

// Array of sources (unified overload — same as watchMultiple)
watch([() => state.a, () => state.b], ([newA, newB], [oldA, oldB]) =>
  console.log(newA, newB),
);

// Property shorthand (unified overload — same as watchProperty)
watch(state, "count", (newVal, oldVal) => console.log(newVal));
```

#### `watchMultiple(sources, callback, options?)`

Watch multiple sources at once.

```typescript
watchMultiple([() => state.a, () => state.b], ([newA, newB], [oldA, oldB]) =>
  console.log(newA, newB),
);
```

#### `watchProperty(obj, key, callback, options?)`

Watch a single property on a reactive object.

```typescript
watchProperty(state, "count", (newVal, oldVal) => console.log(newVal));
```

---

### DOM Binding

All binding functions return a cleanup/stop function.

```typescript
// Text content (auto-escapes, safe)
bindText("#el", () => state.name);

// HTML content (sanitized by default — removes scripts, event handlers, etc.)
bindHTML("#el", () => state.html);
bindHTML("#el", () => trustedHtml, { trusted: true }); // skip sanitization

// Attribute (blocks dangerous attrs like onclick, formaction)
bindAttr("#el", "disabled", () => state.count === 0);
bindAttr("#el", "href", () => state.url); // auto-validates URLs

// CSS class toggle
bindClass("#el", "active", () => state.isActive);

// Single inline style
bindStyle("#el", "color", () => (state.isError ? "red" : "black"));

// Multiple styles at once
bindStyles("#el", {
  "background-color": () => state.bg,
  "font-size": () => `${state.size}px`,
});
// or with a reactive object
bindStyles("#el", state.styles);

// Property binding (blocks innerHTML, outerHTML, srcdoc)
bindProp("#el", "scrollTop", () => state.scroll);

// Two-way input binding — primitive reactive
const name = reactive("");
bindInput("#input", name); // works with text, checkbox, radio, select, textarea, file, date

// Two-way input binding — object property (no .value wrapper needed)
const state = reactive({ name: "", age: 0 });
bindInput("#name-input", state, "name");
bindInput("#age-input", state, "age");

// Multiple bindings at once
bindMultiple([
  { selector: "#title", type: "text", target: "", source: () => state.title },
  { selector: "#box", type: "class", target: "active", source: () => state.on },
]);

// Render HTML template (sanitized by default)
render("#list", () => items.map((i) => `<li>${i}</li>`).join(""));
render("#app", () => template(), { trusted: true });

// Unified bind — auto-detects type
bind("#el", () => state.text); // text or HTML (auto-detected)
bind("#el", "class:active", () => state.on); // class
bind("#el", "style:color", () => state.color); // style
bind("#el", "styles", state.styles); // multiple styles
bind("#el", "prop:scrollTop", () => state.scroll); // property
bind("#el", "href", () => state.url); // attribute
```

---

### Event Binding

All event functions return a cleanup/stop function.

```typescript
// Generic — full TypeScript autocomplete for event types
bindAction("#btn", "click", (e) => console.log(e));
bindAction("#form", "submit", handler, { preventDefault: true });

// Shorthands
onClick("#btn", (e) => {});
onDblClick("#btn", (e) => {});
onInput("#input", (e) => {});
onChange("#select", (e) => {});
onSubmit("#form", (e) => {}); // preventDefault is on by default
onKeyDown("#el", (e) => {});
onKeyUp("#el", (e) => {});
onFocus("#el", (e) => {});
onBlur("#el", (e) => {});
onMouseEnter("#el", (e) => {});
onMouseLeave("#el", (e) => {});
onScroll("#el", (e) => {}); // passive by default

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
}
```

---

### Utilities

```typescript
ref(value); // alias for reactive()
readonly(source); // read-only wrapper — warns on write attempts
readonlyObject(obj); // Proxy that throws on write/delete
markRaw(obj); // exclude object from reactivity
isRaw(obj); // check if object is marked raw
toRaw(reactive); // extract raw value from a primitive reactive wrapper
shallowReactive(obj); // only top-level properties are reactive (nested objects are raw)
isReactive(value); // true if value is a reactive object
isComputed(value); // true if value is a computed
```

---

### Debug

```typescript
setDebug(true); // enable debug mode
isDebugEnabled(); // check if debug is on
trackReactive(state); // track a reactive for debugging
trackReactive(myComputed, "computed"); // track a computed
getDebugInfo(state); // get change history for a tracked reactive
logTrackedReactive(); // print all tracked reactives to console
clearDebugTracking(); // clear all tracked reactives
```

---

### Security Utilities

```typescript
escapeHtmlEntities(str); // convert <, >, &, " etc. to HTML entities
sanitizeHtmlContent(html); // remove scripts/event handlers, keep safe HTML
isUrlSafe(url); // returns false for javascript:, vbscript:, data:text/html
configureReactiveSecurity({ logWarnings, throwOnViolation });
```

---

## Browser (No Build Step)

```html
<script src="https://unpkg.com/reactive/dist/reactive.iife.min.js"></script>
<script>
  const { reactive, computed, effect, bindText, onClick } = Reactive;

  const state = reactive({ count: 0 });
  bindText("#counter", () => state.count);
  onClick("#btn", () => state.count++);
</script>
```

## License

MIT
