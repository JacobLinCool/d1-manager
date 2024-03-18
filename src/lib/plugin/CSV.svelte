<script lang="ts">
	import { t } from "svelte-i18n";
	import type { PluginData } from "./type";
	import type { Type } from "../sqlite";
	import { affinity, cast } from "../sqlite";

	export let database: string;
	export let table: string;
	export let data: PluginData;

	const cols = data.db
		.find(({ name }) => name === table)
		?.columns.sort(({ cid: a }, { cid: b }) => a - b);

	if (!cols) {
		throw new Error(`Table not found: ${table} in ${database}`);
	}

	const types: Record<string, Type> = Object.fromEntries(
		cols.map(({ name, type }) => [name, affinity(type)]),
	);

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
	let error: string | undefined;

	let files: FileList | undefined;
	let keys: string[] | undefined;
	let casted: any[][] | undefined;
	async function read() {
		if (running) {
			return;
		}
		running = true;

		try {
			const { parse } = await import("csv-parse/browser/esm/sync");
			const file = files?.[0];
			if (!file) {
				return;
			}

			const text = await file.text();
			const rows: Record<string, string>[] = parse(text, {
				columns: true,
				skip_empty_lines: true,
			});

			keys = Object.keys(rows[0]);
			for (const key of keys) {
				if (!types[key]) {
					throw new Error($t("plugin.csv.invalid-column-name-key", { values: { key } }));
				}
			}

			casted = rows.map((row) => {
				return (keys || []).map((key) => {
					const value = row[key];
					const type = types[key];
					return cast(value, type);
				});
			});

			error = undefined;
		} catch (err) {
			console.error(err);
			if (err instanceof Error) {
				error = err.message;
			}
		} finally {
			running = false;
		}
	}

	async function import_csv() {
		if (running || !casted) {
			return;
		}
		running = true;

		try {
			const bodies = split(casted, 90_000);

			function split(arr: any[][], size: number): string[] {
				const bodies: string[] = [""];
				for (let i = 0; i < arr.length; i++) {
					if (bodies[bodies.length - 1].length >= size) {
						bodies.push("");
					}
					if (bodies[bodies.length - 1].length > 0) {
						bodies[bodies.length - 1] += ", ";
					}
					bodies[bodies.length - 1] +=
						`(${arr[i].map((x) => JSON.stringify(x)).join(", ")})`;
				}
				return bodies;
			}

			const queries = bodies.map(
				(body) => `INSERT INTO ${table} (${keys?.join(", ")}) VALUES ${body}`,
			);

			console.log(queries);
			let r: typeof result = undefined;
			for (const query of queries) {
				const res = await fetch(`/api/db/${database}/all`, {
					method: "POST",
					body: JSON.stringify({ query }),
				});

				const json = await res.json<any>();
				if (json) {
					if ("error" in json) {
						error = json?.error?.cause || json?.error?.message;
						r = undefined;
					} else {
						if (r) {
							r.meta.duration += json.meta.duration;
							r.meta.changes += json.meta.changes;
						} else {
							r = json;
						}
						error = undefined;
						files = undefined;
						keys = undefined;
						casted = undefined;
					}
					result = r;
				} else {
					throw new Error($t("plugin.csv.no-result"));
				}
			}
		} finally {
			running = false;
		}
	}

	async function export_csv() {
		if (running) {
			return;
		}
		running = true;

		try {
			const module = import("csv-stringify/browser/esm/sync");
			const res = await fetch(`/api/db/${database}/${table}/data`);
			const json = await res.json<any>();

			const { stringify } = await module;

			const csv = stringify(json, {
				header: true,
				columns: keys,
			});

			const a = document.createElement("a");
			a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
			a.setAttribute("download", `${table}.csv`);
			a.click();
			URL.revokeObjectURL(a.href);
			a.remove();
		} finally {
			running = false;
		}
	}
</script>

<div class="w-full rounded-lg border p-4">
	<p class="card-title">{$t("plugin.csv.import-csv")}</p>

	<div class="divider" />

	<div class="form-control w-full">
		<label class="label" for="csv">
			<span class="label-text">{$t("plugin.csv.select-a-csv-file")}</span>
		</label>
		<input
			id="csv"
			type="file"
			class="file-input-bordered file-input w-full"
			bind:files
			accept=".csv"
			on:change={read}
			disabled={running}
		/>
		<label class="label" for="csv">
			<span class="label-text-alt text-error">{error || ""}</span>
			<span class="label-text-alt">.csv</span>
		</label>
	</div>

	{#if keys && casted?.length}
		<div class="my-2 max-h-[70vh] overflow-auto">
			<table class="table-sm table w-full">
				<thead>
					<tr class="sticky top-0 z-10 bg-base-200 shadow">
						{#each keys as key}
							<th class="!relative normal-case">{key}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each casted as row}
						<tr class="hover">
							{#each row as value}
								<td class="text-base-content">{value}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<button class="btn-primary btn w-full" on:click={import_csv} disabled={running}>
			{$t("plugin.csv.import")}
		</button>
	{/if}
	{#if result}
		<p class="mt-2 text-sm opacity-70">
			{$t("plugin.csv.n-ms-m-changes", {
				values: {
					n: result.meta.duration.toFixed(2),
					m: result.meta.changes,
				},
			})}
		</p>
	{/if}
</div>

<div class="w-full rounded-lg border p-4">
	<p class="card-title">{$t("plugin.csv.export-csv")}</p>

	<div class="divider" />

	<button class="btn-primary btn w-full" on:click={export_csv} disabled={running}>
		{$t("plugin.csv.export")}
	</button>
</div>
