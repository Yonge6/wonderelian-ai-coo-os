const ANALYTICS_PATTERN = /(?:\banalytics\.js\b|googletagmanager\.com|google-analytics\.com|\bgtag\s*\(|plausible\.io|clarity\.ms|cloudflareinsights\.com|posthog|umami|matomo|usefathom\.com)/i;

function textContent(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() || null;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? null;
}

function metaContent(html, key, attributeName = "name") {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (attribute(tag, attributeName)?.toLowerCase() === key.toLowerCase()) return attribute(tag, "content");
  }
  return null;
}

function canonicalUrl(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if ((attribute(tag, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical")) return attribute(tag, "href");
  }
  return null;
}

function heading(html) {
  return textContent(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
}

function title(html) {
  return textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
}

function beijingDay(value) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    year:"numeric", month:"2-digit", day:"2-digit", timeZone:"Asia/Shanghai",
  }).formatToParts(new Date(value)).map(({type, value:part}) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function fetchText(fetchFn, url) {
  const response = await fetchFn(url, { redirect:"follow", signal:AbortSignal.timeout(15_000) });
  return {
    status:response.status,
    ok:response.ok,
    url:response.url,
    content_type:response.headers.get("content-type"),
    server:response.headers.get("server"),
    body:await response.text(),
  };
}

export function inspectWebsiteHtml(html) {
  return {
    lang:html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)/i)?.[1] ?? null,
    title:title(html),
    description:metaContent(html, "description"),
    canonical:canonicalUrl(html),
    h1:heading(html),
    og_title:metaContent(html, "og:title", "property"),
    structured_data_count:(html.match(/application\/ld\+json/gi) ?? []).length,
    analytics_detected:ANALYTICS_PATTERN.test(html),
    app_store_link_count:(html.match(/https:\/\/apps\.apple\.com\//gi) ?? []).length,
  };
}

export class WebsiteHealthProvider {
  id = "public_website_health";
  capabilities = ["availability", "technical_seo", "analytics_tag_detection"];

  constructor({ fetchFn = fetch } = {}) { this.fetchFn = fetchFn; }

  async fetchWebsite(site, { now = new Date().toISOString() } = {}) {
    const day = beijingDay(now);
    try {
      const page = await fetchText(this.fetchFn, site.url);
      const root = new URL(page.url || site.url);
      const [robots, sitemap] = await Promise.all([
        fetchText(this.fetchFn, new URL("/robots.txt", root)).catch(() => null),
        fetchText(this.fetchFn, new URL("/sitemap.xml", root)).catch(() => null),
      ]);
      const inspected = inspectWebsiteHtml(page.body);
      return {
        id:`website-health-${site.id}-${day}`,
        website_id:site.id,
        app_id:site.app_id ?? null,
        observed_at:now,
        source:"Public HTTP and HTML probe",
        source_reference:site.url,
        verification_type:"api_verified",
        reachable:page.ok,
        http_status:page.status,
        final_url:page.url,
        server:page.server,
        content_type:page.content_type,
        ...inspected,
        robots_status:robots?.status ?? null,
        robots_valid:Boolean(robots?.ok && /user-agent:/i.test(robots.body)),
        sitemap_status:sitemap?.status ?? null,
        sitemap_valid:Boolean(sitemap?.ok && /<urlset|<sitemapindex/i.test(sitemap.body)),
        error:null,
      };
    } catch (error) {
      return {
        id:`website-health-${site.id}-${day}`,
        website_id:site.id,
        app_id:site.app_id ?? null,
        observed_at:now,
        source:"Public HTTP and HTML probe",
        source_reference:site.url,
        verification_type:"api_verified",
        reachable:false,
        http_status:null,
        final_url:null,
        analytics_detected:false,
        robots_status:null,
        robots_valid:false,
        sitemap_status:null,
        sitemap_valid:false,
        error:{code:"WEBSITE_PROBE_FAILED", message:error?.message ?? "Website probe failed."},
      };
    }
  }

  async fetchAll(sites, { now = new Date().toISOString() } = {}) {
    const observations = await Promise.all(sites.map((site) => this.fetchWebsite(site, { now })));
    return { observations, data_through:beijingDay(now) };
  }
}
