import { D1Database } from "../d1";

export function DBMS(env: Record<string, Fetcher | string>): Record<string, D1Database> {
	const keys = Object.keys(env).filter(
		(k) => k.startsWith("DB") || k.startsWith("__D1_BETA__DB"),
	);
	const results: Record<string, D1Database> = {};
	for (const k of keys) {
		const e = env[k];
		if (typeof e === "string") {
			continue;
		}
		const db = "fetch" in e ? new D1Database(e) : e;
		results[k.replace(/^(__D1_BETA__)?DB_?/, "") || "default"] = db;
	}
	return results;
}
