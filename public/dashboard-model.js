// Pure presentation helpers. The dashboard only consumes verified snapshots.
export function beijingDay(value = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date(value)).map(x => [x.type,x.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function expectedDataDay(now = new Date()) {
  const today = beijingDay(now);
  const previous = new Date(`${today}T00:00:00Z`);
  previous.setUTCDate(previous.getUTCDate()-1);
  return previous.toISOString().slice(0,10);
}
export function freshness(dataThrough, now = new Date()) {
  if (!dataThrough) return {state:'missing', days:null, expected:expectedDataDay(now)};
  const expected = expectedDataDay(now);
  const days = Math.max(0, Math.round((Date.parse(expected)-Date.parse(String(dataThrough).slice(0,10)))/86400000));
  return {state:days>0?'stale':'fresh',days,expected};
}
export function verifiedPublications(content) {
  return content.filter(x => x.status==='published' && /^https:\/\//.test(x.publish_url??x.url??''))
    .slice().sort((a,b) => String(b.published_at??'').localeCompare(String(a.published_at??'')) || String(b.id).localeCompare(String(a.id)));
}
export function filterPublications(content, filters={}) {
  const query=(filters.query??'').trim().toLocaleLowerCase();
  return verifiedPublications(content).filter(x =>
    (!filters.app || x.app_id===filters.app) && (!filters.channel || x.channel_id===filters.channel) &&
    (!filters.from || String(x.published_at??'').slice(0,10)>=filters.from) &&
    (!filters.to || String(x.published_at??'').slice(0,10)<=filters.to) &&
    (!query || [x.title,x.title_zh,x.campaign_id,x.landing_url,x.publish_url,x.url].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)));
}
export function trafficPoints(summary, metric, {mode='daily',period='daily',scope='portfolio',through=summary.latest_date}={}) {
  const value=row=>scope==='portfolio'?row.website_totals?.[metric]??null:row.websites?.find(x=>x.website_id===scope)?.metrics?.[metric]??null;
  const rows=(mode==='cumulative'?summary.cumulative??[]:summary.days??[]).filter(x=>!through||x.date<=through).slice().sort((a,b)=>a.date.localeCompare(b.date));
  if (mode==='cumulative'||period==='daily') return rows.map(x=>({label:x.date,value:value(x)}));
  const weeks=new Map();
  for (const row of rows) {
    const d=new Date(`${row.date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()-(d.getUTCDay()||7)+1);
    const label=d.toISOString().slice(0,10), bucket=weeks.get(label)??{label,values:[],observed:0};
    const v=value(row); if(v!==null){bucket.values.push(v);bucket.observed++;} weeks.set(label,bucket);
  }
  return [...weeks.values()].map(x=>({label:x.label,value:x.values.length?x.values.reduce((a,b)=>a+b,0):null,observed:x.observed}));
}
export function csvText(rows) {
  const cell=value=>{
    let text=value===null||value===undefined?'':String(value);
    if (/^[\s]*[=+@-]/.test(text) && typeof value!=='number') text="'"+text;
    return '"'+text.replaceAll('"','""')+'"';
  };
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
