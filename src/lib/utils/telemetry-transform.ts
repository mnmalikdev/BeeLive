/**
 * Telemetry Transformation Utilities
 * Converts telemetry data and thresholds into dashboard metric format
 */

import type { Telemetry } from '$lib/services/telemetry.service.js';
import type { Thresholds } from '$lib/services/thresholds.service.js';

type Severity = 'safe' | 'warning' | 'critical';
type GaugeSegment = {
	start: number;
	stop: number;
	color?: string;
	label?: string;
};
type Metric = {
	id: string;
	label: string;
	unit: string;
	value: string;
	percent: number;
	severity: Severity;
	scale: [string, string, string];
	segments?: GaugeSegment[];
	ranges?: {
		normal: string;
		warning: string;
		critical: string;
	};
};

/**
 * Calculate severity based on value and threshold ranges
 * Uses normal, warning, and critical ranges from database
 * 
 * IMPORTANT: Thresholds are mutually exclusive and collectively exhaustive.
 * Every value falls into exactly one severity level.
 * 
 * @param value - The value to check
 * @param normalMin - Start of normal range
 * @param normalMax - End of normal range
 * @param warningMin - Start of warning range (low side for normal metrics)
 * @param warningMax - End of warning range (high side for normal metrics)
 * @param criticalMin - Start of critical range (low extreme for normal metrics)
 * @param criticalMax - End of critical range (high extreme for normal metrics)
 * @param metricType - Type of metric: 'normal' (middle is good), 'ascending' (higher is worse), 'inverted' (lower is worse)
 */
function calculateSeverity(
	value: number,
	normalMin: number,
	normalMax: number,
	warningMin: number,
	warningMax: number,
	criticalMin: number,
	criticalMax: number,
	metricType: 'normal' | 'ascending' | 'inverted' = 'normal'
): Severity {
	if (metricType === 'ascending') {
		// Ascending: Normal (low) → Warning (middle) → Critical (high)
		// Contiguous ranges: Normal ends at normalMax, Warning ends at warningMax, Critical is above warningMax
		if (value <= normalMax) {
			return 'safe';
		}
		if (value <= warningMax) {
			return 'warning';
		}
		return 'critical';
	} else if (metricType === 'inverted') {
		// Inverted: Critical (low) → Warning (middle) → Normal (high)
		// Contiguous ranges: Critical up to warningMin, Warning from warningMin to normalMin, Normal above normalMin
		if (value < warningMin) {
			return 'critical';
		}
		if (value < normalMin) {
			return 'warning';
		}
		return 'safe';
	} else {
		// Normal (range-based): Critical (low) → Warning (low) → Normal (middle) → Warning (high) → Critical (high)
		// Contiguous ranges with normal in the middle
		// - Critical: < criticalMin OR > criticalMax (extremes)
		// - Warning: criticalMin to normalMin OR normalMax to criticalMax (sides)
		// - Normal: normalMin to normalMax (middle safe zone)
		
		// Check Critical first (extremes)
		if (value < criticalMin || value > criticalMax) {
			return 'critical';
		}
		// Check Normal (middle safe zone)
		if (value >= normalMin && value <= normalMax) {
			return 'safe';
		}
		// Everything else is Warning (between critical and normal zones)
		return 'warning';
	}
}

/**
 * Calculate percentage for gauge display (0-100)
 * Simple linear mapping from value range to 0-100%
 */
function calculatePercent(value: number, min: number, max: number): number {
	const clamped = Math.max(min, Math.min(max, value));
	return ((clamped - min) / (max - min)) * 100;
}

/**
 * Calculate percentage for simple gauges (3 equal segments)
 * 
 * The dot is placed at the CENTER of the segment for its severity level,
 * ensuring it ALWAYS appears in the correct colored region.
 * 
 * Visual layout (semi-circle gauge, left to right):
 * - Ascending: Normal (green, left 0-33%) → Warning (yellow, top 33-67%) → Critical (red, right 67-100%)
 * - Inverted: Critical (red, left 0-33%) → Warning (yellow, top 33-67%) → Normal (green, right 67-100%)
 */
