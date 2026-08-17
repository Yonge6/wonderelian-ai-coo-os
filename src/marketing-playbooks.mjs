const SOURCE = Object.freeze({
  name: "marketingskills",
  repository: "https://github.com/coreyhaines31/marketingskills",
  commit: "7868cb9251fad80a73d26e488a5ad5f6c4a9f335",
  commit_url: "https://github.com/coreyhaines31/marketingskills/commit/7868cb9251fad80a73d26e488a5ad5f6c4a9f335",
  license: "MIT",
  integration: "principles_adapted_not_vendored",
});

const PLAYBOOKS = Object.freeze([
  {
    id: "product_context",
    category: "foundation",
    name: "Product context before tactics",
    name_zh: "先统一产品上下文，再选择战术",
    outcome: "Keep positioning, audience, pains, proof, objections, and the north star consistent across operating decisions.",
    outcome_zh: "让定位、受众、痛点、证据、异议与北极星指标在所有运营决策中保持一致。",
    required_evidence: ["portfolio_inventory", "north_star_defined"],
    base_priority: 96,
    next_action: "Use the verified portfolio and north-star context as the required preface for every new growth brief.",
    next_action_zh: "将已验证的产品组合与北极星上下文作为每份新增长简报的必备前置条件。",
    guardrail: "Context can guide decisions; it cannot substitute for outcome evidence.",
    guardrail_zh: "上下文可以指导决策，但不能代替结果证据。",
  },
  {
    id: "measurement_plan",
    category: "measurement",
    name: "Decision-led measurement plan",
    name_zh: "以决策为导向的测量计划",
    outcome: "Track events and metrics only when they answer a named operating decision.",
    outcome_zh: "仅追踪能够回答明确运营决策的事件与指标。",
    required_evidence: ["verified_acquisition_baseline", "website_analytics"],
    base_priority: 94,
    next_action: "Map each website and App Store metric to the decision it changes; keep unsupported outcomes null.",
    next_action_zh: "把每个网站与 App Store 指标映射到它会改变的决策；无证据的结果继续保留 null。",
    guardrail: "No vanity-metric winner and no missing value converted to zero.",
    guardrail_zh: "不以虚荣指标宣布赢家，也不把缺失值转换为 0。",
  },
  {
    id: "owned_search_geo",
    category: "search",
    name: "Owned search and GEO system",
    name_zh: "自有搜索与 GEO 内容系统",
    outcome: "Build useful, citeable pages whose discovery and acquisition impact can be verified.",
    outcome_zh: "建立真正有用、可引用，并能验证发现与获客影响的页面。",
    required_evidence: ["technical_search_foundation", "permanent_content_urls", "search_console"],
    base_priority: 90,
    next_action: "Maintain the useful-page inventory and wait for verified query/page data before scaling a topic.",
    next_action_zh: "维护有用页面资产库，在获得已验证的查询词/页面数据前不扩大某一主题。",
    guardrail: "No AI citation claims, keyword winners, or scaled publishing without verified discovery evidence.",
    guardrail_zh: "没有已验证的发现证据，不声称 AI 引用、关键词赢家，也不扩大内容发布。",
  },
  {
    id: "content_engine",
    category: "content",
    name: "Searchable and shareable content engine",
    name_zh: "可搜索与可分享的内容引擎",
    outcome: "Reuse one evidence-backed idea across a useful owned page and high-quality visual content.",
    outcome_zh: "将一个有证据支持的创意复用于有用的自有页面和高质量视觉内容。",
    required_evidence: ["product_context", "permanent_content_urls", "campaign_paths"],
    base_priority: 86,
    next_action: "Score the next content brief by customer impact, content fit, discovery potential, and production cost.",
    next_action_zh: "按用户影响、内容匹配度、发现潜力和制作成本为下一份内容简报评分。",
    guardrail: "Publishing remains approval-based; no bulk posting, templated community spam, or invented outcomes.",
    guardrail_zh: "发布继续走审批；禁止批量发帖、模板化社区刷屏和虚构结果。",
  },
  {
    id: "landing_conversion",
    category: "conversion",
    name: "Landing-page conversion diagnosis",
    name_zh: "落地页转化诊断",
    outcome: "Separate traffic, CTA interaction, App Store page views, and downloads before changing a page.",
    outcome_zh: "在修改页面前，分开判断流量、CTA 互动、App Store 页面浏览和首次下载。",
    required_evidence: ["website_analytics", "cta_measurement", "app_store_analytics"],
    base_priority: 84,
    next_action: "Diagnose the first unsupported funnel step; do not redesign from traffic alone.",
    next_action_zh: "先定位漏斗中第一个缺少证据的环节，不因只有流量数据就改版。",
    guardrail: "A click is not a download and a page view is not a conversion.",
    guardrail_zh: "点击不等于下载，页面浏览也不等于转化。",
  },
  {
    id: "app_store_optimization",
    category: "store",
    name: "Evidence-based App Store optimization",
    name_zh: "基于证据的 App Store 优化",
    outcome: "Turn acquisition and verified customer language into testable store hypotheses.",
    outcome_zh: "把获客数据和已验证的用户语言转化为可测试的商店页假设。",
    required_evidence: ["verified_acquisition_baseline", "verified_customer_language", "app_store_analytics"],
    base_priority: 82,
    next_action: "Keep metadata ideas as hypotheses until automatic acquisition data is reconciled with the manual baseline.",
    next_action_zh: "在自动获客数据与手工基线完成对账前，商店元数据想法只保留为假设。",
    guardrail: "No metadata winner without comparable acquisition outcomes.",
    guardrail_zh: "没有可比的获客结果，不宣布元数据赢家。",
  },
  {
    id: "customer_language",
    category: "research",
    name: "Verified customer-language bank",
    name_zh: "已验证的用户语言库",
    outcome: "Use reviews and public feedback as evidence for messaging and product hypotheses.",
    outcome_zh: "用评论和公开反馈为传播文案与产品假设提供证据。",
    required_evidence: ["verified_customer_language"],
    base_priority: 80,
    next_action: "Preserve exact review provenance and cluster themes only after repeated evidence appears.",
    next_action_zh: "保留评论的精确来源，仅在重复证据出现后聚类主题。",
    guardrail: "No synthetic testimonials, inferred consensus, or review theme from an empty dataset.",
    guardrail_zh: "禁止合成口碑、推断共识或从空数据生成评论主题。",
  },
  {
    id: "experiment_design",
    category: "experimentation",
    name: "Evidence-threshold experiments",
    name_zh: "证据阈值实验",
    outcome: "Define a hypothesis, primary metric, sample threshold, stop rule, and attribution path before launch.",
    outcome_zh: "在启动前明确假设、主指标、样本阈值、停止规则与归因路径。",
    required_evidence: ["app_store_analytics", "direct_attribution"],
    base_priority: 78,
    next_action: "Keep current experiments inconclusive until direct or strong outcome evidence reaches the declared threshold.",
    next_action_zh: "在直接或强结果证据达到声明阈值前，现有实验继续保持无结论。",
    guardrail: "No winner from directional traffic, partial attribution, or an underpowered sample.",
    guardrail_zh: "不从方向性流量、部分归因或样本不足的数据中宣布赢家。",
  },
  {
    id: "marketing_loop",
    category: "loop",
    name: "Measured growth loop",
    name_zh: "可测量的增长闭环",
    outcome: "Run input → action → output → feedback only when the feedback can change the next cycle.",
    outcome_zh: "只有反馈能够改变下一轮时，才运行“输入 → 行动 → 输出 → 反馈”闭环。",
    required_evidence: ["phase4_gate", "direct_attribution", "provider_backed_cycle"],
    requires_phase4: true,
    base_priority: 76,
    next_action: "Remain frozen until the Phase 4 gate and attributable feedback loop are both verified.",
    next_action_zh: "在 Phase 4 门禁与可归因反馈闭环均被验证前继续冻结。",
    guardrail: "No loop without measurable feedback, an owner, a cadence, and an explicit stop condition.",
    guardrail_zh: "没有可测反馈、责任人、节奏和明确停止条件，就不建立闭环。",
  },
]);

