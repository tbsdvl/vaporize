import fs from "fs";
import precinct from "precinct";

const readFile = async (fileName) => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

describe("precinct", () => {
  it("should successfully retrieve the list of dependencies for a file", async () => {
    const testFile = await readFile(new URL('testFiles/index.js', import.meta.url));
    expect(precinct(testFile.toString()).length).toBeGreaterThan(0);
  });

  // it("should successfully retrieve the list of dependencies for a file and find the variable name for the CommonJS dependency", async () => {
  //   const testFile = await readFile(new URL('testFiles/index.js', import.meta.url));
  //   expect(precinct(testFile.toString()).length).toBeGreaterThan(0);
  // });
});
