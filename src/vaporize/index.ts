import { EXTENSION } from "../constants/index.js";
import * as lib from "../lib/index.js";
import precinct from "precinct";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

interface FileData {
    ext: string;
    file: string;
    initFilePath: string;
    entryPoint: string;
    uuid: string;
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
            file: (await lib.readFile(filePath)).toString(),
            initFilePath: filePath.replace(/\\/g, "\\\\"),
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

const compileTypeScriptToJavaScript = async (filePath: string, tempDirPath: string, fileData: FileData) => {
    await lib.compileTypeScriptPromise(filePath, tempDirPath);
    await renameFiles(tempDirPath, fileData);
}

const deleteDirectory = async (directoryPath: string) => {
    try {
        const dir = await fs.opendir(directoryPath);

        for await (const dirent of dir) {
          const filePath = path.join(directoryPath, dirent.name);
          if (dirent.isDirectory()) {
            await deleteDirectory(filePath); // Recursively delete subdirectories
          } else {
            await fs.unlink(filePath); // Delete files
          }
        }

        await fs.rmdir(directoryPath); // Delete the empty directory
      } catch (error) {
        console.error('Failed to delete directory:', error);
      }
}

const renameFiles = async (tempDirPath: string, fileData: FileData) => {
    const files = await fs.readdir(tempDirPath);
    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(tempDirPath, files[i]);

        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            // Recursively handle subdirectories
            await renameFiles(filePath, fileData);
        } else {
            // Rename the file with a .cjs file extension
            const newFilePath = path.join(tempDirPath, path.parse(files[i]).name + '.cjs');
            if (!fileData.entryPoint) {
                let tempPath = newFilePath.replace(/\\/g, "\\\\").replace(String.raw`\\${fileData.uuid}`, "");
                if (tempPath === fileData.initFilePath.replace(EXTENSION.ts, EXTENSION.cjs)) {
                    fileData.entryPoint = newFilePath;
                }
                tempPath = newFilePath.replace(/\\/g, "\\\\").replace(new RegExp(String.raw`${fileData.uuid}[\\]+\\([A-Za-z0-9\-]*\\+)?`), "");
                if (tempPath === fileData.initFilePath.replace(EXTENSION.ts, EXTENSION.cjs)) {
                    fileData.entryPoint = newFilePath;
                }
            }

            await fs.rename(filePath, newFilePath);
        }
    }
}

const writeTempFile = async (filePath: string, fileData: FileData): Promise<string> => {
    const temp = path.resolve(filePath);
    const targetDirectory = path.resolve(temp.replace(path.basename(temp), "").replace("/src", ""), path.dirname(filePath));
    let tempFilePath: string;
    fileData.uuid = randomUUID();
    if (fileData.ext === EXTENSION.ts) {
        // C:\Users\TristonBurns\source\repos\eAZ2\src\EAZ.Web\ClientApp\src\app\business-applications\34177000-1708-4aa8-850f-c8d717a266ad\
        tempFilePath = path.join(targetDirectory, "/", fileData.uuid, "/");
        // entrypoint is @
        await compileTypeScriptToJavaScript(filePath, tempFilePath, fileData);
    } else {
        tempFilePath = path.join(targetDirectory, fileData.uuid + fileData.ext);
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
    const dependencies: Array<string> = precinct(fileData.file, { type: fileData.ext === EXTENSION.ts ? "ts" : null });
    if (dependencies.length === 0) {
        return;
    }

    let hasRemovedUnusedDependencies: boolean;
    if ((fileData.ext === EXTENSION.js && fileData.file.includes("import")) || fileData.ext === EXTENSION.ts) {
        hasRemovedUnusedDependencies = removeUnusedDependencies(fileData, dependencies, true);
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {
        hasRemovedUnusedDependencies = removeUnusedDependencies(fileData, dependencies, false);
    }

    let tempFilePath: string;
    try {
        if (hasRemovedUnusedDependencies) {
            tempFilePath = await writeTempFile(filePath, fileData);
            let readTempFileResult;
            if (fileData.ext === EXTENSION.ts) {
                readTempFileResult = await lib.executeFilePromise(fileData.entryPoint);
            } else {
                readTempFileResult = await lib.executeFilePromise(tempFilePath);
            }
            if (typeof (readTempFileResult) !== "boolean" && typeof (readTempFileResult) !== "undefined") {
                ERROR_LIST.push(readTempFileResult);
            }
        }
    } catch (e) {
        console.error(e);
        ERROR_LIST.push(e);
    } finally {
        // delete the file or folder.
        if (fileData.ext === EXTENSION.ts) {
            await deleteDirectory(tempFilePath);
        } else {
            await fs.unlink(tempFilePath);
        }

        if (ERROR_LIST.length === 0) {
            await fs.writeFile(filePath, fileData.file);
        }
    }
}