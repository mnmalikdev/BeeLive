/**
 * Base service class for feature-specific services
 */

import { apiClient } from '$lib/api/client.js';
import type { ApiResponse, PaginatedResponse } from '$lib/types/api.js';
import type { ID, QueryParams } from '$lib/types/common.js';

export abstract class BaseService<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
	protected abstract basePath: string;

	/**
	 * Get all items with optional query parameters
	 */
	async getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<T>>> {
		const queryString = this.buildQueryString(params);
		return apiClient.get<PaginatedResponse<T>>(`${this.basePath}${queryString}`);
	}

	/**
	 * Get item by ID
	 */
	async getById(id: ID): Promise<ApiResponse<T>> {
		return apiClient.get<T>(`${this.basePath}/${id}`);
	}

	/**
	 * Create new item
	 */
	async create(data: CreateInput): Promise<ApiResponse<T>> {
		return apiClient.post<T>(this.basePath, data);
	}

	/**
	 * Update item by ID
	 */
	async update(id: ID, data: UpdateInput): Promise<ApiResponse<T>> {
		return apiClient.patch<T>(`${this.basePath}/${id}`, data);
	}

	/**
	 * Delete item by ID
	 */
	async delete(id: ID): Promise<ApiResponse<void>> {
		return apiClient.delete<void>(`${this.basePath}/${id}`);
	}

	/**
	 * Build query string from params
	 */
	protected buildQueryString(params?: QueryParams): string {
		if (!params) return '';

		const searchParams = new URLSearchParams();

		if (params.page) {
			searchParams.append('page', params.page.toString());
		}
		if (params.per_page) {
			searchParams.append('per_page', params.per_page.toString());
		}
		if (params.field && params.order) {
			searchParams.append('sort', `${params.field}:${params.order}`);
		}
		if (params.search) {
			searchParams.append('search', params.search);
		}
		if (params.filters) {
			Object.entries(params.filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					searchParams.append(`filter[${key}]`, String(value));
				}
			});
		}

		const queryString = searchParams.toString();
		return queryString ? `?${queryString}` : '';
	}
}


