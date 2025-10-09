import type {
  Api,
  ApiCallFn,
  Context,
  RawApi,
  Transformer,
} from "../../deps.deno.ts";
import type { MenuStorage } from "../storage/menu_storage.ts";
import {
  MenuSession,
  MenuTransformerPredicate,
  PendingMenuMessage,
} from "../types.ts";
import { detectMenuIdFromKeyboard, normalizeKeyboard } from "./renderer.ts";

const REGISTERED = new WeakSet<Api<RawApi>>();
const PENDING = new WeakMap<Api<RawApi>, PendingMenuMessage[]>();

export interface TransformerOptions<C extends Context, TStored> {
  storage: MenuStorage<C, TStored>;
  namespace: string;
  predicate?: MenuTransformerPredicate;
  clock: () => number;
}

export function registerMenuTransformer<C extends Context, TStored>(
  api: Api<RawApi>,
  options: TransformerOptions<C, TStored>,
): void {
  if (REGISTERED.has(api)) {
    return;
  }

  api.config.use(
    ((prev: ApiCallFn<RawApi>) => {
      const transformer: typeof prev = async (
        method,
        payload,
        signal,
      ) => {
        const result = await prev(method, payload, signal);
        try {
          await handleApiCall(
            api,
            options,
            method as string,
            payload as Record<string, unknown>,
            result,
          );
        } catch {
          // Swallow errors to avoid breaking Bot API calls.
        }
        return result;
      };
      return transformer;
    }) as unknown as Transformer<RawApi>,
  );

  REGISTERED.add(api);
}

export function queuePendingMessage(
  api: Api<RawApi>,
  entry: PendingMenuMessage,
): void {
  const queue = getQueue(api);
  queue.push(entry);
}

function getQueue(api: Api<RawApi>): PendingMenuMessage[] {
  let queue = PENDING.get(api);
  if (!queue) {
    queue = [];
    PENDING.set(api, queue);
  }
  return queue;
}

async function handleApiCall<C extends Context, TStored>(
  api: Api<RawApi>,
  options: TransformerOptions<C, TStored>,
  method: string,
  payload: Record<string, unknown>,
  result: unknown,
): Promise<void> {
  if (!isMenuRelevant(options, method, payload, result)) {
    return;
  }

  const entry = shiftMatchingEntry(api, method, payload);
  if (!entry) {
    return;
  }

  const messageId = extractMessageId(method, payload, result);
  if (messageId === undefined) {
    return;
  }

  const { storage, clock } = options;
  const { session } = await storage.read(entry.key);
  const timestamp = clock();
  const keyboardMatrix = normalizeKeyboard(entry.keyboard);
  const historyEntry = {
    menuId: entry.menuId,
    messageId,
    text: entry.text,
    keyboard: keyboardMatrix,
    payload: entry.payload,
    path: entry.path,
    timestamp,
  };

  if (entry.kind === "edit" && session.history.length > 0) {
    session.history[session.history.length - 1] = historyEntry;
  } else {
    session.history.push(historyEntry);
  }

  if (session.active && session.active.menuId === entry.menuId) {
    session.active = {
      ...session.active,
      messageId,
      payload: entry.payload,
      timestamp,
    };
  }

  await storage.write(entry.key, session);
}

function isMenuRelevant<C extends Context, TStored>(
  options: TransformerOptions<C, TStored>,
  method: string,
  payload: Record<string, unknown>,
  result: unknown,
): boolean {
  if (options.predicate && !options.predicate(method, payload)) {
    return false;
  }
  if (method === "sendMessage" || method === "editMessageText") {
    const inlineKeyboard = extractKeyboard(payload, result);
    return !!detectMenuIdFromKeyboard(inlineKeyboard, options.namespace);
  }
  return false;
}

function extractKeyboard(
  payload: Record<string, unknown>,
  result: unknown,
): MenuSession["history"][number]["keyboard"] | undefined {
  const direct = payload.reply_markup as {
    inline_keyboard?: MenuSession["history"][number]["keyboard"];
  } | undefined;
  if (direct?.inline_keyboard) {
    return direct.inline_keyboard;
  }
  if (result && typeof result === "object" && "reply_markup" in result) {
    const replyMarkup = (result as Record<string, unknown>).reply_markup as {
      inline_keyboard?: MenuSession["history"][number]["keyboard"];
    } | undefined;
    return replyMarkup?.inline_keyboard;
  }
  return undefined;
}

function shiftMatchingEntry(
  api: Api<RawApi>,
  method: string,
  payload: Record<string, unknown>,
): PendingMenuMessage | undefined {
  const queue = getQueue(api);
  const chatId = (payload as { chat_id?: string | number }).chat_id;
  if (!chatId) {
    return undefined;
  }

  const index = queue.findIndex((entry) =>
    matchesEntry(entry, method, chatId, payload)
  );
  if (index === -1) {
    return undefined;
  }
  return queue.splice(index, 1)[0];
}

function matchesEntry(
  entry: PendingMenuMessage,
  method: string,
  chatId: string | number,
  payload: Record<string, unknown>,
): boolean {
  if (String(entry.chatId) !== String(chatId)) {
    return false;
  }
  if (method === "sendMessage" && entry.kind === "send") {
    return true;
  }
  if (method === "editMessageText" && entry.kind === "edit") {
    const messageId = (payload as { message_id?: number }).message_id;
    if (messageId === undefined) {
      return false;
    }
    return entry.messageId === undefined || entry.messageId === messageId;
  }
  return false;
}

function extractMessageId(
  method: string,
  payload: Record<string, unknown>,
  result: unknown,
): number | undefined {
  if (method === "sendMessage") {
    if (result && typeof result === "object" && "message_id" in result) {
      return (result as { message_id?: number }).message_id;
    }
  }
  if (method === "editMessageText") {
    const messageId = payload.message_id as number | undefined;
    if (messageId !== undefined) {
      return messageId;
    }
    if (result && typeof result === "object" && "message_id" in result) {
      return (result as { message_id?: number }).message_id;
    }
  }
  return undefined;
}
