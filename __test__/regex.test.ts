import {
  getRequirements,
  getImports,
  getVariableNames,
  findVariableReferences,
} from "../src/lib";

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
    expect(requirements).toEqual(["express=require('express')", `axios=require("axios")`]);
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
    expect(requirements).toEqual(["express=require('express')", `axios=require("axios")`]);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames).toEqual(["express", "axios"]);
  });

  it("should find the unique variable names of multiple CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = `
    const myApp = require('express');
    const http = require("axios");
    `;
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements).toEqual(["myApp=require('express')", `http=require("axios")`]);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames).toEqual(["myApp", "http"]);
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
    expect(requirements).toEqual([
      "myApp=require('express')",
      `sameLine=require("sameLine")`,
      `http=require("axios")`,
      `me=require("saysomething")`,
      `somePkg=require('apackage')`
    ]);

    const variableNames: string[] = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames).toEqual(["myApp", "sameLine", "http", "me", "somePkg"]);
  });

  it("should find matches for the modules using esm imports", () => {
    const importArr = ["node:fs", "express", "dotenv"];
    const depString = `
    import fs from "node:fs";
    import express from 'express';
    `;
    const imports: string[] = getImports(importArr, depString.replace(/\s/g, ""));
    expect(imports.length).toBeGreaterThan(0);
    expect(imports).toEqual([`fsfrom"node:fs"`, `expressfrom'express'`]);
  });

  it("should find matches and variable names for the modules using esm imports", () => {
    const importArr = ["node:fs", "express", "dotenv"];
    const depString = `
    import fs from "node:fs";
    import express from 'express';
    `;
    const imports: string[] = getImports(importArr, depString.replace(/\s/g, ""));
    expect(imports.length).toBeGreaterThan(0);
    expect(imports).toEqual([`fsfrom"node:fs"`, `expressfrom'express'`]);

    const variableNames: string[] = getVariableNames(imports, importArr, true);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames).toEqual(["fs", "express"]);
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
    expect(variableNames).toEqual(["remove", "myApp", "sameLine", "http", "me", "somePkg"]);

    const modules = noWhiteSpace.match(/(import|const|let|var)\s*({[\s\S]*?}|[^\s=]+)\s*=\s*require\s*\(\s*['"](.+?)['"]\s*\)|import\s*(.+?)\s*from\s*['"](.+?)['"]/gm);
    expect(modules).not.toBeNull();
    expect(modules).not.toBeUndefined();
    let myString = noWhiteSpace;
    if (modules) {
      for (let i = 0; i < modules.length; i++) {
          myString = myString.replace(modules[i], "");
      }
    }

    const unusedReferences: string[] = [];
    for (let i = 0; i < variableNames.length; i++) {
      const variableName = variableNames[i];
      findVariableReferences(variableName, myString, unusedReferences);
      depString = depString.replace(new RegExp(String.raw`(?<=const|let|var)[\/\s\/]*${variableName}[\/\s\/]*=[/\s/]*require\(["'][A-Za-z0-9\-]*["']\)[\/\s\/\;]*`, "gm"), "");
    }

    expect(unusedReferences.length).toBe(3);
    expect(depString.includes(`const remove = require("new-dep")`)).toBeFalsy();
    expect(depString.includes(`var sameLine = require("sameLine")`)).toBeFalsy();
    expect(depString.includes(`var somePkg = require('apackage')`)).toBeFalsy();
  });
});
