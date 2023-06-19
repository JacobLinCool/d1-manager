<script lang="ts">
	import { t } from "svelte-i18n";
	import type { PluginData } from "./type";
	import { is_dangerous, is_readonly } from "../sql";
	import { export_csv } from "$lib/csv";

	export let database: string;
	export let table: string;
	export let data: PluginData;

	const cols: [string, string][] =
		data.db
			.find(({ name }) => name === table)
			?.columns.sort(({ cid: a }, { cid: b }) => a - b)
			.map(({ name, type }) => [name, type]) || [];
	const others: [string, [string, string][]][] = data.db
		.filter(
			({ name }) => name !== table && !name.startsWith("sqlite_") && !name.startsWith("d1_"),
		)
		.map(({ name, columns }) => [name, columns.map(({ name, type }) => [name, type])]);

	let query = $t("show-first-10-records", { values: { table } });

	let running = false;
	let suggestion: string | undefined;
	$: danger = is_dangerous(suggestion || "");
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

	async function suggest() {
		if (running) {
			return;
		}
		running = true;

		try {
			const res = await fetch(`/api/plugin/semantic-query`, {
				method: "POST",
				body: JSON.stringify({ q: query, t: [[table, cols], ...others] }),
			});

			const json = await res.json<{ sql: string } | typeof error>();
			if (json) {
				if ("error" in json) {
					error = json;
					suggestion = undefined;
				} else {
					suggestion = json.sql;
					error = undefined;
				}
			} else {
				throw new Error($t("plugin.semantic-query.no-result"));
			}
		} finally {
			running = false;
			if (is_readonly(suggestion || "")) {
				run();
			}
		}
	}

	async function run() {
		if (running) {
			return;
		}
		running = true;

		try {
			const res = await fetch(`/api/db/${database}/all`, {
				method: "POST",
				body: JSON.stringify({ query: suggestion }),
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
				throw new Error($t("plugin.semantic-query.no-result"));
			}
		} catch (err) {
			error = {
				error: {
					message:
						err instanceof Error
							? err.message
							: $t("plugin.semantic-query.unknown-error"),
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

	function suggest_handler(evt: KeyboardEvent) {
		if (evt.code === "Enter" && evt.shiftKey === true) {
			suggest();
		}
	}

	function run_handler(evt: KeyboardEvent) {
		if (evt.code === "Enter" && evt.shiftKey === true) {
			run();
		}
	}
</script>

<p class="pt-2 text-sm opacity-70">
	{$t("plugin.semantic-query.requires-openai_api_key")}
	{$t("plugin.semantic-query.autorun-on-read-only-queries")}
</p>

<div class="form-control w-full">
	<div class="input-group">
		<textarea
			class="textarea-bordered textarea h-12 flex-1 resize-y font-sans"
			placeholder={$t("show-first-10-records")}
			bind:value={query}
			on:keypress={suggest_handler}
			disabled={running}
		/>

		<button
			class="btn-primary btn-outline btn h-auto min-w-[6rem]"
			on:click={suggest}
			disabled={running}
		>
			{$t("plugin.semantic-query.suggest")}
		</button>
	</div>
</div>

<div class="form-control w-full">
	<div class="input-group">
		<textarea
			class="textarea-bordered textarea h-16 flex-1 resize-y font-mono"
			placeholder={$t("suggestion-will-appear-here")}
			bind:value={suggestion}
			on:keypress={run_handler}
			disabled={running}
		/>

		<button
			class="btn-primary btn h-auto min-w-[6rem]"
			class:btn-error={danger}
			on:click={run}
			disabled={running}
		>
			{$t("plugin.semantic-query.run")}
		</button>
	</div>
</div>

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
			{$t("plugin.semantic-query.no-results")}
		</p>
	{/if}

	<div class="mt-2 flex w-full justify-between gap-2 space-x-2">
		<p class="text-sm opacity-70">
			{$t("plugin.semantic-query.n-ms-m-changes", {
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
				{$t("plugin.semantic-query.export")}
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
