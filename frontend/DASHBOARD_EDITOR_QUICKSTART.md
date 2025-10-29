# Dashboard Editor - Quick Start Guide

## 🚀 5-Minute Quick Start

### Step 1: Build and Run

```bash
cd frontend
npm install
npm run build
npm run serve
```

### Step 2: Open in Browser

Navigate to: `http://localhost:8000/dashboard-editor-demo.html`

### Step 3: Start Building!

1. **Drag a widget** from the left sidebar onto the canvas
2. **Move widgets** by dragging them to new positions
3. **Delete widgets** by hovering and clicking the ✕ button
4. **Export your dashboard** by clicking "Export Config" button

## 📋 Quick Reference

### Widget Types Available

| Icon | Widget Type | Description |
|------|-------------|-------------|
| 📊 | Chart | Data visualizations |
| 📈 | Metric | Key performance indicators |
| 📋 | Table | Tabular data display |
| 📝 | Text | Text content |
| 🖼️ | Image | Image display |
| 📄 | Markdown | Rich text with markdown |

### Keyboard & Mouse Actions

| Action | How To |
|--------|--------|
| Add Widget | Drag from sidebar to canvas |
| Move Widget | Drag widget to new position |
| Select Widget | Click on widget |
| Delete Widget | Hover over widget → Click ✕ |
| Edit Dashboard Name | Click on dashboard name in toolbar |
| Clear All | Click "Clear" button |
| Export Config | Click "Export Config" button |

### Grid System

- **12 columns** by default
- **100px row height**
- **16px gap** between widgets
- Widgets snap to grid positions

### Default Widget Sizes

- **Width**: 4 columns (1/3 of grid)
- **Height**: 3 rows (300px)

## 💡 Tips & Tricks

### Tip 1: Grid Visibility
The grid overlay appears when dragging to help with positioning.

### Tip 2: Widget Selection
Selected widgets have a blue border and shadow.

### Tip 3: Export Configuration
The exported JSON can be used with the `dashboard-component` for display.

### Tip 4: Dashboard Name
Click the dashboard name in the toolbar to edit it.

### Tip 5: In-Memory Only
Remember: All changes are lost on page refresh! Export your config if you want to save it.

## 🎯 Common Workflows

### Creating a Simple Dashboard

1. Drag a **Metric** widget to top-left
2. Drag a **Chart** widget below it
3. Drag a **Table** widget to the right
4. Adjust positions by dragging
5. Export configuration

### Prototyping a Layout

1. Add multiple widgets quickly
2. Arrange them in desired layout
3. Export configuration
4. Use JSON in your application

### Testing Widget Arrangements

1. Add widgets in different positions
2. Move them around to test layouts
3. Delete unwanted widgets
4. Clear and start over if needed

## 🔍 Troubleshooting

### Widgets Not Appearing?
- Check browser console for errors
- Ensure build completed successfully
- Refresh the page and try again

### Drag Not Working?
- Make sure you're clicking and holding
- Try clicking directly on the widget item
- Check if JavaScript is enabled

### Export Not Working?
- Open browser console (F12)
- Click "Export Config" again
- Look for the JSON output in console

## 📊 Example Dashboard Configurations

### Simple Analytics Dashboard

```json
{
  "name": "Analytics Dashboard",
  "widgets": [
    {
      "id": "metric-1",
      "title": "Total Users",
      "position": { "x": 0, "y": 0, "width": 3, "height": 2 },
      "config": { "type": "metric" }
    },
    {
      "id": "chart-1",
      "title": "Traffic Trend",
      "position": { "x": 3, "y": 0, "width": 9, "height": 4 },
      "config": { "type": "chart" }
    }
  ]
}
```

### Sales Dashboard

```json
{
  "name": "Sales Dashboard",
  "widgets": [
    {
      "id": "metric-1",
      "title": "Revenue",
      "position": { "x": 0, "y": 0, "width": 4, "height": 2 },
      "config": { "type": "metric" }
    },
    {
      "id": "metric-2",
      "title": "Orders",
      "position": { "x": 4, "y": 0, "width": 4, "height": 2 },
      "config": { "type": "metric" }
    },
    {
      "id": "chart-1",
      "title": "Sales by Region",
      "position": { "x": 0, "y": 2, "width": 8, "height": 4 },
      "config": { "type": "chart" }
    }
  ]
}
```

## 🎨 Customization Examples

### Change Grid Columns

Edit `dashboard-editor-component.ts`:

```typescript
private _columns: number = 16; // More columns for finer control
```

### Modify Default Widget Size

Edit `_addNewWidget` method:

```typescript
position: {
  x: gridX,
  y: gridY,
  width: 6,  // Wider widgets
  height: 4, // Taller widgets
}
```

### Add Custom Styling

In your HTML:

```html
<style>
  dashboard-editor {
    --dashboard-bg-color: #f0f0f0;
    --dashboard-gap: 20px;
  }
</style>
```

## 📚 Next Steps

1. **Explore the Demo**: Try all widget types
2. **Read Full Documentation**: See `DASHBOARD_EDITOR_README.md`
3. **Integrate with Your App**: Use exported configs
4. **Customize**: Modify to fit your needs

## 🆘 Need Help?

- Check the full README: `DASHBOARD_EDITOR_README.md`
- Review the source code: `src/dashboard-editor-component.ts`
- Look at the demo: `dashboard-editor-demo.html`

## ⚡ Remember

- ✅ All state is **in-memory only**
- ✅ **No persistence** - changes are lost on refresh
- ✅ **Export your config** before closing the browser
- ✅ Use exported JSON with `dashboard-component` for display

Happy Dashboard Building! 🎉

