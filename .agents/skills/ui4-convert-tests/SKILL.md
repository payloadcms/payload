---
name: ui4-convert-tests
description: Use when UI changes are complete and e2e tests need updating. Analyzes what changed in UI components and systematically finds/fixes affected tests.
---

# UI4 Convert Tests

## Overview

After completing UI changes, this skill systematically identifies and fixes affected e2e tests. It analyzes the diff to understand _what kind_ of changes were made (not just which files), then finds tests that need updates.

## When to Use

- UI changes are finalized and ready for test fixes
- CI is failing on tests due to your UI changes
- Before opening a PR to ensure tests pass

## Process

### Step 1: Analyze What Changed

**Goal:** Understand the _nature_ of your changes to predict test impact.

```bash
# Get changed UI files
git diff main --name-only -- 'packages/ui/src/**/*.tsx' 'packages/ui/src/**/*.css'
```

**For each changed file, categorize the changes:**

#### A. Selector Changes (IDs, classes)

```bash
git diff main -- <file> | grep -E '^\-.*className|^\-.*id=|^\+.*className|^\+.*id='
```

#### B. Structural Changes (elements moved)

Look for components being:

- Moved INTO a popup, drawer, or dropdown
- Wrapped in new parent elements
- Made conditional

```bash
git diff main -- <file> | grep -E 'Popup|PopupList|Drawer|Dropdown'
```

#### C. Text/Label Changes

```bash
# Translation keys
git diff main -- <file> | grep -E "t\('|i18n\.t\("

# Hardcoded text
git diff main -- <file> | grep -E 'placeholder=|aria-label='
```

**Build a change summary:**

| Change Type | What Changed                                  | Test Impact         |
| ----------- | --------------------------------------------- | ------------------- |
| Selector    | `.btn:has-text("Create")` → `#create-new-doc` | Update locators     |
| Structure   | Button moved into popup                       | Add popup open step |
| Text        | "Search by ID" → "Search"                     | Update assertions   |

### Step 2: Find Affected Tests

**Search strategy:** Cast a wide net, then narrow down.

```bash
# Search for component name references (not just selectors)
grep -rn "QueryPreset\|query-preset\|preset" test/**/*.ts --include="*.spec.ts" --include="*.ts"

# Search for specific selectors from Step 1
grep -rn "\.list-header\|Create New\|#create-new" test/**/*.ts
```

**Key test locations:**

| Pattern                                | Where to Look                 |
| -------------------------------------- | ----------------------------- |
| Component-specific                     | `test/<feature>/e2e.spec.ts`  |
| Shared helpers                         | `test/<feature>/helpers/*.ts` |
| Cross-cutting                          | `test/__helpers/e2e/*.ts`     |
| Multiple features using same component | Search ALL test dirs          |

**Don't just search for exact selectors!** Also search for:

- Component names (e.g., `QueryPreset`, `ListHeader`)
- Feature names (e.g., `preset`, `filter`, `search`)
- Text content that changed (e.g., `"Create New"`, `"Search by"`)

### Step 3: Analyze Test Dependencies

**Before fixing, understand the test:**

1. **Read the full test** - Understand what it's actually testing
2. **Check for helpers** - Is there a shared helper that handles this selector?
3. **Look for patterns** - Are multiple tests doing the same thing?

**If multiple tests use the same selector, create/update a helper:**

```typescript
// test/<feature>/helpers/togglePreset.ts
export async function openCreatePreset(page: Page) {
  await page.click('#select-preset') // Open popup first
  await page.click('#create-new-preset')
}
```

This centralizes the fix and prevents future duplication.

### Step 4: Categorize Fixes Needed

| Change Type                 | Fix Strategy                                    |
| --------------------------- | ----------------------------------------------- |
| **Selector renamed**        | Direct string replacement                       |
| **Element moved to popup**  | Add click to open popup before clicking element |
| **Element moved to drawer** | Add drawer open/close handling                  |
| **Text simplified**         | Update assertion to match new text              |
| **Element removed**         | Rework test logic or delete test                |
| **Props changed**           | Update attribute assertions                     |
| **Conditional rendering**   | May need to set up state before element appears |

### Step 5: Run Affected Tests

**Run tests BEFORE making fixes to confirm they actually fail:**

```bash
# Use isolated port to avoid conflicts
PORT=3150 pnpm test:e2e <suite> --max-failures=1

# Run specific test by name
PORT=3150 pnpm test:e2e <suite> -g "test name" --max-failures=1
```

**Document failure patterns:**

- `Timeout waiting for locator('.old-selector')` → Selector changed
- `locator resolved to 0 elements` → Element moved or removed
- `expected "New Text" received "Old Text"` → Text content changed

