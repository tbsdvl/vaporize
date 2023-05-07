import { 
    commonJS, 
    esm,
    getRequirements,
    getImports,
    getCJSVariableNames,
    getESMVariableNames
} from "./syntax-regex/index.ts";
import { getFileExtension } from "./extension/index.ts";

export {
    commonJS,
    esm,
    getRequirements,
    getImports,
    getCJSVariableNames,
    getESMVariableNames,
    getFileExtension,
}