---
name: ui4
description: Manually invoked skill for reskinning Payload UI components. Requires Figma URL. Usage: /ui4
---

# Payload UI Reskin (ui4)

**Figma URL is REQUIRED.** If not provided, ask before proceeding.

---

## Process

### Step 0: Icon Scan

**Goal:** Identify icon dependencies before starting work.

1. **Scan component files** for icon imports:

   ```
   grep -E "from.*icons|import.*Icon" packages/ui/src/elements/ComponentName/
   ```

2. **List existing icons** in `packages/ui/src/icons/`:

   - Each icon has its own folder with `index.tsx` + `index.css`

3. **Compare Figma design** to available icons:

   - Does the design use icons not currently in the component?
   - Does the design use icons that don't exist yet?

4. **Document findings:**
   - **Existing & used:** No action needed
   - **Existing but not imported:** Will need to add import
   - **Missing from codebase:** Flag for user — need to source/create icon

**Figma Icons Source:**

When updating or creating icons, reference the Figma icon library at:

```
~/figma/figma/fpl/icons/src/icons/
```

Icon naming convention: `icon-{size}-{name}.tsx` (e.g., `icon-16-close.tsx`, `icon-24-chevron-down.tsx`)

To find the correct icon:

1. Note the icon name from Figma design (e.g., "close", "chevron-down")
2. Check both 16px and 24px variants if they exist
3. Read the corresponding files and extract the SVG paths for each size

**Icon implementation rules:**

1. **Props:** Icon components MUST accept these props (keep existing props when updating):

   ```typescript
   type IconProps = {
     readonly className?: string
     readonly size?: 16 | 24 // Add more sizes as needed
     // ... keep any existing component-specific props
   }
   ```

2. **Multi-size support:** Store path data keyed by size:

   ```typescript
   const paths = {
     16: 'M4.854 4.146...', // from icon-16-{name}.tsx
     24: 'M6.854 6.146...', // from icon-24-{name}.tsx
   }
   ```

3. **SVG rendering:** Use the size prop to select path and viewBox:

   ```tsx
   <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
     <path d={paths[size]} fill="currentColor" />
   </svg>
   ```

4. **Payload conventions:**

   - Use `fill="currentColor"` instead of `fill="var(--color-icon)"`
   - Use `fillRule` and `clipRule` (React camelCase) instead of kebab-case
   - Default size should match most common usage (typically 24)

5. **Reference implementation:** See `packages/ui/src/icons/Chevron/index.tsx` for the pattern.

**If icons are missing from Figma source:** Ask user how to proceed before continuing.

---

### Step 1: SCSS → CSS Migration

**Goal:** Syntax conversion only. Component must look IDENTICAL after.

1. Read component files: `packages/ui/src/elements/ComponentName/` or `packages/ui/src/fields/ComponentName/`
2. Create `index.css` with converted styles:
   - `$var` → `var(--token)`
   - Keep CSS nesting with `&` (preferred)
   - Remove `@use`/`@import` (tokens are global)
   - Inline any mixins
3. Update import: `import './index.scss'` → `import './index.css'`
4. Delete `index.scss`
5. Wrap in `@layer payload-default {}`

**CRITICAL: SCSS nesting patterns that DON'T work in CSS:**

**1. BEM element concatenation (`&__element`):**

```scss
// SCSS - WORKS (produces .block__element)
.block {
  &__element {
    color: red;
  }
  &__other {
    color: blue;
  }
}
```

```css
/* CSS - DOES NOT WORK! &__element is invalid */
/* You must use flat selectors: */
.block { ... }
.block__element { color: red; }
.block__other { color: blue; }
```

**2. BEM modifier concatenation (`&--modifier`):**

```scss
// SCSS - WORKS (produces .block--active)
.block {
  &--active {
    background: blue;
  }
}
```

```css
/* CSS - DOES NOT WORK! Use flat selector: */
.block { ... }
.block--active { background: blue; }
```

**3. Parent reference from child:**

```scss
// SCSS - WORKS
.child {
  opacity: 0.5;
  .parent--active & {
    opacity: 1;
  }
}
```

