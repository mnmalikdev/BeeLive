/**
 * Application-wide constants
 */

export const APP_NAME = 'BeeLive';
export const APP_VERSION = '0.0.1';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_TIMEOUT = 30000; // 30 seconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date/Time Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const TIME_FORMAT = 'HH:mm:ss';

// Storage Keys
export const STORAGE_KEYS = {
	AUTH_TOKEN: 'auth_token',
	REFRESH_TOKEN: 'refresh_token',
	USER_PREFERENCES: 'user_preferences',
	THEME: 'theme',
} as const;

// Route Paths
export const ROUTES = {
	HOME: '/',
	AUTH: {
		LOGIN: '/auth/login',
		LOGOUT: '/auth/logout',
		REGISTER: '/auth/register',
		FORGOT_PASSWORD: '/auth/forgot-password',
		RESET_PASSWORD: '/auth/reset-password',
	},
	DASHBOARD: '/dashboard',
	ALERTS: {
		LIST: '/alerts',
		DETAIL: (id: string) => `/alerts/${id}`,
		CREATE: '/alerts/create',
		EDIT: (id: string) => `/alerts/${id}/edit`,
	},
	CONFIGURATIONS: '/configurations',
	PROFILE: '/profile',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
	GENERIC: 'An unexpected error occurred. Please try again.',
	NETWORK: 'Network error. Please check your connection.',
	UNAUTHORIZED: 'You are not authorized to perform this action.',
	NOT_FOUND: 'The requested resource was not found.',
	VALIDATION: 'Please check your input and try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
	CREATED: 'Successfully created.',
	UPDATED: 'Successfully updated.',
	DELETED: 'Successfully deleted.',
	SAVED: 'Successfully saved.',
} as const;


