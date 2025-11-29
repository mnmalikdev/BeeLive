<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { AppSidebar, SiteHeader } from '$lib/components/layout/index.js';
	import { ToastProvider } from '$lib/components/ui/toast/index.js';
	import { websocketService } from '$lib/services/websocket.service.js';
	
	let { children } = $props();

	// Initialize WebSocket connection on mount
	onMount(() => {
		// Only connect in browser environment
		if (typeof window !== 'undefined') {
			websocketService.connect();
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (typeof window !== 'undefined') {
			websocketService.disconnect();
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" />
	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2">
				<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
					{@render children()}
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>

<!-- Toast notifications provider -->
<ToastProvider />
