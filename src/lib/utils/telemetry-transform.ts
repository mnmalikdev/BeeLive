/**
 * Telemetry Transformation Utilities
 * Converts telemetry data and thresholds into dashboard metric format
 * 
 * Uses centralized metrics configuration for consistency.
 */

import type { Telemetry } from '$lib/services/telemetry.service.js';
import type { Thresholds } from '$lib/services/thresholds.service.js';
import { METRICS_CONFIG, SEVERITY_COLORS } from '$lib/config/metrics.config.js';

type Severity = 'safe' | 'warning' | 'critical';
type GaugeSegment = {
	start: number;
	stop: number;
	color: string;
	label: string;
};
type Metric = {
	id: string;
	label: string;
	unit: string;
	value: string;
	percent: number;
	severity: Severity;
	scale: [string, string, string];
	segments: GaugeSegment[];
	ranges?: {
		normal: string;
		warning: string;
		critical: string;
	};
};

/**
 * Calculate severity based on value and threshold ranges
 */
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
		// Range-based
		if (value >= normalMin && value <= normalMax) return 'safe';
		if (value >= warningMin && value <= warningMax) return 'warning';
		return 'critical';
	}
}

/**
 * Calculate percentage for gauge display (linear mapping)
 */
function calculatePercent(value: number, min: number, max: number): number {
	const clamped = Math.max(min, Math.min(max, value));
	return ((clamped - min) / (max - min)) * 100;
}

/**
 * Convert a value to its percent position on the gauge
 */
function valueToPercent(value: number, displayMin: number, displayMax: number): number {
	return ((value - displayMin) / (displayMax - displayMin)) * 100;
}

/**
 * Generate segments for ASCENDING metrics
 */
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

/**
 * Generate segments for INVERTED metrics
 */
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

/**
 * Generate segments for RANGE-BASED metrics
 */
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

/**
 * Transform telemetry data into dashboard metrics
 */
