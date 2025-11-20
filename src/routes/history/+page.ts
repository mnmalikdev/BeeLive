/**
 * History page client-side data loading
 * This runs in the browser and can access stores, etc.
 */

import type { PageLoad } from './$types';

/**
 * Load history data
 */
export const load: PageLoad = async ({ data }) => {
	// Return data that will be available in the page component
	return data;
};

