import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { validateState } from "./domain.mjs";

export class JsonStore {
  #queue = Promise.resolve();
  constructor(file) { this.file = file; }

  async read() {
    return validateState(JSON.parse(await readFile(this.file, "utf8")));
  }

  async mutate(mutator) {
    const run = async () => {
      const state = await this.read();
      const result = await mutator(state);
      state.metadata.last_updated = new Date().toISOString();
      validateState(state);
      const temp = join(dirname(this.file), `.state-${crypto.randomUUID()}.tmp`);
      await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
      await rename(temp, this.file);
      return result;
    };
    this.#queue = this.#queue.then(run, run);
    return this.#queue;
  }
}
