/**
 * Toast Store
 * Manages toast notifications with auto-dismiss and sound alerts
 * Follows existing UI store patterns
 */

import { writable } from "svelte/store";

export type ToastVariant = "default" | "destructive" | "success" | "warning" | "info";

export interface Toast {
	id: string;
	title?: string;
	description: string;
	variant: ToastVariant;
	duration?: number; // Auto-dismiss after milliseconds (0 = no auto-dismiss)
	playSound?: boolean; // Play sound alert for critical notifications
}

type ToastInput = Omit<Toast, "id">;

function createToastStore() {
	const { subscribe, set, update } = writable<Toast[]>([]);

	return {
		subscribe,
		/**
		 * Add a new toast notification
		 */
		add: (toast: ToastInput): string => {
			const id = crypto.randomUUID();
			const newToast: Toast = {
				...toast,
				id,
				duration: toast.duration ?? 5000, // Default 5 seconds
			};

			update((toasts) => [...toasts, newToast]);

			// Play sound if requested (for critical alerts)
			if (newToast.playSound && typeof window !== "undefined") {
				playAlertSound(newToast.variant);
			}

			return id;
		},
		/**
		 * Dismiss a toast by ID
		 */
		dismiss: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		/**
		 * Clear all toasts
		 */
		clear: () => {
			set([]);
		},
		/**
		 * Show success toast
		 */
		success: (description: string, title?: string, duration?: number) => {
			return createToastStore().add({
				title,
				description,
				variant: "success",
				duration,
			});
		},
		/**
		 * Show error toast
		 */
		error: (description: string, title?: string, duration?: number) => {
			return createToastStore().add({
				title,
				description,
				variant: "destructive",
				duration,
			});
		},
		/**
		 * Show warning toast
		 */
		warning: (description: string, title?: string, duration?: number) => {
			return createToastStore().add({
				title,
				description,
				variant: "warning",
				duration,
			});
		},
		/**
		 * Show info toast
		 */
		info: (description: string, title?: string, duration?: number) => {
			return createToastStore().add({
				title,
				description,
				variant: "info",
				duration,
			});
		},
	};
}

/**
 * Play alert sound based on toast variant
 * Uses Web Audio API for browser-native sounds
 */
function playAlertSound(variant: ToastVariant): void {
	if (typeof window === "undefined") return;

	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();

		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);

		// Different frequencies for different alert types
		switch (variant) {
			case "destructive":
				// Critical alert: higher frequency, more urgent
				oscillator.frequency.value = 800;
				oscillator.type = "sine";
				gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + 0.3);
				break;
			case "warning":
				// Warning: medium frequency
				oscillator.frequency.value = 600;
				oscillator.type = "sine";
				gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + 0.2);
				break;
			case "success":
				// Success: pleasant tone
				oscillator.frequency.value = 523.25; // C5 note
				oscillator.type = "sine";
				gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + 0.15);
				break;
			default:
				// Info: subtle beep
				oscillator.frequency.value = 400;
				oscillator.type = "sine";
				gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
				oscillator.start(audioContext.currentTime);
				oscillator.stop(audioContext.currentTime + 0.1);
		}
	} catch (error) {
		// Silently fail if audio context is not available
		console.debug("Could not play alert sound:", error);
	}
}

export const toastStore = createToastStore();

