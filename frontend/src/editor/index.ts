// Export all editor components
export { EditorToolbar } from './editor-toolbar.js';
export { EditorCanvas } from './editor-canvas.js';
export { DashboardEditorComponent } from './dashboard-editor-component.js';
export { EditorWidgetPalette } from './editor-widget-palette.js';
export { EditorPropertyPanel } from './editor-property-panel.js';
export { EditorWidgetToolbar } from './editor-widget-toolbar.js';
export { AlignmentGuides } from './alignment-guides.js';
export { EditorState } from './editor-state.js';
export { OccupancyMap } from './occupancy-map.js';
export { CommandHistory, CompositeCommand } from './command-history.js';

// Import all editor components to ensure they are registered
import './editor-toolbar.js';
import './editor-canvas.js';
import './dashboard-editor-component.js';
import './editor-widget-palette.js';
import './editor-property-panel.js';
import './editor-widget-toolbar.js';
import './alignment-guides.js';
