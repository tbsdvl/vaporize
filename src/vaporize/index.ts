import { EXTENSION } from "../constants/index.js";
import * as lib from "../lib/index.js";
import precinct from "precinct";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkIfFileExists } from "../lib/extension/index.js";
import { ExecException } from "node:child_process";

interface FileData {
    ext: string;
    fileContent: string;
    filePath: string;
    hasRemovedDependencies: boolean;
}

const modulePattern: RegExp = /(import|const|let|var)\s*({[\s\S]*?}|[^\s=]+)\s*=\s*require\s*\(\s*['"](.+?)['"]\s*\)|import\s*(.+?)\s*from\s*['"](.+?)['"]/gm;
const esmImportPattern: RegExp = /import\s*(.+?)\s*from\s*['"](.+?)['"]/g;
const node_modules = "node_modules";
const tsConfigJson = {
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
};
const cjsConfigPath = {
    "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "allowJs": true,
         "target": "ES2017",
         "module": "CommonJS"
    }
};
const src = "src/";
const empty = "";
const git = ".git";

/**
 * Gets the extension and contents of a file.
 * @param {string} filePath The path to the file.
 * @returns A promise including the file extension and the file's contents.
 */
const getFileData = async (filePath: string): Promise<FileData> => {
    const fileExtension = lib.getFileExtension(filePath);
    if (Object.values(EXTENSION).includes(fileExtension)) {
        return {
            ext: fileExtension,
            fileContent: (await lib.readFile(filePath)).toString(),
            filePath: filePath,
            hasRemovedDependencies: false
        };
    }
}

/**
 * Removes unused dependencies in a file's contents.
 * @param {FileData} fileData The file data.
 * @param {string[]} dependencies The list of the file's dependencies.
 * @param {boolean} isEsm A value indicating whether or not the file uses ESM syntax.
 */
const removeUnusedDependencies = (fileData: FileData, dependencies: Array<string>, isEsm: boolean): void => {
    const codeWithoutWhiteSpace: string = fileData.fileContent.replace(/\s/g, empty);
    const dependencyStatements = lib.getModules(dependencies, codeWithoutWhiteSpace, isEsm);
    const variableNames = lib.getVariableNames(dependencyStatements, dependencies, isEsm);
    const unusedReferences: Array<string> = [];

    // filter out import statements
    const modules = fileData.fileContent.match(modulePattern);
    let codeNoModules = fileData.fileContent;
    for (let i = 0; i < modules.length; i++) {
        codeNoModules = codeNoModules.replace(modules[i], empty);
    }

    for (let i = 0; i < variableNames.length; i++) {
        lib.findVariableReferences(variableNames[i], codeNoModules, unusedReferences);
    }

    if (unusedReferences.length === 0) {
        return;
    }

    for (let i = 0; i < unusedReferences.length; i++) {
        let pattern: string = isEsm
        ? String.raw`import[/\s/\{]*${unusedReferences[i]}[\/\s\/\}]*from[\/\s\/]*["'][A-Za-z0-9\-\/\.\:\@]*["'][\/\s\/\;]*`
        : String.raw`(const|let|var)[\/\s\/\{]*${unusedReferences[i]}[\/\s\/\}]*=[\/\s\/]*require\(["'][A-Za-z0-9\-\/\.\:\@]*["']\)[\/\s\/\;]*`;
        let matches: RegExpMatchArray = fileData.fileContent.match(new RegExp(pattern, "gm"));
        if (matches) {
            fileData.fileContent = fileData.fileContent.replace(new RegExp(pattern, "gm"), empty);
            continue;
        }
        pattern = String.raw`\b${unusedReferences[i]}\b,?[\/\s\/]*`;
        matches = fileData.fileContent.match(new RegExp(pattern));
        if (matches) {
            fileData.fileContent = fileData.fileContent.replace(new RegExp(pattern), empty);
        }
    }
}

/**
 * Compiles the temporary directory to JavaScript.
 * @param {string} tempDirPath The path to the temporary directory.
 * @returns {Promise<string | boolean | ExecException>} A promise indicating whether or not the temporary directory successfully compiled to JavaScript.
 */
const compileToJavaScript = async (tempDirPath: string): Promise<string | boolean | ExecException> => {
    return await lib.compileToJavaScriptPromise(tempDirPath);
}

/**
 * Recursively deletes a directory.
 * @param {string} directoryPath The directory path.
 */
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

/**
 * Creates a tsconfig.json file.
 * @param {string} targetFile The target file.
 * @param {string} tempDirPath The path to the temporary directory.
 */
const createTsConfig = async (targetFile: string, tempDirPath: string): Promise<void> => {
    let config: Buffer | any;
    const extension = lib.getFileExtension(targetFile);
    config = extension === EXTENSION.ts ? tsConfigJson : cjsConfigPath;
    config.include = [`src/**/*${extension}`];
    await fs.writeFile(tempDirPath + "/tsconfig.json", JSON.stringify(config));
}

/**
 * Creates the temporary directories.
 * @param {string} sourcePath The souce code path.
 * @param {string} tempPath The temporary directory path.
 * @param {string} tempDirId The temporary directory id.
 */
const createTempDirectories = async (sourcePath: string, tempPath: string, tempDirId: string): Promise<void> => {
    if (path.extname(sourcePath)) {
        sourcePath = sourcePath.replace(path.basename(sourcePath), empty);
    }
    for await (const dirent of await fs.opendir(sourcePath)) {
        if (dirent.isDirectory() && dirent.name !== tempDirId && dirent.name !== node_modules && dirent.name !== git) {
            const tempFilePath = path.join(tempPath, dirent.name);
            await fs.mkdir(tempFilePath);
            if (sourcePath.endsWith("/")) {
                sourcePath = sourcePath.slice(0, sourcePath.length - 1);
            }
            await createTempDirectories(sourcePath + `/${dirent.name}`, tempFilePath, tempDirId);
        }
    }
}

/**
 * Writes copies of the files to the temporary directory.
 * @param {FileData[]} files The list of files.
 * @param {string} targetDirectory The target directory.
 * @param {string} tempDirectory The temporary directory.
 */
const writeFilesToTempDirectory = async (files: FileData[], targetDirectory: string, tempDirectory: string): Promise<void> => {
    for (let i = 0; i < files.length; i++) {
        await fs.writeFile(tempDirectory + files[i].filePath.replace(targetDirectory, empty), files[i].fileContent);
    }
}

/**
 * Creates the temporary directory for the copied files.
 * @param {string} targetPath The target path.
 * @param {string} tempDirectory The temporary directory.
 * @param {string} tempDirId The temporary directory's id.
 */
const createTempBuildDirectory = async (targetPath: string, tempDirectory: string, tempDirId: string): Promise<void> => {
    await fs.mkdir(tempDirectory);
    await createTsConfig(targetPath, tempDirectory);
    await fs.mkdir(tempDirectory + src);
    await createTempDirectories(targetPath, tempDirectory + src, tempDirId);
}

/**
 * Resolves a list of paths.
 * @param {string[]} paths The list of paths.
 * @returns The path.
 */
const resolvePaths = (...paths: string[]): string => {
    return path.resolve(...paths);
}

/**
 * Compiles the copied files in the temporary directory.
 * @param {FileData[]} files The list of files.
 * @returns {string} The path to the temporary build's directory.
 */
const compile = async (files: FileData[]): Promise<string> => {
    const targetFile = resolvePaths(files[0].filePath);
    const targetDirectory = resolvePaths(
        targetFile.replace(path.basename(targetFile), empty).replace("/src", empty),
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
        console.error("An error occurred during the build.");
    } finally {
        await deleteDirectory(tempDirectory);
    }
    return tempDirectory;
}

/**
 * Determines whether or not a file path points to a source code module.
 * @param {string} filePath The file path.
 * @returns {boolean} A value indicating whether or not the file path points to a source code module.
 */
const isSourceCodeModule = (filePath: string): boolean => {
    return (filePath.startsWith('./') || filePath.startsWith('../') || filePath.startsWith('/')) && !filePath.includes(node_modules);
}

/**
 * Gets the file path.
 * @param {string} filePath
 * @returns {string} The file path.
 */
const getFilePath = (filePath: string): string => {
    return fileURLToPath(pathToFileURL(filePath));
}

/**
 * Transforms the file's content if it has unused dependencies.
 * @param {string} filePath The file path.
 * @param {FileData[]} files The list of files.
 * @returns
 */
const transformFileContent = async (filePath: string, files: FileData[]): Promise<void> => {
    if (path.extname(filePath)) {
        filePath = getFilePath(filePath);
    } else {
        filePath = checkIfFileExists(filePath);
        if (!filePath) {
            console.log("Skipping file: ", filePath);
            return;
        }
    }

    const fileData = await getFileData(filePath);
    if (!fileData || files.indexOf(fileData) !== -1) {
        return;
    }

    const dependencies: Array<string> = precinct(
        fileData.fileContent,
        { type: fileData.ext === EXTENSION.ts ? "ts" : null }
    );
    if (dependencies.length === 0) {
        files.push(fileData);
        return;
    }

    if ((fileData.ext === EXTENSION.js && fileData.fileContent.match(esmImportPattern)?.length) || fileData.ext === EXTENSION.ts) {
        removeUnusedDependencies(fileData, dependencies, true);
    } else if (fileData.ext === EXTENSION.cjs || fileData.ext === EXTENSION.js) {
        removeUnusedDependencies(fileData, dependencies, false);
    }

    fileData.hasRemovedDependencies = true;
    files.push(fileData);
    const sourceModules = dependencies.filter(x => isSourceCodeModule(x));
    for (let i = 0; i < sourceModules.length; i++) {
        await transformFileContent(fileData.filePath.replace(path.basename(fileData.filePath), empty) + sourceModules[i], files);
    }
}

/**
 * Overwrites file contents if the file removed the unused dependencies.
 * @param {FileData[]} files The list of files.
 */
const overwriteFileContents = async (files: FileData[]) => {
    for (let i = 0; i < files.length; i++) {
        if (files[i].hasRemovedDependencies) {
            await fs.writeFile(files[i].filePath, files[i].fileContent);
        }
    }
}

/**
 * Removes references to unused dependencies in a JavaScript or TypeScript file.
 * @param {string} filePath The path to the file.
 * @returns
 */
export const vaporize = async (filePath: string) => {
    console.log("Transforming files...");
    let files = [];
    await transformFileContent(filePath, files);
    if (files.length > 0) {
        await compile(files);
        console.log("Build succeeded. VAPORIZING...");
        await overwriteFileContents(files);
        console.log(`vaporize successfully removed unused dependencies.`);
    } else {
        console.log("No unused dependencies found.");
    }
}