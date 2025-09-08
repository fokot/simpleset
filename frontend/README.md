# Simple Lit Web Component

A simple web component built with Lit that displays "Hello" text with interactive features.

## Features

- **Hello Text Display**: Shows a greeting with attractive styling
- **Click Interaction**: Click the component to see animations and effects
- **Dynamic Styling**: Background color changes randomly on each click
- **Click Counter**: Tracks and displays the number of clicks
- **Custom Events**: Dispatches custom events that can be listened to
- **Responsive Design**: Hover effects and smooth transitions

## Setup and Build

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Build the component**:
   ```bash
   pnpm run build
   ```

3. **Development mode** (with file watching):
   ```bash
   pnpm run dev
   ```

4. **Serve the demo**:
   ```bash
   pnpm run serve
   ```
   Then open http://localhost:8000 in your browser.

## Files Structure

- `src/hello-component.js` - The main Lit web component
- `dist/hello-component.js` - Built and minified component (generated)
- `index.html` - Demo page to test the component
- `rollup.config.js` - Build configuration
- `package.json` - Dependencies and scripts

## Usage

After building, you can use the component in any HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="dist/hello-component.js"></script>
</head>
<body>
    <hello-component></hello-component>
</body>
</html>
```

## Component API

### Events

- `hello-clicked`: Fired when the component is clicked
  - `event.detail.clickCount`: Number of times clicked

### Styling

The component uses Shadow DOM, so it's encapsulated. You can style the host element:

```css
hello-component {
    display: block;
    margin: 20px;
}
```
