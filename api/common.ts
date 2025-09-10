import { z } from 'zod';

// ============================================================================
// Base Types and Utilities
// ============================================================================

/**
 * Common ID schema for all entities
 */
export const IdSchema = z.string().uuid('Invalid UUID format');

/**
 * Timestamp schema for created/updated dates
 */
export const TimestampSchema = z.string().datetime('Invalid ISO datetime format');

/**
 * Pagination parameters for list endpoints
 */
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Pagination metadata for responses
 */
export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

/**
 * Generic paginated response wrapper
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  });

/**
 * Standard API error response
 */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    timestamp: TimestampSchema,
    path: z.string().optional(),
  }),
});

/**
 * Success response wrapper
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: TimestampSchema,
  });

/**
 * Common HTTP status codes
 */
export const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Permission levels for resources
 */
export const PermissionLevelSchema = z.enum([
  'read',
  'write',
  'admin',
  'owner',
]);

/**
 * User reference schema (minimal user info)
 */
export const UserRefSchema = z.object({
  id: IdSchema,
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
});

/**
 * Resource sharing configuration
 */
export const SharingConfigSchema = z.object({
  isPublic: z.boolean().default(false),
  allowedUsers: z.array(IdSchema).default([]),
  allowedRoles: z.array(z.string()).default([]),
  permissions: z.record(IdSchema, PermissionLevelSchema).default({}),
});

/**
 * Audit trail for resource changes
 */
export const AuditTrailSchema = z.object({
  createdAt: TimestampSchema,
  createdBy: UserRefSchema,
  updatedAt: TimestampSchema,
  updatedBy: UserRefSchema,
});

/**
 * Color schema for UI elements
 */
export const ColorSchema = z.string().regex(
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  'Invalid hex color format'
);

/**
 * Dimension schema for layout positioning
 */
export const DimensionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
});

/**
 * Generic filter schema for list endpoints
 */
export const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'like', 'ilike']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]),
});

/**
 * Search parameters for endpoints
 */
export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  filters: z.array(FilterSchema).default([]),
  tags: z.array(z.string()).default([]),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Id = z.infer<typeof IdSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;
export type UserRef = z.infer<typeof UserRefSchema>;
export type SharingConfig = z.infer<typeof SharingConfigSchema>;
export type AuditTrail = z.infer<typeof AuditTrailSchema>;
export type Color = z.infer<typeof ColorSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number
) {
  const totalPages = Math.ceil(total / params.limit);
  
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true as const,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>,
  path?: string
) {
  return {
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path,
    },
  };
}
