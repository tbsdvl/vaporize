import { ExecException, execFile } from "node:child_process";

export const executeFilePromise = async (fileName: string): Promise<boolean | ExecException | string> => {
    return new Promise((resolve, reject) => {
        execFile('node', ['--trace-warnings=true --experimental-specifier-resolution=node', fileName], (error, stdout, stderr) => {
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