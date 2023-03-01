<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { LayoutData } from "./$types";

	export let data: LayoutData;
</script>

<div class="h-full w-full flex flex-col">
	<div class="navbar min-h-12 border-b border-base-300">
		<div class="flex-1">
			<a class="font-bold px-4" href="/db/{$page.params.database}">
				{$t("n-table-in-db", {
					values: { db: $page.params.database, n: data.db.length },
				})}
			</a>
		</div>
		<div class="flex-none">
			{#if $page.params.table}
				<span class="font-bold px-4">
					{$page.params.table}
				</span>
			{/if}
		</div>
	</div>
	<div class="w-full flex-1 overflow-y-auto">
		<slot />
	</div>
</div>
