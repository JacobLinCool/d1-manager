export async function sqlite2sql(sqlite3: ArrayBuffer): Promise<string> {
	const module = await import("sql.js");
	const init = module.default;
	console.log(init);
	const SQL = await init({ locateFile: (file) => `https://sql.js.org/dist/${file}` });

	const db = new SQL.Database(new Uint8Array(sqlite3));

	let sql = "";

	// list all tables
	const tables = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table';")[0];
	console.log({ tables });
	if (tables) {
		tables.values = tables.values.filter((table) => {
			const name = table[0] as string;
			return (
				!name.startsWith("sqlite_") && !name.startsWith("d1_") && !name.startsWith("_cf_")
			);
		});
		for (const table of tables.values) {
			if (table[1]) {
				sql += table[1] + "\n";
			}
		}
	}

	// list all indexes
	const indexes = db.exec("SELECT name, sql FROM sqlite_master WHERE type='index';")[0];
	console.log({ indexes });
	if (indexes) {
		for (const index of indexes.values) {
			if (index[1]) {
				sql += index[1] + "\n";
			}
		}
	}

	// list all triggers
	const triggers = db.exec("SELECT name, sql FROM sqlite_master WHERE type='trigger';")[0];
	console.log({ triggers });
	if (triggers) {
		for (const trigger of triggers.values) {
			if (trigger[1]) {
				sql += trigger[1] + "\n";
			}
		}
	}

	// list all views
	const views = db.exec("SELECT name, sql FROM sqlite_master WHERE type='view';")[0];
	console.log({ views });
	if (views) {
		for (const view of views.values) {
			if (view[1]) {
				sql += view[1] + "\n";
			}
		}
	}

	// list all virtual tables
	const vtables = db.exec("SELECT name, sql FROM sqlite_master WHERE type='vtable';")[0];
	console.log({ vtables });
	if (vtables) {
		for (const vtable of vtables.values) {
			if (vtable[1]) {
				sql += vtable[1] + "\n";
			}
		}
	}

	// add all data
	if (tables) {
		for (const table of tables.values) {
			const name = table[0];
			const rows = db.exec(`SELECT * FROM \`${name}\`;`)[0];
			if (!rows) {
				console.log(`No rows found for table ${name}`);
				continue;
			}
			const cols = rows.columns;
			const vals = rows.values;
			console.log({ name, cols, vals });
			for (const val of vals) {
				sql += `INSERT INTO \`${name}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${val
					.map((v) =>
						typeof v === "string"
							? `'${v.replace(/'/g, "''").replace(/\n/g, "\\n")}'`
							: typeof v === "number"
								? v
								: v instanceof Uint8Array
									? `X'${v.reduce((s, v) => s + v.toString(16).padStart(2, "0"), "")}'`
									: "NULL",
					)
					.join(", ")})\n`;
			}
		}
	}

	return sql;
}
