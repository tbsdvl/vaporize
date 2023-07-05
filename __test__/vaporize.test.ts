import { vaporize } from "../src/lib";

describe('vaporize', () => {
    it('should not find modules for an HTML file', async () => {
        await expect(vaporize("__test__/testFiles/test.html")).resolves.not.toThrow();
    });

    it('should sanitize the code in an ESM JavaScript file', async () => {
        await expect(vaporize("__test__/testFiles/index.js")).resolves.not.toThrow();
    }, 20000);

    it('should sanitize the code in a CommonJS JavaScript file', async () => {
        await expect(vaporize("__test__/testCJSFiles/index.cjs")).resolves.not.toThrow();
    }, 20000);

    it('should sanitize the code in a CommonJS JavaScript file with a module path', async () => {
        await expect(vaporize("__test__/testCJSFiles/example2.cjs")).resolves.not.toThrow();
    }, 20000);

    it('should sanitize the code in an ESM JavaScript file with a module path', async () => {
        await expect(vaporize("__test__/testFiles/example2.js")).resolves.not.toThrow();
    }, 20000);

    it('should sanitize the code in a TypeScript file', async () => {
        await expect(vaporize("__test__/testESMFiles/index.ts")).resolves.not.toThrow();
    }, 20000);
});