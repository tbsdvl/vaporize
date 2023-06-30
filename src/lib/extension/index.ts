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

    if (fs.existsSync(fileName + EXTENSION.js) || fs.existsSync(fileName + "/index" + EXTENSION.js)) {
        return EXTENSION.js;
    } else if (fs.existsSync(fileName + EXTENSION.cjs) || fs.existsSync(fileName + "/index" + EXTENSION.cjs)) {
        return EXTENSION.cjs;
    } else if (fs.existsSync(fileName + EXTENSION.ts) || fs.existsSync(fileName + "/index" + EXTENSION.ts)) {
        return EXTENSION.ts;
    }
}