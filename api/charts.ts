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
// Chart Types and Configurations
// ============================================================================

/**
 * Supported ECharts chart types
 */
export const ChartTypeSchema = z.enum([
  'line',
  'bar',
  'pie',
  'doughnut',
  'scatter',
  'bubble',
  'area',
  'stacked_bar',
  'stacked_area',
  'heatmap',
  'treemap',
  'sunburst',
  'radar',
  'gauge',
  'funnel',
  'sankey',
  'graph',
  'candlestick',
  'boxplot',
  'parallel',
  'tree',
]);

/**
 * Chart axis configuration
 */
export const AxisConfigSchema = z.object({
  type: z.enum(['category', 'value', 'time', 'log']).default('category'),
  name: z.string().optional(),
  min: z.union([z.number(), z.string()]).optional(),
  max: z.union([z.number(), z.string()]).optional(),
  scale: z.boolean().default(false),
  splitLine: z.object({
    show: z.boolean().default(true),
    lineStyle: z.object({
      color: ColorSchema.optional(),
      width: z.number().min(0).default(1),
      type: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
    }).optional(),
  }).optional(),
  axisLabel: z.object({
    show: z.boolean().default(true),
    rotate: z.number().min(-90).max(90).default(0),
    formatter: z.string().optional(),
    color: ColorSchema.optional(),
    fontSize: z.number().min(8).max(72).default(12),
  }).optional(),
});

/**
 * Chart legend configuration
 */
export const LegendConfigSchema = z.object({
  show: z.boolean().default(true),
  type: z.enum(['plain', 'scroll']).default('plain'),
  orient: z.enum(['horizontal', 'vertical']).default('horizontal'),
  left: z.union([z.number(), z.string()]).default('center'),
  top: z.union([z.number(), z.string()]).default('top'),
  itemWidth: z.number().min(1).default(25),
  itemHeight: z.number().min(1).default(14),
  textStyle: z.object({
    color: ColorSchema.optional(),
    fontSize: z.number().min(8).max(72).default(12),
  }).optional(),
});

/**
 * Chart tooltip configuration
 */
export const TooltipConfigSchema = z.object({
  show: z.boolean().default(true),
  trigger: z.enum(['item', 'axis', 'none']).default('item'),
  formatter: z.string().optional(),
  backgroundColor: ColorSchema.optional(),
  borderColor: ColorSchema.optional(),
  borderWidth: z.number().min(0).default(0),
  textStyle: z.object({
    color: ColorSchema.optional(),
    fontSize: z.number().min(8).max(72).default(14),
  }).optional(),
});

/**
 * Chart grid configuration
 */
export const GridConfigSchema = z.object({
  left: z.union([z.number(), z.string()]).default('10%'),
  top: z.union([z.number(), z.string()]).default(60),
  right: z.union([z.number(), z.string()]).default('10%'),
  bottom: z.union([z.number(), z.string()]).default(60),
  containLabel: z.boolean().default(false),
});

/**
 * Data series configuration
 */
export const SeriesConfigSchema = z.object({
  name: z.string(),
  type: ChartTypeSchema,
  data: z.array(z.any()),
  color: ColorSchema.optional(),
  stack: z.string().optional(),
  smooth: z.boolean().default(false),
  symbol: z.enum(['circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none']).optional(),
  symbolSize: z.number().min(0).default(4),
  lineStyle: z.object({
    width: z.number().min(0).default(2),
    type: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
    color: ColorSchema.optional(),
  }).optional(),
  areaStyle: z.object({
    color: ColorSchema.optional(),
    opacity: z.number().min(0).max(1).default(0.7),
  }).optional(),
  itemStyle: z.object({
    color: ColorSchema.optional(),
    borderColor: ColorSchema.optional(),
    borderWidth: z.number().min(0).default(0),
  }).optional(),
  label: z.object({
    show: z.boolean().default(false),
    position: z.enum(['top', 'left', 'right', 'bottom', 'inside', 'insideLeft', 'insideRight', 'insideTop', 'insideBottom']).default('top'),
    formatter: z.string().optional(),
    color: ColorSchema.optional(),
    fontSize: z.number().min(8).max(72).default(12),
  }).optional(),
});

/**
 * Chart animation configuration
 */
export const AnimationConfigSchema = z.object({
  animation: z.boolean().default(true),
  animationThreshold: z.number().int().min(0).default(2000),
  animationDuration: z.number().int().min(0).default(1000),
  animationEasing: z.enum(['linear', 'quadraticIn', 'quadraticOut', 'quadraticInOut', 'cubicIn', 'cubicOut', 'cubicInOut']).default('cubicOut'),
  animationDelay: z.number().int().min(0).default(0),
});

/**
 * Chart theme configuration
 */
export const ThemeConfigSchema = z.object({
  backgroundColor: ColorSchema.optional(),
  textStyle: z.object({
    color: ColorSchema.optional(),
    fontFamily: z.string().default('sans-serif'),
    fontSize: z.number().min(8).max(72).default(12),
  }).optional(),
  colorPalette: z.array(ColorSchema).optional(),
});

/**
 * Complete ECharts configuration
 */
