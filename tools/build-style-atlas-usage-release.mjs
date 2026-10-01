import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { assertPublicDataSafe, sanitizePublicData } from '../src/public-sanitize.mjs';
const output = resolve('build/style-atlas-usage-20261001');
const source = JSON.parse(await readFile('data/state.json','utf8'));
const project = source.product_analytics.projects.find(p=>p.id==='style-atlas');
const baseline = {};
const hash = data => createHash('sha256').update(data).digest('hex');
async function live(file) {
  const response = await fetch(`https://ops.wonderelian.com/${file}`);
  if (!response.ok) throw new Error(`Live read failed: ${file}`);
  const text = await response.text(); baseline[file] = hash(text); return text;
}
const state = JSON.parse(await live('data/state.json'));
const otherProjects = JSON.stringify(state.product_analytics.projects.filter(p=>p.id!=='style-atlas'));
state.product_analytics.projects = state.product_analytics.projects.map(p=>p.id==='style-atlas'?project:p);
state.product_analytics.generated_at = source.product_analytics.generated_at;
state.metadata.last_updated = source.metadata.last_updated;
const audit = source.audit.find(a=>a.action==='sync_style_atlas_usage');
if (!state.audit.some(a=>a.id===audit.id)) state.audit.unshift(audit);
if (JSON.stringify(state.product_analytics.projects.filter(p=>p.id!=='style-atlas')) !== otherProjects) throw new Error('Unrelated project changed');
const safe = sanitizePublicData(state); assertPublicDataSafe(safe);
const files = {
  'data/state.json': JSON.stringify(safe,null,2)+'\n',
  'index.html': (await live('index.html')).replace(/app\.js\?v=[^"']+/, 'app.js?v=20261001-atlas-usage'),
  'app.js': (await live('app.js')).replace(/product-usage\.js\?v=[^"']+/, 'product-usage.js?v=20261001-atlas-usage'),
  'product-usage.js': await readFile('public/product-usage.js','utf8'),
};
await live('product-usage.js');
await mkdir(output,{recursive:true});
for (const [file,data] of Object.entries(files)) {await mkdir(dirname(resolve(output,file)),{recursive:true});await writeFile(resolve(output,file),data);}
await writeFile(resolve(output,'SHA256SUMS'),Object.entries(files).map(([file,data])=>`${hash(data)}  ${file}`).join('\n')+'\n');
await writeFile(resolve(output,'BASELINE'),Object.entries(baseline).map(([file,sha])=>`${sha}  ${file}`).join('\n')+'\n');
console.log(`ATLAS_OPS_STAGE_READY files=${Object.keys(files).length} h5=${project.h5.status} ios=${project.ios.status}`);
