<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import type { Icon } from "@tabler/icons-svelte";

	let { items }: { items: { title: string; href: string; icon?: Icon }[] } = $props();

	const fallbackHref = "/dashboard";
	const currentPath = $derived($page?.url?.pathname ?? fallbackHref);
	const normalizedPath = $derived(currentPath === "/" ? fallbackHref : currentPath);
</script>

<Sidebar.Group>
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu>
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContent={item.title}
						isActive={item.href === normalizedPath}
						onclick={() => goto(item.href)}
					>
						{#if item.icon}
							<item.icon />
						{/if}
						<span>{item.title}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
