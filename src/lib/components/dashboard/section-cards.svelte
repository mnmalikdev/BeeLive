<script lang="ts">
	import GaugeCard from "./gauge-card.svelte";
	import GaugeCardSkeleton from "./gauge-card-skeleton.svelte";
	import WeightGauge from "./weight-gauge.svelte";
	import {
		temperatureMetric,
		humidityMetric,
		weightMetric,
		activityMetric,
		co2Metric,
		honeyMetric,
		swarmMetric,
		batteryMetric,
		thresholdsStore,
	} from "$lib/stores/telemetry.store.js";

	// Subscribe to individual metric stores for granular reactivity
	// Each gauge only re-renders when its specific data changes
</script>

<div class="grid w-full auto-rows-fr gap-6 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
	<!-- Temperature Gauge -->
	<div class="flex w-full justify-center">
		{#if $temperatureMetric}
			<GaugeCard {...$temperatureMetric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- Humidity Gauge -->
	<div class="flex w-full justify-center">
		{#if $humidityMetric}
			<GaugeCard {...$humidityMetric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- Weight Gauge (Special component) -->
	<div class="flex w-full justify-center">
		{#if $thresholdsStore}
			<WeightGauge thresholds={$thresholdsStore} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- Activity/Sound Gauge -->
	<div class="flex w-full justify-center">
		{#if $activityMetric}
			<GaugeCard {...$activityMetric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- CO2 Gauge -->
	<div class="flex w-full justify-center">
		{#if $co2Metric}
			<GaugeCard {...$co2Metric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- Honey Gain Gauge -->
	<div class="flex w-full justify-center">
		{#if $honeyMetric}
			<GaugeCard {...$honeyMetric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- Swarm Risk Gauge -->
	<div class="flex w-full justify-center">
		{#if $swarmMetric}
			<GaugeCard {...$swarmMetric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>

	<!-- Battery Gauge -->
	<div class="flex w-full justify-center">
		{#if $batteryMetric}
			<GaugeCard {...$batteryMetric} />
		{:else}
			<GaugeCardSkeleton />
		{/if}
	</div>
</div>
