import { z } from 'zod';
import {
  ApiErrorSchema,
  SuccessResponseSchema,
  HttpStatusCodes,
} from './common.js';
import {
  DataSourceSchema,
  CreateDataSourceRequestSchema,
  UpdateDataSourceRequestSchema,
  TestConnectionRequestSchema,
  TestConnectionResponseSchema,
  DataSourceListParamsSchema,
  DataSourceListResponseSchema,
  SchemaIntrospectionResponseSchema,
} from './datasources.js';
import {
  SavedQuerySchema,
  CreateSavedQueryRequestSchema,
  UpdateSavedQueryRequestSchema,
  ExecuteQueryRequestSchema,
  ExecuteQueryResponseSchema,
  ValidateQueryRequestSchema,
  ValidateQueryResponseSchema,
  SavedQueryListParamsSchema,
  SavedQueryListResponseSchema,
  BuildQueryRequestSchema,
  BuildQueryResponseSchema,
  CacheStatsSchema,
} from './queries.js';
import {
  ChartSchema,
  CreateChartRequestSchema,
  UpdateChartRequestSchema,
  ChartListParamsSchema,
  ChartListResponseSchema,
  ChartDataRequestSchema,
  ChartDataResponseSchema,
} from './charts.js';
import {
  DashboardSchema,
  CreateDashboardRequestSchema,
  UpdateDashboardRequestSchema,
  DashboardListParamsSchema,
  DashboardListResponseSchema,
  AddWidgetRequestSchema,
  UpdateWidgetRequestSchema,
  RemoveWidgetRequestSchema,
  ExportDashboardRequestSchema,
  ImportDashboardRequestSchema,
  CloneDashboardRequestSchema,
} from './dashboards.js';

// ============================================================================
// API Endpoint Definitions
// ============================================================================

/**
 * Generic endpoint definition
 */
export interface ApiEndpoint<TRequest = any, TResponse = any> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string;
  tags: string[];
  requestSchema?: z.ZodSchema<TRequest>;
  responseSchema: z.ZodSchema<TResponse>;
  errorSchema: z.ZodSchema<any>;
  statusCodes: {
    success: number;
    error: number[];
  };
}

// ============================================================================
// Data Source Endpoints
// ============================================================================

