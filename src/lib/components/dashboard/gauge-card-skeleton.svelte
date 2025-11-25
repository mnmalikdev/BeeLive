<script lang="ts">
	import {
		Card,
		CardContent,
		CardHeader,
		CardFooter,
	} from "$lib/components/ui/card/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
</script>

<Card
	class="w-full max-w-[280px] rounded-3xl border border-white/10 bg-linear-to-b from-[#151b2f] to-[#0d101f] text-white shadow-[0_15px_45px_rgba(15,16,32,0.55)]"
>
	<CardHeader class="pb-2 text-center">
		<div class="flex justify-end">
			<Skeleton class="h-5 w-16 rounded-full" />
		</div>
	</CardHeader>

	<CardContent class="flex flex-col items-center gap-5 pb-6">
		<div class="relative w-full max-w-[240px] aspect-square">
			<!-- Outer gauge ring skeleton with animation -->
			<div class="absolute inset-0 rounded-full border-18 border-white/10 animate-pulse"></div>
			<!-- Middle gauge ring skeleton with animation -->
			<div class="absolute inset-[18px] rounded-full border-18 border-white/10 animate-pulse" style="animation-delay: 0.2s;"></div>
			<!-- Inner gauge ring skeleton with animation -->
			<div class="absolute inset-[36px] rounded-full border-18 border-white/10 animate-pulse" style="animation-delay: 0.4s;"></div>
			<!-- Center content skeleton -->
			<div class="absolute inset-0 flex flex-col items-center justify-center gap-1">
				<Skeleton class="h-4 w-32 rounded" />
				<Skeleton class="h-8 w-20 rounded" />
				<Skeleton class="h-3 w-16 rounded" />
			</div>
		</div>

		<div class="flex w-full items-center justify-between text-xs">
			<Skeleton class="h-3 w-12 rounded" />
			<Skeleton class="h-3 w-12 rounded" />
			<Skeleton class="h-3 w-12 rounded" />
		</div>
	</CardContent>

	<CardFooter class="flex flex-col items-start gap-2 border-t border-white/5 pt-4 text-xs">
		<div class="flex items-center gap-2">
			<Skeleton class="h-3 w-16" />
			<Skeleton class="h-3 w-32" />
		</div>
		<div class="flex items-center gap-2">
			<Skeleton class="h-3 w-16" />
			<Skeleton class="h-3 w-32" />
		</div>
		<div class="flex items-center gap-2">
			<Skeleton class="h-3 w-16" />
			<Skeleton class="h-3 w-32" />
		</div>
	</CardFooter>
</Card>

