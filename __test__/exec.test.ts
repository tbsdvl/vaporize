import { compileTypeScriptPromise, executeFilePromise } from "../src/lib";
import { randomUUID } from "node:crypto";

describe("exec", () => {
    it("should successfully execute the script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testFiles/index.js');
        expect(executeFileResult).toBeTruthy();
    }, 10000);

    it("should successfully execute the CJS script in a JavaScript file", async () => {
        const executeFileResult = await executeFilePromise('./__test__/testCJSFiles/index.cjs');
        expect(executeFileResult).toBeTruthy();
    }, 10000);

    it("should successfully compile a TypeScript file to a JavaScript file", async () => {
        const compileFileResult = await compileTypeScriptPromise("./__test__/testESMFiles/index.ts", `./__test__/testESM/${randomUUID()}/`);
        expect(compileFileResult).toBeTruthy();
    }, 30000);
})