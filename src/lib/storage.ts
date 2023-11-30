import { browser } from "$app/environment";
import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

type Val = string | null | undefined;

const cache = new Map<string, Writable<Val>>();

export function get(
	key: string,
	{ default_value = undefined as Val, ttl = 0 } = {},
): Writable<Val> {
	const cached = cache.get(key);
	if (cached) {
		console.log("[storage]", "cached", key, cached);
		return cached;
	}

	function update(value: Val) {
		if (browser) {
			localStorage.setItem(`storage:${key}`, JSON.stringify([Date.now(), value]));
			console.log("[storage]", "updated", key, value);
		}
	}

	if (browser) {
		const value = localStorage.getItem(`storage:${key}`);
		if (value) {
			const data: [number, Val] = JSON.parse(value);
			if (Date.now() - data[0] < ttl) {
				const store = writable(data[1]);
				console.log("[storage]", "restored", key, store);
				store.subscribe(update);
				cache.set(key, store);
				return store;
			}
		}
	}

	const store = writable(default_value);
	console.log("[storage]", "created", key, store);
	store.subscribe(update);
	cache.set(key, store);
	return store;
}
