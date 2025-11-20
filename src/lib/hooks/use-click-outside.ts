/**
 * Hook for handling click outside events
 */

import { onMount } from 'svelte';

/**
 * Handles clicks outside of a specified element
 */
export function useClickOutside(
	node: HTMLElement,
	callback: (event: MouseEvent | TouchEvent) => void
) {
	const handleClick = (event: MouseEvent | TouchEvent) => {
		if (node && !node.contains(event.target as Node)) {
			callback(event);
		}
	};

	onMount(() => {
		document.addEventListener('mousedown', handleClick);
		document.addEventListener('touchstart', handleClick);

		return () => {
			document.removeEventListener('mousedown', handleClick);
			document.removeEventListener('touchstart', handleClick);
		};
	});

	return {
		destroy() {
			document.removeEventListener('mousedown', handleClick);
			document.removeEventListener('touchstart', handleClick);
		},
	};
}


