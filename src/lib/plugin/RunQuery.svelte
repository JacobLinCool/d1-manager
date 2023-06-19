<script lang="ts">
	import { t } from "svelte-i18n";
	import { is_dangerous } from "../sql";
	import { export_csv } from "$lib/csv";

	export let database: string;
	export let table: string;

	$: query = `SELECT * FROM ${table} LIMIT 100`;
	$: danger = is_dangerous(query);

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
			const res = await fetch(`/api/db/${database}/all`, {
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
				throw new Error($t("plugin.run-query.no-result"));
			}
		} catch (err) {
			error = {
				error: {
					message:
						err instanceof Error ? err.message : $t("plugin.run-query.unknown-error"),
				},
			};
			result = undefined;
		} finally {
			running = false;
			setTimeout(() => {
				document.querySelector("#bottom")?.scrollIntoView({ behavior: "smooth" });
			}, 50);
		}
	}

	function handler(evt: KeyboardEvent) {
		if (evt.code === "Enter" && evt.shiftKey === true) {
			run();
		}
	}
</script>

<div class="form-control w-full">
	<textarea
		class="textarea-bordered textarea h-24 resize-y font-mono"
		placeholder="SELECT COUNT(*) AS c FROM {table}"
		bind:value={query}
		on:keypress={handler}
	/>
</div>

<button class="btn-primary btn" class:btn-error={danger} on:click={run} disabled={running}
	>{$t("plugin.run-query.run")}</button
>

{#if result}
	<div class="divider" />

	{#if result.results.length}
		<div class="max-h-[80vh] overflow-auto">
			<table class="table-sm table w-full">
				<thead>
					<tr class="sticky top-0 z-10 bg-base-200 shadow">
						{#each Object.keys(result.results[0]) as key}
							<th class="!relative normal-case">{key}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each result.results as row}
						<tr class="hover">
							{#each Object.values(row) as value}
								<td class="text-base-content" class:text-opacity-50={value === null}
									>{value}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p>
			{$t("plugin.run-query.no-results")}
		</p>
	{/if}

	<div class="mt-2 flex w-full justify-between gap-2 space-x-2">
		<p class="text-sm opacity-70">
			{$t("plugin.run-query.n-ms-m-changes", {
				values: {
					n: result.meta.duration.toFixed(2),
					m: result.meta.changes,
				},
			})}
		</p>
		{#if result?.results.length}
			<button
				class="btn-primary btn-outline btn-sm btn"
				on:click={() => (result ? export_csv(result.results, table) : undefined)}
			>
				{$t("plugin.run-query.export")}
			</button>
		{/if}
	</div>
{/if}

{#if error}
	<div class="divider" />

	<div class="alert alert-error shadow-lg">
		<div>{error.error.cause || error.error.message}</div>
	</div>
{/if}

<div id="bottom" />
