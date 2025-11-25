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

	// Create range arrays for the sliders - initialize from props
	let normalRange = $state([normalMin, normalMax]);
	let warningRange = $state([warningMin, warningMax]);
	let criticalRange = $state([criticalMin, criticalMax]);

	// Sync ranges when props change from parent
	$effect(() => {
		normalRange = [normalMin, normalMax];
	});

	$effect(() => {
		warningRange = [warningMin, warningMax];
	});

	$effect(() => {
		criticalRange = [criticalMin, criticalMax];
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
						{formatValue(warningRange[0])} - {formatValue(warningRange[1])}
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
			/>
		</div>

		<!-- Critical Range -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Label for={`${id}-critical`} class="flex items-center gap-2">
					<Badge class="bg-red-500/20 text-red-500 border-red-500/30" variant="outline">
						Critical
					</Badge>
					<span class="text-sm text-muted-foreground">
						{formatValue(criticalRange[0])} - {formatValue(criticalRange[1])}
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
			/>
		</div>
	</CardContent>
</Card>

