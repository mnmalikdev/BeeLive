<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardAction,
		CardFooter,
	} from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import Gauge from "svelte-gauge";

	type Severity = "safe" | "warning" | "critical";
	type GaugeSegment = {
		start: number;
		stop: number;
		color?: string;
		label?: string;
	};

	type GaugeCardProps = {
		id?: string;
		label: string;
		unit: string;
		value: string;
		rawValue?: number;
		percent: number;
		severity: Severity;
		scale: [string, string, string];
		segments?: GaugeSegment[];
		ranges?: {
			normal: string;
			warning: string;
			critical: string;
		};
	};

	let {
		id,
		label,
		unit,
		value,
		rawValue,
		percent,
		severity,
		scale,
		segments = [
			{ start: 0, stop: 33.33, color: "#22c55e", label: "Normal" },
			{ start: 33.33, stop: 66.67, color: "#eab308", label: "Warning" },
			{ start: 66.67, stop: 100, color: "#ef4444", label: "Critical" },
		],
		ranges,
	}: GaugeCardProps = $props();

	const statusConfig: Record<Severity, { color: string; label: string }> = {
		safe: { color: "#22c55e", label: "Normal" },
		warning: { color: "#eab308", label: "Warning" },
		critical: { color: "#ef4444", label: "Critical" },
	};

	const status = $derived(statusConfig[severity]);

	// Card background based on severity
	const palette: Record<Severity, { card: string }> = {
		safe: { card: "from-[#151b2f] to-[#0d101f]" },
		warning: { card: "from-[#22160c] to-[#140c06]" },
		critical: { card: "from-[#2b0e11] to-[#1a0709]" },
	};

	const colors = palette[severity];

	// Get the color of the current segment for the pointer
	const pointerColor = $derived.by(() => {
		for (const seg of segments) {
			if (percent >= seg.start && percent <= seg.stop) {
				return seg.color || "#ffffff";
			}
		}
		return "#ffffff";
	});
</script>

<Card
	class={`w-full max-w-[280px] rounded-3xl border border-white/10 bg-linear-to-b ${colors.card} text-white shadow-[0_15px_45px_rgba(15,16,32,0.55)]`}
>
	<CardHeader class="pb-2 text-center">
		<CardAction>
			<Badge
				class="px-2 py-0.5 text-xs font-medium capitalize"
				style={`background-color: ${status.color}; border-color: ${status.color}; color: white;`}
			>
				{status.label}
			</Badge>
		</CardAction>
	</CardHeader>

	<CardContent class="flex flex-col items-center gap-4 pb-6">
		<div class="gauge-wrapper w-full max-w-[220px]" style={`--pointer-color: ${pointerColor};`}>
			<Gauge
				value={percent}
				start={0}
				stop={100}
				startAngle={135}
				stopAngle={405}
				stroke={16}
				{segments}
				width="100%"
				class="gauge-component"
			>
				<div class="flex flex-col items-center justify-center gap-0.5 text-center text-white">
					<span class="text-sm font-medium text-white/80">{label}</span>
					<span class="text-3xl font-bold leading-none">{value}</span>
					<span class="text-sm text-white/60">{unit}</span>
				</div>
			</Gauge>
		</div>

		<div class="flex w-full items-center justify-between px-2 text-xs text-white/60">
			<span>{scale[0]}</span>
			<span>{scale[1]}</span>
			<span>{scale[2]}</span>
		</div>
	</CardContent>

	{#if ranges}
		<CardFooter class="flex flex-col gap-1.5 border-t border-white/10 pt-4 text-xs">
			<div class="flex items-center gap-2">
				<span class="w-16 font-medium text-green-400">Normal:</span>
				<span class="text-white/70">{ranges.normal}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-16 font-medium text-yellow-400">Warning:</span>
				<span class="text-white/70">{ranges.warning}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="w-16 font-medium text-red-400">Critical:</span>
				<span class="text-white/70">{ranges.critical}</span>
			</div>
		</CardFooter>
	{/if}
</Card>

<style>
	.gauge-wrapper {
		position: relative;
	}

	/* Background arc - subtle dark */
	:global(.gauge-wrapper .gauge-background) {
		stroke: rgba(255, 255, 255, 0.1) !important;
		opacity: 1 !important;
	}

	/* Hide the progress arc - we only want segments */
	:global(.gauge-wrapper .gauge-progress) {
		opacity: 0 !important;
	}

	/* Segment styling - vibrant colors */
	:global(.gauge-wrapper .gauge-segment) {
		opacity: 0.9 !important;
		stroke-width: 14px !important;
	}

	:global(.gauge-wrapper .gauge-segment-bg) {
		opacity: 0.3 !important;
	}

	/* Pointer (handle) - styled as a prominent dot with color */
	:global(.gauge-wrapper .gauge-pointer) {
		fill: var(--pointer-color, #ffffff) !important;
		stroke: #1a1a2e !important;
		stroke-width: 3px !important;
		r: 10 !important;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
		transition: fill 0.3s ease;
	}

	/* Segment labels */
	:global(.gauge-wrapper .gauge-segment-label) {
		fill: rgba(255, 255, 255, 0.9) !important;
		font-size: 10px !important;
		font-weight: 500 !important;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* Center content container */
	:global(.gauge-wrapper .gauge-slot-container) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Hide default labels (we use segment labels instead) */
	:global(.gauge-wrapper .gauge-labels) {
		display: none;
	}
</style>
