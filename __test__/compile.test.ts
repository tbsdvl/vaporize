import { compileToJavaScriptPromise } from "../src/lib";
import { randomUUID } from "node:crypto";

describe("compile", () => {
    it("should successfully compile a TypeScript file to a JavaScript file", async () => {
        const compileFileResult = await compileToJavaScriptPromise("./__test__/testESMFiles/compile.ts", `./__test__/testESMFiles/${randomUUID()}/`);
        expect(compileFileResult).toBeTruthy();
    }, 30000);
})