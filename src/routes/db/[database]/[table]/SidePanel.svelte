<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import type { PageData } from "./$types";
	import { fly } from "svelte/transition";
	import { browser } from "$app/environment";
	import { page } from "$app/stores";

	export let data: PageData;

	let show = false;

	onMount(() => {
		if (browser) {
			document.addEventListener("mousemove", move);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener("mousemove", move);
		}
	});

	function move(evt: MouseEvent) {
		if (!browser) {
			return;
		}

		if (!show) {
			show = evt.clientX >= window.innerWidth - 16;
		} else {
			show = evt.clientX >= window.innerWidth - 16 * 20;
		}
	}
</script>

{#if show}
	<div
		class="fixed right-0 top-0 z-20 h-full w-80 max-w-[4/5] p-2 opacity-90"
		transition:fly={{ x: 100, duration: 100 }}
	>
		<div
			class="h-full overflow-auto rounded-lg bg-base-100 shadow-lg ring-1 ring-base-content/50"
		>
			<div class="w-full p-4">
				{#each data.db as table, i}
					<div class="w-full">
						<a class="text-xl" href={`/db/${$page.params.database}/${table.name}`}>
							{table.name}
						</a>

						<div class="pl-4">
							{#each table.columns as column}
								<p class:font-bold={column.pk}>
									{column.name} <span class="opacity-50">{column.type}</span>
								</p>
							{/each}
						</div>
					</div>

					{#if i !== data.db.length - 1}
						<div class="divider my-0" />
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}
