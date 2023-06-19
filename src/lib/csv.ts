export async function export_csv(results: Record<string, unknown>[], name = "table") {
	if (!results) {
		return;
	}

	const module = await import("csv-stringify/browser/esm/sync");
	const { stringify } = module;

	const csv = stringify(results, {
		header: true,
		columns: Object.keys(results[0]),
	});

	const a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
	a.setAttribute("download", `${name}.csv`);
	a.click();
	URL.revokeObjectURL(a.href);
	a.remove();
}
