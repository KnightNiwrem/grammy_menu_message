# Data Model: Grammy Menu Message Plugin

**Date**: 2025-10-04  
**Feature**: Grammy Menu Message Plugin  
**Phase**: 1 - Design & Contracts

## Core Entities

### 1. MenuDefinition

Represents the immutable structure and content of a menu.

```typescript
interface MenuDefinition {
  /** Unique identifier for this menu */
  readonly id: string;
  
  /** Menu content - can be static string or dynamic function */
  readonly content: string | ((context: MenuContext) => string | Promise<string>);
  
  /** Inline keyboard configuration */
  readonly keyboard: KeyboardDefinition;
  
  /** Optional parse mode for message formatting */
  readonly parseMode?: "Markdown" | "MarkdownV2" | "HTML";
  
  /** Optional metadata for custom use */
  readonly metadata?: Record<string, unknown>;
}
```

**Validation Rules**:
- `id` must be non-empty string, unique across all menus
- `content` must produce non-empty string when resolved
- `keyboard` must have at least one button
- Total message length (after content resolution) should stay under Telegram's 4096 char limit (developer responsibility)

**Relationships**:
- Referenced by `MenuRuntimeState` via `menuId`
- Used by `MenuManager` to render menu messages

---

### 2. KeyboardDefinition

Defines the layout and buttons of an inline keyboard.

```typescript
interface KeyboardDefinition {
  /** Rows of buttons */
  readonly rows: ButtonRow[];
  
  /** Whether this keyboard supports pagination */
  readonly paginated?: boolean;
  
  /** Page size for paginated keyboards */
  readonly pageSize?: number;
}

type ButtonRow = InlineButton[];

interface InlineButton {
  /** Button text displayed to user */
  readonly text: string;
  
  /** Button action */
  readonly action: ButtonAction;
}

type ButtonAction = 
  | { type: "callback"; data: Record<string, unknown> }
  | { type: "url"; url: string }
  | { type: "navigate"; targetMenuId: string }
  | { type: "back" }
  | { type: "nextPage" }
  | { type: "prevPage" };
```

**Validation Rules**:
- Maximum 100 buttons per keyboard (Telegram limit, not enforced by plugin)
- Button text must be 1-64 characters
- URL buttons must have valid HTTP(S) URLs
- Navigate actions must reference existing menu IDs (runtime validation)
- Pagination actions only valid when `paginated: true`

**Relationships**:
- Part of `MenuDefinition`
- Actions create entries in `CallbackDataMapping`

---

### 3. MenuRuntimeState

Represents the current state of a menu for a specific user/chat.

```typescript
interface MenuRuntimeState {
  /** ID of the menu definition being displayed */
  menuId: string;
  
  /** Telegram message ID of the sent menu */
  messageId: number;
  
  /** Telegram chat ID where menu is displayed */
  chatId: number;
  
  /** Current page number (1-indexed) for paginated menus */
  currentPage: number;
  
  /** Timestamp of last interaction (for cleanup) */
  lastInteraction: number;
  
  /** Custom state data for dynamic menus */
  customState: Record<string, unknown>;
}
```

**State Transitions**:
1. **Created**: When menu is first sent → `currentPage = 1`, `lastInteraction = now()`
2. **Updated**: When user interacts → `lastInteraction = now()`, possibly update `currentPage`
3. **Stale**: When `now() - lastInteraction > timeout` → eligible for cleanup
4. **Deleted**: When explicitly cleaned up or message deleted → removed from storage

**Relationships**:
- Stored in `MenuStore` keyed by `(chatId, messageId)`
- Referenced by `NavigationHistory` to track visited menus
- Used by handlers to determine current menu context

---

### 4. NavigationHistory

Tracks the sequence of menus a user has navigated through.

```typescript
interface NavigationHistory {
  /** User ID this history belongs to */
  userId: number;
  
  /** Chat ID this history belongs to */
  chatId: number;
  
  /** Stack of previous menu states (LIFO) */
  stack: MenuHistoryEntry[];
  
  /** Maximum depth (default 200) */
  maxDepth: number;
}

interface MenuHistoryEntry {
  /** Menu ID that was displayed */
  menuId: string;
  
  /** Message ID of that menu */
  messageId: number;
  
  /** Page number when navigated away */
  page: number;
  
  /** Timestamp of navigation */
  timestamp: number;
}
```