function calculateSimplePercent(
	value: number,
	thresholds: { normalMin: number; normalMax: number; warningMin: number; warningMax: number },
	type: 'ascending' | 'inverted',
	_displayRange: { min: number; max: number }
): number {
	// Center positions for each visual segment
	const leftCenter = 16.67;   // Center of 0-33.33% (left side)
	const topCenter = 50;       // Center of 33.33-66.67% (top)
	const rightCenter = 83.33;  // Center of 66.67-100% (right side)
	
	if (type === 'ascending') {
		// Ascending: Normal (green, left) → Warning (yellow, top) → Critical (red, right)
		// Thresholds: value <= normalMax = Normal, value <= warningMax = Warning, else Critical
		if (value <= thresholds.normalMax) {
			return leftCenter;  // Normal = green = left
		} else if (value <= thresholds.warningMax) {
			return topCenter;   // Warning = yellow = top
		} else {
			return rightCenter; // Critical = red = right
		}
	} else {
		// Inverted: Critical (red, left) → Warning (yellow, top) → Normal (green, right)
		// Thresholds: value < warningMin = Critical, value < normalMin = Warning, else Normal
		if (value < thresholds.warningMin) {
			return leftCenter;  // Critical = red = left
		} else if (value < thresholds.normalMin) {
			return topCenter;   // Warning = yellow = top
		} else {
			return rightCenter; // Normal = green = right
		}
	}
}

/**
 * Calculate percentage for range-based gauges (5 equal segments)
 * 
 * The dot is placed at the CENTER of the segment for its severity level,
 * ensuring it ALWAYS appears in the correct colored region.
 * 
 * Visual layout (semi-circle gauge, left to right):
 * - Critical low (red, 0-20%) → Warning low (yellow, 20-40%) → Normal (green, 40-60%) 
 *   → Warning high (yellow, 60-80%) → Critical high (red, 80-100%)
 */
function calculateRangeBasedPercent(
	value: number,
	thresholds: { normalMin: number; normalMax: number; criticalMin: number; criticalMax: number },
	_displayRange: { min: number; max: number }
): number {
	// Center positions for each of the 5 segments (20% each)
	const criticalLowCenter = 10;    // Center of 0-20%
	const warningLowCenter = 30;     // Center of 20-40%
	const normalCenter = 50;         // Center of 40-60%
	const warningHighCenter = 70;    // Center of 60-80%
	const criticalHighCenter = 90;   // Center of 80-100%
	
	if (value < thresholds.criticalMin) {
		return criticalLowCenter;    // Critical low = red = left
	} else if (value < thresholds.normalMin) {
		return warningLowCenter;     // Warning low = yellow = left-center
	} else if (value <= thresholds.normalMax) {
		return normalCenter;         // Normal = green = center
	} else if (value <= thresholds.criticalMax) {
		return warningHighCenter;    // Warning high = yellow = right-center
	} else {
		return criticalHighCenter;   // Critical high = red = right
	}
}

/**
 * Generate simple gauge segments (3 equal segments: Normal, Warning, Critical)
 * Divides the gauge into 3 equal portions (33.33% each)
 * Used for metrics where severity increases in one direction:
 * - Ascending: Normal (low) → Warning (middle) → Critical (high) - e.g., CO2, Swarm Risk
 * - Inverted: Critical (low) → Warning (middle) → Normal (high) - e.g., Battery, Honey Gain
 */
function generateSimpleSegments(
	valueRange: { min: number; max: number },
	thresholds: { normalMin: number; normalMax: number; warningMin: number; warningMax: number; criticalMin: number; criticalMax: number },
	type: 'ascending' | 'inverted'
): GaugeSegment[] {
	// Divide gauge into 3 equal segments (33.33% each)
	const segmentSize = 100 / 3;
	
	if (type === 'inverted') {
		// Inverted: Critical (low) → Warning (middle) → Normal (high)
		return [
			{ 
				start: 0, 
				stop: segmentSize, 
				color: '#ef4444', 
				label: 'Critical' 
			},
			{ 
				start: segmentSize, 
				stop: segmentSize * 2, 
				color: '#eab308', 
				label: 'Warning' 
			},
			{ 
				start: segmentSize * 2, 
				stop: 100, 
				color: '#22c55e', 
				label: 'Normal' 
			},
		];
	} else {
		// Ascending: Normal (low) → Warning (middle) → Critical (high)
		return [
			{ 
				start: 0, 
				stop: segmentSize, 
				color: '#22c55e', 
				label: 'Normal' 
			},
			{ 
				start: segmentSize, 
				stop: segmentSize * 2, 
				color: '#eab308', 
				label: 'Warning' 
			},
			{ 
				start: segmentSize * 2, 
				stop: 100, 
				color: '#ef4444', 
				label: 'Critical' 
			},
		];
	}
}

