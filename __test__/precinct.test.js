import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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
    const testFile = await readFile("/../../../../testFiles/index.js");
    expect(precinct(testFile).length).toBeGreaterThan(0);
  }); 
});
