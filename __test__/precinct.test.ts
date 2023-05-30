import { readFile } from "../src/util";
import precinct from "precinct";

describe("precinct", () => {
  it("should successfully retrieve the list of dependencies using the CommonJS syntax", async () => {
    const testFile = await readFile(new URL('testFiles/index.js', import.meta.url));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);
  });

  it("should successfully retrieve the list of imports using the ESM syntax", async () => {
    const testFile = await readFile(new URL('testESMFiles/index.ts', import.meta.url));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);

    const testFile2 = await readFile(new URL('testESMFiles/example.ts', import.meta.url));
    expect(precinct(testFile2.toString()).length).toBeGreaterThan(0);
  });
});
