/**
 * This route reports the data in a table.
 * It also allows inserting, updating, and deleting data.
 */
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { dev } from "$app/environment";

export const GET: RequestHandler = async ({ url, params, locals, fetch }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote);
		return json(await res.json());
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const offset = Number(url.searchParams.get("offset")) || 0;
	const limit = Number(url.searchParams.get("limit")) || 100;
	const order = url.searchParams.get("order") || "";
	const dir = url.searchParams.get("dir") || "ASC";
	const select = url.searchParams.get("select") || "*";
	const where = url.searchParams.get("where") || "";

	try {
		const { results } = await db
			.prepare(
				`SELECT ${select} FROM ${params.table}${where ? ` WHERE ${where}` : ""}${
					order ? ` ORDER BY ${order} ${dir}` : ""
				} LIMIT ${limit} OFFSET ${offset}`,
			)
			.all();

		if (!results) {
			throw error(404, "No data found");
		}

		return json(results);
	} catch (err: any) {
		return json({
			error: {
				message: err.message,
				cause: err.cause?.message,
			},
		});
	}
};

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	let data: Record<string, unknown>;
	try {
		data = await request.json<Record<string, unknown>>();
	} catch (err: any) {
		throw error(400, err.message);
	}

	try {
		const statement = db
			.prepare(
				`INSERT INTO ${params.table} (${Object.keys(data).join(
					", ",
				)}) VALUES (${Object.keys(data)
					.map(() => "?")
					.join(", ")})`,
			)
			.bind(...Object.values(data));
		const result = await statement.run();
		return json(result);
	} catch (err: any) {
		return json({
			error: {
				message: err.message,
				cause: err.cause?.message,
			},
		});
	}
};

export const PUT: RequestHandler = async ({ url, request, params, locals }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote, { method: "PUT", body: await request.text() });
		return json(await res.json());
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const where = Object.fromEntries(url.searchParams.entries());

	let data: Record<string, unknown>;
	try {
		data = await request.json<Record<string, unknown>>();
	} catch (err: any) {
		throw error(400, err.message);
	}

	try {
		const statement = db
			.prepare(
				`UPDATE ${params.table} SET ${Object.keys(data)
					.map((key) => `${key} = ?`)
					.join(", ")} WHERE ${where_sql(where)}`,
			)
			.bind(...Object.values(data), ...Object.values(where));
		const result = await statement.run();
		return json(result);
	} catch (err: any) {
		return json({
			error: {
				message: err.message,
				cause: err.cause?.message,
			},
		});
	}
};

export const DELETE: RequestHandler = async ({ url, params, locals }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote, { method: "DELETE" });
		return json(await res.json());
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	const where = Object.fromEntries(url.searchParams.entries());

	try {
		const statement = db
			.prepare(`DELETE FROM ${params.table} WHERE ${where_sql(where)}`)
			.bind(...Object.values(where));
		const result = await statement.run();
		return json(result);
	} catch (err: any) {
		return json({
			error: {
				message: err.message,
				cause: err.cause?.message,
			},
		});
	}
};

function where_sql(where: Record<string, unknown>): string {
	return Object.keys(where)
		.map((key) => `${key} = ?`)
		.join(" AND ");
}
