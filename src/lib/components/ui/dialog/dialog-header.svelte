<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	let {
		class: className,
		children,
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
	{@render children?.()}
</div>

