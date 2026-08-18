# Daily Operations Execution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an evidence-backed daily operations summary to the Command Center and turn Activity into a detailed Operations Log.

**Architecture:** Compose a presentation-only daily operations model from existing `jobs`, `audit`, `content`, `channels`, and `cycles` collections in `public/app.js`. Keep schedule state distinct from recorded outcomes, group all operating dates in Beijing time, and render only permanent public URLs as publication evidence. No provider, domain, or product-repository mutation is required.

**Tech Stack:** Vanilla ES modules, semantic HTML, CSS Grid, Node test runner, existing static build and GitHub Pages deployment.

---

### Task 1: Lock the public UI contract

**Files:**
- Create: `tests/daily-operations-ui.test.mjs`
- Modify: `tests/public-timezone.test.mjs`

**Step 1: Write the failing test**

Assert that the shipped UI contains bilingual Daily Operations and Operations Log copy, a Command Center execution module, job schedules, verified audit outcomes, permanent content links, attribution completeness, and responsive execution layout tokens.

**Step 2: Run the focused tests and verify they fail**

Run: `npm test -- --test-name-pattern="daily operations|Beijing time"`

Expected: FAIL because the execution module and Operations Log labels do not exist yet.

### Task 2: Build the daily operations presentation model

**Files:**
- Modify: `public/app.js`

**Step 1: Add date and evidence helpers**

Add helpers that derive the latest operating date from job runs, audit timestamps, and publication dates; filter evidence by Beijing day; format structured results safely; and calculate attribution path completeness without converting missing metrics to zero.

**Step 2: Render the Command Center module**

Add a Daily Operations section immediately after Daily Portfolio Telemetry with status counters, compact job timeline, verified outcome feed, and channel distribution links.

**Step 3: Upgrade Activity to Operations Log**

Render complete scheduled-task, audit-outcome, content-distribution, and operating-cycle ledgers. Retain Data Sources and Content as their existing canonical detail views.

### Task 3: Implement responsive visual treatment

**Files:**
- Modify: `public/styles.css`

**Step 1: Add mission-control layout styles**

Create a three-column execution rack, time rail, outcome counters, evidence rows, and link treatments using existing cyan, lime, orange, line, and surface tokens.

**Step 2: Add responsive behavior**

Collapse the execution rack at 1240 px and 900 px, make detailed tables horizontally scrollable, and preserve 44 px interactive targets on mobile.

### Task 4: Version, verify, and document

**Files:**
- Modify: `public/index.html`
- Modify: `tests/daily-portfolio-ui.test.mjs`
- Modify: `ops/wonderelian-six-site-web-operations.md`

**Step 1: Update static asset version**

Use a new immutable query version for `app.js` and `styles.css`.

**Step 2: Run verification**

Run: `npm test`, `npm run check`, and `npm run build:static`.

Expected: all tests pass, state check passes, and the public snapshot builds without private data.

**Step 3: Perform browser QA**

Verify desktop and 390 px layouts, language switching, permanent links, no horizontal page overflow, and no browser console or HTTP errors.

**Step 4: Append durable operating evidence**

Record the implementation, tests, commit, deployment, and live verification in the append-only operations log.

### Task 5: Publish and verify production

**Files:**
- No new source files.

**Step 1: Commit and push the feature branch**

Stage only the scoped AI COO OS and operations-log changes, then push `codex/daily-operations-execution`.

**Step 2: Merge through GitHub**

Create a ready pull request, verify checks, and merge to `main`.

**Step 3: Deploy the custom domain**

Deploy the exact merged static build to the existing `ops.wonderelian.com` nginx document root without changing unrelated server configuration.

**Step 4: Verify live state**

Confirm GitHub Pages workflow success, HTTP 200 responses, the new asset version, and live DOM evidence for Daily Operations and Operations Log.
