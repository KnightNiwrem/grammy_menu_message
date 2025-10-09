import { InlineKeyboard } from "../../deps.deno.ts";
import type {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from "../../deps.deno.ts";
import type {
  InlineKeyboardMatrix,
  MenuActionPayload,
  MenuRenderResult,
} from "../types.ts";

export const DEFAULT_NAMESPACE = "mm" as const;
const ACTION_SEPARATOR = ":";

export function normalizeKeyboard(
  keyboard?: MenuRenderResult["keyboard"],
): InlineKeyboardMatrix | undefined {
  if (!keyboard) {
    return undefined;
  }
  if (keyboard instanceof InlineKeyboard) {
    return keyboard.inline_keyboard.map((row) =>
      row.map((button) => ({ ...button }))
    );
  }
  return keyboard.map((row) => row.map((button) => ({ ...button })));
}

export function buildActionData(
  menuId: string,
  action: string,
  data?: string,
  namespace: string = DEFAULT_NAMESPACE,
): string {
  const segments = [namespace, menuId, action];
  if (data !== undefined) {
    segments.push(data);
  }
  return segments.map((value) => encodeURIComponent(String(value))).join(
    ACTION_SEPARATOR,
  );
}

export function parseActionData(
  raw: string,
  namespace: string = DEFAULT_NAMESPACE,
): MenuActionPayload | undefined {
  if (!raw.startsWith(namespace + ACTION_SEPARATOR)) {
    return undefined;
  }
  const segments = raw.split(ACTION_SEPARATOR).map((segment) =>
    decodeURIComponent(segment)
  );
  if (segments.length < 3) {
    return undefined;
  }
  const [, menuId, action, data] = segments;
  return {
    menuId,
    action,
    data,
  };
}

export function detectMenuIdFromKeyboard(
  keyboard: InlineKeyboardMatrix | undefined,
  namespace: string = DEFAULT_NAMESPACE,
): string | undefined {
  if (!keyboard) {
    return undefined;
  }
  for (const row of keyboard) {
    for (const button of row) {
      const callbackData = extractCallbackData(button);
      if (!callbackData) {
        continue;
      }
      const parsed = parseActionData(callbackData, namespace);
      if (parsed) {
        return parsed.menuId;
      }
    }
  }
  return undefined;
}

export function toReplyMarkup(
  keyboard?: InlineKeyboardMatrix,
): InlineKeyboardMarkup | undefined {
  if (!keyboard) {
    return undefined;
  }
  const rows: InlineKeyboardButton[][] = [];
  for (const row of keyboard) {
    const buttons: InlineKeyboardButton[] = [];
    for (const button of row) {
      buttons.push({ ...button });
    }
    rows.push(buttons);
  }
  return { inline_keyboard: rows };
}

function extractCallbackData(button: InlineKeyboardButton): string | undefined {
  if ("callback_data" in button && typeof button.callback_data === "string") {
    return button.callback_data;
  }
  return undefined;
}
