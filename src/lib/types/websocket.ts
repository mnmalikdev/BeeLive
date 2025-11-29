/**
 * WebSocket Types
 * Match backend gateway payload structures
 */

/**
 * Telemetry delta payload from WebSocket
 * Contains only changed fields to minimize bandwidth
 */
export interface TelemetryDeltaPayload {
	type: 'telemetry';
	data: Partial<{
		temperature: number;
		humidity: number;
		weightKg: number;
		soundDb: number;
		co2Ppm: number;
		dailyHoneyGainG?: number;
		swarmRisk: number;
		batteryPercent: number;
		recordedAt: string | Date;
	}>;
	full?: TelemetryFullPayload;
}

/**
 * Full telemetry payload
 * Complete telemetry object for initial connection
 */
export interface TelemetryFullPayload {
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
 * Alert payload from WebSocket
 */
export interface AlertPayload {
	type: 'alert';
	action: 'triggered' | 'cleared';
	alert: {
		type: string;
		message: string;
		createdAt: string | Date;
		value?: number;
		hiveId: string;
	};
}

/**
 * WebSocket connection state
 */
export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

