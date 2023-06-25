import { moduleType } from "../src/lib";

describe("pkg", () => {
    it("should successfully read the package.json file in an npm project", async () => {
        expect(moduleType).toBe("module");
    })
});