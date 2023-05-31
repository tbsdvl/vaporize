import { executeFilePromise } from "./exec/index.ts";
import { readFile } from "./file/index.ts";
import { getFileExtension } from "./extension/index.ts";
import {
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    findVariableReferences
} from "./syntax-regex/index.ts";

export {
    executeFilePromise,
    readFile,
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    getFileExtension,
    findVariableReferences,
}