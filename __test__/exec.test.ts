import { executeFilePromise } from "../src/lib";

describe("exec", () => {
    it("should successfully execute the script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testFiles/index.js');
        expect(executeFileResult).toBeTruthy();
    }, 10000);

    it("should successfully execute the CJS script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testCJSFiles/index.cjs');
        expect(executeFileResult).toBeTruthy();
    }, 10000);
})