```css
/* CSS - DOES NOT WORK! Restructure: */
.child {
  opacity: 0.5;
}
.parent--active .child {
  opacity: 1;
}
```

**What DOES work in CSS nesting:**

- `&:hover`, `&:focus`, `&:active` (pseudo-classes)
- `&::before`, `&::after` (pseudo-elements)
- `.parent { .child { } }` (descendant nesting with space)

**Migration rule:** Convert all `&__` and `&--` to flat BEM selectors.

**Post-migration validation:** After creating the CSS file, run the ui4-review skill to catch any remaining violations (SCSS nesting patterns, hardcoded values, legacy variables). Fix any issues before proceeding.

### Step 2: Analyze Figma Component Variants

**Goal:** Understand ALL visual states before implementing CSS.

1. **Get metadata first** to discover variants:

   ```
   mcp_figma2_get_metadata(fileKey, nodeId)
   ```

2. **Parse variant properties** from symbol names. Common patterns:

   - `State=Default, Validation=None, Selected=false, Read Only=false`
   - Properties often include: State, Validation, Selected, Disabled, Read Only, Size

3. **Build a variant matrix:**

   | State   | Validation | Selected | Read Only | CSS Mapping                |
   | ------- | ---------- | -------- | --------- | -------------------------- |
   | Default | None       | false    | false     | base styles                |
   | Hover   | None       | false    | false     | `:hover`                   |
   | Focus   | None       | false    | false     | `:focus-visible`           |
   | Default | Invalid    | false    | false     | `.error` or `&--error`     |
   | Default | None       | true     | false     | `.is-selected`             |
   | Default | None       | false    | true      | `.read-only`, `[disabled]` |

4. **Fetch design context for key variants** (in parallel):

   - Default unselected
   - Selected
   - Hover
   - Focus
   - Invalid/Error
   - Disabled/Read-only

   ```
   mcp_figma2_get_design_context(fileKey, variantNodeId)
   ```

5. **Compare visual differences** between variants:
   - Border color changes?
   - Background color changes?
   - Inner element visibility/opacity?
   - Focus ring/outline?
   - Text color changes?

**If access fails:** STOP. Ask user to share file.

### Step 3: Restyle to Match Figma

1. **Read token files** (do this BEFORE writing CSS):

   - `packages/ui/src/css/spacing.css` — spacer tokens
   - `packages/ui/src/css/colors.css` — color tokens
   - `packages/ui/src/css/typography.css` — text tokens
   - `packages/ui/src/css/radius.css` — border-radius tokens

2. **Update styles** using tokens from files:

   - Colors: `--bg-*`, `--text-*`, `--icon-*`, `--border-*`
   - Spacing: `--spacer-*` (ALWAYS check file for matching value)
   - Typography: `--text-body-*`, `--text-heading-*`
   - Radius: `--radius-none/small/medium/large/full`

3. **Use canonical shorthands** — see the shorthand table in `.claude/skills/ui4-review/SKILL.md`.

4. **Color rules — NEVER GUESS:**

   - **Always extract exact token from Figma design context** — the `get_design_context` response includes CSS with token names
   - **Don't assume hierarchy** — e.g., don't assume "less prominent = tertiary". Check the design.
   - **When creating new elements** (icons, buttons, etc.), fetch the specific Figma node to get correct colors
   - If Figma shows a raw hex value, map it to the closest token and note this for user review

5. **Spacing rules:**
   - First choice: use `--spacer-*` token
   - If no match: use rem and tell user
   - NEVER use px (except 1px borders)

### Step 4: Ensure Test Collection Has All Variants

**Goal:** Before visual verification, ensure the test collection has field variants for all states.

1. **Read the test collection config:**

   ```
   test/v4/collections/{ComponentName}/index.ts
   ```

2. **Check for required variants** based on Figma variant matrix from Step 2:

   | Figma Variant    | Required Field Config                                                                     |
   | ---------------- | ----------------------------------------------------------------------------------------- |
   | Default          | `{ name: 'default', type: 'component' }`                                                  |
   | Required         | `{ name: 'required', type: 'component', required: true }`                                 |
   | Disabled         | `{ name: 'disabled', type: 'component', admin: { disabled: true }, defaultValue: '...' }` |
   | Read Only        | `{ name: 'readOnly', type: 'component', admin: { readOnly: true }, defaultValue: '...' }` |
   | With Description | `{ name: 'withDescription', type: 'component', admin: { description: 'Help text' } }`     |