export const dataSourceEndpoints = {
  // List data sources
  list: {
    method: 'GET',
    path: '/api/v1/datasources',
    summary: 'List data sources',
    description: 'Retrieve a paginated list of data sources with optional filtering',
    tags: ['datasources'],
    requestSchema: DataSourceListParamsSchema,
    responseSchema: SuccessResponseSchema(DataSourceListResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Get data source by ID
  get: {
    method: 'GET',
    path: '/api/v1/datasources/:id',
    summary: 'Get data source',
    description: 'Retrieve a specific data source by ID',
    tags: ['datasources'],
    responseSchema: SuccessResponseSchema(DataSourceSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Create data source
  create: {
    method: 'POST',
    path: '/api/v1/datasources',
    summary: 'Create data source',
    description: 'Create a new data source connection',
    tags: ['datasources'],
    requestSchema: CreateDataSourceRequestSchema,
    responseSchema: SuccessResponseSchema(DataSourceSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.CREATED,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED, HttpStatusCodes.CONFLICT],
    },
  },

  // Update data source
  update: {
    method: 'PUT',
    path: '/api/v1/datasources/:id',
    summary: 'Update data source',
    description: 'Update an existing data source',
    tags: ['datasources'],
    requestSchema: UpdateDataSourceRequestSchema,
    responseSchema: SuccessResponseSchema(DataSourceSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Delete data source
  delete: {
    method: 'DELETE',
    path: '/api/v1/datasources/:id',
    summary: 'Delete data source',
    description: 'Delete a data source and all associated queries',
    tags: ['datasources'],
    responseSchema: SuccessResponseSchema(z.object({ deleted: z.boolean() })),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED, HttpStatusCodes.CONFLICT],
    },
  },

  // Test connection
  testConnection: {
    method: 'POST',
    path: '/api/v1/datasources/test',
    summary: 'Test data source connection',
    description: 'Test connectivity to a data source without saving it',
    tags: ['datasources'],
    requestSchema: TestConnectionRequestSchema,
    responseSchema: SuccessResponseSchema(TestConnectionResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Get schema introspection
  getSchema: {
    method: 'GET',
    path: '/api/v1/datasources/:id/schema',
    summary: 'Get data source schema',
    description: 'Retrieve schema information (tables, columns, etc.) from a data source',
    tags: ['datasources'],
    responseSchema: SuccessResponseSchema(SchemaIntrospectionResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },
} as const;

// ============================================================================
// Query Endpoints
// ============================================================================

export const queryEndpoints = {
  // Execute query
  execute: {
    method: 'POST',
    path: '/api/v1/queries/execute',
    summary: 'Execute query',
    description: 'Execute a SQL query against a data source',
    tags: ['queries'],
    requestSchema: ExecuteQueryRequestSchema,
    responseSchema: SuccessResponseSchema(ExecuteQueryResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED, HttpStatusCodes.UNPROCESSABLE_ENTITY],
    },
  },

  // Validate query
  validate: {
    method: 'POST',
    path: '/api/v1/queries/validate',
    summary: 'Validate query',
    description: 'Validate SQL syntax and estimate query cost',
    tags: ['queries'],
    requestSchema: ValidateQueryRequestSchema,
    responseSchema: SuccessResponseSchema(ValidateQueryResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Build query from visual builder
  build: {
    method: 'POST',
    path: '/api/v1/queries/build',
    summary: 'Build SQL from visual query builder',
    description: 'Convert visual query builder configuration to SQL',
    tags: ['queries'],
    requestSchema: BuildQueryRequestSchema,
    responseSchema: SuccessResponseSchema(BuildQueryResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // List saved queries
  listSaved: {
    method: 'GET',
    path: '/api/v1/queries/saved',
    summary: 'List saved queries',
    description: 'Retrieve a paginated list of saved queries',
    tags: ['queries'],
    requestSchema: SavedQueryListParamsSchema,
    responseSchema: SuccessResponseSchema(SavedQueryListResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Get saved query
  getSaved: {
    method: 'GET',
    path: '/api/v1/queries/saved/:id',
    summary: 'Get saved query',
    description: 'Retrieve a specific saved query by ID',
    tags: ['queries'],
    responseSchema: SuccessResponseSchema(SavedQuerySchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Create saved query
  createSaved: {
    method: 'POST',
    path: '/api/v1/queries/saved',
    summary: 'Create saved query',
    description: 'Save a query for reuse',
    tags: ['queries'],
    requestSchema: CreateSavedQueryRequestSchema,
    responseSchema: SuccessResponseSchema(SavedQuerySchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.CREATED,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED, HttpStatusCodes.CONFLICT],
    },
  },

  // Update saved query
  updateSaved: {
    method: 'PUT',
    path: '/api/v1/queries/saved/:id',
    summary: 'Update saved query',
    description: 'Update an existing saved query',
    tags: ['queries'],
    requestSchema: UpdateSavedQueryRequestSchema,
    responseSchema: SuccessResponseSchema(SavedQuerySchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Delete saved query
  deleteSaved: {
    method: 'DELETE',
    path: '/api/v1/queries/saved/:id',
    summary: 'Delete saved query',
    description: 'Delete a saved query',
    tags: ['queries'],
    responseSchema: SuccessResponseSchema(z.object({ deleted: z.boolean() })),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Get cache statistics
  getCacheStats: {
    method: 'GET',
    path: '/api/v1/queries/cache/stats',
    summary: 'Get query cache statistics',
    description: 'Retrieve statistics about query result caching',
    tags: ['queries'],
    responseSchema: SuccessResponseSchema(CacheStatsSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Clear cache
  clearCache: {
    method: 'DELETE',
    path: '/api/v1/queries/cache',
    summary: 'Clear query cache',
    description: 'Clear all cached query results',
    tags: ['queries'],
    responseSchema: SuccessResponseSchema(z.object({ cleared: z.boolean() })),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.UNAUTHORIZED],
    },
  },
} as const;

// ============================================================================
// Chart Endpoints
// ============================================================================

export const chartEndpoints = {
  // List charts
  list: {
    method: 'GET',
    path: '/api/v1/charts',
    summary: 'List charts',
    description: 'Retrieve a paginated list of charts with optional filtering',
    tags: ['charts'],
    requestSchema: ChartListParamsSchema,
    responseSchema: SuccessResponseSchema(ChartListResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Get chart by ID
  get: {
    method: 'GET',
    path: '/api/v1/charts/:id',
    summary: 'Get chart',
    description: 'Retrieve a specific chart by ID',
    tags: ['charts'],
    responseSchema: SuccessResponseSchema(ChartSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Create chart
  create: {
    method: 'POST',
    path: '/api/v1/charts',
    summary: 'Create chart',
    description: 'Create a new chart visualization',
    tags: ['charts'],
    requestSchema: CreateChartRequestSchema,
    responseSchema: SuccessResponseSchema(ChartSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.CREATED,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.UNAUTHORIZED, HttpStatusCodes.CONFLICT],
    },
  },

  // Update chart
  update: {
    method: 'PUT',
    path: '/api/v1/charts/:id',
    summary: 'Update chart',
    description: 'Update an existing chart',
    tags: ['charts'],
    requestSchema: UpdateChartRequestSchema,
    responseSchema: SuccessResponseSchema(ChartSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Delete chart
  delete: {
    method: 'DELETE',
    path: '/api/v1/charts/:id',
    summary: 'Delete chart',
    description: 'Delete a chart visualization',
    tags: ['charts'],
    responseSchema: SuccessResponseSchema(z.object({ deleted: z.boolean() })),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Get chart data
  getData: {
    method: 'POST',
    path: '/api/v1/charts/:id/data',
    summary: 'Get chart data',
    description: 'Execute the chart query and return formatted data',
    tags: ['charts'],
    requestSchema: ChartDataRequestSchema,
    responseSchema: SuccessResponseSchema(ChartDataResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Refresh chart data
  refresh: {
    method: 'POST',
    path: '/api/v1/charts/:id/refresh',
    summary: 'Refresh chart data',
    description: 'Force refresh chart data bypassing cache',
    tags: ['charts'],
    responseSchema: SuccessResponseSchema(ChartDataResponseSchema),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },

  // Export chart
  export: {
    method: 'POST',
    path: '/api/v1/charts/:id/export',
    summary: 'Export chart',
    description: 'Export chart as image or data file',
    tags: ['charts'],
    requestSchema: z.object({
      format: z.enum(['png', 'jpg', 'svg', 'pdf', 'csv', 'excel']),
      width: z.number().int().min(100).max(4000).optional(),
      height: z.number().int().min(100).max(4000).optional(),
      includeData: z.boolean().default(false),
    }),
    responseSchema: SuccessResponseSchema(z.object({
      url: z.string().url(),
      filename: z.string(),
      size: z.number().int(),
    })),
    errorSchema: ApiErrorSchema,
    statusCodes: {
      success: HttpStatusCodes.OK,
      error: [HttpStatusCodes.BAD_REQUEST, HttpStatusCodes.NOT_FOUND, HttpStatusCodes.UNAUTHORIZED],
    },
  },
} as const;
