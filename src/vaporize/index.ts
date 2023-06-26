import { EXTENSION } from "../constants/index.js";
import * as lib from "../lib/index.js";
import precinct from "precinct";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

interface FileData {
    ext: string;
    file: string;
}

/**
 * The error list.
 * @type {Array}
 */
const ERROR_LIST = [];

/**
 * The list of sanitized files.
 * @type {Array<string>}
 */
const SANITIZED_FILES: Array<string> = [];

/**
 * Gets the extension and contents of a file.
 * @param {string} filePath The path to the file.
 * @returns A promise including the file extension and the file's contents.
 */
const getFileData = async (filePath: string): Promise<any> => {
    const fileExtension = lib.getFileExtension(filePath);
    if (Object.values(EXTENSION).includes(fileExtension)) {
        return {
            ext: fileExtension,
            file: (await lib.readFile(filePath)).toString()
        };
    }

    throw new Error("Invalid file type.");
}

const removeUnusedDependencies = (fileData: FileData, dependencies: Array<string>, isEsm: boolean): boolean => {
    const codeWithoutWhiteSpace: string = fileData.file.replace(/\s/g, "");
    const dependencyStatements = isEsm
      ? lib.getImports(dependencies, codeWithoutWhiteSpace)
      : lib.getRequirements(dependencies, codeWithoutWhiteSpace);
    const variableNames = lib.getVariableNames(dependencyStatements, dependencies, isEsm);
    const unusedReferences: Array<string> = [];
    for (let i = 0; i < variableNames.length; i++) {
        lib.findVariableReferences(variableNames[i], codeWithoutWhiteSpace, unusedReferences);
    }

    if (unusedReferences.length === 0) {
        console.log("No unused dependencies found.");
        return false;
    }

    for (let i = 0; i < unusedReferences.length; i++) {
        let pattern: string;
        if (unusedReferences[i].includes(String.raw`\{*${unusedReferences[i]},\}*`)) {
            pattern = String.raw`${unusedReferences[i]},*`;
        } else {
            pattern = isEsm
            ? String.raw`import[/\s/\{]*${unusedReferences[i]}[\/\s\/\}]*from[\/\s\/]*["'][A-Za-z0-9\-\/\.\:]*["'][\/\s\/\;]*`
            : String.raw`(const|let|var)[\/\s\/\{]*${unusedReferences[i]}[\/\s\/\}]*=[\/\s\/]*require\(["'][A-Za-z0-9\-\/\.\:]*["']\)[\/\s\/\;]*`;
        }
        fileData.file = fileData.file.replace(new RegExp(pattern, "gm"), "");
    }

    return true;
}

const writeTempFile = async (filePath: string, fileData: FileData): Promise<string> => {
    const temp = path.resolve(filePath);
    const targetDirectory = path.resolve(temp.replace(path.basename(temp), "").replace("/src", ""), path.dirname(filePath));
    const tempFilePath = path.join(targetDirectory, randomUUID() + fileData.ext);
    await fs.writeFile(tempFilePath, fileData.file);
    return tempFilePath;
}

/**
 * Removes references to unused dependencies in a JavaScript or TypeScript file.
 * @param {string} filePath The path to the file.
 * @returns
 */
export const vaporize = async (filePath: string) => {
    const fileData = await getFileData(filePath);
    const dependencies: Array<string> = precinct(fileData.file);
    if (dependencies.length === 0) {
        return;
    }

    let hasRemovedUnusedDependencies: boolean;
    if ((fileData.ext === EXTENSION.js && fileData.file.includes("import")) || fileData.ext === EXTENSION.ts) {
        hasRemovedUnusedDependencies = removeUnusedDependencies(fileData, dependencies, true);
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {
        hasRemovedUnusedDependencies = removeUnusedDependencies(fileData, dependencies, false);
    }

    if (hasRemovedUnusedDependencies) {
        const tempFilePath = await writeTempFile(filePath, fileData);
        const readTempFileResult = await lib.executeFilePromise(tempFilePath);
        if (typeof (readTempFileResult) !== "boolean" && typeof (readTempFileResult) !== "undefined") {
            ERROR_LIST.push(readTempFileResult);
        }
    
        // delete the file
        await fs.unlink(tempFilePath);
    
        if (ERROR_LIST.length === 0) {
            await fs.writeFile(filePath, fileData.file);
        }
    }
}