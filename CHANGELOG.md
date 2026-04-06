# Changelog

## [1.0.3] - 2026-04-06

### Added

- Structural directives: `:if` (conditional rendering) and `:for` (list rendering)
- Support for `:for="item in items"` syntax with scoped access to items in subtrees
- Nested property support in `:for` loops (e.g., `item.name`)
- Automatic placeholder-based physical DOM toggling for `:if` directive
- Support for constant expressions in `{{ }}` (e.g., `{{ 4 + 4 }}`)
- Safe execution of JavaScript operations within template expressions (e.g., `{{ [1, 2].map(x => x * 2) }}`)
- Event Modifiers for `@event` directives: `.prevent`, `.stop`, `.self`, `.once`, `.capture`, `.passive`
- Key Modifiers for `@keydown` and `@keyup`: `.enter`, `.esc`, `.space`, `.tab`, `.up`, `.down`, `.left`, `.right`
- Event Debouncing for `@event` directives: `.debounce`, `.debounce.300` (custom delay)
- Debounced Two-way Binding for `:model` directives: `:model.debounce.300`
- Input Casting Modifiers for `:model`: `.number` (automatic `parseFloat`) and `.trim` (automatic `trim()`)
- Unified dot-syntax for all modifiers across events and models (e.g., `@click.debounce.500`)
- `onClick`, `onChange`, `bindAction` now accept `Document` and `Window` as targets for event delegation
- Library auto-injects `body { opacity: 0 }` + `body.r-ready { opacity: 1 }` on load — prevents flash of unresolved `{{ }}` expressions without any manual CSS

### Changed

- Zero-config auto-mounting is now the primary entry point — `reactive()` automatically schedules DOM parsing.
- `mount()` is available for explicit state registration and targeting specific root elements.
- Simplified build process: Removed "minimal" build variants as the full library is already lightweight (~10KB gzipped).
- Renamed `reactive.iife.min.js` to `reactive.iife.js` for simplicity.
- Reduced `dist` folder complexity to only essential files: `reactive.js` (ESM), `reactive.min.js` (minified ESM), `reactive.iife.js` (minified IIFE), and `reactive.d.ts` (Types).
- Refactored directive parsing to use a centralized `parseModifiers` helper for consistent behavior across all directives.

### Removed

- Removed `inferCallerName()` — stack-trace variable name inference never worked in browsers
- Removed `getState()` internal function — use `buildScope()` instead
- Removed `getRegisteredState` export alias — was a duplicate of the removed `getState`
- Removed `scheduleNotification` from public exports — internal batch detail
- Cleaned unused imports in `reactive.ts`
- Removed legacy dependency tracking API (`getActiveEffect`, `setActiveEffect`, `getActiveComputed`, `setActiveComputed`) from `dependency.ts`
- Removed legacy `examples/counter.html` redirect file

### Fixed

- Template parser flash of unresolved expressions — body is now hidden by injected CSS until `mount()` completes
- Updated `tsconfig.json` to use modern `moduleResolution: "bundler"` and enabled `noUnusedLocals`/`noUnusedParameters`
- Fixed dead code in `parser.ts` (removed unused `buildNodeScope` and redundant `currentIfExpr` logic)

---

## [1.0.2] - 2024

### Added

- Template parser (`mount`, `parse`, `autoMount`, `unmount`)
- `{{ expr }}` text interpolation
- `:attr`, `:class`, `:style`, `:show`, `:html`, `:model` directives
- `@event` handlers with `$event` access
  bind multiple CSS properties at once
- `computedAsync()` — async derived values with loading/error state
- `watchMultiple()`, `watchProperty()` — fine-grained observation
- `shallowReactive()`, `readonly()`, `readonlyObject()`
- Debug utilities: `setDebug`, `trackReactive`, `getDebugInfo`, `logTrackedReactive`
- Security: `escapeHtmlEntities`, `sanitizeHtmlContent`, `isUrlSafe`, `configureReactiveSecurity`
- Unified `bind()` — auto-detects binding type
  ring

---

## [1.0.0] - 2024-01-17

### Added

- Core reactivity: `reactive`, `computed`, `effect`, `batch`, `watch`
- DOM bindings: `bindText`, `bindHTML`, `bindAttr`, `bindClass`, `bindStyle`, `bindInput`, `bindProp`, `bindMultiple`
- Event helpers: `onClick`, `onInput`, `onSubmit`, `onKey`, `onEnter`, `onEscape`, and more
- TypeScript support with full type definitions
- Multiple build formats: ESM, IIFE, minified, minimal
- XSS protection with automatic HTML sanitization
- 527+ tests

---

MIT
