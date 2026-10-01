# NOESIS crystal direction — current design QA (2026-10-01)

final result: passed

- Selected source: `docs/design/noesis-20261001/reference.png` (third displayed option, exec-a914fdd7-9195-4fb3-83c3-1a4a2f91e6cd).
- Implementation: `docs/design/noesis-20261001/noesis-desktop.png`.
- Combined visual comparison: `docs/design/noesis-20261001/comparison-final.png`, reference left / implementation right, inspected together.
- Both frames: 1487 × 1058 CSS pixels, screenshot density 1. No mismatched scaling; side-by-side canvas 2974 × 1058.
- State: Chinese, Command Center, dark, cumulative Aug 15–Sep 30, all websites; independent Sep 1–30 App sales snapshot.
- Responsive evidence in the same directory: `noesis-desktop-light.png`, `noesis-mobile-light.png`, `noesis-mobile-dark.png`, `noesis-mobile-app.png`, `noesis-tablet.png`. Mobile 390 × 844; tablet 768 × 1024.

## Comparison and fix history

1. P1 navigation labels truncated by inherited three-column grid: replaced top-nav button layout with flex; all seven labels render on desktop, horizontally scroll on mobile.
2. P2 App product names wrapped and pushed panels below the reference composition: compact verified product names, full names retained in title and detailed source table.
3. P2 mobile title overlapped crystal apex: separated introduction and a shorter crystal stage. Both themes checked after fix.
4. P2 day background showed side letterboxing: restored full-bleed cover treatment. Day directory now uses a light translucent surface with dark text.
5. P2 theme controls lost accessible names when text was hidden: explicit Day / Night bilingual labels added.

## Final visual checks

- Layout: 76px horizontal masthead, intro above two square-edged data panels, crystal centered, website directory below. No panel collisions.
- Typography: IBM Plex UI text and contrasting Georgia display numerals preserve the serif/sans hierarchy. CJK labels readable; product labels do not wrap. Full-date ranges remain visible.
- Color: restrained violet/platinum dark palette; pearl day variant uses independent artwork and dark ink. No cyan orbital UI remains on the main screen.
- Images: generated W mark and dark/light crystal assets inspected. Decorative images have empty alt text; UI data is real HTML, not burned into the artwork.
- Icons: existing Phosphor sun/moon/navigation assets; visible controls have accessible names and inherited focus outlines.
- Responsive: document width equals viewport at 390, 768 and 1487. Tables/nav use bounded scrolling. Mobile data panels stack without clipped controls.
- Motion: existing reduced-motion override retained; no continuous animation added.
- Remaining P3: generated crystal is slightly taller/lower than the reference; header omits decorative date and central microcopy. Product bars show the true share of 72 units instead of imitating the reference's inaccurate visual lengths. Website directory retains all seven real site names and an explicit all-sites reset.

## Functional verification

- Night/day toggle, persistence after reload, Chinese/English switching verified in the in-app browser.
- Daily Sep 30 website UV = 18; Sep 29 changes website date only; cumulative all-sites UV = 946; selected Yixiu cumulative UV = 526; reset restores 946.
- Independent App period remains Sep 1–30 during website date/site switches.
- Products navigation and return to overview verified; monthly sales details remain accessible below the hero.
- Refresh displays success without importing data; export control invoked and CSV serialization tested (blank unknowns, zero preservation, formula safety).
- Browser console error/warning readback empty.
- `npm test`: 99/99 pass. `npm run check`: STATE_OK. Static build including public-data sanitizer passed; transient build timestamps restored to avoid implying a new data import.
- Local preview only: `http://127.0.0.1:4317/?static=1#command`. No Git commit, push, provider sync or deployment performed. Server remains bound to 127.0.0.1; viewport override reset and deliverable tab retained.

---

# Historical QA — AI COO OS Option 1

- Source visual truth: `docs/design/option-1-source.png`
- Final implementation screenshot: `docs/design/qa/desktop-final.png`
- Full-view comparison: `docs/design/qa/comparison-full.png`
- Focused header/gate comparison: `docs/design/qa/comparison-header-gate.png`
- Focused decision-ledger comparison: `docs/design/qa/comparison-decisions.png`
- Mobile evidence: `docs/design/qa/mobile-final.png`
- Viewport: 1440 × 1024 CSS pixels at device density 1; mobile verification at 390 × 844 CSS pixels.
- Normalization: source was 1487 × 1058 pixels and was resized to 1440 × 1024 for comparison. Implementation was captured natively at 1440 × 1024.
- State: Chinese locale, Command Center, Phase 4 gate unmet, verified operational data loaded.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: IBM Plex Mono/Sans reproduce the target's technical grotesk hierarchy; PingFang SC/Chinese system fallbacks preserve Chinese legibility. Display, label, body, score, and metadata weights remain distinct without clipping.
- Spacing and layout rhythm: header, fixed navigation rail, decision workspace, gate proportions, dividers, and three-row ledger match the target hierarchy. All three decisions are fully visible at 1440 × 1024 after the density correction.
- Colors and visual tokens: graphite canvas, near-black surfaces, cyan information signals, lime gate/rank signals, muted metadata, and fine gray borders map closely to the source. Contrast remains readable.
- Image quality and asset fidelity: the target contains no raster photography or illustration assets. Navigation and gate icons use the Phosphor icon library; no custom SVG, CSS drawing, emoji, or placeholder asset substitutes are used.
- Copy and content: bilingual app copy remains coherent and all operational values come from the existing verified state. The gate's right column intentionally uses the real three-condition Phase 4 requirement instead of the generated mock's less precise summary.
- Responsiveness: 390 × 844 has no document-level horizontal overflow; navigation remains horizontally accessible, tap targets are at least 44px, the gate stacks correctly, and decision evidence collapses to one column.
- Accessibility and states: semantic buttons and headings are retained, focus-visible treatment is present, reduced motion is supported, language selection and active navigation states are visible, and public write controls remain hidden.

## Comparison History

### Pass 1 — blocked

- [P2] Phase 4 label wrapped onto two lines and changed the gate hierarchy.
  - Fix: added a non-wrapping Phase 4 label and rebalanced gate columns.
- [P2] The first-screen decision ledger was too tall, leaving the third decision partially outside the 1440 × 1024 viewport.
  - Fix: removed the duplicate brief label, tightened hero and section spacing, reduced gate height, and reduced decision-row padding/minimum height.

### Pass 2 — blocked

- The gate wrap was fixed, but the third decision still sat partially below the viewport.
  - Fix: completed the vertical-density pass while preserving readable type and evidence columns.

### Pass 3 — passed

- Phase 4 is a single-line label.
- All three ranked decisions are fully visible; the third card ends at 956px in a 1024px viewport.
- Source and implementation preserve the same hierarchy: system masthead → navigation rail → daily brief/change signal → Phase 4 gate → ranked decision ledger.
- Full-view and focused comparisons show no remaining P0/P1/P2 mismatch.

## Primary Interactions Tested

- English ↔ Chinese locale switch.
- All nine workspace navigation routes.
- Active navigation state and page-heading updates.
- Public read-only mode hides write/approval/import controls and shows the rail disclosure.
- Gate remains `Phase 4 / 未满足条件` from real provider-backed state.
- Desktop and mobile layout checks.
- Browser console: zero warnings and zero errors.

## Follow-up Polish

- [P3] The generated source uses a slightly softer illuminated surface treatment. The implementation intentionally keeps solid surfaces and restrained borders for readability and performance.

## Final Result

final result: passed
