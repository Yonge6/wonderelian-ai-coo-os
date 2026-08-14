import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeFeedback, generateBrief, validateState } from "./domain.mjs";
import { calculateDataHealth } from "./metrics.mjs";
import { assertPublicDataSafe, sanitizePublicData } from "./public-sanitize.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "public/data");
const state = validateState(JSON.parse(await readFile(join(root, "data/state.json"), "utf8")));
const publicState = sanitizePublicData(state);
const publicBrief = sanitizePublicData(generateBrief(publicState));
const publicHealth = sanitizePublicData(calculateDataHealth(publicState));
assertPublicDataSafe(publicState);
assertPublicDataSafe(publicBrief);
assertPublicDataSafe(publicHealth);
await mkdir(output, { recursive:true });
await Promise.all([
  writeFile(join(output, "state.json"), `${JSON.stringify(publicState, null, 2)}\n`),
  writeFile(join(output, "brief.json"), `${JSON.stringify(publicBrief, null, 2)}\n`),
  writeFile(join(output, "data-health.json"), `${JSON.stringify(publicHealth, null, 2)}\n`),
  writeFile(join(output, "feedback-analysis.json"), `${JSON.stringify(analyzeFeedback(publicState.feedback), null, 2)}\n`),
]);
console.log(`STATIC_BUILD_OK apps=${publicState.apps.length} content=${publicState.content.length}`);
