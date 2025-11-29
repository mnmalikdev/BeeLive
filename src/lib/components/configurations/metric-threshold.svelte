<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

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

	// Determine metric type for UI display
	const isNormalMetric = ['temp', 'humidity', 'activity'].includes(id);
	const isAscendingMetric = ['co2', 'swarm'].includes(id);
	const isInvertedMetric = ['battery', 'honey'].includes(id);
	const isWeight = id === 'weight';

	// Create range arrays for the sliders - initialize from props
	let normalRange = $state([normalMin, normalMax]);
	let warningRange = $state([warningMin, warningMax]);
	let criticalRange = $state([criticalMin, criticalMax]);

	// For normal metrics, automatically adjust warning and critical based on normal range
	// Pattern: Warning extends exactly 10 units beyond normal range on both sides
	//          Critical boundaries are at warning boundaries
	// Example (Humidity): Normal 30-80, Warning 20-90, Critical <20 or >90
	function autoAdjustNormalMetricThresholds() {
		if (!isNormalMetric) return;
		
		const step = unit === "%" || unit === "" ? 1 : 0.1;
		
		// Fixed extension: exactly 10 units on both sides for all normal metrics
		const extension = 10;
		
		// Warning range: extends exactly 10 units beyond normal range
		const newWarningMin = Math.max(min, Math.round((normalMin - extension) / step) * step);
		const newWarningMax = Math.min(max, Math.round((normalMax + extension) / step) * step);
		
		// Critical range: warning boundaries define where critical zones start
		// criticalMin = warningMin (boundary: anything < this is critical)
		// criticalMax = warningMax (boundary: anything > this is critical)
		const newCriticalMin = newWarningMin; // Boundary for critical low zone
		const newCriticalMax = newWarningMax; // Boundary for critical high zone
		
		// Update ranges
		warningRange = [newWarningMin, newWarningMax];
		criticalRange = [newCriticalMin, newCriticalMax];
	}

	// For ascending metrics (CO2, swarm risk), automatically adjust warning and critical
	// Pattern: User only defines normal range
	//          Warning starts immediately at normalMax (no gap - contiguous ranges)
	//          Critical starts immediately at warningMax (no gap - contiguous ranges)
	// Example (CO2): Normal 400-1000, Warning 1000-1500, Critical 1500-5000
	function autoAdjustAscendingMetricThresholds() {
		if (!isAscendingMetric) return;
		
		const step = unit === "%" || unit === "" ? 1 : 0.1;
		
		// Warning starts at normalMax (contiguous), extends to a reasonable upper bound
		// Use appropriate span based on metric type
		const normalSpan = normalMax - normalMin;
		let warningSpan: number;
		
		if (id === 'co2') {
			warningSpan = 500; // CO2: warning range of 500 ppm
		} else if (id === 'swarm') {
			warningSpan = 10; // Swarm: warning range of 10 points
		} else {
			warningSpan = Math.max(normalSpan * 0.5, 100);
		}
		
		// Warning starts at normalMax (contiguous - no gap)
		const newWarningMin = normalMax;
		const newWarningMax = Math.min(max, Math.round((newWarningMin + warningSpan) / step) * step);
		
		// Critical starts at warningMax (contiguous - no gap), extends to max
		const newCriticalMin = newWarningMax;
		const newCriticalMax = max; // Critical extends to maximum
		
		// Update ranges
		warningRange = [newWarningMin, newWarningMax];
		criticalRange = [newCriticalMin, newCriticalMax];
	}

	// For inverted metrics (battery, honey gain), automatically adjust warning and critical
	// Pattern: User only defines normal range
	//          Warning ends at normalMin (no gap - contiguous ranges)
	//          Critical ends at warningMin (no gap - contiguous ranges)
	// Example (Battery): Critical 0-30, Warning 30-70, Normal 70-100
	// Example (Honey Gain): Critical -1000--200, Warning -200-50, Normal 50-1000
	function autoAdjustInvertedMetricThresholds() {
		if (!isInvertedMetric) return;
		
		const step = unit === "%" || unit === "" ? 1 : 0.1;
		
		// Warning ends at normalMin (contiguous), starts at a reasonable lower bound
		// Use appropriate span based on metric type
		const normalSpan = normalMax - normalMin;
		let warningSpan: number;
		
		if (id === 'battery') {
			warningSpan = 40; // Battery: warning range of 40%
		} else if (id === 'honey') {
			warningSpan = 250; // Honey Gain: warning range of 250g
		} else {
			warningSpan = Math.max(normalSpan * 0.5, 100);
		}
		
		// Warning ends at normalMin (contiguous - no gap)
		const newWarningMax = normalMin;
		const newWarningMin = Math.max(min, Math.round((newWarningMax - warningSpan) / step) * step);
		
		// Critical ends at warningMin (contiguous - no gap), starts at min
		const newCriticalMax = newWarningMin;
		const newCriticalMin = min; // Critical starts at minimum
		
		// Update ranges
		warningRange = [newWarningMin, newWarningMax];
		criticalRange = [newCriticalMin, newCriticalMax];
	}

	// Sync ranges when props change from parent
	$effect(() => {
		normalRange = [normalMin, normalMax];
	});

	// Auto-adjust warning and critical when normal range changes
	$effect(() => {
		// Trigger auto-adjustment when normalRange changes
		const _ = normalRange[0] + normalRange[1]; // Track normalRange changes
		
		if (isNormalMetric) {
			autoAdjustNormalMetricThresholds();
		} else if (isAscendingMetric) {
			autoAdjustAscendingMetricThresholds();
		} else if (isInvertedMetric) {
			autoAdjustInvertedMetricThresholds();
		}
	});

	// Sync warning and critical ranges from props (only if not auto-adjusted)
	$effect(() => {
		if (!isNormalMetric && !isAscendingMetric && !isInvertedMetric) {
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
</script>

<Card class="border-border/60">
	<CardHeader>
		<CardTitle class="text-lg">{label}</CardTitle>
		<CardDescription>Configure threshold ranges for {label.toLowerCase()}</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		{#if isNormalMetric}
			<!-- Normal metrics: Critical (extremes) → Warning (sides) → Normal (middle) -->
			<div class="rounded-lg bg-muted/50 p-3 mb-4">
				<p class="text-xs text-muted-foreground">
					For {label.toLowerCase()}, warning extends exactly 10 units beyond normal range on both sides.
					Critical zones are at extremes (&lt; {formatValue(criticalMin)} or &gt; {formatValue(criticalMax)}).
				</p>
			</div>
		{:else if isAscendingMetric}
			<!-- Ascending metrics: Normal (low) → Warning (middle) → Critical (high) -->
			<div class="rounded-lg bg-muted/50 p-3 mb-4">
				<p class="text-xs text-muted-foreground">
					For {label.toLowerCase()}, you only need to define the normal range. Warning and critical ranges are automatically calculated.
					Warning starts after normal range, critical starts after warning range.
				</p>
			</div>
		{:else if isInvertedMetric}
			<!-- Inverted metrics: Critical (low) → Warning (middle) → Normal (high) -->
			<div class="rounded-lg bg-muted/50 p-3 mb-4">
				<p class="text-xs text-muted-foreground">
					For {label.toLowerCase()}, you only need to define the normal range. Warning and critical ranges are automatically calculated.
					Warning starts before normal range, critical starts before warning range.
				</p>
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
						{#if isNormalMetric || isAscendingMetric || isInvertedMetric}
							Auto-adjusted: {formatValue(warningRange[0])} - {formatValue(warningRange[1])}
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
				disabled={isNormalMetric || isAscendingMetric || isInvertedMetric}
			/>
			{#if isNormalMetric || isAscendingMetric || isInvertedMetric}
				<p class="text-xs text-muted-foreground">
					Warning range is automatically adjusted based on normal range.
					{#if isNormalMetric}
						Anything below {formatValue(warningRange[0])} or above {formatValue(warningRange[1])} is critical.
					{:else if isAscendingMetric}
						Warning: {formatValue(warningRange[0])} - {formatValue(warningRange[1])}, Critical: &gt; {formatValue(criticalRange[0])}
					{:else if isInvertedMetric}
						Warning: {formatValue(warningRange[0])} - {formatValue(warningRange[1])}, Critical: &lt; {formatValue(criticalRange[1])}
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
						{#if isNormalMetric}
							&lt; {formatValue(criticalRange[0])} or &gt; {formatValue(criticalRange[1])}
						{:else if isAscendingMetric}
							Auto-adjusted: {formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
						{:else if isInvertedMetric}
							Auto-adjusted: {formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
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
				disabled={isNormalMetric || isAscendingMetric || isInvertedMetric}
			/>
			{#if isNormalMetric || isAscendingMetric || isInvertedMetric}
				<p class="text-xs text-muted-foreground">
					Critical range is automatically adjusted based on normal range.
					{#if isNormalMetric}
						Values below {formatValue(criticalRange[0])} or above {formatValue(criticalRange[1])} are critical.
					{:else if isAscendingMetric}
						Critical: {formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
					{:else if isInvertedMetric}
						Critical: {formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
					{/if}
				</p>
			{/if}
		</div>
	</CardContent>
</Card>

