import { vaporize } from "./lib/index.ts";
import { pathToFileURL, fileURLToPath } from "node:url";

const run = async () => {
    await vaporize(fileURLToPath(pathToFileURL(process.argv[2])));
}

run();