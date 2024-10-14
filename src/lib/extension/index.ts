import path from "path";
import fs from "node:fs";
import { EXTENSION } from "../../constants/extension.js";

/**
 * Gets the file's extension.
 * @param {string} fileName The file name.
 * @returns {string} The file's extension.
 */
export const getFileExtension = (fileName: string): string => {
    return path.extname(fileName);
}

/**
 * Checks if whether or not a file exists.
 * @param filePath The file path.
 * @returns The path to the index file with the correct file extension.
 */
export const checkIfFileExists = (filePath:string): string => {
    if (fs.existsSync(filePath + EXTENSION.js)) {
        return filePath + EXTENSION.js;
    } else if (fs.existsSync(filePath + "/index" + EXTENSION.js)) {
        return `${filePath}/index${EXTENSION.js}`;
    } else if (fs.existsSync(filePath + EXTENSION.cjs)) {
        return filePath + EXTENSION.cjs;
    } else if (fs.existsSync(filePath + "/index" + EXTENSION.cjs)) {
        return `${filePath}/index${EXTENSION.cjs}`;
    } else if (fs.existsSync(filePath + EXTENSION.ts)) {
        return filePath + EXTENSION.ts;
    } else if (fs.existsSync(filePath + "/index" + EXTENSION.ts)) {
        return `${filePath}/index${EXTENSION.ts}`;
    }
}