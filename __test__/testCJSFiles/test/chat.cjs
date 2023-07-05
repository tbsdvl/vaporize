const fs = require("fs");
const { availableParallelism, arch, release } = require("os");
console.log("Available parallelism: ", availableParallelism());
const test = "test";
const test2 = "test2";