/**
 * Returns a regex template for commonJS require statement syntax as a raw string.
 * @param {string} dep The name of the dependency.
 * @param {boolean} hasKeyWord A value indicating whether or not the dependency string contains a variable keyword.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string, hasKeyWord: boolean = false): string => {
  return hasKeyWord ? String.raw`(?<=const|let|var)[A-Za-z0-9]*=require\(["']${dep}["']\)` : String.raw`=require\(["']${dep}["']\)`;
};

/**
 * Returns a regex template for ESM imports syntax as a raw string.
 * @param {string} imp The name of the import.
 * @param {boolean} hasImport A value indicating whether or not the import string contains the "import" keyword.
 * @returns the regex for the ESM import.
 */
export const esm = (imp: string, hasImport: boolean = false): string => {
  return hasImport ? String.raw`(?<=import)[A-Za-z0-9]*from["']${imp}["']` : String.raw`from["']${imp}["']`;
};

const variableReference = (variableName: string): string => {
    return String.raw`(?<!"|'|\`)${variableName}(?!"|'|\`)`;
};

const getDependencyMatch = (dependency: string, dependencyString: string): string => {
    const cJSRegExp: RegExp = new RegExp(commonJS(dependency, true), "gm");
    const cJSMatches: RegExpExecArray | null = cJSRegExp.exec(dependencyString);
    return cJSMatches?.length === 1 ? cJSMatches[0] : "";
}

const getImportMatch = (imp: string, dependencyString: string): string => {
    const esmRegExp: RegExp = new RegExp(esm(imp, true), "gm");
    const esmMatches: RegExpExecArray | null = esmRegExp.exec(dependencyString);
    return esmMatches?.length === 1 ? esmMatches[0] : "";
}

export const getRequirements = (dependencies: string[], dependencyString: string): string[] => {
    return dependencies.map((dependency: string) => {
        return getDependencyMatch(dependency, dependencyString);
    }).filter(x => x);
}

export const getImports = (imps: string[], dependencyString: string): string[] => {
    return imps.map((imp: string) => {
        return getImportMatch(imp, dependencyString);
    }).filter(x => x);
}

export const getCJSVariableNames = (requirements: string[], dependencies: string[]): string[] => {
    for (let i = 0; i < requirements.length; i++) {
        requirements[i] = requirements[i].replace(new RegExp(commonJS(dependencies[i]), "gm"), "");
    }

    return requirements;
}

export const getESMVariableNames = (imports: string[], importArr: string[]): string[] => {
    for (let i = 0; i < imports.length; i++) {
        imports[i] = imports[i].replace(new RegExp(esm(importArr[i]), "gm"), "");
    }

    return imports;
}

export const findVariableReferences = (variableName: string, fileString: string, unusedReferences: string[]): void => {
    const matches: RegExpMatchArray[] = Array.from(fileString.matchAll(new RegExp(variableReference(variableName), "gm")));
    if (matches?.length < 2) {
        unusedReferences.push(variableName);
    }
}

/**
 * need to make functions for regular expressions which check for the following syntaxes:
 * commonJS named dependency i.e. const { name1, name2 } = require("some-package")
 * ESM i.e. import module_name from "my-module"
 * Named ESM i.e. import { name1, name2 } from "my-module"
 */