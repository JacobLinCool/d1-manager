import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { CreateChatCompletionResponse, ChatCompletionRequestMessage } from "openai";
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

	const system = `SQLite tables, with their properties:

${tables
	.map(([name, cols]) => `${name} (${cols.map(([name, type]) => `${name}: ${type}`).join(", ")})`)
	.join("\n")}

write a raw SQL, don't include comment or tag`;

	const messages: ChatCompletionRequestMessage[] = [
		{ role: "system", content: system },
		{ role: "user", content: question },
	];

	console.log("messages:", messages);

	const res = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
		body: JSON.stringify({
			model: "gpt-3.5-turbo",
			messages,
			temperature: 0.2,
			max_tokens: 300,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
			stop: [";", "```"],
		}),
	});

	const { choices, usage } = await res.json<CreateChatCompletionResponse>();
	console.log("reply:", choices[0].message?.content);
	console.log("usage:", usage);

	return json({
		sql: choices[0].message?.content?.replace(/```(sql)?/g, "").trim(),
	});
};
