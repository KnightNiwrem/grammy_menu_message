# Quickstart: Menu Message Plugin

## Prerequisites
- Deno 1.46+ (with permissions to fetch `https://lib.deno.dev` modules)
- Node.js 18+ for deno2node compatibility checks
- Telegram bot token
- A grammy-compatible `StorageAdapter` implementation for persistence (e.g., Redis, Postgres, in-memory for local dev)

## 1. Install and wire the plugin
```ts
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import { createMenuTemplateManager, menuMessageInterceptor } from "./src/index.ts";
import { createStorageAdapter } from "./deps.deno.ts"; // developer supplied

const bot = new Bot(process.env.BOT_TOKEN!);

const manager = createMenuTemplateManager({
  repository: createRepositoryFromAdapter(createStorageAdapter()),
  historyDepth: 200,
  historyTtl: Infinity,
});

bot.api.config.use(menuMessageInterceptor(manager));
```

## 2. Register menu templates
```ts
manager.registerTemplate({
  id: "main",
  render: async ({ args }) => ({
    text: `Hello ${args.userName}`,
    keyboard: [[
      manager.actions.navigate("settings", { showAdvanced: false }, { label: "Settings" }),
    ]],
  }),
  onAction: async (payload, ctx) => {
    if (payload.kind === "back") {
      await manager.navigateBack(ctx.update);
    }
  },
});
```

## 3. Generate and send a menu message
```ts
bot.command("start", async (ctx) => {
  const menu = await manager.createMenuMessage("main", {
    args: { userName: ctx.from?.first_name ?? "there" },
    segmentationKey: ctx.chat?.id?.toString(),
  });

  await ctx.reply(menu, { reply_markup: { inline_keyboard: menu.keyboard } });
});
```

## 4. Handle callback updates
```ts
bot.on("callback_query:data", async (ctx) => {
  await manager.handleCallback(ctx);
});
```

## 5. Run validation checks
```bash
deno fmt
deno lint
deno test --allow-env --allow-net --unsafely-ignore-certificate-errors
npm run deno2node && npm test
```

## 6. Manage navigation history limits
- Update `historyDepth`/`historyTtl` in manager config to enforce depth/age pruning.
- Use `manager.hooks.afterNavigate` to observe pruned entries when TTL removes expired history.
- Ensure segmentation keys uniquely isolate concurrent users (chat ID by default).

## 7. Next steps
- Flesh out data models in `src/menu/history/` using `data-model.md`.
- Implement contract tests in `tests/contract/` until they pass.
- Update documentation (`README.md`, changelog) once behaviors stabilize.
