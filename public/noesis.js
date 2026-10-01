const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const number = value => value == null ? "—" : new Intl.NumberFormat("en-US", {maximumFractionDigits:2}).format(value);

/** Present independent verified periods; never infer App metrics from website traffic. */
export function noesisHero({current, snapshot, sites, scope, locale, mode}) {
  const zh = locale === "zh", label = (en, cn) => zh ? cn : en;
  const selected = sites.find(site => site.id === scope);
  const metrics = selected ? current?.websites?.find(row => row.website_id === scope)?.metrics : current?.website_totals;
  const products = [...(snapshot?.apps ?? [])].sort((a,b) => (b.app_units ?? -1) - (a.app_units ?? -1));
  const total = snapshot?.totals?.app_units;
  const shortName = product => ({wendao:"Wendao","yixiu-meditation":"Yixiu","style-atlas":"Style Atlas","maker-business-lab":"Maker"}[product.app_id] ?? product.name.replace(/:.*$/, "").replace(" Business Lab", ""));
  const period = `${current?.period_start ?? current?.date ?? "—"} → ${current?.period_end ?? current?.date ?? "—"}`;
  return `<div class="noesis-scene">
    <img class="noesis-art noesis-art-dark" src="./assets/noesis-crystal-dark.png" width="1487" height="982" alt="" fetchpriority="high">
    <img class="noesis-art noesis-art-light" src="./assets/noesis-crystal-light.png" width="1487" height="982" alt="" loading="lazy">
    <header class="noesis-intro"><div><span class="noesis-eyebrow">NOESIS</span><h2>${label("Operations core","运营中枢")}</h2><p>${label("Connect real people. Build a larger tomorrow.","连接真实用户 · 驱动更大的人类未来")}</p><small>A LARGER HUMAN TOMORROW</small></div><p class="noesis-manifesto">REAL USERS<br>REAL WORLDS<br>A BRIGHTER<br>TOMORROW</p></header>
    <div class="noesis-panels">
      <section class="noesis-web noesis-panel" aria-label="${label("Website data","网站数据")}">
        <h3>WEBSITE <span>/ ${selected ? escape(zh ? selected.name_zh ?? selected.name : selected.name) : label("Website data","网站数据")}</span></h3>
        <p class="noesis-period">${escape(period)} <small>${label(mode === "cumulative" ? "Cumulative" : "Single day",mode === "cumulative" ? "累计" : "单日")}</small></p>
        <div class="noesis-primary"><strong>${number(metrics?.active_users)}</strong><span>${label("Website UV","网站 UV")}</span><small>${label("GA4 active users","GA4 活跃用户")}</small></div>
        <dl class="noesis-secondary">${[["page_views","Page views","页面浏览"],["sessions","Sessions","会话"],["cta_clicks","CTA events","CTA 事件"]].map(([key,en,cn])=>`<div><dd>${number(metrics?.[key])}</dd><dt>${label(en,cn)}<small>${en}</small></dt></div>`).join("")}</dl>
      </section>
      <div class="noesis-core-caption"><span>WONDERELIAN</span><small>N O E S I S</small></div>
      <section class="noesis-app noesis-panel" aria-label="${label("App sales","App 商业表现")}">
        <h3>APP <span>/ ${label("Commercial performance","商业表现")}</span></h3>
        <p class="noesis-period">${escape(snapshot?.period_start ?? "—")} → ${escape(snapshot?.period_end ?? "—")} <small>${escape(snapshot?.timezone ?? "")}</small></p>
        <div class="noesis-app-stats">
          <article><strong>${number(total)}</strong><span>${label("App units","App 单位")}</span><small>Units</small></article>
          <article><strong>${number(snapshot?.totals?.in_app_purchase_units)}</strong><span>IAP</span><small>In-App Purchases</small></article>
          <article><strong>${number(snapshot?.totals?.sales_amount)}</strong><span>${label("Sales","销售额")}</span><small>${escape(snapshot?.totals?.sales_currency ?? "—")}</small></article>
        </div>
        <div class="noesis-products"><h4>${label("Units by product","App 单位构成")}<small>Sales and Trends</small></h4>${products.map(product=>`<div class="noesis-product"><span title="${escape(product.name)}">${escape(shortName(product))}</span><meter min="0" max="${Math.max(total ?? 0,1)}" value="${product.app_units ?? 0}" aria-label="${escape(product.name)} ${label("App units","App 单位")}" ${product.app_units == null ? "hidden" : ""}></meter><strong>${number(product.app_units)}</strong></div>`).join("") || `<p>${label("No verified sales snapshot","暂无已验证销售快照")}</p>`}</div>
        <p class="noesis-unknown"><span>${label("Attributable trial starts","可归因试用开始")}</span><strong>—</strong></p>
        <small class="noesis-source">${label("Official Apple snapshot · Not real-time","Apple 官方快照 · 非实时数据")}</small>
      </section>
    </div>
    <div class="noesis-directory" role="group" aria-label="${label("Filter website data","筛选网站数据")}"><span>SEVEN WEBSITES<br>ONE ECOSYSTEM</span><button data-orbit-site="portfolio" aria-pressed="${!selected}">${label("All websites","全部网站")}</button>${sites.map(site=>`<button data-orbit-site="${escape(site.id)}" aria-pressed="${site.id === scope}">${escape(zh ? site.name_zh ?? site.name : site.name)}</button>`).join("")}</div>
    <footer class="noesis-signature"><span>WONDERELIAN · AI COO OS</span><span>A BRIGHTER TOMORROW</span></footer>
  </div>`;
}
