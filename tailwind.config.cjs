/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{html,css,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/typography"), require("daisyui")],
};
