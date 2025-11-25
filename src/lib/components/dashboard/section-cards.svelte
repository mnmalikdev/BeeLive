<script lang="ts">
	import GaugeCard from "./gauge-card.svelte";
	import GaugeCardSkeleton from "./gauge-card-skeleton.svelte";

	type Severity = "safe" | "warning" | "critical";
	type Metric = {
		id: string;
		label: string;
		unit: string;
		value: string;
		percent: number;
		severity: Severity;
		scale: [string, string, string];
		centerLabel?: string;
		centerSubLabel?: string;
		ranges?: {
			normal: string;
			warning: string;
			critical: string;
		};
	};

	let {
		metrics = [],
		loading = false,
	}: {
		metrics?: Metric[];
		loading?: boolean;
	} = $props();
</script>

<div class="grid w-full auto-rows-fr gap-6 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
	{#if loading}
		{#each Array(8) as _, i}
			<div class="flex w-full justify-center">
				<GaugeCardSkeleton />
			</div>
		{/each}
	{:else}
		{#each metrics as metric (metric.id)}
			<div class="flex w-full justify-center">
				<GaugeCard {...metric} />
			</div>
		{/each}
	{/if}
</div>
