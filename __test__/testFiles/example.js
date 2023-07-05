import crypto from "node:crypto";
import jest from "jest";
import fs from "fs";

console.log("here is some code!");
const myFunc = (a, b) => {
    return a + b;
}
console.log(myFunc(1, 2));
console.log(crypto.randomUUID());
console.log(jest.getVersion());
export default "hello world!";