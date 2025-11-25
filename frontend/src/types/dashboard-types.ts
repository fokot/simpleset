// Local type definitions for dashboard components
// These are simplified versions of the API types to avoid import issues

export type LayoutType = 'grid' | 'freeform' | 'tabs' | 'accordion';

export type WidgetType = 'chart' | 'text' | 'image' | 'iframe' | 'filter' | 'metric' | 'table' | 'markdown';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  static?: boolean;
}

export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  shadow?: boolean;
  opacity?: number;
}

export interface TextWidgetConfig {
  content: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
}

export interface ImageWidgetConfig {
  src: string;
  alt?: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  link?: string;
}

export interface IFrameWidgetConfig {
  src: string;
  title?: string;
  allowFullscreen?: boolean;
  sandbox?: string[];
}

export interface FilterWidgetConfig {
  type: 'dropdown' | 'multiselect' | 'daterange' | 'slider' | 'input';
  label: string;
  parameter: string;
  options?: Array<{
    label: string;
    value: any;
  }>;
  defaultValue?: any;
  required?: boolean;
  targetWidgetIds?: string[];
}

export interface MetricWidgetConfig {
  title: string;
  value: number | string;
  format?: string;
  prefix?: string;
  suffix?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    color?: string;
  };
  target?: number;
  thresholds?: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
}

export interface TableWidgetConfig {
  columns: Array<{
    key: string;
    title: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    filterable?: boolean;
    format?: string;
  }>;
  pagination?: {
    enabled?: boolean;
    pageSize?: number;
  };
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
}

export interface MarkdownWidgetConfig {
  content: string;
  allowHtml?: boolean;
  breaks?: boolean;
  linkify?: boolean;
}

export interface DataBinding {
  sql?: string;
  dataSourceId: string;
  queryId?: string;
  parameters?: Record<string, any>;
  xAxisColumn?: string;
  yAxisColumns?: string[];
  groupByColumn?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filters?: Array<{
    column: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like';
    value: any;
  }>;
  sortBy?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export type WidgetConfig =
  | { type: 'chart'; dataBinding?: DataBinding }
  | { type: 'text'; config: TextWidgetConfig }
  | { type: 'image'; config: ImageWidgetConfig }
  | { type: 'iframe'; config: IFrameWidgetConfig }
  | { type: 'filter'; config: FilterWidgetConfig }
  | { type: 'metric'; config: MetricWidgetConfig }
  | { type: 'table'; config: TableWidgetConfig }
  | { type: 'markdown'; config: MarkdownWidgetConfig };

export interface DashboardWidget {
  id: string;
  title?: string;
  position: WidgetPosition;
  style?: WidgetStyle;
  config: WidgetConfig;
  visible?: boolean;
  refreshConfig?: {
    enabled?: boolean;
    interval?: number;
  };
}

export interface DashboardLayout {
  type: LayoutType;
  columns?: number;
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number];
  compactType?: 'vertical' | 'horizontal' | null;
  preventCollision?: boolean;
  useCSSTransforms?: boolean;
  resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
}

export interface DashboardTheme {
  name?: string;
  backgroundColor?: string;
  textColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  spacing?: number;
}

export interface DashboardParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime';
  defaultValue?: any;
  required?: boolean;
  description?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  layout: DashboardLayout;
  theme?: DashboardTheme;
  widgets?: DashboardWidget[];
  parameters?: DashboardParameter[];
  tags?: string[];
  favorite?: boolean;
  published?: boolean;
  sharing: {
    isPublic: boolean;
    allowedUsers: string[];
  };
  audit: {
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
  };
  viewCount?: number;
  lastViewed?: string;
}
