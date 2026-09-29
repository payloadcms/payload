---
name: ui4-review
description: Review UI4 CSS migrations for proper token usage. Checks that CSS variables are used instead of hardcoded values.
---

# UI4 Review

Reviews CSS changes and **auto-fixes** token violations.

---

## Important: Palette vs Semantic Tokens

**`--ramp-*` tokens** are the raw color palette (e.g., `--ramp-white-1000`, `--ramp-blue-500`). These are used **only** in `colors.css` to define semantic tokens.

**`--color-*` tokens** are context-aware semantic tokens (e.g., `--color-bg`, `--color-text-brand`). These handle light/dark theming automatically.

**Components and elements should ALWAYS use `--color-*` semantic tokens, never `--ramp-*` palette tokens directly.**

```css
/* ❌ BAD - using raw palette */
background: var(--ramp-white-1000);

/* ✅ GOOD - using semantic token */
background: var(--color-bg);
```

---

## Process

### Step 1: Get Changed CSS Files

```bash
git status --porcelain | grep '\.css$'
```

Or if a specific file is provided, use that directly.

### Step 2: Parallel Violation Detection

**Run these grep searches IN PARALLEL** to detect all violation types at once:

```bash
# 1. SCSS Nesting Violations (BEM patterns that don't work in CSS)
grep -n '&__\|&--' "$FILE"

# 2. Hardcoded Spacing (px/rem values that should be tokens)
grep -nE ':\s*[0-9]+px|:\s*[0-9.]+rem' "$FILE"

# 3. Hardcoded Colors (hex, rgb, rgba - includes box-shadow)
grep -nE '#[0-9a-fA-F]{3,8}|rgba?\(' "$FILE"

# 4. Legacy Theme Variables
grep -nE 'var\(--theme-|var\(--style-|var\(--base\)' "$FILE"

# 5. Old Token Names (pre-UI4 naming)
grep -nE '\-\-bg-default|\-\-bg-secondary|\-\-text-default|\-\-text-secondary|\-\-icon-default|\-\-icon-secondary|\-\-border-default|\-\-border-strong' "$FILE"

# 6. Raw Palette Usage (should use semantic tokens instead)
# Skip this check for colors.css which defines the semantic tokens
grep -nE 'var\(--ramp-' "$FILE"
```

**Invoke all 6 grep commands in a single parallel batch**, then analyze results.

**Note:** Raw `--ramp-*` violations are only flagged in component CSS files, not in `colors.css` where they're used to define semantic tokens.

### Step 3: Auto-Fix by Priority

1. **SCSS Nesting** (breaks CSS entirely) — Fix first
2. **Legacy Variables** (deprecated) — Replace with new tokens
3. **Old Token Names** (pre-UI4) — Convert to `--color-*` naming
4. **Raw Palette Usage** (`--ramp-*` in components) — Replace with semantic `--color-*` tokens
5. **Hardcoded Values** (spacing, colors, radius) — Replace with tokens

### Step 4: Report

After fixing, report:

- Total violations found
- Violations auto-fixed
- Violations that need manual review (no clear token match)

---

## Violation Reference

### SCSS Nesting (BREAKS CSS)

| Pattern                     | Issue               | Fix                                  |
| --------------------------- | ------------------- | ------------------------------------ |
| `&__element`                | BEM element concat  | Use flat `.block__element` selector  |
| `&--modifier`               | BEM modifier concat | Use flat `.block--modifier` selector |
| `.child { .parent--mod & }` | Parent reference    | Move to `.parent--mod .child`        |

**What DOES work:** `&:hover`, `&:focus`, `&::before`, `& .child`

---

### Spacing Tokens

| Value          | Token          |
| -------------- | -------------- |
| 4px / 0.25rem  | `--spacer-1`   |
| 8px / 0.5rem   | `--spacer-2`   |
| 12px / 0.75rem | `--spacer-2-5` |
| 16px / 1rem    | `--spacer-3`   |
| 24px / 1.5rem  | `--spacer-4`   |
| 32px / 2rem    | `--spacer-5`   |
| 40px / 2.5rem  | `--spacer-6`   |

**Rounding rules — ALWAYS round to nearest token:**

| Pixel Range | Token                 | Notes                         |
| ----------- | --------------------- | ----------------------------- |
| 0-2px       | `--spacer-0`          | Use 0                         |
| 3-6px       | `--spacer-1` (4px)    | 5-6px rounds to 4px           |
| 7-10px      | `--spacer-2` (8px)    | 10px rounds DOWN to 8px       |
| 11-14px     | `--spacer-2-5` (12px) | 13.33px rounds to 12px        |
| 15-20px     | `--spacer-3` (16px)   | 15px, 20px both round to 16px |
| 21-28px     | `--spacer-4` (24px)   |                               |
| 29-36px     | `--spacer-5` (32px)   | 30px rounds to 32px           |
| 37-48px     | `--spacer-6` (40px)   |                               |

**Rule:** For values ≤ 40px, ALWAYS use a single token (no `calc()`). For values > 40px, use `calc()` with a spacer token.

**Exceptions:** `0`, percentages, `auto`, `inherit`, `-1px` (for clip offsets)

---

### Stroke Width Tokens

