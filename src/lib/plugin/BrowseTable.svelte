<script lang="ts">
	import { onMount } from "svelte";
	import { t } from "svelte-i18n";

	export let database: string;
	export let table: string;
	export let data: {
		db: {
			name: string;
			columns: [
				{
					cid: number;
					name: string;
					type: "INTEGER" | "TEXT" | "REAL" | "BLOB";
					notnull: number;
					dflt_value: string | null;
					pk: number;
				},
			];
			count: number;
		}[];
	};

	const cols =
		data.db
			.find(({ name }) => name === table)
			?.columns.sort(({ cid: a }, { cid: b }) => a - b)
			.map(({ name }) => name) || [];

	let offset = 0;
	let limit = 20;
	let order = "";
	let dir: "ASC" | "DESC" = "ASC";

	let running = false;
	let result: Record<string, unknown>[] | undefined;
	let error:
		| {
				error: {
					message: string;
					cause?: string;
				};
		  }
		| undefined;

	onMount(() => {
		run();
	});

	async function run() {
		if (running) {
			return;
		}
		running = true;

		try {
			const params = new URLSearchParams();
			params.set("offset", offset.toString());
			params.set("limit", limit.toString());
			if (order) {
				params.set("order", order);
				params.set("dir", dir);
			}
			const res = await fetch(`/api/db/${database}/${table}/data?${params.toString()}`);

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
				throw new Error($t("plugin.browse-table.no-result"));
			}
		} catch (err) {
			error = {
				error: {
					message:
						err instanceof Error
							? err.message
							: $t("plugin.browse-table.unknown-error"),
				},
			};
			result = undefined;
		} finally {
			running = false;
		}
	}
</script>

{#if result}
	{#if result.length}
		<div class="mt-4 overflow-x-auto transition-opacity" class:opacity-50={running}>
			<table class="table-compact table w-full">
				<thead>
					<tr>
						{#each cols as col}
							<th class="normal-case">{col}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each result as row}
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
		<p class="mt-4">
			{$t("plugin.browse-table.no-results")}
		</p>
	{/if}

	<div class="flex items-center justify-between">
		{#if offset > 0}
			<button
				class="btn-ghost btn"
				on:click={() => {
					offset -= limit;
					run();
				}}
				disabled={running}
			>
				{$t("plugin.browse-table.prev")}
			</button>
		{/if}

		<p class="flex-grow-0 p-4">
			{$t("plugin.browse-table.showing", {
				values: {
					from: result.length ? offset + 1 : offset,
					to: offset + result.length,
				},
			})}
		</p>

		{#if result.length === limit}
			<button
				class="btn-ghost btn"
				on:click={() => {
					offset += limit;
					run();
				}}
				disabled={running}
			>
				{$t("plugin.browse-table.next")}
			</button>
		{/if}
	</div>
{/if}

{#if error}
	<div class="alert alert-error shadow-lg">
		<div>{error.error.cause || error.error.message}</div>
	</div>
{/if}
