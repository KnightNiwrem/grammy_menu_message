<!--
Sync Impact Report
- Version: 1.0.0 → 2.0.0
- Modified principles:
	- III. User Experience Consistency → III. Plugin UX & API Consistency
	- IV. Performance Requirements → IV. Cross-Runtime Compatibility
- Added sections: None
- Removed sections: Docker/DB/Redis guidance and performance bench requirements
- Templates requiring updates:
	✅ .specify/templates/plan-template.md (footer version updated to v2.0.0)
	✅ .specify/templates/tasks-template.md (replace performance tests with compatibility checks)
	✅ README.md (updated with project specifics)
	✅ .github/copilot-instructions.md (still consistent; no changes needed)
- Follow-up TODOs: None
-->

# grammy_menu_message Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

- Code MUST compile and type-check with TypeScript strict mode. No implicit any.
- Code MUST pass `deno fmt` and `deno lint` with zero warnings. Style is
  non-negotiable.
- Module imports MUST use stable sources:
  - Deno std via `jsr:@std/*`.
  - Telegram bot libraries via `https://lib.deno.dev/x/grammy@v1/*` (no
    sessions).
  - For this plugin, maintain dual deps files: `deps.deno.ts` and
    `deps.node.ts`.
- Public functions and modules MUST be small and focused:
  - Max 200 SLoC per file (excl. tests), max 50 SLoC per function where
    practical.
  - Cyclomatic complexity SHOULD be ≤ 10; justify and document exceptions.
- Error handling MUST be explicit: throw typed Errors or return discriminated
  unions; never swallow errors.
- Secrets MUST NOT be committed. Configuration MUST come from environment
  variables with sane defaults for local dev.

Rationale: High-quality, consistent code reduces defects, eases review, and
speeds iteration.

### II. Testing Standards (Test-First)

- TDD for all new public behavior: write failing tests before implementation.
- Use `describe`/`it` from `jsr:@std/testing/bdd` and `expect` from
  `jsr:@std/expect`.
- Coverage targets: ≥ 85% lines overall, ≥ 90% for critical modules (menu
  rendering, command routing).
- Test taxonomy and structure:
  - `tests/unit/`: pure functions and utilities.
  - `tests/contract/`: bot command/menu contracts (input update → expected
    reply/buttons).
  - `tests/integration/`: multi-module flows and error paths.
- Bot contracts MUST assert both text and keyboard layout; prefer snapshots for
  stable messaging.
- CI MUST run tests on every PR across Deno and Node (deno2node build). In
  sandboxed CI, allow certificate flags as needed; never in production.

Rationale: Tests drive design, prevent regressions, and make behavior
unambiguous.

### III. Plugin UX & API Consistency

- Command and button naming (for bots using the plugin):
  - Title Case for menu titles; verbs for actions; max 20 chars per label.
  - Back navigation MUST exist and be the last row, leftmost: "← Back".
  - Avoid emoji except to disambiguate; ≤ 1 emoji per label when used.
- Layout (for keyboards the plugin produces):
  - Max 3 columns per row, max 6 buttons per screen; overflow via pagination or
    submenus.
  - Consistent confirmation/cancel patterns: "Save" / "Cancel".
- Messaging (for texts the plugin templates produce):
  - Use consistent tone and punctuation. No shouting case. Provide concise error
    messages with recovery steps.
- Accessibility & i18n readiness: avoid hard-coded language-specific formatting;
  isolate user strings.

Rationale: Consistency reduces user errors and cognitive load across the bot
surface.

### IV. Cross-Runtime Compatibility (Deno + Node via deno2node)

- Public API MUST be runtime-agnostic. Avoid Deno-only globals in the public
  surface.
- Provide dual dependency shims via `deps.deno.ts` and `deps.node.ts`.
- deno2node MUST produce a Node-compatible build targeting actively supported
  LTS versions.
- CI MUST build and run tests for both Deno and Node builds. Node tests run
  against the generated output.
- Document any runtime-specific caveats; keep them out of the default API path.

Rationale: The plugin is a library intended for both Deno and Node users;
compatibility is a primary goal.

## Additional Constraints & Technology Standards

- Deno-first project: use `jsr:@std/*` for std libs. Prefer URL imports pinned
  by major version where applicable.
- Telegram bot: use `grammy` via `lib.deno.dev` and related plugins; DO NOT use
  grammy sessions.
- Library packaging: maintain dual-runtime support with `deno2node`; keep
  dependency boundaries in `deps.deno.ts` and `deps.node.ts`.
- No Dockerization: This is a library plugin; containerization is out of scope.

## Quality Gates & Workflow

- Pre-commit: `deno fmt`, `deno lint`, type-check, and unit tests MUST pass
  locally.
- Pull Requests:
  - Include explicit Constitution Check notes (how principles I–IV are
    satisfied).
  - CI MUST run: format/lint, type-check, tests with coverage, and Deno/Node
    compatibility builds.
  - Any deviation requires a justification in the plan's "Complexity Tracking"
    table.
- Planning docs: follow `.specify/templates/*` and keep in sync with this
  constitution.

## Governance

- Authority: This constitution supersedes ad-hoc practices. Conflicts resolve in
  favor of this document.
- Amendments: via PR including a changelog, rationale, and
  migration/communication plan. On merge, update version and dates.
- Versioning Policy:
  - MAJOR: breaking governance changes or principle removals/redefinitions.
  - MINOR: new principles/sections or materially expanded guidance.
  - PATCH: clarifications/wording/typos without semantic change.
- Compliance Reviews: Reviewers MUST check adherence to Principles I–IV and
  Quality Gates. Non-compliant PRs are rejected.
- Runtime Guidance: For environment-specific details and tooling, consult
  `.github/copilot-instructions.md`.

**Version**: 2.0.0 | **Ratified**: 2025-10-06 | **Last Amended**: 2025-10-06
