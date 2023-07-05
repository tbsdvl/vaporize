import { ExecException, execFile } from "node:child_process";

export const compileToJavaScriptPromise = async (tempDir: string): Promise<boolean | ExecException | string> => {
    return new Promise((resolve, reject) => {
        execFile('npx', ["tsc", "--project", tempDir, "--outDir", (tempDir + "dist")], { shell: true },
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