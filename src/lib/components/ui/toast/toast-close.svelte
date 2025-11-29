<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import XIcon from "@tabler/icons-svelte/icons/x";
	import type { HTMLButtonAttributes } from "svelte/elements";

	let {
		class: className,
		onclick,
		...restProps
	}: HTMLButtonAttributes = $props();
</script>

<Button
	variant="ghost"
	size="icon-sm"
	class={cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50", className)}
	onclick={onclick}
	{...restProps}
>
	<XIcon />
	<span class="sr-only">Close</span>
</Button>

