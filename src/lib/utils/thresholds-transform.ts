/**
 * Thresholds Transformation Utilities
 * Converts backend thresholds format to UI metric format
 */

import type { Thresholds } from '$lib/services/thresholds.service.js';

export interface MetricThreshold {
	id: string;
	label: string;
	unit: string;
	min: number;
	max: number;
	normalMin: number;
	normalMax: number;
	warningMin: number;
	warningMax: number;
	criticalMin: number;
	criticalMax: number;
}

/**
 * Transform backend thresholds into UI metric format
 * Backend now provides all ranges (normal, warning, critical) directly
 */
export function transformThresholdsToMetrics(thresholds: Thresholds): MetricThreshold[] {
	return [
		{
			id: 'temp',
			label: 'Hive Temperature',
			unit: '°C',
			min: 18,
			max: 45,
			normalMin: thresholds.tempNormalMin,
			normalMax: thresholds.tempNormalMax,
			warningMin: thresholds.tempWarningMin,
			warningMax: thresholds.tempWarningMax,
			criticalMin: thresholds.tempCriticalMin,
			criticalMax: thresholds.tempCriticalMax,
		},
		{
			id: 'humidity',
			label: 'Humidity',
			unit: '%',
			min: 0,
			max: 100,
			normalMin: thresholds.humidityNormalMin,
			normalMax: thresholds.humidityNormalMax,
			warningMin: thresholds.humidityWarningMin,
			warningMax: thresholds.humidityWarningMax,
			criticalMin: thresholds.humidityCriticalMin,
			criticalMax: thresholds.humidityCriticalMax,
		},
		{
			id: 'weight',
			label: 'Weight (kg)',
			unit: 'kg',
			min: 0,
			max: 80,
			normalMin: 20,
			normalMax: 60,
			warningMin: 15,
			warningMax: 20,
			criticalMin: 0,
			criticalMax: 15,
		},
		{
			id: 'activity',
			label: 'Bee Activity',
			unit: 'dB',
			min: 0,
			max: 100,
			normalMin: thresholds.soundNormalMin,
			normalMax: thresholds.soundNormalMax,
			warningMin: thresholds.soundWarningMin,
			warningMax: thresholds.soundWarningMax,
			criticalMin: thresholds.soundCriticalMin,
			criticalMax: thresholds.soundCriticalMax,
		},
		{
			id: 'co2',
			label: 'CO₂',
			unit: 'ppm',
			min: 0,
			max: 5000,
			normalMin: thresholds.co2NormalMin,
			normalMax: thresholds.co2NormalMax,
			warningMin: thresholds.co2WarningMin,
			warningMax: thresholds.co2WarningMax,
			criticalMin: thresholds.co2CriticalMin,
			criticalMax: thresholds.co2CriticalMax,
		},
		{
			id: 'honey',
			label: 'Daily Honey Gain',
			unit: 'g',
			min: -1000,
			max: 1000,
			normalMin: thresholds.honeyGainNormalMin,
			normalMax: thresholds.honeyGainNormalMax,
			warningMin: thresholds.honeyGainWarningMin,
			warningMax: thresholds.honeyGainWarningMax,
			criticalMin: thresholds.honeyGainCriticalMin,
			criticalMax: thresholds.honeyGainCriticalMax,
		},
		{
			id: 'swarm',
			label: 'Swarm Risk Score',
			unit: '',
			min: 0,
			max: 100,
			normalMin: thresholds.swarmRiskNormalMin,
			normalMax: thresholds.swarmRiskNormalMax,
			warningMin: thresholds.swarmRiskWarningMin,
			warningMax: thresholds.swarmRiskWarningMax,
			criticalMin: thresholds.swarmRiskCriticalMin,
			criticalMax: thresholds.swarmRiskCriticalMax,
		},
		{
			id: 'battery',
			label: 'Battery %',
			unit: '%',
			min: 0,
			max: 100,
			normalMin: thresholds.batteryNormalMin,
			normalMax: thresholds.batteryNormalMax,
			warningMin: thresholds.batteryWarningMin,
			warningMax: thresholds.batteryWarningMax,
			criticalMin: thresholds.batteryCriticalMin,
			criticalMax: thresholds.batteryCriticalMax,
		},
	];
}

/**
 * Transform UI metrics back to backend thresholds format
 * Maps all normal, warning, and critical ranges to backend structure
 */
export function transformMetricsToThresholds(metrics: MetricThreshold[]): Partial<Thresholds> {
	const result: Partial<Thresholds> = {};

	metrics.forEach((metric) => {
		switch (metric.id) {
			case 'temp':
				result.tempNormalMin = metric.normalMin;
				result.tempNormalMax = metric.normalMax;
				result.tempWarningMin = metric.warningMin;
				result.tempWarningMax = metric.warningMax;
				result.tempCriticalMin = metric.criticalMin;
				result.tempCriticalMax = metric.criticalMax;
				break;
			case 'humidity':
				result.humidityNormalMin = metric.normalMin;
				result.humidityNormalMax = metric.normalMax;
				result.humidityWarningMin = metric.warningMin;
				result.humidityWarningMax = metric.warningMax;
				result.humidityCriticalMin = metric.criticalMin;
				result.humidityCriticalMax = metric.criticalMax;
				break;
			case 'activity':
				result.soundNormalMin = metric.normalMin;
				result.soundNormalMax = metric.normalMax;
				result.soundWarningMin = metric.warningMin;
				result.soundWarningMax = metric.warningMax;
				result.soundCriticalMin = metric.criticalMin;
				result.soundCriticalMax = metric.criticalMax;
				break;
			case 'co2':
				result.co2NormalMin = metric.normalMin;
				result.co2NormalMax = metric.normalMax;
				result.co2WarningMin = metric.warningMin;
				result.co2WarningMax = metric.warningMax;
				result.co2CriticalMin = metric.criticalMin;
				result.co2CriticalMax = metric.criticalMax;
				break;
			case 'honey':
				result.honeyGainNormalMin = metric.normalMin;
				result.honeyGainNormalMax = metric.normalMax;
				result.honeyGainWarningMin = metric.warningMin;
				result.honeyGainWarningMax = metric.warningMax;
				result.honeyGainCriticalMin = metric.criticalMin;
				result.honeyGainCriticalMax = metric.criticalMax;
				break;
			case 'swarm':
				result.swarmRiskNormalMin = metric.normalMin;
				result.swarmRiskNormalMax = metric.normalMax;
				result.swarmRiskWarningMin = metric.warningMin;
				result.swarmRiskWarningMax = metric.warningMax;
				result.swarmRiskCriticalMin = metric.criticalMin;
				result.swarmRiskCriticalMax = metric.criticalMax;
				break;
			case 'battery':
				result.batteryNormalMin = metric.normalMin;
				result.batteryNormalMax = metric.normalMax;
				result.batteryWarningMin = metric.warningMin;
				result.batteryWarningMax = metric.warningMax;
				result.batteryCriticalMin = metric.criticalMin;
				result.batteryCriticalMax = metric.criticalMax;
				break;
		}
	});

	return result;
}

/**
 * Extract weight monitoring thresholds from full thresholds object
 */
export function extractWeightMonitoringThresholds(thresholds: Thresholds) {
	return {
		weightCriticalRobberyDropKg: thresholds.weightCriticalRobberyDropKg,
		weightWarningDailyLossG: thresholds.weightWarningDailyLossG,
		weightNormalDailyGainMinG: thresholds.weightNormalDailyGainMinG,
	};
}

