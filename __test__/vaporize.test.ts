import { vaporize } from "../src/vaporize";
import { pathToFileURL, fileURLToPath } from "node:url";

describe('vaporize', () => {

    it('should successfully identify a file\'s extension as a JavaScript file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testFiles/index.js")))).resolves.not.toThrow();
    });

    it('should throw after checking a file\'s extension as an HTML file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testFiles/test.html")))).rejects.toThrow(Error);
    });

    it('should identify the list of unused dependencies in a JavaScript file', async () => {
        await expect(vaporize(fileURLToPath(pathToFileURL("__test__/testFiles/index.js")))).resolves.toEqual('import example from "./example.js";\r\nexport default example;');
    });

    it('should successfully read & test code outside of vaporize source code', async () => {
        // use os to create temp test file
        // name the temp test file
        // use it to write to test file generated in function
        // delete the temp test file.
        await expect(vaporize(fileURLToPath(pathToFileURL("../testRepo/example.js")))).resolves.not.toThrow();
    });
});