/**
 * Telemetry Service
 * Handles all telemetry-related API calls
 */

import { apiClient } from '$lib/api/client.js';
import type { ApiResponse } from '$lib/types/api.js';

/**
 * Telemetry data structure matching backend DTO
 */
export interface Telemetry {
	id: string;
	hiveId: string;
	recordedAt: string | Date;
	temperature: number;
	humidity: number;
	weightKg: number;
	soundDb: number;
	co2Ppm: number;
	dailyHoneyGainG?: number;
	swarmRisk: number;
	batteryPercent: number;
}

/**
 * Query parameters for telemetry history
 */
export interface TelemetryHistoryQuery {
	hours?: number;
	limit?: number;
}

class TelemetryService {
	private readonly basePath = '/api/telemetry';

	/**
	 * Get the latest telemetry reading
	 * Used for dashboard gauges
	 */
	async getLatest(): Promise<ApiResponse<Telemetry>> {
		return apiClient.get<Telemetry>(`${this.basePath}/latest`);
	}

	/**
	 * Get historical telemetry data
	 * Used for charts and trend analysis
	 */
	async getHistory(query: TelemetryHistoryQuery = {}): Promise<ApiResponse<Telemetry[]>> {
		const params = new URLSearchParams();
		if (query.hours) params.append('hours', query.hours.toString());
		if (query.limit) params.append('limit', query.limit.toString());

		const queryString = params.toString();
		const path = queryString ? `${this.basePath}/history?${queryString}` : `${this.basePath}/history`;

		return apiClient.get<Telemetry[]>(path);
	}
}

export const telemetryService = new TelemetryService();

