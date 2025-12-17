export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  status: 'success' | 'error';
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  executionTimeMs: number;
  totalRows: number;
}

export interface SqlValidationResult {
  isValid: boolean;
  message?: string;
  type?: 'error' | 'warning' | 'info';
}

export enum QueryStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
