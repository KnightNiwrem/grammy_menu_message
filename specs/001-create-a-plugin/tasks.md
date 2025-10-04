# Tasks: Grammy Menu Message Plugin

**Input**: Design documents from `/specs/001-create-a-plugin/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Status
```
✅ 1. Loaded plan.md - Tech stack: TypeScript/Deno, grammy, in-memory storage
✅ 2. Loaded design documents:
     - data-model.md: 6 entities, 3 stores
     - contracts/: MenuManager, Paginator
     - research.md: 8 technical decisions
     - quickstart.md: 3 usage scenarios
✅ 3. Generated 50 tasks across 6 phases
✅ 4. Applied TDD ordering (tests before implementation)
✅ 5. Numbered sequentially (T001-T050)
✅ 6. Dependency graph created
✅ 7. Parallel execution examples generated
✅ 8. Validation complete - all contracts covered
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- All file paths are absolute from repository root

---

## Phase 3.1: Setup & Foundation

### T001: Create Project Structure
**Description**: Create directory structure as defined in plan.md  
**Files to create**:
```
src/
├── mod.ts (stub)
├── types.ts (stub)
├── menu.ts (stub)
├── storage/ (dir)
├── handlers/ (dir)
├── events/ (dir)
├── pagination/ (dir)
└── utils/ (dir)

tests/
├── unit/ (dir)
└── integration/ (dir)

examples/ (dir)
```
**Dependencies**: None  
**Validation**: All directories exist

---

### T002: Initialize Deno Configuration
**Description**: Create deno.json with tasks, import maps, and TypeScript config  
**File**: `deno.json`  
**Content**:
```json
{
  "tasks": {
    "test": "deno test --unsafely-ignore-certificate-errors",
    "test:coverage": "deno test --unsafely-ignore-certificate-errors --coverage",
    "lint": "deno lint",
    "fmt": "deno fmt",
    "check": "deno check src/**/*.ts"
  },
  "fmt": {
    "useTabs": false,
    "lineWidth": 100,
    "indentWidth": 2
  },
  "lint": {
    "rules": {
      "tags": ["recommended"]
    }
  },
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```
**Dependencies**: None  
**Validation**: `deno task test` runs

---

