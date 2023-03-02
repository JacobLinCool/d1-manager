<script lang="ts">
	import { page } from "$app/stores";
	import { t } from "svelte-i18n";
	import type { PageData } from "./$types";

	export let data: PageData;
	const meta = data.db.find((table) => table.name === $page.params.table);
	if (!meta) {
		throw new Error(`Table not found: ${$page.params.table} in ${$page.params.database}`);
	}

	let query = `SELECT * FROM ${$page.params.table} LIMIT 100`;
	let running = false;
	let result:
		| {
				results: Record<string, unknown>[];
				success: boolean;
				meta: {
					duration: number;
					last_row_id: number;
					changes: number;
					served_by: string;
					internal_stats: null;
				};
		  }
		| undefined;
	let error:
		| {
				error: {
					message: string;
					cause?: string;
				};
		  }
		| undefined;
	async function run() {
		if (running) {
			return;
		}
		running = true;

		try {
			const res = await fetch(`/api/db/${$page.params.database}/all`, {
				method: "POST",
				body: JSON.stringify({ query }),
			});

			const json = await res.json<typeof result | typeof error>();
			if (json) {
				if ("error" in json) {
					error = json;
					result = undefined;
				} else {
					result = json;
					error = undefined;
				}
			} else {
				throw new Error($t("no-result"));
			}
		} catch (err) {
			error = {
				error: {
					message: err instanceof Error ? err.message : $t("unknown-error"),
				},
			};
			result = undefined;
		} finally {
			running = false;
		}
	}

	function handler(evt: KeyboardEvent) {
		if (evt.code === "Enter" && evt.shiftKey === true) {
			run();
		}
	}
</script>

<svelte:head>
	<title>{$page.params.table} @ {$page.params.database} | {$t("d1-manager")}</title>
	<meta
		name="description"
		content={$t("d1-manager-manage-db", { values: { db: $page.params.table } })}
	/>
</svelte:head>

<div class="w-full flex flex-col gap-4 justify-start items-center p-4">
	<div class="card w-full">
		<div class="card-body">
			<h2 class="card-title">{meta.name}</h2>

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

			<div class="form-control w-full">
				<label class="label" for="">
					<span class="label-text">{$t("run-query")}</span>
				</label>
				<textarea
					class="textarea textarea-bordered h-24 resize-y font-mono"
					placeholder="SELECT COUNT(*) AS c FROM {meta.name}"
					bind:value={query}
					on:keypress={handler}
				/>
			</div>

			<button class="btn btn-primary" on:click={run} disabled={running}>{$t("run")}</button>

			{#if result}
				<div class="divider" />

				{#if result.results.length}
					<div class="overflow-x-auto">
						<table class="table w-full">
							<thead>
								<tr>
									{#each Object.keys(result.results[0]) as key}
										<th class="normal-case">{key}</th>
									{/each}
								</tr>
							</thead>
							<tbody>
								{#each result.results as row}
									<tr class="hover">
										{#each Object.values(row) as value}
											<td>{value}</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p>
						{$t("no-results")}
					</p>
				{/if}

				<p class="text-sm text-gray-500 mt-2">
					{$t("n-ms-m-changes", {
						values: {
							n: result.meta.duration.toFixed(2),
							m: result.meta.changes,
						},
					})}
				</p>
			{/if}

			{#if error}
				<div class="divider" />

				<div class="alert alert-error shadow-lg">
					<div>{error.error.cause || error.error.message}</div>
				</div>
			{/if}
		</div>
	</div>
</div>
