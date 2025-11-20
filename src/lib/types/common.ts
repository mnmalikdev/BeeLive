/**
 * Common type definitions used across the application
 */

export type ID = string | number;

export interface BaseEntity {
	id: ID;
	created_at: string;
	updated_at: string;
}

export interface Timestamps {
	created_at: string;
	updated_at: string;
}

export type Status = 'active' | 'inactive' | 'pending' | 'archived';

export interface SelectOption<T = string> {
	label: string;
	value: T;
	disabled?: boolean;
}

export type SortOrder = 'asc' | 'desc';

export interface SortParams {
	field: string;
	order: SortOrder;
}

export interface PaginationParams {
	page: number;
	per_page: number;
}

export interface FilterParams {
	[key: string]: unknown;
}

export interface QueryParams extends PaginationParams, Partial<SortParams> {
	filters?: FilterParams;
	search?: string;
}


