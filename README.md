# grammy_menu_message

A plugin library for grammy (Telegram bot framework) that simplifies building
consistent, testable menu messages. Written in Deno with a Node-compatible build
produced via deno2node.

## Features

- Declarative menu/message composition for grammy
- Consistent UX conventions (titles, back navigation, layout limits)
- Fully testable outputs (text + keyboard) aligned with BDD style
- Dual-runtime support: Deno first, Node via deno2node

## Runtime and Dependencies

- Deno runtime using standard libraries via `jsr:@std/*`
- grammy imported via `https://lib.deno.dev/x/grammy@v1/mod.ts`
- Dependencies declared in `deps.deno.ts` (Deno) and `deps.node.ts` (Node build)
- No Dockerization required (library plugin)

## Installation

### Deno

Import directly via URL:

```ts
import {/* plugin API */} from "https://deno.land/x/grammy_menu_message/mod.ts";
```

### Node (via deno2node build)

Install the npm package (published from deno2node output):

```bash
npm install grammy_menu_message
```

Then import in Node:

```ts
import {/* plugin API */} from "grammy_menu_message";
```

Note: This repository builds the Node bundle from the Deno source using
deno2node. See Scripts below for local build.

## Quick Start

```ts
import { Bot } from "https://lib.deno.dev/x/grammy@v1/mod.ts";
import {/* attachMenu */} from "https://deno.land/x/grammy_menu_message/mod.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN")!);

// attachMenu(bot, { /* define menu */ });

bot.start();
```

## Testing

- Use `describe`/`it` from `jsr:@std/testing/bdd` and assertions from
  `jsr:@std/expect`.
- Write contract tests that assert produced text and keyboard layout.
- Aim for ≥ 85% coverage overall and ≥ 90% on core modules.

## Build (deno2node)

- Source of truth is Deno code.
- Generate Node-compatible build with deno2node.
- Keep dependencies abstracted via `deps.deno.ts` and `deps.node.ts`.

## Constitution

This project follows the constitution in `.specify/memory/constitution.md`
(v2.0.0), emphasizing:

- Code Quality
- Testing Standards (TDD/BDD)
- Plugin UX & API Consistency
- Cross-Runtime Compatibility (Deno + Node via deno2node)

## License

MIT
