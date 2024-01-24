export type Type = "TEXT" | "INTEGER" | "REAL" | "BLOB" | "NUMERIC";

export function affinity(name?: string): Type {
	name = name?.toUpperCase();

	if (name?.includes("INT")) {
		return "INTEGER";
	}

	if (name?.includes("CHAR") || name?.includes("CLOB") || name?.includes("TEXT")) {
		return "TEXT";
	}

	if (typeof name === "undefined" || name.includes("BLOB")) {
		return "BLOB";
	}

	if (name.includes("REAL") || name.includes("FLOA") || name.includes("DOUB")) {
		return "REAL";
	}

	return "NUMERIC";
}

export function cast<T extends Type>(value: unknown, type: T): unknown {
	switch (type) {
		case "TEXT":
			return String(value);
		case "INTEGER":
			return Number.isNaN(Number(value)) ? null : parseInt(value as string);
		case "REAL":
			return Number.isNaN(Number(value)) ? null : parseFloat(value as string);
		case "BLOB":
			return value;
		case "NUMERIC":
			return value;
	}
}
