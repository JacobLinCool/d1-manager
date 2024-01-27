import { version } from "$app/environment";
import { available } from "$lib/server/ai";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
	return json({
		db: Object.keys(locals.db),
		assistant: available(),
		version,
	});
};
