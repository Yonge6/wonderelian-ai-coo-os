import { readFile } from "node:fs/promises";

export class LocalOpsProvider {
  id = "local_ops_log";
  constructor(logFile) { this.logFile = logFile; }
  async health() {
    try { await readFile(this.logFile, "utf8"); return { status: "available" }; }
    catch (error) { return { status: "unavailable", error: error.message }; }
  }
}
