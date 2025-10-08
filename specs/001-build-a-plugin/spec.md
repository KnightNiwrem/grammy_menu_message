# Feature Specification: Menu Message Plugin for Telegram Bots

**Feature Branch**: `001-build-a-plugin`  
**Created**: 2025-10-06  
**Status**: Draft  
**Input**: User description: "Build a plugin library for grammy to create and manage messages with inline keyboards, with menu-like utility such as pagination, cross-menu navigation, and navigation history.

The user should be able to use the plugin to generate menu message template managers, which will be the primary way in which user interfaces with menu messages. The user can register templates of menu messages to the manager with a user-provided menu message template id, which tracks all known menu message templates and will use them for rendering and navigating across menus.

The user must be able to use the menu message template manager to generate a menu message, optionally given some additional arguments, which can be sent via the `reply_markup.inline_keyboard` options in methods such as `sendMessage`. The menu message contains manages both the text and inline keyboard, so the text given to `sendMessage` is ignored, and the actual menu message's text is used instead. Hence, this means that the plugin also needs a grammy `Transformer` to detect when a menu message is given to `reply_markup.inline_keyboard` so as to perform this payload interception and modification.

The menu message template manager is also in charge of saving the arguments used for generating sent menu messages to some storage, so as to keep track of navigation and rendering argument history. To accomplish this, the menu message template manager must accept a grammy `StorageAdapter`, which it will use for persisting data that must be tracked and saved.

The user must also be able to configure how deep and old the navigation history should be saved, and what kind of key (e.g. telegram chat id, or telegram user id, or something entirely custom) to segregate menu save data. The user must also be able to define pagination logic for the menu message template, if required."

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing (mandatory)

### Primary User Story
As a Telegram bot developer, I can register reusable menu templates, generate a concrete menu message (text + inline keyboard) with optional arguments, and attach it to an outgoing message so that end users can navigate between menus and pages with buttons; the library manages rendering, cross-menu navigation, and a configurable navigation history that is segregated by a developer-defined key (e.g., chat or user) with limits on depth and age.

### Acceptance Scenarios
1. Given a registered menu template, when the developer generates a menu and attaches it to an outgoing message, then the actual message text and inline keyboard sent to users come from the generated menu (any message text provided by the developer is ignored).
2. Given a menu with navigation buttons to another registered template, when a user taps a navigation button, then the destination template is rendered and shown, and the prior menu (including its render arguments) is recorded in the navigation history for the configured key.
3. Given a configured history depth limit N, when users navigate across more than N menus, then the oldest entries beyond N are pruned and back navigation returns through the most recent N entries.
4. Given a configured history age limit T, when a user attempts to go back to entries older than T, then these entries are ignored/pruned and the next eligible recent entry is used (or back is unavailable if none).
5. Given a template with pagination, when a user taps Next/Previous, then the menu re-renders with the appropriate page and the current pagination state is persisted so subsequent actions reflect the same page context.
6. Given the developer provides a custom key function to segregate history (e.g., by user), when different keys interact with menus concurrently, then their histories and current states do not interfere with each other.
7. Given templates may accept arguments at generation time, when different arguments are used, then those arguments are persisted with the history so that re-rendering (including Back) restores the correct view.
8. Given the persistence layer is temporarily unavailable, when a menu action is triggered, then the system throws an error for the developer to handle and does not write or modify any history entries.
9. Given a Back action targets an entry that has expired due to TTL, when the user taps Back, then the user is informed that history has expired (via answering the callback), the inline keyboard is edited to remove the Back button, and the pruned history is saved.
10. Given the user is currently viewing a menu entry that has already expired due to TTL, when they attempt any action, then the entire inline keyboard is removed and the message text is updated to state that the menu has expired.

