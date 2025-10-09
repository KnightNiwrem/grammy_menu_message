import { Composer } from "../deps.deno.ts";
import type { Api, Context, RawApi } from "../deps.deno.ts";

import { MenuStorage } from "./storage/menu_storage.ts";
import {
  buildActionData,
  DEFAULT_NAMESPACE,
  normalizeKeyboard,
  parseActionData,
  toReplyMarkup,
} from "./menu/renderer.ts";
import {
  queuePendingMessage,
  registerMenuTransformer,
} from "./menu/transformer.ts";
import {
  type CreateMenuMessagePluginOptions,
  type MenuContext,
  type MenuDefinition,
  type MenuHistoryEntry,
  type MenuMessageController,
  type MenuMessagePlugin,
  type MenuRegistry,
  type MenuRenderResult,
  type MenuSession,
  type MenuShowOptions,
  type MenuState,
  type PendingMenuMessage,
} from "./types.ts";

export * from "./types.ts";

export function createMenuMessagePlugin<
  C extends Context = Context,
  TStored = MenuSession,
>(
  options: CreateMenuMessagePluginOptions<C, TStored>,
): MenuMessagePlugin<C> {
  if (!options || !options.storage) {
    throw new Error("menuMessagePlugin requires a storage adapter");
  }

  const namespace = options.namespace ?? DEFAULT_NAMESPACE;
  const clock = options.clock ?? (() => Date.now());
  const keyBuilder = options.keyBuilder ?? defaultKeyBuilder<C>;
  const registry = buildRegistry(options.menus);
  const storage = new MenuStorage<C, TStored>(
    options.storage,
    keyBuilder,
    options.serializer,
    options.historyLimit,
  );

  const composer = new Composer<MenuContext<C>>();

  composer.use(async (ctx, next) => {
    if (!ctx.chat) {
      return await next();
    }
    const baseCtx = ctx as MenuContext<C>;
    const { key, session } = await storage.read(baseCtx as unknown as C);
    let currentKey = key;
    let currentSession = session;

    const controller: MenuMessageController<C> = {
      show: async (menuId, payload, showOptions) => {
        const menu = ensureMenuDefinition(registry, menuId);
        const result = await storage.withSession(
          baseCtx as unknown as C,
          (draft) => {
            const previousActive = draft.active;
            const nextState = createMenuState(
              menuId,
              payload,
              previousActive,
              showOptions,
              clock,
            );
            if (showOptions?.stack === false && draft.history.length > 0) {
              draft.history.pop();
            }
            draft.active = nextState;
            return { previousActive };
          },
        );

        currentKey = result.key;
        currentSession = result.session;

        const previousActive = result.result.previousActive;
        if (previousActive && previousActive.menuId !== menuId) {
          const previousMenu = registry.get(previousActive.menuId);
          if (previousMenu?.onLeave) {
            await previousMenu.onLeave(baseCtx, currentSession);
          }
        }
        if (previousActive?.menuId !== menuId && menu.onEnter) {
          await menu.onEnter(baseCtx, currentSession);
        }

        const render = await menu.render(
          baseCtx,
          currentSession.active!,
          currentSession,
        );
        return render;
      },
      reply: async (menuId, payload, replyOptions) => {
        const render = await controller.show(menuId, payload);
        const keyboard = normalizeKeyboard(render.keyboard);
        const chatId = ensureChatId(baseCtx);
        queuePendingMessage(
          baseCtx.api,
          createPendingEntry({
            kind: "send",
            key: currentKey,
            menuId,
            chatId,
            text: render.text,
            keyboard,
            payload,
            path: currentSession.active?.path ?? [menuId],
            options: replyOptions,
          }),
        );
        const response = await baseCtx.api.sendMessage(
          chatId,
          render.text,
          {
            ...(replyOptions ?? {}),
            reply_markup: toReplyMarkup(keyboard),
          } as Parameters<typeof baseCtx.api.sendMessage>[2],
        );
        const refreshed = await storage.read(currentKey);
        currentSession = refreshed.session;
        return response;
      },
      edit: async (menuId, payload, editOptions) => {
        const render = await controller.show(menuId, payload, { stack: false });
        const keyboard = normalizeKeyboard(render.keyboard);
        const {
          messageId: overrideMessageId,
          chatId: overrideChatId,
          ...rest
        } = editOptions ?? {};
        const chatId = overrideChatId ?? baseCtx.chat?.id;
        const messageId = overrideMessageId ?? currentSession.active?.messageId;
        if (chatId === undefined || messageId === undefined) {
          throw new Error(
            "menuMessage.edit requires a known message id and chat id",
          );
        }
        queuePendingMessage(
          baseCtx.api,
          createPendingEntry({
            kind: "edit",
            key: currentKey,
            menuId,
            chatId,
            text: render.text,
            keyboard,
            payload,
            path: currentSession.active?.path ?? [menuId],
            options: rest,
            messageId,
          }),
        );
        const result = await baseCtx.api.editMessageText(
          chatId,
          messageId,
          render.text,
          {
            ...(rest as Record<string, unknown>),
            reply_markup: toReplyMarkup(keyboard),
          } as Parameters<typeof baseCtx.api.editMessageText>[3],
        );
        const refreshed = await storage.read(currentKey);
        currentSession = refreshed.session;
        return result;
      },
      back: async (showOptions) => {
        const outcome = await storage.withSession(
          baseCtx as unknown as C,
          (draft) => {
            if (draft.history.length === 0) {
              draft.active = undefined;
              return { target: undefined as MenuHistoryEntry | undefined };
            }
            draft.history.pop();
            const targetHistory = draft.history[draft.history.length - 1];
            if (!targetHistory) {
              draft.active = undefined;
              return { target: undefined };
            }
            draft.active = {
              menuId: targetHistory.menuId,
              payload: targetHistory.payload,
              path: showOptions?.path
                ? [...showOptions.path]
                : [...targetHistory.path],
              messageId: targetHistory.messageId,
              timestamp: clock(),
            };
            return { target: targetHistory };
          },
        );
        currentKey = outcome.key;
        currentSession = outcome.session;
        const target = outcome.result.target;
        if (!target) {
          return undefined;
        }
        const menu = ensureMenuDefinition(registry, target.menuId);
        const render = await menu.render(
          baseCtx,
          currentSession.active!,
          currentSession,
        );
        return render;
      },
      clear: async () => {
        await storage.clear(baseCtx as unknown as C);
        currentSession = { history: [] };
      },
      current: () => currentSession.active,
      history: () => currentSession.history.slice(),
      buildActionData: (menuId, action, data) =>
        buildActionData(menuId, action, data, namespace),
      parseActionData: (raw) => parseActionData(raw, namespace),
    };

    baseCtx.menuMessage = controller;

    await next();
  });

  composer.on("callback_query:data", async (ctx, next) => {
    const payload = ctx.callbackQuery?.data;
    if (!payload) {
      return await next();
    }
    const action = parseActionData(payload, namespace);
    if (!action) {
      return await next();
    }
    const baseCtx = ctx as MenuContext<C>;
    const definition = registry.get(action.menuId) ??
      (baseCtx.menuMessage.current()?.menuId
        ? registry.get(baseCtx.menuMessage.current()!.menuId)
        : undefined);
    if (!definition?.onAction) {
      return await next();
    }
    await definition.onAction(baseCtx, action);
  });

  const registerTransformerFn = (api: Api<RawApi>) => {
    registerMenuTransformer(api, {
      storage,
      namespace,
      predicate: options.transformerPredicate,
      clock,
    });
  };

  return {
    composer,
    registerTransformer: registerTransformerFn,
  };
}

