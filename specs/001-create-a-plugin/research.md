# Research: Grammy Menu Message Plugin

**Date**: 2025-10-04  
**Feature**: Grammy Menu Message Plugin  
**Phase**: 0 - Outline & Research

## Research Questions

### 1. Dual Runtime Support (Deno + Node.js)

**Decision**: Use deno2node for Node.js compatibility with separate dependency files

**Rationale**:
- deno2node is the standard tool for converting Deno projects to Node.js
- Allows writing pure Deno code while maintaining Node compatibility
- Separate deps.deno.ts and deps.node.ts files isolate runtime-specific imports
- Build process handles conversion automatically
- No runtime detection code needed in plugin logic

**Alternatives Considered**:
- Runtime detection (if-else for Deno vs Node): Adds complexity and maintenance burden
- Separate codebases: Would violate DRY principle and double testing effort
- Deno-only: Would limit adoption to Deno-only bot developers

**Implementation Notes**:
- deps.deno.ts: `import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts"`
- deps.node.ts: `import { Bot } from "grammy"` (from npm)
- Build script runs deno2node to generate Node-compatible dist/

### 2. Callback Data Storage Strategy

**Decision**: UUID-based mapping with in-memory storage

**Rationale**:
- Telegram's 64-byte callback_data limit is easily exceeded with menu state
- UUIDs are 36 characters, leaving room for prefixes/metadata
- In-memory Map provides O(1) lookup performance
- No external storage dependency maintains plugin simplicity
- Cleanup strategies prevent unbounded memory growth

**Alternatives Considered**:
- Compression: Still risks hitting 64-byte limit with complex data
- External storage (Redis/DB): Violates constitution's no-dependency requirement
- Encoding schemes: Complex and error-prone

**Implementation Notes**:
- Generate UUID v4 for each callback
- Store mapping: `Map<string, CallbackData>`
- Include in cleanup strategy (timeout + manual)

### 3. Navigation History Implementation

**Decision**: Stack-based per-user history with configurable depth limit

**Rationale**:
- Stack (LIFO) naturally models back navigation
- Per-user isolation prevents cross-user interference
- Configurable depth (default 200) balances functionality and memory
- Oldest entries automatically evicted when limit reached

**Alternatives Considered**:
- Unlimited history: Memory leak risk for long-running bots
- Global history: Would mix users' navigation states
- Tree structure: Overkill for linear back navigation

**Implementation Notes**:
- Data structure: `Map<userId, Stack<MenuState>>`
- Push on navigation, pop on back
- Circular buffer for depth limit enforcement

### 4. Event System Architecture

**Decision**: EventEmitter pattern with typed events

**Rationale**:
- Familiar pattern from Node.js EventEmitter
- TypeScript ensures type-safe event handlers
- Allows multiple listeners per event
- Decouples menu logic from user event handlers
- Standard pattern in grammy ecosystem

**Alternatives Considered**:
- Callbacks only: Less flexible for multiple handlers
- Reactive streams (RxJS): Adds dependency, overkill for use case
- Promise-based hooks: Doesn't support multiple listeners well

**Implementation Notes**:
```typescript
type MenuEvent = 
  | { type: 'navigate', from: string, to: string }
  | { type: 'back', to: string }
  | { type: 'pageChange', page: number }
  | { type: 'menuSend', menuId: string }
  | { type: 'menuUpdate', menuId: string }
  | { type: 'menuDelete', menuId: string }
  | { type: 'menuError', error: Error };
```

### 5. Cleanup Strategy

**Decision**: Hybrid timeout + manual cleanup with per-chat limits

**Rationale**:
- Automatic timeout prevents memory leaks from abandoned sessions
- Manual cleanup gives developers control for immediate cleanup
- Per-chat menu limit prevents unbounded growth
- LRU eviction for menu messages maintains recent state
- Multiple strategies handle different use cases

**Alternatives Considered**:
- Timeout only: Doesn't handle explicit cleanup needs
- Manual only: Risk of developer forgetting cleanup
- Session-based: Requires defining "session" which varies by bot

