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
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize Deno project with grammy dependencies from lib.deno.dev
- [ ] T003 [P] Configure deno.json with tasks and import maps
- [ ] T004 [P] Set up testing framework (jsr:@std/testing/bdd)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Unit tests for [core functionality] in tests/[module]_test.ts using describe/it
- [ ] T006 [P] Type tests for public API in tests/types_test.ts
- [ ] T007 [P] Integration tests for [user scenario] in tests/integration/[scenario]_test.ts
- [ ] T008 [P] Performance benchmark for [critical path] in benchmarks/[feature]_bench.ts

**Test Requirements**:
- Use `describe` and `it` from `jsr:@std/testing/bdd`
- Tests MUST fail initially (Red phase)
- Each test independent and runnable in isolation
- Target ≥90% coverage for public APIs, 100% for critical paths

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 [P] Implement [core module] in src/[module].ts with full TypeScript types
- [ ] T010 [P] Add JSDoc comments to all exported functions/classes/types
- [ ] T011 [P] Implement error handling with typed errors
- [ ] T012 Verify all tests pass (Green phase)
- [ ] T013 Run type checking: `deno check src/`

## Phase 3.4: Refactoring & Quality
- [ ] T014 Refactor for code quality (Refactor phase, tests still passing)
- [ ] T015 Ensure functions ≤50 lines, files ≤500 lines
- [ ] T016 Remove duplication and improve modularity
- [ ] T017 Run `deno fmt` and `deno lint` with no warnings
- [ ] T018 Verify test coverage meets ≥90% threshold

## Phase 3.5: Documentation & Examples
- [ ] T019 [P] Create usage examples in examples/[feature].ts
- [ ] T020 [P] Update README.md with API documentation
- [ ] T021 [P] Add examples to JSDoc comments
- [ ] T022 Verify examples run successfully
- [ ] T023 Update CHANGELOG.md following semantic versioning

## Phase 3.6: Final Quality Gates
- [ ] T024 Run full test suite: `deno test --unsafely-ignore-certificate-errors`
- [ ] T025 Verify test coverage report: `deno test --coverage`
- [ ] T026 Run linting: `deno lint`
- [ ] T027 Verify formatting: `deno fmt --check`
- [ ] T028 Type check: `deno check src/`
- [ ] T029 Run benchmarks and verify no performance regressions
- [ ] T030 Memory leak testing for long-running scenarios

## Dependencies
- Setup (T001-T004) before all other phases
- Tests (T005-T008) before implementation (T009-T013)
- Implementation before refactoring (T014-T018)
- Refactoring before documentation (T019-T023)
- Everything before final quality gates (T024-T030)

## Parallel Example
```
# Launch T005-T008 together (different test files):
Task: "Unit tests for menu rendering in tests/menu_test.ts using describe/it"
Task: "Type tests for public API in tests/types_test.ts"
Task: "Integration tests for user interaction in tests/integration/interaction_test.ts"
Task: "Performance benchmark for message updates in benchmarks/update_bench.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (Red-Green-Refactor)
- Commit after each phase
- Use `lib.deno.dev` for grammy imports (e.g., `@v1`)
- Use `jsr:@std/*` for Deno standard libraries
- NO npm dependencies without justification

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task