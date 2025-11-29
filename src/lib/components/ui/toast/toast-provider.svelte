<script lang="ts">
	import { toastStore } from "$lib/stores/toast.store.js";
	import type { Toast } from "$lib/stores/toast.store.js";
	import ToastComponent from "./toast.svelte";
	import ToastTitle from "./toast-title.svelte";
	import ToastDescription from "./toast-description.svelte";
	import ToastClose from "./toast-close.svelte";
	import { onMount, onDestroy } from "svelte";

	let toasts = $state<Toast[]>([]);
	const dismissTimers = new Map<string, NodeJS.Timeout>();

	onMount(() => {
		// Subscribe to toast store
		const unsubscribe = toastStore.subscribe((currentToasts) => {
			const previousIds = new Set(toasts.map((t) => t.id));
			const currentIds = new Set(currentToasts.map((t) => t.id));

			// Clear timers for toasts that were removed
			previousIds.forEach((id) => {
				if (!currentIds.has(id)) {
					const timer = dismissTimers.get(id);
					if (timer) {
						clearTimeout(timer);
						dismissTimers.delete(id);
					}
				}
			});

			// Set up auto-dismiss timers for new toasts
			currentToasts.forEach((toast) => {
				if (!dismissTimers.has(toast.id) && toast.duration && toast.duration > 0) {
					const timer = setTimeout(() => {
						toastStore.dismiss(toast.id);
						dismissTimers.delete(toast.id);
					}, toast.duration);
					dismissTimers.set(toast.id, timer);
				}
			});

			toasts = currentToasts;
		});

		return () => {
			unsubscribe();
			// Clear all timers on cleanup
			dismissTimers.forEach((timer) => clearTimeout(timer));
			dismissTimers.clear();
		};
	});
</script>

<div
	class="pointer-events-none fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[420px]"
>
	{#each toasts as toast (toast.id)}
		<ToastComponent variant={toast.variant} class="pointer-events-auto">
			<div class="grid gap-1">
				{#if toast.title}
					<ToastTitle>{toast.title}</ToastTitle>
				{/if}
				{#if toast.description}
					<ToastDescription>{toast.description}</ToastDescription>
				{/if}
			</div>
			<ToastClose onclick={() => toastStore.dismiss(toast.id)} />
		</ToastComponent>
	{/each}
</div>

