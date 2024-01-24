import debug from "debug";

export const log = debug("d1-manager");
export const extend = (name: string) => log.extend(name);
debug.enable("d1-manager*");
