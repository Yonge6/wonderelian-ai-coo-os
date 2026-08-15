import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public dashboard renders operating dates in Beijing time", async () => {
  const [script, html, icons] = await Promise.all([
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/vendor/phosphor/style.css", import.meta.url), "utf8"),
  ]);

  assert.match(script, /operatingTimeZone="Asia\/Shanghai"/);
  assert.match(script, /timeZone:operatingTimeZone/);
  assert.doesNotMatch(script, /toISOString\(\)\.slice\(0,10\)/);
  assert.match(html, /app\.js\?v=20260815-ga4-tags/);
  assert.match(html, /styles\.css\?v=20260815-logo-full/);
  assert.match(script, /const localHosts=new Set\(\["127\.0\.0\.1","localhost"\]\)/);
  assert.match(script, /!localHosts\.has\(location\.hostname\)/);
  assert.match(script, /tagged=websites\.filter/);
  assert.match(script, /\$\{t\("analytics_tag"\)\}: \$\{tagged\}\/\$\{websites\.length\}/);
  assert.ok(html.indexOf('data-view="apps"') < html.indexOf('data-view="websites"'));
  assert.ok(html.indexOf('data-view="websites"') < html.indexOf('data-view="insights"'));
  assert.match(html, /data-view="websites" data-index="3"/);
  assert.match(icons, /\.ph\.ph-globe::before\{content:"\\e288"\}/);
  assert.match(await readFile(new URL("../public/styles.css", import.meta.url), "utf8"), /mix-blend-mode:screen/);
  assert.doesNotMatch(await readFile(new URL("../public/styles.css", import.meta.url), "utf8"), /brand-logo-frame\{[^}]*overflow:hidden/);
});

test("public dashboard ships the custom domain and accessible Image 2 logo", async () => {
  const [index, cname] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/CNAME", import.meta.url), "utf8"),
  ]);
  assert.equal(cname.trim(), "ops.wonderelian.com");
  assert.match(index, /rel="canonical" href="https:\/\/ops\.wonderelian\.com\/"/);
  assert.match(index, /<span class="sr-only">AI COO OS<\/span>/);
  assert.match(index, /assets\/ai-coo-logo-image2-v2\.png/);
  assert.doesNotMatch(index, /WonderElian \/ Operations/);
});
