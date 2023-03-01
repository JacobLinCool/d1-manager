import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch }) => {
	const dbms = await fetch("/api/db").then((r) => r.json<string[]>());
	return { dbms };
};
