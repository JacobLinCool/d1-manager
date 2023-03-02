<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<svelte:head>
	<title>{$page.params.database} | {$t("d1-manager.name")}</title>
	<meta
		name="description"
		content={$t("d1-manager-manage-db", { values: { db: $page.params.database } })}
	/>
</svelte:head>

<div class="flex w-full flex-col items-center justify-start gap-4 p-4">
	{#each data.db as table}
		<a class="w-full" href="/db/{$page.params.database}/{table.name}">
			<div
				class="card-bordered card w-full transition-all hover:border-primary hover:shadow-md"
			>
				<div class="card-body">
					<h2 class="card-title">{table.name}</h2>

					<div class="stats">
						<div class="stat">
							<div class="stat-title">{$t("rows")}</div>
							<div class="stat-value">{table.count}</div>
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
									{#each table.columns as column}
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
				</div>
			</div></a
		>
	{/each}
</div>
