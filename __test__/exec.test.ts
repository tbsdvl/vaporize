import { ExecException, execFile } from "node:child_process";

const executeFilePromise = async (fileName: string): Promise<boolean | ExecException | string> => {
    return new Promise((resolve, reject) => {
        execFile('node', ['--experimental-specifier-resolution', fileName], (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }

            if (stdout) {
                console.log(stdout);
            }

            if (stderr) {
                reject(stderr);
            }

            resolve(true);
        });
    });
}

describe("exec", () => {
    it("should successfully execute the script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testFiles/index.js');
        expect(executeFileResult).toBeTruthy();
    });
})