import { EXTENSION } from "../constants/index.ts";
import * as lib from "../lib/index.ts";
import precinct from "precinct";

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
    const noWhiteSpace: string = fileData.file.replace(/\s/g, "");
    const unusedReferences: Array<string> = [];
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

    return fileData.file;
    // run the code w/o unused imports
    // log any errors
}