import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { CreateCompletionResponse } from "openai";
import { dev } from "$app/environment";

export const POST: RequestHandler = async ({ request, fetch, platform, url }) => {
	if (dev) {
		const remote = new URL("https://d1-manager.pages.dev" + url.pathname + url.search);
		const res = await fetch(remote, { method: "POST", body: await request.text() });
		return json(await res.json());
	}

	const OPENAI_API_KEY = platform?.env.OPENAI_API_KEY;
	if (typeof OPENAI_API_KEY !== "string") {
		return json({ error: "OPENAI_API_KEY is not set" });
	}

	const data = await request.json<{
		q: string;
		t: [name: string, cols: [name: string, type: string][]][];
	}>();

	const question = data.q || "show first 10 records in the table";
	const tables = data.t;

	const prompt = `SQLite tables, with their properties:

${tables
	.map(([name, cols]) => `${name} (${cols.map(([name, type]) => `${name}: ${type}`).join(", ")})`)
	.join("\n")}

Task: ${question}
write a raw SQL, don't include comment or tag
\`\`\`sql`;

	console.log("prompt:", prompt);

	const res = await fetch("https://api.openai.com/v1/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: "code-davinci-002",
			prompt,
			temperature: 0.2,
			max_tokens: 300,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: [";", "```"],
		}),
	});

	const { choices } = await res.json<CreateCompletionResponse>();
	console.log("code completion:", choices[0].text);

	return json({
		sql: choices[0].text?.replace(/```(sql)?/g, "").trim(),
	});
};
