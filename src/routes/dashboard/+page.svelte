<script lang="ts">
	import data from '$lib/data/dashboard';
	import { SectionCards, ChartAreaInteractive, DataTable } from '$lib/components/dashboard/index.js';
</script>

<svelte:head>
	<title>Dashboard - Process Alerts</title>
	<meta name="description" content="Process Alerts Dashboard" />
</svelte:head>

<SectionCards />
<div class="px-4 lg:px-6">
	<ChartAreaInteractive />
</div>
<DataTable {data} />
