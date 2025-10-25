import { z } from 'zod';
import {
  IdSchema,
  TimestampSchema,
  AuditTrailSchema,
  SharingConfigSchema,
  PaginationParamsSchema,
  PaginatedResponseSchema,
  SearchParamsSchema,
  ColorSchema,
  DimensionSchema,
} from './common.js';

// ============================================================================
// Dashboard Layout and Configuration
// ============================================================================

/**
 * Dashboard layout types
 */
export const LayoutTypeSchema = z.enum([
  'grid',
  'freeform',
  'tabs',
  'accordion',
]);

/**
 * Dashboard widget types
 */
export const WidgetTypeSchema = z.enum([
  'chart',
  'text',
  'image',
  'iframe',
  'filter',
  'metric',
  'table',
  'markdown',
]);

/**
 * Widget position and sizing
 */
export const WidgetPositionSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  minWidth: z.number().int().min(1).optional(),
  minHeight: z.number().int().min(1).optional(),
  maxWidth: z.number().int().min(1).optional(),
  maxHeight: z.number().int().min(1).optional(),
  static: z.boolean().default(false), // Cannot be moved or resized
});

/**
 * Widget styling configuration
 */
export const WidgetStyleSchema = z.object({
  backgroundColor: ColorSchema.optional(),
  borderColor: ColorSchema.optional(),
  borderWidth: z.number().min(0).default(0),
  borderRadius: z.number().min(0).default(4),
  padding: z.number().min(0).default(16),
  margin: z.number().min(0).default(8),
  shadow: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
});

/**
 * Text widget configuration
 */
export const TextWidgetConfigSchema = z.object({
  content: z.string(),
  fontSize: z.number().min(8).max(72).default(14),
  fontWeight: z.enum(['normal', 'bold', 'bolder', 'lighter']).default('normal'),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  color: ColorSchema.optional(),
});

/**
 * Image widget configuration
 */
export const ImageWidgetConfigSchema = z.object({
  src: z.string().url(),
  alt: z.string().optional(),
  fit: z.enum(['contain', 'cover', 'fill', 'none', 'scale-down']).default('contain'),
  link: z.string().url().optional(),
});

/**
 * IFrame widget configuration
 */
export const IFrameWidgetConfigSchema = z.object({
  src: z.string().url(),
  title: z.string().optional(),
  allowFullscreen: z.boolean().default(false),
  sandbox: z.array(z.string()).optional(),
});

/**
 * Filter widget configuration
 */
export const FilterWidgetConfigSchema = z.object({
  type: z.enum(['dropdown', 'multiselect', 'daterange', 'slider', 'input']),
  label: z.string(),
  parameter: z.string(),
  options: z.array(z.object({
    label: z.string(),
    value: z.any(),
  })).optional(),
  defaultValue: z.any().optional(),
  required: z.boolean().default(false),
  targetWidgetIds: z.array(IdSchema).default([]),
});

/**
 * Metric widget configuration
 */
export const MetricWidgetConfigSchema = z.object({
  title: z.string(),
  value: z.union([z.number(), z.string()]),
  format: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  trend: z.object({
    value: z.number(),
    direction: z.enum(['up', 'down', 'neutral']),
    color: ColorSchema.optional(),
  }).optional(),
  target: z.number().optional(),
  thresholds: z.array(z.object({
    value: z.number(),
    color: ColorSchema,
    label: z.string().optional(),
  })).default([]),
});

/**
 * Table widget configuration
 */
export const TableWidgetConfigSchema = z.object({
  columns: z.array(z.object({
    key: z.string(),
    title: z.string(),
    width: z.number().optional(),
    align: z.enum(['left', 'center', 'right']).default('left'),
    sortable: z.boolean().default(true),
    filterable: z.boolean().default(false),
    format: z.string().optional(),
  })),
  pagination: z.object({
    enabled: z.boolean().default(true),
    pageSize: z.number().int().min(1).max(100).default(10),
  }),
  striped: z.boolean().default(true),
  bordered: z.boolean().default(false),
  hoverable: z.boolean().default(true),
});

