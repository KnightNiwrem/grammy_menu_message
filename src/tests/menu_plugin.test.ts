import { afterEach, beforeEach, describe, it } from "../../deps.deno.ts";
import { expect } from "../../deps.deno.ts";

import { createMenuMessagePlugin } from "../mod.ts";
import type {
  MenuContext,
  MenuDefinition,
  MenuMessagePlugin,
  MenuSession,
} from "../types.ts";
import type {
  Api,
  CallbackQuery,
  Context,
  RawApi,
  StorageAdapter,
} from "../../deps.deno.ts";

class MockStorageAdapter implements StorageAdapter<MenuSession> {
  readonly data = new Map<string, MenuSession>();

  read(key: string): Promise<MenuSession | undefined> {
    return Promise.resolve(this.data.get(key));
  }

  write(key: string, value: MenuSession): Promise<void> {
    this.data.set(key, value);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    this.data.delete(key);
    return Promise.resolve();
  }
}

type ApiCall = (
  method: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
) => Promise<unknown>;

class MockApi {
  #transformers: Array<(prev: ApiCall) => ApiCall> = [];
  #messageId = 0;
  readonly calls: Array<{ method: string; payload: Record<string, unknown> }> =
    [];

  readonly config = {
    use: (transformer: (prev: ApiCall) => ApiCall) => {
      this.#transformers.push(transformer);
    },
  } as const;

  async sendMessage(
    chatId: number | string,
    text: string,
    other?: Record<string, unknown>,
  ): Promise<unknown> {
    return await this.#execute("sendMessage", {
      chat_id: chatId,
      text,
      ...(other ?? {}),
    });
  }

  async editMessageText(
    chatId: number | string,
    messageId: number,
    text: string,
    other?: Record<string, unknown>,
  ): Promise<unknown> {
    return await this.#execute("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...(other ?? {}),
    });
  }

  async #execute(
    method: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    const base: ApiCall = (m, p) => this.#invoke(m, p);
    const pipeline = this.#transformers.reduceRight(
      (prev, transformer) => transformer(prev),
      base,
    );
    return await pipeline(method, payload, undefined);
  }

  #invoke(
    method: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    this.calls.push({ method, payload });
    if (method === "sendMessage") {
      this.#messageId += 1;
      return Promise.resolve({
        message_id: this.#messageId,
        text: payload.text,
        chat: { id: payload.chat_id },
        reply_markup: payload.reply_markup,
      });
    }
    if (method === "editMessageText") {
      const messageId = typeof payload.message_id === "number"
        ? payload.message_id
        : this.#messageId;
      return Promise.resolve({
        message_id: messageId,
        text: payload.text,
        chat: { id: payload.chat_id },
        reply_markup: payload.reply_markup,
      });
    }
    return Promise.resolve(undefined);
  }
}

type TestContext = MenuContext<Context> & {
  chat: { id: number };
  from: { id: number };
  api: Api<RawApi>;
  reply: (text: string, extra?: Record<string, unknown>) => Promise<unknown>;
  msg?: { message_thread_id?: number };
  callbackQuery?: { data?: string; message?: { message_thread_id?: number } };
};

function createContext(api: MockApi): TestContext {
  const chatId = 100;
  const ctx = {
    chat: { id: chatId } as unknown,
    from: { id: 200 } as unknown,
    api: api as unknown as Api<RawApi>,
    reply:
      ((text: string, extra?: Record<string, unknown>) =>
        api.sendMessage(chatId, text, extra)) as unknown,
    msg: { message_thread_id: 10 } as unknown,
    update: { callback_query: undefined } as unknown,
    callbackQuery: undefined,
  };
  return ctx as unknown as TestContext;
}

describe("menuMessage plugin", () => {
  let storage: MockStorageAdapter;
  let api: MockApi;
  let plugin: MenuMessagePlugin<Context>;
  let middleware: (
    ctx: TestContext,
    next: () => Promise<void>,
  ) => Promise<void>;
  let menu: MenuDefinition<Context>;

  beforeEach(() => {
    storage = new MockStorageAdapter();
    api = new MockApi();

    menu = {
      id: "main",
      render: (ctx, state) => ({
        text: `menu:${String(state.payload ?? "root")}`,
        keyboard: [[{
          text: "go",
          callback_data: ctx.menuMessage.buildActionData("main", "open"),
        }]],
      }),
      onAction: async (ctx) => {
        await ctx.menuMessage.show("main", "action");
      },
    } satisfies MenuDefinition<Context>;

    plugin = createMenuMessagePlugin({
      storage,
      menus: [menu],
    });

    plugin.registerTransformer(api as unknown as Api<RawApi>);
    middleware = plugin.composer.middleware() as (
      ctx: TestContext,
      next: () => Promise<void>,
    ) => Promise<void>;
  });

  afterEach(() => {
    storage.data.clear();
  });

  it("stores rendered menu history via reply", async () => {
    const ctx = createContext(api);
    await middleware(ctx, async () => {});

    await ctx.menuMessage.reply("main", "root");

    const key = `${ctx.chat.id}:10:${ctx.from.id}`;
    const session = storage.data.get(key);
    expect(session).toBeDefined();
    expect(session?.history.length).toBe(1);
    expect(session?.history[0].text).toBe("menu:root");
    expect(ctx.menuMessage.current()?.messageId).toBe(1);
  });

  it("updates history on edit", async () => {
    const ctx = createContext(api);
    await middleware(ctx, async () => {});

    await ctx.menuMessage.reply("main", "root");
    await ctx.menuMessage.edit("main", "updated");

    const key = `${ctx.chat.id}:10:${ctx.from.id}`;
    const session = storage.data.get(key)!;
    expect(session.history.length).toBe(1);
    expect(session.history[0].text).toBe("menu:updated");
  });

  it("invokes onAction for menu callbacks", async () => {
    const ctx = createContext(api);
    await middleware(ctx, async () => {});

    await ctx.menuMessage.reply("main", "root");

    ctx.callbackQuery = {
      data: ctx.menuMessage.buildActionData("main", "open"),
      message: { message_thread_id: 10 },
    } as unknown as CallbackQuery;
    Object.assign(ctx.update as unknown as Record<string, unknown>, {
      callback_query: ctx.callbackQuery,
    });

    await middleware(ctx, async () => {});

    const key = `${ctx.chat.id}:10:${ctx.from.id}`;
    const session = storage.data.get(key)!;
    expect(session.active?.payload).toBe("action");
  });
});
