/**
 * Returns a regex template for commonJS require statement syntax as a raw string.
 * @param {string} dep The name of the dependency.
 * @param {boolean} hasKeyWord A value indicating whether or not the dependency string contains a variable keyword.
 * @returns The regex for the dependency's commonJS require statement.
 */
export const commonJS = (dep: string, hasKeyWord: boolean = false): string => {
  return hasKeyWord ? String.raw`(?<=const|let|var)\{*[A-Za-z0-9,]*\}*=require\(["'.\/A-Za-z0-9]*${dep}["']\)` : String.raw`=require\(["'.\/A-Za-z0-9]*${dep}["']\)`;
};

/**
 * Returns a regex template for ESM imports syntax as a raw string.
 * @param {string} imp The name of the import.
 * @param {boolean} hasImport A value indicating whether or not the import string contains the "import" keyword.
 * @returns the regex for the ESM import.
 */
export const esm = (imp: string, hasImport: boolean = false): string => {
  return hasImport ? String.raw`(?<=import)\{*[A-Za-z0-9,]*\}*from["']${imp}["']` : String.raw`from["']${imp}["']`;
};

/**
 * Gets a matching dependency.
 * @param dependencyName The name of the dependency.
 * @param dependencyString The code for importing a dependency as a string.
 * @param isESM A value indicating whether or not the dependency is an ECMAScript module.
 * @returns
 */
const getMatchingDependency = (dependencyName: string, dependencyString: string, isESM: boolean = false): string => {
    dependencyName = dependencyName.replace(/\./gm, "\\.");
    dependencyName = dependencyName.replace(/\//gm, "\\/");
    const depRegExp: RegExp = new RegExp(isESM ? esm(dependencyName, true) : commonJS(dependencyName, true), "gm");
    return dependencyString.match(depRegExp)?.[0] || "";
}

export const getRequirements = (dependencies: string[], dependencyString: string): string[] => {
    return dependencies.map((dependency: string) => {
        const match = getMatchingDependency(dependency, dependencyString);
        if (match) {
            dependencyString = dependencyString.replace(new RegExp(String.raw`["']${dependency}["']`), "");
            return match;
        }
    }).filter(x => x);
}

export const getImports = (imps: string[], dependencyString: string): string[] => {
    return imps.map((imp: string) => {
        const match = getMatchingDependency(imp, dependencyString, true);
        if (match) {
            dependencyString = dependencyString.replace(new RegExp(String.raw`["']${imp}["']`), "");
            return match;
        }
    }).filter(x => x);
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

export const findVariableReferences = (variableName: string, fileString: string, unusedReferences: string[]): void => {
    if (!fileString.match(new RegExp(String.raw`(?<!"|'|\`|\/|\.)\b${variableName}\b(?!"|'|\`|\/)`, "gm"))?.length) {
        unusedReferences.push(variableName);
    }
}