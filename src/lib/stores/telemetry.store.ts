/**
 * Telemetry Stores
 * 
 * Provides granular Svelte stores for each telemetry metric.
 * Each gauge subscribes only to its own data, improving performance
 * by preventing unnecessary re-renders.
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { Thresholds } from '$lib/services/thresholds.service.js';
import { METRICS_CONFIG, SEVERITY_COLORS } from '$lib/config/metrics.config.js';

// ============================================
// TYPES
// ============================================

export type Severity = 'safe' | 'warning' | 'critical';

export interface GaugeSegment {
	start: number;
	stop: number;
	color: string;
	label: string;
}

export interface MetricData {
	id: string;
	label: string;
	unit: string;
	value: string;
	rawValue: number;
	percent: number;
	severity: Severity;
	scale: [string, string, string];
	segments: GaugeSegment[];
	ranges?: {
		normal: string;
		warning: string;
		critical: string;
	};
}

export interface TelemetryValues {
	temperature: number;
	humidity: number;
	weightKg: number;
	soundDb: number;
	co2Ppm: number;
	dailyHoneyGainG: number;
	swarmRisk: number;
	batteryPercent: number;
	recordedAt: Date;
}

// ============================================
// RAW VALUE STORES
// ============================================

// Individual writable stores for each telemetry value
export const temperatureValue = writable<number>(0);
export const humidityValue = writable<number>(0);
export const weightValue = writable<number>(0);
export const soundValue = writable<number>(0);
export const co2Value = writable<number>(0);
export const honeyGainValue = writable<number>(0);
export const swarmRiskValue = writable<number>(0);
export const batteryValue = writable<number>(0);
export const recordedAt = writable<Date>(new Date());

// Thresholds store
export const thresholdsStore = writable<Thresholds | null>(null);

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculatePercent(value: number, min: number, max: number): number {
	const clamped = Math.max(min, Math.min(max, value));
	return ((clamped - min) / (max - min)) * 100;
}

function valueToPercent(value: number, displayMin: number, displayMax: number): number {
	return ((value - displayMin) / (displayMax - displayMin)) * 100;
}

function calculateSeverity(
	value: number,
	normalMin: number,
	normalMax: number,
	warningMin: number,
	warningMax: number,
	metricType: 'ascending' | 'inverted' | 'range'
): Severity {
	if (metricType === 'ascending') {
		if (value <= normalMax) return 'safe';
		if (value <= warningMax) return 'warning';
		return 'critical';
	} else if (metricType === 'inverted') {
		if (value < warningMin) return 'critical';
		if (value < normalMin) return 'warning';
		return 'safe';
	} else {
		if (value >= normalMin && value <= normalMax) return 'safe';
		if (value >= warningMin && value <= warningMax) return 'warning';
		return 'critical';
	}
}

function generateAscendingSegments(
	displayMin: number,
	displayMax: number,
	normalMax: number,
	warningMax: number
): GaugeSegment[] {
	const normalEnd = valueToPercent(normalMax, displayMin, displayMax);
	const warningEnd = valueToPercent(warningMax, displayMin, displayMax);
	return [
		{ start: 0, stop: normalEnd, color: SEVERITY_COLORS.normal, label: 'Normal' },
		{ start: normalEnd, stop: warningEnd, color: SEVERITY_COLORS.warning, label: 'Warning' },
		{ start: warningEnd, stop: 100, color: SEVERITY_COLORS.critical, label: 'Critical' },
	];
}

function generateInvertedSegments(
	displayMin: number,
	displayMax: number,
	warningMin: number,
	normalMin: number
): GaugeSegment[] {
	const criticalEnd = valueToPercent(warningMin, displayMin, displayMax);
	const warningEnd = valueToPercent(normalMin, displayMin, displayMax);
	return [
		{ start: 0, stop: criticalEnd, color: SEVERITY_COLORS.critical, label: 'Critical' },
		{ start: criticalEnd, stop: warningEnd, color: SEVERITY_COLORS.warning, label: 'Warning' },
		{ start: warningEnd, stop: 100, color: SEVERITY_COLORS.normal, label: 'Normal' },
	];
}

function generateRangeSegments(
	displayMin: number,
	displayMax: number,
	criticalMin: number,
	normalMin: number,
	normalMax: number,
	criticalMax: number
): GaugeSegment[] {
	const criticalLowEnd = valueToPercent(criticalMin, displayMin, displayMax);
	const warningLowEnd = valueToPercent(normalMin, displayMin, displayMax);
	const normalEnd = valueToPercent(normalMax, displayMin, displayMax);
	const warningHighEnd = valueToPercent(criticalMax, displayMin, displayMax);
	return [
		{ start: 0, stop: criticalLowEnd, color: SEVERITY_COLORS.critical, label: 'Critical' },
		{ start: criticalLowEnd, stop: warningLowEnd, color: SEVERITY_COLORS.warning, label: 'Warning' },
		{ start: warningLowEnd, stop: normalEnd, color: SEVERITY_COLORS.normal, label: 'Normal' },
		{ start: normalEnd, stop: warningHighEnd, color: SEVERITY_COLORS.warning, label: 'Warning' },
		{ start: warningHighEnd, stop: 100, color: SEVERITY_COLORS.critical, label: 'Critical' },
	];
}

// ============================================
// DERIVED METRIC STORES
// ============================================

const cfg = METRICS_CONFIG;

/** Temperature metric - derived from temperatureValue and thresholds */
export const temperatureMetric: Readable<MetricData | null> = derived(
	[temperatureValue, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.temp.displayMin, cfg.temp.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.tempNormalMin, $thresholds.tempNormalMax,
			$thresholds.tempWarningMin, $thresholds.tempWarningMax,
			'range'
		);
		const segments = generateRangeSegments(
			cfg.temp.displayMin, cfg.temp.displayMax,
			$thresholds.tempCriticalMin, $thresholds.tempNormalMin,
			$thresholds.tempNormalMax, $thresholds.tempCriticalMax
		);
		
		return {
			id: 'temp',
			label: cfg.temp.label,
			unit: cfg.temp.unit,
			value: $value.toFixed(1),
			rawValue: $value,
			percent,
			severity,
			scale: cfg.temp.scaleLabels,
			segments,
			ranges: {
				normal: `${$thresholds.tempNormalMin} – ${$thresholds.tempNormalMax} °C`,
				warning: `${$thresholds.tempCriticalMin} – ${$thresholds.tempNormalMin} °C or ${$thresholds.tempNormalMax} – ${$thresholds.tempCriticalMax} °C`,
				critical: `< ${$thresholds.tempCriticalMin} °C or > ${$thresholds.tempCriticalMax} °C`,
			},
		};
	}
);