**Invariants**:
- `stack.length <= maxDepth` (oldest entries evicted when exceeded)
- Entries are immutable once added
- Stack is per (userId, chatId) tuple

**Operations**:
- **Push**: Add new entry when navigating to submenu
- **Pop**: Retrieve and remove last entry when navigating back
- **Clear**: Remove all entries (on cleanup)
- **Peek**: View last entry without removing (for context)

**Relationships**:
- Stored in `NavigationStore` keyed by `(userId, chatId)`
- References `MenuRuntimeState` via `messageId`

---

### 5. CallbackDataMapping

Maps UUIDs to actual callback data to bypass Telegram's 64-byte limit.

```typescript
interface CallbackDataMapping {
  /** UUID key (36 characters) */
  uuid: string;
  
  /** Actual callback data */
  data: CallbackData;
  
  /** Timestamp of creation (for cleanup) */
  createdAt: number;
  
  /** Associated menu message ID (for cleanup) */
  messageId?: number;
}

interface CallbackData {
  /** Action type */
  action: ButtonAction["type"];
  
  /** Action-specific payload */
  payload: Record<string, unknown>;
  
  /** Menu ID this callback belongs to */
  menuId: string;
}
```

**Lifecycle**:
1. **Created**: When menu with callbacks is sent → UUID generated, mapping stored
2. **Used**: When user clicks button → UUID resolved to data, action executed
3. **Expired**: When associated menu is cleaned up → mapping deleted

**Relationships**:
- Created by `MenuManager` when rendering keyboards
- Used by `CallbackHandler` to resolve button clicks
- Cleaned up with associated `MenuRuntimeState`

---

### 6. MenuContext

Provides context information when rendering dynamic menu content.

```typescript
interface MenuContext {
  /** Telegram user who triggered the menu */
  user: {
    id: number;
    username?: string;
    firstName: string;
    lastName?: string;
  };
  
  /** Telegram chat where menu is displayed */
  chat: {
    id: number;
    type: "private" | "group" | "supergroup" | "channel";
  };
  
  /** Current runtime state */
  state: MenuRuntimeState;
  
  /** Navigation history */
  history: NavigationHistory;
  
  /** Custom data passed by developer */
  customData?: Record<string, unknown>;
}
```

**Usage**:
- Passed to dynamic content functions in `MenuDefinition`
- Available in event handlers
- Provides read-only access to current menu state

---

## Storage Models

### MenuStore

```typescript
interface MenuStore {
  /** Key: (chatId, messageId) → Value: MenuRuntimeState */
  menus: Map<string, MenuRuntimeState>;
  
  /** Key: chatId → Value: messageId[] (LRU order) */
  chatMenus: Map<number, number[]>;
  
  /** Maximum menus per chat (default 10) */
  maxMenusPerChat: number;
}
```

**Operations**:
- `set(state: MenuRuntimeState)`: Store menu state, enforce per-chat limit via LRU
- `get(chatId: number, messageId: number)`: Retrieve menu state
- `delete(chatId: number, messageId: number)`: Remove menu state
- `getByChat(chatId: number)`: Get all menus for a chat
- `cleanup(predicate: (state) => boolean)`: Remove stale menus

---

### NavigationStore

```typescript
interface NavigationStore {
  /** Key: (userId, chatId) → Value: NavigationHistory */
  histories: Map<string, NavigationHistory>;
  
  /** Default max depth (200) */
  defaultMaxDepth: number;
}
```

**Operations**:
- `getOrCreate(userId: number, chatId: number)`: Get or initialize history
- `push(userId: number, chatId: number, entry: MenuHistoryEntry)`: Add to stack
- `pop(userId: number, chatId: number)`: Remove and return last entry
- `clear(userId: number, chatId: number)`: Empty history
- `cleanup(predicate: (history) => boolean)`: Remove stale histories

---

### CallbackStore

```typescript
interface CallbackStore {
  /** Key: uuid → Value: CallbackDataMapping */
  mappings: Map<string, CallbackDataMapping>;
}
```

