# Quickstart: Grammy Menu Message Plugin

**Goal**: Get a basic menu working in under 5 minutes

## Prerequisites

- Deno installed (latest stable version)
- A Telegram bot token (get from [@BotFather](https://t.me/botfather))
- Basic familiarity with grammy

## Installation

### Deno
```typescript
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { MenuManager } from "https://deno.land/x/grammy_menu_message/mod.ts";
```

### Node.js
```bash
npm install grammy grammy-menu-message
```

```typescript
import { Bot } from "grammy";
import { MenuManager } from "grammy-menu-message";
```

## 30-Second Example

```typescript
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { MenuManager, createPaginatedMenu, Paginator } from "./mod.ts";

// 1. Create bot and menu manager
const bot = new Bot("YOUR_BOT_TOKEN");
const menuManager = new MenuManager(bot);

// 2. Define a simple menu
const mainMenu = {
  id: "main",
  content: "Welcome! Choose an option:",
  keyboard: {
    rows: [
      [{ text: "📋 View List", action: { type: "navigate", targetMenuId: "list" } }],
      [{ text: "ℹ️ About", action: { type: "callback", data: { action: "about" } } }],
    ],
  },
};

// 3. Send menu on /start
bot.command("start", async (ctx) => {
  await menuManager.send(ctx.chat.id, mainMenu);
});

// 4. Handle custom callbacks
menuManager.on("callback", async ({ data, ctx }) => {
  if (data.action === "about") {
    await ctx.answerCallbackQuery("This is a demo bot!");
  }
});

// 5. Start bot
bot.start();
console.log("Bot started!");
```

Run with:
```bash
deno run --allow-net --unsafely-ignore-certificate-errors bot.ts
```

## 5-Minute Tutorial: Paginated Menu

### Step 1: Setup

```typescript
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { 
  MenuManager, 
  Paginator, 
  createPaginatedMenu,
  type MenuDefinition 
} from "./mod.ts";

const bot = new Bot("YOUR_BOT_TOKEN");
const menuManager = new MenuManager(bot, {
  cleanupTimeout: 600000, // 10 minutes
  maxMenusPerChat: 5,
});
```

### Step 2: Create Data and Paginator

```typescript
// Sample data
const items = Array.from(
  { length: 25 },
  (_, i) => `Item ${i + 1}`
);

// Create paginator
const paginator = new Paginator({
  items,
  pageSize: 5,
  renderItem: (item, index) => `${index + 1}. ${item}`,
  renderPage: (items, page, total) =>
    `📋 Items List (Page ${page}/${total})\n\n${items.join("\n")}`,
});
```

### Step 3: Create Menus

```typescript
// Main menu
const mainMenu: MenuDefinition = {
  id: "main",
  content: "🏠 Main Menu\n\nChoose an action:",
  keyboard: {
    rows: [
      [{ text: "📋 View Items", action: { type: "navigate", targetMenuId: "items" } }],
      [{ text: "➕ Add Item", action: { type: "callback", data: { action: "add" } } }],
      [{ text: "ℹ️ Help", action: { type: "callback", data: { action: "help" } } }],
    ],
  },
};

// Paginated items menu
const itemsMenu = createPaginatedMenu("items", paginator, {
  footerButtons: [
    [{ text: "🏠 Back to Main", action: { type: "back" } }],
  ],
});
```

### Step 4: Handle Commands and Callbacks

```typescript
// Start command
bot.command("start", async (ctx) => {
  await menuManager.send(ctx.chat.id, mainMenu);
  await ctx.reply("Welcome! Use the menu below:");
});

// Handle custom callbacks
menuManager.on("callback", async ({ data, context }) => {
  const chatId = context.chat.id;
  
  if (data.action === "add") {
    // Add new item
    items.push(`Item ${items.length + 1}`);
    paginator.reset(items);
    await context.answerCallbackQuery("Item added!");
  } else if (data.action === "help") {
    await context.answerCallbackQuery(
      "Use buttons to navigate through menus!",
      { show_alert: true }
    );
  }
});

// Log navigation
menuManager.on("navigate", ({ from, to }) => {
  console.log(`Navigation: ${from.menuId} → ${to.menuId}`);
});

menuManager.on("back", ({ to }) => {
  console.log(`Back to: ${to.menuId}`);
});
```

### Step 5: Register Menus and Start

```typescript
// Register all menus (so navigation actions can find them)
const menus = new Map<string, MenuDefinition>([
  ["main", mainMenu],
  ["items", itemsMenu],
]);

// Override navigate to use registered menus
menuManager.on("navigate", async ({ from, to }) => {
  const targetMenu = menus.get(to.menuId);
  if (targetMenu) {
    await menuManager.send(from.chatId, targetMenu);
  }
});

bot.start();
console.log("✅ Bot is running with paginated menus!");
```

## Complete Working Example

Save as `bot.ts`:

```typescript
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { MenuManager, Paginator, createPaginatedMenu } from "./mod.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
const menuManager = new MenuManager(bot);

// Data
const items = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: (Math.random() * 100).toFixed(2),
}));

// Paginator
const paginator = new Paginator({
  items,
  pageSize: 5,
  renderItem: (item) => `${item.id}. ${item.name} - $${item.price}`,
  renderPage: (items, page, total) =>
    `🛍️ Product Catalog\nPage ${page}/${total}\n\n${items.join("\n")}`,
  navigation: {
    showFirstLast: true,
    prevText: "◀️ Prev",
    nextText: "Next ▶️",
  },
});

// Menus
const mainMenu = {
  id: "main",
  content: "🏪 Welcome to the Shop!\n\nWhat would you like to do?",
  keyboard: {
    rows: [
      [{ text: "🛍️ Browse Products", action: { type: "navigate", targetMenuId: "products" } }],
      [{ text: "🛒 View Cart", action: { type: "callback", data: { action: "cart" } } }],
      [{ text: "ℹ️ About", action: { type: "callback", data: { action: "about" } } }],
    ],
  },
};

const productsMenu = createPaginatedMenu("products", paginator, {
  footerButtons: [[{ text: "🏠 Main Menu", action: { type: "back" } }]],
});

// Handlers
bot.command("start", async (ctx) => {
  await menuManager.send(ctx.chat.id, mainMenu);
});

menuManager.on("callback", async ({ data, context }) => {
  if (data.action === "cart") {
    await context.answerCallbackQuery("Your cart is empty!", { show_alert: true });
  } else if (data.action === "about") {
    await context.answerCallbackQuery("Demo shop bot using grammy_menu_message");
  }
});

menuManager.on("pageChange", ({ state, page }) => {
  console.log(`User viewing page ${page} of products`);
});

// Start
bot.start();
console.log("🚀 Shop bot is running!");
```

Run:
```bash
export BOT_TOKEN="your_token_here"
deno run --allow-net --allow-env --unsafely-ignore-certificate-errors bot.ts
```

## Next Steps

1. **Custom Buttons**: Add buttons with custom callback data
2. **Dynamic Content**: Use functions for `content` to show user-specific data
3. **Event Handling**: Listen to all menu events for logging/analytics
4. **Cleanup**: Configure cleanup timeouts for your use case
5. **Advanced**: Nest multiple levels of menus with navigation history

See the [full documentation](./README.md) for advanced features!

## Validation Checklist

After following this quickstart, you should be able to:

- [ ] Start bot with `/start` command
- [ ] See main menu with buttons
- [ ] Navigate to paginated items menu
- [ ] Use Previous/Next pagination buttons
- [ ] Navigate back to main menu
- [ ] Receive callback query responses
- [ ] See console logs for navigation events

If any of these fail, check:
- Bot token is correct
- Network permissions granted (`--allow-net`)
- grammy and plugin imported correctly
- Bot is running (`bot.start()` called)

## Common Issues

**"Cannot find module"**: Check import paths match your directory structure

**"Bot token invalid"**: Verify token from @BotFather

**"Certificate error"**: Add `--unsafely-ignore-certificate-errors` flag (Deno sandbox only)

**Buttons don't work**: Ensure `MenuManager` is created before bot starts

**Memory growing**: Configure `cleanupTimeout` and `maxMenusPerChat` options

## Testing

Run included tests:
```bash
deno test --allow-net --unsafely-ignore-certificate-errors
```

Create your own test:
```typescript
import { assertEquals } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";
import { Paginator } from "./mod.ts";

describe("Paginator", () => {
  it("should calculate correct page count", () => {
    const paginator = new Paginator({
      items: [1, 2, 3, 4, 5],
      pageSize: 2,
      renderItem: (item) => item.toString(),
    });
    assertEquals(paginator.getTotalPages(), 3);
  });
});
```

---

**You're ready!** Start building interactive menus for your Telegram bot. 🎉
