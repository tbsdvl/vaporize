import { executeFilePromise } from "./exec/index.js";
import { readFile } from "./file/index.js";
import { getFileExtension } from "./extension/index.js";
import moduleType from "./pkg/index.js";
import {
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    findVariableReferences
} from "./syntax-regex/index.js";
import { vaporize } from "../vaporize/index.js";

export {
    executeFilePromise,
    readFile,
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    getFileExtension,
    moduleType,
    findVariableReferences,
    vaporize,
}