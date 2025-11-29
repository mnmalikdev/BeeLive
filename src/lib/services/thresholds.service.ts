/**
 * Thresholds Service
 * Handles all threshold-related API calls
 */

import { apiClient } from '$lib/api/client.js';
import type { ApiResponse } from '$lib/types/api.js';

/**
 * Thresholds data structure matching backend DTO
 * Each metric has normal, warning, and critical ranges
 */
export interface Thresholds {
	hiveId: string;
	
	// Temperature thresholds (°C)
	tempNormalMin: number;
	tempNormalMax: number;
	tempWarningMin: number;
	tempWarningMax: number;
	tempCriticalMin: number;
	tempCriticalMax: number;
	
	// Humidity thresholds (%)
	humidityNormalMin: number;
	humidityNormalMax: number;
	humidityWarningMin: number;
	humidityWarningMax: number;
	humidityCriticalMin: number;
	humidityCriticalMax: number;
	
	// Sound thresholds (dB)
	soundNormalMin: number;
	soundNormalMax: number;
	soundWarningMin: number;
	soundWarningMax: number;
	soundCriticalMin: number;
	soundCriticalMax: number;
	
	// CO2 thresholds (ppm)
	co2NormalMin: number;
	co2NormalMax: number;
	co2WarningMin: number;
	co2WarningMax: number;
	co2CriticalMin: number;
	co2CriticalMax: number;
	
	// Swarm Risk thresholds (0-100)
	swarmRiskNormalMin: number;
	swarmRiskNormalMax: number;
	swarmRiskWarningMin: number;
	swarmRiskWarningMax: number;
	swarmRiskCriticalMin: number;
	swarmRiskCriticalMax: number;
	
	// Battery thresholds (%)
	batteryNormalMin: number;
	batteryNormalMax: number;
	batteryWarningMin: number;
	batteryWarningMax: number;
	batteryCriticalMin: number;
	batteryCriticalMax: number;
	
	// Honey Gain thresholds (g/day)
	honeyGainNormalMin: number;
	honeyGainNormalMax: number;
	honeyGainWarningMin: number;
	honeyGainWarningMax: number;
	honeyGainCriticalMin: number;
	honeyGainCriticalMax: number;
	
	// Weight drop threshold (kg/hour) - special case
	maxWeightDropPerHourKg: number;
	
	// Weight monitoring thresholds
	weightCriticalRobberyDropKg: number;
	weightWarningDailyLossG: number;
	weightNormalDailyGainMinG: number;
}

/**
 * Partial thresholds for updates
 */
export type UpdateThresholds = Partial<Omit<Thresholds, 'hiveId'>>;

class ThresholdsService {
	private readonly basePath = '/api/thresholds';

	/**
	 * Get current thresholds for a hive
	 * Auto-creates defaults if they don't exist
	 */
	async getThresholds(hiveId?: string): Promise<ApiResponse<Thresholds>> {
		const params = new URLSearchParams();
		if (hiveId) params.append('hiveId', hiveId);

		const queryString = params.toString();
		const path = queryString ? `${this.basePath}?${queryString}` : this.basePath;

		return apiClient.get<Thresholds>(path);
	}

	/**
	 * Update thresholds for a hive
	 * Used by configuration panel
	 */
	async updateThresholds(
		updateData: UpdateThresholds,
		hiveId?: string
	): Promise<ApiResponse<Thresholds>> {
		const params = new URLSearchParams();
		if (hiveId) params.append('hiveId', hiveId);

		const queryString = params.toString();
		const path = queryString ? `${this.basePath}?${queryString}` : this.basePath;

		return apiClient.patch<Thresholds>(path, updateData);
	}
}

export const thresholdsService = new ThresholdsService();

