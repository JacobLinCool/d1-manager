import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { dev } from "$app/environment";

export const POST: RequestHandler = async ({ request, params, locals, url, fetch }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote, { method: "POST", body: await request.text() });
		return json(await res.json());
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	let data: any;
	try {
		data = await request.json<{ query?: string; params?: string[] }>();
	} catch (err: any) {
		throw error(400, err.message);
	}

	const { query, params: args } = data;
	if (!query) {
		throw error(400, "Missing query");
	}

	try {
		const statement = db.prepare(query).bind(...(args ?? []));
		const result = await statement.all();
		return json(result);
	} catch (err: any) {
		return json({
			error: {
				message: err.message,
				cause: err.cause.message,
			},
		});
	}
};
