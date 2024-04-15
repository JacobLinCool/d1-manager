/**
 * This route reports the metadata of a table.
 * It also allows deleting a table.
 */
import { dev } from "$app/environment";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals, url, fetch }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote);
		return json(await res.json());
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const { results } = await db.prepare(`SELECT COUNT(*) AS count FROM \`${params.table}\``).all<{
		count: number;
	}>();

	if (!results?.[0]) {
		throw error(404, "No data found");
	}

	return json(results[0]);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const result = await db.prepare(`DROP TABLE \`${params.table}\``).run();
	return json(result);
};
