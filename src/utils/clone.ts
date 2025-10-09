import type { MenuHistoryEntry, MenuSession } from "../types.ts";

export function cloneHistory(
  history: ReadonlyArray<MenuHistoryEntry>,
): MenuHistoryEntry[] {
  return history.map((entry) => ({
    ...entry,
    keyboard: entry.keyboard
      ? entry.keyboard.map((row) => row.map((button) => ({ ...button })))
      : undefined,
  }));
}

export function cloneSession(session: MenuSession): MenuSession {
  return {
    active: session.active
      ? {
        ...session.active,
        path: [...session.active.path],
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
