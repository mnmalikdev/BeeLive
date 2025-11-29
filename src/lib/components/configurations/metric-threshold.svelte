<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { untrack } from "svelte";
	import {
		getMetricConfig,
		autoAdjustAscendingThresholds,
		autoAdjustInvertedThresholds,
		autoAdjustRangeThresholds,
		validateNormalRange,
		type ValidationError
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
	const metricConfig = getMetricConfig(id); // Not derived - id doesn't change
	const metricType = metricConfig?.type || 'range';
	const isAutoAdjusted = metricConfig?.allowManualThresholds === false;

	// Calculate appropriate step size based on range
	// Larger ranges get bigger steps to reduce update frequency
	const stepSize = $derived.by(() => {
		const range = max - min;
		if (unit === '%' || unit === '') return 1;
		if (range >= 1000) return 10;  // CO2: 400-4000 → step 10
		if (range >= 500) return 5;    // Honey: -500-1000 → step 5
		if (range >= 100) return 1;
		return 0.5;
	});

	// Create range arrays for the sliders - initialized from props
	let normalRange = $state([normalMin, normalMax]);
	let warningRange = $state([warningMin, warningMax]);
	let criticalRange = $state([criticalMin, criticalMax]);

	// Validation state
	let validationErrors = $state<ValidationError[]>([]);
	const hasErrors = $derived(validationErrors.length > 0);

	// Validate and auto-adjust thresholds
	function handleNormalRangeChange() {
		// Validate
		const result = validateNormalRange(id, normalRange[0], normalRange[1], min, max);
		validationErrors = result.errors;
		
		if (!result.valid || !metricConfig || metricConfig.allowManualThresholds) {
			return;
		}
		
		// Auto-adjust warning and critical
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
		
		// Update parent props (use untrack to prevent circular updates)
		untrack(() => {
			normalMin = normalRange[0];
			normalMax = normalRange[1];
			warningMin = warningRange[0];
			warningMax = warningRange[1];
			criticalMin = criticalRange[0];
			criticalMax = criticalRange[1];
		});
	}

	// Handle slider change events directly instead of using effects
	function onNormalSliderChange(newValue: number[]) {
		normalRange = newValue;
		handleNormalRangeChange();
	}

	function onWarningSliderChange(newValue: number[]) {
		if (isAutoAdjusted) return;
		warningRange = newValue;
		untrack(() => {
			warningMin = newValue[0];
			warningMax = newValue[1];
		});
	}

	function onCriticalSliderChange(newValue: number[]) {
		if (isAutoAdjusted) return;
		criticalRange = newValue;
		untrack(() => {
			criticalMin = newValue[0];
			criticalMax = newValue[1];
		});
	}

	// Initialize from props only once on mount (not reactive)
	$effect(() => {
		// Only sync from parent if values are significantly different
		// This prevents fighting between parent and local state
		const normalChanged = Math.abs(normalMin - normalRange[0]) > stepSize || 
		                      Math.abs(normalMax - normalRange[1]) > stepSize;
		if (normalChanged) {
			normalRange = [normalMin, normalMax];
		}
		
		if (!isAutoAdjusted) {
			const warningChanged = Math.abs(warningMin - warningRange[0]) > stepSize ||
			                       Math.abs(warningMax - warningRange[1]) > stepSize;
			const criticalChanged = Math.abs(criticalMin - criticalRange[0]) > stepSize ||
			                        Math.abs(criticalMax - criticalRange[1]) > stepSize;
			if (warningChanged) warningRange = [warningMin, warningMax];
			if (criticalChanged) criticalRange = [criticalMin, criticalMax];
		}
	});

	const formatValue = (val: number): string => {
		if (unit === "%" || unit === "") {
			return `${Math.round(val)}${unit}`;
		}
		// For large ranges, show whole numbers
		if (max - min >= 100) {
			return `${Math.round(val)}${unit}`;
		}
		return `${val.toFixed(1)}${unit}`;
	};

	// Get description for the metric type
	const typeDescription = metricConfig ? (() => {
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
	})() : '';

	// Get error for a specific field
	function getFieldError(field: string): string | undefined {
		return validationErrors.find(e => e.field === field)?.message;
	}

	const normalError = $derived(getFieldError('normal'));
	const warningError = $derived(getFieldError('warning'));
	const criticalError = $derived(getFieldError('critical'));
</script>

<Card class="border-border/60 {hasErrors ? 'border-red-500/50' : ''}">
	<CardHeader>
		<div class="flex items-center justify-between">
			<div>
				<CardTitle class="text-lg">{label}</CardTitle>
				<CardDescription>Configure threshold ranges for {label.toLowerCase()}</CardDescription>
			</div>
			{#if hasErrors}
				<Badge variant="destructive" class="text-xs">Invalid</Badge>
			{/if}
		</div>
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
					<Badge class="bg-green-500/20 text-green-500 border-green-500/30 {normalError ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}" variant="outline">
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
				value={normalRange}
				onValueChange={onNormalSliderChange}
				min={min}
				max={max}
				step={stepSize}
			/>
			{#if normalError}
				<p class="text-xs text-red-500 flex items-center gap-1">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
					</svg>
					{normalError}
				</p>
			{/if}
		</div>

		<!-- Warning Range -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for={`${id}-warning`} class="flex items-center gap-2">
					<Badge class="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 {warningError ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}" variant="outline">
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
				value={warningRange}
				onValueChange={onWarningSliderChange}
				min={min}
				max={max}
				step={stepSize}
				disabled={isAutoAdjusted}
			/>
			{#if warningError}
				<p class="text-xs text-red-500 flex items-center gap-1">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
					</svg>
					{warningError}
				</p>
			{:else if isAutoAdjusted}
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
					<Badge class="bg-red-500/20 text-red-500 border-red-500/30 {criticalError ? 'animate-pulse' : ''}" variant="outline">
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
				value={criticalRange}
				onValueChange={onCriticalSliderChange}
				min={min}
				max={max}
				step={stepSize}
				disabled={isAutoAdjusted}
			/>
			{#if criticalError}
				<p class="text-xs text-red-500 flex items-center gap-1">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
					</svg>
					{criticalError}
				</p>
			{:else if isAutoAdjusted}
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
