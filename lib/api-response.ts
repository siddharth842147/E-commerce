export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string; fieldErrors?: Record<string, string[]> };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function err(error: string, fieldErrors?: Record<string, string[]>): ApiError {
  return { success: false, error, fieldErrors };
}
