# API Contract: MenuManager

**Version**: 1.0.0  
**Status**: Draft  
**Last Updated**: 2025-10-04

## Overview

`MenuManager` is the primary public API for managing menu messages. It handles menu lifecycle (send, update, delete), integrates with grammy's context, and emits events for menu interactions.

---

## Class: MenuManager

### Constructor

```typescript
constructor(bot: Bot, options?: MenuManagerOptions)
```

**Parameters**:
- `bot: Bot` - grammy Bot instance
- `options?: MenuManagerOptions` - Optional configuration

**Options**:
```typescript
interface MenuManagerOptions {
  /** Cleanup timeout in milliseconds (default: 30 minutes) */
  cleanupTimeout?: number;
  
  /** Maximum menus per chat (default: 10) */
  maxMenusPerChat?: number;
  
  /** Maximum navigation history depth (default: 200) */
  maxHistoryDepth?: number;
  
  /** Enable automatic cleanup (default: true) */
  autoCleanup?: boolean;
}
```

**Example**:
```typescript
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { MenuManager } from "./mod.ts";

const bot = new Bot("YOUR_BOT_TOKEN");
const menuManager = new MenuManager(bot, {
  cleanupTimeout: 1800000, // 30 minutes
  maxMenusPerChat: 10,
});
```

---

## Methods

### send()

Sends a new menu message to a chat.

```typescript
async send(
  chatId: number,
  menu: MenuDefinition,
  context?: MenuContext
): Promise<MenuRuntimeState>
```

**Parameters**:
- `chatId: number` - Telegram chat ID
- `menu: MenuDefinition` - Menu to send
- `context?: MenuContext` - Optional context for dynamic content

**Returns**: `Promise<MenuRuntimeState>` - State of the sent menu

**Throws**:
- `MenuError` - If menu content resolution fails
- `TelegramError` - If Telegram API call fails (passed through)

**Events Emitted**:
- `menuSend` - After menu successfully sent

**Example**:
```typescript
const menu: MenuDefinition = {
  id: "main_menu",
  content: "Welcome! Choose an option:",
  keyboard: {
    rows: [
      [{ text: "Option 1", action: { type: "callback", data: { action: "opt1" } } }],
      [{ text: "Option 2", action: { type: "callback", data: { action: "opt2" } } }],
    ],
  },
};

const state = await menuManager.send(chatId, menu);
console.log(`Menu sent with message ID: ${state.messageId}`);
```

---

### update()

Updates an existing menu message.

```typescript
async update(
  chatId: number,
  messageId: number,
  menu: MenuDefinition,
  context?: MenuContext
): Promise<MenuRuntimeState>
```

**Parameters**:
- `chatId: number` - Telegram chat ID
- `messageId: number` - Message ID to update
- `menu: MenuDefinition` - New menu content
- `context?: MenuContext` - Optional context for dynamic content

**Returns**: `Promise<MenuRuntimeState>` - Updated menu state

**Throws**:
- `MenuNotFoundError` - If menu state not found in storage
- `MenuError` - If menu content resolution fails
- `TelegramError` - If Telegram API call fails

**Events Emitted**:
- `menuUpdate` - After menu successfully updated

**Example**:
```typescript
const updatedMenu: MenuDefinition = {
  id: "main_menu",
  content: "Updated content!",
  keyboard: { rows: [[{ text: "OK", action: { type: "callback", data: {} } }]] },
};

await menuManager.update(chatId, messageId, updatedMenu);
```

---

### delete()

Deletes a menu message and cleans up associated state.

```typescript
async delete(chatId: number, messageId: number): Promise<void>
```

**Parameters**:
- `chatId: number` - Telegram chat ID
- `messageId: number` - Message ID to delete

**Returns**: `Promise<void>`

**Throws**:
- `TelegramError` - If Telegram API call fails

**Events Emitted**:
- `menuDelete` - After cleanup complete (regardless of Telegram API success)

**Side Effects**:
- Removes menu from MenuStore
- Removes associated callbacks from CallbackStore
- Removes references from NavigationStore

**Example**:
```typescript
await menuManager.delete(chatId, messageId);
```

---

### navigate()

Navigates from current menu to a target menu, pushing current to history.

```typescript
async navigate(
  chatId: number,
  currentMessageId: number,
  targetMenuId: string,
  context?: MenuContext
): Promise<MenuRuntimeState>
```

**Parameters**:
- `chatId: number` - Telegram chat ID
- `currentMessageId: number` - Current menu message ID
- `targetMenuId: string` - ID of menu to navigate to
- `context?: MenuContext` - Optional context

**Returns**: `Promise<MenuRuntimeState>` - State of the new menu

**Throws**:
- `MenuNotFoundError` - If current or target menu not found
- `NavigationError` - If navigation stack is full

**Events Emitted**:
- `navigate` - After navigation complete

**Example**:
```typescript
const newState = await menuManager.navigate(
  chatId,
  currentMessageId,
  "settings_menu"
);
```

---

### back()

Navigates back to the previous menu in history.

```typescript
async back(
  userId: number,
  chatId: number,
  currentMessageId: number
): Promise<MenuRuntimeState | null>
```

**Parameters**:
- `userId: number` - User ID (for history lookup)
- `chatId: number` - Chat ID
- `currentMessageId: number` - Current menu message ID

**Returns**: `Promise<MenuRuntimeState | null>` - Previous menu state, or null if no history

