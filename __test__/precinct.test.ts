import fs from "fs";
import precinct from "precinct";

const readFile = async (fileName: URL): Promise<Buffer | NodeJS.ErrnoException> => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err: NodeJS.ErrnoException | null, data: Buffer) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

describe("precinct", () => {
  it("should successfully retrieve the list of dependencies using the CommonJS syntax", async () => {
    const testFile = await readFile(new URL('testFiles/index.js', import.meta.url));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);
  });

  it("should successfully retrieve the list of imports using the ESM syntax", async () => {
    const testFile = await readFile(new URL('testESMFiles/index.ts', import.meta.url));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);
  });
});
