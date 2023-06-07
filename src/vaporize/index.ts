import { EXTENSION } from "../constants/index.ts";
import * as lib from "../lib/index.ts";
import precinct from "precinct";
import fs from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";

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

    let importStatements: Array<string> = [];
    let variableNames: Array<string> = [];
    const unusedReferences: Array<string> = [];
    const noWhiteSpace: string = fileData.file.replace(/\s/g, "");
    if (fileData.ext === EXTENSION.js && fileData.file.includes("import") || fileData.ext === EXTENSION.ts) {
        importStatements = lib.getImports(dependencies, noWhiteSpace);
        variableNames = lib.getVariableNames(importStatements, dependencies, true);
        for (let i = 0; i < variableNames.length; i++) {
            const variableName = variableNames[i];
            lib.findVariableReferences(variableName, noWhiteSpace, unusedReferences);
        }

        // iterate over each unused reference & replace with empty string
        for (let i = 0; i < unusedReferences.length; i++) {
            fileData.file = fileData.file.replace(new RegExp(String.raw`import[/\s/]*${unusedReferences[i]}[/\s/]*from[/\s/]*["'][A-Za-z0-9\-\:]*["'][/\s/\;]*`, "gm"), "");
        }
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {

    }

    // This will only work for files within the vaporize directory.
    // I need to figure out how I can read & write files from outside of the Vaporize project
    const temp = path.resolve(filePath);
    const targetDirectory = path.resolve(temp.replace(path.basename(temp), "").replace("/src", ""), path.dirname(filePath));
    const tempFilePath = path.join(targetDirectory, randomUUID() + fileData.ext);
    await fs.writeFile(tempFilePath, fileData.file);
    const readTempFileResult = await lib.executeFilePromise(tempFilePath);

    // delete the file
    await fs.unlink(tempFilePath);
    // run the code in the new temp file with executeFilePromise
    // log any errors
}