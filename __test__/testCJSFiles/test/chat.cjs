const { availableParallelism, } = require("os");
console.log("Available parallelism: ", availableParallelism());
const test = "test";
const test2 = "test2";
module.exports = {
    test,
    test2
};