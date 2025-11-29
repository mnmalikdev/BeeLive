<script lang="ts">
	import { onMount } from "svelte";
	import { HistoryItem } from "$lib/components/history/index.js";
	import { eventsService } from "$lib/services/index.js";
	import { handleApiError } from "$lib/utils/error-handler.js";
	import type { Event } from "$lib/services/events.service.js";

	type HistoryItemData = {
		id: string; // Event ID for unique key
		title: string;
		description: string;
		date: Date;
		status: "critical" | "warning" | "normal";
	};

	let loading = $state(true);
	let error = $state<string | null>(null);
	let historyItems = $state<HistoryItemData[]>([]);

	/**
	 * Map event type to status
	 */
	function getStatusFromEventType(type: string): "critical" | "warning" | "normal" {
		if (type.includes("CLEARED") || type.includes("NORMALIZED")) {
			return "normal";
		}
		// Critical alerts
		if (type.includes("TEMP_HIGH") || type.includes("SWARM_RISK") || type.includes("WEIGHT_DROP")) {
			return "critical";
		}
		// Warning alerts
		return "warning";
	}

	/**
	 * Get title from event type
	 */
	function getTitleFromEventType(type: string): string {
		if (type.includes("CLEARED")) {
			return type.replace("_CLEARED", "").replace(/_/g, " ") + " Cleared";
		}
		return type.replace(/_/g, " ");
	}

	onMount(async () => {
		try {
			// Fetch events from API
			const response = await eventsService.getEvents({ limit: 50 });

			// Transform events to history items format
			historyItems = response.data.map((event) => {
				// Handle date parsing safely
				let date: Date;
				if (event.createdAt instanceof Date) {
					date = event.createdAt;
				} else if (typeof event.createdAt === 'string') {
					date = new Date(event.createdAt);
					// Validate date
					if (isNaN(date.getTime())) {
						console.warn('Invalid date for event:', event.id, event.createdAt);
						date = new Date(); // Fallback to current date
					}
				} else {
					date = new Date(); // Fallback to current date
				}

				return {
					id: event.id, // Use event ID for unique key
					title: getTitleFromEventType(event.type),
					description: event.message,
					date,
					status: getStatusFromEventType(event.type),
				};
			});

			loading = false;
		} catch (err) {
			error = handleApiError(err, false);
			console.error("Failed to load history:", err);
			loading = false;
		}
	});
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

	{#if error}
		<div class="flex items-center justify-center p-8">
			<div class="text-center">
				<p class="text-lg font-semibold text-destructive">Failed to load history</p>
				<p class="text-sm text-muted-foreground">{error}</p>
			</div>
		</div>
	{:else if loading}
		<div class="space-y-4">
			{#each Array(5) as _, i}
				<div class="h-24 animate-pulse rounded-xl border border-border/60 bg-card"></div>
			{/each}
		</div>
	{:else if historyItems.length === 0}
		<div class="flex items-center justify-center p-8">
			<div class="text-center">
				<p class="text-lg font-semibold text-muted-foreground">No events found</p>
				<p class="text-sm text-muted-foreground">Event history will appear here when alerts are triggered.</p>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			{#each historyItems as item (item.id)}
				<HistoryItem
					title={item.title}
					description={item.description}
					date={item.date}
					status={item.status}
				/>
			{/each}
		</div>
	{/if}
</section>