### T003 [P]: Create Dependency Files
**Description**: Create deps.deno.ts and deps.node.ts for dual-runtime support  
**Files**:
- `deps.deno.ts`: Import grammy from lib.deno.dev, Deno std from jsr:@std/*
- `deps.node.ts`: Import grammy from npm (for deno2node)

**deps.deno.ts content**:
```typescript
// grammy
export { Bot, Context } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
export type { 
  InlineKeyboardButton, 
  InlineKeyboardMarkup 
} from "https://lib.deno.dev/x/grammy@v1/types.ts";

// Deno std
export { assertEquals, assertExists } from "jsr:@std/assert";
export { describe, it, beforeEach, afterEach } from "jsr:@std/testing/bdd";
```

**deps.node.ts content**:
```typescript
// grammy (npm)
export { Bot, Context } from "grammy";
export type { InlineKeyboardButton, InlineKeyboardMarkup } from "grammy";
```
**Dependencies**: None  
**Validation**: Files import without errors

---

### T004 [P]: Create Core Types
**Description**: Implement all TypeScript types and interfaces from data-model.md  
**File**: `src/types.ts`  
**Content**: Export all interfaces:
- MenuDefinition
- KeyboardDefinition, ButtonRow, InlineButton, ButtonAction
- MenuRuntimeState
- NavigationHistory, MenuHistoryEntry
- CallbackDataMapping, CallbackData
- MenuContext
- MenuError classes (MenuNotFoundError, NavigationError, InvalidPageError)
- MenuEvent types (MenuEventType, MenuEventData)
- Configuration options (MenuManagerOptions, PaginatorOptions, NavigationConfig, CleanupOptions)

**Dependencies**: None  
**Validation**: `deno check src/types.ts` passes, no implicit any

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL**: All tests in this phase MUST be written and MUST FAIL before ANY implementation in Phase 3.3

### Storage Layer Tests

### T005 [P]: Unit Tests for MenuStore
**Description**: Write failing tests for MenuStore operations  
**File**: `tests/unit/storage/menu_store.test.ts`  
**Test cases**:
- set(): Store menu state, enforce per-chat limit via LRU
- get(): Retrieve menu state by chatId and messageId
- delete(): Remove menu state
- getByChat(): Get all menus for a chat
- cleanup(): Remove stale menus based on predicate

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "MenuStore is not defined"

---

### T006 [P]: Unit Tests for NavigationStore
**Description**: Write failing tests for NavigationStore operations  
**File**: `tests/unit/storage/navigation_store.test.ts`  
**Test cases**:
- getOrCreate(): Get or initialize navigation history
- push(): Add entry to stack, enforce max depth
- pop(): Remove and return last entry
- clear(): Empty history
- cleanup(): Remove stale histories

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "NavigationStore is not defined"

---

### T007 [P]: Unit Tests for CallbackStore
**Description**: Write failing tests for CallbackStore operations  
**File**: `tests/unit/storage/callback_store.test.ts`  
**Test cases**:
- create(): Generate UUID, store mapping
- resolve(): Get callback data by UUID
- delete(): Remove mapping
- deleteByMessage(): Remove all mappings for a menu
- cleanup(): Remove old unused mappings

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "CallbackStore is not defined"

---

### Utility Tests

### T008 [P]: Unit Tests for UUID Generation
**Description**: Write failing tests for UUID utility  
**File**: `tests/unit/utils/uuid.test.ts`  
**Test cases**:
- generateUUID(): Returns valid UUID v4 format
- UUID uniqueness: Generate 10000 UUIDs, no duplicates
- UUID length: Always 36 characters

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "generateUUID is not defined"

---

### T009 [P]: Unit Tests for Cleanup Utility
**Description**: Write failing tests for cleanup logic  
**File**: `tests/unit/utils/cleanup.test.ts`  
**Test cases**:
- isStale(): Correctly identifies stale state based on timeout
- shouldEvict(): LRU eviction logic
- cleanupTimeout: Configurable timeout values

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "cleanup utilities not defined"

---

### Event System Tests

### T010 [P]: Unit Tests for EventEmitter
**Description**: Write failing tests for EventEmitter  
**File**: `tests/unit/events/event_emitter.test.ts`  
**Test cases**:
- on(): Register event handler
- off(): Remove event handler
- emit(): Call all registered handlers with data
- Multiple handlers: Support multiple listeners per event
- Async handlers: Support async event handlers
- Type safety: Typed event data

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "EventEmitter is not defined"

---

### Pagination Tests

### T011 [P]: Unit Tests for Paginator
**Description**: Write failing contract tests for Paginator per contracts/paginator.md  
**File**: `tests/unit/pagination/paginator.test.ts`  
**Test cases**:
- getTotalPages(): Correct page count calculation
- getPage(): Returns correct items for page
- renderPage(): Renders page content correctly
- generateKeyboard(): Creates nav buttons with correct logic
- reset(): Updates items and recalculates pages
- setPageSize(): Changes page size, recalculates
- Edge cases: Empty items, single item, out of bounds

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "Paginator is not defined"

---

### T012 [P]: Unit Tests for createPaginatedMenu Helper
**Description**: Write failing tests for paginated menu factory  
**File**: `tests/unit/pagination/paginated_menu.test.ts`  
**Test cases**:
- Creates MenuDefinition with pagination enabled
- Includes header/footer buttons if provided
- Configures parse mode correctly

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "createPaginatedMenu is not defined"

---

### Menu Core Tests

### T013 [P]: Unit Tests for Menu Class
**Description**: Write failing tests for Menu class  
**File**: `tests/unit/menu.test.ts`  
**Test cases**:
- Menu construction: Creates menu from definition
- Content resolution: Handles static string and function
- Keyboard generation: Converts keyboard definition to Telegram format
- Dynamic content: Passes MenuContext to content function
- Metadata: Stores and retrieves custom metadata

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "Menu is not defined"

---

### Handler Tests

### T014 [P]: Unit Tests for CallbackHandler
**Description**: Write failing tests for callback query processing  
**File**: `tests/unit/handlers/callback_handler.test.ts`  
**Test cases**:
- resolveCallback(): Resolves UUID to callback data
- handleCallback(): Processes callback and triggers action
- answerCallbackQuery(): Responds to Telegram callback
- Invalid UUID: Handles unknown UUIDs gracefully

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "CallbackHandler is not defined"

---

### T015 [P]: Unit Tests for NavigationHandler
**Description**: Write failing tests for navigation logic  
**File**: `tests/unit/handlers/navigation_handler.test.ts`  
**Test cases**:
- handleNavigate(): Pushes current to history, navigates to target
- handleBack(): Pops from history, navigates to previous
- handlePageChange(): Updates current page, re-renders
- Invalid page reset: Resets to page 1 when page becomes invalid
- History depth limit: Enforces max depth (200 default)

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "NavigationHandler is not defined"

---

### MenuManager Tests (Critical Path)

### T016 [P]: Contract Tests for MenuManager.send()
**Description**: Write failing contract tests for send() per contracts/menu_manager.md  
**File**: `tests/unit/menu_manager_send.test.ts`  
**Test cases**:
- Sends menu message to Telegram
- Stores MenuRuntimeState
- Returns correct state
- Emits 'menuSend' event
- Handles content resolution errors
- Handles Telegram API errors

**Dependencies**: T004 (types)  
**Validation**: Tests fail with "MenuManager is not defined"

---

### T017 [P]: Contract Tests for MenuManager.update()
**Description**: Write failing contract tests for update()  
**File**: `tests/unit/menu_manager_update.test.ts`  
**Test cases**:
- Updates existing menu message
- Updates MenuRuntimeState
- Emits 'menuUpdate' event
- Throws MenuNotFoundError if state not found

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T018 [P]: Contract Tests for MenuManager.delete()
**Description**: Write failing contract tests for delete()  
**File**: `tests/unit/menu_manager_delete.test.ts`  
**Test cases**:
- Deletes menu message from Telegram
- Removes state from MenuStore
- Removes callbacks from CallbackStore
- Removes history references from NavigationStore
- Emits 'menuDelete' event

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T019 [P]: Contract Tests for MenuManager.navigate()
**Description**: Write failing contract tests for navigate()  
**File**: `tests/unit/menu_manager_navigate.test.ts`  
**Test cases**:
- Pushes current menu to history
- Sends target menu
- Returns new state
- Emits 'navigate' event
- Throws MenuNotFoundError if menu not found

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T020 [P]: Contract Tests for MenuManager.back()
**Description**: Write failing contract tests for back()  
**File**: `tests/unit/menu_manager_back.test.ts`  
**Test cases**:
- Pops from navigation history
- Restores previous menu
- Returns previous state or null
- Emits 'back' event
- Handles empty history gracefully

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T021 [P]: Contract Tests for MenuManager.changePage()
**Description**: Write failing contract tests for changePage()  
**File**: `tests/unit/menu_manager_changepage.test.ts`  
**Test cases**:
- Updates current page
- Re-renders menu with new page
- Updates MenuRuntimeState
- Emits 'pageChange' event
- Throws InvalidPageError for out of bounds
- Resets to page 1 when items change

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T022 [P]: Contract Tests for MenuManager.cleanup()
**Description**: Write failing contract tests for cleanup()  
**File**: `tests/unit/menu_manager_cleanup.test.ts`  
**Test cases**:
- Removes stale menus based on maxAge
- Removes menus for specific chatId
- Uses custom predicate for cleanup
- Returns count of cleaned menus
- Emits 'menuDelete' for each cleaned menu

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T023 [P]: Contract Tests for MenuManager Event System
**Description**: Write failing tests for event handling  
**File**: `tests/unit/menu_manager_events.test.ts`  
**Test cases**:
- on(): Registers typed event handlers
- off(): Removes event handlers
- Multiple handlers: Supports multiple listeners
- Async handlers: Handles async event handlers
- Event data types: Correct data passed to handlers

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### Integration Tests

### T024 [P]: Integration Test - Menu Lifecycle
**Description**: End-to-end test of menu send → update → delete flow  
**File**: `tests/integration/menu_lifecycle.test.ts`  
**Scenario**: From quickstart.md
- Create MenuManager with mock Bot
- Send main menu
- Update menu content
- Delete menu
- Verify all storage cleaned up

**Dependencies**: T004 (types)  
**Validation**: Tests fail (no implementation yet)

---

### T025 [P]: Integration Test - Pagination
**Description**: End-to-end test of paginated menu navigation  
**File**: `tests/integration/pagination.test.ts`  
**Scenario**: From quickstart.md
- Create Paginator with 25 items, page size 5
- Send paginated menu
- Click "Next" → verify page 2
- Click "Next" → verify page 3
- Click "Previous" → verify page 2
- Click "First" → verify page 1
- Click "Last" → verify page 5

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T026 [P]: Integration Test - Navigation History
**Description**: End-to-end test of nested menu navigation with back  
**File**: `tests/integration/navigation.test.ts`  
**Scenario**: From quickstart.md
- Send main menu
- Navigate to submenu 1 → history has 1 entry
- Navigate to submenu 2 → history has 2 entries
- Navigate to submenu 3 → history has 3 entries
- Back → submenu 2, history has 2 entries
- Back → submenu 1, history has 1 entry
- Back → main menu, history empty

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T027 [P]: Integration Test - Cleanup
**Description**: End-to-end test of cleanup strategies  
**File**: `tests/integration/cleanup.test.ts`  
**Test cases**:
- Automatic timeout cleanup after 30 minutes
- Manual cleanup via cleanup() method
- Per-chat menu limit (LRU eviction)
- History depth limit (200 levels)
- Callback cleanup when menu deleted

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T028 [P]: Integration Test - Dynamic Content & Items Change
**Description**: Test pagination reset when underlying items change  
**File**: `tests/integration/dynamic_content.test.ts`  
**Test cases**:
- User on page 3 of 5
- Items reduce to only 2 pages
- User clicks "Next"
- Menu resets to page 1 (per clarification)

**Dependencies**: T004 (types)  
**Validation**: Tests fail

---

### T029: Verify All Tests Fail
**Description**: Run entire test suite and confirm all tests fail (Red phase)  
**Command**: `deno test --unsafely-ignore-certificate-errors`  
**Expected**: All 80+ tests fail with "not implemented" or "not defined" errors  
**Dependencies**: T005-T028  
**Validation**: Test suite runs, all fail

---

## Phase 3.3: Core Implementation (ONLY after Phase 3.2 complete)

### Storage Layer Implementation

### T030 [P]: Implement MenuStore
**Description**: Implement MenuStore to pass tests from T005  
**File**: `src/storage/menu_store.ts`  
**Requirements**:
- In-memory Map storage
- LRU eviction for per-chat limit
- O(1) lookups by (chatId, messageId)
- Cleanup with configurable predicate

**Dependencies**: T004 (types), T005 (tests)  
**Validation**: T005 tests pass

---

### T031 [P]: Implement NavigationStore
**Description**: Implement NavigationStore to pass tests from T006  
**File**: `src/storage/navigation_store.ts`  
**Requirements**:
- Stack-based history per (userId, chatId)
- Max depth enforcement (200 default)
- Circular buffer for depth limit

**Dependencies**: T004 (types), T006 (tests)  
**Validation**: T006 tests pass

---

### T032 [P]: Implement CallbackStore
**Description**: Implement CallbackStore to pass tests from T007  
**File**: `src/storage/callback_store.ts`  
**Requirements**:
- UUID → CallbackData mapping
- O(1) lookups
- Message-based cleanup

**Dependencies**: T004 (types), T007 (tests)  
**Validation**: T007 tests pass

---

### Utility Implementation

### T033 [P]: Implement UUID Utility
**Description**: Implement UUID v4 generation to pass tests from T008  
**File**: `src/utils/uuid.ts`  
**Requirements**:
- Generate RFC 4122 compliant UUID v4
- Use crypto.randomUUID() or equivalent
- 36-character format

**Dependencies**: T004 (types), T008 (tests)  
**Validation**: T008 tests pass

---

### T034 [P]: Implement Cleanup Utility
**Description**: Implement cleanup logic to pass tests from T009  
**File**: `src/utils/cleanup.ts`  
**Requirements**:
- isStale() predicate
- LRU eviction logic
- Configurable timeouts

**Dependencies**: T004 (types), T009 (tests)  
**Validation**: T009 tests pass

---

### Event System Implementation

### T035: Implement EventEmitter
**Description**: Implement EventEmitter to pass tests from T010  
**File**: `src/events/event_emitter.ts`  
**Requirements**:
- Typed event handlers
- Multiple listeners per event
- Async handler support
- on(), off(), emit() methods

**Dependencies**: T004 (types), T010 (tests)  
**Validation**: T010 tests pass

---

### Pagination Implementation

### T036: Implement Paginator
**Description**: Implement Paginator class to pass tests from T011  
**File**: `src/pagination/paginator.ts`  
**Requirements**:
- Generic Paginator<T>
- Page calculation logic
- Keyboard generation with nav buttons
- Custom renderers support
- Edge case handling

**Dependencies**: T004 (types), T011 (tests)  
**Validation**: T011 tests pass

---

### T037: Implement createPaginatedMenu Helper
**Description**: Implement factory function to pass tests from T012  
**File**: `src/pagination/paginator.ts` (same file as T036)  
**Requirements**:
- Creates MenuDefinition with pagination
- Integrates header/footer buttons
- Configures parse mode

**Dependencies**: T036 (Paginator), T012 (tests)  
**Validation**: T012 tests pass

---

### Menu Core Implementation

### T038: Implement Menu Class
**Description**: Implement Menu class to pass tests from T013  
**File**: `src/menu.ts`  
**Requirements**:
- Menu construction from definition
- Content resolution (static + dynamic)
- Keyboard generation
- Telegram format conversion

**Dependencies**: T004 (types), T013 (tests), T035 (EventEmitter)  
**Validation**: T013 tests pass

---

### Handler Implementation

### T039: Implement CallbackHandler
**Description**: Implement callback query handler to pass tests from T014  
**File**: `src/handlers/callback_handler.ts`  
**Requirements**:
- UUID resolution via CallbackStore
- Action execution
- Telegram callback query responses
- Error handling for invalid UUIDs

**Dependencies**: T004 (types), T014 (tests), T032 (CallbackStore)  
**Validation**: T014 tests pass

---

### T040: Implement NavigationHandler
**Description**: Implement navigation logic to pass tests from T015  
**File**: `src/handlers/navigation_handler.ts`  
**Requirements**:
- Navigate with history push
- Back with history pop
- Page change with validation
- Page reset on invalid page
- History depth enforcement

**Dependencies**: T004 (types), T015 (tests), T031 (NavigationStore)  
**Validation**: T015 tests pass

---

### MenuManager Implementation

### T041: Implement MenuManager.send()
**Description**: Implement send() method to pass contract tests from T016  
**File**: `src/menu_manager.ts`  
**Requirements**:
- Send menu message via grammy Bot
- Store MenuRuntimeState
- Generate and store callback UUIDs
- Emit 'menuSend' event
- Error handling

**Dependencies**: T004, T016, T030-T032, T035, T038-T040  
**Validation**: T016 tests pass

---

### T042: Implement MenuManager.update()
**Description**: Implement update() method to pass tests from T017  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Edit existing Telegram message
- Update MenuRuntimeState
- Emit 'menuUpdate' event
- Throw MenuNotFoundError if needed

**Dependencies**: T041 (send), T017 (tests)  
**Validation**: T017 tests pass

---

### T043: Implement MenuManager.delete()
**Description**: Implement delete() method to pass tests from T018  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Delete Telegram message
- Clean up all storage (MenuStore, CallbackStore, NavigationStore)
- Emit 'menuDelete' event

**Dependencies**: T041 (send), T018 (tests)  
**Validation**: T018 tests pass

---

### T044: Implement MenuManager.navigate()
**Description**: Implement navigate() method to pass tests from T019  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Push current menu to NavigationStore
- Send target menu
- Emit 'navigate' event
- Handle errors

**Dependencies**: T041 (send), T019 (tests), T040 (NavigationHandler)  
**Validation**: T019 tests pass

---

### T045: Implement MenuManager.back()
**Description**: Implement back() method to pass tests from T020  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Pop from NavigationStore
- Restore previous menu
- Emit 'back' event
- Return null if no history

**Dependencies**: T041 (send), T020 (tests), T040 (NavigationHandler)  
**Validation**: T020 tests pass

---

### T046: Implement MenuManager.changePage()
**Description**: Implement changePage() method to pass tests from T021  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Update page in MenuRuntimeState
- Re-render menu with new page
- Emit 'pageChange' event
- Handle invalid page (reset to 1)
- Throw InvalidPageError appropriately

**Dependencies**: T041 (send), T021 (tests), T036 (Paginator)  
**Validation**: T021 tests pass

---

### T047: Implement MenuManager.cleanup()
**Description**: Implement cleanup() method to pass tests from T022  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Remove stale menus based on criteria
- Clean associated callbacks and history
- Emit 'menuDelete' events
- Return cleanup count

**Dependencies**: T041 (send), T022 (tests), T034 (cleanup utility)  
**Validation**: T022 tests pass

---

### T048: Implement MenuManager Event System
**Description**: Wire up event system to pass tests from T023  
**File**: `src/menu_manager.ts` (same file as T041)  
**Requirements**:
- Integrate EventEmitter
- Implement on() and off() methods
- Emit events at correct points in all methods

**Dependencies**: T041-T047 (all MenuManager methods), T023 (tests)  
**Validation**: T023 tests pass

---

### T049: Create Public API Module
**Description**: Create mod.ts with all public exports  
**File**: `src/mod.ts`  
**Content**:
```typescript
// Main exports
export { MenuManager } from "./menu_manager.ts";
export { Paginator, createPaginatedMenu } from "./pagination/paginator.ts";

// Type exports
export type {
  MenuDefinition,
  KeyboardDefinition,
  ButtonAction,
  MenuRuntimeState,
  MenuContext,
  MenuManagerOptions,
  PaginatorOptions,
  MenuEventType,
  MenuEventData,
} from "./types.ts";

// Error exports
export {
  MenuError,
  MenuNotFoundError,
  NavigationError,
  InvalidPageError,
} from "./types.ts";
```
**Dependencies**: T041-T048  
**Validation**: `deno check src/mod.ts` passes

---

### T050: Verify All Implementation Tests Pass
**Description**: Run test suite and confirm all unit tests pass (Green phase)  
**Command**: `deno test tests/unit/ --unsafely-ignore-certificate-errors`  
**Expected**: All unit tests pass  
**Dependencies**: T030-T049  
**Validation**: 0 test failures

---

### T051: Verify Integration Tests Pass
**Description**: Run integration test suite  
**Command**: `deno test tests/integration/ --unsafely-ignore-certificate-errors`  
**Expected**: All integration tests pass  
**Dependencies**: T050  
**Validation**: T024-T028 all pass

---

## Phase 3.4: Refactoring & Quality

### T052: Run Type Checking
**Description**: Verify strict TypeScript compliance  
**Command**: `deno check src/**/*.ts`  
**Expected**: No type errors, no implicit any  
**Dependencies**: T051  
**Validation**: Clean type check

---

### T053: Refactor for Code Quality
**Description**: Refactor code while keeping tests passing (Refactor phase)  
**Focus areas**:
- Extract duplicate logic into helpers
- Ensure functions ≤50 lines
- Ensure files ≤500 lines
- Improve naming and clarity
- Remove code smells

**Dependencies**: T051  
**Validation**: Tests still pass after refactoring

---

### T054: Apply Formatting
**Description**: Format all code with Deno formatter  
**Command**: `deno fmt`  
**Dependencies**: T053  
**Validation**: `deno fmt --check` passes

---

### T055: Run Linter
**Description**: Lint all code and fix warnings  
**Command**: `deno lint`  
**Expected**: Zero warnings  
**Dependencies**: T054  
**Validation**: Clean lint output

---

### T056: Measure Test Coverage
**Description**: Generate coverage report and verify ≥90%  
**Command**: `deno test --coverage=coverage --unsafely-ignore-certificate-errors`  
**Then**: `deno coverage coverage`  
**Expected**: ≥90% line coverage for src/, 100% for critical paths  
**Dependencies**: T055  
**Validation**: Coverage thresholds met

---

## Phase 3.5: Documentation & Examples

### T057 [P]: Create Basic Menu Example
**Description**: Implement basic_menu.ts example from quickstart.md  
**File**: `examples/basic_menu.ts`  
**Content**: Simple menu with a few buttons, demonstrates send() and callback handling  
**Dependencies**: T049 (public API)  
**Validation**: Example runs without errors

---

### T058 [P]: Create Paginated Menu Example
**Description**: Implement paginated_menu.ts example from quickstart.md  
**File**: `examples/paginated_menu.ts`  
**Content**: Paginated list of items, demonstrates Paginator and page navigation  
**Dependencies**: T049 (public API)  
**Validation**: Example runs without errors

---

### T059 [P]: Create Nested Navigation Example
**Description**: Implement nested_navigation.ts example from quickstart.md  
**File**: `examples/nested_navigation.ts`  
**Content**: Multi-level menu structure with back navigation  
**Dependencies**: T049 (public API)  
**Validation**: Example runs without errors

---

### T060 [P]: Add JSDoc Comments to All Public APIs
**Description**: Complete JSDoc documentation for src/mod.ts exports  
**Files**: All files in src/ with exported symbols  
**Requirements**:
- Purpose, parameters, returns for all functions
- Usage examples in JSDoc
- @throws tags for errors
- @example tags with code

**Dependencies**: T049  
**Validation**: All exports have JSDoc, examples are valid

---

### T061 [P]: Create README.md
**Description**: Write comprehensive README.md  
**File**: `README.md`  
**Sections**:
- Overview
- Features
- Installation (Deno + Node)
- Quick Start
- API Documentation
- Examples
- Configuration Options
- Event System
- Best Practices
- Contributing
- License

**Dependencies**: T057-T060  
**Validation**: README is clear and complete

---

### T062 [P]: Create CHANGELOG.md
**Description**: Initialize CHANGELOG following semantic versioning  
**File**: `CHANGELOG.md`  
**Content**: v0.1.0 initial release with all features  
**Dependencies**: T061  
**Validation**: CHANGELOG follows format

---

## Phase 3.6: Build & Distribution

### T063: Configure deno2node Build
**Description**: Set up deno2node for Node.js compatibility  
**Files**:
- Create build script
- Configure package.json for npm
- Test build output

**Dependencies**: T062  
**Validation**: Build creates Node-compatible dist/

---

### T064: Test Node.js Compatibility
**Description**: Verify plugin works in Node.js environment  
**Process**:
- Build with deno2node
- Install in Node project
- Run examples with Node
- Verify all features work

**Dependencies**: T063  
**Validation**: Plugin functions correctly in Node

---

### T065: Create GitHub Actions CI Workflow
**Description**: Set up CI pipeline  
**File**: `.github/workflows/ci.yml`  
**Jobs**:
- Lint (deno lint)
- Format check (deno fmt --check)
- Type check (deno check)
- Tests (deno test)
- Coverage (≥90%)
- Build (deno2node)

**Dependencies**: T064  
**Validation**: CI passes on push

---

## Phase 3.7: Final Quality Gates

### T066: Run Full Test Suite
**Description**: Execute all tests with coverage  
**Command**: `deno task test:coverage`  
**Expected**: All tests pass, ≥90% coverage  
**Dependencies**: T065  
**Validation**: Complete test success

---

### T067: Verify All Quality Gates
**Description**: Run all quality checks in sequence  
**Commands**:
1. `deno task lint`
2. `deno task fmt --check`
3. `deno task check`
4. `deno task test`
5. `deno task test:coverage`

**Expected**: All pass  
**Dependencies**: T066  
**Validation**: All gates green

---

### T068: Run Examples as Validation
**Description**: Execute all examples to verify they work  
**Commands**:
- `deno run --allow-net examples/basic_menu.ts`
- `deno run --allow-net examples/paginated_menu.ts`
- `deno run --allow-net examples/nested_navigation.ts`

**Expected**: All run without errors  
**Dependencies**: T067  
**Validation**: Examples succeed

---

### T069: Memory Leak Testing
**Description**: Run long-running test to check for memory leaks  
**Process**:
- Create test that sends 1000+ menus
- Monitor memory usage over time
- Verify cleanup happens
- Memory usage stays bounded

**Dependencies**: T068  
**Validation**: No memory growth over time

---

### T070: Final Documentation Review
**Description**: Review all documentation for completeness  
**Check**:
- README.md complete and accurate
- JSDoc comments on all exports
- Examples work and are well-commented
- CHANGELOG.md up to date
- All contracts matched by implementation

**Dependencies**: T069  
**Validation**: Documentation is production-ready

---

## Dependencies Summary

```
Phase 3.1 (Setup): T001-T004 [All parallel except T002]
  ↓
