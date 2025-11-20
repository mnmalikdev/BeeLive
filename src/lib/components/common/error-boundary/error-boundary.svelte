<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';

	let { children, onError }: { children: Snippet; onError: (error: Error) => void } = $props();

	let error: Error | null = $state(null);

	// Only set up error handling on the client
	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			error = event.error;
			onError?.(event.error);
		};

		window.addEventListener('error', handleError);
		return () => window.removeEventListener('error', handleError);
	});

	function handleReset() {
		error = null;
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}
</script>

{#if error}
		<div class="flex min-h-screen flex-col items-center justify-center p-4">
			<div class="max-w-md text-center">
				<h1 class="mb-4 text-2xl font-bold text-destructive">Something went wrong</h1>
				<p class="mb-6 text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
				<Button onclick={handleReset}>Reload Page</Button>
			</div>
		</div>
	{/if}


