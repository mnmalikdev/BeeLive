<script lang="ts">
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import HistoryIcon from "@tabler/icons-svelte/icons/history";
	import InnerShadowTopIcon from "@tabler/icons-svelte/icons/inner-shadow-top";
	import SettingsIcon from "@tabler/icons-svelte/icons/settings";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import favicon from "$lib/assets/favicon.svg";
	import type { ComponentProps } from "svelte";

	const data = {
		user: {
			name: "BeeLive",
			email: "info@processalerts.com",
			avatar: favicon,
		},
		navMain: [
			{
				title: "Dashboard",
				href: "/dashboard",
				icon: DashboardIcon,
			},
			{
				title: "History",
				href: "/history",
				icon: HistoryIcon,
			},
			{
				title: "Configurations",
				href: "/configurations",
				icon: SettingsIcon,
			},
		],
	};

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:p-1.5">
					{#snippet child({ props })}
						<a href="/dashboard" {...props}>
							<InnerShadowTopIcon class="size-5" />
							<span class="text-base font-semibold">BeeLive</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
