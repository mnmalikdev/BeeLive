/**
 * Root route server-side redirect
 * Redirects / to /dashboard
 */

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect root route to dashboard
	throw redirect(302, '/dashboard');
};