### Step 6: Apply Fixes

**Priority: Fix helpers first, then individual tests.**

#### Pattern 1: Selector Renamed

```typescript
// Before
await page.click('.list-header .btn:has-text("Create")')

// After - prefer IDs when available
await page.click('#create-new-doc')
```

#### Pattern 2: Element Moved Into Popup

```typescript
// Before - direct click
await page.click('#edit-preset')

// After - open popup first
await page.click('#select-preset') // Opens the popup
await page.click('#edit-preset') // Now visible in popup
```

#### Pattern 3: Text Content Simplified

```typescript
// Before - specific placeholder text
await expect(input).toHaveAttribute('placeholder', /(Search by ID)/)

// After - simplified text
await expect(input).toHaveAttribute('placeholder', 'Search')
```

#### Pattern 4: Create Reusable Helper

When the same interaction is needed in multiple tests:

```typescript
// test/<feature>/helpers/interactions.ts
export async function openEditPreset(page: Page) {
  await page.click('#select-preset')
  await page.click('#edit-preset')
}

// In tests - import and use
import { openEditPreset } from './helpers/interactions.js'
await openEditPreset(page)
```

### Step 7: Verify Fixes

```bash
# Run same tests that failed
PORT=3150 pnpm test:e2e <suite> --max-failures=1
```

Only commit after tests pass.

## Common Patterns (Real Examples)

### Pattern: Buttons Moved Into Popup Menu

**Symptom:** Test times out waiting for button that used to be directly visible.

**Detection:** Check if buttons were wrapped in `<Popup>` or `<PopupList>`:

```bash
git diff main -- <file> | grep -E 'PopupList|Popup'
```

**Fix:** Add popup trigger click before clicking the button:

```typescript
// Before: Button was directly in toolbar
await page.click('#edit-preset')

// After: Button is now inside a popup
await page.click('#select-preset') // Opens popup
await page.click('#edit-preset') // Now visible
```

**Bonus:** If multiple tests need this, create a helper function.

### Pattern: Class-Based Selector → ID Selector

**Symptom:** `.some-class` or `:has-text("Button Text")` no longer finds element.

**Detection:** Component added `id=` attribute:

```bash
git diff main -- <file> | grep -E '^\+.*id='
```

**Fix:** Use the more stable ID:

```typescript
// Before: Fragile class + text selector
await page.click('.list-header .btn:has-text("Create New")')

// After: Stable ID selector
await page.click('#create-new-doc')
```

### Pattern: Placeholder/Label Text Simplified

**Symptom:** Assertion fails with `expected "New Text" received "Old Text"`.

**Detection:** Translation key or hardcoded text changed:

```bash
git diff main -- <file> | grep -E 'placeholder=|t\('
```

**Fix:** Update assertion to match new text:

```typescript
// Before: Verbose placeholder
await expect(input).toHaveAttribute('placeholder', /(Search by ID, Title)/)

// After: Simplified
await expect(input).toHaveAttribute('placeholder', 'Search')
```

### Pattern: Same Fix Needed Across Multiple Tests

**Symptom:** Several tests in different suites fail with similar selector issues.

**Detection:**

```bash
# Find all tests using the old selector
grep -rn "old-selector\|.old-class" test/**/*.ts
```

**Fix:**

1. Check if a helper already exists in `test/<feature>/helpers/`
2. If yes, fix the helper (fixes all tests at once)
3. If no, create one and refactor tests to use it

### Pattern: Tests in Different Suites Share Components

When you change a shared component (like `ListControls`, `QueryPresetBar`), multiple test suites may be affected.

**Detection:**

```bash
# Find component name references across all tests
grep -rn "QueryPreset\|ListControl" test/**/*.ts | cut -d: -f1 | sort -u
```

**Common cross-suite components:**

- `ListControls` → affects any list view tests
- `QueryPresetBar` → query-presets, group-by, admin tests
- `Search` → i18n, admin, most collection tests
- `Button` → nearly everything

## Quick Reference: Common Payload Test Selectors

| Component     | Common Selectors                                    |
| ------------- | --------------------------------------------------- |
| Search        | `.search-filter__input`, `#search-filter-input`     |
| List View     | `.collection-list`, `tbody tr`, `.table-row`        |
| Popup         | `.popup__content`, `.popup-button-list__button`     |
| Modal         | `dialog`, `[id^=doc-drawer_]`, `[id^=list-drawer_]` |
| Buttons       | `.btn`, `button[type="button"]`                     |
| Query Presets | `#select-preset`, `.query-preset-bar__*`            |

