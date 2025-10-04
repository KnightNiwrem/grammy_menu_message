# API Contract: Paginator

**Version**: 1.0.0  
**Status**: Draft  
**Last Updated**: 2025-10-04

## Overview

`Paginator` is a utility class for creating paginated menus. It handles splitting items into pages, generating navigation buttons, and rendering page-specific content.

---

## Class: Paginator<T>

Generic class for paginating items of type `T`.

### Constructor

```typescript
constructor(options: PaginatorOptions<T>)
```

**Options**:
```typescript
interface PaginatorOptions<T> {
  /** Items to paginate */
  items: T[];
  
  /** Number of items per page (default: 5) */
  pageSize?: number;
  
  /** Function to render a single item */
  renderItem: (item: T, index: number) => string;
  
  /** Optional function to render the entire page */
  renderPage?: (items: string[], page: number, totalPages: number) => string;
  
  /** Navigation button configuration */
  navigation?: NavigationConfig;
}

interface NavigationConfig {
  /** Text for "previous page" button (default: "◀️ Previous") */
  prevText?: string;
  
  /** Text for "next page" button (default: "Next ▶️") */
  nextText?: string;
  
  /** Text for "first page" button (default: "⏮️ First") */
  firstText?: string;
  
  /** Text for "last page" button (default: "Last ⏭️") */
  lastText?: string;
  
  /** Show first/last buttons (default: true) */
  showFirstLast?: boolean;
  
  /** Show page indicator (default: true) */
  showPageIndicator?: boolean;
  
  /** Page indicator format (default: "Page {current}/{total}") */
  pageIndicatorFormat?: string;
}
```

**Example**:
```typescript
const items = ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6"];

const paginator = new Paginator({
  items,
  pageSize: 2,
  renderItem: (item, index) => `${index + 1}. ${item}`,
  renderPage: (items, page, total) => 
    `Page ${page}/${total}\n\n${items.join("\n")}`,
});
```

---

## Methods

### getTotalPages()

Returns the total number of pages.

```typescript
getTotalPages(): number
```

**Returns**: `number` - Total pages (minimum 1)

**Example**:
```typescript
const total = paginator.getTotalPages();
console.log(`Total pages: ${total}`);
```

---

### getPage()

Returns the items for a specific page.

```typescript
getPage(page: number): T[]
```

**Parameters**:
- `page: number` - Page number (1-indexed)

**Returns**: `T[]` - Items on the requested page

**Throws**:
- `InvalidPageError` - If page number is out of bounds

**Example**:
```typescript
const pageItems = paginator.getPage(2);
console.log("Items on page 2:", pageItems);
```

---

### renderPage()

Renders the content for a specific page.

```typescript
renderPage(page: number): string
```

**Parameters**:
- `page: number` - Page number (1-indexed)

**Returns**: `string` - Rendered page content

**Throws**:
- `InvalidPageError` - If page number is out of bounds

**Example**:
```typescript
const content = paginator.renderPage(1);
console.log(content);
// Output:
// Page 1/3
//
// 1. Item 1
// 2. Item 2
```

---

### generateKeyboard()

Generates an inline keyboard with pagination buttons.

```typescript
generateKeyboard(currentPage: number): KeyboardDefinition
```

**Parameters**:
- `currentPage: number` - Current page number (1-indexed)

**Returns**: `KeyboardDefinition` - Keyboard with navigation buttons

**Button Logic**:
- First page: Hide "Previous" and "First" buttons
- Last page: Hide "Next" and "Last" buttons
- Single page: No navigation buttons
- Page indicator always shown (if enabled)

**Example**:
```typescript
const keyboard = paginator.generateKeyboard(2);
// Returns keyboard with: [First] [Previous] [Page 2/3] [Next] [Last]
```

---

### reset()

Updates the paginator with new items.

```typescript
reset(items: T[]): void
```

**Parameters**:
- `items: T[]` - New items to paginate

**Side Effects**:
- Replaces current items
- Recalculates total pages

**Example**:
```typescript
paginator.reset(["New 1", "New 2", "New 3"]);
```

---

### setPageSize()

Changes the page size.

```typescript
setPageSize(size: number): void
```

**Parameters**:
- `size: number` - New page size (must be > 0)

**Throws**:
- `InvalidArgumentError` - If size <= 0

**Side Effects**:
- Updates page size
- Recalculates total pages

**Example**:
```typescript
paginator.setPageSize(10);
```

