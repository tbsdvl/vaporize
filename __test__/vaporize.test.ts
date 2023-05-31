import { vaporize } from "../src/vaporize";

describe('vaporize', () => {

    it('should successfully identify a file\'s extension as a JavaScript file', async () => {
        await expect(vaporize("../../__test__/testFiles/index.js")).resolves.not.toThrow();
    });

    it('should throw after checking a file\'s extension as an HTML file', async () => {
        await expect(vaporize("../../__test__/testFiles/test.html")).rejects.toThrow(Error);
    });

    it('should identify the list of unused dependencies in a JavaScript file', async () => {
        await expect(vaporize("../../__test__/testFiles/index.js")).resolves.toEqual('import example from "./example.js";\r\nexport default example;');
    });
});