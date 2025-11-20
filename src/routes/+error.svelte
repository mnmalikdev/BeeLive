<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';

	let { status, error }: { status: number; error: App.Error } = $props();

	const title = status >= 500 ? 'Something went wrong' : 'Page unavailable';
	const description =
		error?.message ?? (status >= 500 ? 'An unexpected server error occurred.' : 'Please try again later.');

	function handleReload() {
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}

	function handleHome() {
		goto('/');
	}
</script>

<svelte:head>
	<title>{status} - {title}</title>
</svelte:head>

<section class="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
	<div class="space-y-3">
		<p class="text-sm font-semibold text-muted-foreground">Error {status}</p>
		<h1 class="text-3xl font-bold">{title}</h1>
		<p class="text-muted-foreground">{description}</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-3">
		<Button variant="default" onclick={handleReload}>
			Try again
		</Button>
		<Button variant="outline" onclick={handleHome}>
			Go home
		</Button>
	</div>
</section>

