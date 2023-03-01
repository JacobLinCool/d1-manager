import { DBMS } from "$lib/server/db/dbms";
import { locale, waitLocale } from "svelte-i18n";
import type { Handle, HandleServerError } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const lang = event.request.headers.get("accept-language")?.split(",")[0] || "en";
	locale.set(lang);
	await waitLocale(lang);

	event.locals.db = DBMS(event.platform?.env || {}) as any;

	const result = await resolve(event);
	return result;
};

export const handleError: HandleServerError = async ({ error }) => {
	console.error(error);

	const err: any = error;

	return {
		code: err?.status || 500,
		message: err?.body?.message || "Internal Server Error",
	};
};
