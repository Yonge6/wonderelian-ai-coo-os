# Sentient Orbit Implementation Plan

**Goal:** Implement the user's selected futuristic orbital dashboard with a new logo and persistent day/night themes, preserving verified metrics and existing operating workflows. The user subsequently requested removal of the system-following control; legacy system preferences fall back to night.

**Architecture:** Extend the existing static-compatible vanilla UI, not a new prototype scaffold. Keep provider normalization, snapshots, routes and data unchanged. Add a theme bootstrap and a presentation layer over existing website observations.

**Tech Stack:** Existing JavaScript, CSS, IBM Plex, Phosphor icons, Node test runner; generated raster logo and orbital artwork.

## Visual truth

Selected image: `/Users/yongyuan/.codex/generated_images/019fff66-87b9-7a10-868d-57d22654b69a/exec-b7aa4dc0-8960-429d-b984-03a06f10619b.png` (first displayed image of the latest set).

Preserve: deep navy/cyan palette, orbital logo, left navigation, open metric strip, interactive seven-site orbital map, website table. Correct generated mock copy/domains against real state. No simulated intelligence, forecasts, live-provider claims or invented conversion data.

## Steps

1. Add theme tests in `tests/theme.test.mjs`: default dark, saved light, legacy system fallback, unavailable storage, invalid preferences.
2. Add `public/theme.js` before styles to prevent theme flash; accessible day/night control in `public/index.html`. Preserve explicit preference across reloads.
3. Generate independent raster assets in `public/assets/`: logo, dark orbital map, matching light map. Preserve old logo and unrelated assets.
4. Extend `public/app.js` with actual-data orbital navigation, selected-site summary, shared date and cumulative/daily controls, site trend drilldown. Keep existing CSV and navigation handlers.
5. Add scoped theme/style layer `public/orbit.css`; desktop 1440px reference, tablet, and 390px mobile; reduced motion and visible focus.
6. Run `npm test`, `npm run check`, `npm run build:static`; inspect generated data diff and public safety. Do not import metrics or alter their meaning.
7. Run the existing local app on loopback, inspect browser DOM and interactions for both themes, all six routes, daily/cumulative/date/scope/CSV/refresh. Capture matching-reference desktop and mobile evidence.
8. Save side-by-side visual comparison and append this review to `design-qa.md`; fix material differences. Append actor/source/action/result/status to durable ops log. Handoff local preview; do not claim public deployment before actual deployment/readback.

## Boundaries

No product repositories, credentials, analytics requests, automations, social publishing or production writes are part of this visual implementation. No bulk staging. Existing data artifacts and user-owned assets remain intact.
