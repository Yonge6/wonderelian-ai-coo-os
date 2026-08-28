import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("content page paginates SEO readiness and attribution independently", async () => {
  const [script, styles] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(script, /contentPages=\{geo:1,attribution:1\}/);
  assert.match(script, /const contentPageSize=6/);
  assert.match(script, /function paginateContent\(items,key\)/);
  assert.match(script, /function contentPagination\(key,label,page\)/);
  assert.match(script, /items:items\.slice\(\(current-1\)\*contentPageSize,current\*contentPageSize\)/);
  assert.match(script, /paginateContent\(geo,"geo"\)/);
  assert.match(script, /paginateContent\(state\.content,"attribution"\)/);
  assert.match(script, /pages\.geo\.items\.map/);
  assert.match(script, /pages\.attribution\.items\.map/);
  assert.match(script, /data-content-page=/);
  assert.match(script, /data-content-section="geo"/);
  assert.match(script, /data-content-section="attribution"/);
  assert.match(script, /button\.dataset\.contentPage/);
  assert.match(script, /if\(view==="content"\)contentPages=\{geo:1,attribution:1\}/);
  assert.ok(script.indexOf('data-content-section="geo"') < script.indexOf('data-content-section="attribution"'));
  assert.doesNotMatch(script, /item\.first_time_downloads\s*\?\?\s*0/);
  assert.match(styles, /\.content-row>div\{min-width:0;flex:1 1 56%\}/);
  assert.match(styles, /\.content-row dd\{overflow-wrap:anywhere\}/);
});
