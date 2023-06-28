import { ExecException, execFile } from "node:child_process";
import { moduleType } from "../index.js";

export const executeFilePromise = async (fileName: string): Promise<boolean | ExecException | string> => {
    return new Promise((resolve, reject) => {
        execFile(
            'node',
            [moduleType === "module" ? '--trace-warnings=true --experimental-specifier-resolution=node' : "", fileName],
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
        })
    });
}

export const compileTypeScriptPromise = async (fileName: string, tempDir: string): Promise<boolean | ExecException | string> => {
    return new Promise((resolve, reject) => {
        execFile(
            'npx',
            ["tsc", fileName, "--outDir", tempDir],
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