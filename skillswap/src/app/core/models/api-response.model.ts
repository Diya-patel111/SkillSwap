/**
 * Generic API response shapes shared across all services.
 * Mirrors the backend response structure.
 */

/** Standard paginated response from GET list endpoints */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}

/** Normalized error thrown by ApiService — catch this in components */
export interface ApiError {
  status: number;
  message: string;
  errors?: { field: string; message: string }[];   // express-validator errors
}

/** Generic success wrapper for single-item responses */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
