export type PluginData = {
	db: {
		name: string;
		columns: [
			{
				cid: number;
				name: string;
				type: "INTEGER" | "TEXT" | "REAL" | "BLOB";
				notnull: number;
				dflt_value: string | null;
				pk: number;
			},
		];
		count: number;
	}[];
};
