<script lang="ts">
	import { MetricThreshold } from "$lib/components/configurations/index.js";

	// Default threshold values for each metric
	const metrics = $state([
		{
			id: "temp",
			label: "Hive Temperature",
			unit: "°C",
			min: 30,
			max: 40,
			normalMin: 32.0,
			normalMax: 35.5,
			warningMin: 35.6,
			warningMax: 36.0,
			criticalMin: 36.0,
			criticalMax: 40.0,
		},
		{
			id: "humidity",
			label: "Humidity",
			unit: "%",
			min: 0,
			max: 100,
			normalMin: 40,
			normalMax: 75,
			warningMin: 75,
			warningMax: 85,
			criticalMin: 85,
			criticalMax: 100,
		},
		{
			id: "weight",
			label: "Weight (kg)",
			unit: "kg",
			min: 0,
			max: 80,
			normalMin: 20,
			normalMax: 60,
			warningMin: 15,
			warningMax: 20,
			criticalMin: 0,
			criticalMax: 15,
		},
		{
			id: "activity",
			label: "Bee Activity",
			unit: "dB",
			min: 0,
			max: 100,
			normalMin: 50,
			normalMax: 70,
			warningMin: 40,
			warningMax: 50,
			criticalMin: 0,
			criticalMax: 40,
		},
		{
			id: "co2",
			label: "CO₂",
			unit: "ppm",
			min: 0,
			max: 5000,
			normalMin: 400,
			normalMax: 2000,
			warningMin: 2000,
			warningMax: 4000,
			criticalMin: 4000,
			criticalMax: 5000,
		},
		{
			id: "honey",
			label: "Daily Honey Gain",
			unit: "g",
			min: -1000,
			max: 1000,
			normalMin: 50,
			normalMax: 800,
			warningMin: -200,
			warningMax: 50,
			criticalMin: -1000,
			criticalMax: -500,
		},
		{
			id: "swarm",
			label: "Swarm Risk Score",
			unit: "",
			min: 0,
			max: 100,
			normalMin: 0,
			normalMax: 40,
			warningMin: 40,
			warningMax: 70,
			criticalMin: 70,
			criticalMax: 100,
		},
		{
			id: "battery",
			label: "Battery %",
			unit: "%",
			min: 0,
			max: 100,
			normalMin: 70,
			normalMax: 100,
			warningMin: 30,
			warningMax: 70,
			criticalMin: 0,
			criticalMax: 30,
		},
	]);
</script>

<svelte:head>
	<title>Configurations - BeeLive</title>
	<meta name="description" content="BeeLive Configurations" />
</svelte:head>

<section class="space-y-6">
	<header class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
		<p class="text-sm font-semibold uppercase tracking-wide text-primary">Configurations</p>
		<h1 class="text-2xl font-bold tracking-tight">Configure Metric Thresholds</h1>
		<p class="text-sm text-muted-foreground">
			Adjust the threshold ranges for Normal, Warning, and Critical states for each metric.
		</p>
	</header>

	<div class="grid gap-6 md:grid-cols-2">
		{#each metrics as metric (metric.id)}
			<MetricThreshold
				id={metric.id}
				label={metric.label}
				unit={metric.unit}
				min={metric.min}
				max={metric.max}
				bind:normalMin={metric.normalMin}
				bind:normalMax={metric.normalMax}
				bind:warningMin={metric.warningMin}
				bind:warningMax={metric.warningMax}
				bind:criticalMin={metric.criticalMin}
				bind:criticalMax={metric.criticalMax}
			/>
		{/each}
	</div>
</section>

