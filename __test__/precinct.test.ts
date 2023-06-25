import { fileURLToPath, pathToFileURL } from "node:url";
import { readFile } from "../src/lib";
import precinct from "precinct";

describe("precinct", () => {
  it("should successfully retrieve the list of dependencies using the CommonJS syntax", async () => {
    const testFile = await readFile(fileURLToPath(pathToFileURL('__test__/testFiles/index.js')));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);
  });

  it("should successfully retrieve the list of imports using the ESM syntax", async () => {
    const testFile = await readFile(fileURLToPath(pathToFileURL('__test__/testESMFiles/index.ts')));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);

    const testFile2 = await readFile(fileURLToPath(pathToFileURL('__test__/testESMFiles/example.ts')));
    expect(precinct(testFile2.toString()).length).toBeGreaterThan(0);
  });
});
