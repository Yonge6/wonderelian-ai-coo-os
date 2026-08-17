# ADR-0006: Adapt Marketing Skills as Evidence-Gated Operating Playbooks

Status: Accepted  
Date: 2026-08-17

## Context

The open-source `coreyhaines31/marketingskills` repository contains a broad collection of marketing guidance for AI agents: product positioning, analytics, attribution, content strategy, SEO/GEO, conversion, App Store optimization, experiments, customer research, and marketing loops. Its product-marketing context, decision-led analytics, attribution uncertainty, and explicit feedback-loop ideas are relevant to WonderElian's consumer-app portfolio.

The AI COO OS already has stricter operational contracts than a general prompt library: unknown metrics stay `null`, important actions are approval-gated, outcomes require provenance, external APIs are isolated in Providers, and Phase 4 remains blocked until real App Store acquisition observations, 90-day reconciliation, and a Provider-backed cycle succeed.

Importing an entire prompt and integration package would add overlapping instructions, third-party OAuth surfaces, CLI dependencies, and execution behaviors that are not justified by current evidence.

## Decision

1. Adapt principles from the upstream repository at pinned commit `7868cb9251fad80a73d26e488a5ad5f6c4a9f335`; do not track a mutable default branch at runtime.
2. Do not vendor upstream skill bodies, install its CLI, or enable its third-party integrations.
3. Represent the useful methods as a small native catalog in `src/marketing-playbooks.mjs`.
4. Evaluate every playbook against verified portfolio evidence and assign exactly one readiness state:
   - `ready`
   - `waiting_evidence`
   - `phase_gated`
5. Preserve the upstream MIT attribution and link the public UI to the exact audited commit.
6. Keep external execution and automatic Phase 4 activation disabled. The catalog recommends bounded internal next actions; it does not publish, change accounts, or authorize OAuth.
7. Keep winner declarations, experiment conclusions, and scaling decisions blocked until the relevant outcome evidence exists.
8. Derive the catalog in the daily brief so readiness changes automatically when Providers and reconciliations change, without duplicating mutable state.

## Adapted Principles

- Establish product and audience context before selecting tactics.
- Track metrics and events because they inform named decisions, not because they are available.
- Treat attribution as reconciliation under uncertainty, not as a single-source truth claim.
- Balance searchable owned content with shareable content while preserving permanent URLs and campaign paths.
- Require a measurable feedback signal, cadence, owner, and stop condition before calling an activity a loop.

All wording and implementation in AI COO OS are original adaptations of these principles; upstream skill text and executable integrations are not copied into the runtime.

## Current Evidence Effect

At integration time, website analytics and the manual acquisition baseline are available, while Search Console observations, automatic App Store acquisition, direct download attribution, reconciliation, and the Phase 4 gate are not. The selector therefore keeps search scaling, landing-to-download diagnosis, App Store outcome optimization, experiments, and the measured growth loop waiting or phase-gated. It does not interpret missing data as zero.

## Consequences

### Positive

- The system gains a coherent marketing method library without a parallel agent instruction stack.
- Recommendations remain explainable because every method displays its required and missing evidence.
- The catalog will mature with Provider coverage instead of requiring manual status updates.
- The public bilingual dashboard can show why a method is ready or blocked.

### Negative

- The system does not inherit future upstream methods automatically.
- Upstream changes must be re-audited and deliberately re-pinned.
- General marketing templates are narrower after adaptation because portfolio evidence and phase boundaries take precedence.

## Alternatives Considered

**Install the complete repository and integrations**

Rejected because it adds overlapping prompts, tools, OAuth dependencies, and external execution paths that exceed the current authorization boundary.

**Copy selected prompt files into the repository**

Rejected because static text would not participate in evidence thresholds, Provider state, approval rules, or Phase 4 gating.

**Keep the repository only as a reading reference**

Rejected because useful principles would remain disconnected from daily decisions and would not produce an auditable readiness result.

## References

- https://github.com/coreyhaines31/marketingskills
- https://github.com/coreyhaines31/marketingskills/commit/7868cb9251fad80a73d26e488a5ad5f6c4a9f335
- https://github.com/coreyhaines31/marketingskills/blob/7868cb9251fad80a73d26e488a5ad5f6c4a9f335/LICENSE
