<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";

	type WeightThresholdProps = {
		weightCriticalRobberyDropKg: number;
		weightWarningDailyLossG: number;
		weightNormalDailyGainMinG: number;
	};

	let {
		weightCriticalRobberyDropKg = $bindable(0.8),
		weightWarningDailyLossG = $bindable(300),
		weightNormalDailyGainMinG = $bindable(-200),
	}: WeightThresholdProps = $props();
</script>

<Card class="border-border/60">
	<CardHeader>
		<CardTitle class="text-lg">Weight Monitoring</CardTitle>
		<CardDescription>Configure weight monitoring thresholds for robbery and starvation detection</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="rounded-lg bg-muted/50 p-3 mb-4">
			<p class="text-xs text-muted-foreground">
				Weight monitoring uses drop rate and daily gain to detect robbery and starvation risks.
				These thresholds are independent of the absolute weight value.
			</p>
		</div>

		<!-- Critical Robbery Drop -->
		<div class="space-y-2">
			<Label for="robbery-drop" class="flex items-center gap-2">
				<Badge class="bg-red-500/20 text-red-500 border-red-500/30" variant="outline">
					Critical Robbery Drop
				</Badge>
			</Label>
			<div class="flex items-center gap-2">
				<Input
					id="robbery-drop"
					type="number"
					bind:value={weightCriticalRobberyDropKg}
					min="0"
					max="5"
					step="0.1"
					class="flex-1"
				/>
				<span class="text-sm text-muted-foreground">kg</span>
			</div>
			<p class="text-xs text-muted-foreground">
				Triggers CRITICAL alert if weight drops by more than this amount in less than 6 hours (default: 0.8 kg = 800g)
			</p>
		</div>

		<!-- Warning Daily Loss -->
		<div class="space-y-2">
			<Label for="daily-loss" class="flex items-center gap-2">
				<Badge class="bg-yellow-500/20 text-yellow-500 border-yellow-500/30" variant="outline">
					Warning Daily Loss
				</Badge>
			</Label>
			<div class="flex items-center gap-2">
				<Input
					id="daily-loss"
					type="number"
					bind:value={weightWarningDailyLossG}
					min="0"
					max="2000"
					step="10"
					class="flex-1"
				/>
				<span class="text-sm text-muted-foreground">g/day</span>
			</div>
			<p class="text-xs text-muted-foreground">
				Triggers WARNING alert if daily loss exceeds this amount (default: 300 g/day)
			</p>
		</div>

		<!-- Normal Daily Gain Minimum -->
		<div class="space-y-2">
			<Label for="daily-gain-min" class="flex items-center gap-2">
				<Badge class="bg-green-500/20 text-green-500 border-green-500/30" variant="outline">
					Normal Daily Gain Minimum
				</Badge>
			</Label>
			<div class="flex items-center gap-2">
				<Input
					id="daily-gain-min"
					type="number"
					bind:value={weightNormalDailyGainMinG}
					min="-1000"
					max="1000"
					step="10"
					class="flex-1"
				/>
				<span class="text-sm text-muted-foreground">g/day</span>
			</div>
			<p class="text-xs text-muted-foreground">
				Triggers STARVATION alert if daily gain falls below this value (default: -200 g/day)
			</p>
		</div>
	</CardContent>
</Card>

