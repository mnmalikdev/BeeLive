<script lang="ts">
	import { MetricThreshold, MetricThresholdSkeleton, WeightThreshold } from "$lib/components/configurations/index.js";
	import { onMount } from "svelte";
	import { thresholdsService } from "$lib/services/index.js";
	import { transformThresholdsToMetrics, transformMetricsToThresholds, extractWeightMonitoringThresholds, type MetricThreshold as MetricThresholdData } from "$lib/utils/thresholds-transform.js";
	import { handleApiError } from "$lib/utils/error-handler.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { toastStore } from "$lib/stores/toast.store.js";

	let loading = $state(true);
	let updating = $state(false);
	let error = $state<string | null>(null);
	let metrics = $state<MetricThresholdData[]>([]);
	let originalMetrics = $state<MetricThresholdData[]>([]);
	
	// Weight monitoring thresholds (separate from regular metrics)
	let weightMonitoring = $state({
		weightCriticalRobberyDropKg: 0.8,
		weightWarningDailyLossG: 300,
		weightNormalDailyGainMinG: -200,
	});
	let originalWeightMonitoring = $state({
		weightCriticalRobberyDropKg: 0.8,
		weightWarningDailyLossG: 300,
		weightNormalDailyGainMinG: -200,
	});
	
	let showConfirmDialog = $state(false);

	onMount(async () => {
		try {
			// Fetch thresholds from API
			const response = await thresholdsService.getThresholds();
			
			// Transform to UI format
			metrics = transformThresholdsToMetrics(response.data);
			// Deep clone for comparison
			originalMetrics = JSON.parse(JSON.stringify(metrics));
			
			// Extract weight monitoring thresholds
			weightMonitoring = extractWeightMonitoringThresholds(response.data);
			originalWeightMonitoring = JSON.parse(JSON.stringify(weightMonitoring));
			
			loading = false;
		} catch (err) {
			error = handleApiError(err, false);
			console.error("Failed to load configurations:", err);
			loading = false;
		}
	});

	// Check if any changes have been made
	const hasChanges = $derived.by(() => {
		if (originalMetrics.length === 0 || metrics.length === 0) return false;
		
		const metricsChanged = JSON.stringify(metrics) !== JSON.stringify(originalMetrics);
		const weightMonitoringChanged = JSON.stringify(weightMonitoring) !== JSON.stringify(originalWeightMonitoring);
		
		return metricsChanged || weightMonitoringChanged;
	});

	/**
	 * Validate basic requirements (only normal range validation)
	 * Auto-adjustment ensures no overlaps, so we only need to check normal range validity
	 */
	function validateMetrics(): string[] {
		const errors: string[] = [];

		metrics.forEach((metric) => {
			const { id, label, normalMin, normalMax } = metric;

			// Skip weight - it has special handling
			if (id === 'weight') {
				return;
			}

			// Only validate that normal range is valid
			// Auto-adjustment handles warning and critical ranges, ensuring no overlaps
			if (normalMin >= normalMax) {
				errors.push(`${label}: Normal minimum (${normalMin}) must be less than Normal maximum (${normalMax})`);
			}
		});

		return errors;
	}

	// Handle update button click
	function handleUpdate() {
		const errors = validateMetrics();
		
		if (errors.length > 0) {
			// Show validation errors
			toastStore.add({
				title: "Validation Error",
				description: errors.join(". "),
				variant: "destructive",
				duration: 5000,
			});
		} else {
			// No errors, proceed directly to confirmation
			showConfirmDialog = true;
		}
	}

	// Confirm and execute update
	async function confirmUpdate() {
		updating = true;
		showConfirmDialog = false;

		try {
			// Transform metrics back to thresholds format
			const updateData = transformMetricsToThresholds(metrics);
			
			// Add weight monitoring thresholds
			updateData.weightCriticalRobberyDropKg = weightMonitoring.weightCriticalRobberyDropKg;
			updateData.weightWarningDailyLossG = weightMonitoring.weightWarningDailyLossG;
			updateData.weightNormalDailyGainMinG = weightMonitoring.weightNormalDailyGainMinG;

			// Call API to update thresholds
			const response = await thresholdsService.updateThresholds(updateData);

			// Refresh metrics from the API response to ensure we have the latest data
			// This ensures any server-side validation or rounding is reflected
			metrics = transformThresholdsToMetrics(response.data);
			// Deep clone for comparison
			originalMetrics = JSON.parse(JSON.stringify(metrics));
			
			// Refresh weight monitoring thresholds
			weightMonitoring = extractWeightMonitoringThresholds(response.data);
			originalWeightMonitoring = JSON.parse(JSON.stringify(weightMonitoring));

			// Show success toast
			toastStore.add({
				title: "Success",
				description: "Threshold configurations updated successfully.",
				variant: "success",
				duration: 3000,
			});
		} catch (err) {
			const errorMessage = handleApiError(err, false);
			toastStore.add({
				title: "Update Failed",
				description: errorMessage || "Failed to update threshold configurations.",
				variant: "destructive",
				duration: 5000,
			});
			console.error("Failed to update configurations:", err);
		} finally {
			updating = false;
		}
	}
</script>

<svelte:head>
	<title>Configurations - BeeLive</title>
	<meta name="description" content="BeeLive Configurations" />
</svelte:head>

<section class="space-y-6">
	<header class="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
		<div class="flex items-start justify-between">
			<div>
				<p class="text-sm font-semibold uppercase tracking-wide text-primary">Configurations</p>
				<h1 class="text-2xl font-bold tracking-tight">Configure Metric Thresholds</h1>
				<p class="text-sm text-muted-foreground">
					Adjust the threshold ranges for Normal, Warning, and Critical states for each metric.
				</p>
			</div>
			<Button
				onclick={handleUpdate}
				disabled={!hasChanges || loading}
				class="ml-4"
			>
				Update
			</Button>
		</div>
	</header>

	{#if error}
		<div class="flex items-center justify-center p-8">
			<div class="text-center">
				<p class="text-lg font-semibold text-destructive">Failed to load configurations</p>
				<p class="text-sm text-muted-foreground">{error}</p>
			</div>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#if loading}
				{#each Array(8) as _, i}
					<MetricThresholdSkeleton />
				{/each}
			{:else}
				{#each metrics as metric (metric.id)}
					{#if metric.id !== 'weight'}
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
					{/if}
				{/each}
				
				<!-- Weight Monitoring Thresholds (separate component) -->
				<WeightThreshold
					bind:weightCriticalRobberyDropKg={weightMonitoring.weightCriticalRobberyDropKg}
					bind:weightWarningDailyLossG={weightMonitoring.weightWarningDailyLossG}
					bind:weightNormalDailyGainMinG={weightMonitoring.weightNormalDailyGainMinG}
				/>
			{/if}
		</div>
	{/if}
</section>

<!-- Confirmation Dialog -->
<Dialog bind:open={showConfirmDialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Confirm Update</DialogTitle>
			<DialogDescription>
				Are you sure you want to update the threshold configurations? This will affect how alerts are triggered.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button
				variant="outline"
				onclick={() => (showConfirmDialog = false)}
				disabled={updating}
			>
				Cancel
			</Button>
			<Button variant="default" onclick={confirmUpdate} disabled={updating}>
				{updating ? "Updating..." : "Confirm Update"}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
