// Local type definitions for datasource management components
// Mirrors API shapes from api/datasources.ts without importing Zod

export type DataSourceType =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'redis'
  | 'elasticsearch'
  | 'rest_api'
  | 'graphql'
  | 'csv_file'
  | 'json_file'
  | 'excel_file'
  | 'google_sheets'
  | 'bigquery'
  | 'snowflake'
  | 'redshift';

export type ConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error'
  | 'testing';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  connectionTimeout?: number;
  queryTimeout?: number;
  maxConnections?: number;
  schema?: string;
}

export interface DataSourceConfig {
  type: DataSourceType;
  config: DatabaseConfig;
}

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  config: DataSourceConfig;
  status: ConnectionStatus;
  lastConnected?: string;
  errorMessage?: string;
  tags: string[];
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
}

export interface CreateDataSourceRequest {
  name: string;
  description?: string;
  type: DataSourceType;
  config: DataSourceConfig;
  tags?: string[];
}

export interface TestConnectionRequest {
  type: DataSourceType;
  config: DataSourceConfig;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency?: number;
}

