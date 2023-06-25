import { vaporize } from "./lib/index.js";
import { pathToFileURL, fileURLToPath } from "node:url";

const run = async () => {
    if (!process.argv[2] || process.argv.length > 3) {
        console.log("Cannot not find path to file.");
        process.exit(0);
    }
    try {
        await vaporize(fileURLToPath(pathToFileURL(process.argv[2])));
    } catch (e) {
        process.exit(1);
    }
}

run();