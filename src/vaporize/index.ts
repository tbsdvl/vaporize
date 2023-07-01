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
}

const removeUnusedDependencies = (fileData: FileData, dependencies: Array<string>, isEsm: boolean): void => {
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
        return;
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
}

const compileToJavaScript = async (tempDirPath: string) => {
    return await lib.compileToJavaScriptPromise(tempDirPath);
}

const deleteDirectory = async (directoryPath: string): Promise<void> => {
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

const createTsConfig = async (targetFile: string, tempDir: string): Promise<void> => {
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

const createTempDirectories = async (sourcePath: string, tempPath: string, tempDirId: string): Promise<void> => {
    if (path.extname(sourcePath)) {
        sourcePath = sourcePath.replace(path.basename(sourcePath), "");
    }
    const sourcePathEnts = await fs.opendir(sourcePath);
    for await (const dirent of sourcePathEnts) {
        if (dirent.isDirectory() && dirent.name !== tempDirId) {
            const tempFilePath = path.join(tempPath, dirent.name);
            await fs.mkdir(tempFilePath);
            await createTempDirectories(sourcePath + dirent.name, tempFilePath, tempDirId);
        }
    }
}

const writeFilesToTempDirectory = async (files: FileData[], targetDirectory: string, tempDirectory: string): Promise<void> => {
    for (let i = 0; i < files.length; i++) {
        await fs.writeFile(tempDirectory + files[i].filePath.replace(targetDirectory, ""), files[i].file);
    }
}

const createTempBuildDirectory = async (targetFile: string, tempDirectory: string, tempDirId: string): Promise<void> => {
    await fs.mkdir(tempDirectory);
    await createTsConfig(targetFile, tempDirectory);
    await fs.mkdir(tempDirectory + "src/");
    await createTempDirectories(targetFile, tempDirectory + "src/", tempDirId);
}

const resolvePaths = (...paths: string[]): string => {
    return path.resolve(...paths);
}

const compile = async (files: FileData[]): Promise<string> => {
    const targetFile = resolvePaths(files[0].filePath);
    const targetDirectory = resolvePaths(
        targetFile.replace(path.basename(targetFile), "").replace("/src", ""),
        path.dirname(files[0].filePath)
    );
    const uuid = randomUUID();
    const tempDirectory = path.join(targetDirectory, "/", uuid, "/");
    try {
        await createTempBuildDirectory(targetFile, tempDirectory, uuid);
        await writeFilesToTempDirectory(files, targetDirectory, tempDirectory + "src");
        await compileToJavaScript(tempDirectory);
    } catch (e) {
        console.error(e);
        await deleteDirectory(tempDirectory);
        throw new Error("An error occurred during the build.");
    } finally {
        await deleteDirectory(tempDirectory);
    }
    return tempDirectory;
}

const isSourceCodeModule = (filePath: string): boolean => {
    return (filePath.startsWith('./') || filePath.startsWith('../') || filePath.startsWith('/')) && !filePath.includes("node_modules");
}

const getFilePath = (filePath: string): string => {
    return fileURLToPath(pathToFileURL(filePath));
}

const transformFiles = async (filePath: string, basePath: string, files: FileData[]): Promise<void> => {
    if (path.extname(filePath)) {
        filePath = getFilePath(filePath);
    } else {
        filePath = checkIfFileExists(filePath);
        if (!filePath) {
            console.log("Skipping file at: ", filePath);
            return;
        }
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
    await transformFiles(filePath, getFilePath(filePath).replace(path.basename(filePath), ""), files);
    console.log("# of files: ", files.length);

    await compile(files);
}