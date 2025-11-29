/**
 * Stores module exports
 */

export { uiStore } from './ui.store.js';
export type { UIState, Notification } from './ui.store.js';
export { toastStore } from './toast.store.js';
export type { Toast, ToastVariant } from './toast.store.js';
export { websocketStore } from './websocket.store.js';
export type { WebSocketState } from './websocket.store.js';

// Telemetry stores for granular reactivity
export {
	// Raw value stores
	temperatureValue,
	humidityValue,
	weightValue,
	soundValue,
	co2Value,
	honeyGainValue,
	swarmRiskValue,
	batteryValue,
	recordedAt,
	thresholdsStore,
	// Derived metric stores
	temperatureMetric,
	humidityMetric,
	weightMetric,
	activityMetric,
	co2Metric,
	honeyMetric,
	swarmMetric,
	batteryMetric,
	allMetrics,
	// Update functions
	updateTelemetry,
	setThresholds,
} from './telemetry.store.js';
export type { Severity, GaugeSegment, MetricData, TelemetryValues } from './telemetry.store.js';


