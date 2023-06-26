/**
 * Returns a regex template for commonJS require statement syntax as a raw string.
 * @param {string} dep The name of the dependency.
 * @param {boolean} hasKeyWord A value indicating whether or not the dependency string contains a variable keyword.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string, hasKeyWord: boolean = false): string => {
  return hasKeyWord ? String.raw`(?<=const|let|var)\{*[A-Za-z0-9]*\}*=require\(["'.\/A-Za-z0-9]*${dep}["']\)` : String.raw`=require\(["'.\/A-Za-z0-9]*${dep}["']\)`;
};

/**
 * Returns a regex template for ESM imports syntax as a raw string.
 * @param {string} imp The name of the import.
 * @param {boolean} hasImport A value indicating whether or not the import string contains the "import" keyword.
 * @returns the regex for the ESM import.
 */
export const esm = (imp: string, hasImport: boolean = false): string => {
  return hasImport ? String.raw`(?<=import)\{*[A-Za-z0-9]*\}*from["']${imp}["']` : String.raw`from["']${imp}["']`;
};

const getDependencyMatch = (dependency: string, dependencyString: string, isModuleType: boolean = false): string => {
    dependency = dependency.replace(/\./gm, "\\.");
    dependency = dependency.replace(/\//gm, "\\/");
    const depRegExp: RegExp = new RegExp(isModuleType ? esm(dependency, true) : commonJS(dependency, true), "gm");
    return dependencyString.match(depRegExp)?.[0] || "";
}

export const getRequirements = (dependencies: string[], dependencyString: string): string[] => {
    return dependencies.map((dependency: string) => { 
        const match = getDependencyMatch(dependency, dependencyString);
        if (match) {
            dependencyString = dependencyString.replace(new RegExp(String.raw`["']${dependency}["']`), "");
            return match;
        }
    }).filter(x => x);
}

export const getImports = (imps: string[], dependencyString: string): string[] => {
    return imps.map((imp: string) => getDependencyMatch(imp, dependencyString, true)).filter(x => x);
}

export const getVariableNames = (requirements: string[], dependencies: string[], isModuleType: boolean = false): string[] => {
    const variableNames: string[] = [];
    for (let i = 0; i < requirements.length; i++) {
        let variableName = requirements[i].replace(new RegExp(isModuleType ? esm(dependencies[i]) : commonJS(dependencies[i]), "gm"), "");
        if (variableName.includes("{")) {
            variableName = variableName.replace("{", "");
        }
        if (variableName.includes("}")) {
            variableName = variableName.replace("}", "");
        }
        variableNames.push(variableName);
    }

    return variableNames;
}

export const findVariableReferences = (variableName: string, fileString: string, unusedReferences: string[]): void => {
    if (fileString.match(new RegExp(String.raw`(?<!"|'|\`|\/|\.)${variableName}(?!"|'|\`|\/)`, "gm"))?.length < 2) {
        unusedReferences.push(variableName);
    }
}

/**
 * need to make functions for regular expressions which check for the following syntaxes:
 * commonJS named dependency i.e. const { name1, name2 } = require("some-package")
 * ESM i.e. import module_name from "my-module"
 * Named ESM i.e. import { name1, name2 } from "my-module"
 */