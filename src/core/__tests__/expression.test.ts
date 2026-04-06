import { describe, it, expect, beforeEach } from "vitest";
import {
  compileExpression,
  compileStatement,
  evaluate,
  execute,
  parseInterpolations,
  clearExpressionCache,
} from "../expression";

beforeEach(() => clearExpressionCache());

// ── compileExpression ─────────────────────────────────────────────────────────

describe("compileExpression", () => {
  it("evaluates a simple property access", () => {
    const fn = compileExpression("counter.count", ["counter"]);
    expect(fn({ counter: { count: 5 } })).toBe(5);
  });

  it("evaluates arithmetic", () => {
    const fn = compileExpression("counter.count * 2 + 1", ["counter"]);
    expect(fn({ counter: { count: 3 } })).toBe(7);
  });

  it("evaluates ternary", () => {
    const fn = compileExpression("counter.count > 0 ? 'positive' : 'zero'", [
      "counter",
    ]);
    expect(fn({ counter: { count: 5 } })).toBe("positive");
    expect(fn({ counter: { count: 0 } })).toBe("zero");
  });

  it("evaluates optional chaining", () => {
    const fn = compileExpression("user.address?.city", ["user"]);
    expect(fn({ user: { address: null } })).toBeUndefined();
    expect(fn({ user: { address: { city: "Cairo" } } })).toBe("Cairo");
  });

  it("caches compiled functions for the same expr+keys", () => {
    const fn1 = compileExpression("counter.count", ["counter"]);
    const fn2 = compileExpression("counter.count", ["counter"]);
    expect(fn1).toBe(fn2);
  });

  it("returns different functions for different scope keys", () => {
    const fn1 = compileExpression("x", ["x"]);
    const fn2 = compileExpression("x", ["x", "y"]);
    // Different cache keys → different compiled functions
    expect(fn1).not.toBe(fn2);
  });

  it("returns undefined and warns on invalid expression", () => {
    const fn = compileExpression(")(invalid)(");
    expect(fn({})).toBeUndefined();
  });

  it("evaluates bare names when passed as scope keys", () => {
    const fn = compileExpression("count + 1", ["count"]);
    expect(fn({ count: 4 })).toBe(5);
  });

  it("evaluates array methods", () => {
    const fn = compileExpression("cart.items.length", ["cart"]);
    expect(fn({ cart: { items: [1, 2, 3] } })).toBe(3);
  });

  it("evaluates nullish coalescing", () => {
    const fn = compileExpression("user.name ?? 'Guest'", ["user"]);
    expect(fn({ user: { name: null } })).toBe("Guest");
    expect(fn({ user: { name: "Ali" } })).toBe("Ali");
  });

  it("evaluates multi-state expressions", () => {
    const fn = compileExpression("counter.count + user.age", [
      "counter",
      "user",
    ]);
    expect(fn({ counter: { count: 3 }, user: { age: 10 } })).toBe(13);
  });
});

// ── compileStatement ──────────────────────────────────────────────────────────

describe("compileStatement", () => {
  it("executes a mutation statement", () => {
    const scope = { counter: { count: 0 } };
    const fn = compileStatement("counter.count++", ["counter"]);
    fn(scope);
    expect(scope.counter.count).toBe(1);
  });

  it("executes assignment", () => {
    const scope = { user: { name: "Ali" } };
    const fn = compileStatement("user.name = 'Mohammed'", ["user"]);
    fn(scope);
    expect(scope.user.name).toBe("Mohammed");
  });

  it("receives $event parameter", () => {
    const scope = { handler: null as any };
    // 'handler' must be in scope keys so the destructured expr fn can read it;
    // but statements use with() so the assignment writes back to scope directly.
    const fn = compileStatement("handler = $event", ["handler"]);
    const fakeEvent = { type: "click" };
    fn(scope, fakeEvent as any);
    expect(scope.handler).toBe(fakeEvent);
  });

  it("caches compiled statements separately from expressions", () => {
    const expr = compileExpression("x", ["x"]);
    const stmt = compileStatement("x", ["x"]);
    // Stored in separate maps — must be different function references
    expect(expr).not.toBe(stmt);
  });

  it("returns noop and warns on invalid statement", () => {
    const fn = compileStatement(")(broken)(");
    expect(() => fn({})).not.toThrow();
  });
});

// ── evaluate ──────────────────────────────────────────────────────────────────

describe("evaluate", () => {
  it("returns evaluated value", () => {
    expect(evaluate("counter.count", { counter: { count: 7 } })).toBe(7);
  });

  it("returns undefined and does not throw on runtime error", () => {
    expect(() => evaluate("null.property", {})).not.toThrow();
    expect(evaluate("null.property", {})).toBeUndefined();
  });

  it("returns undefined for undefined property", () => {
    expect(evaluate("user.missing", { user: {} })).toBeUndefined();
  });
});

// ── execute ───────────────────────────────────────────────────────────────────

describe("execute", () => {
  it("mutates scope", () => {
    const scope = { counter: { count: 0 } };
    execute("counter.count += 5", scope);
    expect(scope.counter.count).toBe(5);
  });

  it("does not throw on runtime error", () => {
    expect(() => execute("null.x = 1", {})).not.toThrow();
  });

  it("passes event to statement", () => {
    const scope = { last: null as any };
    const ev = new MouseEvent("click");
    execute("last = $event", scope, ev);
    expect(scope.last).toBe(ev);
  });
});

// ── parseInterpolations ───────────────────────────────────────────────────────

describe("parseInterpolations", () => {
  it("parses a single expression", () => {
    const parts = parseInterpolations("{{ counter.count }}");
    expect(parts).toEqual([{ type: "expr", value: "counter.count" }]);
  });

  it("parses mixed static and expression", () => {
    const parts = parseInterpolations(
      "Hello {{ user.name }}, you have {{ counter.count }} items",
    );
    expect(parts).toEqual([
      { type: "static", value: "Hello " },
      { type: "expr", value: "user.name" },
      { type: "static", value: ", you have " },
      { type: "expr", value: "counter.count" },
      { type: "static", value: " items" },
    ]);
  });

  it("returns empty array for plain text (fast-path — no {{ present)", () => {
    // Intentional behaviour change: plain text returns [] so callers can
    // skip further work with a .length check instead of checking part types.
    expect(parseInterpolations("Hello World")).toEqual([]);
  });

  it("handles empty expression", () => {
    const parts = parseInterpolations("{{  }}");
    expect(parts).toEqual([{ type: "expr", value: "" }]);
  });

  it("trims whitespace from expressions", () => {
    const parts = parseInterpolations("{{   counter.count   }}");
    expect(parts).toEqual([{ type: "expr", value: "counter.count" }]);
  });

  it("handles multiple consecutive expressions", () => {
    const parts = parseInterpolations("{{ a }}{{ b }}");
    expect(parts).toEqual([
      { type: "expr", value: "a" },
      { type: "expr", value: "b" },
    ]);
  });

  it("returns empty array for empty string", () => {
    expect(parseInterpolations("")).toEqual([]);
  });

  it("returns trailing static text when {{ has no closing }}", () => {
    // The regex finds no match, so the remainder is emitted as a static part.
    // This is correct — malformed templates degrade gracefully to plain text.
    const parts = parseInterpolations("{{ unclosed");
    expect(parts).toEqual([{ type: "static", value: "{{ unclosed" }]);
  });
});
