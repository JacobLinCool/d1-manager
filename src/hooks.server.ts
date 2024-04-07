import { extend } from "$lib/log";
import { DBMS } from "$lib/server/db/dbms";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { locale, waitLocale } from "svelte-i18n";
import { onRequest } from "./access";

const handler: Handle = async ({ event, resolve }) => {
	const lang = event.request.headers.get("accept-language")?.split(",")[0] || "en";
	locale.set(lang);
	await waitLocale(lang);

	event.locals.db = DBMS(event.platform?.env || {});

	const result = await resolve(event);
	return result;
};

export const handle: Handle = async ({ event, resolve }) => {
	console.log(event.request.url);
	// check request is authenticated
	if (event.platform?.env.IS_LOCAL_MODE === "1") {
		return await handler({ event, resolve });
	} else {
		return await onRequest({
			request: event.request,
			pluginArgs: {
				domain: event.platform?.env.ACCESS_DOMAIN,
				aud: event.platform?.env.ACCESS_AUD,
			},
			data: {},
			next: async () => {
				return await handler({ event, resolve });
			},
		});
	}
};

const elog = extend("server-error");
elog.enabled = true;

export const handleError: HandleServerError = async ({ error }) => {
	elog(error);

	if (error instanceof Error && error.message.startsWith("D1_")) {
		return {
			code: 400,
			message: error.message,
		};
	}

	return {
		code: 500,
		message: "Internal Server Error",
	};
};
