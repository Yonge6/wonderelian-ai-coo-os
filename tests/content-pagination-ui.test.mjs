import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("content search paginates verified matches and keeps SEO reference collapsed", async () => {
  const script=await readFile(new URL("../public/app.js",import.meta.url),"utf8");
  assert.match(script,/filterPublications\(state\.content,contentFilters\)/);
  assert.match(script,/paginateContent\(filtered,"attribution"\)/);
  assert.match(script,/data-content-filters/);
  assert.match(script,/name="from"/);
  assert.match(script,/name="to"/);
  assert.match(script,/data-content-page=/);
  assert.match(script,/<details class="archive-panel" data-content-section="geo">/);
  assert.ok(script.indexOf('data-content-section="attribution"')<script.indexOf('data-content-section="geo"'));
  assert.match(script,/contentPages\.attribution=1/);
  assert.doesNotMatch(script,/item\.first_time_downloads\s*\?\?\s*0/);
});
