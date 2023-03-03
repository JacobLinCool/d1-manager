export const DANGER_CLAUSES = [
	"DELETE",
	"UPDATE",
	"DROP",
	"TRUNCATE",
	"ALTER",
	"EXECUTE",
	"GRANT",
	"REVOKE",
];

export const MODIFY_CLAUSES = [...DANGER_CLAUSES, "INSERT"];

export function is_dangerous(sql: string): boolean {
	sql = sql.toUpperCase();
	return DANGER_CLAUSES.some((clause) => sql.includes(clause));
}

export function is_modify(sql: string): boolean {
	sql = sql.toUpperCase();
	return MODIFY_CLAUSES.some((clause) => sql.includes(clause));
}

export function is_readonly(sql: string): boolean {
	return !is_modify(sql);
}
