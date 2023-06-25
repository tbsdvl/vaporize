import { vaporize } from "../src/lib";
import { pathToFileURL, fileURLToPath } from "node:url";

describe('vaporize', () => {
    it('should successfully identify a file\'s extension as a JavaScript file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testFiles/index.js")))).resolves.not.toThrow();
    });

    it('should throw after checking a file\'s extension as an HTML file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testFiles/test.html")))).rejects.toThrow(Error);
    });

    it('should sanitize the code in an ESM JavaScript file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testFiles/index.js")))).resolves.not.toThrow();
    });

    it('should sanitize the code in a CommonJS JavaScript file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testCJSFiles/index.cjs")))).resolves.not.toThrow();
    });
});