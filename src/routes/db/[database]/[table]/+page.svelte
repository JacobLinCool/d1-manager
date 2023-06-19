<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { PageData } from "./$types";
	import SidePanel from "./SidePanel.svelte";

	export let data: PageData;
	const meta = data.db.find((table) => table.name === $page.params.table);
	if (!meta) {
		throw new Error(`Table not found: ${$page.params.table} in ${$page.params.database}`);
	}

	const plugins = {
		["table-browser"]: () => import("$lib/plugin/TableBrowser.svelte"),
		["run-query"]: () => import("$lib/plugin/RunQuery.svelte"),
		["semantic-query"]: () => import("$lib/plugin/SemanticQuery.svelte"),
		["add-record"]: () => import("$lib/plugin/AddRecord.svelte"),
		["csv"]: () => import("$lib/plugin/CSV.svelte"),
	};

	let plugin: keyof typeof plugins | undefined;
	let PluginComponent: ConstructorOfATypedSvelteComponent | undefined;
	$: {
		if (plugin) {
			plugins[plugin]().then((m) => {
				PluginComponent = m.default;
			});
		}
	}

	function preload_plugins() {
		Object.values(plugins).forEach((importer) => {
			importer();
		});
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
			<div class="mb-4 flex justify-between">
				<h2 class="card-title">{meta.name}</h2>
				<div class="flex gap-2">
					<!-- <button class="btn-outline btn-error btn-sm btn">Drop</button> -->
				</div>
			</div>

			<div>
				<div class="overflow-x-auto">
					<table class="table-sm table w-full bg-base-200">
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

			<select
				class="select-bordered select max-w-xs"
				bind:value={plugin}
				on:click={preload_plugins}
			>
				{#each Object.keys(plugins) as name}
					<option value={name}>{$t(`plugin.${name}.name`)}</option>
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

<SidePanel {data} />
