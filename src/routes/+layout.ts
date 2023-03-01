import { browser } from "$app/environment";
import "$lib/i18n";
import { locale, waitLocale } from "svelte-i18n";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ data }) => {
	if (browser) {
		locale.set(window.navigator.language);
	}
	await waitLocale();

	return data;
};
