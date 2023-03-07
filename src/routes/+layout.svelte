<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { get } from "$lib/storage";
	import { onMount } from "svelte";
	import { locale, t } from "svelte-i18n";
	import { writable } from "svelte/store";
	import { themeChange } from "theme-change";
	import "../app.css";
	import type { LayoutData } from "./$types";
	import { preloadData } from "$app/navigation";

	export let data: LayoutData;
	let database = $page.params.database || "";
	$: {
		if (browser && database && database !== $page.params.database) {
			goto(`/db/${database}`);
		}
	}

	let lang = writable<string | null | undefined>(undefined);

	onMount(() => {
		themeChange(false);
		lang = get("lang", {
			default_value: window.navigator.language,
			ttl: 30 * 24 * 60 * 60 * 1000,
		});
		lang.subscribe((value) => {
			if (value) {
				locale.set(value);
			}
		});
	});

	function preload() {
		if (database) {
			if (data.dbms.length > 1) {
				preloadData(`/db/${database === data.dbms[0] ? data.dbms[1] : data.dbms[0]}`);
			}
		} else if (data.dbms[0]) {
			preloadData(`/db/${data.dbms[0]}`);
		}
	}
</script>

<div class="flex h-full w-full flex-col">
	<div class="navbar min-h-12 bg-base-200">
		<div class="flex-1">
			<a
				class="btn-ghost btn-sm btn text-xl normal-case"
				href="/"
				on:click={() => (database = "")}>D1 Manager</a
			>
		</div>
		<div class="flex-none">
			<select
				class="select-bordered select select-sm w-full max-w-xs"
				bind:value={database}
				on:click={preload}
			>
				<option value="" disabled selected>{$t("select-database")}</option>
				{#each data.dbms as db}
					<option value={db}>{db}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="w-full flex-1 overflow-y-auto">
		<slot />
	</div>
</div>
