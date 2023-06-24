import { EXTENSION } from "../constants/index.ts";
import * as lib from "../lib/index.ts";
import precinct from "precinct";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

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

    let dependencyStatements: Array<string> = [];
    let variableNames: Array<string> = [];
    const unusedReferences: Array<string> = [];
    const codeWithoutWhiteSpace: string = fileData.file.replace(/\s/g, "");
    if ((fileData.ext === EXTENSION.js && fileData.file.includes("import")) || fileData.ext === EXTENSION.ts) {
        dependencyStatements = lib.getImports(dependencies, codeWithoutWhiteSpace);
        variableNames = lib.getVariableNames(dependencyStatements, dependencies, true);
        for (let i = 0; i < variableNames.length; i++) {
            const variableName = variableNames[i];
            lib.findVariableReferences(variableName, codeWithoutWhiteSpace, unusedReferences);
        }

        if (unusedReferences.length === 0) {
            console.log("No unused dependencies found.");
            return;
        }

        // iterate over each unused reference & replace with empty string
        for (let i = 0; i < unusedReferences.length; i++) {
            fileData.file = fileData.file.replace(new RegExp(String.raw`import[/\s/]*${unusedReferences[i]}[/\s/]*from[/\s/]*["'][A-Za-z0-9\-\:]*["'][/\s/\;]*`, "gm"), "");
        }
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {
        dependencyStatements = lib.getRequirements(dependencies, codeWithoutWhiteSpace);
        variableNames = lib.getVariableNames(dependencyStatements, dependencies, false);
        for (let i = 0; i < variableNames.length; i++) {
            const variableName = variableNames[i];
            lib.findVariableReferences(variableName, codeWithoutWhiteSpace, unusedReferences);
        }

        if (unusedReferences.length === 0) {
            console.log("No unused dependencies found.");
            return;
        }
        
        // iterate over each unused reference & replace with empty string
        for (let i = 0; i < unusedReferences.length; i++) {
            fileData.file = fileData.file.replace(new RegExp(String.raw`(const|let|var)[/\s/]*${unusedReferences[i]}[/\s/]*=[/\s/]*require\(["'][A-Za-z0-9\-]*["']\)[/\s/\;]*`, "gm"), "");
        }
    }

    // This will only work for files within the vaporize directory.
    // I need to figure out how I can read & write files from outside of the Vaporize project
    const temp = path.resolve(filePath);
    const targetDirectory = path.resolve(temp.replace(path.basename(temp), "").replace("/src", ""), path.dirname(filePath));
    const tempFilePath = path.join(targetDirectory, randomUUID() + fileData.ext);
    await fs.writeFile(tempFilePath, fileData.file);
    const readTempFileResult = await lib.executeFilePromise(tempFilePath);
    if (typeof (readTempFileResult) !== "boolean" && typeof (readTempFileResult) !== "undefined") {
        ERROR_LIST.push(readTempFileResult);
    }

    // delete the file
    await fs.unlink(tempFilePath);

    // replace the code in the file with the sanitized code if executing the code did not throw any errors
    if (ERROR_LIST.length === 0) {
        await fs.writeFile(filePath, fileData.file);
    }
}