**Operations**:
- `create(data: CallbackData, messageId?: number)`: Generate UUID, store mapping
- `resolve(uuid: string)`: Get callback data by UUID
- `delete(uuid: string)`: Remove mapping
- `deleteByMessage(messageId: number)`: Remove all mappings for a menu
- `cleanup(maxAge: number)`: Remove old unused mappings

---

## Data Flow Diagrams

### Menu Send Flow
```
Developer calls MenuManager.send(menuDef)
  ↓
MenuManager resolves content (if function)
  ↓
MenuManager generates keyboard buttons
  ↓
For each callback button:
  CallbackStore.create() → UUID
  ↓
MenuManager sends message to Telegram
  ↓
Telegram returns message ID
  ↓
MenuStore.set(MenuRuntimeState) → stored
  ↓
MenuManager emits 'menuSend' event
```

### Navigation Flow
```
User clicks "navigate" button
  ↓
Telegram sends callback query with UUID
  ↓
CallbackHandler.resolve(UUID) → action
  ↓
NavigationHandler.push(current menu to history)
  ↓
MenuManager.send(target menu) → new state
  ↓
MenuStore.set(new state)
  ↓
MenuManager.answerCallbackQuery()
  ↓
MenuManager emits 'navigate' event
```

### Back Navigation Flow
```
User clicks "back" button
  ↓
CallbackHandler.resolve(UUID) → back action
  ↓
NavigationStore.pop() → previous entry
  ↓
MenuStore.get(previous messageId) → previous state
  ↓
MenuManager.edit(previous menu) → updated message
  ↓
MenuStore.delete(current state)
  ↓
MenuManager.answerCallbackQuery()
  ↓
MenuManager emits 'back' event
```

### Pagination Flow
```
User clicks "next page" button
  ↓
CallbackHandler.resolve(UUID) → nextPage action
  ↓
MenuStore.get(current state)
  ↓
state.currentPage += 1
  ↓
MenuManager.renderPage(new page)
  ↓
MenuManager.edit(message with new page)
  ↓
MenuStore.set(updated state)
  ↓
MenuManager.answerCallbackQuery()
  ↓
MenuManager emits 'pageChange' event
```

### Cleanup Flow
```
Cleanup triggered (timeout or manual)
  ↓
MenuStore.cleanup(isStale) → stale states
  ↓
For each stale state:
  NavigationStore.deleteReferences(messageId)
  CallbackStore.deleteByMessage(messageId)
  MenuStore.delete(state)
  ↓
MenuManager emits 'menuDelete' events
```

---

## Indexes and Keys

### Composite Keys
- `MenuStore`: `"${chatId}:${messageId}"` for fast lookups
- `NavigationStore`: `"${userId}:${chatId}"` for user-specific histories

### LRU Tracking
- `MenuStore.chatMenus`: Array per chat maintaining message IDs in access order
- On access: Move to end of array
- On capacity: Remove first (oldest) from array and MenuStore

---

## Memory Considerations

### Per-User Memory Estimate
```
MenuRuntimeState: ~200 bytes (with small customState)
NavigationHistoryEntry: ~50 bytes
CallbackDataMapping: ~150 bytes (with medium payload)

Per active user (worst case):
- 10 menus × 200 bytes = 2 KB
- 200 history entries × 50 bytes = 10 KB
- 100 callbacks × 150 bytes = 15 KB
Total: ~27 KB per very active user
```

### Cleanup Strategy Impact
- Timeout (30 min default): Removes inactive users → bounded by active users
- Max menus per chat (10 default): Prevents runaway growth → 10 × 200 bytes max
- History depth (200 default): Caps stack size → 200 × 50 bytes max
- Combined: Memory scales linearly with active users, bounded by config

---

## Type Safety Notes

All types exported from `src/types.ts` with:
- Strict TypeScript checking (no `any`)
- Readonly interfaces for definitions (immutability)
- Discriminated unions for button actions (type safety)
- Optional fields explicitly marked
- JSDoc comments on all exports

Runtime validation occurs only at critical boundaries:
- Menu ID existence when navigating
- UUID resolution when handling callbacks
- State consistency when cleaning up

No validation of Telegram limits (button count, text length) - defer to Telegram API.