### Edge Cases
- Unknown or unregistered template id referenced by a navigation action → throw an error and break the chat flow (developers are expected to use valid template ids).
- History is empty and a Back action is triggered → do not render any Back button.
- Rendered content exceeds platform limits (message length, keyboard size) → throw an error; developers are expected to keep content within limits.
- Rapid repeated button taps (duplicate actions) → handle idempotently; avoid duplicating history entries or creating race conditions.
- Cross-chat reuse or forwarding of menu messages → ensure actions are validated against the current segmentation key and rejected if mismatched.
- TTL expiry during Back navigation → answer the callback to inform the user that history expired, remove the Back button from the keyboard, and persist the pruned history.
- TTL expiry of the current entry → remove the entire inline keyboard and update message text to state that the menu has expired.

- Unknown or expired UUID mapping in `callback_data` → answer the callback to inform the user the action is invalid/expired, do not execute any action, and optionally prune related stale mapping entries.

## Requirements (mandatory)

### Functional Requirements
- FR-001: The library MUST provide a "menu template manager" that holds developer-registered menu templates, each identified by a developer-provided unique template id.
- FR-002: The manager MUST allow registering and listing templates; templates CANNOT be removed once registered. Attempts to register a duplicate id MUST be rejected with a clear error.
- FR-003: Developers MUST be able to generate a concrete menu message (containing text + inline keyboard) from a registered template, optionally supplying arguments that affect rendering.
- FR-004: When a generated menu is attached to an outgoing message, the library MUST ensure the message sent to users uses the menu's text and keyboard, ignoring any other text the developer provided for that message.
   - Clarification 2025-10-06: Interception applies to all Telegram API methods that accept `reply_markup.inline_keyboard` (send* and edit* variants).
- FR-005: Menu actions MUST support cross-menu navigation by referencing another template id (with optional arguments) so users can move between menus.
- FR-006: The library MUST maintain a navigation history per segmentation key, capturing at least: template id, render arguments, pagination state (if any), timestamp of entry, and the preceding stack order.
- FR-007: The library MUST provide a standard Back capability that returns to the previous entry in the history stack for the current key, re-rendering that prior menu with its saved arguments and state.
- FR-008: Developers MUST be able to configure history retention by depth (max entries per key) and by age (TTL). Items beyond configured limits MUST be pruned deterministically.
- FR-009: The library MUST segregate all state by a developer-defined key function (e.g., chat id, user id, or a custom composite), ensuring isolation between different keys.
- FR-010: The persistence of history and related state MUST be abstracted behind a storage interface provided by the developer; per-key operations MUST be serializable (strictly ordered, no interleaving) to avoid corruption under concurrent actions.
- FR-011: Templates MAY define pagination behavior (e.g., total items, page size, current page) and MUST be able to render pagination controls (Next/Prev, page indicators) and enforce page bounds.
- FR-012: The library is NOT responsible for validating rendered menus against platform constraints. Any platform validation errors (e.g., from Telegram) MUST be surfaced transparently to developers.
- FR-013: The library MUST throw on storage errors during actions and MUST NOT mutate or persist history when such errors occur; developers handle the error.
- FR-014: The library MUST allow developers to provide arguments at menu generation and MUST persist them to faithfully restore views during Back or when re-entering a menu.
- FR-015: The library MUST prevent cross-key leakage by verifying that any incoming action belongs to the same segmentation key context that created the menu.
- FR-016: Localization (including built-in label translations) is out of scope.
- FR-017: The library SHOULD provide hooks or events for key lifecycle moments (before render, after render, before navigate, after navigate, on error) to enable observability and customization.
- FR-018: Avoiding infinite navigation loops is out of scope. The plugin does not forbid such flows; developers are responsible for template design.
- FR-019: The library SHOULD offer utilities to assist with common pagination patterns (e.g., building page buttons, calculating ranges) while allowing full custom pagination logic.
- FR-020: The system MUST ensure idempotent handling of repeated user actions (e.g., duplicate taps) to avoid duplicate history pushes or inconsistent state.

