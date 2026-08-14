import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { runOperatingCycle } from "./cycle.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const store = new JsonStore(join(root,"data/state.json"));
const result = await store.mutate((state)=>runOperatingCycle(state));
console.log(`COO_CYCLE_OK id=${result.cycle.id} material_changes=${result.cycle.detected.material_changes} execution=${result.cycle.executed.status}`);
