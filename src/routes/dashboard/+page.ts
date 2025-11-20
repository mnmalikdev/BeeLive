/**
 * Dashboard page client-side data loading
 * This runs in the browser and can access stores, etc.
 */

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, parent }) => {
	// Get data from parent layout if needed
	const parentData = await parent();

	// Return data that will be available in the page component
	return {
		...data,
		// Add any client-side data transformations here
	};
};

