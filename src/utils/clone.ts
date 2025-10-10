import type { MenuHistoryEntry, MenuSession } from "../types.ts";

export function cloneHistory(
  history: ReadonlyArray<MenuHistoryEntry>,
): MenuHistoryEntry[] {
  return history.map((entry) => ({
    ...entry,
    keyboard: entry.keyboard
      ? entry.keyboard.map((row) => row.map((button) => ({ ...button })))
      : undefined,
    buttons: entry.buttons.map((button) => ({ ...button })),
  }));
}

export function cloneSession(session: MenuSession): MenuSession {
  return {
    active: session.active
      ? {
        ...session.active,
        path: [...session.active.path],
        buttons: session.active.buttons.map((button) => ({ ...button })),
      }
      : undefined,
    history: cloneHistory(session.history),
  };
}

export function structuredCloneFallback<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function ensureArrayClone(
  history: ReadonlyArray<MenuHistoryEntry>,
): MenuHistoryEntry[] {
  return cloneHistory(history);
}
