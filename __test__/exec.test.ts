import { ExecException, execFile, spawnSync } from "node:child_process";

const executeFilePromise = async (fileName: string): Promise<boolean | ExecException | string> => {
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

describe("exec", () => {
    // Need to figure out the issue with ESM imports omitting the explicit file extension
    it("should successfully execute the script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testFiles/index.js');
        expect(executeFileResult).toBeTruthy();
    }, 10000);

    it("should successfully execute the CJS script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testCJSFiles/index.cjs');
        expect(executeFileResult).toBeTruthy();
    }, 10000);
})