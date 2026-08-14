import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateState } from "./domain.mjs";
import { attributionConfidence, instrumentationMaturity } from "./growth-data.mjs";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");const file=join(root,"data/state.json");const state=JSON.parse(await readFile(file,"utf8"));
if(state.metadata?.schema_version==="3.0.0"){console.log("PHASE3_MIGRATION_NOOP schema=3.0.0");process.exit(0);}
const now=new Date().toISOString();
for(const name of ["provider_syncs","reconciliations","search_observations","geo_observations","instrumentation"])state[name]??=[];
Object.assign(state.metadata,{schema_version:"3.0.0",phase:3,growth_data_spine:"official_read_only_providers",growth_cycle_version:"v2",data_through:{app_store:null,app_store_reviews:null,search_console:null,manual_app_store:"2026-08-12"}});
for(const metric of state.metrics)metric.verification_type??="manual_verified";
for(const item of state.attributions)item.confidence_class=attributionConfidence(item);

const configuredProviders=[
  {id:"app_store_connect_api",name:"App Store Connect Analytics",type:"acquisition_commerce",mode:"official_read_only_api",status:"blocked",app_ids:["style-atlas"],last_sync:null,last_successful_import:null,data_through:null,freshness:"blocked",data_available:[],authentication_required:true,authentication_status:"not_configured",required_configuration:["ASC_ISSUER_ID","ASC_KEY_ID","ASC_PRIVATE_KEY_PATH"],secrets_stored:false,error:"BLOCKED — AUTH REQUIRED",sla:{expected_latency_hours:48,stale_after_hours:96}},
  {id:"app_store_reviews_api",name:"App Store Customer Reviews",type:"customer_feedback",mode:"official_read_only_api",status:"blocked",app_ids:["style-atlas"],last_sync:null,last_successful_import:null,data_through:null,freshness:"blocked",data_available:[],authentication_required:true,authentication_status:"not_configured",required_configuration:["ASC_ISSUER_ID","ASC_KEY_ID","ASC_PRIVATE_KEY_PATH"],secrets_stored:false,error:"BLOCKED — AUTH REQUIRED",sla:{expected_latency_hours:24,stale_after_hours:72}},
  {id:"google_search_console_api",name:"Google Search Console",type:"search",mode:"official_read_only_api",status:"blocked",app_ids:["style-atlas"],last_sync:null,last_successful_import:null,data_through:null,freshness:"blocked",data_available:[],authentication_required:true,authentication_status:"not_configured",required_configuration:["GOOGLE_APPLICATION_CREDENTIALS or GSC_ACCESS_TOKEN","GSC_SITE_URL"],secrets_stored:false,error:"BLOCKED — AUTH REQUIRED",sla:{expected_latency_hours:48,stale_after_hours:96}},
];
state.providers=state.providers.filter((item)=>item.id!=="search_console");for(const next of configuredProviders){const index=state.providers.findIndex((item)=>item.id===next.id);if(index<0)state.providers.push(next);else state.providers[index]={...state.providers[index],...next};}

const jobMap=new Map(state.jobs.map((job)=>[job.id,job]));
const phase3Jobs=[
  ["job-import-acquisition","import_app_store_analytics","app_store_connect_api"],
  ["job-feedback-refresh","refresh_app_store_reviews","app_store_reviews_api"],
  ["job-search-console","import_search_console","google_search_console_api"],
];
for(const [id,type,provider] of phase3Jobs){const previous=jobMap.get(id);jobMap.set(id,{id,type,provider,app_id:"style-atlas",schedule:"every:1d",last_run:previous?.last_run??null,next_run:now,status:"scheduled",duration:null,result:null,error:null,retry_count:previous?.retry_count??0});}state.jobs=[...jobMap.values()];

state.geo_observations=[
  {id:"geo-style-atlas-technical-p0",app_id:"style-atlas",page:"https://style-atlas.wonderelian.com/",dimension:"technical_readiness",status:"verified",verification_type:"manual_verified",observed_at:"2026-08-14T09:38:00.000Z",evidence:"lang, canonical, metadata, social cards, SoftwareApplication JSON-LD, robots and sitemap returned live HTTP 200.",ai_citation_status:"unknown"},
  {id:"geo-guide-hierarchy",app_id:"style-atlas",page:"https://style-atlas.wonderelian.com/guides/visual-hierarchy-checklist/",dimension:"useful_citable_content",status:"verified",verification_type:"manual_verified",observed_at:"2026-08-14T09:38:00.000Z",evidence:"Public English guide with original visual example and attributable App Store CTA.",search_performance_status:"unavailable",ai_citation_status:"unknown"},
  {id:"geo-compare-nouveau-deco",app_id:"style-atlas",page:"https://style-atlas.wonderelian.com/compare/art-nouveau-vs-art-deco/",dimension:"useful_citable_content",status:"verified",verification_type:"manual_verified",observed_at:"2026-08-14T09:38:00.000Z",evidence:"Public English comparison with original visual example and attributable App Store CTA.",search_performance_status:"unavailable",ai_citation_status:"unknown"},
];
state.instrumentation=state.apps.map((app)=>({id:`instrumentation-${app.id}`,app_id:app.id,level:instrumentationMaturity(state,app.id),updated_at:now,source:"calculated_from_verified_coverage"}));
state.audit.unshift({id:crypto.randomUUID(),at:now,actor:"AI COO OS",app_id:"style-atlas",source:"phase_3_migration",action:"initialize_growth_data_spine",input:{external_writes:false},result:{schema_version:"3.0.0",providers:configuredProviders.map((item)=>item.id),credential_material_stored:false},status:"success",error:null});
state.metadata.last_updated=now;validateState(state);await writeFile(file,`${JSON.stringify(state,null,2)}\n`);
console.log(`PHASE3_MIGRATION_OK providers=${state.providers.length} jobs=${state.jobs.length} instrumentation=${state.instrumentation.length}`);
