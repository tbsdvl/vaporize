import { DepRegex } from "../src/util";

describe("regex", () => {
  it("should find the require statement of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    let depString = "const express = require('express');";
    depString = depString.replace(/\s/g, "");
    const requirements: string[] = [];
    for (const dependency of depArr) {
        const cJSRegExp: RegExp = new RegExp(DepRegex.commonJS(dependency), "gm");
        const matches: string[] = cJSRegExp.exec(depString);
        if (matches?.length === 1) {
            requirements.push(matches[0]);
        }
    }

    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");
  });

  it("should find multiple require statements of the CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    let depString = `
    const express = require('express');
    const axios = require("axios");
    `;
    depString = depString.replace(/\s/g, "");
    const requirements: string[] = [];
    for (const dependency of depArr) {
        const cJSRegExp: RegExp = new RegExp(DepRegex.commonJS(dependency), "gm");
        const matches: string[] = cJSRegExp.exec(depString);
        if (matches?.length === 1) {
            requirements.push(matches[0]);
        }
    }

    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");
    expect(requirements[1]).toBe(`constaxios=require("axios")`);
  });

  it("should find the variable name of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    let depString = "const express = require('express');";
    depString = depString.replace(/\s/g, "");
    const requirements: string[] = [];
    for (const dependency of depArr) {
        const cJSRegExp: RegExp = new RegExp(DepRegex.commonJS(dependency), "gm");
        const matches: string[] = cJSRegExp.exec(depString);
        if (matches?.length === 1) {
            requirements.push(matches[0]);
        }
    }

    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");

    for (let i = 0; i < requirements.length; i++) {
        let requirement = requirements[i];
        if (requirement.includes("const")) {
            requirement = requirement.replace("const", "");
        }

        requirement = requirement.replace(new RegExp(String.raw`=require\(["']${depArr[i]}["']\)`, "gm"), "");
        requirements[i] = requirement;
    }

    expect(requirements.length).toBe(1);
    expect(requirements[0]).toBe("express");
  });

  it("should find the variable names of multiple CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    let depString = `
    const express = require('express');
    const axios = require("axios");
    `;
    depString = depString.replace(/\s/g, "");
    const requirements: string[] = [];
    for (const dependency of depArr) {
        const cJSRegExp: RegExp = new RegExp(DepRegex.commonJS(dependency), "gm");
        const matches: string[] = cJSRegExp.exec(depString);
        if (matches?.length === 1) {
            requirements.push(matches[0]);
        }
    }

    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");
    expect(requirements[1]).toBe(`constaxios=require("axios")`);

    for (let i = 0; i < requirements.length; i++) {
        let requirement = requirements[i];
        if (requirement.includes("const")) {
            requirement = requirement.replace("const", "");
        }

        requirement = requirement.replace(new RegExp(String.raw`=require\(["']${depArr[i]}["']\)`, "gm"), "");
        requirements[i] = requirement;
    }

    expect(requirements.length).toBeGreaterThan(1);
    expect(requirements[0]).toBe("express");
    expect(requirements[1]).toBe("axios");
  });

  it("should find the unique variable names of multiple CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    let depString = `
    const myApp = require('express');
    const http = require("axios");
    `;
    depString = depString.replace(/\s/g, "");
    const requirements: string[] = [];
    for (const dependency of depArr) {
        const cJSRegExp: RegExp = new RegExp(DepRegex.commonJS(dependency), "gm");
        const matches: string[] = cJSRegExp.exec(depString);
        if (matches?.length === 1) {
            requirements.push(matches[0]);
        }
    }

    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constmyApp=require('express')");
    expect(requirements[1]).toBe(`consthttp=require("axios")`);

    for (let i = 0; i < requirements.length; i++) {
        let requirement = requirements[i];
        if (requirement.includes("const")) {
            requirement = requirement.replace("const", "");
        }

        requirement = requirement.replace(new RegExp(String.raw`=require\(["']${depArr[i]}["']\)`, "gm"), "");
        requirements[i] = requirement;
    }

    expect(requirements.length).toBeGreaterThan(1);
    expect(requirements[0]).toBe("myApp");
    expect(requirements[1]).toBe("http");
  });
});
