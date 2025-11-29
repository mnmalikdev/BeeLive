/**
 * Centralized Metrics Configuration
 * 
 * This file defines all metric types, their behaviors, display ranges,
 * and threshold auto-adjustment rules in one place.
 * 
 * Used by:
 * - telemetry-transform.ts (segment generation, severity calculation)
 * - metric-threshold.svelte (configuration UI auto-adjustment)
 * - gauge-card.svelte (display)
 */

// ============================================
// TYPES
// ============================================

export type MetricType = 'ascending' | 'inverted' | 'range';

export interface MetricConfig {
	id: string;
	label: string;
	unit: string;
	
	// Metric behavior type
	type: MetricType;
	
	// Display range for the gauge
	displayMin: number;
	displayMax: number;
	
	// Scale labels [left, center, right]
	scaleLabels: [string, string, string];
	
	// Auto-adjustment rules for configuration UI
	autoAdjust: {
		// For ascending/inverted: span of warning zone
		warningSpan: number;
		// For range-based: extension from normal on each side
		warningExtension?: number;
	};
	
	// Whether user can manually override warning/critical thresholds
	allowManualThresholds: boolean;
}

// ============================================
// COLORS
// ============================================

export const SEVERITY_COLORS = {
	normal: '#22c55e',   // Green
	warning: '#eab308',  // Yellow  
	critical: '#ef4444', // Red
} as const;

// ============================================
// METRIC CONFIGURATIONS
// ============================================

