// This file contains utility functions that are used in the project

// This list contains all special characters that should be quoted in a name string
const SPECIAL_CHARS = ["-"];

/**
 * This function checks if a string contains any special characters and therefore should be quoted
 * @param str The string to check
 * @returns True if the string contains any special characters, otherwise false
 */
function should_quote(str: string) {
	return SPECIAL_CHARS.some((char) => str.includes(char));
}

/**
 * This function enclose a name string in single quotes if it contains special characters predefined by the SPECIAL_CHARS list
 * @param name The name to escape
 * @returns A name enclosed in single quotes if it contains special characters, otherwise the name itself
 */
export function quote_name(name: string): string {
	return should_quote(name) ? `'${name}'` : name;
}
