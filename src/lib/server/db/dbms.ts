import { extend } from "$lib/log";
import type { D1Database } from "@cloudflare/workers-types";
import { D1Shim } from "../d1";

const log = extend("dbms");

export function DBMS(
	env: Record<string, Fetcher | D1Database | string>,
): Record<string, D1Database> {
	const keys = Object.keys(env).filter(
		(k) => k.startsWith("DB") || k.startsWith("__D1_BETA__DB"),
	);
	log("Database Bindings:", keys.join(", "));

	const results: Record<string, D1Database> = {};
	for (const k of keys) {
		const e = env[k];
		if (typeof e === "string") {
			continue;
		}
		const db = "prepare" in e ? e : new D1Shim(e);
		results[k.replace(/^(__D1_BETA__)?DB_?/, "") || "default"] = db;
	}
	return results;
}
