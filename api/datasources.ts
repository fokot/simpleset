import { z } from 'zod';
import {
  IdSchema,
  TimestampSchema,
  SharingConfigSchema,
} from './common.js';

// ============================================================================
// Data Source Types and Configurations
// ============================================================================

/**
 * Supported data source types
 */
export const DataSourceTypeSchema = z.enum([
  'postgresql',
  'mysql',
  'sqlite',
  'mongodb',
  'redis',
  'elasticsearch',
  'rest_api',
  'graphql',
  'csv_file',
  'json_file',
  'excel_file',
  'google_sheets',
  'bigquery',
  'snowflake',
  'redshift',
]);

/**
 * Database connection configuration
 */
export const DatabaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(false),
});

/**
 * REST API connection configuration
 */
export const RestApiConfigSchema = z.object({
  baseUrl: z.string().url(),
  headers: z.record(z.string()).default({}),
  authentication: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('none'),
    }),
    z.object({
      type: z.literal('basic'),
      username: z.string(),
      password: z.string(),
    }),
    z.object({
      type: z.literal('bearer'),
      token: z.string(),
    }),
    z.object({
      type: z.literal('api_key'),
      key: z.string(),
      value: z.string(),
      location: z.enum(['header', 'query']),
    }),
  ]).default({ type: 'none' }),
  timeout: z.number().int().min(1000).default(30000),
  retries: z.number().int().min(0).max(5).default(3),
});

/**
 * File upload configuration
 */
export const FileConfigSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().min(1),
  mimeType: z.string(),
  encoding: z.string().default('utf-8'),
  delimiter: z.string().optional(), // For CSV files
  hasHeader: z.boolean().default(true),
  sheetName: z.string().optional(), // For Excel files
  uploadedAt: TimestampSchema,
  storageUrl: z.string().url(),
});

/**
 * Cloud service configuration
 */
export const CloudConfigSchema = z.object({
  projectId: z.string().optional(),
  region: z.string().optional(),
  credentials: z.record(z.any()),
  serviceAccount: z.string().optional(),
});

/**
 * Data source connection configuration (discriminated union)
 */
export const DataSourceConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('postgresql'),
    config: DatabaseConfigSchema,
  }),
  z.object({
    type: z.literal('mysql'),
    config: DatabaseConfigSchema,
  }),
  z.object({
    type: z.literal('sqlite'),
    config: z.object({
      filePath: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal('mongodb'),
    config: z.object({
      connectionString: z.string().min(1),
      database: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal('rest_api'),
    config: RestApiConfigSchema,
  }),
  z.object({
    type: z.literal('csv_file'),
    config: FileConfigSchema,
  }),
  z.object({
    type: z.literal('json_file'),
    config: FileConfigSchema,
  }),
  z.object({
    type: z.literal('excel_file'),
    config: FileConfigSchema,
  }),
  z.object({
    type: z.literal('bigquery'),
    config: CloudConfigSchema,
  }),
  z.object({
    type: z.literal('snowflake'),
    config: DatabaseConfigSchema.extend({
      warehouse: z.string(),
      role: z.string().optional(),
    }),
  }),
]);

/**
 * Data source connection status
 */
export const ConnectionStatusSchema = z.enum([
  'connected',
  'disconnected',
  'connecting',
  'error',
  'testing',
]);

/**
 * Response-specific config without password (matches backend DataSourceResponseConfig)
 */
export const DataSourceResponseConfigSchema = z.object({
  host: z.string(),
  port: z.number().int(),
  database: z.string(),
  username: z.string(),
  ssl: z.boolean(),
});

/**
 * Data source response schema (matches backend DataSourceResponse)
 */
export const DataSourceSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: DataSourceTypeSchema,
  config: DataSourceResponseConfigSchema,
  status: ConnectionStatusSchema,
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Create data source request
 */
export const CreateDataSourceRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: DataSourceTypeSchema,
  config: DataSourceConfigSchema,
  tags: z.array(z.string()).default([]),
  sharing: SharingConfigSchema.optional(),
});

/**
 * Update data source request
 */
export const UpdateDataSourceRequestSchema = CreateDataSourceRequestSchema.partial().extend({
  id: IdSchema,
});

/**
 * Test connection request
 */
export const TestConnectionRequestSchema = z.object({
  type: DataSourceTypeSchema,
  config: DataSourceConfigSchema,
});

/**
 * Test connection response
 */
export const TestConnectionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  latency: z.number().optional(),
});



// ============================================================================
// Type Exports
// ============================================================================

export type DataSourceType = z.infer<typeof DataSourceTypeSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type RestApiConfig = z.infer<typeof RestApiConfigSchema>;
export type FileConfig = z.infer<typeof FileConfigSchema>;
export type CloudConfig = z.infer<typeof CloudConfigSchema>;
export type DataSourceConfig = z.infer<typeof DataSourceConfigSchema>;
export type ConnectionStatus = z.infer<typeof ConnectionStatusSchema>;
export type DataSourceResponseConfig = z.infer<typeof DataSourceResponseConfigSchema>;
export type DataSource = z.infer<typeof DataSourceSchema>;
export type CreateDataSourceRequest = z.infer<typeof CreateDataSourceRequestSchema>;
export type UpdateDataSourceRequest = z.infer<typeof UpdateDataSourceRequestSchema>;
export type TestConnectionRequest = z.infer<typeof TestConnectionRequestSchema>;
export type TestConnectionResponse = z.infer<typeof TestConnectionResponseSchema>;
