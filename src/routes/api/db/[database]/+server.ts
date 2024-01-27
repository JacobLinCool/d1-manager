/**
 * This route reports the tables in a database.
 * It also allows creating new tables.
 */
import { dev } from "$app/environment";
import { extend } from "$lib/log";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const log = extend("api/db/+server");

export const GET: RequestHandler = async ({ params, locals, url, fetch, platform }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		return fetch(remote);
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const tables = await db.prepare("PRAGMA table_list").all<{
		schema: string;
		name: string;
		type: string;
		ncol: number;
		wr: number;
		strict: number;
	}>();

	if (!tables.results) {
		throw error(404, "No tables found");
	}
	const results = tables.results.filter(({ name }) => {
		// Avoid all Cloudflare internal table names.
		if (name.startsWith("_cf_")) {
			return false;
		}
		if (name.startsWith("sqlite_") || name.startsWith("d1_")) {
			return !!platform?.env.SHOW_INTERNAL_TABLES;
		}
		return true;
	});

	const _columns = db.batch(
		results.map(({ name }) => {
			return db.prepare(`PRAGMA table_info(\`${name}\`)`);
		}),
	);

	const _count = db.batch<{ c: number }>(
		results.map(({ name }) => {
			return db.prepare(`SELECT COUNT(*) AS c FROM \`${name}\``);
		}),
	);

	const columns = (await _columns).map(
		({ results }) => results as { name: string; type: string }[],
	);
	const count = (await _count).map(({ results }) => results?.[0].c);

	const response = results
		.map(({ name }, i) => ({
			name,
			columns: columns[i],
			count: count[i],
		}))
		.sort(({ name: a }, { name: b }) => {
			if (a.startsWith("sqlite_") && !b.startsWith("sqlite_")) {
				return 1;
			} else if (!a.startsWith("sqlite_") && b.startsWith("sqlite_")) {
				return -1;
			}

			if (a.startsWith("d1_") && !b.startsWith("d1_")) {
				return 1;
			} else if (!a.startsWith("d1_") && b.startsWith("d1_")) {
				return -1;
			}

			return a.replace(/^(d1|sqlite)_/, "").localeCompare(b.replace(/^(d1|sqlite)_/, ""));
		});

	log(response);
	return json(response);
};

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const { name, columns } = await request.json<{
		name: string;
		columns: Record<string, string>;
	}>();
	if (!name) {
		throw error(400, "Missing name");
	}

	const result = await db
		.prepare(
			`CREATE TABLE ${name} (${Object.entries(columns)
				.map(([name, type]) => `${name} ${type}`)
				.join(", ")}) STRICT`,
		)
		.run();
	return json(result);
};