export const METRICS_CONFIG: Record<string, MetricConfig> = {
	// Temperature - Range-based (middle is best)
	temp: {
		id: 'temp',
		label: 'Hive Temperature',
		unit: '°C',
		type: 'range',
		displayMin: 15,
		displayMax: 45,
		scaleLabels: ['15°', 'TCM', '45°'],
		autoAdjust: {
			warningSpan: 0,
			warningExtension: 5, // 5°C extension on each side
		},
		allowManualThresholds: false,
	},
	
	// Humidity - Range-based (middle is best)
	humidity: {
		id: 'humidity',
		label: 'Humidity',
		unit: '%',
		type: 'range',
		displayMin: 0,
		displayMax: 100,
		scaleLabels: ['0%', 'Hive', '100%'],
		autoAdjust: {
			warningSpan: 0,
			warningExtension: 10, // 10% extension on each side
		},
		allowManualThresholds: false,
	},
	
	// Sound/Activity - Range-based (middle is best)
	activity: {
		id: 'activity',
		label: 'Bee Activity',
		unit: 'dB',
		type: 'range',
		displayMin: 0,
		displayMax: 100,
		scaleLabels: ['0 dB', 'Activity', '100 dB'],
		autoAdjust: {
			warningSpan: 0,
			warningExtension: 10, // 10 dB extension on each side
		},
		allowManualThresholds: false,
	},
	
	// CO2 - Ascending (higher is worse)
	co2: {
		id: 'co2',
		label: 'CO₂',
		unit: 'ppm',
		type: 'ascending',
		displayMin: 400,
		displayMax: 4000,
		scaleLabels: ['400', 'Vent', '4000'],
		autoAdjust: {
			warningSpan: 500, // 500 ppm warning zone
		},
		allowManualThresholds: false,
	},
	
	// Swarm Risk - Ascending (higher is worse)
	swarm: {
		id: 'swarm',
		label: 'Swarm Risk',
		unit: '',
		type: 'ascending',
		displayMin: 0,
		displayMax: 100,
		scaleLabels: ['0', 'Score', '100'],
		autoAdjust: {
			warningSpan: 10, // 10-point warning zone
		},
		allowManualThresholds: false,
	},
	
	// Battery - Inverted (lower is worse)
	battery: {
		id: 'battery',
		label: 'Battery',
		unit: '%',
		type: 'inverted',
		displayMin: 0,
		displayMax: 100,
		scaleLabels: ['0%', 'Charge', '100%'],
		autoAdjust: {
			warningSpan: 40, // 40% warning zone
		},
		allowManualThresholds: false,
	},
	
	// Honey Gain - Inverted (lower/negative is worse)
	honey: {
		id: 'honey',
		label: 'Daily Honey Gain',
		unit: 'g',
		type: 'inverted',
		displayMin: -500,
		displayMax: 1000,
		scaleLabels: ['-500g', 'Δ 24h', '+1000g'],
		autoAdjust: {
			warningSpan: 250, // 250g warning zone
		},
		allowManualThresholds: false,
	},
	
	// Weight - Special case (visual range-based, severity based on drop rate)
	weight: {
		id: 'weight',
		label: 'Weight',
		unit: 'kg',
		type: 'range',
		displayMin: 20,
		displayMax: 60,
		scaleLabels: ['20 kg', 'Total', '60 kg'],
		autoAdjust: {
			warningSpan: 0,
			warningExtension: 4, // 4 kg extension
		},
		allowManualThresholds: true, // Weight has special threshold handling
	},
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get metric configuration by ID
 */
export function getMetricConfig(metricId: string): MetricConfig | undefined {
	return METRICS_CONFIG[metricId];
}

/**
 * Get all metric IDs
 */
export function getAllMetricIds(): string[] {
	return Object.keys(METRICS_CONFIG);
}

/**
 * Check if metric type is ascending (higher = worse)
 */
export function isAscendingMetric(metricId: string): boolean {
	return METRICS_CONFIG[metricId]?.type === 'ascending';
}

/**
 * Check if metric type is inverted (lower = worse)
 */
export function isInvertedMetric(metricId: string): boolean {
	return METRICS_CONFIG[metricId]?.type === 'inverted';
}

/**
 * Check if metric type is range-based (middle = best)
 */
export function isRangeMetric(metricId: string): boolean {
	return METRICS_CONFIG[metricId]?.type === 'range';
}

/**
 * Auto-adjust warning thresholds for ascending metrics
 * Returns: { warningMin, warningMax, criticalMin, criticalMax }
 */
export function autoAdjustAscendingThresholds(
	metricId: string,
	normalMax: number,
	displayMax: number
): { warningMin: number; warningMax: number; criticalMin: number; criticalMax: number } {
	const config = METRICS_CONFIG[metricId];
	if (!config || config.type !== 'ascending') {
		throw new Error(`Invalid metric ID or type for ascending adjustment: ${metricId}`);
	}
	
	const warningSpan = config.autoAdjust.warningSpan;
	const warningMin = normalMax;
	const warningMax = Math.min(displayMax, normalMax + warningSpan);
	const criticalMin = warningMax;
	const criticalMax = displayMax;
	
	return { warningMin, warningMax, criticalMin, criticalMax };
}

/**
 * Auto-adjust warning thresholds for inverted metrics
 * Returns: { warningMin, warningMax, criticalMin, criticalMax }
 */
export function autoAdjustInvertedThresholds(
	metricId: string,
	normalMin: number,
	displayMin: number
): { warningMin: number; warningMax: number; criticalMin: number; criticalMax: number } {
	const config = METRICS_CONFIG[metricId];
	if (!config || config.type !== 'inverted') {
		throw new Error(`Invalid metric ID or type for inverted adjustment: ${metricId}`);
	}
	
	const warningSpan = config.autoAdjust.warningSpan;
	const warningMax = normalMin;
	const warningMin = Math.max(displayMin, normalMin - warningSpan);
	const criticalMax = warningMin;
	const criticalMin = displayMin;
	
	return { warningMin, warningMax, criticalMin, criticalMax };
}

/**
 * Auto-adjust warning thresholds for range-based metrics
 * Returns: { warningMin, warningMax, criticalMin, criticalMax }
 */
export function autoAdjustRangeThresholds(
	metricId: string,
	normalMin: number,
	normalMax: number,
	displayMin: number,
	displayMax: number
): { warningMin: number; warningMax: number; criticalMin: number; criticalMax: number } {
	const config = METRICS_CONFIG[metricId];
	if (!config || config.type !== 'range') {
		throw new Error(`Invalid metric ID or type for range adjustment: ${metricId}`);
	}
	
	const extension = config.autoAdjust.warningExtension || 10;
	
	// Warning extends beyond normal on both sides
	const warningMin = Math.max(displayMin, normalMin - extension);
	const warningMax = Math.min(displayMax, normalMax + extension);
	
	// Critical is at the warning boundaries
	const criticalMin = warningMin;
	const criticalMax = warningMax;
	
	return { warningMin, warningMax, criticalMin, criticalMax };
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

/**
 * Validate threshold values for a metric
 * Returns validation result with any errors found
 */
export function validateThresholds(
	metricId: string,
	normalMin: number,
	normalMax: number,
	warningMin: number,
	warningMax: number,
	criticalMin: number,
	criticalMax: number,
	displayMin: number,
	displayMax: number
): ValidationResult {
	const config = METRICS_CONFIG[metricId];
	const errors: ValidationError[] = [];
	
	// Basic range validation
	if (normalMin > normalMax) {
		errors.push({
			field: 'normal',
			message: 'Normal minimum cannot be greater than maximum',
		});
	}
	
	if (warningMin > warningMax) {
		errors.push({
			field: 'warning',
			message: 'Warning minimum cannot be greater than maximum',
		});
	}
	
	if (criticalMin > criticalMax) {
		errors.push({
			field: 'critical',
			message: 'Critical minimum cannot be greater than maximum',
		});
	}
	
	// Display range validation
	if (normalMin < displayMin || normalMax > displayMax) {
		errors.push({
			field: 'normal',
			message: `Normal range must be within ${displayMin} - ${displayMax}`,
		});
	}
	
	// Type-specific validation
	if (config?.type === 'ascending') {
		// Ascending: Normal ≤ Warning ≤ Critical
		if (warningMin < normalMax) {
			errors.push({
				field: 'warning',
				message: 'Warning zone must start at or after normal maximum',
			});
		}
		if (criticalMin < warningMax) {
			errors.push({
				field: 'critical',
				message: 'Critical zone must start at or after warning maximum',
			});
		}
	} else if (config?.type === 'inverted') {
		// Inverted: Critical ≤ Warning ≤ Normal
		if (warningMax > normalMin) {
			errors.push({
				field: 'warning',
				message: 'Warning zone must end at or before normal minimum',
			});
		}
		if (criticalMax > warningMin) {
			errors.push({
				field: 'critical',
				message: 'Critical zone must end at or before warning minimum',
			});
		}
	} else if (config?.type === 'range') {
		// Range: Critical < Warning < Normal < Warning < Critical
		// Warning must contain normal range
		if (warningMin > normalMin || warningMax < normalMax) {
			errors.push({
				field: 'warning',
				message: 'Warning zone must encompass the entire normal range',
			});
		}
		// Critical boundaries must be at or beyond warning
		if (criticalMin > warningMin || criticalMax < warningMax) {
			errors.push({
				field: 'critical',
				message: 'Critical boundaries must be at or beyond warning zone',
			});
		}
	}
	
	// Minimum span validation (prevent too narrow ranges)
	const minSpan = config?.unit === '%' || config?.unit === '' ? 5 : 1;
	if (normalMax - normalMin < minSpan) {
		errors.push({
			field: 'normal',
			message: `Normal range must be at least ${minSpan} ${config?.unit || 'units'} wide`,
		});
	}
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Validate normal range only (for quick validation during slider drag)
 */
export function validateNormalRange(
	metricId: string,
	normalMin: number,
	normalMax: number,
	displayMin: number,
	displayMax: number
): ValidationResult {
	const config = METRICS_CONFIG[metricId];
	const errors: ValidationError[] = [];
	
	if (normalMin > normalMax) {
		errors.push({
			field: 'normal',
			message: 'Minimum cannot be greater than maximum',
		});
	}
	
	if (normalMin < displayMin) {
		errors.push({
			field: 'normal',
			message: `Minimum cannot be less than ${displayMin}`,
		});
	}
	
	if (normalMax > displayMax) {
		errors.push({
			field: 'normal',
			message: `Maximum cannot be greater than ${displayMax}`,
		});
	}
	
	const minSpan = config?.unit === '%' || config?.unit === '' ? 5 : 1;
	if (normalMax - normalMin < minSpan) {
		errors.push({
			field: 'normal',
			message: `Range must be at least ${minSpan} ${config?.unit || 'units'} wide`,
		});
	}
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

