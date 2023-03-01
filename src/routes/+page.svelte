<script lang="ts">
	import { t } from "svelte-i18n";
</script>

<svelte:head>
	<title>{$t("d1-manager")}</title>
	<meta name="description" content={$t("d1-manager-description")} />
</svelte:head>

<div class="h-full w-full flex justify-center items-center">
	<div class="prose">
		<h1>{$t("select-database-from-above")}</h1>
		<p>
			<a href="https://github.com/JacobLinCool/d1-manager" target="_blank" rel="noreferrer"
				>{$t("see-github")}</a
			>
		</p>
	</div>
</div>
