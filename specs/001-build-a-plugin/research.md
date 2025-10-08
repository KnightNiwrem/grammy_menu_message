# Phase 0 Research Findings

## Decision: Provide a `MenuTemplateManager` with deterministic orchestration
- **Decision**: Implement a `MenuTemplateManager` class that owns template registration, menu generation, lifecycle hooks, and navigation history orchestration.
- **Rationale**: Centralizing orchestration keeps registration, rendering, navigation, and transformer wiring consistent with Principle III (Plugin UX & API Consistency). It also enables per-key serialization guarantees required by FR-010 and simplifies enforcing invariants such as duplicate template rejection (FR-002) and Back availability (FR-021).
- **Alternatives Considered**:
  - *Decentralized composables per template*: rejected because individual template objects would each need to coordinate history persistence, increasing the risk of divergence from constitutional UX rules.
  - *Static helper functions*: insufficient for managing stateful history, transformer attachment, and lifecycle hooks across multiple bot instances.

## Decision: Use a `MenuHistoryRepository` abstraction over grammy `StorageAdapter`
- **Decision**: Introduce a repository façade that wraps the developer-provided `StorageAdapter`, enforcing serialized per-key operations and shared lifecycle between history stacks and callback UUID mappings.
- **Rationale**: FR-006 to FR-015 require deterministic pruning, isolation by segmentation key, and alignment between history entries and callback payloads. A repository layer lets us normalize adapter differences (in-memory, Redis, SQL) and inject key-level mutexes without violating storage contracts.
- **Alternatives Considered**:
  - *Direct `StorageAdapter` calls from manager methods*: would duplicate concurrency control in multiple places and make it harder to enforce atomic mutations across history + UUID mappings.
  - *Custom persistence implementation*: conflicts with requirement that developers supply adapters and would limit compatibility.

## Decision: Model callback actions with opaque UUID payload registries
- **Decision**: Generate v4 UUIDs per actionable button, store payloads alongside history entries, and expire them together through the repository.
- **Rationale**: Aligns with FR-025 through FR-027, keeping payloads off the wire and guaranteeing TTL parity with history entries. Storing both history and callbacks in a single repository transaction also improves idempotency on retries (FR-020).
- **Alternatives Considered**:
  - *Embedding payload data in `callback_data`*: violates FR-025 and risks leaking sensitive data.
  - *Independent store for UUID payloads*: complicates pruning because TTLs could diverge without extra coordination.

## Decision: Intercept outgoing payloads via grammy transformer middleware
- **Decision**: Ship a transformer helper (e.g., `menuMessageInterceptor(manager)`) that inspects API method payloads for menu envelopes and swaps text + keyboard before dispatch.
- **Rationale**: FR-004 requires interception across all methods that accept `reply_markup.inline_keyboard`. Transformers run at the API layer, covering `send*` and `edit*` calls consistently without forcing developers to wrap every API call manually.
- **Alternatives Considered**:
  - *Composer-level middleware*: would only apply to update handling and miss direct API calls from developer code.
  - *Custom API client*: overly invasive; developers expect to keep `bot.api` untouched beyond transformer configuration.

## Decision: Publish runtime-agnostic modules with deno2node
- **Decision**: Keep source in `src/` with runtime guards abstracted behind `deps.deno.ts` / `deps.node.ts`, then bundle a Node build via deno2node during release.
- **Rationale**: Constitution Principle IV mandates dual-runtime support. Splitting dependency shims keeps TypeScript surfaces identical while allowing Node builds to polyfill `crypto.randomUUID` and storage adapters.
- **Alternatives Considered**:
  - *Deno-only release*: violates Constitution IV and would block npm distribution.
  - *Maintaining separate codebases*: unnecessary duplication and high maintenance overhead.
