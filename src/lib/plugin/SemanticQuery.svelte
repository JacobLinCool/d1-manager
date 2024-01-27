<script lang="ts">
	import { t } from "svelte-i18n";
	import { is_dangerous, is_readonly } from "../sql";
	import { export_csv } from "$lib/csv";

	export let database: string;
	export let table: string;

	let query = $t("show-first-10-records", { values: { table } });

	let running = false;
	let suggestion: string | undefined;
	$: danger = is_dangerous(suggestion || "");
	let result: D1Result<any> | undefined;
	let error: string | undefined;

	async function suggest() {
		if (running) {
			return;
		}
		running = true;

		try {
			const res = await fetch(`/api/db/${database}/assistant`, {
				method: "POST",
				body: JSON.stringify({ q: query, t: table }),
			});

			const json = await res.json<{ sql: string } | { message: string }>();
			if (json) {
				if ("message" in json) {
					throw new Error(json.message);
				}
				suggestion = json.sql;
			} else {
				throw new Error($t("plugin.semantic-query.no-result"));
			}
		} catch (e) {
			if (e instanceof Error) {
				error = e.message;
			} else {
				error = $t("plugin.semantic-query.unknown-error");
			}
		} finally {
			running = false;
			if (is_readonly(suggestion || "")) {
				run();
			}
		}
	}

	async function run() {
		if (!suggestion) {
			return;
		}
		if (running) {
			return;
		}
		running = true;

		try {
			const res = await fetch(`/api/db/${database}/all`, {
				method: "POST",
				body: JSON.stringify({ query: suggestion }),
			});

			const json = await res.json<D1Result | { message: string }>();
			if (json) {
				if ("message" in json) {
					throw new Error(json.message);
				}
				result = json;
				error = undefined;
			} else {
				throw new Error($t("plugin.semantic-query.no-result"));
			}
		} catch (err) {
			result = undefined;
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = $t("plugin.semantic-query.unknown-error");
			}
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
	<div class="join">
		<textarea
			class="textarea-bordered textarea h-12 flex-1 resize-y font-sans join-item"
			placeholder={$t("show-first-10-records")}
			bind:value={query}
			on:keypress={suggest_handler}
			disabled={running}
		/>

		<button
			class="btn-primary btn-outline btn h-auto min-w-[6rem] join-item"
			on:click={suggest}
			disabled={running}
		>
			{$t("plugin.semantic-query.suggest")}
		</button>
	</div>
</div>

<div class="form-control w-full">
	<div class="join">
		<textarea
			class="textarea-bordered textarea h-16 flex-1 resize-y font-mono join-item"
			placeholder={$t("suggestion-will-appear-here")}
			bind:value={suggestion}
			on:keypress={run_handler}
			disabled={running}
		/>

		<button
			class="btn-primary btn h-auto min-w-[6rem] join-item"
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

	{#if result.results?.length}
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
					rr: result.meta.rows_read ?? "x",
					rw: result.meta.rows_written ?? result.meta.changes,
				},
			})}
		</p>
		{#if result.results?.length}
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
		<div>{error}</div>
	</div>
{/if}

<div id="bottom" />
