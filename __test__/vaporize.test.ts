import { getFileString } from "../src/vaporize";

describe('vaporize', () => {

    it('should successfully retrieve the contents of a JavaScript file as a string', async () => {
        const fileString = await getFileString("../../__test__/testFiles/index.js"); 
        expect(fileString).toBeTruthy();
        console.log(fileString);
    });
});