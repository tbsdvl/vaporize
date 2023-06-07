import { EXTENSION } from "../constants/index.ts";
import * as lib from "../lib/index.ts";
import precinct from "precinct";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

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
            file: (await lib.readFile(new URL(filePath, import.meta.url))).toString()
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
            fileData.file = fileData.file.replace(new RegExp(String.raw`import[/\s/]*${variableName}[/\s/]*from[/\s/]*["'][A-Za-z0-9\-\:]*["'][/\s/\;]*`, "gm"), "");
        }
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {

    }

    // write sanitized code to a new temp file
    const splitFilePath = filePath.split("/");
    const temp = fileURLToPath(import.meta.url);
    // const tempFilePath = `${fileURLToPath(pathToFileURL(filePath))}\\${randomUUID()}${fileData.ext}`.replace(`\\${splitFilePath[splitFilePath.length - 1]}`, "");
    const tempFilePath = `${'C:\\Users\\TristonBurns\\myProjects\\vaporize\\src\\vaporize\\..\\..\\__test__\\testFiles\\'}${randomUUID()}${fileData.ext}`;
    fs.writeFileSync(tempFilePath, fileData.file);

    const readTempFileResult = await lib.executeFilePromise(tempFilePath);

    // delete the file
    fs.unlink(tempFilePath, (err) => {
        if (err) {
            throw err;
        }
    });
    // run the code in the new temp file with executeFilePromise
    // log any errors
}