Phase 3.2 (Tests): T005-T028 [Most parallel, T029 sequential]
  ↓
Phase 3.3 (Implementation):
  Storage: T030-T032 [Parallel]
  Utils: T033-T034 [Parallel]
  Events: T035 [Sequential after storage]
  Pagination: T036-T037 [Sequential]
  Menu: T038 [After events]
  Handlers: T039-T040 [After storage]
  MenuManager: T041-T048 [Sequential, same file]
  API: T049 [After MenuManager]
  Verify: T050-T051 [Sequential]
  ↓
Phase 3.4 (Quality): T052-T056 [Sequential]
  ↓
Phase 3.5 (Docs): T057-T062 [Examples parallel, docs sequential]
  ↓
Phase 3.6 (Build): T063-T065 [Sequential]
  ↓
Phase 3.7 (Gates): T066-T070 [Sequential]
```

## Parallel Execution Examples

### Setup Phase (can run together):
```bash
# T003 and T004 can run in parallel
deno task create-deps  # T003
deno task create-types # T004
```

### Test Phase (many can run in parallel):
```bash
# T005-T028 can mostly run in parallel (different files)
deno task test-storage    # T005, T006, T007
deno task test-utils      # T008, T009
deno task test-events     # T010
deno task test-pagination # T011, T012
# ... etc
```

### Implementation Phase (storage layer parallel):
```bash
# T030, T031, T032 can run in parallel (different files)
deno task impl-menu-store      # T030
deno task impl-nav-store       # T031
deno task impl-callback-store  # T032
```

### Examples Phase (all parallel):
```bash
# T057, T058, T059 can run in parallel (different files)
deno task example-basic     # T057
deno task example-paginated # T058
deno task example-nested    # T059
```

## Validation Checklist

**Task Generation Validation** ✅:
- [x] All contracts have corresponding test tasks (MenuManager, Paginator)
- [x] All entities have model tasks (6 entities → storage + core)
- [x] All tests come before implementation (Phase 3.2 before 3.3)
- [x] Parallel tasks are truly independent (different files marked [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (MenuManager methods sequential)
- [x] TDD ordering enforced (Red-Green-Refactor)
- [x] Integration tests cover quickstart scenarios
- [x] Constitutional quality gates included (≥90% coverage, lint, fmt, check)

**Coverage**:
- Setup: ✅ Project structure, config, types, deps
- Storage: ✅ MenuStore, NavigationStore, CallbackStore (test + impl)
- Utils: ✅ UUID, Cleanup (test + impl)
- Events: ✅ EventEmitter (test + impl)
- Pagination: ✅ Paginator, createPaginatedMenu (test + impl)
- Menu: ✅ Menu class (test + impl)
- Handlers: ✅ CallbackHandler, NavigationHandler (test + impl)
- MenuManager: ✅ All 7 methods + events (test + impl)
- Integration: ✅ 5 scenarios from quickstart
- Examples: ✅ 3 working examples
- Docs: ✅ README, JSDoc, CHANGELOG
- Build: ✅ deno2node, Node compatibility, CI
- Quality: ✅ All constitutional gates

**Total Tasks**: 70 tasks across 7 phases
**Estimated Duration**: 
- Phase 3.1 (Setup): 2 hours
- Phase 3.2 (Tests): 8 hours
- Phase 3.3 (Implementation): 16 hours
- Phase 3.4 (Quality): 3 hours
- Phase 3.5 (Docs): 4 hours
- Phase 3.6 (Build): 3 hours
- Phase 3.7 (Gates): 2 hours
- **Total**: ~38 hours (assuming sequential execution; parallel execution can reduce significantly)

---

**Status**: ✅ Tasks generation complete. Ready for implementation.

**Next Step**: Begin with Phase 3.1 (T001-T004) to set up project foundation.
