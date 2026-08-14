const root = document.querySelector("#app");
const staticMode = location.hostname.endsWith("github.io") || location.protocol === "file:" || new URLSearchParams(location.search).has("static");
document.body.dataset.mode = staticMode ? "static" : "local";

const copy = {
  en: {
    north_star:"North star", north_star_value:"Attributable first-time downloads", readonly_banner:"Public read-only snapshot. Run the local app for writes, approvals, and imports.",
    command_center:"Command Center", apps:"Apps", insights:"Insights", actions:"Actions", experiments:"Experiments", content:"Content", customers:"Customers", activity:"Activity",
    updated:"State updated", portfolio_summary:"Portfolio summary", daily_brief:"Daily AI COO brief", winners:"Winners", problems:"Problems", opportunities:"Opportunities", recommended_decisions:"Recommended decisions",
    no_winner:"No verified winner can be declared from current coverage.", no_problem:"No verified problem detected.", no_opportunity:"No verified opportunity detected.",
    pending_approvals:"Pending approvals", no_pending:"No actions awaiting approval.", portfolio:"Portfolio", open:"Open", data_quality:"Data quality",
    data_quality_body:"Unknown outcomes stay null, so coverage is visible and no missing metric is mistaken for zero.", apps_reporting_primary:"1/5 apps currently report first-time downloads.",
    apps_detail:"Five configurable products; unknown store links remain empty.", add_app:"Add app", name:"Name", website_url:"Website URL", status:"Status", platforms:"Platforms (comma-separated)", save:"Save",
    insights_detail:"Ranked by impact, urgency, and confidence.", propose_action:"Propose action", actions_detail:"Every important external action moves through approval and audit states.",
    experiments_detail:"Primary decisions follow outcome metrics, not social likes.", primary:"Primary", add_experiment:"Add experiment", hypothesis:"Hypothesis", app_id:"App ID", primary_metric:"Primary metric",
    content_detail:"Permanent URLs and attribution paths; outcome fields remain empty until verified.", downloads:"downloads", log_content:"Log content", channel_id:"Channel ID", title:"Title", permanent_url:"Permanent URL",
    customers_detail:"Feedback stays linked to a product, source, topic, and evidence.", customer_feedback:"Customer feedback", no_feedback:"No verified customer feedback logged yet.", detected_opportunities:"Detected opportunities",
    opportunity_empty:"A repeated severe theme needs at least two evidence items.", signals:"signals", severity:"severity", log_feedback:"Log feedback", source:"Source", external_id:"External ID", feedback_text:"Feedback text", rating:"Rating", sentiment:"Sentiment", topic:"Topic", source_date:"Source date",
    activity_detail:"Append-only evidence of local state changes.", saved:"Saved and audited.", local_only:"The GitHub Pages dashboard is read-only. Use the local app for changes.", loading:"Loading verified operating state…", unavailable:"Unable to load operating state",
    evidence:"Evidence", confidence:"Confidence", reporting:"apps reporting", app:"App",
    proposed:"proposed", approved:"approved", executing:"executing", completed:"completed", rejected:"rejected", active:"active", published:"published", available:"available", running:"running", draft:"draft", blocked:"blocked", archived:"archived",
    kpi_first_time_downloads:"First time downloads", kpi_active_users:"Active users", kpi_revenue:"Revenue", kpi_trial_starts:"Trial starts", kpi_paid_conversions:"Paid conversions", kpi_conversion_rate:"Conversion rate", kpi_d1_retention:"D1 retention", kpi_d7_retention:"D7 retention", kpi_d30_retention:"D30 retention", kpi_traffic:"Traffic", kpi_content_published:"Content published", kpi_acquisition_performance:"Acquisition performance",
  },
  zh: {
    north_star:"北极星指标", north_star_value:"可归因的 App 首次下载", readonly_banner:"GitHub 公开版为只读快照；写入、审批和数据导入请使用本机版本。",
    command_center:"运营指挥中心", apps:"应用", insights:"洞察", actions:"行动", experiments:"实验", content:"内容", customers:"用户声音", activity:"审计日志",
    updated:"状态更新时间", portfolio_summary:"产品组合摘要", daily_brief:"每日 AI COO 简报", winners:"表现亮点", problems:"关键问题", opportunities:"增长机会", recommended_decisions:"建议决策",
    no_winner:"当前数据覆盖不足，暂不能判断已验证的赢家。", no_problem:"暂未发现已验证的问题。", no_opportunity:"暂未发现已验证的机会。",
    pending_approvals:"待审批", no_pending:"当前没有等待审批的行动。", portfolio:"产品组合", open:"打开", data_quality:"数据质量",
    data_quality_body:"未知结果保留为 null，以便看清数据覆盖，避免把缺失数据误判为零。", apps_reporting_primary:"目前 5 个应用中只有 1 个上报首次下载。",
    apps_detail:"5 个可配置产品；未经验证的商店链接保持为空。", add_app:"添加应用", name:"名称", website_url:"网站链接", status:"状态", platforms:"平台（逗号分隔）", save:"保存",
    insights_detail:"按影响力、紧迫度和置信度排序。", propose_action:"生成行动建议", actions_detail:"所有重要外部行动都必须经过审批与审计状态。",
    experiments_detail:"实验决策以结果指标为准，不以社交点赞为准。", primary:"主指标", add_experiment:"添加实验", hypothesis:"假设", app_id:"应用 ID", primary_metric:"主指标",
    content_detail:"每条内容保留永久 URL 与归因路径；未验证的结果保持为空。", downloads:"首次下载", log_content:"记录内容", channel_id:"渠道 ID", title:"标题", permanent_url:"永久 URL",
    customers_detail:"用户反馈必须关联产品、来源、主题和证据。", customer_feedback:"用户反馈", no_feedback:"尚未记录已验证的用户反馈。", detected_opportunities:"已识别机会",
    opportunity_empty:"同一高严重度主题至少需要两条证据。", signals:"条信号", severity:"严重度", log_feedback:"记录反馈", source:"来源", external_id:"外部 ID", feedback_text:"反馈内容", rating:"评分", sentiment:"情绪", topic:"主题", source_date:"来源日期",
    activity_detail:"本地状态变更的追加式证据记录。", saved:"已保存并写入审计。", local_only:"GitHub Pages 公开版为只读；请使用本机版本修改数据。", loading:"正在加载已验证的运营状态…", unavailable:"无法加载运营状态",
    evidence:"证据", confidence:"置信度", reporting:"个应用上报", app:"应用",
    proposed:"待审批", approved:"已批准", executing:"执行中", completed:"已完成", rejected:"已拒绝", active:"运行中", published:"已发布", available:"可用", running:"实验中", draft:"草稿", blocked:"受阻", archived:"已归档",
    kpi_first_time_downloads:"首次下载", kpi_active_users:"活跃用户", kpi_revenue:"收入", kpi_trial_starts:"试用开始", kpi_paid_conversions:"付费转化", kpi_conversion_rate:"转化率", kpi_d1_retention:"次日留存", kpi_d7_retention:"7 日留存", kpi_d30_retention:"30 日留存", kpi_traffic:"流量", kpi_content_published:"已发布内容", kpi_acquisition_performance:"获客表现",
  },
};

