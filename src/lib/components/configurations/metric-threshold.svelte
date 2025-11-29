<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import {
		getMetricConfig,
		autoAdjustAscendingThresholds,
		autoAdjustInvertedThresholds,
		autoAdjustRangeThresholds,
		type MetricConfig
	} from "$lib/config/metrics.config.js";

	type MetricThresholdProps = {
		id: string;
		label: string;
		unit: string;
		min: number;
		max: number;
		normalMin: number;
		normalMax: number;
		warningMin: number;
		warningMax: number;
		criticalMin: number;
		criticalMax: number;
	};

	let {
		id,
		label,
		unit,
		min,
		max,
		normalMin = $bindable(0),
		normalMax = $bindable(100),
		warningMin = $bindable(0),
		warningMax = $bindable(100),
		criticalMin = $bindable(0),
		criticalMax = $bindable(100),
	}: MetricThresholdProps = $props();

	// Get metric configuration from centralized config
	const metricConfig = $derived(getMetricConfig(id));
	const metricType = $derived(metricConfig?.type || 'range');
	const isAutoAdjusted = $derived(metricConfig?.allowManualThresholds === false);

	// Create range arrays for the sliders
	let normalRange = $state([normalMin, normalMax]);
	let warningRange = $state([warningMin, warningMax]);
	let criticalRange = $state([criticalMin, criticalMax]);

	// Auto-adjust warning and critical when normal range changes
	function autoAdjustThresholds() {
		if (!metricConfig || metricConfig.allowManualThresholds) return;
		
		try {
			if (metricConfig.type === 'ascending') {
				const adjusted = autoAdjustAscendingThresholds(id, normalRange[1], max);
				warningRange = [adjusted.warningMin, adjusted.warningMax];
				criticalRange = [adjusted.criticalMin, adjusted.criticalMax];
			} else if (metricConfig.type === 'inverted') {
				const adjusted = autoAdjustInvertedThresholds(id, normalRange[0], min);
				warningRange = [adjusted.warningMin, adjusted.warningMax];
				criticalRange = [adjusted.criticalMin, adjusted.criticalMax];
			} else {
				const adjusted = autoAdjustRangeThresholds(id, normalRange[0], normalRange[1], min, max);
				warningRange = [adjusted.warningMin, adjusted.warningMax];
				criticalRange = [adjusted.criticalMin, adjusted.criticalMax];
			}
		} catch (e) {
			console.error('Failed to auto-adjust thresholds:', e);
		}
	}

	// Sync ranges when props change from parent
	$effect(() => {
		normalRange = [normalMin, normalMax];
	});

	// Auto-adjust when normal range changes
	$effect(() => {
		// Track normalRange changes
		const _ = normalRange[0] + normalRange[1];
		autoAdjustThresholds();
	});

	// Sync warning and critical ranges from props (only if not auto-adjusted)
	$effect(() => {
		if (!isAutoAdjusted) {
			warningRange = [warningMin, warningMax];
			criticalRange = [criticalMin, criticalMax];
		}
	});

	// Update parent props when slider ranges change
	$effect(() => {
		normalMin = normalRange[0];
		normalMax = normalRange[1];
	});

	$effect(() => {
		warningMin = warningRange[0];
		warningMax = warningRange[1];
	});

	$effect(() => {
		criticalMin = criticalRange[0];
		criticalMax = criticalRange[1];
	});

	const formatValue = (val: number): string => {
		if (unit === "%" || unit === "") {
			return `${Math.round(val)}${unit}`;
		}
		return `${val.toFixed(1)}${unit}`;
	};

	// Get description for the metric type
	const typeDescription = $derived.by(() => {
		if (!metricConfig) return '';
		
		switch (metricConfig.type) {
			case 'ascending':
				return `Lower values are better. Warning and critical zones are automatically calculated above the normal range.`;
			case 'inverted':
				return `Higher values are better. Warning and critical zones are automatically calculated below the normal range.`;
			case 'range':
				return `Middle values are optimal. Warning extends ${metricConfig.autoAdjust.warningExtension || 10} units beyond normal on both sides.`;
			default:
				return '';
		}
	});
