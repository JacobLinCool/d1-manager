<script lang="ts">
	import { onMount } from "svelte";
	import { t } from "svelte-i18n";
	import { themeChange } from "theme-change";

	const themes = [
		"light",
		"dark",
		"cupcake",
		"bumblebee",
		"emerald",
		"corporate",
		"synthwave",
		"retro",
		"cyberpunk",
		"valentine",
		"halloween",
		"garden",
		"forest",
		"aqua",
		"lofi",
		"pastel",
		"fantasy",
		"wireframe",
		"black",
		"luxury",
		"dracula",
		"cmyk",
		"autumn",
		"business",
		"acid",
		"lemonade",
		"night",
		"coffee",
		"winter",
	];

	onMount(() => {
		themeChange(false);
	});
</script>

<svelte:head>
	<title>{$t("d1-manager.name")}</title>
	<meta name="description" content={$t("d1-manager.description")} />
</svelte:head>

<div class="flex h-full w-full items-center justify-center">
	<div class="prose p-2">
		<h1>{$t("select-database-from-above")}</h1>
		<p>
			<a href="https://github.com/JacobLinCool/d1-manager" target="_blank" rel="noreferrer"
				>{$t("see-github")}</a
			>
		</p>

		<p class="text-sm opacity-70">
			{$t("d1-manager.description")}
		</p>

		<div class="divider" />

		<div class="form-control w-full max-w-xs">
			<label class="label" for="theme-select">
				<span class="label-text">{$t("theme")}</span>
			</label>
			<select data-choose-theme id="theme-select" class="select-accent select">
				{#each themes as theme}
					<option value={theme}>{theme}</option>
				{/each}
			</select>
		</div>
	</div>
</div>
