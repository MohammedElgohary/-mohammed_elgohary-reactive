# Multi-Style Binding Example

This example demonstrates the new `bindStyles()` function that allows you to bind multiple CSS properties at once, providing a more efficient and cleaner way to handle complex styling scenarios.

## Features Demonstrated

### 1. Individual Style Bindings (Traditional Method)

```javascript
bindStyle("#box1", "background-color", () => state.backgroundColor);
bindStyle("#box1", "color", () => state.color);
bindStyle("#box1", "border-radius", () => state.borderRadius);
// ... more individual bindings
```

### 2. Multiple Styles with Individual Sources

```javascript
bindStyles("#box2", {
  "background-color": () => state.backgroundColor,
  color: () => state.color,
  "border-radius": () => state.borderRadius,
  "font-size": () => state.fontSize,
  transform: () => state.transform,
});
```

### 3. Reactive Style Object

```javascript
const styleObject = reactive({
  "background-color": "#ff6b6b",
  color: "#ffffff",
  "border-radius": "10px",
  "font-size": "16px",
  transform: "rotate(0deg) scale(1)",
});

bindStyles("#box3", styleObject);
```

## Interactive Controls

The example includes interactive controls that allow you to:

- Change background and text colors using color pickers
- Adjust border radius, font size, rotation, and scale using range sliders
- See real-time updates across all three binding methods
- Click on boxes to generate random colors

## Performance Benefits

- **Method 1**: Creates 5 separate effect subscriptions (one per style property)
- **Method 2**: Creates 5 separate effect subscriptions but with cleaner syntax
- **Method 3**: Creates 1 single effect subscription for all style properties (most efficient)

## Key Differences

| Method                              | Syntax   | Effects Created  | Best For            |
| ----------------------------------- | -------- | ---------------- | ------------------- |
| Individual `bindStyle()`            | Verbose  | One per property | Simple cases        |
| `bindStyles()` with functions       | Clean    | One per property | Multiple properties |
| `bindStyles()` with reactive object | Cleanest | One total        | Complex styling     |

## Files

- `index.html` - Complete interactive example
- `README.md` - This documentation

## Usage

1. Open `index.html` in a web browser
2. Use the controls to modify style properties
3. Observe how all three boxes update simultaneously
4. Click on boxes for random color changes
5. Check the browser console for any debug information

## Browser Compatibility

Works in all modern browsers that support:

- ES6 Modules
- CSS Custom Properties
- Modern DOM APIs

No build step required - runs directly in the browser using the IIFE build of Reactive.
