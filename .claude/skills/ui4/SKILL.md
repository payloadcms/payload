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

**If icons are missing:** Ask user how to proceed before continuing.

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

3. **Spacing rules:**
   - First choice: use `--spacer-*` token
   - If no match: use rem and tell user
   - NEVER use px (except 1px borders)

### Step 4: Verify with Playwright (LOOP)

**Dev Server:** Use `pnpm run dev v4` when working on field components. The `test/v4` suite has dedicated collections for each field type with various states (default, required, disabled).

**URL Pattern:**

- Fields: `http://localhost:3000/admin/collections/{field-type}-fields/create`
- Elements: Use the appropriate page that displays the element

1. Navigate: `browser_navigate` to component page
   - **If navigation times out:** check `browser_snapshot` for a "beforeunload" dialog (unsaved changes warning). Dismiss with `browser_handle_dialog({ accept: true })`, then retry navigation.
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

### Step 5: User Confirmation

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

## Step 6: Run ui4-review

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
  - Each collection has default, required, and disabled field variants
  - Run with: `pnpm run dev v4`
  - URL: `http://localhost:3000/admin/collections/{slug}/create`
  - Available: `text-fields`, `textarea-fields`, `email-fields`, `number-fields`, `password-fields`, `checkbox-fields`, `select-fields`, `relationship-fields`, `upload-fields`, `slug-fields`, `code-fields`, `json-fields`, `collapsible-fields`, `group-fields`, `tabs-fields`, `point-fields`, `radio-fields`, `row-fields`, `array-fields`, `blocks-fields`, `date-fields`
