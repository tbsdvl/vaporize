import { EXTENSION } from "../constants/index.js";
import * as lib from "../lib/index.js";
import precinct from "precinct";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkIfFileExists } from "../lib/extension/index.js";

interface FileData {
    ext: string;
    file: string;
    filePath: string;
}

/**
 * The error list.
 * @type {Array}
 */
const ERROR_LIST = [];

const modulePattern: RegExp = /(import|const|let|var)\s*({[\s\S]*?}|[^\s=]+)\s*=\s*require\s*\(\s*['"](.+?)['"]\s*\)|import\s*(.+?)\s*from\s*['"](.+?)['"]/gm;

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
            filePath: filePath
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
    const modules = fileData.file.match(modulePattern);
    let codeNoModules = fileData.file;
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
        ? String.raw`import[/\s/\{]*${unusedReferences[i]}[\/\s\/\}]*from[\/\s\/]*["'][A-Za-z0-9\-\/\.\:\@]*["'][\/\s\/\;]*`
        : String.raw`(const|let|var)[\/\s\/\{]*${unusedReferences[i]}[\/\s\/\}]*=[\/\s\/]*require\(["'][A-Za-z0-9\-\/\.\:\@]*["']\)[\/\s\/\;]*`;
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

const compileToJavaScript = async (tempDirPath: string) => {
    return await lib.compileToJavaScriptPromise(tempDirPath);
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

const createTsConfigJson = async (targetFile: string, tempDir: string) => {
    let config: Buffer | any;
    const extension = lib.getFileExtension(targetFile);
    if (extension === EXTENSION.ts) {
        config = await fs.readFile(`${path.resolve()}/src/lib/config/ts.json`, "utf-8");
    } else {
        config = await fs.readFile(`${path.resolve()}/src/lib/config/js.json`, "utf-8");
    }
    config = JSON.parse(config);
    config.include = [`src/**/*${extension}`];
    await fs.writeFile(tempDir + "/tsconfig.json", JSON.stringify(config));
}

const compile = async (files: FileData[]): Promise<string> => {
    const targetFile = path.resolve(files[0].filePath);
    const targetDirectory = path.resolve(targetFile.replace(path.basename(targetFile), "").replace("/src", ""), path.dirname(files[0].filePath));
    const uuid = randomUUID();
    const tempDirectory = path.join(targetDirectory, "/", uuid, "/");
    await fs.mkdir(tempDirectory);
    await createTsConfigJson(targetFile, tempDirectory);
    await fs.mkdir(tempDirectory + "src/");
    for (let i = 0; i < files.length; i++) {
        // need to check for a directory
        // if the directory is in the temp build, write the file
        // if the directory is not in the temp build, create it
        // write the file to the new directory.
        try {
            await fs.writeFile(tempDirectory + "src/" + files[i].filePath.replace(targetDirectory + "/", ""), files[i].file);
        } catch (e) {
            console.error(e);
        } finally {
            await deleteDirectory(tempDirectory);
            throw new Error("An error occurred while trying to write the file.")
        }
    }
    await compileToJavaScript(tempDirectory);
    return tempDirectory;
}

const isSourceCodeModule = (filePath: string) => {
    return (filePath.startsWith('./') || filePath.startsWith('../') || filePath.startsWith('/'));
}

const transformFiles = async (filePath: string, basePath: string, files: FileData[]) => {
    if (!path.extname(filePath)) {
        const foundFile = checkIfFileExists(filePath);
        if (foundFile) {
            filePath = fileURLToPath(pathToFileURL(foundFile));
        }
    } else {
        filePath = fileURLToPath(pathToFileURL(filePath));
    }
    const fileData = await getFileData(filePath);
    const dependencies: Array<string> = precinct(fileData.file, { type: fileData.ext === EXTENSION.ts ? "ts" : null });
    if (dependencies.length === 0) {
        files.push(fileData);
        return;
    }

    if ((fileData.ext === EXTENSION.js && fileData.file.includes("import")) || fileData.ext === EXTENSION.ts) {
        removeUnusedDependencies(fileData, dependencies, true);
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {
        removeUnusedDependencies(fileData, dependencies, false);
    }

    files.push(fileData);
    const sourceModules = dependencies.filter(x => isSourceCodeModule(x));
    for (let i = 0; i < sourceModules.length; i++) {
        await transformFiles(basePath + sourceModules[i], basePath, files);
    }
}

/**
 * Removes references to unused dependencies in a JavaScript or TypeScript file.
 * @param {string} filePath The path to the file.
 * @returns
 */
export const vaporize = async (filePath: string) => {
    let files = [];
    await transformFiles(filePath, fileURLToPath(pathToFileURL(filePath)).replace(path.basename(filePath), ""), files);
    console.log("# of files: ", files.length);

    await compile(files);
    // await compile()
    // make the temporary directory
    // write each source module file to the temporary directory
    // compile the temporary directory to javascript

    // let tempFilePath: string;
    // try {
    //     if (hasRemovedUnusedDependencies) {
    //         tempFilePath = await compile(filePath, fileData.file);
    //     }
    // } catch (e) {
    //     console.error(e);
    //     ERROR_LIST.push(e);
    // } finally {
    //     await deleteDirectory(tempFilePath);
    //     if (ERROR_LIST.length === 0) {
    //         await fs.writeFile(filePath, fileData.file);
    //     }
    // }
}