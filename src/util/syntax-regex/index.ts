/**
 * Returns a regex template for commonJS require statement syntax as a raw string.
 * @param {string} dep The name of the dependency.
 * @param {boolean} hasKeyWord A value indicating whether or not the dependency string contains a variable keyword.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string, hasKeyWord: boolean = false): string => {
  return hasKeyWord ? String.raw`(?<=const|let|var)[A-Za-z0-9]*=require\(["']${dep}["']\)` : String.raw`=require\(["']${dep}["']\)`;
};

/**
 * Returns a regex template for ESM imports syntax as a raw string.
 * @param {string} imp The name of the import.
 * @param {boolean} hasImport A value indicating whether or not the import string contains the "import" keyword.
 * @returns the regex for the ESM import.
 */
export const esm = (imp: string, hasImport: boolean = false): string => {
  return hasImport ? String.raw`(?<=import)[A-Za-z0-9]*from["']${imp}["']` : String.raw`from["']${imp}["']`;
};

/**
 * need to make functions for regular expressions which check for the following syntaxes:
 * commonJS named dependency i.e. const { name1, name2 } = require("some-package")
 * ESM i.e. import module_name from "my-module"
 * Named ESM i.e. import { name1, name2 } from "my-module"
 */