/**
 * Environment configuration and validation
 */

interface EnvConfig {
	VITE_API_BASE_URL: string;
	VITE_APP_ENV: 'development' | 'staging' | 'production';
	VITE_ENABLE_ANALYTICS: boolean;
	VITE_ENABLE_DEBUG: boolean;
}

/**
 * Validates and returns environment variables
 */
function getEnvConfig(): EnvConfig {
	const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
	const appEnv = import.meta.env.VITE_APP_ENV || 'development';
	const enableAnalytics = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
	const enableDebug = import.meta.env.VITE_ENABLE_DEBUG === 'true';

	if (!apiBaseUrl && appEnv === 'production') {
		console.warn('VITE_API_BASE_URL is not set in production environment');
	}

	return {
		VITE_API_BASE_URL: apiBaseUrl || '/api',
		VITE_APP_ENV: appEnv as EnvConfig['VITE_APP_ENV'],
		VITE_ENABLE_ANALYTICS: enableAnalytics,
		VITE_ENABLE_DEBUG: enableDebug,
	};
}

export const env = getEnvConfig();

export const isDevelopment = env.VITE_APP_ENV === 'development';
export const isProduction = env.VITE_APP_ENV === 'production';
export const isStaging = env.VITE_APP_ENV === 'staging';


