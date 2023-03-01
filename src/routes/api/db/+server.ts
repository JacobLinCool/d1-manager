/**
 * This route reports the connected databases.
 */
import { dev } from "$app/environment";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
	if (dev) {
		return json(["default", "database_x", "database_y"]);
	}
	return json(Object.keys(locals.db));
};
