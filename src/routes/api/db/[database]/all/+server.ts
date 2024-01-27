import { dev } from "$app/environment";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, params, locals, url, fetch }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote, {
			method: "POST",
			body: await request.text(),
			headers: request.headers,
		});
		return json(await res.json());
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	let data: { query?: string; params?: string[] };
	try {
		data = await request.json();
	} catch (err) {
		if (err instanceof Error) {
			throw error(400, err.message);
		}
		throw err;
	}

	const { query, params: args } = data;
	if (!query) {
		throw error(400, "Missing query");
	}

	const statement = db.prepare(query).bind(...(args ?? []));
	const result = await statement.all();
	return json(result);
};
