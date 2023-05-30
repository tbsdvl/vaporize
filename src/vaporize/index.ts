import { EXTENSION } from "../constants/index.ts";
import * as lib from "../lib/index.ts";

/**
 * Gets the contents of a file as a string.
 * @param {string} filePath The path to the file.
 * @returns A void promise.
 */
export const getFileString = async (filePath: string): Promise<Buffer | NodeJS.ErrnoException | Error> => {
    if (Object.values(EXTENSION).includes(lib.getFileExtension(filePath))) {
        return await lib.readFile(new URL(filePath, import.meta.url));
    }
    
    throw new Error("Invalid file type.");
}

export const vaporize = async (filePath: string) => {
    const fileString = await getFileString(filePath);
    return fileString;

    // get the list of unusued imports
    // remove the unused imports
    // run the code w/o unused imports
    // log any errors
}