function buildRegistry<C extends Context>(
  menus: Iterable<MenuDefinition<C>> | Record<string, MenuDefinition<C>>,
): MenuRegistry<C> {
  const registry = new Map<string, MenuDefinition<C>>();
  if (Symbol.iterator in Object(menus)) {
    for (const definition of menus as Iterable<MenuDefinition<C>>) {
      if (!definition?.id) {
        throw new Error("Menu definitions must include an id");
      }
      if (registry.has(definition.id)) {
        throw new Error(`Duplicate menu id detected: ${definition.id}`);
      }
      registry.set(definition.id, definition);
    }
    return registry;
  }
  for (const definition of Object.values(menus)) {
    if (!definition?.id) {
      throw new Error("Menu definitions must include an id");
    }
    if (registry.has(definition.id)) {
      throw new Error(`Duplicate menu id detected: ${definition.id}`);
    }
    registry.set(definition.id, definition);
  }
  return registry;
}

function defaultKeyBuilder<C extends Context>(ctx: C): string {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) {
    throw new Error("Cannot derive menu storage key without chat context");
  }
  const fromId = ctx.from?.id ?? "anon";
  const threadId = resolveThreadId(ctx) ?? 0;
  return `${chatId}:${threadId}:${fromId}`;
}

function resolveThreadId(ctx: Context): number | undefined {
  if (
    ctx.msg && "message_thread_id" in ctx.msg &&
    typeof ctx.msg.message_thread_id === "number"
  ) {
    return ctx.msg.message_thread_id;
  }
  const callbackThread = ctx.callbackQuery?.message?.message_thread_id;
  if (typeof callbackThread === "number") {
    return callbackThread;
  }
  return undefined;
}

function ensureMenuDefinition<C extends Context>(
  registry: MenuRegistry<C>,
  id: string,
): MenuDefinition<C> {
  const definition = registry.get(id);
  if (!definition) {
    throw new Error(`Unknown menu id: ${id}`);
  }
  return definition;
}

function createMenuState(
  menuId: string,
  payload: unknown,
  previous: MenuState | undefined,
  options: MenuShowOptions | undefined,
  clock: () => number,
): MenuState {
  const path = resolvePath(previous, menuId, options);
  return {
    menuId,
    payload,
    path,
    messageId: previous?.messageId,
    timestamp: clock(),
  };
}

function resolvePath(
  previous: MenuState | undefined,
  menuId: string,
  options: MenuShowOptions | undefined,
): ReadonlyArray<string> {
  if (options?.path) {
    return [...options.path];
  }
  const previousPath = previous?.path ?? [];
  if (options?.stack === false && previousPath.length > 0) {
    return [...previousPath.slice(0, previousPath.length - 1), menuId];
  }
  return [...previousPath, menuId];
}

function ensureChatId(ctx: Context): number | string {
  const chatId = ctx.chat?.id;
  if (chatId === undefined) {
    throw new Error("Menu operations require a chat context");
  }
  return chatId;
}

interface PendingEntryParams {
  kind: PendingMenuMessage["kind"];
  key: string;
  menuId: string;
  chatId: string | number;
  text: string;
  keyboard?: MenuRenderResult["keyboard"];
  payload?: unknown;
  path: ReadonlyArray<string>;
  options?: Record<string, unknown>;
  messageId?: number;
}

function createPendingEntry(params: PendingEntryParams): PendingMenuMessage {
  return {
    kind: params.kind,
    key: params.key,
    menuId: params.menuId,
    chatId: params.chatId,
    text: params.text,
    keyboard: params.keyboard,
    payload: params.payload,
    path: params.path,
    options: params.options,
    messageId: params.messageId,
  };
}