**Throws**:
- `MenuNotFoundError` - If previous menu no longer exists

**Events Emitted**:
- `back` - After successful back navigation

**Example**:
```typescript
const previousState = await menuManager.back(userId, chatId, currentMessageId);
if (previousState === null) {
  console.log("No history to go back to");
}
```

---

### changePage()

Changes the current page of a paginated menu.

```typescript
async changePage(
  chatId: number,
  messageId: number,
  page: number
): Promise<MenuRuntimeState>
```

**Parameters**:
- `chatId: number` - Chat ID
- `messageId: number` - Menu message ID
- `page: number` - Target page number (1-indexed)

**Returns**: `Promise<MenuRuntimeState>` - Updated menu state

**Throws**:
- `MenuNotFoundError` - If menu not found
- `InvalidPageError` - If page number is invalid

**Events Emitted**:
- `pageChange` - After page change complete

**Example**:
```typescript
const state = await menuManager.changePage(chatId, messageId, 3);
console.log(`Now on page ${state.currentPage}`);
```

---

### getState()

Retrieves the current state of a menu.

```typescript
getState(chatId: number, messageId: number): MenuRuntimeState | undefined
```

**Parameters**:
- `chatId: number` - Chat ID
- `messageId: number` - Message ID

**Returns**: `MenuRuntimeState | undefined` - Menu state if exists

**Example**:
```typescript
const state = menuManager.getState(chatId, messageId);
if (state) {
  console.log(`Current page: ${state.currentPage}`);
}
```

---

### cleanup()

Manually triggers cleanup of stale menus.

```typescript
cleanup(options?: CleanupOptions): number
```

**Parameters**:
- `options?: CleanupOptions` - Optional cleanup criteria

```typescript
interface CleanupOptions {
  /** Maximum age in milliseconds */
  maxAge?: number;
  
  /** Specific chat ID to clean */
  chatId?: number;
  
  /** Custom predicate for cleanup */
  predicate?: (state: MenuRuntimeState) => boolean;
}
```

**Returns**: `number` - Count of menus cleaned up

**Events Emitted**:
- `menuDelete` - For each menu cleaned up

**Example**:
```typescript
// Clean up menus older than 1 hour
const cleaned = menuManager.cleanup({ maxAge: 3600000 });
console.log(`Cleaned up ${cleaned} menus`);

// Clean up all menus in a specific chat
menuManager.cleanup({ chatId: 123456 });
```

---

## Event Handling

### on()

Registers an event handler.

```typescript
on<E extends MenuEventType>(
  event: E,
  handler: (data: MenuEventData[E]) => void | Promise<void>
): void
```

**Event Types**:

```typescript
type MenuEventType =
  | "menuSend"
  | "menuUpdate"
  | "menuDelete"
  | "navigate"
  | "back"
  | "pageChange"
  | "menuError";

interface MenuEventData {
  menuSend: { state: MenuRuntimeState };
  menuUpdate: { state: MenuRuntimeState };
  menuDelete: { chatId: number; messageId: number };
  navigate: { from: MenuRuntimeState; to: MenuRuntimeState };
  back: { to: MenuRuntimeState };
  pageChange: { state: MenuRuntimeState; page: number };
  menuError: { error: Error; context?: MenuContext };
}
```

**Example**:
```typescript
menuManager.on("navigate", ({ from, to }) => {
  console.log(`Navigated from ${from.menuId} to ${to.menuId}`);
});

menuManager.on("menuError", ({ error, context }) => {
  console.error("Menu error:", error);
});
```

---

### off()

Removes an event handler.

```typescript
off<E extends MenuEventType>(
  event: E,
  handler: (data: MenuEventData[E]) => void | Promise<void>
): void
```

**Example**:
```typescript
const handler = ({ state }) => console.log("Menu sent:", state.menuId);
menuManager.on("menuSend", handler);
// Later...
menuManager.off("menuSend", handler);
```

---

## Integration with grammy

### Middleware Setup

```typescript
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { MenuManager } from "./mod.ts";

const bot = new Bot("YOUR_BOT_TOKEN");
const menuManager = new MenuManager(bot);

// MenuManager automatically registers callback query handler
// No manual middleware setup required

bot.start();
```

**Note**: `MenuManager` automatically handles callback queries matching its UUID pattern. Custom callback handlers can coexist by checking the callback data format.

---

## Error Handling

All errors extend `MenuError`:

```typescript
class MenuError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "MenuError";
  }
}

class MenuNotFoundError extends MenuError {
  constructor(chatId: number, messageId: number) {
    super(`Menu not found: ${chatId}:${messageId}`, "MENU_NOT_FOUND");
  }
}

class NavigationError extends MenuError {
  // ... similar structure
}

class InvalidPageError extends MenuError {
  // ... similar structure
}
```

**Example Error Handling**:
```typescript
try {
  await menuManager.navigate(chatId, messageId, "nonexistent");
} catch (error) {
  if (error instanceof MenuNotFoundError) {
    console.error("Menu not found");
  } else if (error instanceof NavigationError) {
    console.error("Navigation failed:", error.message);
  } else {
    throw error; // Re-throw unknown errors
  }
}
```

---

## Contract Tests

See `tests/contract/menu_manager.test.ts` for comprehensive contract tests validating:
- All method signatures match this specification
- Return types are correct
- Errors are thrown as specified
- Events are emitted as specified
- Side effects occur as documented
