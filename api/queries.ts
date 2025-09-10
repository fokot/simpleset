import { z } from 'zod';
import {
  IdSchema,
  TimestampSchema,
  AuditTrailSchema,
  SharingConfigSchema,
  PaginationParamsSchema,
  PaginatedResponseSchema,
  SearchParamsSchema,
} from './common.js';

// ============================================================================
// Query Engine Schemas
// ============================================================================

/**
 * Query parameter types
 */
export const QueryParameterTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'array',
  'object',
]);

/**
 * Query parameter definition
 */
export const QueryParameterSchema = z.object({
  name: z.string().min(1),
  type: QueryParameterTypeSchema,
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  description: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.any()).optional(),
  }).optional(),
});

/**
 * Query execution status
 */
export const QueryStatusSchema = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'cached',
]);

/**
 * Data type for query results
 */
export const DataTypeSchema = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'null',
]);

/**
 * Column metadata for query results
 */
export const ColumnMetadataSchema = z.object({
  name: z.string(),
  type: DataTypeSchema,
  nullable: z.boolean(),
  description: z.string().optional(),
});

/**
 * Query execution statistics
 */
export const QueryStatsSchema = z.object({
  executionTime: z.number().min(0), // milliseconds
  rowsAffected: z.number().int().min(0),
  bytesProcessed: z.number().int().min(0).optional(),
  cacheHit: z.boolean().default(false),
  cost: z.number().min(0).optional(),
});

/**
 * Query result data
 */
export const QueryResultSchema = z.object({
  columns: z.array(ColumnMetadataSchema),
  rows: z.array(z.array(z.any())),
  totalRows: z.number().int().min(0),
  hasMore: z.boolean(),
  stats: QueryStatsSchema,
});

/**
 * Saved query schema
 */
export const SavedQuerySchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sql: z.string().min(1),
  dataSourceId: IdSchema,
  parameters: z.array(QueryParameterSchema).default([]),
  tags: z.array(z.string()).default([]),
  sharing: SharingConfigSchema,
  audit: AuditTrailSchema,
  lastExecuted: TimestampSchema.optional(),
  executionCount: z.number().int().min(0).default(0),
});

/**
 * Query execution request
 */
export const ExecuteQueryRequestSchema = z.object({
  sql: z.string().min(1),
  dataSourceId: IdSchema,
  parameters: z.record(z.any()).default({}),
  limit: z.number().int().min(1).max(10000).default(1000),
  offset: z.number().int().min(0).default(0),
  useCache: z.boolean().default(true),
  cacheTimeout: z.number().int().min(0).default(3600), // seconds
});

/**
 * Query execution response
 */
export const ExecuteQueryResponseSchema = z.object({
  id: IdSchema, // execution ID
  status: QueryStatusSchema,
  result: QueryResultSchema.optional(),
  error: z.string().optional(),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
});

/**
 * Query validation request
 */
export const ValidateQueryRequestSchema = z.object({
  sql: z.string().min(1),
  dataSourceId: IdSchema,
  parameters: z.record(z.any()).default({}),
});

/**
 * Query validation response
 */
export const ValidateQueryResponseSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    line: z.number().int().optional(),
    column: z.number().int().optional(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
  })).default([]),
  estimatedCost: z.number().min(0).optional(),
  estimatedRows: z.number().int().min(0).optional(),
});

// ============================================================================
// Request/Response Schemas
// ============================================================================

/**
 * Create saved query request
 */
export const CreateSavedQueryRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sql: z.string().min(1),
  dataSourceId: IdSchema,
  parameters: z.array(QueryParameterSchema).default([]),
  tags: z.array(z.string()).default([]),
  sharing: SharingConfigSchema.optional(),
});

/**
 * Update saved query request
 */
export const UpdateSavedQueryRequestSchema = CreateSavedQueryRequestSchema.partial().extend({
  id: IdSchema,
});

/**
 * Saved query list parameters
 */
export const SavedQueryListParamsSchema = PaginationParamsSchema.extend({
  dataSourceId: IdSchema.optional(),
  search: SearchParamsSchema.optional(),
});

/**
 * Saved query list response
 */
export const SavedQueryListResponseSchema = PaginatedResponseSchema(SavedQuerySchema);

// ============================================================================
// Query Builder Schemas
// ============================================================================

/**
 * SQL join types
 */
export const JoinTypeSchema = z.enum([
  'inner',
  'left',
  'right',
  'full',
  'cross',
]);

/**
 * SQL aggregate functions
 */
export const AggregateFunctionSchema = z.enum([
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'stddev',
  'variance',
]);

