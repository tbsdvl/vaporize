import { compileToJavaScriptPromise } from "./exec/index.js";
import { readFile } from "./file/index.js";
import { getFileExtension } from "./extension/index.js";
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
    compileToJavaScriptPromise,
    readFile,
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    getFileExtension,
    findVariableReferences,
    vaporize,
}