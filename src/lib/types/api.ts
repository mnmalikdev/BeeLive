/**
 * API-related type definitions
 */

export interface ApiResponse<T = unknown> {
	data: T;
	message?: string;
	status: number;
}

export interface ApiError {
	message: string;
	code?: string;
	status: number;
	errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		current_page: number;
		per_page: number;
		total: number;
		total_pages: number;
	};
}

export interface ApiRequestOptions {
	headers?: Record<string, string>;
	signal?: AbortSignal;
	timeout?: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';


