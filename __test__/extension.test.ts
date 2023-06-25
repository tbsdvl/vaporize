import { getFileExtension } from "../src/lib";

describe("extension", () => {
    it("should get the extension from the file name", () => {
        expect(getFileExtension("index.html")).toBe(".html");
    });
});