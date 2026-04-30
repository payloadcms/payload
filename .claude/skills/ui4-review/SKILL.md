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

### Step 2: Review & Auto-Fix Each File

For each changed CSS file:

1. Read the file
2. Identify violations
3. **Apply fixes immediately** using replace_string_in_file
4. Report what was fixed

---

## Violations to Flag

### Spacing (CRITICAL)

**Bad:**

```css
padding: 8px;
padding: 0.5rem;
gap: 16px;
margin: 1rem;
```

**Good:**

```css
padding: var(--spacer-2);
gap: var(--spacer-3);
margin: var(--spacer-3);
```

**Token reference:**
| Value | Token |
|-------|-------|
| 0 | `--spacer-0` |
| 4px / 0.25rem | `--spacer-1` |
| 8px / 0.5rem | `--spacer-2` |
| 12px / 0.75rem | `--spacer-2-5` |
| 16px / 1rem | `--spacer-3` |
| 24px / 1.5rem | `--spacer-4` |
| 32px / 2rem | `--spacer-5` |
| 40px / 2.5rem | `--spacer-6` |

**Exceptions:**

- `1px` borders are OK
- `0` is OK (no token needed)
- Percentage values are OK
- `100%`, `auto`, `inherit` are OK

---

### Colors (CRITICAL)

**Bad:**

```css
background: #f5f5f5;
color: rgba(0, 0, 0, 0.9);
border-color: #e6e6e6;
```

**Good:**

```css
background: var(--bg-default-secondary);
color: var(--text-default-default);
border-color: var(--border-default-default);
```

**Token prefixes:**

- Background: `--bg-*`
- Text: `--text-*`
- Border: `--border-*`
- Icon: `--icon-*`

**Prefer canonical shorthands** (defined in colors.css under "Canonical Shorthands"):

| Full Token                  | Preferred Shorthand |
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

**Always use the shorthand when available.** Check colors.css for the full list.

---

### Border Radius (CRITICAL)

**Bad:**

```css
border-radius: 4px;
border-radius: 5px;
border-radius: 0.3125rem;
```

**Good:**

```css
border-radius: var(--radius-medium);
border-radius: var(--radius-small);
border-radius: var(--radius-full);
```

**Token reference:**
| Value | Token |
|-------|-------|
| 0 | `--radius-none` |
| 2px / 0.125rem | `--radius-small` |
| 5px / 0.3125rem | `--radius-medium` |
| 13px / 0.8125rem | `--radius-large` |
| 9999px | `--radius-full` |

---

### Typography (MODERATE)

**Bad:**

```css
font-size: 11px;
line-height: 16px;
font-weight: 550;
```

**Good:**

```css
font-size: var(--text-body-medium-font-size);
line-height: var(--text-body-medium-line-height);
font-weight: var(--text-body-medium-font-weight);
```

---

### Old Theme Variables (CRITICAL)

Flag any usage of legacy variables:

**Bad:**

```css
var(--theme-elevation-0)
var(--theme-elevation-50)
var(--theme-elevation-100)
var(--theme-error-100)
var(--theme-text)
var(--style-radius-m)
```

These must be replaced with new tokens.

---

## Behavior: AUTO-FIX

**Do NOT just report violations. FIX THEM.**

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
