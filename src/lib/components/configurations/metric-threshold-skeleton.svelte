<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
</script>

<Card class="border-border/60">
	<CardHeader>
		<Skeleton class="h-6 w-48" />
		<Skeleton class="mt-2 h-4 w-64" />
	</CardHeader>
	<CardContent class="space-y-6">
		<!-- Normal Range Skeleton -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-24" />
				<Skeleton class="h-4 w-32" />
			</div>
			<Skeleton class="h-2 w-full rounded-full" />
		</div>

		<!-- Warning Range Skeleton -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-24" />
				<Skeleton class="h-4 w-32" />
			</div>
			<Skeleton class="h-2 w-full rounded-full" />
		</div>

		<!-- Critical Range Skeleton -->
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<Skeleton class="h-5 w-24" />
				<Skeleton class="h-4 w-32" />
			</div>
			<Skeleton class="h-2 w-full rounded-full" />
		</div>
	</CardContent>
</Card>

