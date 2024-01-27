<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { LayoutData } from "./$types";
	import { sqlite2sql } from "$lib/sqlite2sql";
	import { invalidateAll } from "$app/navigation";

	export let data: LayoutData;

	async function import_db() {
		const file = document.createElement("input");
		file.type = "file";
		file.accept = ".sqlite3,.sqlite,.db,.sql";
		file.onchange = async () => {
			if (file.files?.length !== 1) {
				return;
			}

			const db = file.files[0];
			let sql: string;
			if (db.name.endsWith(".sql")) {
				sql = await db.text();
			} else {
				sql = await sqlite2sql(await db.arrayBuffer());
			}

			console.log(sql);

			const res = await fetch(`/api/db/${$page.params.database}/exec`, {
				method: "POST",
				body: JSON.stringify({ query: sql }),
			});

			if (res.ok) {
				await invalidateAll();
			} else {
				alert(await res.text());
			}

			file.remove();
		};
		file.click();
	}
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
		<div class="flex-none gap-2">
			{#if $page.params.table}
				<span class="px-4 font-bold">
					{$page.params.table}
				</span>
			{:else}
				<button class="btn-outline btn-sm btn" on:click={import_db}>
					{$t("import")}
				</button>
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