/**
 * Generate range-based gauge segments (5 equal segments: Critical low → Warning low → Normal → Warning high → Critical high)
 * Divides the gauge into 5 equal portions (20% each)
 * Used for metrics where the ideal value is in the middle, with critical zones at extremes:
 * - Critical low: 0-20%
 * - Warning low: 20-40%
 * - Normal: 40-60%
 * - Warning high: 60-80%
 * - Critical high: 80-100%
 * Examples: Temperature, Humidity, Sound, Weight
 */
function generateRangeBasedSegments(
	valueRange: { min: number; max: number },
	thresholds: { normalMin: number; normalMax: number; warningMin: number; warningMax: number; criticalMin: number; criticalMax: number }
): GaugeSegment[] {
	// Divide gauge into 5 equal segments (20% each)
	const segmentSize = 100 / 5;
	
	return [
		{
			start: 0,
			stop: segmentSize,
			color: '#ef4444',
			label: 'Critical'
		},
		{
			start: segmentSize,
			stop: segmentSize * 2,
			color: '#eab308',
			label: 'Warning'
		},
		{
			start: segmentSize * 2,
			stop: segmentSize * 3,
			color: '#22c55e',
			label: 'Normal'
		},
		{
			start: segmentSize * 3,
			stop: segmentSize * 4,
			color: '#eab308',
			label: 'Warning'
		},
		{
			start: segmentSize * 4,
			stop: 100,
			color: '#ef4444',
			label: 'Critical'
		},
	];
}

/**
 * Transform telemetry data into dashboard metrics
 */
