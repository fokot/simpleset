// Local type definitions for datasource management components
// Mirrors backend API shapes from model.scala

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface DataSource {
  id: number;
  name: string;
  description?: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  ssl: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDataSourceRequest {
  name: string;
  description?: string;
  type: string;
  config: DatabaseConfig;
}

export interface TestConnectionRequest {
  type: string;
  config: DatabaseConfig;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  latency?: number;
}