3. **Add missing variants** if any are missing. Include `defaultValue` for disabled/readOnly so there's visible content to test.

4. **Restart dev server** if collection was modified: `pnpm run dev v4`

---

### Step 5: Verify with Playwright (LOOP)

**Dev Server:** Use `pnpm run dev v4` when working on field components. The `test/v4` suite has dedicated collections for each field type with various states (default, required, disabled).

**URL Pattern:**

- Fields: `http://localhost:3000/admin/collections/{field-type}-fields/create`
- Elements: Use the appropriate page that displays the element

**Handling Modal Dialogs (beforeunload):**

When the browser has unsaved changes, a "beforeunload" dialog may block ALL Playwright operations. You'll see this error pattern:

```
### Error
Error: Tool "browser_snapshot" does not handle the modal state.
### Modal state
- ["beforeunload" dialog with message ""]: can be handled by browser_handle_dialog
```

**BEFORE retrying any operation**, you MUST dismiss the dialog:

1. Call `browser_handle_dialog({ accept: true })` to dismiss
2. Then retry your intended operation (navigate, snapshot, screenshot, etc.)

If the dialog persists after handling, call `browser_close()` to close the tab, then `browser_navigate` to reopen the page fresh.

**Verification Steps:**

1. Navigate: `browser_navigate` to component page
2. Screenshot: `browser_take_screenshot({ fullPage: true })`
3. Compare to Figma design
4. Check:
   - [ ] Padding correct?
   - [ ] Margin correct?
   - [ ] Gap correct?
   - [ ] Flex alignment correct?
   - [ ] Colors match?
5. **Verify ALL variant states:**
   - [ ] Default state matches Figma default variant?
   - [ ] Hover state matches Figma hover variant? (use `browser_hover`)
   - [ ] Focus state matches Figma focus variant? (tab to element)
   - [ ] Error state matches Figma invalid variant? (trigger validation)
   - [ ] Disabled/read-only matches Figma disabled variant?
   - [ ] Selected state matches Figma selected variant? (if applicable)
6. **If wrong:** fix CSS → goto step 1
7. **If correct:** continue

### Step 6: User Confirmation

Share screenshot and dev server URL. User validates or requests changes.

---

## CSS Structure

Always use `@layer` and CSS nesting:

```css
@layer payload-default {
  .component {
    display: flex;
    gap: var(--spacer-2);
    padding: var(--spacer-2) var(--spacer-3);
    background: var(--bg-default-secondary);
    border: 1px solid var(--border-default-default);
    border-radius: var(--radius-medium);

    &__header {
      display: flex;
      gap: var(--spacer-1);
    }

    &--error {
      border-color: var(--border-danger-strong);
    }

    &:hover {
      background: var(--bg-default-secondary-hover);
    }
  }
}
```

---

## Red Flags - STOP

| Thought                        | Reality                                  |
| ------------------------------ | ---------------------------------------- |
| "I'll use flat selectors"      | Use CSS nesting with `&`                 |
| "I'll use 8px here"            | Read spacing.css, use token              |
| "No matching spacer"           | Did you actually check spacing.css?      |
| "I'll guess the colors"        | Read colors.css, use exact token         |
| "Close enough"                 | Screenshot and compare to Figma          |
| "Skip verification"            | Always run Playwright loop               |
| "Just need the default state"  | Get metadata first, analyze ALL variants |
| "I'll figure out states later" | Build variant matrix BEFORE writing CSS  |

---

## Step 7: Write Variant E2E Tests

**Goal:** Create e2e tests that verify all visual variants from the Figma design.

1. **Create test file** in `test/v4/collections/{ComponentName}/e2e.spec.ts`

