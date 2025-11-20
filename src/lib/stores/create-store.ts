/**
 * Utility for creating typed Svelte stores
 */

import { writable, type Writable } from 'svelte/store';

/**
 * Creates a typed writable store with initial value
 */
export function createStore<T>(initialValue: T): Writable<T> {
	return writable(initialValue);
}

/**
 * Creates a store factory function
 */
export function createStoreFactory<T>(initialValue: T) {
	return () => createStore(initialValue);
}


