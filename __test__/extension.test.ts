import { getFileExtension } from "../src/util";

describe("extension", () => {
    it("should get the extension from the file name", () => {
        expect(getFileExtension("index.html")).toBe(".html");
    });
});