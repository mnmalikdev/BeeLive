<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		message?: string;
		fullScreen?: boolean;
	}

	let { size = 'md', message, fullScreen = false }: Props = $props();

	const sizeClasses = {
		sm: 'size-4',
		md: 'size-8',
		lg: 'size-12',
	};
</script>

<div class="flex flex-col items-center justify-center gap-4" class:min-h-screen={fullScreen} class:p-4={!fullScreen}>
	<div
		class={cn(
			'animate-spin rounded-full border-2 border-primary border-t-transparent',
			sizeClasses[size]
		)}
	></div>
	{#if message}
		<p class="text-sm text-muted-foreground">{message}</p>
	{/if}
</div>


