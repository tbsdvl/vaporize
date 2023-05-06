import { commonJS } from "../src/util";

const getRequirements = (dependencies: string[], dependencyString: string): string[] => {
    return dependencies.map((dependency: string) => {
      const cJSRegExp: RegExp = new RegExp(commonJS(dependency, true), "gm");
      const matches: RegExpExecArray | null = cJSRegExp.exec(dependencyString);
      return matches?.length === 1 ? matches[0] : "";
    }).filter(x => x);
}

const getVariableNames = (requirements: string[], dependencies: string[]): string[] => {
    for (let i = 0; i < requirements.length; i++) {
      requirements[i] = requirements[i].replace(new RegExp(commonJS(dependencies[i]), "gm"), ""); // need to replace based on dep's resolving alg
    }

    return requirements;
}

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

  });
});
