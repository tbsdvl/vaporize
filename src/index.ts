import { vaporize } from "./lib/index.js";
import { pathToFileURL, fileURLToPath } from "node:url";

const run = async () => {
    try {
        await vaporize(fileURLToPath(pathToFileURL(process.argv[2])));
    } catch (e) {
        process.exit(1);
    }
}

run();