import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public dashboard renders operating dates in Beijing time", async () => {
  const [script, html] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
  ]);

  assert.match(script, /operatingTimeZone="Asia\/Shanghai"/);
  assert.match(script, /timeZone:operatingTimeZone/);
  assert.doesNotMatch(script, /toISOString\(\)\.slice\(0,10\)/);
  assert.match(html, /app\.js\?v=20260815-bjt/);
});