| Value | Token                  |
| ----- | ---------------------- |
| 1px   | `--stroke-width-small` |

---

### Radius Tokens

| Value            | Token             |
| ---------------- | ----------------- |
| 2px / 0.125rem   | `--radius-small`  |
| 5px / 0.3125rem  | `--radius-medium` |
| 13px / 0.8125rem | `--radius-large`  |
| 9999px           | `--radius-full`   |

---

### Elevation Tokens (Box Shadows)

Defined in `packages/ui/src/css/elevations.css`.

**Never use hardcoded `rgba()` for box-shadows.** Use elevation tokens instead:

| Token                          | Use Case                          |
| ------------------------------ | --------------------------------- |
| `--elevation-300-tooltip`      | Tooltips, small floating elements |
| `--elevation-400-menu-panel`   | Menus, dropdowns, floating panels |
| `--elevation-500-modal-window` | Modals, dialogs, full overlays    |

```css
/* ❌ BAD - hardcoded shadow */
box-shadow: 0 -2px 16px -2px rgba(0, 0, 0, 0.2);

/* ✅ GOOD - elevation token */
box-shadow: var(--elevation-400-menu-panel);
```

Elevations automatically adjust for light/dark themes.

---

### Semantic Color Tokens (UI4 Naming)

All semantic colors use the `--color-` prefix. The `default` category and variant are implicit.

| Old Name            | New Name (UI4)            |
| ------------------- | ------------------------- |
| `--bg-default`      | `--color-bg`              |
| `--bg-secondary`    | `--color-bg-secondary`    |
| `--bg-hover`        | `--color-bg-hover`        |
| `--bg-selected`     | `--color-bg-selected`     |
| `--bg-brand`        | `--color-bg-brand`        |
| `--bg-danger`       | `--color-bg-danger`       |
| `--bg-success`      | `--color-bg-success`      |
| `--bg-warning`      | `--color-bg-warning`      |
| `--text-default`    | `--color-text`            |
| `--text-secondary`  | `--color-text-secondary`  |
| `--text-tertiary`   | `--color-text-tertiary`   |
| `--text-brand`      | `--color-text-brand`      |
| `--text-danger`     | `--color-text-danger`     |
| `--text-success`    | `--color-text-success`    |
| `--icon-default`    | `--color-icon`            |
| `--icon-secondary`  | `--color-icon-secondary`  |
| `--icon-tertiary`   | `--color-icon-tertiary`   |
| `--icon-brand`      | `--color-icon-brand`      |
| `--icon-danger`     | `--color-icon-danger`     |
| `--border-default`  | `--color-border`          |
| `--border-strong`   | `--color-border-strong`   |
| `--border-selected` | `--color-border-selected` |
| `--border-brand`    | `--color-border-brand`    |

---

### Legacy Variables (Replace Immediately)

| Legacy                  | Replacement            |
| ----------------------- | ---------------------- |
| `--theme-elevation-0`   | `--color-bg`           |
| `--theme-elevation-50`  | `--color-bg-secondary` |
| `--theme-elevation-100` | `--color-border`       |
| `--theme-text`          | `--color-text`         |
| `--style-radius-m`      | `--radius-medium`      |

**`var(--base)` Conversion:** Legacy token = 20px. Convert using:

| Original            | Pixels | Replacement                     |
| ------------------- | ------ | ------------------------------- |
| `var(--base) * 0.4` | 8px    | `var(--spacer-2)`               |
| `var(--base) * 0.5` | 10px   | `calc(var(--spacer-1) * 2.5)`   |
| `var(--base) * 0.6` | 12px   | `var(--spacer-2-5)`             |
| `var(--base)`       | 20px   | `calc(var(--spacer-4) * 0.833)` |
| `var(--base) * 2`   | 40px   | `var(--spacer-6)`               |

See ui4 skill Step 1 for full conversion table.

---

## Behavior

**DO NOT just report violations. FIX THEM immediately using replace_string_in_file or multi_replace_string_in_file.**

When a violation has no clear token match (e.g., `3px` or an unusual rem value), flag it for manual review but don't guess.

For each violation:

1. Identify the exact line and value
2. Determine the correct token replacement
3. Use `replace_string_in_file` to fix it immediately
4. Report what was fixed

**Only flag (don't fix) when:**

- No matching token exists (e.g., 18px badge size)
- Value is intentional (e.g., `1px` border, `0`)
- Ambiguous replacement

**Empty CSS files:** If a component's CSS file becomes empty after migration (all styles now handled by shared components like `Button`), delete the CSS file and remove its import from the component.

---

## Output Format

After auto-fixing, report:

```
## Auto-Fixed

✅ Collapsible/index.css:9 — `height: 2rem` → `height: var(--spacer-5)`
✅ Collapsible/index.css:120 — `width: 2rem` → `width: var(--spacer-5)`

## Flagged (Manual Review)

⚠️ ErrorPill/index.css:15 — `height: 1.125rem` (18px) — no matching token
```

---

## Summary

After all fixes, provide a simple summary:

| File                  | Fixed | Flagged |
| --------------------- | ----- | ------- |
| Collapsible/index.css | 2     | 1       |
| ErrorPill/index.css   | 0     | 2       |
