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
	type GaugeSegment =
		| {
				start: number;
				stop: number;
				color?: string;
				label?: string;
		  }
		| [number, number];

	type GaugeCardProps = {
		label: string;
		unit: string;
		value: string;
		percent: number;
		severity: Severity;
		scale: [string, string, string];
		centerLabel?: string;
		centerSubLabel?: string;
		segments?: GaugeSegment[];
		ranges?: {
			normal: string;
			warning: string;
			critical: string;
		};
	};

	let {
		label,
		unit,
		value,
		percent,
		severity,
		scale,
		centerLabel,
		centerSubLabel,
		segments = [
			{ start: 0, stop: 60, color: "#22c55e", label: "Normal" },
			{ start: 60, stop: 85, color: "#eab308", label: "Warning" },
			{ start: 85, stop: 100, color: "#ef4444", label: "Critical" },
		],
		ranges,
	}: GaugeCardProps = $props();

	// Determine which segment the current value falls into based on actual segments
	// Segments should be checked in order, with proper boundary handling
	const currentSegment = $derived.by(() => {
		// Sort segments by start value to ensure proper order
		const sortedSegments = [...segments].sort((a, b) => {
			const aStart = "start" in a ? a.start : a[0];
			const bStart = "start" in b ? b.start : b[0];
			return aStart - bStart;
		});

		for (let i = 0; i < sortedSegments.length; i++) {
			const segment = sortedSegments[i];
			const start = "start" in segment ? segment.start : segment[0];
			const stop = "stop" in segment ? segment.stop : segment[1];
			
			// For the last segment, include the upper bound
			// For other segments, use >= start and < stop (except for the boundary)
			if (i === sortedSegments.length - 1) {
				if (percent >= start && percent <= stop) {
					return segment;
				}
			} else {
				if (percent >= start && percent < stop) {
					return segment;
				}
			}
		}
		// Fallback to last segment if no match (shouldn't happen, but safety)
		return sortedSegments[sortedSegments.length - 1] || segments[0];
	});

	// Determine current status based on the segment's color or label
	const currentStatus = $derived.by(() => {
		const segment = currentSegment;
		if (!segment || !("color" in segment)) return "safe";
		
		const color = segment.color?.toLowerCase() || "";
		if (color.includes("#22c55e") || color.includes("green")) return "safe";
		if (color.includes("#eab308") || color.includes("yellow")) return "warning";
		if (color.includes("#ef4444") || color.includes("red")) return "critical";
		
		// Fallback to label if color doesn't match
		const label = segment.label?.toLowerCase() || "";
		if (label.includes("normal") || label.includes("safe")) return "safe";
		if (label.includes("warning")) return "warning";
		if (label.includes("critical")) return "critical";
		
		return "safe";
	});

	const statusConfig: Record<
		Severity,
		{
			color: string;
			label: string;
		}
	> = {
		safe: { color: "#22c55e", label: "Normal" },
		warning: { color: "#eab308", label: "Warning" },
		critical: { color: "#ef4444", label: "Critical" },
	};

	const status = $derived(statusConfig[currentStatus]);

	// Calculate arrow position using the exact same formula as svelte-gauge
	// svelte-gauge uses: scale(value, 0, 100, 0, 360) then polarToCartesian
	// scale function: targetStart + ((targetStop - targetStart) * (value - start)) / (stop - start)
	// For our case: 0 + ((360 - 0) * (percent - 0)) / (100 - 0) = (percent / 100) * 360
	const startAngle = 0;
	const stopAngle = 360;
	const gaugeAngleDegrees = $derived((percent / 100) * (stopAngle - startAngle) + startAngle);
	const gaugeAngleRadians = $derived(gaugeAngleDegrees * (Math.PI / 180));
	
	// Use the same polarToCartesian formula as svelte-gauge
	// x = radius - adjustedRadius * sin(angle)
	// y = radius + adjustedRadius * cos(angle)
	// For positioning, we'll use a radius that matches the gauge (approximately 75-80px)
	const arrowRadius = 75;
	const arrowOffset = 0; // borderAdjusted would be stroke/2, but we want arrow on the arc
	const arrowX = $derived(arrowRadius - (arrowRadius - arrowOffset) * Math.sin(gaugeAngleRadians));
	const arrowY = $derived(arrowRadius + (arrowRadius - arrowOffset) * Math.cos(gaugeAngleRadians));
	
	// Calculate the angle for arrow rotation (pointing along the arc)
	const arrowRotationAngle = $derived((Math.atan2(arrowY - arrowRadius, arrowX - arrowRadius) * 180) / Math.PI);
	
	// Arrow color should match the segment color, not the status
	const arrowColor = $derived.by(() => {
		const segment = currentSegment;
		if (segment && "color" in segment && segment.color) {
			return segment.color;
		}
		return status.color;
	});

	const palette: Record<
		Severity,
		{
			card: string;
			active: string;
			bg: string;
		}
	> = {
		safe: {
			card: "from-[#151b2f] to-[#0d101f]",
			active: "#22c55e",
			bg: "rgba(255,255,255,0.15)",
		},
		warning: {
			card: "from-[#22160c] to-[#140c06]",
			active: "#eab308",
			bg: "rgba(234,179,8,0.3)",
		},
		critical: {
			card: "from-[#2b0e11] to-[#1a0709]",
			active: "#ef4444",
			bg: "rgba(239,68,68,0.35)",
		},
	};

	const colors = palette[severity];

	let gaugeContainer: HTMLDivElement;
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

	<CardContent class="flex flex-col items-center gap-5 pb-6">
		<div class="w-full max-w-[240px] gauge-wrapper" bind:this={gaugeContainer}>
			<Gauge
				value={percent}
				start={0}
				stop={100}
				stroke={18}
				segments={segments}
				width="100%"
				class="text-white custom-gauge"
			>
				<div class="flex flex-col items-center justify-center gap-0.5 text-center text-white">
					<span class="text-sm font-medium text-white/90">{label}</span>
					<span class="text-3xl font-semibold leading-none">{value}</span>
					<span class="text-sm text-white/70">{unit}</span>
				</div>
			</Gauge>
			<div
				class="gauge-arrow"
				style={`--arrow-x: ${arrowX}px; --arrow-y: ${arrowY}px; --arrow-rotation: ${arrowRotationAngle}deg; --arrow-color: ${arrowColor};`}
			></div>
		</div>

		<div class="flex w-full items-center justify-between text-xs text-white/70">
			<span>{scale[0]}</span>
			<span>{scale[1]}</span>
			<span>{scale[2]}</span>
		</div>
	</CardContent>

	{#if ranges}
		<CardFooter class="flex flex-col gap-2 pt-4 text-xs">
			<div class="flex items-center gap-2">
				<span class="font-medium text-white/90">Normal:</span>
				<span class="text-white/70">{ranges.normal}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="font-medium text-white/90">Warning:</span>
				<span class="text-white/70">{ranges.warning}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="font-medium text-white/90">Critical:</span>
				<span class="text-white/70">{ranges.critical}</span>
			</div>
		</CardFooter>
	{/if}
</Card>

<style>
	.gauge-wrapper {
		position: relative;
	}

	/* Make progress fill transparent */
	:global(.gauge-wrapper .custom-gauge .gauge-progress) {
		opacity: 0;
		stroke: transparent;
	}

	/* Style segments with proper colors - green, yellow, red */
	:global(.gauge-wrapper .custom-gauge .gauge-segment) {
		opacity: 0.5;
	}

	:global(.gauge-wrapper .custom-gauge .gauge-segment-bg) {
		opacity: 0.35;
	}

	/* Hide default pointer dot */
	:global(.gauge-wrapper .custom-gauge .gauge-pointer) {
		opacity: 0;
		fill: none;
		stroke: none;
	}

	/* Arrow indicator */
	.gauge-arrow {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-bottom: 14px solid var(--arrow-color);
		transform-origin: center bottom;
		/* 
		 * Position arrow using exact coordinates from polarToCartesian calculation
		 * This matches svelte-gauge's handle position exactly
		 */
		transform: translate(calc(-50% + var(--arrow-x) - 75px), calc(-50% + var(--arrow-y) - 75px))
		           rotate(calc(var(--arrow-rotation) + 90deg));
		pointer-events: none;
		z-index: 10;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	/* Ensure center content is perfectly centered */
	:global(.gauge-wrapper .custom-gauge .gauge-slot-container) {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
</style>

