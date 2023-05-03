describe("regex", () => {
  it("should find the variable name of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    let depString = "const express = require('express');";
    depString = depString.replace(/\s/g, "");
    const variableArray = [];
    for (const dependency of depArr) {
        const cJSRegExp = new RegExp(String.raw`const[A-Za-z0-9]*=require\(["']${dependency}["']\)`, "gm");
        const matches = cJSRegExp.exec(depString);
        if (matches && matches.length === 1) {
            variableArray.push(matches[0]);
        }
    }

    expect(variableArray.length).toBeGreaterThan(0);
    expect(variableArray[0]).toBe("constexpress=require('express')");
  });
});
