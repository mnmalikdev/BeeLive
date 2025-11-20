<svelte:head>
	<title>Settings - Process Alerts</title>
	<meta name="description" content="Process Alerts Settings" />
</svelte:head>

<section class="space-y-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
	<header>
		<p class="text-sm font-semibold uppercase tracking-wide text-primary">Settings</p>
		<h1 class="text-2xl font-bold tracking-tight">Customize your workspace</h1>
		<p class="text-sm text-muted-foreground">
			Account preferences, notification rules, and integrations will be configurable here.
		</p>
	</header>
	<div class="grid gap-4 md:grid-cols-2">
		<div class="rounded-lg border border-dashed border-border/60 p-4">
			<p class="text-sm font-semibold">Profile</p>
			<p class="text-sm text-muted-foreground">User info, access, and authentication.</p>
		</div>
		<div class="rounded-lg border border-dashed border-border/60 p-4">
			<p class="text-sm font-semibold">Notifications</p>
			<p class="text-sm text-muted-foreground">Alert routing, escalation, and digests.</p>
		</div>
		<div class="rounded-lg border border-dashed border-border/60 p-4">
			<p class="text-sm font-semibold">Integrations</p>
			<p class="text-sm text-muted-foreground">APIs, webhooks, and third-party tools.</p>
		</div>
		<div class="rounded-lg border border-dashed border-border/60 p-4">
			<p class="text-sm font-semibold">Security</p>
			<p class="text-sm text-muted-foreground">MFA, audit logs, and data retention.</p>
		</div>
	</div>
</section>

