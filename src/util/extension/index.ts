import path from "path";

/**
 * Gets the file's extension.
 * @param {string} fileName The file name.
 * @returns {string} The file's extension.
 */
export const getFileExtension = (fileName: string): string => {
    return path.extname(fileName);
}