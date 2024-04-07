/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			db: Record<string, D1Database>;
		}
		// interface PageData {}
		interface Platform {
			env: {
				SHOW_INTERNAL_TABLES?: string;
				OPENAI_API_KEY?: string;
				AI?: unknown;
				ACCESS_DOMAIN?: string;
				ACCESS_AUD?: string;
			} & Record<string, Fetcher | string>;
		}
	}
}

export {};
