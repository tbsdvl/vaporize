import {
  getRequirements,
  getImports,
  getVariableNames,
  findVariableReferences,
} from "../src/util";

describe("regex", () => {
  it("should find the require statement of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = "const express = require('express');";
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("express=require('express')");
  });

  it("should find multiple require statements of the CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = `
    const express = require('express');
    const axios = require("axios");
    `;
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("express=require('express')");
    expect(requirements[1]).toBe(`axios=require("axios")`);
  });

  it("should find the variable name of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = "const express = require('express');";
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("express=require('express')");

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBe(1);
    expect(variableNames[0]).toBe("express");
  });

  it("should find the variable names of multiple CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = `
    const express = require('express');
    const axios = require("axios");
    `;
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("express=require('express')");
    expect(requirements[1]).toBe(`axios=require("axios")`);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames[0]).toBe("express");
    expect(variableNames[1]).toBe("axios");
  });

  it("should find the unique variable names of multiple CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = `
    const myApp = require('express');
    const http = require("axios");
    `;
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("myApp=require('express')");
    expect(requirements[1]).toBe(`http=require("axios")`);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames[0]).toBe("myApp");
    expect(variableNames[1]).toBe("http");
  });

  it("should find the unique variable names of multiple CommonJS dependencies using different variable keywords in the string", () => {
    const depArr = ["express", "sameLine", "axios", "saysomething", "apackage", "dotenv"];
    const depString = `
    const myApp = require('express'); var sameLine = require("sameLine");
    const http = require("axios");
    let me = require("saysomething")
    var somePkg = require('apackage');
    `;
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("myApp=require('express')");
    expect(requirements[1]).toBe(`sameLine=require("sameLine")`);
    expect(requirements[2]).toBe(`http=require("axios")`);
    expect(requirements[3]).toBe(`me=require("saysomething")`);
    expect(requirements[4]).toBe(`somePkg=require('apackage')`);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames[0]).toBe("myApp");
    expect(variableNames[1]).toBe("sameLine");
    expect(variableNames[2]).toBe("http");
    expect(variableNames[3]).toBe("me");
    expect(variableNames[4]).toBe("somePkg");
  });

  it("should find matches for the modules using esm imports", () => {
    const importArr = ["node:fs", "express", "dotenv"];
    const depString = `
    import fs from "node:fs";
    import express from 'express';
    `;
    const imports: string[] = getImports(importArr, depString.replace(/\s/g, ""));
    expect(imports.length).toBeGreaterThan(0);
    expect(imports[0]).toBe(`fsfrom"node:fs"`);
    expect(imports[1]).toBe(`expressfrom'express'`);
  });

  it("should find matches and variable names for the modules using esm imports", () => {
    const importArr = ["node:fs", "express", "dotenv"];
    const depString = `
    import fs from "node:fs";
    import express from 'express';
    `;
    const imports: string[] = getImports(importArr, depString.replace(/\s/g, ""));
    expect(imports.length).toBeGreaterThan(0);
    expect(imports[0]).toBe(`fsfrom"node:fs"`);
    expect(imports[1]).toBe(`expressfrom'express'`);

    const variableNames: string[] = getVariableNames(imports, importArr, true);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames[0]).toBe("fs");
    expect(variableNames[1]).toBe("express");
  });

  it("should find the references to the unused package", () => {
    const depArr = ["new-dep", "express", "sameLine", "axios", "saysomething", "apackage", "dotenv"];
    let depString = `
    const remove = require("new-dep")
    const myApp = require('express'); var sameLine = require("sameLine");
    const http = require("axios");
    let me = require("saysomething")
    var somePkg = require('apackage')

    myApp.listen();
    http.listen();

    const myString = 'somePkg   is in this string';
    me();
    `;

    const noWhiteSpace = depString.replace(/\s/g, "");
    const requirements: string[] = getRequirements(depArr, noWhiteSpace);
    expect(requirements).toEqual([
      `remove=require("new-dep")`,
      `myApp=require('express')`,
      `sameLine=require("sameLine")`,
      `http=require("axios")`,
      `me=require("saysomething")`,
      `somePkg=require('apackage')`,
    ]);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames[0]).toBe("remove");
    expect(variableNames[1]).toBe("myApp");
    expect(variableNames[2]).toBe("sameLine");
    expect(variableNames[3]).toBe("http");
    expect(variableNames[4]).toBe("me");
    expect(variableNames[5]).toBe("somePkg");

    const unusedReferences: string[] = [];
    for (let i = 0; i < variableNames.length; i++) {
      const variableName = variableNames[i];
      findVariableReferences(variableName, noWhiteSpace, unusedReferences);
      depString = depString.replace(new RegExp(String.raw`(?<=const|let|var)[/\s/]*${variableName}[/\s/]*=[/\s/]*require\(["'][A-Za-z0-9\-]*["']\)[/\s/\;]*`, "gm"), "");
    }

    expect(unusedReferences.length).toBe(3);
    expect(depString.includes(`const remove = require("new-dep")`)).toBeFalsy();
    expect(depString.includes(`var sameLine = require("sameLine")`)).toBeFalsy();
    expect(depString.includes(`var somePkg = require('apackage')`)).toBeFalsy();
  });
});
