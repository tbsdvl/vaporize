/**
 * Returns a regex template for commonJS require statement syntax as a raw string.
 * @param {string} dep The name of the dependency.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string, hasKeyWord: boolean = false): string => {
  if (hasKeyWord) {
    return String.raw`(?<=const|let|var)[A-Za-z0-9]*=require\(["']${dep}["']\)`;
  }
  return String.raw`=require\(["']${dep}["']\)`;
};

// need to make functions for regular expressions which check for the following syntaxes
//