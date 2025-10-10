import type {
  Api,
  Composer,
  Context,
  InlineKeyboard,
  InlineKeyboardButton,
  RawApi,
  StorageAdapter,
} from "../deps.deno.ts";

export type MaybePromise<T> = T | Promise<T>;

export type InlineKeyboardMatrix = ReadonlyArray<
  ReadonlyArray<InlineKeyboardButton>
>;

export interface MenuRenderResult {
  text: string;
  keyboard?: InlineKeyboardMatrix | InlineKeyboard;
  payload?: unknown;
}

export interface MenuButtonState {
  id: string;
  menuId: string;
  action: string;
  data?: string;
}

export interface MenuRenderMetadata {
  renderId: string;
  buttons: ReadonlyArray<MenuButtonState>;
}

export interface MenuHistoryEntry extends MenuRenderMetadata {
  menuId: string;
  messageId?: number;
  text: string;
  keyboard?: InlineKeyboardMatrix;
  payload?: unknown;
  path: ReadonlyArray<string>;
  timestamp: number;
}

export interface MenuState extends MenuRenderMetadata {
  menuId: string;
  payload?: unknown;
  path: ReadonlyArray<string>;
  messageId?: number;
  timestamp: number;
}

export interface MenuSession {
  active?: MenuState;
  history: MenuHistoryEntry[];
}

export interface MenuActionPayload {
  menuId: string;
  sourceMenuId: string;
  renderId: string;
  buttonId: string;
  action: string;
  data?: string;
}

export interface MenuShowOptions {
  /**
   * When `false`, the newly rendered menu replaces the last history entry instead of stacking on top of it.
   * Defaults to `true`.
   */
  stack?: boolean;
  /**
   * Explicit path override used to represent nested navigation.
   */
  path?: ReadonlyArray<string>;
}

export type MenuReplyOptions = Record<string, unknown>;

export interface MenuEditOptions extends MenuReplyOptions {
  /**
   * Explicit message identifier; defaults to the currently tracked message when omitted.
   */
  messageId?: number;
  /**
   * Target chat identifier; defaults to the current update chat.
   */
  chatId?: number | string;
}

export interface MenuMessageController<C extends Context = Context> {
  show(
    menuId: string,
    payload?: unknown,
    options?: MenuShowOptions,
  ): Promise<MenuRenderResult>;
  reply(
    menuId: string,
    payload?: unknown,
    options?: MenuReplyOptions,
  ): Promise<unknown>;
  edit(
    menuId: string,
    payload?: unknown,
    options?: MenuEditOptions,
  ): Promise<unknown>;
  back(options?: MenuShowOptions): Promise<MenuRenderResult | undefined>;
  clear(): Promise<void>;
  current(): MenuState | undefined;
  history(): readonly MenuHistoryEntry[];
  buildActionData(menuId: string, action: string, data?: string): string;
  parseActionData(raw: string): MenuActionPayload | undefined;
}

export interface MenuMessageFlavor {
  menuMessage: MenuMessageController;
}

export type MenuContext<C extends Context> = C & MenuMessageFlavor;

export interface MenuDefinition<C extends Context = Context> {
  id: string;
  render: (
    ctx: MenuContext<C>,
    state: MenuState,
    session: MenuSession,
  ) => MaybePromise<MenuRenderResult>;
  onAction?: (
    ctx: MenuContext<C>,
    payload: MenuActionPayload,
  ) => MaybePromise<void>;
  onEnter?: (
    ctx: MenuContext<C>,
    previous: MenuSession | undefined,
  ) => MaybePromise<void>;
  onLeave?: (
    ctx: MenuContext<C>,
    next: MenuSession | undefined,
  ) => MaybePromise<void>;
}

export type MenuRegistry<C extends Context = Context> = Map<
  string,
  MenuDefinition<C>
>;

export type MenuDefinitions<C extends Context = Context> =
  | Iterable<MenuDefinition<C>>
  | Record<string, MenuDefinition<C>>;

export type MenuStorageKeyBuilder<C extends Context> = (
  ctx: C,
) => MaybePromise<string>;

export interface MenuSessionSerializer<TStored> {
  serialize(session: MenuSession): TStored;
  deserialize(value: TStored): MenuSession;
}

export interface InternalMenuSessionSerializer<TStored>
  extends MenuSessionSerializer<TStored> {
  clone(session: MenuSession): MenuSession;
}

export interface MenuTransformerPredicate {
  (method: string, payload: Record<string, unknown>): boolean;
}

export interface CreateMenuMessagePluginOptions<
  C extends Context = Context,
  TStored = MenuSession,
> {
  storage: StorageAdapter<TStored>;
  menus: Iterable<MenuDefinition<C>> | Record<string, MenuDefinition<C>>;
  keyBuilder?: MenuStorageKeyBuilder<C>;
  serializer?: MenuSessionSerializer<TStored>;
  historyLimit?: number;
  namespace?: string;
  clock?: () => number;
  transformerPredicate?: MenuTransformerPredicate;
}

export interface MenuMessagePlugin<C extends Context = Context> {
  composer: Composer<MenuContext<C>>;
  registerTransformer(api: Api<RawApi>): void;
}

export type PendingMenuMessageKind = "send" | "edit";

export interface PendingMenuMessage {
  kind: PendingMenuMessageKind;
  key: string;
  menuId: string;
  chatId: string | number;
  text: string;
  keyboard?: MenuRenderResult["keyboard"];
  payload?: unknown;
  options?: MenuReplyOptions;
  messageId?: number;
  path: ReadonlyArray<string>;
  renderId: string;
  buttons: ReadonlyArray<MenuButtonState>;
}
