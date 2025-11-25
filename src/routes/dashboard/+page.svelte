<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { GaugeCardSkeleton } from '$lib/components/dashboard/index.js';

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
	let metrics = $state<Metric[]>([]);

	onMount(async () => {
		try {
			// Lazy load dashboard components
			const module = await import('$lib/components/dashboard/index.js');
			SectionCards = module.SectionCards;

			// TODO: When implementing real server-side data fetching:
			// 1. Remove this onMount data loading
			// 2. Use +page.server.ts to fetch data from API
			// 3. Pass data via props: let { data }: { data: PageData } = $props()
			// 4. Skeletons will automatically show during navigation via SvelteKit's loading states
			// 5. No artificial delays needed - loading state managed by SvelteKit

			// Load metrics data (temporary - replace with server-side fetching)
			metrics = [
				{
					id: 'temp',
					label: 'Hive Temperature',
					unit: '°C',
					value: '34.2',
					percent: 70,
					severity: 'safe',
					scale: ['32°', 'TCM', '36°'],
					ranges: {
						normal: '32.0 – 35.5 °C',
						warning: '35.6 – 36.0 °C',
						critical: '> 36.0 °C',
					},
				},
				{
					id: 'humidity',
					label: 'Humidity',
					unit: '%',
					value: '78',
					percent: 78,
					severity: 'warning',
					scale: ['40%', 'Hive', '85%'],
					ranges: {
						normal: '40 – 75 %',
						warning: '75 – 85 %',
						critical: '> 85 % or < 30 %',
					},
				},
				{
					id: 'weight',
					label: 'Weight (kg)',
					unit: 'kg',
					value: '42.4',
					percent: 55,
					severity: 'safe',
					scale: ['20 kg', 'Total', '60 kg'],
					ranges: {
						normal: '20 – 60 kg (depends on season)',
						warning: 'Sudden drop > 200 g in 2 h',
						critical: 'Drop > 500 g in 4 h',
					},
				},
				{
					id: 'activity',
					label: 'Bee Activity',
					unit: 'dB',
					value: '62',
					percent: 62,
					severity: 'safe',
					scale: ['50 dB', 'Day', '70 dB'],
					ranges: {
						normal: 'Day: 50 – 70 dB / Night: 20 – 40 dB',
						warning: 'Day < 40 dB / Night > 50 dB',
						critical: 'Day < 25 dB or Night > 60 dB',
					},
				},
				{
					id: 'co2',
					label: 'CO₂',
					unit: 'ppm',
					value: '3 200',
					percent: 80,
					severity: 'warning',
					scale: ['400', 'Vent', '4 000'],
					ranges: {
						normal: '400 – 2 000 ppm',
						warning: '2 000 – 4 000 ppm',
						critical: '> 4 000 ppm',
					},
				},
				{
					id: 'honey',
					label: 'Daily Honey Gain',
					unit: 'g',
					value: '+320',
					percent: 65,
					severity: 'safe',
					scale: ['0 g', 'Δ 24h', '800 g'],
					ranges: {
						normal: '+50 – +800 g/day (flow season)',
						warning: '–200 – +50 g/day',
						critical: '< –500 g/day',
					},
				},
				{
					id: 'swarm',
					label: 'Swarm Risk Score',
					unit: '',
					value: '58',
					percent: 58,
					severity: 'warning',
					scale: ['0', 'Score', '100'],
					ranges: {
						normal: '0 – 40',
						warning: '40 – 70',
						critical: '> 70',
					},
				},
				{
					id: 'battery',
					label: 'Battery %',
					unit: '%',
					value: '28',
					percent: 28,
					severity: 'critical',
					scale: ['0%', 'Charge', '100%'],
					ranges: {
						normal: '70 – 100 %',
						warning: '30 – 70 %',
						critical: '< 30 %',
					},
				},
			];
			loading = false;
		} catch (error) {
			console.error('Failed to load dashboard data:', error);
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Dashboard - BeeLive</title>
	<meta name="description" content="BeeLive Dashboard" />
</svelte:head>

{#if SectionCards && !loading}
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
