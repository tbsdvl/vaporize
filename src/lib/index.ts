import { compileToJavaScriptPromise } from "./exec/index.js";
import { readFile } from "./file/index.js";
import { getFileExtension } from "./extension/index.js";
import {
    commonJS,
    esm,
    getModules,
    getVariableNames,
    findVariableReferences
} from "./syntax-regex/index.js";
import { vaporize } from "../vaporize/index.js";

export {
    compileToJavaScriptPromise,
    readFile,
    commonJS,
    esm,
    getModules,
    getVariableNames,
    getFileExtension,
    findVariableReferences,
    vaporize,
}