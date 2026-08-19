# Website Traffic Trends Design

## Outcome

Add evidence-backed daily and weekly website traffic trends to the Command Center while preserving the existing daily total and per-property ledgers.

## Interaction

- Default scope: all six tracked websites.
- Scope selector: portfolio total or one website.
- Period selector: daily or weekly.
- Metrics: GA4 active users (UV), page views (PV), sessions, and CTA events.
- Four compact SVG trend panels keep differently scaled metrics readable.

## Data semantics

The UI derives daily points from `brief.daily_portfolio.days`, which already contains normalized Provider-backed data. Weekly points group available daily observations by Monday and sum only known values. A missing day or metric remains `null`; the chart breaks the path and renders an em dash rather than inventing zero. Weekly labels describe a week-of bucket because the latest week may be partial.

## Operations evidence

Operations Log publication rows continue to require an HTTPS permanent URL. The visible link label includes the public hostname and path so every result can be inspected directly. Download outcomes remain null until verified attribution exists.

## Verification

- Automated assertions cover bilingual labels, selectors, SVG rendering hooks, weekly aggregation, and null-safe behavior.
- Full tests, state check, static build, and public security scan must pass.
- Production acceptance checks the custom-domain HTML and public JSON snapshots.
