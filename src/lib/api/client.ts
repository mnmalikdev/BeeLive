/**
 * API Client - Centralized HTTP client for API requests
 */

import { API_BASE_URL, API_TIMEOUT } from '$lib/config/constants.js';
import type { ApiError, ApiRequestOptions, ApiResponse, HttpMethod } from '$lib/types/api.js';
import { env } from '$lib/config/env.js';

class ApiClient {
	private baseUrl: string;
	private defaultTimeout: number;

	constructor() {
		this.baseUrl = API_BASE_URL;
		this.defaultTimeout = API_TIMEOUT;
	}

	/**
	 * Creates an AbortController with timeout
	 */
	private createAbortController(timeout?: number): AbortController {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout || this.defaultTimeout);
		controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));
		return controller;
	}

	/**
	 * Builds full URL from path
	 */
	private buildUrl(path: string): string {
		if (path.startsWith('http')) {
			return path;
		}
		const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
		const cleanPath = path.startsWith('/') ? path : `/${path}`;
		return `${base}${cleanPath}`;
	}

	/**
	 * Gets default headers
	 */
	private getDefaultHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		// Add auth token if available
		if (typeof window !== 'undefined') {
			const token = localStorage.getItem('auth_token');
			if (token) {
				headers.Authorization = `Bearer ${token}`;
			}
		}

		return headers;
	}

	/**
	 * Handles API errors
	 */
	private async handleError(response: Response): Promise<ApiError> {
		let errorData: Partial<ApiError> = {};

		try {
			errorData = await response.json();
		} catch {
			// If response is not JSON, use default message
			errorData = { message: response.statusText || 'An error occurred' };
		}

		const error: ApiError = {
			message: errorData.message || 'An unexpected error occurred',
			code: errorData.code,
			status: response.status,
			errors: errorData.errors,
		};

		// Log error in development
		if (env.VITE_ENABLE_DEBUG) {
			console.error('API Error:', error);
		}

		return error;
	}

	/**
	 * Makes an API request
	 */
	async request<T = unknown>(
		method: HttpMethod,
		path: string,
		data?: unknown,
		options?: ApiRequestOptions
	): Promise<ApiResponse<T>> {
		const url = this.buildUrl(path);
		const controller = this.createAbortController(options?.timeout);
		const signal = options?.signal || controller.signal;

		const headers = {
			...this.getDefaultHeaders(),
			...options?.headers,
		};

		const config: RequestInit = {
			method,
			headers,
			signal,
		};

		if (data && method !== 'GET') {
			config.body = JSON.stringify(data);
		}

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				const error = await this.handleError(response);
				throw error;
			}

			const responseData = await response.json();

			return {
				data: responseData.data || responseData,
				message: responseData.message,
				status: response.status,
			};
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw {
					message: 'Request timeout',
					status: 408,
				} as ApiError;
			}

			if (error && typeof error === 'object' && 'status' in error) {
				throw error;
			}

			throw {
				message: 'Network error. Please check your connection.',
				status: 0,
			} as ApiError;
		}
	}

	/**
	 * GET request
	 */
	get<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
		return this.request<T>('GET', path, undefined, options);
	}

	/**
	 * POST request
	 */
	post<T = unknown>(
		path: string,
		data?: unknown,
		options?: ApiRequestOptions
	): Promise<ApiResponse<T>> {
		return this.request<T>('POST', path, data, options);
	}

	/**
	 * PUT request
	 */
	put<T = unknown>(
		path: string,
		data?: unknown,
		options?: ApiRequestOptions
	): Promise<ApiResponse<T>> {
		return this.request<T>('PUT', path, data, options);
	}

	/**
	 * PATCH request
	 */
	patch<T = unknown>(
		path: string,
		data?: unknown,
		options?: ApiRequestOptions
	): Promise<ApiResponse<T>> {
		return this.request<T>('PATCH', path, data, options);
	}

	/**
	 * DELETE request
	 */
	delete<T = unknown>(path: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
		return this.request<T>('DELETE', path, undefined, options);
	}
}

// Export singleton instance
export const apiClient = new ApiClient();


