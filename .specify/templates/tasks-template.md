# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: Deno project plumbing, linting, formatting
   → Tests: unit + integration coverings per constitution
   → Core: plugin modules, helpers, type exports
   → Experience: documentation, UX transcripts, examples
   → Performance: benchmarks, profiling, regression monitors
   → Polish: cleanup, release notes
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD) and include performance probes early
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → Tests exist for every contract + UX flow?
   → Performance budgets instrumented?
   → Docs/examples refreshed?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Plugin library (default)**: `src/`, `tests/`, `examples/` at repository root
- Use `.ts`/`.mts` modules compatible with Deno; configure `deno.json` for tasks (`fmt`, `lint`, `test`)
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Define project structure per implementation plan (src/, tests/, examples/)
- [ ] T002 Configure `deno.json` tasks for fmt, lint, test, coverage, and benchmark commands
- [ ] T003 [P] Add baseline README usage example referencing current feature

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Unit specs for new menu helpers in `tests/unit/[feature]_menu_test.ts`
- [ ] T005 [P] Integration scenario simulating Telegram updates in `tests/integration/[feature]_flow_test.ts`
- [ ] T006 [P] Snapshot/regression test for menu rendering in `tests/regression/[feature]_menu_snapshot.ts`
- [ ] T007 Performance harness stub measuring handler latency in `tests/perf/[feature]_handler_bench.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 [P] Implement menu helpers in `src/[feature]/mod.ts` with typed exports
- [ ] T009 Wire helper into plugin entry point `src/mod.ts` and update re-exports
- [ ] T010 Add configuration guards + input validation for menu options
- [ ] T011 Implement logging & error-handling utilities aligned with grammy context
- [ ] T012 Update `examples/[feature].ts` to demonstrate the new flow

## Phase 3.4: Experience & Performance
- [ ] T013 Validate localization + copy in `docs/ux-guidelines.md` (or update plan-specified file)
- [ ] T014 Capture menu interaction transcript or screenshots for reviewers
- [ ] T015 Run latency benchmarks (`deno bench` or custom harness) and document results vs 50ms p95 budget
- [ ] T016 Add instrumentation or tracing hooks if budget risk detected

## Phase 3.5: Polish
- [ ] T017 [P] Add regression unit tests for edge cases discovered during review
- [ ] T018 Update changelog/release notes with migration + UX callouts
- [ ] T019 [P] Run `deno fmt`, `deno lint`, `deno task test --coverage` and attach artifacts
- [ ] T020 Clean up duplication and ensure tree-shakeable exports
- [ ] T021 Final UX walkthrough confirming menu consistency post-implementation

## Dependencies
- Tests/benchmarks (T004-T007) before implementation (T008-T012)
- T008 blocks T009 and T010
- T015 depends on passing performance harness from T007
- Implementation before polish (T017-T021)

## Parallel Example
```
# Launch T004-T007 together:
Task: "Unit specs for new menu helpers in tests/unit/[feature]_menu_test.ts"
Task: "Integration scenario simulating Telegram updates in tests/integration/[feature]_flow_test.ts"
Task: "Snapshot/regression test for menu rendering in tests/regression/[feature]_menu_snapshot.ts"
Task: "Performance harness stub measuring handler latency in tests/perf/[feature]_handler_bench.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task with coverage + benchmark artifacts attached
- Avoid: vague tasks, same file conflicts, skipping performance validation

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model/service creation task [P]
   - Relationships → helper wiring tasks

3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → UX transcript + validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts & UX flows have corresponding tests/benchmarks
- [ ] All entities have model/service tasks
- [ ] Tests and performance probes come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Constitution principles (code quality, tests, UX, performance) traced to explicit tasks