import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeFeedback, generateBrief, validateState } from "./domain.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public/data");
const state = validateState(JSON.parse(await readFile(join(root, "data/state.json"), "utf8")));
const publicState = JSON.parse(JSON.stringify(state, (key, value) => key === "asset_path" ? undefined : value));
await mkdir(output, { recursive:true });
await Promise.all([
  writeFile(join(output, "state.json"), `${JSON.stringify(publicState, null, 2)}\n`),
  writeFile(join(output, "brief.json"), `${JSON.stringify(generateBrief(publicState), null, 2)}\n`),
  writeFile(join(output, "feedback-analysis.json"), `${JSON.stringify(analyzeFeedback(publicState.feedback), null, 2)}\n`),
]);
console.log(`STATIC_BUILD_OK apps=${publicState.apps.length} content=${publicState.content.length}`);