export function transformTelemetryToMetrics(
	telemetry: Telemetry,
	thresholds: Thresholds
): Metric[] {
	const isDay = new Date(telemetry.recordedAt).getHours() >= 6 && new Date(telemetry.recordedAt).getHours() < 20;

	// Temperature - Range-based gauge (5 equal segments)
	const tempPercent = calculateRangeBasedPercent(
		telemetry.temperature,
		{
			normalMin: thresholds.tempNormalMin,
			normalMax: thresholds.tempNormalMax,
			criticalMin: thresholds.tempCriticalMin,
			criticalMax: thresholds.tempCriticalMax,
		},
		{ min: 18, max: 40 }
	);
	const tempSeverity = calculateSeverity(
		telemetry.temperature,
		thresholds.tempNormalMin,
		thresholds.tempNormalMax,
		thresholds.tempWarningMin,
		thresholds.tempWarningMax,
		thresholds.tempCriticalMin,
		thresholds.tempCriticalMax,
		'normal' // Middle values are ideal
	);

	// Humidity - Range-based gauge (5 equal segments)
	const humidityPercent = calculateRangeBasedPercent(
		telemetry.humidity,
		{
			normalMin: thresholds.humidityNormalMin,
			normalMax: thresholds.humidityNormalMax,
			criticalMin: thresholds.humidityCriticalMin,
			criticalMax: thresholds.humidityCriticalMax,
		},
		{ min: 0, max: 100 }
	);
	const humiditySeverity = calculateSeverity(
		telemetry.humidity,
		thresholds.humidityNormalMin,
		thresholds.humidityNormalMax,
		thresholds.humidityWarningMin,
		thresholds.humidityWarningMax,
		thresholds.humidityCriticalMin,
		thresholds.humidityCriticalMax,
		'normal' // Middle values are ideal
	);

	// Weight - Range-based gauge (5 equal segments)
	// Using fixed thresholds for weight display (actual severity is based on drop rate)
	const weightPercent = calculateRangeBasedPercent(
		telemetry.weightKg,
		{
			normalMin: 28,
			normalMax: 52,
			criticalMin: 24,
			criticalMax: 56,
		},
		{ min: 20, max: 60 }
	);
	const weightSeverity: Severity = 'safe'; // Weight severity based on drop rate, not absolute value

	// Sound - Range-based gauge (5 equal segments)
	const soundPercent = calculateRangeBasedPercent(
		telemetry.soundDb,
		{
			normalMin: thresholds.soundNormalMin,
			normalMax: thresholds.soundNormalMax,
			criticalMin: thresholds.soundCriticalMin,
			criticalMax: thresholds.soundCriticalMax,
		},
		{ min: 0, max: 100 }
	);
	const soundSeverity = calculateSeverity(
		telemetry.soundDb,
		thresholds.soundNormalMin,
		thresholds.soundNormalMax,
		thresholds.soundWarningMin,
		thresholds.soundWarningMax,
		thresholds.soundCriticalMin,
		thresholds.soundCriticalMax,
		'normal' // Middle values are ideal
	);

	// CO2 - Simple ascending gauge (3 equal segments: Normal → Warning → Critical)
	const co2Percent = calculateSimplePercent(
		telemetry.co2Ppm,
		{
			normalMin: thresholds.co2NormalMin,
			normalMax: thresholds.co2NormalMax,
			warningMin: thresholds.co2WarningMin,
			warningMax: thresholds.co2WarningMax,
		},
		'ascending',
		{ min: 400, max: 4000 }
	);
	const co2Severity = calculateSeverity(
		telemetry.co2Ppm,
		thresholds.co2NormalMin,
		thresholds.co2NormalMax,
		thresholds.co2WarningMin,
		thresholds.co2WarningMax,
		thresholds.co2CriticalMin,
		thresholds.co2CriticalMax,
		'ascending' // Higher is worse
	);

	// Honey Gain - Simple inverted gauge (3 equal segments: Critical → Warning → Normal)
	const honeyGain = telemetry.dailyHoneyGainG ?? 0;
	const honeyPercent = calculateSimplePercent(
		honeyGain,
		{
			normalMin: thresholds.honeyGainNormalMin,
			normalMax: thresholds.honeyGainNormalMax,
			warningMin: thresholds.honeyGainWarningMin,
			warningMax: thresholds.honeyGainWarningMax,
		},
		'inverted',
		{ min: -500, max: 800 }
	);
	const honeySeverity = calculateSeverity(
		honeyGain,
		thresholds.honeyGainNormalMin,
		thresholds.honeyGainNormalMax,
		thresholds.honeyGainWarningMin,
		thresholds.honeyGainWarningMax,
		thresholds.honeyGainCriticalMin,
		thresholds.honeyGainCriticalMax,
		'inverted' // Lower is worse
	);

	// Swarm Risk - Simple ascending gauge (3 equal segments: Normal → Warning → Critical)
	const swarmPercent = calculateSimplePercent(
		telemetry.swarmRisk,
		{
			normalMin: thresholds.swarmRiskNormalMin,
			normalMax: thresholds.swarmRiskNormalMax,
			warningMin: thresholds.swarmRiskWarningMin,
			warningMax: thresholds.swarmRiskWarningMax,
		},
		'ascending',
		{ min: 0, max: 100 }
	);
	const swarmSeverity = calculateSeverity(
		telemetry.swarmRisk,
		thresholds.swarmRiskNormalMin,
		thresholds.swarmRiskNormalMax,
		thresholds.swarmRiskWarningMin,
		thresholds.swarmRiskWarningMax,
		thresholds.swarmRiskCriticalMin,
		thresholds.swarmRiskCriticalMax,
		'ascending' // Higher is worse
	);

	// Battery - Simple inverted gauge (3 equal segments: Critical → Warning → Normal)
	const batteryPercent = calculateSimplePercent(
		telemetry.batteryPercent,
		{
			normalMin: thresholds.batteryNormalMin,
			normalMax: thresholds.batteryNormalMax,
			warningMin: thresholds.batteryWarningMin,
			warningMax: thresholds.batteryWarningMax,
		},
		'inverted',
		{ min: 0, max: 100 }
	);
	// Battery severity: higher is better (inverted logic)
	const batterySeverity = calculateSeverity(
		telemetry.batteryPercent,
		thresholds.batteryNormalMin,
		thresholds.batteryNormalMax,
		thresholds.batteryWarningMin,
		thresholds.batteryWarningMax,
		thresholds.batteryCriticalMin,
		thresholds.batteryCriticalMax,
		'inverted' // Lower is worse
	);

	// Generate all segments before return statement
	// Range-based segments (5 segments: Critical low → Warning low → Normal → Warning high → Critical high)
	const tempSegments = generateRangeBasedSegments(
		{ min: 18, max: 40 },
		{
			normalMin: thresholds.tempNormalMin,
			normalMax: thresholds.tempNormalMax,
			warningMin: thresholds.tempWarningMin,
			warningMax: thresholds.tempWarningMax,
			criticalMin: thresholds.tempCriticalMin,
			criticalMax: thresholds.tempCriticalMax,
		}
	);

	const humiditySegments = generateRangeBasedSegments(
		{ min: 0, max: 100 },
		{
			normalMin: thresholds.humidityNormalMin,
			normalMax: thresholds.humidityNormalMax,
			warningMin: thresholds.humidityWarningMin,
			warningMax: thresholds.humidityWarningMax,
			criticalMin: thresholds.humidityCriticalMin,
			criticalMax: thresholds.humidityCriticalMax,
		}
	);

	const soundSegments = generateRangeBasedSegments(
		{ min: 0, max: 100 },
		{
			normalMin: thresholds.soundNormalMin,
			normalMax: thresholds.soundNormalMax,
			warningMin: thresholds.soundWarningMin,
			warningMax: thresholds.soundWarningMax,
			criticalMin: thresholds.soundCriticalMin,
			criticalMax: thresholds.soundCriticalMax,
		}
	);

	// Simple segments (3 segments: Normal → Warning → Critical)
	const co2Segments = generateSimpleSegments(
		{ min: 400, max: 4000 },
		{
			normalMin: thresholds.co2NormalMin,
			normalMax: thresholds.co2NormalMax,
			warningMin: thresholds.co2WarningMin,
			warningMax: thresholds.co2WarningMax,
			criticalMin: thresholds.co2CriticalMin,
			criticalMax: thresholds.co2CriticalMax,
		},
		'ascending' // Higher is worse
	);

	const swarmSegments = generateSimpleSegments(
		{ min: 0, max: 100 },
		{
			normalMin: thresholds.swarmRiskNormalMin,
			normalMax: thresholds.swarmRiskNormalMax,
			warningMin: thresholds.swarmRiskWarningMin,
			warningMax: thresholds.swarmRiskWarningMax,
			criticalMin: thresholds.swarmRiskCriticalMin,
			criticalMax: thresholds.swarmRiskCriticalMax,
		},
		'ascending' // Higher is worse
	);

	const honeySegments = generateSimpleSegments(
		{ min: -500, max: 800 },
		{
			normalMin: thresholds.honeyGainNormalMin,
			normalMax: thresholds.honeyGainNormalMax,
			warningMin: thresholds.honeyGainWarningMin,
			warningMax: thresholds.honeyGainWarningMax,
			criticalMin: thresholds.honeyGainCriticalMin,
			criticalMax: thresholds.honeyGainCriticalMax,
		},
		'inverted' // Lower is worse
	);

	const batterySegments = generateSimpleSegments(
		{ min: 0, max: 100 },
		{
			normalMin: thresholds.batteryNormalMin,
			normalMax: thresholds.batteryNormalMax,
			warningMin: thresholds.batteryWarningMin,
			warningMax: thresholds.batteryWarningMax,
			criticalMin: thresholds.batteryCriticalMin,
			criticalMax: thresholds.batteryCriticalMax,
		},
		'inverted' // Lower is worse
	);

	return [
		{
			id: 'temp',
			label: 'Hive Temperature',
			unit: '°C',
			value: telemetry.temperature.toFixed(1),
			percent: tempPercent,
			severity: tempSeverity,
			scale: ['18°', 'TCM', '40°'],
			segments: tempSegments,
			ranges: {
				normal: `${thresholds.tempNormalMin} – ${thresholds.tempNormalMax} °C`,
				warning: `${thresholds.tempCriticalMin} – ${thresholds.tempNormalMin} °C or ${thresholds.tempNormalMax} – ${thresholds.tempCriticalMax} °C`,
				critical: `< ${thresholds.tempCriticalMin} °C or > ${thresholds.tempCriticalMax} °C`,
			},
		},
		{
			id: 'humidity',
			label: 'Humidity',
			unit: '%',
			value: telemetry.humidity.toFixed(0),
			percent: humidityPercent,
			severity: humiditySeverity,
			scale: ['0%', 'Hive', '100%'],
			segments: humiditySegments,
			ranges: {
				normal: `${thresholds.humidityNormalMin} – ${thresholds.humidityNormalMax} %`,
				warning: `${thresholds.humidityCriticalMin} – ${thresholds.humidityNormalMin} % or ${thresholds.humidityNormalMax} – ${thresholds.humidityCriticalMax} %`,
				critical: `< ${thresholds.humidityCriticalMin} % or > ${thresholds.humidityCriticalMax} %`,
			},
		},
		{
			id: 'weight',
			label: 'Weight (kg)',
			unit: 'kg',
			value: telemetry.weightKg.toFixed(2),
			percent: weightPercent,
			severity: weightSeverity,
			scale: ['20 kg', 'Total', '60 kg'],
			// Weight gauge shows visual segments for 20-60 kg range
			// Severity is still based on drop rate (handled by weightSeverity)
			// Using range-based segments with visible critical regions at extremes
			segments: generateRangeBasedSegments(
				{ min: 20, max: 60 },
				{
					normalMin: 28,
					normalMax: 52,
					warningMin: 24,
					warningMax: 56,
					criticalMin: 24,  // Critical low boundary - critical region is BELOW this (20-24 kg)
					criticalMax: 56,  // Critical high boundary - critical region is ABOVE this (56-60 kg)
				}
			),
			ranges: {
				normal: `20 – 60 kg (depends on season)`,
				warning: `Daily loss > ${thresholds.weightWarningDailyLossG} g/day`,
				critical: `Drop > ${(thresholds.weightCriticalRobberyDropKg * 1000).toFixed(0)} g in <6h or < ${thresholds.weightNormalDailyGainMinG} g/day`,
			},
		},
		{
			id: 'activity',
			label: 'Bee Activity',
			unit: 'dB',
			value: telemetry.soundDb.toString(),
			percent: soundPercent,
			severity: soundSeverity,
			scale: ['0 dB', isDay ? 'Day' : 'Night', '100 dB'],
			segments: soundSegments,
			ranges: {
				normal: `${thresholds.soundNormalMin} – ${thresholds.soundNormalMax} dB`,
				warning: `${thresholds.soundCriticalMin} – ${thresholds.soundNormalMin} dB or ${thresholds.soundNormalMax} – ${thresholds.soundCriticalMax} dB`,
				critical: `< ${thresholds.soundCriticalMin} dB or > ${thresholds.soundCriticalMax} dB`,
			},
		},
		{
			id: 'co2',
			label: 'CO₂',
			unit: 'ppm',
			value: telemetry.co2Ppm.toLocaleString(),
			percent: co2Percent,
			severity: co2Severity,
			scale: ['400', 'Vent', '4 000'],
			segments: co2Segments,
			ranges: {
				normal: `${thresholds.co2NormalMin} – ${thresholds.co2NormalMax} ppm`,
				warning: `${thresholds.co2NormalMax} – ${thresholds.co2WarningMax} ppm`,
				critical: `> ${thresholds.co2WarningMax} ppm`,
			},
		},
		{
			id: 'honey',
			label: 'Daily Honey Gain',
			unit: 'g',
			value: honeyGain >= 0 ? `+${honeyGain}` : honeyGain.toString(),
			percent: honeyPercent,
			severity: honeySeverity,
			scale: ['-500 g', 'Δ 24h', '800 g'],
			segments: honeySegments,
			ranges: {
				normal: `${thresholds.honeyGainNormalMin} – ${thresholds.honeyGainNormalMax} g/day`,
				warning: `${thresholds.honeyGainWarningMin} – ${thresholds.honeyGainNormalMin} g/day`,
				critical: `< ${thresholds.honeyGainWarningMin} g/day`,
			},
		},
		{
			id: 'swarm',
			label: 'Swarm Risk Score',
			unit: '',
			value: telemetry.swarmRisk.toString(),
			percent: swarmPercent,
			severity: swarmSeverity,
			scale: ['0', 'Score', '100'],
			segments: swarmSegments,
			ranges: {
				normal: `${thresholds.swarmRiskNormalMin} – ${thresholds.swarmRiskNormalMax}`,
				warning: `${thresholds.swarmRiskNormalMax} – ${thresholds.swarmRiskWarningMax}`,
				critical: `> ${thresholds.swarmRiskWarningMax}`,
			},
		},
		{
			id: 'battery',
			label: 'Battery %',
			unit: '%',
			value: telemetry.batteryPercent.toFixed(1),
			percent: batteryPercent,
			severity: batterySeverity,
			scale: ['0%', 'Charge', '100%'],
			segments: batterySegments,
			ranges: {
				normal: `${thresholds.batteryNormalMin} – ${thresholds.batteryNormalMax} %`,
				warning: `${thresholds.batteryWarningMin} – ${thresholds.batteryNormalMin} %`,
				critical: `< ${thresholds.batteryWarningMin} %`,
			},
		},
	];
}

