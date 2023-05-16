import {
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    findVariableReferences
} from "./syntax-regex/index.ts";
import { getFileExtension } from "./extension/index.ts";

export {
    commonJS,
    esm,
    getRequirements,
    getImports,
    getVariableNames,
    getFileExtension,
    findVariableReferences,
}