---

## Helper Functions

### createPaginatedMenu()

Factory function for creating a paginated menu definition.

```typescript
function createPaginatedMenu<T>(
  id: string,
  paginator: Paginator<T>,
  options?: PaginatedMenuOptions
): MenuDefinition
```

**Parameters**:
- `id: string` - Menu ID
- `paginator: Paginator<T>` - Paginator instance
- `options?: PaginatedMenuOptions` - Additional options

```typescript
interface PaginatedMenuOptions {
  /** Additional buttons to include above pagination */
  headerButtons?: ButtonRow[];
  
  /** Additional buttons to include below pagination */
  footerButtons?: ButtonRow[];
  
  /** Parse mode for content */
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
}
```

**Returns**: `MenuDefinition` - Complete menu definition with pagination

**Example**:
```typescript
const menu = createPaginatedMenu("items_menu", paginator, {
  headerButtons: [
    [{ text: "Refresh", action: { type: "callback", data: { action: "refresh" } } }],
  ],
  footerButtons: [
    [{ text: "Back", action: { type: "back" } }],
  ],
});
```

---

## Usage Patterns

### Basic Pagination

```typescript
import { Paginator, createPaginatedMenu } from "./mod.ts";
import { MenuManager } from "./mod.ts";

const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

const paginator = new Paginator({
  items,
  pageSize: 5,
  renderItem: (item) => `• ${item}`,
});

const menu = createPaginatedMenu("list_menu", paginator);

await menuManager.send(chatId, menu);
```

---

### Dynamic Items with Reset

```typescript
// Initial items
const paginator = new Paginator({
  items: await fetchItems(),
  pageSize: 10,
  renderItem: (item) => item.name,
});

// Later, refresh items
paginator.reset(await fetchItems());

// Check if current page is still valid
const currentPage = menuState.currentPage;
if (currentPage > paginator.getTotalPages()) {
  // Reset to page 1 as per requirement
  await menuManager.changePage(chatId, messageId, 1);
}
```

---

### Custom Page Rendering

```typescript
const paginator = new Paginator({
  items: products,
  pageSize: 3,
  renderItem: (product) => 
    `${product.name} - $${product.price}`,
  renderPage: (items, page, total) => {
    const header = `🛍️ Product Catalog (Page ${page}/${total})\n\n`;
    const footer = `\nTotal products: ${products.length}`;
    return header + items.join("\n") + footer;
  },
});
```

---

### Custom Navigation Buttons

```typescript
const paginator = new Paginator({
  items: data,
  pageSize: 10,
  renderItem: (item) => item.toString(),
  navigation: {
    prevText: "⬅️ Назад",        // Russian
    nextText: "Вперёд ➡️",
    firstText: "⏮️ Начало",
    lastText: "Конец ⏭️",
    showFirstLast: false,        // Hide first/last
    pageIndicatorFormat: "Страница {current} из {total}",
  },
});
```

---

### Integration with MenuManager Events

```typescript
menuManager.on("pageChange", async ({ state, page }) => {
  console.log(`User switched to page ${page}`);
  
  // Lazy load more items if near the end
  if (page >= paginator.getTotalPages() - 1) {
    const moreItems = await fetchMoreItems();
    paginator.reset([...paginator.getAllItems(), ...moreItems]);
  }
});
```

---

## Edge Cases

### Empty Items
```typescript
const paginator = new Paginator({
  items: [],
  pageSize: 10,
  renderItem: (item) => item.toString(),
});

paginator.getTotalPages(); // Returns 1
paginator.renderPage(1);   // Returns "" (empty page)
paginator.generateKeyboard(1); // Returns empty keyboard (no nav buttons)
```

### Single Item
```typescript
const paginator = new Paginator({
  items: ["Only item"],
  pageSize: 10,
  renderItem: (item) => item,
});

paginator.getTotalPages(); // Returns 1
paginator.generateKeyboard(1); // No navigation buttons
```

### Page Out of Bounds
```typescript
try {
  paginator.getPage(999);
} catch (error) {
  // InvalidPageError: Page 999 out of bounds (1-3)
}
```

---

## Contract Tests

See `tests/contract/paginator.test.ts` for comprehensive contract tests validating:
- Correct page count calculation
- Proper item distribution across pages
- Navigation button generation logic
- Edge case handling (empty, single item, out of bounds)
- Integration with MenuDefinition