export const EChartsConfigSchema = z.object({
  title: z.object({
    text: z.string().optional(),
    subtext: z.string().optional(),
    left: z.union([z.number(), z.string()]).default('left'),
    top: z.union([z.number(), z.string()]).default('top'),
    textStyle: z.object({
      color: ColorSchema.optional(),
      fontSize: z.number().min(8).max(72).default(18),
      fontWeight: z.enum(['normal', 'bold', 'bolder', 'lighter']).default('normal'),
    }).optional(),
  }).optional(),
  legend: LegendConfigSchema.optional(),
  tooltip: TooltipConfigSchema.optional(),
  grid: GridConfigSchema.optional(),
  xAxis: AxisConfigSchema.optional(),
  yAxis: AxisConfigSchema.optional(),
  series: z.array(SeriesConfigSchema),
  animation: AnimationConfigSchema.optional(),
  theme: ThemeConfigSchema.optional(),
  toolbox: z.object({
    show: z.boolean().default(false),
    feature: z.object({
      saveAsImage: z.boolean().default(true),
      dataZoom: z.boolean().default(true),
      dataView: z.boolean().default(true),
      magicType: z.object({
        show: z.boolean().default(true),
        type: z.array(ChartTypeSchema).default(['line', 'bar']),
      }).optional(),
      restore: z.boolean().default(true),
    }).optional(),
  }).optional(),
  dataZoom: z.array(z.object({
    type: z.enum(['slider', 'inside']).default('slider'),
    start: z.number().min(0).max(100).default(0),
    end: z.number().min(0).max(100).default(100),
    orient: z.enum(['horizontal', 'vertical']).default('horizontal'),
  })).optional(),
});

/**
 * Chart data binding configuration
 */
export const DataBindingSchema = z.object({
  queryId: IdSchema.optional(),
  sql: z.string().optional(),
  dataSourceId: IdSchema,
  parameters: z.record(z.any()).default({}),
  xAxisColumn: z.string().optional(),
  yAxisColumns: z.array(z.string()).default([]),
  groupByColumn: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
  filters: z.array(z.object({
    column: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like']),
    value: z.any(),
  })).default([]),
  sortBy: z.object({
    column: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc'),
  }).optional(),
  limit: z.number().int().min(1).max(10000).default(1000),
});

/**
 * Chart refresh configuration
 */
export const RefreshConfigSchema = z.object({
  enabled: z.boolean().default(false),
  interval: z.number().int().min(5).default(300), // seconds
  onlyWhenVisible: z.boolean().default(true),
});

/**
 * Chart interactive features
 */
export const InteractiveConfigSchema = z.object({
  drillDown: z.object({
    enabled: z.boolean().default(false),
    targetDashboardId: IdSchema.optional(),
    targetWidgetId: IdSchema.optional(),
    parameters: z.record(z.string()).default({}),
  }).optional(),
  crossFilter: z.object({
    enabled: z.boolean().default(false),
    targetWidgetIds: z.array(IdSchema).default([]),
  }).optional(),
  export: z.object({
    enabled: z.boolean().default(true),
    formats: z.array(z.enum(['png', 'jpg', 'svg', 'pdf', 'csv', 'excel'])).default(['png', 'csv']),
  }).optional(),
});

/**
 * Chart schema
 */
export const ChartSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ChartTypeSchema,
  config: EChartsConfigSchema,
  dataBinding: DataBindingSchema,
  refresh: RefreshConfigSchema,
  interactive: InteractiveConfigSchema,
  position: DimensionSchema.optional(),
  tags: z.array(z.string()).default([]),
  sharing: SharingConfigSchema,
  audit: AuditTrailSchema,
});

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Create chart request
 */
export const CreateChartRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: ChartTypeSchema,
  config: EChartsConfigSchema,
  dataBinding: DataBindingSchema,
  refresh: RefreshConfigSchema.optional(),
  interactive: InteractiveConfigSchema.optional(),
  tags: z.array(z.string()).default([]),
  sharing: SharingConfigSchema.optional(),
});

/**
 * Update chart request
 */
export const UpdateChartRequestSchema = CreateChartRequestSchema.partial().extend({
  id: IdSchema,
});

/**
 * Chart list parameters
 */
export const ChartListParamsSchema = PaginationParamsSchema.extend({
  type: ChartTypeSchema.optional(),
  dataSourceId: IdSchema.optional(),
  search: SearchParamsSchema.optional(),
});

/**
 * Chart list response
 */
export const ChartListResponseSchema = PaginatedResponseSchema(ChartSchema);

/**
 * Chart data request
 */
export const ChartDataRequestSchema = z.object({
  widgetId: IdSchema,
  parameters: z.record(z.any()).default({}),
  useCache: z.boolean().default(true),
});

/**
 * Chart data response
 */
export const ChartDataResponseSchema = z.object({
  data: z.array(z.any()),
  columns: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })),
  totalRows: z.number().int().min(0),
  executionTime: z.number().min(0),
  fromCache: z.boolean(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ChartType = z.infer<typeof ChartTypeSchema>;
export type AxisConfig = z.infer<typeof AxisConfigSchema>;
export type LegendConfig = z.infer<typeof LegendConfigSchema>;
export type TooltipConfig = z.infer<typeof TooltipConfigSchema>;
export type GridConfig = z.infer<typeof GridConfigSchema>;
export type SeriesConfig = z.infer<typeof SeriesConfigSchema>;
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>;
export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;
export type EChartsConfig = z.infer<typeof EChartsConfigSchema>;
export type DataBinding = z.infer<typeof DataBindingSchema>;
export type RefreshConfig = z.infer<typeof RefreshConfigSchema>;
export type InteractiveConfig = z.infer<typeof InteractiveConfigSchema>;
export type Chart = z.infer<typeof ChartSchema>;
export type CreateChartRequest = z.infer<typeof CreateChartRequestSchema>;
export type UpdateChartRequest = z.infer<typeof UpdateChartRequestSchema>;
export type ChartListParams = z.infer<typeof ChartListParamsSchema>;
export type ChartListResponse = z.infer<typeof ChartListResponseSchema>;
export type ChartDataRequest = z.infer<typeof ChartDataRequestSchema>;
export type ChartDataResponse = z.infer<typeof ChartDataResponseSchema>;
