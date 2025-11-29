<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLDivAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	let {
		class: className,
		children,
		...restProps
	}: HTMLDivAttributes & {
		children?: Snippet;
	} = $props();
</script>

<div
	data-slot="toast-title"
	class={cn("text-sm font-semibold", className)}
	{...restProps}
>
	{@render children?.()}
</div>