/**
 * Markdown widget configuration
 */
export const MarkdownWidgetConfigSchema = z.object({
  content: z.string(),
  allowHtml: z.boolean().default(false),
  breaks: z.boolean().default(true),
  linkify: z.boolean().default(true),
});

/**
 * Widget configuration (discriminated union)
 */
export const WidgetConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('chart'),
  }),
  z.object({
    type: z.literal('text'),
    config: TextWidgetConfigSchema,
  }),
  z.object({
    type: z.literal('image'),
    config: ImageWidgetConfigSchema,
  }),
  z.object({
    type: z.literal('iframe'),
    config: IFrameWidgetConfigSchema,
  }),
  z.object({
    type: z.literal('filter'),
    config: FilterWidgetConfigSchema,
  }),
  z.object({
    type: z.literal('metric'),
    config: MetricWidgetConfigSchema,
  }),
  z.object({
    type: z.literal('table'),
    config: TableWidgetConfigSchema,
  }),
  z.object({
    type: z.literal('markdown'),
    config: MarkdownWidgetConfigSchema,
  }),
]);

/**
 * Dashboard widget schema
 */
export const DashboardWidgetSchema = z.object({
  id: IdSchema,
  title: z.string().optional(),
  position: WidgetPositionSchema,
  style: WidgetStyleSchema.optional(),
  config: WidgetConfigSchema,
  visible: z.boolean().default(true),
  refreshConfig: z.object({
    enabled: z.boolean().default(false),
    interval: z.number().int().min(5).default(300), // seconds
  }).optional(),
});

/**
 * Dashboard layout configuration
 */
export const DashboardLayoutSchema = z.object({
  type: LayoutTypeSchema,
  columns: z.number().int().min(1).max(24).default(12),
  rowHeight: z.number().int().min(10).default(100),
  margin: z.array(z.number().int().min(0)).length(2).default([10, 10]),
  containerPadding: z.array(z.number().int().min(0)).length(2).default([10, 10]),
  compactType: z.enum(['vertical', 'horizontal', null]).default('vertical'),
  preventCollision: z.boolean().default(false),
  useCSSTransforms: z.boolean().default(true),
  resizeHandles: z.array(z.enum(['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne'])).default(['se']),
});

/**
 * Dashboard theme configuration
 */
export const DashboardThemeSchema = z.object({
  name: z.string().default('default'),
  backgroundColor: ColorSchema.optional(),
  textColor: ColorSchema.optional(),
  primaryColor: ColorSchema.optional(),
  secondaryColor: ColorSchema.optional(),
  accentColor: ColorSchema.optional(),
  fontFamily: z.string().default('Inter, system-ui, sans-serif'),
  borderRadius: z.number().min(0).default(8),
  spacing: z.number().min(0).default(16),
});

/**
 * Dashboard parameters
 */
export const DashboardParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'date', 'datetime']),
  defaultValue: z.any().optional(),
  required: z.boolean().default(false),
  description: z.string().optional(),
});

/**
 * Dashboard schema
 */
export const DashboardSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
  layout: DashboardLayoutSchema,
  theme: DashboardThemeSchema.optional(),
  widgets: z.array(DashboardWidgetSchema).default([]),
  parameters: z.array(DashboardParameterSchema).default([]),
  tags: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
  published: z.boolean().default(false),
  sharing: SharingConfigSchema,
  audit: AuditTrailSchema,
  viewCount: z.number().int().min(0).default(0),
  lastViewed: TimestampSchema.optional(),
});

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Create dashboard request
 */
export const CreateDashboardRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
  layout: DashboardLayoutSchema.optional(),
  theme: DashboardThemeSchema.optional(),
  parameters: z.array(DashboardParameterSchema).default([]),
  tags: z.array(z.string()).default([]),
  sharing: SharingConfigSchema.optional(),
});

/**
 * Update dashboard request
 */
export const UpdateDashboardRequestSchema = CreateDashboardRequestSchema.partial().extend({
  id: IdSchema,
});

