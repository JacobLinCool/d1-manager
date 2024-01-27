import { available } from "$lib/server/ai";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch }) => {
	const dbms = await fetch("/api/db").then((r) => r.json<string[]>());
	const assistant = available();
	return { dbms, assistant };
};
