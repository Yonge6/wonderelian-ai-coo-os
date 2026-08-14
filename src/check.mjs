import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JsonStore } from "./store.mjs";
import { generateBrief } from "./domain.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const state = await new JsonStore(join(root, "data/state.json")).read();
const brief = generateBrief(state);
if (brief.recommendations.length > 3) throw new Error("Brief exceeds three recommendations");
console.log(`STATE_OK apps=${state.apps.length} metrics=${state.metrics.length} content=${state.content.length} recommendations=${brief.recommendations.length}`);
