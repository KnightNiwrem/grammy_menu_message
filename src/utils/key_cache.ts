import type { Api, RawApi } from "../../deps.deno.ts";

const KEY_CACHE = new WeakMap<Api<RawApi>, Map<string, string>>();

export function rememberStorageKey(
  api: Api<RawApi>,
  chatId: string | number,
  key: string,
): void {
  const cache = getOrCreateCache(api);
  cache.set(String(chatId), key);
}

export function lookupStorageKey(
  api: Api<RawApi>,
  chatId: string | number,
): string | undefined {
  const cache = KEY_CACHE.get(api);
  return cache?.get(String(chatId));
}

function getOrCreateCache(api: Api<RawApi>): Map<string, string> {
  let cache = KEY_CACHE.get(api);
  if (!cache) {
    cache = new Map();
    KEY_CACHE.set(api, cache);
  }
  return cache;
}
