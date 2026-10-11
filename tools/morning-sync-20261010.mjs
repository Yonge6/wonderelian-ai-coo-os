import {execFileSync} from 'node:child_process';
import {readFile,readdir,stat} from 'node:fs/promises';
import {Ga4WebsiteProvider} from '../src/providers/ga4-website-provider.mjs';
const get=n=>{try{return execFileSync('launchctl',['getenv',n],{encoding:'utf8'}).trim()}catch{return ''}};
const env={...process.env};
for(const name of ['GOOGLE_APPLICATION_CREDENTIALS','GA4_PROPERTY_ID','ASC_ISSUER_ID','ASC_KEY_ID','ASC_PRIVATE_KEY_PATH','APP_STORE_CONNECT_ISSUER_ID','APP_STORE_CONNECT_KEY_ID','APP_STORE_CONNECT_PRIVATE_KEY_PATH']){const v=get(name);if(v)env[name]=v;}
try{
 if(!env.GOOGLE_APPLICATION_CREDENTIALS||!env.GA4_PROPERTY_ID){
  const candidates=[];
  async function walk(dir){let entries;try{entries=await readdir(dir,{withFileTypes:true})}catch{return}for(const entry of entries){const path=`${dir}/${entry.name}`;if(entry.isDirectory())await walk(path);else if(entry.isFile()&&entry.name.endsWith('.json')){try{const value=JSON.parse(await readFile(path,'utf8'));if(value.type==='service_account'&&value.client_email&&value.private_key)candidates.push(path)}catch{}}}}
  for(const dir of ['/Users/yongyuan/.config/wonderelian','/Users/yongyuan/.config/wonderelian-ai-coo-os'])await walk(dir);
  const state=JSON.parse(await readFile(new URL('../data/state.json',import.meta.url),'utf8'));
  const properties=new Set();
  function scan(value){if(!value||typeof value!=='object')return;if(value.verification_type==='api_verified'){const m=String(value.source_reference??'').match(/^ga4:properties\/(\d+):/);if(m)properties.add(m[1]);}for(const child of Object.values(value))if(child&&typeof child==='object')scan(child);}
  scan(state);
  const mode600=candidates.length===1&&((await stat(candidates[0])).mode&511)===384;
  console.log(JSON.stringify({credential_candidates:candidates.length,property_candidates:properties.size,mode600}));
  if(candidates.length!==1||properties.size!==1||!mode600)throw Object.assign(new Error(),{code:'GA4_RECOVERY_NOT_UNIQUE_OR_UNSAFE'});
  env.GOOGLE_APPLICATION_CREDENTIALS=candidates[0];env.GA4_PROPERTY_ID=[...properties][0];
  const provider=new Ga4WebsiteProvider({config:{credentialsPath:env.GOOGLE_APPLICATION_CREDENTIALS,propertyId:env.GA4_PROPERTY_ID}});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const yesterday=new Date(Date.parse(`${today}T00:00:00Z`)-86400000).toISOString().slice(0,10);
  const probe=await provider.runReport({dimensions:['hostName'],metrics:['sessions'],startDate:yesterday,endDate:yesterday});
  console.log(JSON.stringify({official_probe_verified:true,returned_rows:probe.rows?.length??0}));
  for(const name of ['GOOGLE_APPLICATION_CREDENTIALS','GA4_PROPERTY_ID'])execFileSync('launchctl',['setenv',name,env[name]],{stdio:'ignore'});
 }
 for(const script of ['src/sync-websites.mjs','src/sync-website-analytics.mjs','src/sync-app-store-analytics.mjs']){
  execFileSync(process.execPath,[script],{env,stdio:'inherit'});
 }
}catch(error){console.error(JSON.stringify({status:'blocked',code:error.code??'SYNC_FAILED'}));process.exitCode=1;}