let locale = localStorage.getItem("ai-coo-locale") === "zh" ? "zh" : "en";
let state;
let brief;
let feedbackAnalysis;
let view = "command";
const t = (key) => copy[locale][key] ?? copy.en[key] ?? key;
const pick = (object, key) => locale === "zh" && object?.[`${key}_zh`] ? object[`${key}_zh`] : object?.[key];
const esc = (value) => String(value ?? (locale === "zh" ? "未知" : "Unknown")).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
const fmt = (value) => value === null || value === undefined ? "—" : new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en").format(value);
const appName = (id) => pick(state.apps.find((app) => app.id === id), "name") ?? (locale === "zh" ? "产品组合" : "Portfolio");
const statusTag = (status) => `<span class="tag ${["active","completed","published","available"].includes(status) ? "good" : ["blocked","rejected","killed","blocked_auth_conflict"].includes(status) ? "warn" : ""}">${esc(t(status))}</span>`;

function applyLocale() {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll("[data-locale]").forEach((button) => button.classList.toggle("active", button.dataset.locale === locale));
}

async function api(path, options) {
  const staticRoutes = { "/api/state":"./data/state.json", "/api/brief":"./data/brief.json", "/api/feedback-analysis":"./data/feedback-analysis.json" };
  if (staticMode && options) throw new Error(t("local_only"));
  const target = staticMode ? staticRoutes[path] : path;
  if (!target) throw new Error(t("local_only"));
  const response = await fetch(target, options && { ...options, headers: { "content-type":"application/json", "x-actor":"WonderElian", ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function refresh() {
  [state, brief, feedbackAnalysis] = await Promise.all([api("/api/state"), api("/api/brief"), api("/api/feedback-analysis")]);
  render();
}

function head(key, detail) { return `<header class="page-head"><h2>${t(key)}</h2><p>${detail}</p></header>`; }
function kpis() {
  return `<section class="kpis">${Object.entries(brief.kpis).map(([name, item]) => `<article class="kpi"><span class="label">${esc(t(`kpi_${name}`))}</span><strong>${fmt(item.value)}</strong><small>${item.apps_reporting}/${item.apps_total} ${t("reporting")}</small></article>`).join("")}</section>`;
}

function command() {
  const pending = state.actions.filter((action) => action.status === "proposed");
  const summary = locale === "zh" ? (brief.portfolio_summary_zh ?? `已追踪 ${state.apps.length} 个应用；目前 1 个上报北极星指标。`) : brief.portfolio_summary;
  return `${head("command_center", `${t("updated")} ${new Date(state.metadata.last_updated).toLocaleString(locale === "zh" ? "zh-CN" : "en")}`)}${kpis()}<section class="grid">
    <article class="panel span-2"><span class="label">${t("portfolio_summary")}</span><h3>${t("daily_brief")}</h3><p>${esc(summary)}</p>
      <div class="brief-sections"><div><strong>${t("winners")}</strong><p class="muted">${brief.winners.length ? brief.winners.map((item) => esc(pick(item,"title"))).join(" · ") : t("no_winner")}</p></div>
      <div><strong>${t("problems")}</strong><p class="muted">${brief.problems.length ? brief.problems.map((item) => esc(pick(item,"title"))).join(" · ") : t("no_problem")}</p></div>
      <div><strong>${t("opportunities")}</strong><p class="muted">${brief.opportunities.length ? brief.opportunities.map((item) => esc(pick(item,"title"))).join(" · ") : t("no_opportunity")}</p></div></div>
      <h3>${t("recommended_decisions")}</h3><div class="stack">${brief.recommendations.map((item) => `<div class="row"><div><span class="label">${esc(locale === "zh" ? (item.app_zh ?? item.app) : item.app)}</span><h3>${esc(pick(item,"action"))}</h3><p>${esc(pick(item,"observation"))}</p><small class="muted">${t("evidence")}: ${esc(pick(item,"evidence"))} · ${t("confidence")} ${Math.round(item.confidence*100)}%</small></div><span class="score">${item.priority}</span></div>`).join("")}</div></article>
    <article class="panel"><h3>${t("pending_approvals")}</h3>${pending.length ? pending.map(actionRow).join("") : `<p class="empty">${t("no_pending")}</p>`}</article>
    <article class="panel span-2"><h3>${t("portfolio")}</h3>${state.apps.map((app) => `<div class="row"><div><strong>${esc(pick(app,"name"))}</strong><div>${app.platforms.map((platform)=>`<span class="tag">${esc(platform)}</span>`).join("")} ${statusTag(app.status)}</div></div><a href="${esc(app.website_url)}" target="_blank" rel="noreferrer">${t("open")}</a></div>`).join("")}</article>
    <article class="panel"><h3>${t("data_quality")}</h3><p>${t("data_quality_body")}</p><p><strong>${t("apps_reporting_primary")}</strong></p></article></section>`;
}

function actionRow(action) {
  const next = ({proposed:["approved","rejected"],approved:["executing","rejected"],executing:["completed","rejected"]}[action.status]||[]);
  return `<div class="row"><div><strong>${esc(pick(action,"title"))}</strong><p class="muted">${esc(appName(action.app_id))}</p>${statusTag(action.status)}<div class="actions">${next.map((status)=>`<button data-transition-action="${action.id}" data-status="${status}">${t(status)}</button>`).join("")}</div></div></div>`;
}

function appsView() {
  return `${head("apps",t("apps_detail"))}<section class="grid">${state.apps.map((app)=>`<article class="panel"><span class="label">${esc(app.id)}</span><h3>${esc(pick(app,"name"))}</h3><p>${app.platforms.map((platform)=>`<span class="tag">${esc(platform)}</span>`).join("")} ${statusTag(app.status)}</p><a href="${esc(app.website_url)}" target="_blank" rel="noreferrer">${esc(app.website_url)}</a></article>`).join("")}</section>${form(t("add_app"),"/api/apps",[{name:"name",label:t("name"),required:true},{name:"website_url",label:t("website_url")},{name:"status",label:t("status"),value:"active"},{name:"platforms",label:t("platforms")}])}`;
}
function insightsView() {
  return `${head("insights",t("insights_detail"))}<section class="stack">${state.insights.map((item)=>`<article class="panel row"><div><span class="label">${esc(appName(item.app_id))}</span><h3>${esc(pick(item,"observation"))}</h3><p>${esc(pick(item,"reason"))}</p><small class="muted">${esc(pick(item,"evidence"))}</small><div class="actions"><button data-create-action="${item.id}">${t("propose_action")}</button></div></div><span class="score">${Math.round(item.impact*.5+item.urgency*.3+item.confidence*20)}</span></article>`).join("")}</section>`;
}
function actionsView() { return `${head("actions",t("actions_detail"))}<section class="stack">${state.actions.map(actionRow).join("")}</section>`; }
function experimentsView() {
  return `${head("experiments",t("experiments_detail"))}<section class="grid">${state.experiments.map((item)=>`<article class="panel"><span class="label">${esc(appName(item.app_id))}</span><h3>${esc(pick(item,"name"))}</h3><p>${esc(pick(item,"hypothesis"))}</p>${statusTag(item.status)}<p class="muted">${t("primary")}: ${esc(t(`kpi_${item.primary_metric}`))}</p></article>`).join("")}</section>${form(t("add_experiment"),"/api/experiments",[{name:"app_id",label:t("app_id"),value:"style-atlas"},{name:"name",label:t("name"),required:true},{name:"hypothesis",label:t("hypothesis"),type:"textarea"},{name:"primary_metric",label:t("primary_metric"),value:"first_time_downloads"}])}`;
}
function contentView() {
  return `${head("content",t("content_detail"))}<section class="stack">${state.content.map((item)=>`<article class="panel row"><div><span class="label">${esc(item.channel_id)} / ${esc(item.type)}</span><h3>${esc(pick(item,"title"))}</h3><a href="${esc(item.url)}" target="_blank" rel="noreferrer">${esc(item.url)}</a><p>${statusTag(item.status)} <span class="tag">${t("downloads")} ${fmt(item.first_time_downloads)}</span></p></div></article>`).join("")}</section>${form(t("log_content"),"/api/content",[{name:"app_id",label:t("app_id"),value:"style-atlas"},{name:"channel_id",label:t("channel_id")},{name:"title",label:t("title"),required:true},{name:"url",label:t("permanent_url"),required:true}])}`;
}
function customersView() {
  return `${head("customers",t("customers_detail"))}<section class="grid"><article class="panel span-2"><h3>${t("customer_feedback")}</h3>${state.feedback.length ? state.feedback.map((item)=>`<div class="row"><div><strong>${esc(item.text)}</strong><p>${esc(appName(item.app_id))} · ${esc(item.source)} · ${esc(item.topic)}</p></div></div>`).join("") : `<p class="empty">${t("no_feedback")}</p>`}</article><article class="panel"><h3>${t("detected_opportunities")}</h3>${feedbackAnalysis.opportunities.length ? feedbackAnalysis.opportunities.map((item)=>`<div class="row"><div><strong>${esc(item.problem)}</strong><p>${item.frequency} ${t("signals")} · ${t("severity")} ${item.severity}</p><span class="score">${item.opportunity_score}</span></div></div>`).join("") : `<p class="empty">${t("opportunity_empty")}</p>`}</article></section>${form(t("log_feedback"),"/api/feedback",[{name:"app_id",label:t("app_id"),value:"style-atlas"},{name:"source",label:t("source")},{name:"external_id",label:t("external_id")},{name:"text",label:t("feedback_text"),type:"textarea",required:true},{name:"rating",label:t("rating")},{name:"sentiment",label:t("sentiment")},{name:"topic",label:t("topic")},{name:"created_at",label:t("source_date")}])}`;
}
function activityView() {
  return `${head("activity",t("activity_detail"))}<section class="panel">${state.audit.map((item)=>`<div class="row"><div><strong>${esc(item.action)}</strong><p>${esc(item.result)}</p><small class="muted">${new Date(item.at).toLocaleString(locale === "zh" ? "zh-CN" : "en")} · ${esc(item.actor)} · ${esc(item.source)}</small></div>${statusTag(item.status)}</div>`).join("")}</section>`;
}

function form(title, endpoint, fields) {
  return `<form class="panel form-panel" data-endpoint="${endpoint}"><h2>${title}</h2><div class="fields">${fields.map((field)=>`<label>${field.label}${field.type === "textarea" ? `<textarea name="${field.name}" ${field.required?"required":""}>${field.value||""}</textarea>` : `<input name="${field.name}" value="${field.value||""}" ${field.required?"required":""}>`}</label>`).join("")}</div><button type="submit">${t("save")}</button><p class="form-status" role="status"></p></form>`;
}

function bind() {
  document.querySelectorAll("[data-transition-action]").forEach((button) => button.onclick = async () => { await api(`/api/actions/${button.dataset.transitionAction}/transition`,{method:"POST",body:JSON.stringify({status:button.dataset.status})}); await refresh(); });
  document.querySelectorAll("[data-create-action]").forEach((button) => button.onclick = async () => { await api(`/api/insights/${button.dataset.createAction}/actions`,{method:"POST",body:"{}"}); await refresh(); });
  document.querySelectorAll("form[data-endpoint]").forEach((element) => element.onsubmit = async (event) => {
    event.preventDefault(); const raw=Object.fromEntries(new FormData(element)); let data=raw;
    if(element.dataset.endpoint==="/api/apps") data={...raw,platforms:raw.platforms.split(',').map((item)=>item.trim()).filter(Boolean)};
    if(element.dataset.endpoint==="/api/experiments") data={...raw,status:"draft",variants:[],guardrail_metrics:[],decision:null};
    if(element.dataset.endpoint==="/api/content") data={...raw,type:"post",status:"draft",impressions:null,engagements:null,outbound_clicks:null,first_time_downloads:null};
    if(element.dataset.endpoint==="/api/feedback") data={...raw,rating:raw.rating?Number(raw.rating):null,imported_at:new Date().toISOString()};
    const status=element.querySelector('.form-status');
    try { await api(element.dataset.endpoint,{method:"POST",body:JSON.stringify(data)}); status.textContent=t("saved"); await refresh(); }
    catch(error) { status.textContent=error.message; }
  });
}

function render() {
  applyLocale();
  root.innerHTML = ({command,apps:appsView,insights:insightsView,actions:actionsView,experiments:experimentsView,content:contentView,customers:customersView,activity:activityView}[view])();
  bind();
}

document.querySelectorAll("nav button").forEach((button) => button.onclick = () => {
  document.querySelector("nav .active")?.classList.remove("active"); button.classList.add("active"); view=button.dataset.view; render();
});
document.querySelectorAll("[data-locale]").forEach((button) => button.onclick = () => {
  locale=button.dataset.locale; localStorage.setItem("ai-coo-locale",locale); render();
});
applyLocale();
root.innerHTML=`<p class="loading">${t("loading")}</p>`;
refresh().catch((error) => root.innerHTML=`<p class="panel">${t("unavailable")}: ${esc(error.message)}</p>`);
