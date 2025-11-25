<script lang="ts">
	import { HistoryItem } from "$lib/components/history/index.js";

	// Generate dummy history items with dates
	const historyItems = [
		{
			title: "Hive Temperature Alert",
			description: "Temperature exceeded critical threshold of 36.0°C for more than 1 hour",
			date: new Date(2024, 11, 15, 14, 32), // 15 Dec 24 : 14:32
			status: "critical" as const,
		},
		{
			title: "Humidity Warning",
			description: "Humidity level reached 82%, approaching critical range",
			date: new Date(2024, 11, 14, 9, 15), // 14 Dec 24 : 09:15
			status: "warning" as const,
		},
		{
			title: "Weight Drop Detected",
			description: "Sudden weight drop of 350g detected in 2 hours - possible swarming activity",
			date: new Date(2024, 11, 13, 16, 48), // 13 Dec 24 : 16:48
			status: "warning" as const,
		},
		{
			title: "CO₂ Level Normalized",
			description: "CO₂ levels returned to normal range after ventilation adjustment",
			date: new Date(2024, 11, 12, 11, 5), // 12 Dec 24 : 11:05
			status: "normal" as const,
		},
	];
</script>

<svelte:head>
	<title>History - BeeLive</title>
	<meta name="description" content="BeeLive History" />
</svelte:head>

<section class="space-y-6">
	<header class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
		<p class="text-sm font-semibold uppercase tracking-wide text-primary">History</p>
		<h1 class="text-2xl font-bold tracking-tight">Complete history of your alerts</h1>
		<p class="text-sm text-muted-foreground">
			Timeline of alert activity, data exports, and audit trails.
		</p>
	</header>

	<div class="space-y-4">
		{#each historyItems as item (item.title)}
			<HistoryItem
				title={item.title}
				description={item.description}
				date={item.date}
				status={item.status}
			/>
		{/each}
	</div>
</section>

