<script lang="ts">
	import { Card, CardContent, CardHeader, CardFooter } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { websocketStore } from "$lib/stores/websocket.store.js";
	import type { TelemetryFullPayload } from "$lib/types/websocket.js";
	import { onMount, onDestroy } from "svelte";
	import type { Thresholds } from "$lib/services/thresholds.service.js";

	let { thresholds }: { thresholds: Thresholds | null } = $props();

	// Get latest telemetry from WebSocket store
	let telemetry = $state<TelemetryFullPayload | null>(null);
	let robberyAlertActive = $state(false);

	// Subscribe to WebSocket store
	let unsubscribe: (() => void) | null = null;
	let alertCleanup: (() => void) | null = null;

	onMount(() => {
		// Subscribe to telemetry updates
		unsubscribe = websocketStore.subscribe((state) => {
			telemetry = state.lastTelemetry;
		});

		// Listen for robbery alerts and play sound
		const handleAlert = (event: CustomEvent) => {
			const payload = event.detail;
			if (payload.alert?.type === 'WEIGHT_ROBBERY') {
				robberyAlertActive = payload.action === 'triggered';
				
				// Play sound on robbery alert
				if (payload.action === 'triggered') {
					try {
						const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
						const oscillator = audioContext.createOscillator();
						const gainNode = audioContext.createGain();
						
						oscillator.connect(gainNode);
						gainNode.connect(audioContext.destination);
						
						oscillator.frequency.value = 800; // Higher frequency for critical alert
						oscillator.type = 'sine';
						gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
						gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
						
						oscillator.start(audioContext.currentTime);
						oscillator.stop(audioContext.currentTime + 0.5);
						
						// Play 3 times for critical alert
						setTimeout(() => {
							const osc2 = audioContext.createOscillator();
							const gain2 = audioContext.createGain();
							osc2.connect(gain2);
							gain2.connect(audioContext.destination);
							osc2.frequency.value = 800;
							osc2.type = 'sine';
							gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
							gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
							osc2.start(audioContext.currentTime + 0.6);
							osc2.stop(audioContext.currentTime + 1.1);
						}, 600);
						
						setTimeout(() => {
							const osc3 = audioContext.createOscillator();
							const gain3 = audioContext.createGain();
							osc3.connect(gain3);
							gain3.connect(audioContext.destination);
							osc3.frequency.value = 800;
							osc3.type = 'sine';
							gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
							gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
							osc3.start(audioContext.currentTime + 1.2);
							osc3.stop(audioContext.currentTime + 1.7);
						}, 1200);
					} catch (error) {
						console.error('Failed to play alert sound:', error);
					}
				}
			}
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('alert-update', handleAlert as EventListener);
			alertCleanup = () => {
				window.removeEventListener('alert-update', handleAlert as EventListener);
			};
		}
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
		if (alertCleanup) {
			alertCleanup();
		}
	});

	// Calculate daily gain/loss display
	const dailyGainG = $derived(telemetry?.dailyHoneyGainG ?? 0);
	
	const gainStatus = $derived.by(() => {
		if (dailyGainG > 100) return 'safe';
		if (dailyGainG >= -299 && dailyGainG <= -100) return 'warning';
		return 'critical'; // <= -300g or robbery
	});

	// Format daily gain display
	const formattedGain = $derived.by(() => {
		if (dailyGainG >= 0) {
			return `+${dailyGainG.toFixed(0)}`;
		}
		return dailyGainG.toFixed(0);
	});

	// Overall severity badge
	const severity = $derived.by(() => {
		if (robberyAlertActive) return 'critical';
		return gainStatus;
	});

	type Severity = 'safe' | 'warning' | 'critical';

	const statusConfig: Record<
		Severity,
		{
			color: string;
			label: string;
		}
	> = {
		safe: { color: "#22c55e", label: "Normal" },
		warning: { color: "#eab308", label: "Warning" },
		critical: { color: "#ef4444", label: "Critical" },
	};

	const status = $derived(statusConfig[severity]);

	const palette: Record<Severity, { card: string }> = {
		safe: {
			card: "from-[#151b2f] to-[#0d101f]",
		},
		warning: {
			card: "from-[#22160c] to-[#140c06]",
		},
		critical: {
			card: "from-[#2b0e11] to-[#1a0709]",
		},
	};

	const colors = $derived(palette[severity]);
</script>

<Card
	class={`w-full max-w-[280px] rounded-3xl border border-white/10 bg-linear-to-b ${colors.card} text-white shadow-[0_15px_45px_rgba(15,16,32,0.55)] relative {robberyAlertActive ? 'animate-pulse' : ''}`}
>
	{#if robberyAlertActive}
		<div class="absolute inset-0 border-2 border-red-500 rounded-3xl animate-pulse pointer-events-none z-10"></div>
	{/if}

	<CardHeader class="pb-2 text-center">
		<div class="flex items-center justify-center">
			<Badge
				class="px-2 py-0.5 text-xs font-medium capitalize"
				style={`background-color: ${status.color}; border-color: ${status.color}; color: white;`}
			>
				{status.label}
			</Badge>
		</div>
	</CardHeader>

	<CardContent class="flex flex-col items-center gap-5 pb-6">
		<div class="flex flex-col items-center justify-center space-y-4 py-4">
			<!-- Big weight number -->
			<div class="text-center">
				<div class="text-5xl font-bold text-white leading-none">
					{telemetry?.weightKg?.toFixed(2) ?? '0.00'}
				</div>
				<div class="text-sm text-white/70 mt-1">kg</div>
			</div>

			<!-- Daily gain/loss -->
			<div class="text-center">
				<div class="text-xs text-white/70 mb-1">Today's gain/loss</div>
				<div class="text-2xl font-semibold text-white">
					{formattedGain} <span class="text-sm">g</span>
				</div>
			</div>
		</div>
	</CardContent>

	<CardFooter class="flex flex-col gap-2 pt-4 text-xs">
		<div class="flex items-center gap-2">
			<span class="font-medium text-white/90">Normal:</span>
			<span class="text-white/70">20 – 60 kg (depends on season)</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-medium text-white/90">Warning:</span>
			<span class="text-white/70">Daily loss &gt; {thresholds?.weightWarningDailyLossG ?? 300} g/day</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="font-medium text-white/90">Critical:</span>
			<span class="text-white/70">Drop &gt; {thresholds?.weightCriticalRobberyDropKg ? (thresholds.weightCriticalRobberyDropKg * 1000).toFixed(0) : '800'} g in &lt;6h or &lt; {thresholds?.weightNormalDailyGainMinG ?? -200} g/day</span>
		</div>
	</CardFooter>
</Card>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>