/** Humidity metric */
export const humidityMetric: Readable<MetricData | null> = derived(
	[humidityValue, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.humidity.displayMin, cfg.humidity.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.humidityNormalMin, $thresholds.humidityNormalMax,
			$thresholds.humidityWarningMin, $thresholds.humidityWarningMax,
			'range'
		);
		const segments = generateRangeSegments(
			cfg.humidity.displayMin, cfg.humidity.displayMax,
			$thresholds.humidityCriticalMin, $thresholds.humidityNormalMin,
			$thresholds.humidityNormalMax, $thresholds.humidityCriticalMax
		);
		
		return {
			id: 'humidity',
			label: cfg.humidity.label,
			unit: cfg.humidity.unit,
			value: $value.toFixed(0),
			rawValue: $value,
			percent,
			severity,
			scale: cfg.humidity.scaleLabels,
			segments,
			ranges: {
				normal: `${$thresholds.humidityNormalMin} – ${$thresholds.humidityNormalMax} %`,
				warning: `${$thresholds.humidityCriticalMin} – ${$thresholds.humidityNormalMin} % or ${$thresholds.humidityNormalMax} – ${$thresholds.humidityCriticalMax} %`,
				critical: `< ${$thresholds.humidityCriticalMin} % or > ${$thresholds.humidityCriticalMax} %`,
			},
		};
	}
);