const EVIDENCE_LABELS = Object.freeze({
  portfolio_inventory: ["Verified portfolio inventory", "已验证的产品组合清单"],
  north_star_defined: ["North star is defined", "已定义北极星指标"],
  verified_acquisition_baseline: ["Verified acquisition baseline", "已验证的获客基线"],
  website_analytics: ["Verified website analytics", "已验证的网站访问分析"],
  technical_search_foundation: ["Technical SEO / GEO foundation", "SEO / GEO 技术基础"],
  permanent_content_urls: ["Permanent content URLs", "内容永久公开 URL"],
  search_console: ["Verified Search Console observations", "已验证的 Search Console 观测"],
  product_context: ["Product context is available", "产品上下文可用"],
  campaign_paths: ["Content-to-campaign paths", "内容到 Campaign 的路径"],
  cta_measurement: ["Verified CTA measurements", "已验证的 CTA 测量"],
  app_store_analytics: ["Automatic App Store acquisition", "自动 App Store 获客数据"],
  verified_customer_language: ["Verified customer language", "已验证的用户语言"],
  direct_attribution: ["Direct or strong outcome attribution", "直接或强结果归因"],
  phase4_gate: ["Phase 4 gate is satisfied", "Phase 4 门禁已满足"],
  provider_backed_cycle: ["Provider-backed COO cycle", "真实 Provider-backed COO 周期"],
});

