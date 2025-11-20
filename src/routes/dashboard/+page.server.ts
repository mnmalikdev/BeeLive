/**
 * Dashboard page server-side data loading
 * This runs on the server before the page renders
 */

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, depends }) => {
	// Mark this page as dependent on 'dashboard' data
	// This allows us to invalidate it when needed
	depends('dashboard');

	// TODO: Replace with actual API calls
	// For now, return mock data structure
	const dashboardData = {
		stats: {
			totalAlerts: 0,
		},
	};

	return {
		dashboard: dashboardData,
	};
};

