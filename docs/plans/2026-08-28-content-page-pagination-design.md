# Content page pagination design

## Goal

Keep the Content page scannable without changing any content, attribution, measurement, or unknown-value semantics.

## Decision

- Preserve the existing order: SEO / GEO Readiness, then Content Attribution.
- Paginate each module independently at six records per page.
- Keep a separate page state for `geo` and `attribution`, so paging one module cannot move the other.
- Reset both modules to page 1 whenever the Content view is reopened.
- Preserve the current page positions when switching locale.
- Reuse the existing accessible previous/status/next pagination treatment and responsive CSS.
- Allow long campaign and landing URLs to wrap inside the attribution row without widening the page.

## Acceptance

- SEO / GEO Readiness renders its own pager even when it has only one page.
- Content Attribution renders at most six records at a time and exposes its true page count.
- Page controls remain usable without horizontal overflow on desktop and mobile.
- All current URLs, campaign paths, statuses, and `null` download values remain unchanged.
