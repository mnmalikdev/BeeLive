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

	// Cache sorted segments - they don't change, so sort once
	const sortedSegments = $derived(
		[...segments].sort((a, b) => {
			const aStart = "start" in a ? a.start : a[0];
			const bStart = "start" in b ? b.start : b[0];
			return aStart - bStart;
		})
	);

	// Determine which segment the current value falls into
	// IMPORTANT: Check segments in order and return the FIRST match to avoid overlaps
	// Use strict boundaries: [start, stop) for all segments except the last one
	const currentSegment = $derived.by(() => {
		for (let i = 0; i < sortedSegments.length; i++) {
			const segment = sortedSegments[i];
			const start = "start" in segment ? segment.start : segment[0];
			const stop = "stop" in segment ? segment.stop : segment[1];
			
			// Check if percent falls within this segment
			// For the last segment, include the upper bound (<=) to cover 100%
			// For all others, use strict upper bound (<) to prevent overlaps at boundaries
			if (i === sortedSegments.length - 1) {
				if (percent >= start && percent <= stop) {
					return segment;
				}
			} else {
				// Strict upper bound to prevent overlaps
				if (percent >= start && percent < stop) {
					return segment;
				}
			}
		}
		// Fallback to last segment if no match
		return sortedSegments[sortedSegments.length - 1] || segments[0];
	});

	// Determine current status based on the segment's color or label
	// Optimized: check color first (most common case), then label
	const currentStatus = $derived.by(() => {
		const segment = currentSegment;
		if (!segment || !("color" in segment)) return "safe";
		
		const color = segment.color;
		if (!color) {
			const label = segment.label?.toLowerCase() || "";
			if (label.includes("warning")) return "warning";
			if (label.includes("critical")) return "critical";
			return "safe";
		}
		
		// Direct color comparison (faster than includes)
		if (color === "#22c55e") return "safe";
		if (color === "#eab308") return "warning";
		if (color === "#ef4444") return "critical";
		
		// Fallback to lowercase check for other colors
		const colorLower = color.toLowerCase();
		if (colorLower.includes("green")) return "safe";
		if (colorLower.includes("yellow")) return "warning";
		if (colorLower.includes("red")) return "critical";
		
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

	// Use the severity prop directly for the badge, not the calculated currentStatus
	// This ensures the badge matches the actual severity calculation from transformTelemetryToMetrics
	// The segments are only for visual display on the gauge, not for determining severity
	const status = $derived(statusConfig[severity]);

	// Calculate arrow position for semi-circle gauge
	// Gauge goes from left (0%) to right (100%) in a 180-degree arc
	const arrowRadius = 75;
	
	// Convert percent (0-100) to angle in degrees for semi-circle
	// 0% = -90° (left), 50% = 0° (top), 100% = 90° (right)
	const arrowPosition = $derived.by(() => {
		const angleDegrees = (percent / 100) * 180 - 90; // -90 to +90 degrees
		const angleRadians = angleDegrees * (Math.PI / 180);
		
		// Calculate position on semi-circle
		const x = arrowRadius + arrowRadius * Math.sin(angleRadians);
		const y = arrowRadius - arrowRadius * Math.cos(angleRadians);
		
		// Rotation angle for the arrow (points in the direction of the value)
		const rotation = angleDegrees;
		
		return { x, y, rotation };
	});
	
	const arrowX = $derived(arrowPosition.x);
	const arrowY = $derived(arrowPosition.y);
	const arrowRotationAngle = $derived(arrowPosition.rotation);
	
	// Arrow color is white for better visibility
	const arrowColor = '#ffffff';

	const palette: Record<Severity, { card: string }> = {
		safe: {
			card: "from-[#151b2f] to-[#0d101f]",
		},
		warning: {
			card: "from-[#22160c] to-[#140c06]",
		},
		critical: {
			card: "from-[#2b0e11] to-[#1a0709]",
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
				style={`--arrow-x: ${arrowX}px; --arrow-y: ${arrowY}px;`}
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

	/* Dot indicator */
	.gauge-arrow {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 12px;
		height: 12px;
		background-color: white;
		border-radius: 50%;
		transform: translate(calc(-50% + var(--arrow-x) - 75px), calc(-50% + var(--arrow-y) - 75px));
		pointer-events: none;
		z-index: 10;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
		border: 2px solid rgba(0, 0, 0, 0.2);
	}

	/* Ensure center content is perfectly centered */
	:global(.gauge-wrapper .custom-gauge .gauge-slot-container) {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
</style>