## Test Commands Reference

```bash
# Run all e2e tests for a test suite (auto-starts dev server)
PORT=3150 pnpm test:e2e <suite-name>

# Run specific test file
PORT=3150 pnpm test:e2e test/<suite>/e2e.spec.ts

# Run with headed browser (see what's happening)
PORT=3150 pnpm test:e2e:headed test/<suite>/e2e.spec.ts

# Run in debug mode (step through)
PORT=3150 pnpm test:e2e:debug test/<suite>/e2e.spec.ts

# Run specific test by name pattern
PORT=3150 pnpm test:e2e test/<suite>/e2e.spec.ts -g "test name pattern"

# Stop on first failure (useful during debugging)
PORT=3150 pnpm test:e2e test/<suite>/e2e.spec.ts --max-failures=1
```

**Note:** The `pnpm test:e2e` command automatically:

1. Starts a dev server if the port is free
2. Reuses an existing dev server if the port is in use
3. Runs playwright tests against that port

## Running Tests with Isolation

### Quick Start: Isolated Test Run

**Pick a unique port in the 3100-3199 range:**

```bash
# Run tests on an isolated port (MongoDB auto-starts its own in-memory server)
PORT=3150 pnpm test:e2e query-presets --max-failures=1
```

That's it for MongoDB (default). Each test run starts its own in-memory MongoDB server, so no database conflicts occur.

### Postgres Isolation

For Postgres tests, use a unique database per worktree/repo:

```bash
# Create a unique database for this worktree
PGPASSWORD=payload psql -h localhost -p 5433 -U payload -c "CREATE DATABASE payload_worktree1;"

# Run tests against that database
POSTGRES_URL="postgres://payload:payload@localhost:5433/payload_worktree1" \
  PORT=3150 pnpm test:e2e query-presets --max-failures=1
```

Or use the custom schema approach (no separate DB needed):

```bash
# Tests will use a separate schema within the same database
PAYLOAD_DATABASE=postgres-custom-schema PORT=3150 pnpm test:e2e query-presets
```

### Why Isolation Matters

| Scenario           | Port Conflict?  | DB Conflict?                 |
| ------------------ | --------------- | ---------------------------- |
| MongoDB in-memory  | Yes (same port) | No (each run has own server) |
| Postgres           | Yes (same port) | Yes (same tables)            |
| Multiple worktrees | Yes             | Yes (Postgres only)          |

**Solution:** Always set `PORT` to avoid port conflicts. For Postgres, also isolate the database.

## Common Mistakes

**Dev server not running or wrong port:**
Tests read `PORT` env var (default `3000`). Two approaches:

**Option A: Use isolated port (preferred for parallel test suites)**

```bash
# Run tests on custom port - script handles everything
PORT=3105 pnpm test:e2e test/query-presets/e2e.spec.ts
```

**Option B: Kill existing ports and use default**

```bash
# Kill all dev server ports
lsof -ti:3000,3001,3002,3003,3004,3005,3006,3007,3008,3009 | xargs kill -9 2>/dev/null

# Tests use 3000 by default
pnpm test:e2e test/query-presets/e2e.spec.ts
```

**Wrong test suite running:**
Each test suite (fields, query-presets, localization, etc.) has its own Payload config. Tests will fail or behave unexpectedly if the wrong dev server is running.

**Not running tests before fixing:**
Always verify tests actually fail before making changes. If a test passes, don't change it.

**Not checking helper files:**
Test helpers in `test/*/helpers/` often contain shared selectors that affect multiple tests.

**Missing popup interactions:**
When elements move into popups, tests need to open the popup first.

**Forgetting confirmation dialogs:**
Delete actions often add confirmation modals - tests need to handle the confirm step.

**Placeholder text changes:**
Search placeholders, button labels, and other text content may change.

**Modal slug mismatches:**
When deleting/confirming actions, the modal slug may change. Check the component code for the actual `slug` prop passed to `<Modal>` or drawer components.

## Example: QueryPresetBar Changes

**Old structure (chips):**

```typescript
// Direct buttons visible
await page.click('#create-new-preset')
await page.click('#edit-preset')
await page.click('#delete-preset')
await page.click('.chip__remove') // clear
```

**New structure (popup dropdown):**

```typescript
// Open popup first
await page.click('#select-preset')
// Then click menu items
await page.click('.popup-button-list__button:has-text("Create New")')
await page.click('.popup-button-list__button:has-text("Edit")')
await page.click('.popup-button-list__button:has-text("Delete")')
// Clear uses dedicated button
await page.click('.query-preset-bar__clear')
```
