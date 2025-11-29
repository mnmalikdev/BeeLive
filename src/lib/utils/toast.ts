/**
 * Toast Helper Functions
 * Convenience functions for showing toasts throughout the application
 * Follows existing error-handler pattern
 */

import { toastStore } from "$lib/stores/toast.store.js";
import type { ToastVariant } from "$lib/stores/toast.store.js";

/**
 * Show an alert toast (for warning and critical alerts from backend)
 * Plays sound by default for both warning and critical alerts
 */
export function showAlertToast(
	type: string,
	message: string,
	playSound = true
): string {
	// Determine variant based on alert type
	let variant: ToastVariant = "warning"; // Default to warning
	
	if (type.includes("CLEARED") || type.includes("NORMALIZED")) {
		variant = "success";
	} else if (
		type.includes("TEMP_HIGH") ||
		type.includes("SWARM_RISK") ||
		type.includes("WEIGHT_DROP")
	) {
		variant = "destructive"; // Critical alerts
	} else {
		// All other alerts are warnings (HUMIDITY_HIGH, HUMIDITY_LOW, CO2_HIGH, BATTERY_LOW, SOUND_ANOMALY, HONEY_GAIN_LOW, TEMP_LOW)
		variant = "warning";
	}

	const title = type.includes("CLEARED")
		? `${type.replace("_CLEARED", "").replace(/_/g, " ")} Cleared`
		: type.replace(/_/g, " ");

	// Show toast for both warning and critical alerts
	// Play sound for both warning and critical if playSound is true
	const isCritical = variant === "destructive";
	const isWarning = variant === "warning";

	// Debug logging (can be removed in production)
	if (typeof window !== "undefined" && import.meta.env.DEV) {
		console.log(`[Toast] Showing ${variant} alert:`, { type, title, message, playSound });
	}

	return toastStore.add({
		title,
		description: message,
		variant,
		duration: isCritical ? 8000 : isWarning ? 6000 : 5000, // Longer duration for alerts
		playSound: playSound && (isCritical || isWarning), // Play sound for both warning and critical
	});
}

/**
 * Show a telemetry update toast (for real-time updates)
 * No sound, shorter duration
 */
export function showTelemetryUpdateToast(message: string): string {
	return toastStore.info(message, "Telemetry Update", 3000);
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, title?: string): string {
	return toastStore.success(message, title);
}

/**
 * Show error toast
 */
export function showErrorToast(message: string, title?: string): string {
	return toastStore.error(message, title);
}

/**
 * Show warning toast
 */
export function showWarningToast(message: string, title?: string): string {
	return toastStore.warning(message, title);
}

/**
 * Show info toast
 */
export function showInfoToast(message: string, title?: string): string {
	return toastStore.info(message, title);
}

