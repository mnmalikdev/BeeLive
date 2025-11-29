<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import { GaugeCardSkeleton } from '$lib/components/dashboard/index.js';
	import { telemetryService, thresholdsService } from '$lib/services/index.js';
	import { handleApiError } from '$lib/utils/error-handler.js';
	import { updateTelemetry, setThresholds } from '$lib/stores/telemetry.store.js';

	let { data }: { data: PageData } = $props();

	let SectionCards: any = $state(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Listen to WebSocket telemetry updates and update individual stores
	function handleTelemetryUpdate(event: CustomEvent) {
		const update = event.detail;
		
		// Update individual stores - only changed values will trigger re-renders
		updateTelemetry({
			temperature: update.temperature,
			humidity: update.humidity,
			weightKg: update.weightKg,
			soundDb: update.soundDb,
			co2Ppm: update.co2Ppm,
			dailyHoneyGainG: update.dailyHoneyGainG,
			swarmRisk: update.swarmRisk,
			batteryPercent: update.batteryPercent,
			recordedAt: update.recordedAt instanceof Date 
				? update.recordedAt 
				: new Date(update.recordedAt),
		});
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

			// Set thresholds in store (needed for derived metric calculations)
			setThresholds(thresholdsResponse.data);

			// Initialize telemetry values in stores
			const telemetry = telemetryResponse.data;
			updateTelemetry({
				temperature: telemetry.temperature,
				humidity: telemetry.humidity,
				weightKg: telemetry.weightKg,
				soundDb: telemetry.soundDb,
				co2Ppm: telemetry.co2Ppm,
				dailyHoneyGainG: telemetry.dailyHoneyGainG ?? 0,
				swarmRisk: telemetry.swarmRisk,
				batteryPercent: telemetry.batteryPercent,
				recordedAt: telemetry.recordedAt instanceof Date 
					? telemetry.recordedAt 
					: new Date(telemetry.recordedAt),
			});

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
	<SectionCards />
{:else}
	<div class="grid w-full auto-rows-fr gap-6 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
		{#each Array(8) as _, i}
			<div class="flex w-full justify-center">
				<GaugeCardSkeleton />
			</div>
		{/each}
	</div>
{/if}
