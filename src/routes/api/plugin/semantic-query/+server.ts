import { env } from "$env/dynamic/private";
import { Aid } from "@ai-d/aid";
import { json } from "@sveltejs/kit";
import debug from "debug";
import { OpenAI } from "openai";
import { z } from "zod";
import type { RequestHandler } from "./$types";

debug.enable("aid*");

export const POST: RequestHandler = async ({ request }) => {
	const OPENAI_API_KEY = env.OPENAI_API_KEY;
	if (typeof OPENAI_API_KEY !== "string") {
		return json({ error: "OPENAI_API_KEY is not set" });
	}

	const data = await request.json<{
		q: string;
		t: [name: string, cols: [name: string, type: string][]][];
	}>();

	const question = data.q || "show first 10 records in the table";
	const tables = data.t;

	const openai = new OpenAI({
		baseURL: env.OPENAI_API_URL,
		apiKey: OPENAI_API_KEY,
	});
	const aid = Aid.from(openai, { model: "gpt-3.5-turbo-1106" });

	const system = `SQLite tables, with their properties:

${tables
	.map(([name, cols]) => `${name} (${cols.map(([name, type]) => `${name}: ${type}`).join(", ")})`)
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
