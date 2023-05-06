/**
 * Returns a regex template for commonJS require statement syntax as a raw string.
 * @param {string} dep The name of the dependency.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string, hasKeyWord: boolean = false): string => {
  return hasKeyWord ? String.raw`(?<=const|let|var)[A-Za-z0-9]*=require\(["']${dep}["']\)` : String.raw`=require\(["']${dep}["']\)`;
};

/**
 * Returns a regex template for ESM imports syntax as a raw string.
 * @param {string} import The name of the import.
 * @returns the regex for the ESM import.
 */
export const esm = (dep: string): string => {
  return String.raw``;
};

/**
 * need to make functions for regular expressions which check for the following syntaxes:
 * commonJS named dependency i.e. const { name1, name2 } = require("some-package")
 * ESM i.e. import module_name from "my-module"
 * Named ESM i.e. import { name1, name2 } from "my-module"
 */