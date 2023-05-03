/**
 * Represents a DepRegex.
 * @class
 * @constructor
 * @public
 */
abstract class DepRegex {
  
    /**
   * Returns a regex for commonJS require statement as a raw string.
   * @param {string} dep The name of the dependency.
   * @returns The regex for the dependency's commonJS require statement.
   */
  public static commonJS(dep: string): string {
    return String.raw`const[A-Za-z0-9]*=require\(["']${dep}["']\)`;
  }
}

export default DepRegex;
