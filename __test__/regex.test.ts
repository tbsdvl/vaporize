import { DepRegex } from "../src/util";

const getRequirements = (dependencies: string[], dependencyString: string): string[] => {
    return dependencies.map((dependency: string) => {
        const cJSRegExp: RegExp = new RegExp(DepRegex.commonJS(dependency), "gm");
        const matches: string[] = cJSRegExp.exec(dependencyString);
        if (matches?.length === 1) {
            return matches[0];
        }
    }).filter(x => x);
}

const getVariableNames = (requirements: string[], dependencies: string[]): string[] => {
    for (let i = 0; i < requirements.length; i++) {
        let requirement: string = requirements[i];
        if (requirement.includes("const")) { // need checks for each variable keyword
            requirement = requirement.replace("const", "");
        }

        requirement = requirement.replace(new RegExp(String.raw`=require\(["']${dependencies[i]}["']\)`, "gm"), ""); // need to replace based on dep's resolving alg
        requirements[i] = requirement;
    }

    return requirements;
}

describe("regex", () => {
  it("should find the require statement of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = "const express = require('express');";
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");
  });

  it("should find multiple require statements of the CommonJS dependencies in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = `
    const express = require('express');
    const axios = require("axios");
    `;
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");
    expect(requirements[1]).toBe(`constaxios=require("axios")`);
  });

  it("should find the variable name of the CommonJS dependency in the string", () => {
    const depArr = ["express", "axios", "dotenv"];
    const depString = "const express = require('express');";
    const requirements: string[] = getRequirements(depArr, depString.replace(/\s/g, ""));
    expect(requirements.length).toBeGreaterThan(0);
    expect(requirements[0]).toBe("constexpress=require('express')");

    const variableNames = getVariableNames(requirements, depArr);
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
    expect(requirements[0]).toBe("constexpress=require('express')");
    expect(requirements[1]).toBe(`constaxios=require("axios")`);

    const variableNames = getVariableNames(requirements, depArr);
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
    expect(requirements[0]).toBe("constmyApp=require('express')");
    expect(requirements[1]).toBe(`consthttp=require("axios")`);

    const variableNames = getVariableNames(requirements, depArr);
    expect(variableNames.length).toBeGreaterThan(1);
    expect(variableNames[0]).toBe("myApp");
    expect(variableNames[1]).toBe("http");
  });
});
