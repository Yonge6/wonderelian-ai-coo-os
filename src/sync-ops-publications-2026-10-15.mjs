import { fileURLToPath } from "node:url";
import { JsonStore } from "./store.mjs";

const store = new JsonStore(fileURLToPath(new URL("../data/state.json", import.meta.url)));

const publications = [
  ["yixiu-meditation","20261015_01-noise-miss-you","instagram","image_post","Let the Noise Miss You","https://www.instagram.com/wonderelian/p/Deg9psoAH9g/",null],
  ["yixiu-meditation","20261015_01-noise-miss-you","pinterest","image_pin","Let the Noise Miss You","https://www.pinterest.com/pin/1147643917694263088/","https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=one_minute_reset&utm_content=20261015_01-noise-miss-you"],
  ["yixiu-meditation","20261015_01-noise-miss-you","youtube","community_image_post","Let the Noise Miss You","https://www.youtube.com/post/Ugkxni8C6Oldx5_tyTnQCbBXARJjH0dIxLEt","https://yixiu.wonderelian.com/one-minute-reset/?utm_source=youtube&utm_medium=organic_social&utm_campaign=one_minute_reset&utm_content=20261015_01-noise-miss-you"],
  ["yixiu-meditation","20261015_yixiu_city_blanket","instagram","short_video","The City Finally Pulled Up the Covers","https://www.instagram.com/wonderelian/reel/DegUbg2gJib/",null],
  ["yixiu-meditation","20261015_yixiu_city_blanket","tiktok","short_video","The City Finally Pulled Up the Covers","https://www.tiktok.com/@wonderelian1/video/7696739003676069133",null],
  ["yixiu-meditation","20261015_yixiu_city_blanket","youtube","short_video","The City Finally Pulled Up the Covers","https://youtube.com/shorts/OnxhOVCYKqs",null],
  ["yixiu-meditation","20261015_yixiu_slipper_capybara","instagram","short_video","Clock Out. Deflate. Become Slipper-Sized.","https://www.instagram.com/wonderelian/reel/DegiGiZgHTc/",null],
  ["yixiu-meditation","20261015_yixiu_slipper_capybara","tiktok","short_video","Clock Out. Deflate. Become Slipper-Sized.","https://www.tiktok.com/@wonderelian1/video/7696739939966405902",null],
  ["yixiu-meditation","20261015_yixiu_slipper_capybara","youtube","short_video","Clock Out. Deflate. Become Slipper-Sized.","https://youtube.com/shorts/cOrTr_guT44",null],
  ["yixiu-meditation","20261015_yixiu_todo_wave","instagram","short_video","The To-Do List Can Keep Moving. You Can Pause.","https://www.instagram.com/wonderelian/reel/Degv5IGgBnY/",null],
  ["yixiu-meditation","20261015_yixiu_todo_wave","tiktok","short_video","The To-Do List Can Keep Moving. You Can Pause.","https://www.tiktok.com/@wonderelian1/video/7696740227628453133",null],
  ["yixiu-meditation","20261015_yixiu_todo_wave","youtube","short_video","The To-Do List Can Keep Moving. You Can Pause.","https://youtube.com/shorts/ojhJsBhlnnk",null],
  ["yixiu-meditation","20261015_yixiu_rain_to_dry","pinterest","short_video","Hang the Rain Out to Dry","https://www.pinterest.com/pin/1147643917694271939/","https://yixiu.wonderelian.com/one-minute-reset/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=one_minute_reset&utm_content=20261015_rain_to_dry"],
  ["wendao","20261015_wendao_explanation_baggage","instagram","short_video","Some Misunderstandings Aren't Carry-On","https://www.instagram.com/wonderelian/reel/Deg9kQhAIpb/",null],
  ["wendao","20261015_wendao_explanation_baggage","pinterest","short_video","Some Misunderstandings Aren't Carry-On","https://www.pinterest.com/pin/1147643917694263168/","https://wendao.wonderelian.com/?utm_source=pinterest&utm_medium=organic_social&utm_campaign=everyday_tao&utm_content=20261015_explanation_baggage"],
  ["wendao","20261015_wendao_explanation_baggage","tiktok","short_video","Some Misunderstandings Aren't Carry-On","https://www.tiktok.com/@wonderelian1/video/7696735393839910158",null],
  ["wendao","20261015_wendao_explanation_baggage","youtube","short_video","Some Misunderstandings Aren't Carry-On","https://youtube.com/shorts/3n_hLGvhKAA",null],
].map(([appId,contentId,channelId,type,title,url,landingUrl])=>({
  id:`${appId}-${channelId}-${contentId}`,
  app_id:appId,
  channel_id:channelId,
  type,
  title,
  url,
  publish_url:url,
  landing_url:landingUrl,
}));

await store.mutate((state) => {
  const existing = new Set(state.content.flatMap((item)=>[item.id,item.url,item.publish_url]).filter(Boolean));
  let inserted=0;
  for(const item of publications){
    if(existing.has(item.id)||existing.has(item.url))continue;
    state.content.push({
      ...item,
      status:"published",
      published_at:"2026-10-15",
      impressions:null,
      engagements:null,
      outbound_clicks:null,
      first_time_downloads:null,
      views:null,
      likes:null,
      comments:null,
      shares:null,
      saves:null,
      landing_page_visits:null,
      attributed_conversions:null,
      product_page_views:null,
      measurement_status:"collecting",
      campaign_id:null,
      app_store_campaign_url:null,
    });
    inserted+=1;
  }
  const auditId="audit-ops-publications-20261015";
  state.audit=(state.audit??[]).filter((item)=>item.id!==auditId);
  state.audit.unshift({
    id:auditId,
    at:new Date().toISOString(),
    actor:"AI COO OS",
    app_id:null,
    source:"verified_publication_status_and_durable_ops_logs",
    action:"sync_verified_publication_urls_2026_10_15",
    input:{external_writes:false,operation_date:"2026-10-15"},
    result:{
      status:"success",
      records_inserted:inserted,
      verified_publication_urls:publications.length,
      blocked_or_scheduled_items_excluded:true,
      unknown_metrics_preserved_as_null:true,
    },
    status:"success",
    error:null,
  });
  return {inserted};
});

console.log(`OPS_PUBLICATIONS_20261015_SYNC_OK verified=${publications.length}`);
