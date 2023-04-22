<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { LayoutData } from "./$types";

	export let data: LayoutData;
</script>

<div class="flex h-full w-full flex-col">
	<div class="navbar min-h-12 border-b border-base-300">
		<div class="flex-1">
			<a class="px-4 font-bold" href="/db/{$page.params.database}">
				{$t("n-table-in-db", {
					values: { db: $page.params.database, n: data.db.length },
				})}
			</a>
		</div>
		<div class="flex-none">
			{#if $page.params.table}
				<span class="px-4 font-bold">
					{$page.params.table}
				</span>
			{:else}
				<a
					class="btn-outline btn-sm btn"
					href="/api/db/{$page.params.database}/dump/db-{$page.params.database}.sqlite3"
					target="_blank"
					rel="noreferrer"
				>
					{$t("download")}
				</a>
			{/if}
		</div>
	</div>
	<div class="w-full flex-1 overflow-y-auto">
		{#key $page.params.table}
			<slot />
		{/key}
	</div>
</div>
