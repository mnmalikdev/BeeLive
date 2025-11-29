/**
 * Events Service
 * Handles all event log-related API calls
 */

import { apiClient } from '$lib/api/client.js';
import type { ApiResponse } from '$lib/types/api.js';

/**
 * Event types matching backend
 */
export type EventType =
	| 'TEMP_HIGH'
	| 'TEMP_LOW'
	| 'HUMIDITY_HIGH'
	| 'HUMIDITY_LOW'
	| 'WEIGHT_DROP'
	| 'SWARM_RISK'
	| 'CO2_HIGH'
	| 'BATTERY_LOW'
	| 'SOUND_ANOMALY'
	| 'HONEY_GAIN_LOW';

/**
 * Event log data structure matching backend DTO
 */
export interface Event {
	id: string;
	hiveId: string;
	createdAt: string | Date;
	type: EventType | string;
	message: string;
}

/**
 * Query parameters for events
 */
export interface EventsQuery {
	limit?: number;
	type?: EventType;
}

class EventsService {
	private readonly basePath = '/api/events';

	/**
	 * Get event logs with optional filtering
	 * Used for alert history display
	 */
	async getEvents(query: EventsQuery = {}): Promise<ApiResponse<Event[]>> {
		const params = new URLSearchParams();
		if (query.limit) params.append('limit', query.limit.toString());
		if (query.type) params.append('type', query.type);

		const queryString = params.toString();
		const path = queryString ? `${this.basePath}?${queryString}` : this.basePath;

		return apiClient.get<Event[]>(path);
	}
}

export const eventsService = new EventsService();

