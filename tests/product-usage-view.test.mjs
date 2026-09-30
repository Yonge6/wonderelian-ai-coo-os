import test from "node:test";
import assert from "node:assert/strict";
import { usageView } from "../public/product-usage.js";
test("verified empty iOS reports show connected, not user activity", () => {
  const snapshot={projects:[{id:"yixiu",name:"Yixiu",name_zh:"一休",status:"partial",ios:{status:"waiting_for_events",verified_at:"2026-09-30T05:30:00Z",source:"Google Analytics 4 Data API",events:[]}}]};
  for(const locale of ["zh","en"]){
    const html=usageView(snapshot,{surface:"ios",locale});
    assert.match(html,locale==="zh"?/Firebase 已关联/:/Firebase is linked/);
    assert.match(html,locale==="zh"?/等待新版事件/:/Waiting for new events/);
    assert.match(html,/<strong>—<\/strong>/);
  }
});
