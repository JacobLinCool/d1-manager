/**
 * This route reports the tables in a database.
 * It also allows creating new tables.
 */
import { dev } from "$app/environment";
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params, locals }) => {
	if (dev) {
		return json([
			{
				name: "users",
				columns: [
					{
						cid: 0,
						name: "id",
						type: "INTEGER",
						notnull: 0,
						dflt_value: null,
						pk: 1,
					},
					{
						cid: 1,
						name: "username",
						type: "TEXT",
						notnull: 0,
						dflt_value: null,
						pk: 0,
					},
				],
				count: 2,
			},
			{
				name: "posts",
				columns: [
					{
						cid: 0,
						name: "id",
						type: "INTEGER",
						notnull: 0,
						dflt_value: null,
						pk: 1,
					},
					{
						cid: 1,
						name: "title",
						type: "TEXT",
						notnull: 0,
						dflt_value: null,
						pk: 0,
					},
					{
						cid: 2,
						name: "body",
						type: "TEXT",
						notnull: 0,
						dflt_value: null,
						pk: 0,
					},
				],
				count: 10,
			},
		]);
	}

	const db = locals.db[params.database];
	if (!db) {
		throw error(404, "Database not found");
	}

	try {
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
		const results = tables.results;

		const _columns = db.batch(
			results.map(({ name }) => {
				return db.prepare(`PRAGMA table_info(${name})`);
			}),
		);

		const _count = db.batch<{ c: number }>(
			results.map(({ name }) => {
				return db.prepare(`SELECT COUNT(*) AS c FROM ${name}`);
			}),
		);

		const columns = (await _columns).map(({ results }) => results);
		const count = (await _count).map(({ results }) => results?.[0].c);

		return json(
			results.map(({ name }, i) => ({
				name,
				columns: columns[i],
				count: count[i],
			})),
		);
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

	const { name, columns } = await request.json<{
		name: string;
		columns: Record<string, string>;
	}>();
	if (!name) {
		throw error(400, "Missing name");
	}

	try {
		const result = await db
			.prepare(
				`CREATE TABLE ${name} (${Object.entries(columns)
					.map(([name, type]) => `${name} ${type}`)
					.join(", ")}) STRICT`,
			)
			.run();
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
