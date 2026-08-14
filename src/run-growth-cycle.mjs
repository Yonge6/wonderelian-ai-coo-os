import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";
import { runGrowthDataCycle } from "./growth-cycle.mjs";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");const store=new JsonStore(join(root,"data/state.json"));
const result=await store.mutate((state)=>runGrowthDataCycle(state));
console.log(`GROWTH_CYCLE_${result.cycle.status.toUpperCase()} providers=${result.syncs.map((row)=>`${row.provider}:${row.status}`).join(",")} reconciliations=${result.reconciliation.received}`);
