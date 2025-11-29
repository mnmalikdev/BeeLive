/**
 * WebSocket Store
 * Manages WebSocket connection state and real-time data
 * Follows existing store patterns
 */

import { writable } from 'svelte/store';
import type { WebSocketStatus, TelemetryFullPayload } from '$lib/types/websocket.js';

export interface WebSocketState {
	status: WebSocketStatus;
	lastTelemetry: TelemetryFullPayload | null;
	error: string | null;
}

function createWebSocketStore() {
	const { subscribe, set, update } = writable<WebSocketState>({
		status: 'disconnected',
		lastTelemetry: null,
		error: null,
	});

	return {
		subscribe,
		/**
		 * Set connection status
		 */
		setStatus: (status: WebSocketStatus) => {
			update((state) => ({ ...state, status, error: null }));
		},
		/**
		 * Set error state
		 */
		setError: (error: string) => {
			update((state) => ({ ...state, status: 'error', error }));
		},
		/**
		 * Update last telemetry
		 */
		setLastTelemetry: (telemetry: TelemetryFullPayload) => {
			update((state) => ({ ...state, lastTelemetry: telemetry }));
		},
		/**
		 * Reset store
		 */
		reset: () => {
			set({
				status: 'disconnected',
				lastTelemetry: null,
				error: null,
			});
		},
	};
}

export const websocketStore = createWebSocketStore();

