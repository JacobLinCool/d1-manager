import { env } from "$env/dynamic/private";
import { Aid } from "@ai-d/aid";
import { json } from "@sveltejs/kit";
import debug from "debug";
import { OpenAI } from "openai";
import { z } from "zod";
import type { RequestHandler } from "./$types";

debug.enable("aid*");

export const POST: RequestHandler = async ({ params, request, fetch }) => {
	const OPENAI_API_KEY = env.OPENAI_API_KEY;
	if (typeof OPENAI_API_KEY !== "string") {
		return json({ error: "OPENAI_API_KEY is not set" });
	}

	const tables_p = fetch("/api/db/" + params.database).then((r) =>
		r.json<
			{
				name: string;
				columns: { name: string; type: string }[];
				count: number;
			}[]
		>(),
	);

	const data = await request.json<{
		q: string;
		t?: string;
	}>();

	const tables = await tables_p;

	// if t is provided, swap the table t with the first table
	if (data.t) {
		const i = tables.findIndex(({ name }) => name === data.t);
		if (i > 0) {
			[tables[0], tables[i]] = [tables[i], tables[0]];
		}
	}

	const question = data.q || "show first 10 records in the table";

	const openai = new OpenAI({
		baseURL: env.OPENAI_API_URL,
		apiKey: OPENAI_API_KEY,
	});
	const aid = Aid.from(openai, { model: "gpt-3.5-turbo-1106" });

	const system = `SQLite tables, with their properties:

${tables
	.map(
		({ name, columns }) =>
			`${name} (${columns.map(({ name, type }) => `${name}: ${type}`).join(", ")})`,
	)
	.join("\n")}

write a raw SQL, without comment`;

	const get_sql = aid.task(
		system,
		z.object({
			sql: z.string().describe("SQL query"),
		}),
	);

	const { result } = await get_sql(question);

	return json({
		sql: result.sql,
	});
};
