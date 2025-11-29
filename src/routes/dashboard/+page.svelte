<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { GaugeCardSkeleton } from '$lib/components/dashboard/index.js';
	import { telemetryService, thresholdsService } from '$lib/services/index.js';
	import { transformTelemetryToMetrics } from '$lib/utils/telemetry-transform.js';
	import { handleApiError } from '$lib/utils/error-handler.js';
	import { websocketStore } from '$lib/stores/websocket.store.js';
	import type { Thresholds } from '$lib/services/thresholds.service.js';
	import type { Telemetry } from '$lib/services/telemetry.service.js';

	let { data }: { data: PageData } = $props();

	let SectionCards: any = $state(null);

	type Severity = 'safe' | 'warning' | 'critical';
	type Metric = {
		id: string;
		label: string;
		unit: string;
		value: string;
		percent: number;
		severity: Severity;
		scale: [string, string, string];
		ranges?: {
			normal: string;
			warning: string;
			critical: string;
		};
	};

	let loading = $state(true);
	let error = $state<string | null>(null);
	let metrics = $state<Metric[]>([]);
	let thresholds = $state<Thresholds | null>(null);
	let currentTelemetry = $state<Telemetry | null>(null);

	// Listen to WebSocket telemetry updates
	function handleTelemetryUpdate(event: CustomEvent) {
		if (!thresholds) return;

		const update = event.detail;
		
		// Merge with current telemetry
		if (currentTelemetry) {
			currentTelemetry = {
				...currentTelemetry,
				...update,
				recordedAt: update.recordedAt 
					? (update.recordedAt instanceof Date ? update.recordedAt : new Date(update.recordedAt))
					: currentTelemetry.recordedAt,
			};
		} else {
			// First update - convert to Telemetry format
			currentTelemetry = {
				id: update.id || '',
				hiveId: update.hiveId || 'BERLIN-ROOFTOP-01',
				recordedAt: update.recordedAt instanceof Date ? update.recordedAt : new Date(update.recordedAt),
				temperature: update.temperature,
				humidity: update.humidity,
				weightKg: update.weightKg,
				soundDb: update.soundDb,
				co2Ppm: update.co2Ppm,
				dailyHoneyGainG: update.dailyHoneyGainG,
				swarmRisk: update.swarmRisk,
				batteryPercent: update.batteryPercent,
			};
		}

		// Update metrics
		if (currentTelemetry && thresholds) {
			metrics = transformTelemetryToMetrics(currentTelemetry, thresholds);
		}
	}

	onMount(async () => {
		try {
			// Lazy load dashboard components
			const module = await import('$lib/components/dashboard/index.js');
			SectionCards = module.SectionCards;

			// Fetch telemetry and thresholds in parallel
			const [telemetryResponse, thresholdsResponse] = await Promise.all([
				telemetryService.getLatest(),
				thresholdsService.getThresholds(),
			]);

			// Store thresholds and telemetry
			thresholds = thresholdsResponse.data;
			currentTelemetry = telemetryResponse.data;

			// Transform telemetry data into metrics format
			metrics = transformTelemetryToMetrics(telemetryResponse.data, thresholdsResponse.data);
			loading = false;

			// Listen to WebSocket telemetry updates
			if (typeof window !== 'undefined') {
				window.addEventListener('telemetry-update', handleTelemetryUpdate as EventListener);
			}
		} catch (err) {
			error = handleApiError(err, false);
			console.error('Failed to load dashboard data:', err);
			loading = false;
		}
	});

	onDestroy(() => {
		// Cleanup event listener
		if (typeof window !== 'undefined') {
			window.removeEventListener('telemetry-update', handleTelemetryUpdate as EventListener);
		}
	});
</script>

<svelte:head>
	<title>Dashboard - BeeLive</title>
	<meta name="description" content="BeeLive Dashboard" />
</svelte:head>

{#if error}
	<div class="flex items-center justify-center p-8">
		<div class="text-center">
			<p class="text-lg font-semibold text-destructive">Failed to load dashboard data</p>
			<p class="text-sm text-muted-foreground">{error}</p>
		</div>
	</div>
{:else if SectionCards && !loading}
	<SectionCards {metrics} {loading} />
{:else}
	<div class="grid w-full auto-rows-fr gap-6 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
		{#each Array(8) as _, i}
			<div class="flex w-full justify-center">
				<GaugeCardSkeleton />
			</div>
		{/each}
	</div>
{/if}
