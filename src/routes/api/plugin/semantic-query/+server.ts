import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { CreateCompletionResponse } from "openai";

export const POST: RequestHandler = async ({ request, fetch, platform }) => {
	const OPENAI_API_KEY = platform?.env.OPENAI_API_KEY;
	if (typeof OPENAI_API_KEY !== "string") {
		return json({ error: "OPENAI_API_KEY is not set" });
	}

	const data = await request.json<{ q: string; t: string; cols: [string, string][] }>();

	const question = data.q || "show first 10 records in the table";
	const table = data.t;
	const columns = data.cols;

	const prompt = `
### SQLite table, with properties and types:
#
# ${table}(${columns.map(([c, t]) => `${c} ${t}`).join(", ")})
#
### A query to ${question}
Raw SQL:`;

	const res = await fetch("https://api.openai.com/v1/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: "code-davinci-002",
			prompt,
			temperature: 0,
			max_tokens: 300,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: ["#", ";"],
		}),
	});

	const { choices } = await res.json<CreateCompletionResponse>();
	console.log("code completion:", choices[0].text);

	return json({
		sql: choices[0].text?.replace(/```(sql)?/g, "").trim(),
	});
};