function provider(state, id) {
  return (state.providers ?? []).find((item) => item.id === id);
}

function hasNonNullMetric(rows, names) {
  return (rows ?? []).some((row) => names.includes(row.metric ?? row.name) && row.value !== null && row.value !== undefined);
}

export function marketingEvidence(state) {
  const appStore = provider(state, "app_store_connect_api");
  const search = provider(state, "google_search_console_api");
  const reviews = provider(state, "app_store_reviews_api");
  const websiteAnalytics = provider(state, "website_analytics_api");
  const acquisitionReady = appStore?.status === "live" && Boolean(state.metadata?.data_through?.app_store);
  const reconciled = (state.reconciliations ?? []).length > 0;
  const providerCycle = (state.cycles ?? []).some((cycle) => cycle.version === "v2"
    && cycle.data_through?.app_store
    && (cycle.stages?.sync?.succeeded ?? 0) > 0
    && (cycle.stages?.reconcile?.received ?? 0) > 0);
  const directAttribution = (state.attributions ?? []).some((row) => ["direct", "strong"].includes(row.confidence_class)
    && (row.first_time_downloads ?? row.downloads ?? null) !== null);
  const websiteMetrics = state.website_metrics ?? [];
  const published = (state.content ?? []).filter((item) => item.status === "published" && (item.publish_url ?? item.url));
  const technicalSearch = (state.geo_observations ?? []).some((item) => ["published", "ready", "verified", "live"].includes(item.status))
    || (state.website_observations ?? []).some((item) => item.canonical && item.h1 && item.robots_valid && item.sitemap_valid);

  return {
    portfolio_inventory: (state.apps ?? []).length > 0 && (state.websites ?? []).length > 0,
    north_star_defined: Boolean(state.metadata?.primary_outcome),
    verified_acquisition_baseline: hasNonNullMetric(state.metrics, ["first_time_downloads", "product_page_views", "impressions"]),
    website_analytics: websiteAnalytics?.status === "live" && hasNonNullMetric(websiteMetrics, ["page_views", "sessions", "active_users"]),
    technical_search_foundation: technicalSearch,
    permanent_content_urls: published.length > 0,
    search_console: search?.status === "live" && (state.search_observations ?? []).length > 0,
    product_context: (state.apps ?? []).length > 0 && Boolean(state.metadata?.primary_outcome),
    campaign_paths: (state.attributions ?? []).length > 0 || (state.campaigns ?? []).some((item) => item.landing_url || item.url),
    cta_measurement: hasNonNullMetric(websiteMetrics, ["cta_clicks"]),
    app_store_analytics: acquisitionReady,
    verified_customer_language: reviews?.status === "live" && (state.feedback ?? []).length > 0,
    direct_attribution: directAttribution,
    phase4_gate: acquisitionReady && reconciled && providerCycle,
    provider_backed_cycle: providerCycle,
  };
}

export function evaluateMarketingPlaybooks(state) {
  const evidence = marketingEvidence(state);
  const playbooks = PLAYBOOKS.map((playbook) => {
    const requirements = playbook.required_evidence.map((id) => ({
      id,
      met: Boolean(evidence[id]),
      label: EVIDENCE_LABELS[id]?.[0] ?? id,
      label_zh: EVIDENCE_LABELS[id]?.[1] ?? id,
    }));
    const missing = requirements.filter((item) => !item.met).map((item) => item.id);
    const phaseGated = Boolean(playbook.requires_phase4 && !evidence.phase4_gate);
    const status = phaseGated ? "phase_gated" : missing.length ? "waiting_evidence" : "ready";
    const priority = Math.max(0, playbook.base_priority - (missing.length * 12) - (phaseGated ? 24 : 0));
    return {
      ...playbook,
      status,
      priority,
      requirements,
      missing_evidence: missing,
      execution_mode: "manual_or_approval_gated",
      external_execution_authorized: false,
    };
  }).sort((a, b) => b.priority - a.priority);
  return {
    source: SOURCE,
    policy: {
      external_execution: "disabled",
      phase4_activation: "disabled",
      unknown_metrics: "null",
      selection_rule: "evidence_and_phase_gated",
    },
    summary: {
      total: playbooks.length,
      ready: playbooks.filter((item) => item.status === "ready").length,
      waiting_evidence: playbooks.filter((item) => item.status === "waiting_evidence").length,
      phase_gated: playbooks.filter((item) => item.status === "phase_gated").length,
    },
    recommended: playbooks.filter((item) => item.status === "ready").slice(0, 3).map((item) => item.id),
    playbooks,
  };
}

export const marketingPlaybookSource = SOURCE;
