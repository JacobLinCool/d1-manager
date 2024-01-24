import { browser } from "$app/environment";
import { init, register } from "svelte-i18n";

const fallback = "en";

register("en", () => import("$i18n/en.json"));
register("zh-TW", () => import("$i18n/zh-TW.json"));
register("zh-CN", () => import("$i18n/zh-CN.json"));
register("es-ES", () => import("$i18n/es-ES.json"));
register("es-MX", () => import("$i18n/es-MX.json"));
register("ja", () => import("$i18n/ja.json"));

init({
	fallbackLocale: fallback,
	initialLocale: browser ? window.navigator.language : fallback,
});