</script>

<Card class="border-border/60">
	<CardHeader>
		<CardTitle class="text-lg">{label}</CardTitle>
		<CardDescription>Configure threshold ranges for {label.toLowerCase()}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		{#if isAutoAdjusted && typeDescription}
			<div class="rounded-lg bg-muted/50 p-3 mb-4">
				<p class="text-xs text-muted-foreground">{typeDescription}</p>
			</div>
		{/if}

		<!-- Normal Range -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for={`${id}-normal`} class="flex items-center gap-2">
					<Badge class="bg-green-500/20 text-green-500 border-green-500/30" variant="outline">
						Normal
					</Badge>
					<span class="text-sm text-muted-foreground">
						{formatValue(normalRange[0])} - {formatValue(normalRange[1])}
					</span>
				</Label>
			</div>
			<Slider
				id={`${id}-normal`}
				type="multiple"
				bind:value={normalRange}
				min={min}
				max={max}
				step={unit === "%" || unit === "" ? 1 : 0.1}
			/>
		</div>

		<!-- Warning Range -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for={`${id}-warning`} class="flex items-center gap-2">
					<Badge class="bg-yellow-500/20 text-yellow-500 border-yellow-500/30" variant="outline">
						Warning
					</Badge>
					<span class="text-sm text-muted-foreground">
						{#if isAutoAdjusted}
							Auto: {formatValue(warningRange[0])} - {formatValue(warningRange[1])}
						{:else}
							{formatValue(warningRange[0])} - {formatValue(warningRange[1])}
						{/if}
					</span>
				</Label>
			</div>
			<Slider
				id={`${id}-warning`}
				type="multiple"
				bind:value={warningRange}
				min={min}
				max={max}
				step={unit === "%" || unit === "" ? 1 : 0.1}
				disabled={isAutoAdjusted}
			/>
			{#if isAutoAdjusted}
				<p class="text-xs text-muted-foreground">
					{#if metricType === 'ascending'}
						Values from {formatValue(warningRange[0])} to {formatValue(warningRange[1])} trigger warning.
					{:else if metricType === 'inverted'}
						Values from {formatValue(warningRange[0])} to {formatValue(warningRange[1])} trigger warning.
					{:else}
						Values outside normal range but within {formatValue(warningRange[0])} - {formatValue(warningRange[1])} trigger warning.
					{/if}
				</p>
			{/if}
		</div>

		<!-- Critical Range -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for={`${id}-critical`} class="flex items-center gap-2">
					<Badge class="bg-red-500/20 text-red-500 border-red-500/30" variant="outline">
						Critical
					</Badge>
					<span class="text-sm text-muted-foreground">
						{#if metricType === 'range'}
							&lt; {formatValue(criticalRange[0])} or &gt; {formatValue(criticalRange[1])}
						{:else if isAutoAdjusted}
							Auto: {formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
						{:else}
							{formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
						{/if}
					</span>
				</Label>
			</div>
			<Slider
				id={`${id}-critical`}
				type="multiple"
				bind:value={criticalRange}
				min={min}
				max={max}
				step={unit === "%" || unit === "" ? 1 : 0.1}
				disabled={isAutoAdjusted}
			/>
			{#if isAutoAdjusted}
				<p class="text-xs text-muted-foreground">
					{#if metricType === 'ascending'}
						Values above {formatValue(criticalRange[0])} are critical.
					{:else if metricType === 'inverted'}
						Values below {formatValue(criticalRange[1])} are critical.
					{:else}
						Values below {formatValue(criticalRange[0])} or above {formatValue(criticalRange[1])} are critical.
					{/if}
				</p>
			{/if}
		</div>
	</CardContent>
</Card>
