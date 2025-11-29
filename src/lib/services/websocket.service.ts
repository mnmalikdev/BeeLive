/**
 * WebSocket Service
 * Manages Socket.IO connection to backend for real-time updates
 * Handles telemetry and alert events
 */

import { io, type Socket } from 'socket.io-client';
import { websocketStore } from '$lib/stores/websocket.store.js';
import { showAlertToast } from '$lib/utils/toast.js';
import type {
	TelemetryDeltaPayload,
	TelemetryFullPayload,
	AlertPayload,
} from '$lib/types/websocket.js';
import { env } from '$lib/config/env.js';

/**
 * WebSocket Service
 * Singleton service for managing WebSocket connection
 */
class WebSocketService {
	private socket: Socket | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private readonly reconnectDelay = 3000; // 3 seconds

	/**
	 * Get WebSocket server URL
	 */
	private getWebSocketUrl(): string {
		// Extract base URL from API base URL
		const apiUrl = env.VITE_API_BASE_URL || 'http://localhost:3000';
		
		// Remove /api if present, or use as-is
		const baseUrl = apiUrl.replace(/\/api$/, '');
		
		return baseUrl;
	}

	/**
	 * Connect to WebSocket server
	 */
	connect(): void {
		if (this.socket?.connected) {
			console.log('WebSocket already connected');
			return;
		}

		const url = this.getWebSocketUrl();
		console.log(`Connecting to WebSocket server: ${url}`);

		websocketStore.setStatus('connecting');

		this.socket = io(url, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: this.reconnectDelay,
			reconnectionAttempts: this.maxReconnectAttempts,
		});

		this.setupEventHandlers();
	}

	/**
	 * Setup Socket.IO event handlers
	 */
	private setupEventHandlers(): void {
		if (!this.socket) return;

		// Connection events
		this.socket.on('connect', () => {
			console.log('✅ WebSocket connected');
			websocketStore.setStatus('connected');
			this.reconnectAttempts = 0;
		});

		this.socket.on('disconnect', (reason) => {
			console.log('❌ WebSocket disconnected:', reason);
			websocketStore.setStatus('disconnected');
		});

		this.socket.on('connect_error', (error) => {
			console.error('WebSocket connection error:', error);
			websocketStore.setError(error.message || 'Connection failed');
			this.reconnectAttempts++;

			if (this.reconnectAttempts >= this.maxReconnectAttempts) {
				console.error('Max reconnection attempts reached');
			}
		});

		// Telemetry events
		this.socket.on('telemetry', (payload: TelemetryDeltaPayload) => {
			this.handleTelemetryUpdate(payload);
		});

		// Alert events
		this.socket.on('alert', (payload: AlertPayload) => {
			this.handleAlert(payload);
		});
	}

	/**
	 * Handle telemetry update
	 * Updates store and can trigger UI updates
	 */
	private handleTelemetryUpdate(payload: TelemetryDeltaPayload): void {
		try {
			// If full telemetry is provided (first connection), use it
			if (payload.full) {
				const fullTelemetry: TelemetryFullPayload = {
					...payload.full,
					recordedAt:
						payload.full.recordedAt instanceof Date
							? payload.full.recordedAt
							: new Date(payload.full.recordedAt),
				};
				websocketStore.setLastTelemetry(fullTelemetry);
			} else if (payload.data && Object.keys(payload.data).length > 0) {
				// Delta update - merge with last known telemetry
				// Use a getter function to access current state
				let currentTelemetry: TelemetryFullPayload | null = null;
				const unsubscribe = websocketStore.subscribe((state) => {
					currentTelemetry = state.lastTelemetry;
				});
				unsubscribe(); // Immediately unsubscribe after getting value

				if (currentTelemetry) {
					const updated: TelemetryFullPayload = {
						...currentTelemetry,
						...payload.data,
						recordedAt:
							payload.data.recordedAt instanceof Date
								? payload.data.recordedAt
								: payload.data.recordedAt
									? new Date(payload.data.recordedAt)
									: currentTelemetry.recordedAt,
					};
					websocketStore.setLastTelemetry(updated);
				}
			}

			// Emit custom event for components to listen to
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('telemetry-update', {
						detail: payload.full || payload.data,
					})
				);
			}
		} catch (error) {
			console.error('Failed to handle telemetry update:', error);
		}
	}

	/**
	 * Handle alert event
	 * Shows toast notification with sound for warning and critical alerts
	 */
	private handleAlert(payload: AlertPayload): void {
		try {
			const { action, alert } = payload;

			// Debug logging
			console.log(`[WebSocket] Alert received:`, { action, type: alert.type, message: alert.message });

			if (action === 'triggered') {
				// Show alert toast with sound for both warning and critical alerts
				showAlertToast(alert.type, alert.message, true);
			} else if (action === 'cleared') {
				// Show success toast without sound for cleared alerts
				showAlertToast(`${alert.type}_CLEARED`, alert.message, false);
			}

			// Emit custom event for components to listen to
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('alert-update', {
						detail: payload,
					})
				);
			}
		} catch (error) {
			console.error('Failed to handle alert:', error);
		}
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			websocketStore.setStatus('disconnected');
			console.log('WebSocket disconnected');
		}
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.socket?.connected ?? false;
	}

	/**
	 * Get socket instance (for advanced usage)
	 */
	getSocket(): Socket | null {
		return this.socket;
	}
}

// Export singleton instance
export const websocketService = new WebSocketService();

