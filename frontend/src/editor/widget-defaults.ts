import { WidgetType, WidgetConfig, WidgetPosition } from '../types/dashboard-types.js';

export interface WidgetTypeInfo {
  type: WidgetType;
  label: string;
  icon: string; // icon identifier for the palette
  defaultSize: { width: number; height: number };
  defaultConfig: WidgetConfig;
}

export const WIDGET_DEFAULTS: Record<WidgetType, WidgetTypeInfo> = {
  chart: {
    type: 'chart',
    label: 'Chart',
    icon: 'chart',
    defaultSize: { width: 4, height: 3 },
    defaultConfig: { type: 'chart' },
  },
  text: {
    type: 'text',
    label: 'Text',
    icon: 'text',
    defaultSize: { width: 3, height: 2 },
    defaultConfig: { type: 'text', config: { content: 'Enter text here...' } },
  },
  image: {
    type: 'image',
    label: 'Image',
    icon: 'image',
    defaultSize: { width: 3, height: 3 },
    defaultConfig: { type: 'image', config: { src: '', alt: 'Image' } },
  },
  iframe: {
    type: 'iframe',
    label: 'IFrame',
    icon: 'iframe',
    defaultSize: { width: 4, height: 3 },
    defaultConfig: { type: 'iframe', config: { src: '', title: 'Embedded content' } },
  },
  filter: {
    type: 'filter',
    label: 'Filter',
    icon: 'filter',
    defaultSize: { width: 3, height: 1 },
    defaultConfig: { type: 'filter', config: { type: 'dropdown', label: 'Filter', parameter: 'param' } },
  },
  metric: {
    type: 'metric',
    label: 'Metric',
    icon: 'metric',
    defaultSize: { width: 2, height: 2 },
    defaultConfig: { type: 'metric', config: { title: 'Metric', value: 0 } },
  },
  table: {
    type: 'table',
    label: 'Table',
    icon: 'table',
    defaultSize: { width: 6, height: 4 },
    defaultConfig: {
      type: 'table',
      config: {
        columns: [
          { key: 'col1', title: 'Column 1' },
          { key: 'col2', title: 'Column 2' },
        ],
      },
    },
  },
  markdown: {
    type: 'markdown',
    label: 'Markdown',
    icon: 'markdown',
    defaultSize: { width: 4, height: 3 },
    defaultConfig: { type: 'markdown', config: { content: '# Heading\n\nWrite markdown here...' } },
  },
};

export function createDefaultPosition(type: WidgetType, x = 0, y = 0): WidgetPosition {
  const info = WIDGET_DEFAULTS[type];
  return {
    x,
    y,
    width: info.defaultSize.width,
    height: info.defaultSize.height,
  };
}
