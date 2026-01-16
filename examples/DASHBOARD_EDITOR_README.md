# Dashboard Editor - Interactive Builder

A powerful, interactive dashboard editor component built with Lit that allows users to create and edit dashboards using drag-and-drop functionality.

## 🎯 Features

### Core Functionality
- ✅ **Drag & Drop Interface**: Intuitive drag-and-drop for adding and arranging widgets
- ✅ **Widget Palette**: Pre-built widget types ready to use
- ✅ **Real-time Preview**: See changes instantly as you build
- ✅ **In-Memory State**: All dashboard state stored in browser memory (JavaScript variables)
- ✅ **No Persistence**: Ephemeral state - resets on page refresh
- ✅ **Export Configuration**: Export dashboard config as JSON to console

### Supported Widget Types
- 📊 **Chart Widget**: For data visualizations
- 📈 **Metric Widget**: Display key performance indicators
- 📋 **Table Widget**: Show data in tabular format
- 📝 **Text Widget**: Add text content
- 🖼️ **Image Widget**: Display images
- 📄 **Markdown Widget**: Rich text with markdown support

### User Interactions
- **Add Widgets**: Drag from palette to canvas
- **Move Widgets**: Drag existing widgets to reposition
- **Select Widgets**: Click to select/highlight
- **Delete Widgets**: Hover and click delete button
- **Edit Dashboard Name**: Click to edit dashboard title
- **Clear Dashboard**: Remove all widgets at once
- **Export Config**: View dashboard JSON configuration

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Build the components:
```bash
npm run build
```

4. Start the development server:
```bash
npm run serve
```

5. Open your browser and navigate to:
```
http://localhost:8000/dashboard-editor-demo.html
```

## 📖 Usage

### Basic Usage

Include the dashboard editor component in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard Editor</title>
</head>
<body>
<dashboard-editor id="editor"></dashboard-editor>

<script type="module">
    import './dashboard-editor-component.js';
</script>
</body>
</html>
```

### Programmatic Access

You can access the editor programmatically:

```javascript
const editor = document.getElementById('editor');

// The dashboard configuration is stored in memory
// Access it through the component's internal state
// (Note: This is ephemeral and will be lost on refresh)
```

### Exporting Dashboard Configuration

Click the "Export Config" button in the toolbar to see the dashboard configuration in the browser console. The exported JSON follows this structure:

```json
{
  "id": "dashboard-1234567890",
  "name": "My Dashboard",
  "description": "Created with Dashboard Editor",
  "layout": {
    "type": "grid",
    "columns": 12,
    "rowHeight": 100
  },
  "widgets": [
    {
      "id": "widget-1234567890-1",
      "title": "Chart Widget",
      "position": {
        "x": 0,
        "y": 0,
        "width": 4,
        "height": 3
      },
      "config": {
        "type": "chart"
      },
      "visible": true
    }
  ],
  "sharing": {
    "isPublic": false,
    "allowedUsers": []
  },
  "audit": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "createdBy": "editor-user",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "updatedBy": "editor-user"
  }
}
```

## 🎨 How It Works

### In-Memory State Management

The dashboard editor stores all state in JavaScript variables within the component:

```typescript
@state()
private _widgets: DashboardWidget[] = [];

@state()
private _dashboardName: string = 'New Dashboard';

@state()
private _selectedWidgetId?: string;
```

**Important Notes:**
- ✅ State is stored in browser memory only
- ✅ No localStorage, sessionStorage, or cookies used
- ✅ No backend API calls for persistence
- ✅ State is completely ephemeral
- ⚠️ Refreshing the page will reset everything
- ⚠️ Closing the browser tab will lose all changes

### Drag & Drop Implementation

The editor uses native browser mouse events for drag-and-drop:

1. **Drag Start**: User clicks and holds on a widget or palette item
2. **Drag Move**: Mouse movement updates drag state
3. **Drag End**: Mouse release calculates grid position and updates state

```typescript
private _handlePaletteItemDragStart = (e: MouseEvent, widgetType: WidgetType) => {
  this._dragState = {
    isDragging: true,
    isNewWidget: true,
    draggedWidgetType: widgetType,
    // ... position tracking
  };
};
```

### Grid System

The dashboard uses a 12-column grid system:
- Widgets snap to grid positions
- Each widget has x, y, width, and height properties
- Grid cells are calculated based on canvas width
- Row height is fixed at 100px

## 🏗️ Architecture

### Component Structure

```
dashboard-editor-component.ts
├── Widget Palette (Sidebar)
│   ├── Widget Items (draggable)
│   └── Widget Categories
├── Toolbar
│   ├── Dashboard Name Input
│   ├── Clear Button
│   └── Export Button
└── Canvas
    ├── Grid Overlay (visible during drag)
    └── Widget Containers
        ├── Widget Header
        ├── Widget Actions
        └── Widget Content
```

### State Flow

```
User Action → Event Handler → State Update → Re-render
     ↓              ↓              ↓            ↓
  Drag Widget → _handleDrag → _widgets[] → render()
```

## 🔧 Customization

### Changing Grid Columns

Modify the default column count:

```typescript
private _columns: number = 12; // Change to 6, 8, 16, etc.
```

### Adding Custom Widget Types

1. Add the widget type to the palette:

```typescript
const widgetTypes = [
  { type: 'custom', icon: '🎯', name: 'Custom', description: 'My custom widget' },
  // ... other widgets
];
```

2. Add default configuration:

```typescript
private _getDefaultWidgetConfig(widgetType: WidgetType): any {
  switch (widgetType) {
    case 'custom':
      return { type: 'custom', config: { /* custom config */ } };
    // ... other cases
  }
}
```

### Styling

The component uses CSS custom properties for theming:

```css
dashboard-editor {
  --dashboard-font-family: 'Inter', sans-serif;
  --dashboard-bg-color: #f5f5f5;
  --dashboard-columns: 12;
  --dashboard-gap: 16px;
}
```

## 📝 API Reference

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `dashboard` | `Dashboard` | Optional initial dashboard configuration |

### Methods

All methods are private and managed internally by the component.

### Events

Currently, the component does not emit custom events. This could be added for integration purposes.

## 🎯 Use Cases

1. **Dashboard Prototyping**: Quickly prototype dashboard layouts
2. **Visual Dashboard Builder**: Allow users to create custom dashboards
3. **Layout Testing**: Test different widget arrangements
4. **Configuration Generation**: Generate dashboard JSON configs

## ⚠️ Limitations

1. **No Persistence**: State is not saved anywhere
2. **No Undo/Redo**: Changes cannot be undone
3. **No Widget Resizing**: Widgets have fixed sizes (can be enhanced)
4. **No Widget Configuration UI**: Widget properties cannot be edited (can be enhanced)
5. **No Collision Detection**: Widgets can overlap (can be enhanced)
6. **No Responsive Grid**: Grid is fixed width (can be enhanced)

## 🚀 Future Enhancements

Potential features that could be added:

- [ ] Widget resizing with drag handles
- [ ] Widget configuration panel
- [ ] Undo/Redo functionality
- [ ] Collision detection and auto-layout
- [ ] Responsive grid system
- [ ] Widget templates
- [ ] Keyboard shortcuts
- [ ] Copy/paste widgets
- [ ] Grid snapping options
- [ ] Custom widget types

## 📄 License

This component is part of the SimpleSet project.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- Components are well-documented
- Changes maintain the in-memory-only approach

