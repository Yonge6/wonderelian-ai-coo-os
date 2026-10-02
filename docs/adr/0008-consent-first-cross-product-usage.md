# ADR 0008: Use the existing GA4/Firebase spine for consent-first product usage

- Status: Accepted
- Date: 2026-10-02

## Context

Yixiu and Style Atlas already emit consented H5 and native events into the shared read-only analytics property, while OPS already separates each product and surface. WonderElian has older aggregate web traffic but no dedicated consented product schema.

## Decision

Continue using the existing GA4/Firebase reporting spine. Add a `wonder_v1_*` web schema and a dedicated WonderElian provider/view in OPS. Keep H5 and native surfaces separate and retain pre-schema traffic as legacy evidence.

## Alternatives considered

- A new self-hosted collector would provide more control but adds an identity, storage, security and operations system that the current requirement does not need.
- A second hosted analytics product would split definitions and consent behavior across dashboards.
- Reusing generic GA4 events alone would not distinguish actual reading time or preserve the transition from the earlier default-on measurement accurately.

## Consequences

The three products share one reporting architecture and one dashboard. GA4 processing and privacy thresholds remain external constraints, so recent empty reports are represented as pending. The product event schemas remain isolated by prefix, host and native stream.