/** CO2 metric */
export const co2Metric: Readable<MetricData | null> = derived(
	[co2Value, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.co2.displayMin, cfg.co2.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.co2NormalMin, $thresholds.co2NormalMax,
			$thresholds.co2WarningMin, $thresholds.co2WarningMax,
			'ascending'
		);
		const segments = generateAscendingSegments(
			cfg.co2.displayMin, cfg.co2.displayMax,
			$thresholds.co2NormalMax, $thresholds.co2WarningMax
		);
		
		return {
			id: 'co2',
			label: cfg.co2.label,
			unit: cfg.co2.unit,
			value: $value.toLocaleString(),
			rawValue: $value,
			percent,
			severity,
			scale: cfg.co2.scaleLabels,
			segments,
			ranges: {
				normal: `< ${$thresholds.co2NormalMax} ppm`,
				warning: `${$thresholds.co2NormalMax} – ${$thresholds.co2WarningMax} ppm`,
				critical: `> ${$thresholds.co2WarningMax} ppm`,
			},
		};
	}
);

/** Swarm Risk metric */
export const swarmMetric: Readable<MetricData | null> = derived(
	[swarmRiskValue, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.swarm.displayMin, cfg.swarm.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.swarmRiskNormalMin, $thresholds.swarmRiskNormalMax,
			$thresholds.swarmRiskWarningMin, $thresholds.swarmRiskWarningMax,
			'ascending'
		);
		const segments = generateAscendingSegments(
			cfg.swarm.displayMin, cfg.swarm.displayMax,
			$thresholds.swarmRiskNormalMax, $thresholds.swarmRiskWarningMax
		);
		
		return {
			id: 'swarm',
			label: cfg.swarm.label,
			unit: cfg.swarm.unit,
			value: $value.toString(),
			rawValue: $value,
			percent,
			severity,
			scale: cfg.swarm.scaleLabels,
			segments,
			ranges: {
				normal: `< ${$thresholds.swarmRiskNormalMax}`,
				warning: `${$thresholds.swarmRiskNormalMax} – ${$thresholds.swarmRiskWarningMax}`,
				critical: `> ${$thresholds.swarmRiskWarningMax}`,
			},
		};
	}
);

/** Battery metric */
export const batteryMetric: Readable<MetricData | null> = derived(
	[batteryValue, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.battery.displayMin, cfg.battery.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.batteryNormalMin, $thresholds.batteryNormalMax,
			$thresholds.batteryWarningMin, $thresholds.batteryWarningMax,
			'inverted'
		);
		const segments = generateInvertedSegments(
			cfg.battery.displayMin, cfg.battery.displayMax,
			$thresholds.batteryWarningMin, $thresholds.batteryNormalMin
		);
		
		return {
			id: 'battery',
			label: cfg.battery.label,
			unit: cfg.battery.unit,
			value: $value.toFixed(0),
			rawValue: $value,
			percent,
			severity,
			scale: cfg.battery.scaleLabels,
			segments,
			ranges: {
				normal: `> ${$thresholds.batteryNormalMin} %`,
				warning: `${$thresholds.batteryWarningMin} – ${$thresholds.batteryNormalMin} %`,
				critical: `< ${$thresholds.batteryWarningMin} %`,
			},
		};
	}
);

/** Honey Gain metric */
export const honeyMetric: Readable<MetricData | null> = derived(
	[honeyGainValue, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.honey.displayMin, cfg.honey.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.honeyGainNormalMin, $thresholds.honeyGainNormalMax,
			$thresholds.honeyGainWarningMin, $thresholds.honeyGainWarningMax,
			'inverted'
		);
		const segments = generateInvertedSegments(
			cfg.honey.displayMin, cfg.honey.displayMax,
			$thresholds.honeyGainWarningMin, $thresholds.honeyGainNormalMin
		);
		
		return {
			id: 'honey',
			label: cfg.honey.label,
			unit: cfg.honey.unit,
			value: $value >= 0 ? `+${$value}` : $value.toString(),
			rawValue: $value,
			percent,
			severity,
			scale: cfg.honey.scaleLabels,
			segments,
			ranges: {
				normal: `> ${$thresholds.honeyGainNormalMin} g/day`,
				warning: `${$thresholds.honeyGainWarningMin} – ${$thresholds.honeyGainNormalMin} g/day`,
				critical: `< ${$thresholds.honeyGainWarningMin} g/day`,
			},
		};
	}
);

