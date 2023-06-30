import path from "path";
import fs from "node:fs";
import { EXTENSION } from "../../constants/extension.js";

/**
 * Gets the file's extension.
 * @param {string} fileName The file name.
 * @returns {string} The file's extension.
 */
export const getFileExtension = (fileName: string): string => {
    const extension = path.extname(fileName);
    if (extension) {
        return extension;
    }
}

export const checkIfFileExists = (fileName:string): string => {
    if (fs.existsSync(fileName + EXTENSION.js)) {
        return fileName + EXTENSION.js;
    } else if (fs.existsSync(fileName + "/index" + EXTENSION.js)) {
        return `${fileName}/index${EXTENSION.js}`;
    } else if (fs.existsSync(fileName + EXTENSION.cjs)) {
        return fileName + EXTENSION.cjs;
    } else if (fs.existsSync(fileName + "/index" + EXTENSION.cjs)) {
        return `${fileName}/index${EXTENSION.cjs}`;
    } else if (fs.existsSync(fileName + EXTENSION.ts)) {
        return fileName + EXTENSION.ts;
    } else if (fs.existsSync(fileName + "/index" + EXTENSION.ts)) {
        return `${fileName}/index${EXTENSION.ts}`;
    }
}