export function transformTelemetryToMetrics(
	telemetry: Telemetry,
	thresholds: Thresholds
): Metric[] {
	const isDay = new Date(telemetry.recordedAt).getHours() >= 6 && 
	              new Date(telemetry.recordedAt).getHours() < 20;

	const cfg = METRICS_CONFIG;

	// ============================================
	// TEMPERATURE
	// ============================================
	const tempPercent = calculatePercent(telemetry.temperature, cfg.temp.displayMin, cfg.temp.displayMax);
	const tempSeverity = calculateSeverity(
		telemetry.temperature,
		thresholds.tempNormalMin, thresholds.tempNormalMax,
		thresholds.tempWarningMin, thresholds.tempWarningMax,
		'range'
	);
	const tempSegments = generateRangeSegments(
		cfg.temp.displayMin, cfg.temp.displayMax,
		thresholds.tempCriticalMin, thresholds.tempNormalMin,
		thresholds.tempNormalMax, thresholds.tempCriticalMax
	);

	// ============================================
	// HUMIDITY
	// ============================================
	const humidityPercent = calculatePercent(telemetry.humidity, cfg.humidity.displayMin, cfg.humidity.displayMax);
	const humiditySeverity = calculateSeverity(
		telemetry.humidity,
		thresholds.humidityNormalMin, thresholds.humidityNormalMax,
		thresholds.humidityWarningMin, thresholds.humidityWarningMax,
		'range'
	);
	const humiditySegments = generateRangeSegments(
		cfg.humidity.displayMin, cfg.humidity.displayMax,
		thresholds.humidityCriticalMin, thresholds.humidityNormalMin,
		thresholds.humidityNormalMax, thresholds.humidityCriticalMax
	);

	// ============================================
	// WEIGHT
	// ============================================
	const weightPercent = calculatePercent(telemetry.weightKg, cfg.weight.displayMin, cfg.weight.displayMax);
	const weightSeverity: Severity = 'safe'; // Weight severity based on drop rate
	const weightSegments = generateRangeSegments(
		cfg.weight.displayMin, cfg.weight.displayMax,
		24, 28, 52, 56
	);

	// ============================================
	// SOUND/ACTIVITY
	// ============================================
	const soundPercent = calculatePercent(telemetry.soundDb, cfg.activity.displayMin, cfg.activity.displayMax);
	const soundSeverity = calculateSeverity(
		telemetry.soundDb,
		thresholds.soundNormalMin, thresholds.soundNormalMax,
		thresholds.soundWarningMin, thresholds.soundWarningMax,
		'range'
	);
	const soundSegments = generateRangeSegments(
		cfg.activity.displayMin, cfg.activity.displayMax,
		thresholds.soundCriticalMin, thresholds.soundNormalMin,
		thresholds.soundNormalMax, thresholds.soundCriticalMax
	);

	// ============================================
	// CO2
	// ============================================
	const co2Percent = calculatePercent(telemetry.co2Ppm, cfg.co2.displayMin, cfg.co2.displayMax);
	const co2Severity = calculateSeverity(
		telemetry.co2Ppm,
		thresholds.co2NormalMin, thresholds.co2NormalMax,
		thresholds.co2WarningMin, thresholds.co2WarningMax,
		'ascending'
	);
	const co2Segments = generateAscendingSegments(
		cfg.co2.displayMin, cfg.co2.displayMax,
		thresholds.co2NormalMax, thresholds.co2WarningMax
	);

	// ============================================
	// HONEY GAIN
	// ============================================
	const honeyGain = telemetry.dailyHoneyGainG ?? 0;
	const honeyPercent = calculatePercent(honeyGain, cfg.honey.displayMin, cfg.honey.displayMax);
	const honeySeverity = calculateSeverity(
		honeyGain,
		thresholds.honeyGainNormalMin, thresholds.honeyGainNormalMax,
		thresholds.honeyGainWarningMin, thresholds.honeyGainWarningMax,
		'inverted'
	);
	const honeySegments = generateInvertedSegments(
		cfg.honey.displayMin, cfg.honey.displayMax,
		thresholds.honeyGainWarningMin, thresholds.honeyGainNormalMin
	);

	// ============================================
	// SWARM RISK
	// ============================================
	const swarmPercent = calculatePercent(telemetry.swarmRisk, cfg.swarm.displayMin, cfg.swarm.displayMax);
	const swarmSeverity = calculateSeverity(
		telemetry.swarmRisk,
		thresholds.swarmRiskNormalMin, thresholds.swarmRiskNormalMax,
		thresholds.swarmRiskWarningMin, thresholds.swarmRiskWarningMax,
		'ascending'
	);
	const swarmSegments = generateAscendingSegments(
		cfg.swarm.displayMin, cfg.swarm.displayMax,
		thresholds.swarmRiskNormalMax, thresholds.swarmRiskWarningMax
	);

	// ============================================
	// BATTERY
	// ============================================
	const batteryPercent = calculatePercent(telemetry.batteryPercent, cfg.battery.displayMin, cfg.battery.displayMax);
	const batterySeverity = calculateSeverity(
		telemetry.batteryPercent,
		thresholds.batteryNormalMin, thresholds.batteryNormalMax,
		thresholds.batteryWarningMin, thresholds.batteryWarningMax,
		'inverted'
	);
	const batterySegments = generateInvertedSegments(
		cfg.battery.displayMin, cfg.battery.displayMax,
		thresholds.batteryWarningMin, thresholds.batteryNormalMin
	);

	// ============================================
	// BUILD METRICS ARRAY
	// ============================================
	return [
		{
			id: 'temp',
			label: cfg.temp.label,
			unit: cfg.temp.unit,
			value: telemetry.temperature.toFixed(1),
			percent: tempPercent,
			severity: tempSeverity,
			scale: cfg.temp.scaleLabels,
			segments: tempSegments,
			ranges: {
				normal: `${thresholds.tempNormalMin} – ${thresholds.tempNormalMax} °C`,
				warning: `${thresholds.tempCriticalMin} – ${thresholds.tempNormalMin} °C or ${thresholds.tempNormalMax} – ${thresholds.tempCriticalMax} °C`,
				critical: `< ${thresholds.tempCriticalMin} °C or > ${thresholds.tempCriticalMax} °C`,
			},
		},
		{
			id: 'humidity',
			label: cfg.humidity.label,
			unit: cfg.humidity.unit,
			value: telemetry.humidity.toFixed(0),
			percent: humidityPercent,
			severity: humiditySeverity,
			scale: cfg.humidity.scaleLabels,
			segments: humiditySegments,
			ranges: {
				normal: `${thresholds.humidityNormalMin} – ${thresholds.humidityNormalMax} %`,
				warning: `${thresholds.humidityCriticalMin} – ${thresholds.humidityNormalMin} % or ${thresholds.humidityNormalMax} – ${thresholds.humidityCriticalMax} %`,
				critical: `< ${thresholds.humidityCriticalMin} % or > ${thresholds.humidityCriticalMax} %`,
			},
		},
		{
			id: 'weight',
			label: cfg.weight.label,
			unit: cfg.weight.unit,
			value: telemetry.weightKg.toFixed(1),
			percent: weightPercent,
			severity: weightSeverity,
			scale: cfg.weight.scaleLabels,
			segments: weightSegments,
			ranges: {
				normal: `28 – 52 kg (typical)`,
				warning: `Daily loss > ${thresholds.weightWarningDailyLossG} g`,
				critical: `Drop > ${(thresholds.weightCriticalRobberyDropKg * 1000).toFixed(0)} g in <6h`,
			},
		},
		{
			id: 'activity',
			label: cfg.activity.label,
			unit: cfg.activity.unit,
			value: telemetry.soundDb.toString(),
			percent: soundPercent,
			severity: soundSeverity,
			scale: [cfg.activity.scaleLabels[0], isDay ? 'Day' : 'Night', cfg.activity.scaleLabels[2]],
			segments: soundSegments,
			ranges: {
				normal: `${thresholds.soundNormalMin} – ${thresholds.soundNormalMax} dB`,
				warning: `${thresholds.soundCriticalMin} – ${thresholds.soundNormalMin} dB or ${thresholds.soundNormalMax} – ${thresholds.soundCriticalMax} dB`,
				critical: `< ${thresholds.soundCriticalMin} dB or > ${thresholds.soundCriticalMax} dB`,
			},
		},
		{
			id: 'co2',
			label: cfg.co2.label,
			unit: cfg.co2.unit,
			value: telemetry.co2Ppm.toLocaleString(),
			percent: co2Percent,
			severity: co2Severity,
			scale: cfg.co2.scaleLabels,
			segments: co2Segments,
			ranges: {
				normal: `< ${thresholds.co2NormalMax} ppm`,
				warning: `${thresholds.co2NormalMax} – ${thresholds.co2WarningMax} ppm`,
				critical: `> ${thresholds.co2WarningMax} ppm`,
			},
		},
		{
			id: 'honey',
			label: cfg.honey.label,
			unit: cfg.honey.unit,
			value: honeyGain >= 0 ? `+${honeyGain}` : honeyGain.toString(),
			percent: honeyPercent,
			severity: honeySeverity,
			scale: cfg.honey.scaleLabels,
			segments: honeySegments,
			ranges: {
				normal: `> ${thresholds.honeyGainNormalMin} g/day`,
				warning: `${thresholds.honeyGainWarningMin} – ${thresholds.honeyGainNormalMin} g/day`,
				critical: `< ${thresholds.honeyGainWarningMin} g/day`,
			},
		},
		{
			id: 'swarm',
			label: cfg.swarm.label,
			unit: cfg.swarm.unit,
			value: telemetry.swarmRisk.toString(),
			percent: swarmPercent,
			severity: swarmSeverity,
			scale: cfg.swarm.scaleLabels,
			segments: swarmSegments,
			ranges: {
				normal: `< ${thresholds.swarmRiskNormalMax}`,
				warning: `${thresholds.swarmRiskNormalMax} – ${thresholds.swarmRiskWarningMax}`,
				critical: `> ${thresholds.swarmRiskWarningMax}`,
			},
		},
		{
			id: 'battery',
			label: cfg.battery.label,
			unit: cfg.battery.unit,
			value: telemetry.batteryPercent.toFixed(0),
			percent: batteryPercent,
			severity: batterySeverity,
			scale: cfg.battery.scaleLabels,
			segments: batterySegments,
			ranges: {
				normal: `> ${thresholds.batteryNormalMin} %`,
				warning: `${thresholds.batteryWarningMin} – ${thresholds.batteryNormalMin} %`,
				critical: `< ${thresholds.batteryWarningMin} %`,
			},
		},
	];
}
