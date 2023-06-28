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

    // filter out import statements
    const modules = codeWithoutWhiteSpace.match(/(import|const|let|var)\s*({[\s\S]*?}|[^\s=]+)\s*=\s*require\s*\(\s*['"](.+?)['"]\s*\)|import\s*(.+?)\s*from\s*['"](.+?)['"]/gm);
    let codeNoModules = codeWithoutWhiteSpace;
    for (let i = 0; i < modules.length; i++) {
        codeNoModules = codeNoModules.replace(modules[i], "");
    }

    for (let i = 0; i < variableNames.length; i++) {
        lib.findVariableReferences(variableNames[i], codeNoModules, unusedReferences);
    }

    if (unusedReferences.length === 0) {
        console.log("No unused dependencies found.");
        return false;
    }

    for (let i = 0; i < unusedReferences.length; i++) {
        let pattern: string;
        pattern = isEsm
        ? String.raw`import[/\s/\{]*${unusedReferences[i]}[\/\s\/\}]*from[\/\s\/]*["'][A-Za-z0-9\-\/\.\:]*["'][\/\s\/\;]*`
        : String.raw`(const|let|var)[\/\s\/\{]*${unusedReferences[i]}[\/\s\/\}]*=[\/\s\/]*require\(["'][A-Za-z0-9\-\/\.\:]*["']\)[\/\s\/\;]*`;
        let matches: RegExpMatchArray;
        matches = fileData.file.match(new RegExp(pattern, "gm"));
        if (matches) {
            fileData.file = fileData.file.replace(new RegExp(pattern, "gm"), "");
            continue;
        }
        pattern = String.raw`\b${unusedReferences[i]}\b,?`;
        matches = fileData.file.match(new RegExp(pattern));
        if (matches) {
            fileData.file = fileData.file.replace(new RegExp(pattern), "");
        }
    }

    return true;
}

const compileTypeScriptToJavaScript = async (filePath: string, tempDirPath: string) => {
    await lib.compileTypeScriptPromise(filePath, tempDirPath);
    await renameFiles(tempDirPath);
}

const renameFiles = async (tempDirPath: string) => {
    const files = await fs.readdir(tempDirPath);
    files.forEach(async (file) => {
        const filePath = path.join(tempDirPath, file);

        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            // Recursively handle subdirectories
            renameFiles(filePath);
        } else {
            // Rename the file with a .cjs file extension
            const newFilePath = path.join(tempDirPath, path.parse(file).name + '.cjs');

            await fs.rename(filePath, newFilePath);
        }
    })
}

const writeTempFile = async (filePath: string, fileData: FileData): Promise<string> => {
    const temp = path.resolve(filePath);
    const targetDirectory = path.resolve(temp.replace(path.basename(temp), "").replace("/src", ""), path.dirname(filePath));
    let tempFilePath: string;
    if (fileData.ext === EXTENSION.ts) {
        tempFilePath = path.join(targetDirectory, "/", randomUUID(), "/");
        await compileTypeScriptToJavaScript(filePath, tempFilePath);
    } else {
        tempFilePath = path.join(targetDirectory, randomUUID() + fileData.ext);
        await fs.writeFile(tempFilePath, fileData.file);
    }
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
        let readTempFileResult;
        if (fileData.ext === EXTENSION.ts) {
            // execute the javascript file in the new folder.
            readTempFileResult = await lib.executeFilePromise(tempFilePath + path.parse(filePath).base.replace(EXTENSION.ts, EXTENSION.cjs));
        } else {
            readTempFileResult = await lib.executeFilePromise(tempFilePath);
        }
        if (typeof (readTempFileResult) !== "boolean" && typeof (readTempFileResult) !== "undefined") {
            ERROR_LIST.push(readTempFileResult);
        }

        // delete the file or folder.
        await fs.unlink(tempFilePath);

        if (ERROR_LIST.length === 0) {
            await fs.writeFile(filePath, fileData.file);
        }
    }
}