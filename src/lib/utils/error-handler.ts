/**
 * Error handling utilities
 */

import type { ApiError } from '$lib/types/api.js';
import { ERROR_MESSAGES } from '$lib/config/constants.js';
import { uiStore } from '$lib/stores/ui.store.js';

/**
 * Handles API errors and displays appropriate notifications
 */
export function handleApiError(error: unknown, showNotification = true): string {
	let message = ERROR_MESSAGES.GENERIC;

	if (error && typeof error === 'object') {
		const apiError = error as ApiError;

		if (apiError.message) {
			message = apiError.message;
		} else if (apiError.status === 401) {
			message = ERROR_MESSAGES.UNAUTHORIZED;
		} else if (apiError.status === 404) {
			message = ERROR_MESSAGES.NOT_FOUND;
		} else if (apiError.status === 0) {
			message = ERROR_MESSAGES.NETWORK;
		}
	} else if (error instanceof Error) {
		message = error.message;
	}

	if (showNotification) {
		uiStore.addNotification({
			type: 'error',
			message,
		});
	}

	return message;
}

/**
 * Extracts validation errors from API error
 */
export function extractValidationErrors(error: unknown): Record<string, string[]> {
	if (error && typeof error === 'object' && 'errors' in error) {
		return (error as ApiError).errors || {};
	}
	return {};
}


