# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-17

### Added

- ✨ Core reactivity system with `reactive()`, `computed()`, `computedAsync()`, and `effect()`
- ✨ DOM binding functions (`bindText`, `bindHTML`, `bindAttr`, `bindClass`, `bindStyle`, `bindStyles`, `bind`)
- ✨ Two-way input binding (`bindInput`) — supports text, checkbox, radio, select, textarea, file, date
- ✨ Event handling utilities (`onClick`, `onInput`, `onSubmit`, `onKey`, `onEnter`, `onEscape`, etc.)
- ✨ Watch API (`watch`, `watchMultiple`, `watchProperty`) for observing reactive values
- ✨ Batch updates for performance optimization
- ✨ Built-in XSS protection with HTML sanitization
- ✨ URL validation to prevent JavaScript injection
- ✨ Dangerous attribute/property blocking
- ✨ TypeScript support with full type definitions
- ✨ Multiple build formats (ESM, IIFE, minified, minimal)
- ✨ Debug utilities for development (`trackReactive`, `getDebugInfo`, `logTrackedReactive`)
- ✨ Readonly reactive values (`readonly`, `readonlyObject`)
- ✨ Utility functions (`ref`, `toRaw`, `markRaw`, `isRaw`, `shallowReactive`, `isReactive`, `isComputed`)
- ✨ Comprehensive test suite (427+ tests)
- ✨ Complete API documentation
- ✨ Security documentation
- ✨ CI/CD pipeline with GitHub Actions

### Security

- 🔒 Automatic HTML sanitization by default
- 🔒 Script tag removal
- 🔒 Event handler attribute blocking
- 🔒 JavaScript URL validation
- 🔒 Safe HTML entity escaping
- 🔒 Configurable security settings via `configureReactiveSecurity()`

### Performance

- ⚡ Lazy computed value evaluation
- ⚡ Computed value caching
- ⚡ Batch update optimization
- ⚡ Efficient dependency tracking
- ⚡ Race-condition-safe async computed
- ⚡ Minimal bundle size (~5KB minified + gzipped for core)

### Developer Experience

- 📝 Full TypeScript support
- 📝 Comprehensive documentation
- 📝 Rich examples
- 📝 Debug mode for development
- 📝 Clear error messages
- 📝 IDE autocomplete support

## [Unreleased]

### Planned Features

- Persistence (localStorage integration)
- Undo/Redo functionality
- DevTools integration
- Performance monitoring API

---

## Version History

### Version 1.0.0 (Initial Release)

First stable release of Reactive with core features, security, and comprehensive documentation.

**Key Features:**

- Core reactivity system (reactive, computed, computedAsync, effect, watch, batch)
- DOM bindings (text, HTML, input, class, style, attr, prop, render)
- Security features (sanitization, URL validation, attribute blocking)
- TypeScript support
- 427+ tests
- Documentation

**Bundle Sizes (approximate):**

| Build                      | Size (minified) |
| -------------------------- | --------------- |
| `reactive.min.js` (ESM)    | ~13KB           |
| `reactive.iife.min.js`     | ~14KB           |
| `reactive.minimal.js`      | ~5KB            |
| `reactive.minimal.iife.js` | ~5KB            |

**Browser Support:**

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Modern browsers with ES6+ support

**Node.js Support:**

- Node.js 16.x or higher
- NPM 7.x or higher

---

## Migration Guides

### From 0.x to 1.0.0

This is the initial stable release. No migration needed.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT License - see [LICENSE](./LICENSE) for details.
