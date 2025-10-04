
# Implementation Plan: Grammy Menu Message Plugin

**Branch**: `001-create-a-plugin` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-create-a-plugin/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
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
This plugin provides a menu management system for grammy Telegram bots with inline keyboards, supporting pagination and navigation history. The plugin automatically stores menu messages, handles callback queries, maintains per-user navigation state, and provides event hooks for menu interactions. Technical approach: Deno-first with Node compatibility via deno2node, UUID-based callback data mapping to bypass Telegram's 64-byte limit, configurable cleanup strategies, and comprehensive event system for lifecycle and navigation hooks.

## Technical Context
**Language/Version**: TypeScript on Deno (latest stable)  
**Primary Dependencies**: grammy (from lib.deno.dev), Deno standard library (jsr:@std/*)  
**Storage**: In-memory storage for menu state, navigation history, and callback mappings (no external database)  
**Testing**: Deno test framework with `jsr:@std/testing/bdd` (describe/it) and `jsr:@std/expect`  
**Target Platform**: Deno runtime (primary), Node.js (via deno2node build)  
**Project Type**: Single project - plugin library (dual-runtime support via deps.deno.ts and deps.node.ts)  
**Performance Goals**: Menu updates <500ms, 100+ concurrent interactions, respects Telegram 30 msg/sec rate limit  
**Constraints**: No external runtime dependencies beyond grammy + Deno std, ≥90% test coverage, strict TypeScript  
**Scale/Scope**: Plugin library consumed by bot developers; handles multiple bots/users/chats per instance  
**Build System**: deno2node for Node.js compatibility (converts Deno-style imports to Node-style)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality Verification
- [x] **Type Safety**: All public APIs have explicit TypeScript types (no implicit `any`)
- [x] **Self-Contained**: No external runtime dependencies beyond grammy core and Deno std
- [x] **Documentation Plan**: JSDoc comments planned for all exported functions/classes/types
- [x] **Examples**: Working examples identified for documentation

### Testing Standards
- [x] **TDD Approach**: Tests will be written first and fail before implementation
- [x] **Coverage Target**: Plan achieves ≥90% coverage for public APIs, 100% for critical paths
- [x] **Test Organization**: Using `describe`/`it` from `jsr:@std/testing/bdd`
- [x] **Test Independence**: Each test runnable in isolation

### API & User Experience
- [x] **Naming Conventions**: TypeScript conventions followed (camelCase/PascalCase)
- [x] **Error Handling**: All error cases identified and will be typed/documented
- [x] **Backward Compatibility**: Changes follow semantic versioning
- [x] **Examples First**: Common use cases documented with working examples

### Performance Considerations
- [x] **Benchmarking**: Performance-critical paths identified for benchmark tests
- [x] **Async Operations**: No blocking I/O operations planned
- [x] **Memory Efficiency**: Memory leak testing planned for long-running scenarios
- [x] **Rate Limiting**: Telegram API rate limits respected

### Quality Gates
- [x] **Formatting**: Will use `deno fmt` with default settings
- [x] **Linting**: Will pass `deno lint` with no warnings
- [x] **Function Size**: Functions ≤50 lines (exceptions justified)
- [x] **File Size**: Files ≤500 lines (split if exceeded)

### Import Standards
- [x] **grammy**: Using `lib.deno.dev` with semantic versioning
- [x] **Deno std**: Using `jsr:@std/*` prefix
- [x] **No npm**: No external npm dependencies (or justified if necessary)
- [x] **Explicit imports**: No `*` imports

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
├── mod.ts                    # Main entry point, exports public API
├── types.ts                  # Core type definitions and interfaces
├── menu.ts                   # Menu class and menu builder
├── storage/
│   ├── menu_store.ts         # Menu message storage
│   ├── navigation_store.ts   # Navigation history management
│   └── callback_store.ts     # UUID to callback data mapping
├── handlers/
│   ├── callback_handler.ts   # Callback query processing
│   └── navigation_handler.ts # Navigation logic (back, pagination)
├── events/
│   └── event_emitter.ts      # Event system for hooks
├── pagination/
│   └── paginator.ts          # Pagination utility
└── utils/
    ├── uuid.ts               # UUID generation for callbacks
    └── cleanup.ts            # Cleanup/timeout management

tests/
├── unit/
│   ├── menu.test.ts
│   ├── storage/
│   ├── handlers/
│   ├── events/
│   ├── pagination/
│   └── utils/
└── integration/
    ├── menu_lifecycle.test.ts
    ├── pagination.test.ts
    ├── navigation.test.ts
    └── cleanup.test.ts

examples/
├── basic_menu.ts             # Simple menu example
├── paginated_menu.ts         # Pagination example
└── nested_navigation.ts      # Navigation history example

deps.deno.ts                  # Deno-style imports
deps.node.ts                  # Node-style imports (for deno2node)
deno.json                     # Deno configuration
```

**Structure Decision**: Single project structure chosen as this is a plugin library with no frontend/backend split. The dual-runtime support is achieved through separate dependency files (deps.deno.ts and deps.node.ts) with deno2node handling the build transformation for Node.js compatibility.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:

The `/tasks` command will generate tasks based on the TDD (Test-Driven Development) workflow mandated by the constitution. Tasks will be organized into the following categories:

1. **Foundation Tasks** (P = Parallel):
   - [P] Create project structure and configuration files (deno.json, deps.deno.ts, deps.node.ts)
   - [P] Set up TypeScript types in src/types.ts (all core interfaces)
   - [P] Create test infrastructure (test helpers, mocks for grammy Bot)

2. **Core Storage Layer** (Test First):
   - Write failing tests for MenuStore (menu_store.test.ts)
   - Implement MenuStore to pass tests
   - Write failing tests for NavigationStore (navigation_store.test.ts)
   - Implement NavigationStore to pass tests
   - Write failing tests for CallbackStore (callback_store.test.ts)
   - Implement CallbackStore to pass tests

3. **Utility Layer** (Test First):
   - Write failing tests for UUID generation (uuid.test.ts)
   - Implement UUID utility to pass tests
   - Write failing tests for cleanup logic (cleanup.test.ts)
   - Implement cleanup utility to pass tests

4. **Event System** (Test First):
   - Write failing tests for EventEmitter (event_emitter.test.ts)
   - Implement EventEmitter to pass tests

5. **Pagination System** (Test First):
   - Write failing tests for Paginator (paginator.test.ts)
   - Implement Paginator to pass tests
   - Write failing tests for createPaginatedMenu helper
   - Implement helper to pass tests

6. **Menu Core** (Test First):
   - Write failing tests for Menu class (menu.test.ts)
   - Implement Menu class to pass tests
   - Write failing tests for menu rendering logic
   - Implement rendering logic to pass tests

7. **Handlers** (Test First):
   - Write failing tests for CallbackHandler (callback_handler.test.ts)
   - Implement CallbackHandler to pass tests
   - Write failing tests for NavigationHandler (navigation_handler.test.ts)
   - Implement NavigationHandler to pass tests

8. **MenuManager** (Test First - Critical Path):
   - Write failing contract tests for MenuManager (from contracts/menu_manager.md)
   - Implement MenuManager.send() to pass tests
   - Write failing tests for MenuManager.update()
   - Implement update() to pass tests
   - Write failing tests for MenuManager.navigate()
   - Implement navigate() to pass tests
   - Write failing tests for MenuManager.back()
   - Implement back() to pass tests
   - Write failing tests for MenuManager.changePage()
   - Implement changePage() to pass tests
   - Write failing tests for MenuManager.cleanup()
   - Implement cleanup() to pass tests

9. **Integration Tests**:
   - Write menu lifecycle integration test (send → update → delete)
   - Write pagination integration test (all navigation buttons)
   - Write navigation history integration test (nested menus → back)
   - Write cleanup integration test (timeout + manual)
   - Write event system integration test (all events fired correctly)

10. **Examples and Documentation**:
    - [P] Create basic_menu.ts example
    - [P] Create paginated_menu.ts example
    - [P] Create nested_navigation.ts example
    - [P] Write README.md with API documentation
    - [P] Add JSDoc comments to all public exports

11. **Build and Distribution**:
    - Configure deno2node build process
    - Test Node.js compatibility
    - Create package.json for npm distribution
    - Add GitHub Actions CI workflow

**Ordering Strategy**:
- **Dependencies First**: Types → Storage → Utilities → Handlers → MenuManager
- **TDD Order**: Test file → Implementation file (always in pairs)
- **Parallelizable**: Mark with [P] for independent modules (types, tests, examples)
- **Critical Path**: MenuManager and integration tests require all dependencies complete

**Estimated Task Count**: 45-50 tasks
- Foundation: 3 tasks
- Storage layer: 6 tasks (3 test + 3 impl)
- Utilities: 4 tasks (2 test + 2 impl)
- Event system: 2 tasks (1 test + 1 impl)
- Pagination: 4 tasks (2 test + 2 impl)
- Menu core: 4 tasks (2 test + 2 impl)
- Handlers: 4 tasks (2 test + 2 impl)
- MenuManager: 12 tasks (6 test + 6 impl)
- Integration: 5 tasks (all tests)
- Examples/docs: 5 tasks (parallel)
- Build: 4 tasks

**Task Dependencies**:
```
Foundation [P]
  ↓
Storage Layer (sequential within, parallel across)
  ↓
Utilities [P with Storage]
  ↓
Event System
  ↓
Pagination [P with Event]
  ↓
Menu Core (depends on Event, Storage)
  ↓
Handlers (depends on Storage, Event)
  ↓
MenuManager (depends on all above)
  ↓
Integration Tests (depends on MenuManager)
  ↓
Examples/Docs [P]
  ↓
Build (depends on all code complete)
```

**Quality Gates Per Task**:
- Each implementation task must:
  - Have passing tests (≥90% coverage)
  - Pass `deno lint` and `deno fmt --check`
  - Pass `deno check` (type checking)
  - Have JSDoc comments on public APIs
  - Follow constitutional principles

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
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
