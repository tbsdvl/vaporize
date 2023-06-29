import { ExecException, execFile } from "node:child_process";
import { getFileExtension } from "../index.js";
import { EXTENSION } from "../../constants/extension.js";

const getCommandArray = (fileName: string, tempDir: string): string[] => {
    return getFileExtension(fileName) === EXTENSION.ts
    ? ["tsc", fileName, "--outDir", tempDir, "--experimentalDecorators", "--emitDecoratorMetadata"]
    : ["tsc", fileName, "--outDir", tempDir, "--allowJs", "--target", "ES2017", "--module", "CommonJS"];
}

export const compileToJavaScriptPromise = async (fileName: string, tempDir: string): Promise<boolean | ExecException | string> => {
    return new Promise((resolve, reject) => {
        execFile('npx', getCommandArray(fileName, tempDir), { shell: true },
            (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }

                if (stdout) {
                    console.log(stdout);
                }

                if (stderr) {
                    console.error(stderr);
                }

                resolve(true);
        });
    });
}