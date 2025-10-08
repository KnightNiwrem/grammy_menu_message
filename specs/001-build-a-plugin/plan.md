
# Implementation Plan: Menu Message Plugin for Telegram Bots

**Branch**: `001-build-a-plugin` | **Date**: 2025-10-08 | **Spec**: [/specs/001-build-a-plugin/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-a-plugin/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Deliver a grammy plugin that lets Telegram bot developers register reusable menu templates, generate concrete menu messages (text + inline keyboard), and orchestrate navigation with configurable history depth/TTL and per-key isolation. Implementation hinges on a central `MenuTemplateManager`, a `MenuHistoryRepository` wrapper around grammy storage adapters, opaque UUID callback bindings, and a transformer middleware that intercepts outgoing API payloads to apply menu content.

## Technical Context
**Language/Version**: TypeScript (Deno 1.46+, Node 18+ via deno2node)  
**Primary Dependencies**: grammy@v1 (https://lib.deno.dev), jsr:@std/testing/bdd, jsr:@std/expect  
**Storage**: Developer-provided grammy `StorageAdapter` wrapped by `MenuHistoryRepository` for serializable per-key operations  
**Testing**: `describe`/`it` from jsr:@std/testing/bdd with jsr:@std/expect; deno test + deno2node output validation  
**Target Platform**: Deno runtime (authoring/testing) + Node runtime via deno2node bundle  
**Project Type**: Single library (core under `src/` with mirrored `tests/` hierarchy)  
**Performance Goals**: Keep menu action handling under ~200ms p95 to maintain responsive Telegram UX (assumed, revisit after benchmarks)  
**Constraints**: Enforce strict history isolation, align UUID payload lifetimes with history TTL, adhere to Constitution Principles I–IV  
**Scale/Scope**: Support thousands of concurrent segmentation keys with depth≤200 stacks and optional TTL expiry policies

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I – Code Quality**: Plan enforces strict TypeScript surfaces, module size ceilings, typed errors, and mandates `deno fmt`/`deno lint`/type-checking in quickstart instructions.
- **Principle II – Testing Standards**: Contract tests authored first (currently failing intentionally) with BDD utilities; future integration/unit suites mapped to acceptance scenarios with coverage ≥85% target.
- **Principle III – Plugin UX & API Consistency**: Data model encodes keyboard layout limits, Back placement guidance, and lifecycle hooks for observability aligning with constitution guidance.
- **Principle IV – Cross-Runtime Compatibility**: Dual dependency shims (`deps.deno.ts`, `deps.node.ts`) and deno2node validation listed; repository design avoids Deno-only APIs across public surface.
- **Gate Verdict**: PASS — no constitutional violations identified; no complexity deviations required.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── deps.deno.ts
├── deps.node.ts
├── menu/
│   ├── manager.ts
│   ├── template.ts
│   ├── lifecycle.ts
│   └── transformer.ts
├── history/
│   ├── repository.ts
│   ├── serializers.ts
│   └── locks.ts
├── actions/
│   ├── payload.ts
│   └── router.ts
├── pagination/
│   ├── strategies.ts
│   └── utils.ts
└── telemetry/
      └── hooks.ts

tests/
├── contract/
│   └── menu_manager_contract.test.ts
├── integration/
│   └── menu_navigation.test.ts        # to be authored in Phase 2
└── unit/
      ├── history_repository.test.ts     # to be authored in Phase 2
      └── transformer.test.ts            # to be authored in Phase 2

types/
└── jsr.d.ts
```

**Structure Decision**: Adopt single-library layout rooted in `src/` with domain-driven subfolders (menu orchestration, history persistence, callback routing, pagination helpers, telemetry hooks) and mirrored `tests/` hierarchy; `types/` houses ambient declarations for tooling compatibility during planning.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - How to guarantee serialized history mutations per segmentation key across adapter implementations.
   - How to align callback UUID payload lifetime with history TTL/depth pruning.
   - Where to intercept outgoing API payloads to override message text/keyboard deterministically.

2. **Generate and dispatch research agents**:
   ```
   Task: "Research repository patterns for serializable operations on grammy StorageAdapters."
   Task: "Identify best practices for grammy transformers handling reply_markup interception."
   Task: "Evaluate UUID-backed callback payload storage with Telegram bots and cleanup policies."
   ```

3. **Consolidate findings** in `research.md` using format:
   - Documented `MenuTemplateManager` as the orchestrator, repository façade around adapters, and UUID storage decisions.
   - Captured rationale (consistency, serialization, compliance with FR-004/FR-010/FR-025) and alternatives rejected.

**Output**: `research.md` populated with decisions, rationales, and alternatives (✅ Complete)

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md` (✅ Complete)
   - Modeled `MenuTemplate`, `MenuHistoryEntry`, `MenuHistoryStack`, `MenuActionPayload`, pagination state, manager config, and lifecycle hooks with constraints mapping to FR-001 – FR-027 and Constitution Principle III.

2. **Generate API contracts** from functional requirements (✅ Complete)
   - Authored `contracts/menu-manager.contract.ts` defining manager APIs, request/response envelopes, lifecycle hooks, callback payload schema, and Telegram callback context placeholders.

3. **Generate contract tests** from contracts (✅ Complete — intentionally failing)
   - Added `tests/contract/menu_manager_contract.test.ts` with BDD cases for duplicate registration rejection, menu generation persistence, key isolation, TTL-aware back navigation, and idempotent duplicate taps (`fail()` placeholders ensure red tests until implementation).

4. **Extract test scenarios** from user stories (✅ Documented)
   - Acceptance Scenarios 1–10 mapped to future integration tests; quickstart demonstrates Scenario 1 wiring. Integration template will live at `tests/integration/menu_navigation.test.ts`.

5. **Update agent file incrementally** (✅ Complete)
   - Executed `.specify/scripts/bash/update-agent-context.sh copilot` to record language, dependencies, storage, and structure updates.

**Output**: `data-model.md`, `/contracts/menu-manager.contract.ts`, `tests/contract/menu_manager_contract.test.ts` (failing), `quickstart.md`, updated `.github/copilot-instructions.md` context.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as baseline.
- Derive tasks from Phase 1 artifacts: each contract test → implementation tasks, each entity in `data-model.md` → module + unit-test pair, quickstart steps → smoke validation tasks.
- Map Acceptance Scenarios 1–10 to integration test cases (navigation, pagination, TTL expiry, error handling) plus lifecycle hook verification.

**Ordering Strategy**:
- Enforce TDD: enable/red tests (contract → unit → integration) before shipping production code.
- Dependency layering: storage repository & locks → manager/core → transformer → pagination utilities → lifecycle hooks & telemetry.
- Mark [P] for independent utilities (e.g., pagination helpers) to parallelize implementation after shared primitives land.

**Estimated Output**: ~28 ordered tasks populating `tasks.md`, grouped by test-first sequencing with labeled [P] items for parallelizable work.

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ | — | — |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.0.0 - See `.specify/memory/constitution.md`*
