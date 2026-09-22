import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("portfolio retains bilingual daily and cumulative controls with explicit UV semantics",async()=>{
  const [html,script]=await Promise.all(["public/index.html","public/app.js"].map(p=>readFile(new URL("../"+p,import.meta.url),"utf8")));
  assert.match(html,/20260923-focused/);
  for(const text of ["累计组合数据","每日组合数据","data-portfolio-mode","data-daily-date","data-trend-scope","data-trend-period=\"weekly\"","data-export=\"websites\""])assert.ok(script.includes(text));
  assert.match(script,/不能用每日 UV 相加/);
  assert.match(script,/UV 为每日用户数相加的人次/);
  assert.match(script,/latest=points\.at\(-1\)/);
  assert.match(script,/through:dailyDate/);
  assert.match(script,/siteRows=new Map/);
});
