<!--
Sync Impact Report
Version change: N/A → 1.0.0
Modified principles:
- Added: Code Quality Without Compromise
- Added: Tests Define Behavior
- Added: Consistent Bot Interaction Experience
- Added: Performance-Centered Delivery
Added sections:
- Implementation Standards
- Workflow & Quality Gates
Removed sections:
- Placeholder Principle 5
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# Grammy Menu Message Constitution

## Core Principles

### Code Quality Without Compromise
- Public APIs MUST remain lean, typed, and documented with runnable menu examples.
- All contributions MUST pass `deno fmt` + `deno lint`, include explicit exports, and remove dead or unused code paths before review.
- Breaking refactors MUST ship with migration notes and semantic version bumps coordinated with release notes.

**Rationale**: This library is consumed by other bots; impeccable code hygiene keeps downstream integrations stable and trustable.

### Tests Define Behavior
- Behavior changes MUST begin with failing tests using `jsr:@std/testing/bdd` or `jsr:@std/expect` before implementation.
- Each menu flow MUST have unit coverage and at least one integration scenario simulating Telegram updates.
- Merge requests MUST include automated regression checks and maintain ≥90% statement coverage for touched files.

**Rationale**: Menu regressions are user-facing; codified tests are the only acceptable definition of correctness.

### Consistent Bot Interaction Experience
- Menu copy, callback IDs, and navigation patterns MUST align with documented UX guidelines and stay language-agnostic.
- All interactions MUST provide accessible fallbacks (e.g., text alternatives) when Telegram features degrade.
- Breaking UX changes MUST be reviewed with maintainers and accompanied by updated documentation and examples.

**Rationale**: Plugins extend many bots; consistent interactions prevent confusing users and limit support burden.

### Performance-Centered Delivery
- Handlers MUST respond within 50ms p95 when processing 500 sequential updates on an Apple M1-class core with Deno stable.
- No contribution may block the event loop; long-running tasks MUST be asynchronous and decorated with cancellation hooks.
- Performance budgets and measurement steps MUST be documented alongside new features or optimizations.

**Rationale**: Menu latency compounds across bot workflows; disciplined performance ensures this plugin never becomes the bottleneck.

## Implementation Standards
- The library MUST target Deno first, using `jsr:` for standard modules and `https://lib.deno.dev/x/grammy@v1` imports for Telegram bot utilities.
- Contributors MUST avoid introducing Docker dependencies or container-specific requirements; local development relies on native Deno tooling.
- Code MUST expose clear TypeScript types, avoid implicit any usage, and document expected context (bot instance, session data) for each helper.
- Examples and README snippets MUST compile via `deno check` and reflect the current public API.

## Workflow & Quality Gates
- Specs, plans, and tasks MUST explicitly show how each principle is satisfied before work proceeds.
- Every PR MUST attach test results (unit + integration) and, when applicable, a performance sample referencing the documented budget.
- UX-impacting changes MUST include a changelog entry, screenshots or transcripts of menu flows, and reviewer confirmation of consistency.
- Releases MUST run `deno fmt`, `deno lint`, and `deno task test --coverage` prior to tagging.

## Governance
- This constitution supersedes conflicting documents; exceptions require a documented rationale and maintainer approval.
- Amendments require consensus from at least two maintainers, a version bump recorded here, and synchronized template updates.
- Versioning follows semantic rules: MAJOR for breaking governance shifts, MINOR for new principles/sections, PATCH for clarifications.
- Compliance reviews occur at project kickoff, before release candidates, and during postmortems; non-compliance blocks release until resolved.

**Version**: 1.0.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2025-10-04