**Implementation Notes**:
- Default timeout: 30 minutes of inactivity
- Default max menus per chat: 10 (LRU eviction)
- Cleanup runs: On timeout, on manual call, on limit exceeded
- Cleanup scope: Menu messages, navigation history, callback mappings

### 6. Telegram Rate Limiting

**Decision**: Respect Telegram limits without internal queuing (let grammy handle it)

**Rationale**:
- Telegram limits: 30 messages/second for bots
- grammy already has rate limiting capabilities
- Plugin shouldn't duplicate rate limiting logic
- Bot developers can configure grammy's throttler plugin
- Keep plugin focused on menu management

**Alternatives Considered**:
- Built-in queue: Duplicates grammy functionality
- No consideration: Could cause API errors
- Exponential backoff: Complex and already handled by grammy

**Implementation Notes**:
- Document rate limit considerations in README
- Recommend grammy throttler plugin for high-volume bots
- Plugin focuses on correctness, not rate management

### 7. Pagination Design

**Decision**: Builder pattern with configurable page size and custom renderers

**Rationale**:
- Builder pattern provides flexible, readable API
- Page size configuration adapts to different content types
- Custom renderers allow formatting flexibility
- Automatic button generation for next/prev/first/last
- Handles edge cases (last page, first page, single page)

**Alternatives Considered**:
- Fixed page size: Too restrictive
- Manual button creation: Error-prone for developers
- Simple next/prev only: Less usable for large lists

**Implementation Notes**:
```typescript
interface PaginatorOptions<T> {
  items: T[];
  pageSize: number;
  renderItem: (item: T, index: number) => string;
  renderPage: (items: string[], page: number, total: number) => string;
}
```

### 8. Menu State Management

**Decision**: Immutable menu definitions + mutable runtime state

**Rationale**:
- Immutable definitions prevent accidental modification
- Mutable state (current page, history) is necessary for runtime
- Clear separation between "what" (definition) and "where" (state)
- Enables menu reuse across users/chats
- Facilitates testing with predictable definitions

**Alternatives Considered**:
- Fully mutable: Error-prone, hard to reason about
- Fully immutable: Requires complex state management library
- Class-based with methods: Less functional, harder to serialize

**Implementation Notes**:
```typescript
interface MenuDefinition {
  readonly id: string;
  readonly content: string | ((state: any) => string);
  readonly keyboard: KeyboardDefinition;
}

interface MenuRuntimeState {
  menuId: string;
  currentPage: number;
  customState: Record<string, any>;
}
```

## Technical Stack Summary

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Language | TypeScript | Type safety, grammy ecosystem standard |
| Runtime | Deno + Node.js | Deno-first with Node compatibility via deno2node |
| Testing | Deno test + @std/testing/bdd | TDD with describe/it, no extra dependencies |
| grammy | lib.deno.dev @v1 | Semantic versioning, Deno-friendly imports |
| Storage | In-memory Map | No external deps, O(1) perf, cleanup-friendly |
| Events | Custom EventEmitter | Typed events, zero dependencies |
| Build | deno2node | Standard Deno→Node conversion tool |

## Potential Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Memory leaks in long-running bots | High | Multiple cleanup strategies, configurable limits |
| Telegram API rate limits | Medium | Document best practices, recommend throttler |
| UUID collision | Low | Use UUID v4 (128-bit), astronomically unlikely |
| State consistency on bot restart | Medium | Document as expected behavior, suggest persistence layer for production |
| deno2node compatibility issues | Medium | Test Node build in CI, document known limitations |

## Next Steps (Phase 1)

1. Define data models for Menu, MenuState, NavigationHistory, CallbackMapping
2. Design public API contracts (MenuManager, Paginator, EventEmitter interfaces)
3. Create contract tests for each public API
4. Write quickstart.md with basic usage example
5. Generate initial tasks.md structure

## References

- [grammy Documentation](https://grammy.dev)
- [Telegram Bot API - Inline Keyboards](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
- [deno2node](https://github.com/fromdeno/deno2node)
- [Deno Standard Library Testing](https://jsr.io/@std/testing)
- [UUID v4 Specification](https://tools.ietf.org/html/rfc4122)
