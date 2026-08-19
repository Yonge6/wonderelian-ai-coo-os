# Operations Log Content-First Design

## Outcome

Make permanent publication evidence the first detailed section of the Operations Log. Show newest records first and keep the ledger usable as history grows.

## Interaction

- `Content distribution` becomes section 01, before scheduled tasks, verified outcomes, and operating cycles.
- Eligible records remain limited to published items with a verified HTTPS permanent URL.
- Records sort by `published_at` descending. Equal timestamps use `id` descending as a stable tie-breaker.
- The table shows 10 records per page. Previous and next controls are disabled at the boundaries; a bilingual `Page X of Y` status explains the current slice.
- Opening the Operations Log resets to page 1. Changing locale preserves the page when it remains valid.
- Pagination is entirely local over the existing public snapshot and does not change evidence, attribution, or Provider state.

## Visual consistency

The website-scope selector uses the same dark surface, border, cyan text, square corners, typography, hover, and focus treatment as the existing date selector and period switch. Native dark color-scheme support is retained for the opened option list.

## Verification

- Automated tests assert section order, descending sort, stable tie-breaker, 10-row slicing, bilingual labels, and event bindings.
- Browser acceptance checks page 1 contains the newest 10 records, page 2 changes the visible slice, and previous/next disabled states are correct.
- Desktop and 390px layouts must have no document-level horizontal overflow and no console errors.
- Full tests, state validation, static build, public safety scan, production deployment, and live custom-domain read-back remain required.
