import { executeFilePromise } from "./exec/index.ts";
import { readFile } from "./file/index.ts";
import { getFileExtension } from "./extension/index.ts";
import moduleType from "./pkg/index.ts";
import {
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    findVariableReferences
} from "./syntax-regex/index.ts";
import { vaporize } from "../vaporize/index.ts";

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