/**
 * SQL operators for conditions
 */
export const OperatorSchema = z.enum([
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'nin',
  'like',
  'ilike',
  'is_null',
  'is_not_null',
  'between',
]);

/**
 * Query builder condition
 */
export const ConditionSchema = z.object({
  column: z.string(),
  operator: OperatorSchema,
  value: z.any().optional(),
  values: z.array(z.any()).optional(), // for IN, BETWEEN operators
});

/**
 * Query builder join
 */
export const JoinSchema = z.object({
  type: JoinTypeSchema,
  table: z.string(),
  alias: z.string().optional(),
  on: z.array(ConditionSchema),
});

/**
 * Query builder select column
 */
export const SelectColumnSchema = z.object({
  column: z.string(),
  alias: z.string().optional(),
  aggregate: AggregateFunctionSchema.optional(),
});

/**
 * Query builder schema
 */
export const QueryBuilderSchema = z.object({
  select: z.array(SelectColumnSchema),
  from: z.string(),
  joins: z.array(JoinSchema).default([]),
  where: z.array(ConditionSchema).default([]),
  groupBy: z.array(z.string()).default([]),
  having: z.array(ConditionSchema).default([]),
  orderBy: z.array(z.object({
    column: z.string(),
    direction: z.enum(['asc', 'desc']).default('asc'),
  })).default([]),
  limit: z.number().int().min(1).optional(),
  offset: z.number().int().min(0).optional(),
});

/**
 * Query builder to SQL request
 */
export const BuildQueryRequestSchema = z.object({
  builder: QueryBuilderSchema,
  dataSourceId: IdSchema,
});

/**
 * Query builder to SQL response
 */
export const BuildQueryResponseSchema = z.object({
  sql: z.string(),
  parameters: z.record(z.any()),
});

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Cache entry schema
 */
export const CacheEntrySchema = z.object({
  key: z.string(),
  query: z.string(),
  dataSourceId: IdSchema,
  parameters: z.record(z.any()),
  result: QueryResultSchema,
  createdAt: TimestampSchema,
  expiresAt: TimestampSchema,
  hitCount: z.number().int().min(0).default(0),
  size: z.number().int().min(0), // bytes
});

/**
 * Cache statistics
 */
export const CacheStatsSchema = z.object({
  totalEntries: z.number().int().min(0),
  totalSize: z.number().int().min(0), // bytes
  hitRate: z.number().min(0).max(1),
  missRate: z.number().min(0).max(1),
  evictionCount: z.number().int().min(0),
});

// ============================================================================
// Type Exports
// ============================================================================

export type QueryParameterType = z.infer<typeof QueryParameterTypeSchema>;
export type QueryParameter = z.infer<typeof QueryParameterSchema>;
export type QueryStatus = z.infer<typeof QueryStatusSchema>;
export type DataType = z.infer<typeof DataTypeSchema>;
export type ColumnMetadata = z.infer<typeof ColumnMetadataSchema>;
export type QueryStats = z.infer<typeof QueryStatsSchema>;
export type QueryResult = z.infer<typeof QueryResultSchema>;
export type SavedQuery = z.infer<typeof SavedQuerySchema>;
export type ExecuteQueryRequest = z.infer<typeof ExecuteQueryRequestSchema>;
export type ExecuteQueryResponse = z.infer<typeof ExecuteQueryResponseSchema>;
export type ValidateQueryRequest = z.infer<typeof ValidateQueryRequestSchema>;
export type ValidateQueryResponse = z.infer<typeof ValidateQueryResponseSchema>;
export type CreateSavedQueryRequest = z.infer<typeof CreateSavedQueryRequestSchema>;
export type UpdateSavedQueryRequest = z.infer<typeof UpdateSavedQueryRequestSchema>;
export type SavedQueryListParams = z.infer<typeof SavedQueryListParamsSchema>;
export type SavedQueryListResponse = z.infer<typeof SavedQueryListResponseSchema>;
export type JoinType = z.infer<typeof JoinTypeSchema>;
export type AggregateFunction = z.infer<typeof AggregateFunctionSchema>;
export type Operator = z.infer<typeof OperatorSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Join = z.infer<typeof JoinSchema>;
export type SelectColumn = z.infer<typeof SelectColumnSchema>;
export type QueryBuilder = z.infer<typeof QueryBuilderSchema>;
export type BuildQueryRequest = z.infer<typeof BuildQueryRequestSchema>;
export type BuildQueryResponse = z.infer<typeof BuildQueryResponseSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CacheStats = z.infer<typeof CacheStatsSchema>;
