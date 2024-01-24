/**
 * This route dumps a database into a file.
 */
import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals, url, fetch }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		return fetch(remote);
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const data = await db.dump();
	return new Response(data, {
		headers: {
			"Content-Type": "application/octet-stream",
		},
	});
};
