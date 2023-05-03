/**
 * Returns a regex for commonJS require statement as a raw string.
 * @param {string} dep The name of the dependency.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string): string => {
  return String.raw`[A-Za-z0-9]*=require\(["']${dep}["']\)`;
};
