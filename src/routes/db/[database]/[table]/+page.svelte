<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { PageData } from "./$types";

	export let data: PageData;
	const meta = data.db.find((table) => table.name === $page.params.table);
	if (!meta) {
		throw new Error(`Table not found: ${$page.params.table} in ${$page.params.database}`);
	}

	const plugins = {
		[$t("plugin.run-query.name")]: () => import("$lib/plugin/RunQuery.svelte"),
		[$t("plugin.table-browser.name")]: () => import("$lib/plugin/TableBrowser.svelte"),
		[$t("plugin.add-record.name")]: () => import("$lib/plugin/AddRecord.svelte"),
		[$t("plugin.semantic-query.name")]: () => import("$lib/plugin/SemanticQuery.svelte"),
	};

	let plugin: string | undefined;
	let PluginComponent: ConstructorOfATypedSvelteComponent | undefined;
	$: {
		if (plugin) {
			plugins[plugin]().then((m) => {
				PluginComponent = m.default;
			});
		}
	}
</script>

<svelte:head>
	<title>{$page.params.table} @ {$page.params.database} | {$t("d1-manager.name")}</title>
	<meta
		name="description"
		content={$t("d1-manager-manage-db", { values: { db: $page.params.table } })}
	/>
</svelte:head>

<div class="flex w-full flex-col items-center justify-start gap-4">
	<div class="card w-full">
		<div class="card-body">
			<div class="flex justify-between">
				<h2 class="card-title">{meta.name}</h2>
				<div class="flex gap-2">
					<button class="btn-outline btn-error btn-sm btn">Drop</button>
				</div>
			</div>

			<div class="divider" />

			<div>
				<div class="overflow-x-auto">
					<table class="table w-full">
						<thead>
							<tr>
								<th>{$t("col-name")}</th>
								<th>{$t("col-type")}</th>
								<th>{$t("col-default")}</th>
							</tr>
						</thead>
						<tbody>
							{#each meta.columns as column}
								<tr class="hover" class:font-bold={column.pk}>
									<td>{column.name}</td>
									<td>{column.type}</td>
									<td>{column.dflt_value}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="divider" />

			<select class="select-bordered select max-w-xs" bind:value={plugin}>
				{#each Object.keys(plugins) as name}
					<option value={name}>{name}</option>
				{/each}
			</select>

			{#if PluginComponent}
				<svelte:component
					this={PluginComponent}
					{data}
					database={$page.params.database}
					table={$page.params.table}
				/>
			{/if}
		</div>
	</div>
</div>
