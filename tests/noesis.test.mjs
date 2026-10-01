import test from "node:test";
import assert from "node:assert/strict";
import {noesisHero} from "../public/noesis.js";

const sites=[{id:"yixiu",name:"Yixiu",name_zh:"一休冥想"}];
const current={date:"2026-09-30",period_start:"2026-08-15",website_totals:{active_users:946,page_views:3501,sessions:1718,cta_clicks:792},websites:[{website_id:"yixiu",metrics:{active_users:526,page_views:1199,sessions:775,cta_clicks:null}}]};
const snapshot={period_start:"2026-09-01",period_end:"2026-09-30",timezone:"UTC",totals:{app_units:72,in_app_purchase_units:2,sales_amount:1.77,sales_currency:"USD"},apps:[{app_id:"wendao",name:"Wendao AI: Daodejing",app_units:32}]};
test("Noesis keeps independent website and App periods with verified totals",()=>{
  const html=noesisHero({current,snapshot,sites,scope:"portfolio",locale:"zh",mode:"cumulative"});
  assert.match(html,/946/);assert.match(html,/3,501/);assert.match(html,/2026-08-15 → 2026-09-30/);assert.match(html,/2026-09-01 → 2026-09-30/);
  assert.match(html,/>72</);assert.match(html,/>1.77</);assert.match(html,/可归因试用开始<\/span><strong>—/);assert.doesNotMatch(html,/实时在线|Live now/);
});
test("site filter changes only web data and missing observations stay unknown",()=>{
  const html=noesisHero({current,snapshot,sites,scope:"yixiu",locale:"en",mode:"daily"});
  assert.match(html,/>526</);assert.doesNotMatch(html,/>946</);assert.match(html,/<dd>—<\/dd>/);assert.match(html,/>72</);
  assert.match(html,/data-orbit-site="yixiu" aria-pressed="true"/);
});
test("Noesis empty snapshots and labels are safe",()=>{
  const html=noesisHero({sites:[{id:'a"',name:"<script>"}],scope:"portfolio",locale:"en",mode:"cumulative"});
  assert.match(html,/No verified sales snapshot/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|NaN|undefined/);
});