/**
 * Dashboard list parameters
 */
export const DashboardListParamsSchema = PaginationParamsSchema.extend({
  published: z.boolean().optional(),
  favorite: z.boolean().optional(),
  search: SearchParamsSchema.optional(),
});

/**
 * Dashboard list response
 */
export const DashboardListResponseSchema = PaginatedResponseSchema(DashboardSchema);

/**
 * Add widget to dashboard request
 */
export const AddWidgetRequestSchema = z.object({
  dashboardId: IdSchema,
  widget: DashboardWidgetSchema.omit({ id: true }),
});

/**
 * Update widget request
 */
export const UpdateWidgetRequestSchema = z.object({
  dashboardId: IdSchema,
  widgetId: IdSchema,
  widget: DashboardWidgetSchema.partial().omit({ id: true }),
});

/**
 * Remove widget request
 */
export const RemoveWidgetRequestSchema = z.object({
  dashboardId: IdSchema,
  widgetId: IdSchema,
});

/**
 * Dashboard export request
 */
export const ExportDashboardRequestSchema = z.object({
  dashboardId: IdSchema,
  format: z.enum(['json', 'pdf', 'png']),
  includeData: z.boolean().default(false),
  parameters: z.record(z.any()).default({}),
});

/**
 * Dashboard import request
 */
export const ImportDashboardRequestSchema = z.object({
  dashboard: z.object({
    name: z.string(),
    description: z.string().optional(),
    layout: DashboardLayoutSchema,
    theme: DashboardThemeSchema.optional(),
    widgets: z.array(DashboardWidgetSchema.omit({ id: true })),
    parameters: z.array(DashboardParameterSchema).default([]),
  }),
  overwrite: z.boolean().default(false),
});

/**
 * Dashboard clone request
 */
export const CloneDashboardRequestSchema = z.object({
  dashboardId: IdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  includeData: z.boolean().default(false),
});

// ============================================================================
// Type Exports
// ============================================================================

export type LayoutType = z.infer<typeof LayoutTypeSchema>;
export type WidgetType = z.infer<typeof WidgetTypeSchema>;
export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;
export type WidgetStyle = z.infer<typeof WidgetStyleSchema>;
export type TextWidgetConfig = z.infer<typeof TextWidgetConfigSchema>;
export type ImageWidgetConfig = z.infer<typeof ImageWidgetConfigSchema>;
export type IFrameWidgetConfig = z.infer<typeof IFrameWidgetConfigSchema>;
export type FilterWidgetConfig = z.infer<typeof FilterWidgetConfigSchema>;
export type MetricWidgetConfig = z.infer<typeof MetricWidgetConfigSchema>;
export type TableWidgetConfig = z.infer<typeof TableWidgetConfigSchema>;
export type MarkdownWidgetConfig = z.infer<typeof MarkdownWidgetConfigSchema>;
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;
export type DashboardLayout = z.infer<typeof DashboardLayoutSchema>;
export type DashboardTheme = z.infer<typeof DashboardThemeSchema>;
export type DashboardParameter = z.infer<typeof DashboardParameterSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
export type CreateDashboardRequest = z.infer<typeof CreateDashboardRequestSchema>;
export type UpdateDashboardRequest = z.infer<typeof UpdateDashboardRequestSchema>;
export type DashboardListParams = z.infer<typeof DashboardListParamsSchema>;
export type DashboardListResponse = z.infer<typeof DashboardListResponseSchema>;
export type AddWidgetRequest = z.infer<typeof AddWidgetRequestSchema>;
export type UpdateWidgetRequest = z.infer<typeof UpdateWidgetRequestSchema>;
export type RemoveWidgetRequest = z.infer<typeof RemoveWidgetRequestSchema>;
export type ExportDashboardRequest = z.infer<typeof ExportDashboardRequestSchema>;
export type ImportDashboardRequest = z.infer<typeof ImportDashboardRequestSchema>;
export type CloneDashboardRequest = z.infer<typeof CloneDashboardRequestSchema>;