2. **Test structure:**

   ```typescript
   import type { Page } from '@playwright/test'
   import { expect, test } from '@playwright/test'
   import path from 'path'
   import { fileURLToPath } from 'url'

   import {
     ensureCompilationIsDone,
     initPageConsoleErrorCatch,
   } from '../../../__helpers/e2e/helpers.js'
   import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
   import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
   import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
   import { componentFieldsSlug } from '../../slugs.js'

   const filename = fileURLToPath(import.meta.url)
   const currentFolder = path.dirname(filename)
   const dirname = path.resolve(currentFolder, '../../')

   const { beforeAll, describe } = test

   let page: Page
   let serverURL: string
   let url: AdminUrlUtil

   describe('ComponentName Field Variants', () => {
     beforeAll(async ({ browser }, testInfo) => {
       testInfo.setTimeout(TEST_TIMEOUT_LONG)
       ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
       url = new AdminUrlUtil(serverURL, componentFieldsSlug)
       const context = await browser.newContext()
       page = await context.newPage()
       initPageConsoleErrorCatch(page)
       await ensureCompilationIsDone({ page, serverURL })
     })

     // Test each variant from the Figma design
   })
   ```

3. **Write tests for each Figma variant:**

   Map the variant matrix from Step 2 to test cases:

   ```typescript
   test('default state renders correctly', async () => {
     await page.goto(url.create)
     const field = page.locator('#field-componentName')
     await expect(field).toBeVisible()
     // Verify visual properties match Figma default variant
   })

   test('hover state shows correct styling', async () => {
     await page.goto(url.create)
     const field = page.locator('#field-componentName')
     await field.hover()
     // Verify hover styles match Figma hover variant
   })

   test('focus state shows correct styling', async () => {
     await page.goto(url.create)
     const field = page.locator('#field-componentName')
     await field.focus()
     // Verify focus ring/outline matches Figma focus variant
   })

   test('error state renders correctly', async () => {
     await page.goto(url.create)
     // Trigger validation by submitting without required field
     await page.locator('button#action-save').click()
     const field = page.locator('#field-requiredComponent')
     // Verify error styling matches Figma invalid variant
   })

   test('disabled state renders correctly', async () => {
     await page.goto(url.create)
     const field = page.locator('#field-disabledComponent')
     await expect(field).toBeDisabled()
     // Verify disabled styling matches Figma disabled variant
   })

   test('read-only state renders correctly', async () => {
     await page.goto(url.create)
     const field = page.locator('#field-readOnlyComponent')
     await expect(field).toHaveAttribute('readonly')
     // Verify read-only styling matches Figma read-only variant
   })
   ```

4. **Collection variants already configured:** (See Step 4)

   The test collection should already have all required variants from Step 4.

5. **Run tests to verify:**

   ```bash
   pnpm run test:e2e --grep "ComponentName Field Variants"
   ```

---

## Step 8: Run ui4-review

**After user confirms the component looks correct, invoke the `ui4-review` skill.**

This will:

1. Scan all changed CSS files
2. Auto-fix any remaining hardcoded values
3. Report what was fixed/flagged

---

## Reference

- Example migrated component: `packages/ui/src/elements/Button/index.css`
- Token files: `packages/ui/src/css/*.css`
- **v4 test suite:** `test/v4/` — dedicated collections per field type
  - Each collection should have: default, required, disabled, readOnly field variants
  - Disabled/readOnly fields need `defaultValue` for visible content
  - Run with: `pnpm run dev v4`
  - URL: `http://localhost:3000/admin/collections/{slug}/create`
  - Available: `text-fields`, `textarea-fields`, `email-fields`, `number-fields`, `password-fields`, `checkbox-fields`, `select-fields`, `relationship-fields`, `upload-fields`, `slug-fields`, `code-fields`, `json-fields`, `collapsible-fields`, `group-fields`, `tabs-fields`, `point-fields`, `radio-fields`, `row-fields`, `array-fields`, `blocks-fields`, `date-fields`
- **E2E test examples:** See `test/fields/collections/*/e2e.spec.ts` for patterns
  - Test helper imports from `test/__helpers/e2e/helpers.js`
  - Use `AdminUrlUtil` for URL construction
  - Use `initPayloadE2ENoConfig` for test setup
