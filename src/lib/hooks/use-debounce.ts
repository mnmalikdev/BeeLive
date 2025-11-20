/**
 * Hook for debouncing values
 */

import { writable, type Writable } from 'svelte/store';

/**
 * Creates a debounced store that delays updates
 */
export function useDebounce<T>(value: Writable<T>, delay: number): Writable<T> {
	const debounced = writable<T>(undefined as T);
	let timeoutId: ReturnType<typeof setTimeout>;

	value.subscribe((val) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			debounced.set(val);
		}, delay);
	});

	return debounced;
}