- FR-021: The library MUST NOT render a Back control when history is empty or otherwise unavailable for the current key.
- FR-022: If a Back action targets an expired (TTL) history entry, the system MUST notify the user (by answering the callback), remove the Back control from the inline keyboard, prune and persist the updated history, and remain on the current (valid) menu.
- FR-023: If the currently viewed entry is expired, the system MUST remove the entire inline keyboard, update the message text to indicate the menu has expired, and prevent further interactions on that message.
- FR-024: Referencing an unknown/unregistered template id for navigation MUST throw and MUST NOT modify history/state.

- FR-025: Buttons MUST use opaque UUID values in `callback_data`. The library MUST maintain a server-side mapping from UUID → action payload (e.g., target template id, arguments, paging command) and MUST NOT embed sensitive or structured payloads directly in `callback_data`.
- FR-026: On incoming interactions, the library MUST resolve the UUID to its stored payload. The UUID→payload mapping MUST have the exact same lifetime as the corresponding history entry and MUST be pruned/expired together. If the UUID is unknown or expired, the action MUST NOT execute; the user MUST be informed via answering the callback (e.g., “This action is no longer available”), and the plugin MUST leave state unchanged. Cleanup MUST be deterministic and observable via hooks/events.

- FR-027: Duplicate taps on the same button after successful handling MUST be idempotently ignored without answering the callback again (silent no-op) to avoid chat spam and race conditions.

Ambiguities to clarify:
Resolved defaults and out-of-scope policies:
- FR-D01: Default segmentation key is "global" when the developer does not provide a key.
- FR-D02: Default history depth is 200; default TTL is Infinity (no expiry).
- FR-D03: Back is not automatically shown; templates may include a Back control if desired.
- FR-D04: The plugin does not enforce platform limits; platform validation errors are forwarded to developers as-is.
- FR-D05: A "Home" action is not automatic; templates may attach a Home control explicitly if desired.
- FR-D06: Localization is out of scope for the plugin.
- FR-D07: Telemetry and logging are out of scope; lifecycle events are available for developers to implement their own logging.

### Key Entities (data-oriented)
- Menu Template: A developer-defined blueprint that produces a menu message (text + inline keyboard) from optional arguments and optional pagination state; identified by a unique template id.
- Menu Message: A concrete, render-ready output consisting of text content, inline keyboard layout, and optional navigation metadata suitable for sending to end users.
- Template Manager: The central registry and runtime orchestrator for templates; generates menus, mediates navigation, and manages history per segmentation key.
- Navigation History: A per-key stack of entries representing visited menus with their arguments, pagination state, timestamps, and order.
- Segmentation Key: A developer-provided function or value used to isolate histories and state (e.g., per chat, per user, or custom domain key).
- Pagination Strategy: A pluggable definition (data and rules) that determines how paginated content is computed, rendered, and navigated.

- Callback Mapping: An opaque UUID key associated to an action payload required to process a button press; used to resolve interactions without exposing payloads in `callback_data`. Its lifetime is identical to its corresponding history entry and they are pruned/expired together.

---

## Clarifications

### Session 2025-10-06
- Q: Which Telegram API methods should the transformer intercept to replace message text and inline keyboard when a menu object is passed? → A: C (All methods that accept reply_markup.inline_keyboard)
- Q: Which storage consistency guarantees do you expect per segmentation key during concurrent actions? → A: C (Serializable per-key history)

### Session 2025-10-08
- Q: What is the encoding approach for button callback_data and how are action payloads associated? → A: Use opaque UUIDs in callback_data; the plugin stores a UUID→payload mapping and resolves it on interaction.

- Q: What is the retention policy for UUID→payload mappings relative to menu history? → A: Same lifetime as corresponding history entry; expire/prune together.

- Q: After a button action is successfully processed, how should duplicate taps on the same button be handled? → A: B (Silently ignore; no callback answer)


## Review & Acceptance Checklist
"GATE: Ensure this spec is testable and unambiguous"

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
"Updated during specification process"

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
