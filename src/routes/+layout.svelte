<script lang="ts">
	import { browser } from "$app/environment";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import { t } from "svelte-i18n";
	import { themeChange } from "theme-change";
	import "../app.css";
	import type { LayoutData } from "./$types";

	export let data: LayoutData;
	let database = $page.params.database || "";
	$: {
		if (browser && database && database !== $page.params.database) {
			goto(`/db/${database}`);
		}
	}

	onMount(() => {
		themeChange(false);
	});
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
			<select class="select-bordered select select-sm w-full max-w-xs" bind:value={database}>
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
