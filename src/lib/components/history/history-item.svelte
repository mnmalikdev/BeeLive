<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

	type HistoryItemProps = {
		title: string;
		description: string;
		date: Date;
		status?: "normal" | "warning" | "critical";
	};

	let { title, description, date, status = "normal" }: HistoryItemProps = $props();

	// Format date as DD MM YY : HH:MM (24-hour format)
	const formatDateTime = (date: Date): string => {
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear().toString().slice(-2);
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");

		return `${day} ${month} ${year} : ${hours}:${minutes}`;
	};

	const formattedDateTime = $derived(formatDateTime(date));

	const statusConfig = {
		normal: { color: "bg-green-500/20 text-green-500 border-green-500/30", label: "Normal" },
		warning: { color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30", label: "Warning" },
		critical: { color: "bg-red-500/20 text-red-500 border-red-500/30", label: "Critical" },
	};

	const statusStyle = $derived(statusConfig[status]);
</script>

<Card class="border-border/60">
	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1">
				<CardTitle class="text-base font-semibold">{title}</CardTitle>
				<p class="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<Badge class={statusStyle.color} variant="outline">
				{statusStyle.label}
			</Badge>
		</div>
	</CardHeader>
	<CardContent>
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<time datetime={date.toISOString()} class="font-mono">
				{formattedDateTime}
			</time>
		</div>
	</CardContent>
</Card>

