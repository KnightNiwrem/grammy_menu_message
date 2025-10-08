# Data Model

## Entity: MenuTemplate
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `id` | `string` | Developer-provided unique identifier for the template. | Must be stable; duplicates rejected (FR-002). |
| `render` | `(ctx: MenuRenderContext) => Promise<MenuRenderResult>` | Produces the concrete menu message text, keyboard layout, and optional pagination metadata. | Must handle optional arguments; may throw typed errors on invalid input. |
| `onAction` | `(action: MenuActionPayload, ctx: MenuActionContext) => Promise<MenuActionResult>` | Handles button taps resolved from UUID payloads. | Must be idempotent and guard against expired payloads (FR-022–FR-027). |
| `options` | `MenuTemplateOptions` | Declarative configuration (pagination helpers, default history policy overrides, hook handlers). | Optional; defaults provided by manager. |

## Entity: MenuRenderContext
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `segmentationKey` | `string` | Resolved key used to isolate history/state. | Derived from developer key function; immutable per render. |
| `args` | `MenuArguments` | Template-specific arguments used to parameterize rendering. | Persisted with history entries (FR-014). |
| `history` | `Readonly<MenuHistoryStack>` | Current history snapshot for the segmentation key. | Read-only to templates; mutations go through manager. |
| `pagination` | `PaginationState | undefined` | Current pagination state when applicable. | Must respect template-defined bounds (FR-011). |

## Entity: MenuRenderResult
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `text` | `string` | Final message body shown to the user. | Must respect Telegram length constraints; manager surfaces errors if exceeded. |
| `keyboard` | `InlineKeyboardSchema` | Declarative keyboard rows referencing UUID handles for actions. | Max 3 columns per row, ≤6 buttons per screen per Constitution Principle III. |
| `actions` | `MenuActionBinding[]` | Opaque payloads (target template, pagination commands, custom handlers) paired with display metadata. | Each binding generates one UUID; stored until TTL/depth pruning. |
| `metadata` | `MenuRenderMetadata` | Additional details (timestamp, default next action, optional TTL override). | Optional; used for analytics hooks. |

## Entity: MenuActionBinding
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `uuid` | `string` | Generated v4 UUID used in `callback_data`. | Unique per button render; maps to payload until pruned. |
| `payload` | `MenuActionPayload` | Encoded action instructions (navigate, paginate, custom). | Must be serializable by repository; no secrets in payload. |
| `label` | `string` | Button text displayed to users. | Adheres to Principle III naming and layout limits. |
| `row` | `number` | Keyboard row index. | Calculated to enforce ≤3 columns rule. |

## Entity: MenuHistoryEntry
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `templateId` | `string` | Template rendered for this stack frame. | Must correspond to registered template. |
| `args` | `MenuArguments` | Arguments used when rendering the template. | Stored verbatim to restore Back navigation (FR-007, FR-014). |
| `pagination` | `PaginationState | undefined` | Pagination context at the time of render. | Optional; ensures Next/Prev is deterministic (FR-011). |
| `renderedAt` | `Date` | Timestamp when entry was produced. | Used for TTL pruning (FR-008). |
| `callbackUuids` | `string[]` | UUIDs associated with this entry. | Expire with the entry (FR-025, FR-026). |

## Entity: MenuHistoryStack
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `entries` | `MenuHistoryEntry[]` | Ordered stack from oldest → newest. | Depth capped by configuration; operations serialized per key. |
| `depthLimit` | `number` | Configured maximum entries. | Default 200 (FR-D02); stored per key for pruning. |
| `ttl` | `number | Infinity` | Max age in milliseconds before entry expiry. | Default Infinity (FR-D02). |

## Entity: MenuActionPayload
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `kind` | `'navigate' | 'paginate' | 'custom' | 'back' | 'noop'` | Action classification for handler resolution. | `'back'` enforced to respect FR-021–FR-023. |
| `targetTemplateId` | `string | undefined` | Destination template for navigation actions. | Required when `kind === 'navigate'`; validated before execution. |
| `arguments` | `MenuArguments` | Arguments for the next render or handler. | Must be serializable. |
| `paginationCommand` | `PaginationCommand | undefined` | Instruction for paginator (next/prev page, goto). | Valid only when `kind === 'paginate'`. |

## Entity: PaginationState
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `currentPage` | `number` | Current page index (0-based). | Must stay within `[0, totalPages)`. |
| `totalPages` | `number` | Total number of pages for current data set. | Derived from template's pagination logic. |
| `pageSize` | `number` | Items per page when applicable. | Optional; templates may infer dynamically. |

## Entity: MenuManagerConfig
| Field | Type | Description | Constraints |
| --- | --- | --- | --- |
| `segmentationKey` | `(ctx: UpdateContext) => string | Promise<string>` | Function that resolves the key for state isolation. | Must default to "global" if developer omits (FR-D01). |
| `historyDepth` | `number` | Max entries per key stack. | Default 200; validated to be ≥1. |
| `historyTtl` | `number | Infinity` | Max age before pruning entries. | Default Infinity; TTL enforced during reads/writes. |
| `hooks` | `Partial<MenuLifecycleHooks>` | Lifecycle observer callbacks. | Optional; executed sequentially with error handling. |
| `repository` | `MenuHistoryRepository` | Persistence abstraction bridging to StorageAdapter. | Required; operations serialized per key (FR-010). |

## Entity Relationships
- `MenuTemplateManager` aggregates many `MenuTemplate` objects and uses `MenuHistoryRepository` for persistence.
- `MenuHistoryRepository` reads/writes `MenuHistoryStack` and `CallbackPayload` records per segmentation key within a single serialized transaction.
- `MenuTemplate` implementations produce `MenuRenderResult`, which the manager converts into API payloads and life-cycle events.
- `MenuActionPayload` objects point to target templates or pagination state and are resolved by the manager when consumers interact with inline keyboards.
- `MenuLifecycleHooks` (not shown) wrap events (`beforeRender`, `afterRender`, `beforeNavigate`, `afterNavigate`, `onError`) for observability, echoing FR-017 requirements.
