---
name: ui4-review
description: Review UI4 CSS migrations for proper token usage. Checks that CSS variables are used instead of hardcoded values.
---

# UI4 Review

Reviews CSS changes and **auto-fixes** token violations.

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

# 3. Hardcoded Colors (hex, rgb, rgba)
grep -nE '#[0-9a-fA-F]{3,8}|rgba?\(' "$FILE"

# 4. Legacy Theme Variables
grep -nE 'var\(--theme-|var\(--style-' "$FILE"

# 5. Long-form Token Names (should use shorthands)
grep -nE '\-\-icon-default-default|\-\-text-default-default|\-\-bg-default-default|\-\-border-default-default' "$FILE"
```

**Invoke all 5 grep commands in a single parallel batch**, then analyze results.

### Step 3: Auto-Fix by Priority

1. **SCSS Nesting** (breaks CSS entirely) — Fix first
2. **Legacy Variables** (deprecated) — Replace with new tokens
3. **Long-form Tokens** (verbose) — Convert to shorthands
4. **Hardcoded Values** (spacing, colors, radius) — Replace with tokens

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

**Exceptions:** `1px` borders, `0`, percentages, `auto`, `inherit`, `-1px` (for clip offsets)

---

### Radius Tokens

| Value            | Token             |
| ---------------- | ----------------- |
| 2px / 0.125rem   | `--radius-small`  |
| 5px / 0.3125rem  | `--radius-medium` |
| 13px / 0.8125rem | `--radius-large`  |
| 9999px           | `--radius-full`   |

---

### Token Shorthands

| Long Form                   | Shorthand           |
| --------------------------- | ------------------- |
| `--icon-default-default`    | `--icon-default`    |
| `--icon-default-secondary`  | `--icon-secondary`  |
| `--icon-default-tertiary`   | `--icon-tertiary`   |
| `--text-default-default`    | `--text-default`    |
| `--text-default-secondary`  | `--text-secondary`  |
| `--text-default-tertiary`   | `--text-tertiary`   |
| `--bg-default-default`      | `--bg-default`      |
| `--bg-default-secondary`    | `--bg-secondary`    |
| `--bg-default-hover`        | `--bg-hover`        |
| `--bg-selected-default`     | `--bg-selected`     |
| `--border-default-default`  | `--border-default`  |
| `--border-default-strong`   | `--border-strong`   |
| `--border-selected-default` | `--border-selected` |

---

### Legacy Variables (Replace Immediately)

| Legacy                  | Replacement        |
| ----------------------- | ------------------ |
| `--theme-elevation-0`   | `--bg-default`     |
| `--theme-elevation-50`  | `--bg-secondary`   |
| `--theme-elevation-100` | `--border-default` |
| `--theme-text`          | `--text-default`   |
| `--style-radius-m`      | `--radius-medium`  |

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
