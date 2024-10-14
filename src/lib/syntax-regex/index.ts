/**
 * Returns a regex template for the required commonJS module syntax as a raw string.
 * @param {string} moduleName The module name.
 * @param {boolean} hasKeyWord A value indicating whether or not the dependency string contains a variable keyword.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (moduleName: string, hasKeyWord: boolean = false): string => {
  return hasKeyWord ? String.raw`(?<=const|let|var)\{*[A-Za-z0-9,]*\}*=require\(["'.\/A-Za-z0-9]*${moduleName}["']\)` : String.raw`=require\(["'.\/A-Za-z0-9]*${moduleName}["']\)`;
};

/**
 * Returns a regex template for the imported ECMAScript module syntax as a raw string.
 * @param {string} moduleName The module name.
 * @param {boolean} hasImport A value indicating whether or not the import string contains the "import" keyword.
 * @returns the regex for the imported ESM module.
 */
export const esm = (moduleName: string, hasImport: boolean = false): string => {
  return hasImport ? String.raw`(?<=import)\{*[A-Za-z0-9,]*\}*from["']${moduleName}["']` : String.raw`from["']${moduleName}["']`;
};

/**
 * Gets a matching module.
 * @param moduleName The name of the module.
 * @param dependencyString The stringified code for importing a dependency.
 * @param isEsm A value indicating whether or not the file uses ESM syntax.
 * @returns The matching module.
 */
const getMatchingModule = (moduleName: string, dependencyString: string, isEsm: boolean = false): string => {
    moduleName = moduleName.replace(/\./gm, "\\.");
    moduleName = moduleName.replace(/\//gm, "\\/");
    const depRegExp: RegExp = new RegExp(isEsm ? esm(moduleName, true) : commonJS(moduleName, true), "gm");
    return dependencyString.match(depRegExp)?.[0] || "";
}

/**
 * Gets the list of modules from a file's dependencies.
 * @param moduleNames The list of module names.
 * @param dependencyString The stringified code for importing the dependencies.
 * @returns The list of a file's modules.
 */
export const getModules = (moduleNames: string[], dependencyString: string, isEsm: boolean = false): string[] => {
    return moduleNames.map((imp: string) => {
        const match = getMatchingModule(imp, dependencyString, isEsm);
        if (match) {
            dependencyString = dependencyString.replace(new RegExp(String.raw`["']${imp}["']`), "");
            return match;
        }
    }).filter(x => x);
}

/**
 * Gets the list of the variable names used to store modules.
 * @param requirements The list of a file's requirements.
 * @param modules The list of modules.
 * @param isEsm A value indicating whether or not the file uses ESM syntax.
 * @returns The list of module variable names.
 */
export const getVariableNames = (requirements: string[], modules: string[], isEsm: boolean = false): string[] => {
    const variableNames: string[] = [];
    for (let i = 0; i < requirements.length; i++) {
        let variableName = requirements[i].replace(new RegExp(isEsm ? esm(modules[i]) : commonJS(modules[i]), "gm"), "");
        if (variableName.includes("{")) {
            variableName = variableName.replace("{", "");
        }
        if (variableName.includes("}")) {
            variableName = variableName.replace("}", "");
        }
        let namedImports: Array<string>;
        if (variableName.includes(",")) {
            namedImports = variableName.split(",");
        }
        if (namedImports?.length) {
            variableNames.push(...namedImports);
        } else {
            variableNames.push(variableName);
        }
    }

    return variableNames;
}

/**
 * Finds matching variable references within a file.
 * @param variableName The name of the variable.
 * @param fileString The stringified file code.
 * @param unusedReferences The list of unused references.
 */
export const findVariableReferences = (variableName: string, fileString: string, unusedReferences: string[]): void => {
    if (!fileString.match(new RegExp(String.raw`(?<!"|'|\`|\/|\.)\b${variableName}\b(?!"|'|\`|\/)`, "gm"))?.length) {
        unusedReferences.push(variableName);
    }
}