/** Sound/Activity metric */
export const activityMetric: Readable<MetricData | null> = derived(
	[soundValue, thresholdsStore, recordedAt],
	([$value, $thresholds, $recordedAt]) => {
		if (!$thresholds) return null;
		
		const isDay = $recordedAt.getHours() >= 6 && $recordedAt.getHours() < 20;
		const percent = calculatePercent($value, cfg.activity.displayMin, cfg.activity.displayMax);
		const severity = calculateSeverity(
			$value,
			$thresholds.soundNormalMin, $thresholds.soundNormalMax,
			$thresholds.soundWarningMin, $thresholds.soundWarningMax,
			'range'
		);
		const segments = generateRangeSegments(
			cfg.activity.displayMin, cfg.activity.displayMax,
			$thresholds.soundCriticalMin, $thresholds.soundNormalMin,
			$thresholds.soundNormalMax, $thresholds.soundCriticalMax
		);
		
		return {
			id: 'activity',
			label: cfg.activity.label,
			unit: cfg.activity.unit,
			value: $value.toString(),
			rawValue: $value,
			percent,
			severity,
			scale: [cfg.activity.scaleLabels[0], isDay ? 'Day' : 'Night', cfg.activity.scaleLabels[2]],
			segments,
			ranges: {
				normal: `${$thresholds.soundNormalMin} – ${$thresholds.soundNormalMax} dB`,
				warning: `${$thresholds.soundCriticalMin} – ${$thresholds.soundNormalMin} dB or ${$thresholds.soundNormalMax} – ${$thresholds.soundCriticalMax} dB`,
				critical: `< ${$thresholds.soundCriticalMin} dB or > ${$thresholds.soundCriticalMax} dB`,
			},
		};
	}
);

/** Weight metric */
export const weightMetric: Readable<MetricData | null> = derived(
	[weightValue, thresholdsStore],
	([$value, $thresholds]) => {
		if (!$thresholds) return null;
		
		const percent = calculatePercent($value, cfg.weight.displayMin, cfg.weight.displayMax);
		const segments = generateRangeSegments(
			cfg.weight.displayMin, cfg.weight.displayMax,
			24, 28, 52, 56
		);
		
		return {
			id: 'weight',
			label: cfg.weight.label,
			unit: cfg.weight.unit,
			value: $value.toFixed(1),
			rawValue: $value,
			percent,
			severity: 'safe' as Severity, // Weight severity based on drop rate
			scale: cfg.weight.scaleLabels,
			segments,
			ranges: {
				normal: `28 – 52 kg (typical)`,
				warning: `Daily loss > ${$thresholds.weightWarningDailyLossG} g`,
				critical: `Drop > ${($thresholds.weightCriticalRobberyDropKg * 1000).toFixed(0)} g in <6h`,
			},
		};
	}
);

// ============================================
// UPDATE FUNCTIONS
// ============================================

/**
 * Update all telemetry values at once
 */
export function updateTelemetry(values: Partial<TelemetryValues>): void {
	if (values.temperature !== undefined) temperatureValue.set(values.temperature);
	if (values.humidity !== undefined) humidityValue.set(values.humidity);
	if (values.weightKg !== undefined) weightValue.set(values.weightKg);
	if (values.soundDb !== undefined) soundValue.set(values.soundDb);
	if (values.co2Ppm !== undefined) co2Value.set(values.co2Ppm);
	if (values.dailyHoneyGainG !== undefined) honeyGainValue.set(values.dailyHoneyGainG);
	if (values.swarmRisk !== undefined) swarmRiskValue.set(values.swarmRisk);
	if (values.batteryPercent !== undefined) batteryValue.set(values.batteryPercent);
	if (values.recordedAt !== undefined) recordedAt.set(values.recordedAt);
}

/**
 * Set thresholds
 */
export function setThresholds(thresholds: Thresholds): void {
	thresholdsStore.set(thresholds);
}

/**
 * Get all metric stores as an array (for compatibility)
 */
export const allMetrics: Readable<(MetricData | null)[]> = derived(
	[temperatureMetric, humidityMetric, weightMetric, activityMetric, co2Metric, honeyMetric, swarmMetric, batteryMetric],
	(metrics) => metrics
);

