import type { Context, StorageAdapter } from "../../deps.deno.ts";
import type {
  InternalMenuSessionSerializer,
  MaybePromise,
  MenuSession,
  MenuSessionSerializer,
  MenuStorageKeyBuilder,
} from "../types.ts";

import { cloneSession, structuredCloneFallback } from "../utils/clone.ts";

const EMPTY_SESSION: MenuSession = { history: [] };

function createDefaultSerializer(): InternalMenuSessionSerializer<MenuSession> {
  return {
    serialize(session) {
      return structuredCloneFallback(session);
    },
    deserialize(value) {
      if (!value) {
        return { history: [] };
      }
      return cloneSession(value as MenuSession);
    },
    clone(session) {
      return cloneSession(session);
    },
  };
}

export class MenuStorage<C extends Context, TStored> {
  #adapter;
  #keyBuilder: MenuStorageKeyBuilder<C>;
  #serializer: InternalMenuSessionSerializer<TStored>;
  #historyLimit?: number;

  constructor(
    adapter: StorageAdapter<TStored>,
    keyBuilder: MenuStorageKeyBuilder<C>,
    serializer?: MenuSessionSerializer<TStored>,
    historyLimit?: number,
  ) {
    this.#adapter = adapter;
    this.#keyBuilder = keyBuilder;
    this.#serializer = serializer
      ? {
        ...serializer,
        clone: (session) =>
          serializer.deserialize(serializer.serialize(session)),
      }
      : (createDefaultSerializer() as InternalMenuSessionSerializer<TStored>);
    this.#historyLimit = historyLimit;
  }

  async key(ctx: C): Promise<string> {
    return await this.#keyBuilder(ctx);
  }

  async read(ctx: C): Promise<{ key: string; session: MenuSession }>;
  async read(key: string): Promise<{ key: string; session: MenuSession }>;
  async read(
    input: C | string,
  ): Promise<{ key: string; session: MenuSession }> {
    const key = typeof input === "string"
      ? input
      : await this.#keyBuilder(input);
    const raw = await this.#adapter.read(key);
    if (raw === undefined) {
      return { key, session: cloneSession(EMPTY_SESSION) };
    }
    const session = this.#serializer.deserialize(raw);
    return {
      key,
      session: cloneSession(session),
    };
  }

  async write(key: string, session: MenuSession): Promise<void> {
    this.#enforceHistoryLimit(session);
    await this.#adapter.write(key, this.#serializer.serialize(session));
  }

  async save(ctx: C, session: MenuSession): Promise<void> {
    const { key } = await this.read(ctx);
    await this.write(key, session);
  }

  async clear(ctx: C): Promise<void> {
    const key = await this.#keyBuilder(ctx);
    await this.#adapter.delete(key);
  }

  async withSession<R>(
    ctx: C,
    updater: (session: MenuSession) => MaybePromise<R>,
  ): Promise<{ key: string; session: MenuSession; result: R }> {
    const { key, session } = await this.read(ctx);
    const draft = this.#serializer.clone(session);
    const result = await updater(draft);
    if (!draft.active && draft.history.length === 0) {
      await this.#adapter.delete(key);
    } else {
      await this.write(key, draft);
    }
    return { key, session: draft, result };
  }

  #enforceHistoryLimit(session: MenuSession) {
    if (!this.#historyLimit || this.#historyLimit < 1) {
      return;
    }
    if (session.history.length > this.#historyLimit) {
      session.history.splice(0, session.history.length - this.#historyLimit);
    }
  }
}
