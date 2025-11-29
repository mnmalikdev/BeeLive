<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const toastVariants = tv({
		base: "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
		variants: {
			variant: {
				default: "border bg-background text-foreground",
				destructive:
					"destructive group border-destructive bg-destructive text-destructive-foreground",
				success: "border-green-500 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100",
				warning: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100",
				info: "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type ToastVariant = VariantProps<typeof toastVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLDivAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	let {
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLDivAttributes> & {
		variant?: ToastVariant;
		children?: Snippet;
	} = $props();
</script>

<div
	data-slot="toast"
	class={cn(toastVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</div>

