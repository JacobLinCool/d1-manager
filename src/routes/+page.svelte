<script lang="ts">
	import { t } from "svelte-i18n";
</script>

<svelte:head>
	<title>{$t("d1-manager.name")}</title>
	<meta name="description" content={$t("d1-manager.description")} />
</svelte:head>

<div class="h-full w-full flex justify-center items-center">
	<div class="prose p-2">
		<h1>{$t("select-database-from-above")}</h1>
		<p>
			<a href="https://github.com/JacobLinCool/d1-manager" target="_blank" rel="noreferrer"
				>{$t("see-github")}</a
			>
		</p>

		<p class="text-sm text-gray-500">
			{$t("d1-manager.description")}
		</p>
	</div>
</div>
