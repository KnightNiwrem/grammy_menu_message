# Feature Specification: Grammy Menu Message Plugin

**Feature Branch**: `001-create-a-plugin`  
**Created**: 2025-10-03  
**Status**: Clarified  
**Input**: User description: "Create a plugin library for grammy for sending and managing menus with inline keyboards, including pagination and navigation history"

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

## Clarifications

### Session 2025-10-04
- Q: What happens when a user tries to navigate to a page that doesn't exist (e.g., page 100 when only 3 pages exist)? → A: This only occurs if underlying paginated resources have changed (fewer options than when menu was rendered). Plugin should reset to page 1.
- Q: Menu data cleanup/retention policy? → A: Hybrid - automatic timeout + manual cleanup option. Plugin should also allow developers to define maximum number of active menu messages to store per chat.
- Q: Menu validation scope for button count and message text length? → A: No validation - let Telegram API return errors naturally. For callback data, plugin uses UUID mapping to actual data (stored internally), ensuring 64-byte limit is never violated.
- Q: Event/hook types for menu interactions? → A: Navigation events (onNavigate, onBack, onPageChange), lifecycle events (onMenuSend, onMenuUpdate, onMenuDelete), custom button handlers, and menu-specific error events (onMenuError), excluding Telegram API errors.
- Q: Memory limits per user or per bot instance? → A: No explicit memory limits. Memory is naturally bounded by configurable limits: navigation history depth, max stored menus per chat, and staleness/timeout settings.
- Q: Default navigation history depth limit? → A: 200 levels (configurable by developers).

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A bot developer wants to create an interactive menu system for their Telegram bot. They need to send menus with inline keyboard buttons that users can click to navigate through different pages of content (pagination) and go back to previous menus (navigation history). The plugin should handle sending menu messages, updating them when users interact with buttons, and maintaining the state needed for navigation.

### Acceptance Scenarios
1. **Given** a bot developer has integrated the plugin, **When** they send a menu with multiple pages of items, **Then** users should see pagination buttons (next/previous) and be able to navigate through pages smoothly.

2. **Given** a user is viewing a submenu, **When** they click a "back" or navigation button, **Then** the menu should update to show the previous menu they were viewing.

3. **Given** a menu is displayed to a user, **When** they click an inline keyboard button, **Then** the plugin should automatically handle the callback query and update the menu message accordingly.

4. **Given** a bot developer defines a menu structure, **When** a user interacts with the menu, **Then** the plugin should manage message storage and retrieval without the developer needing to manually track message IDs.

5. **Given** multiple users are interacting with menus simultaneously, **When** each user navigates their own menu, **Then** the plugin should maintain separate navigation states for each user without interference.

### Edge Cases
- When underlying paginated resources change (fewer items than when menu was rendered), causing a user's current page to become invalid, the plugin MUST reset to page 1.
- How does the system handle when a menu message is deleted from Telegram but the plugin still has it stored?
- What happens when a user clicks a button on an outdated menu (e.g., after the bot has restarted)?
- How does the plugin handle when Telegram rate limits prevent immediate message updates?
- What happens when navigation history becomes very deep (e.g., 50+ levels deep)?
- How does the system handle concurrent button clicks from the same user on the same menu?

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Plugin MUST provide an API for bot developers to define and send menu messages with inline keyboards
- **FR-002**: Plugin MUST automatically store sent menu messages for later reference and updates
- **FR-003**: Plugin MUST support pagination functionality, allowing menus to display content across multiple pages with next/previous navigation
- **FR-004**: Plugin MUST maintain navigation history so users can navigate back to previous menus
- **FR-005**: Plugin MUST automatically handle callback queries from inline keyboard button presses
- **FR-006**: Plugin MUST update existing menu messages rather than sending new ones when users navigate
- **FR-007**: Plugin MUST maintain separate menu states for different users to prevent interference
- **FR-008**: Plugin MUST provide clear error messages when menu operations fail (e.g., message not found, Telegram API errors)
- **FR-009**: Plugin MUST allow bot developers to customize menu content, button layouts, and navigation behavior
- **FR-009a**: Plugin MUST reset to page 1 when a user's current page becomes invalid due to underlying resource changes
- **FR-010**: Plugin MUST be compatible with grammy's middleware system and not interfere with other plugins
- **FR-011**: Plugin MUST handle cleanup of stored menu data to prevent memory leaks using a hybrid approach: automatic cleanup after configurable timeout period of inactivity AND manual cleanup methods for developers
- **FR-011a**: Plugin MUST allow developers to configure the maximum number of active menu messages to store and manage per chat
- **FR-012**: Plugin MUST use UUID-to-data mapping for callback data to ensure Telegram's 64-byte callback data limit is never violated
- **FR-012a**: Plugin MUST allow Telegram API to naturally return errors for button count or message text length violations (no pre-validation required)
- **FR-013**: Plugin MUST expose events or hooks for bot developers to react to menu interactions including:
  - Navigation events: onNavigate, onBack, onPageChange
  - Lifecycle events: onMenuSend, onMenuUpdate, onMenuDelete
  - Custom button handlers: ability to attach handlers to specific buttons
  - Menu error events: onMenuError (plugin-specific errors only, excluding Telegram API errors)

### Key Entities *(include if feature involves data)*
- **Menu**: Represents a displayable menu with content and inline keyboard buttons; has a unique identifier and contains the message content and keyboard layout
- **Menu Message**: Represents a sent Telegram message displaying a menu; contains Telegram message ID, chat ID, and links to the Menu it displays
- **Navigation History**: Represents the sequence of menus a user has visited; tracks user ID, menu stack, and current position for back navigation
- **Page State**: Represents the current page number within a paginated menu; tracks which subset of content is currently displayed
- **Callback Data Mapping**: Maps UUIDs to actual callback data; ensures callback data sent to Telegram never exceeds 64-byte limit while preserving full data internally

### Performance Requirements *(include if performance-critical)*
- **Response Time**: Menu updates MUST complete within 500ms under normal Telegram API conditions
- **Throughput**: Plugin MUST handle at least 100 concurrent menu interactions without degradation
- **Memory**: Memory usage is bounded by configurable limits: navigation history depth, maximum stored menus per chat, and staleness timeout settings
- **Telegram Limits**: Plugin MUST respect Telegram's rate limits (30 messages/second for bots) and provide queuing or backoff mechanisms
- **Navigation History**: Plugin MUST allow developers to configure navigation history depth limit (default: 200 levels) to control memory growth

### Quality Requirements *(mandatory for plugin library)*
- **Type Safety**: All public APIs must be fully typed with TypeScript
- **Documentation**: All public APIs must have JSDoc comments with usage examples
- **Testing**: Minimum 90% code coverage for public APIs, 100% for critical paths (menu rendering, message handling)
- **Backward Compatibility**: Follow semantic versioning strictly; breaking changes only in major versions
- **No External Dependencies**: Plugin must not require external runtime dependencies beyond grammy core and Deno standard library
- **Test-First Development**: All features must be developed using TDD (Test-Driven Development) methodology

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for plugin library consumers (bot developers)
- [ ] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [x] Performance requirements specified if applicable
- [x] Quality standards referenced from constitution

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Performance requirements defined (if applicable)
- [x] Quality requirements included
- [x] Review checklist passed (all clarifications resolved)

---
