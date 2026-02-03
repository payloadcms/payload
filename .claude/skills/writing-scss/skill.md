---
name: writing-scss
description: Guidelines for writing SCSS following Payload's design system conventions
allowed-tools: Read, Edit, Glob, Grep
---

# Writing SCSS with Payload Design System

## Overview

Ensures SCSS code follows Payload's design system conventions and uses the correct CSS variables instead of SCSS functions or made-up variable names.

## When to Use

- Before writing any SCSS file
- When reviewing existing SCSS for design system compliance
- When user asks to style a component
- When you're about to guess CSS variable names

## Table of Contents

1. [Design System Location](#design-system-location)
2. [Spacing](#1-spacing)
3. [Border Radius](#2-border-radius)
4. [Colors](#3-colors)
5. [Shadows](#4-shadows)
6. [Accessibility - Screen Reader Only Text](#5-accessibility---screen-reader-only-text)
7. [Before Writing - Check the Design System](#6-before-writing---check-the-design-system)
8. [Real-World Example: Button Component](#real-world-example-button-component)
   - [Pattern 1: Component-Scoped CSS Variables](#pattern-1-component-scoped-css-variables)
   - [Pattern 2: Modifier-Based Variable Overrides](#pattern-2-modifier-based-variable-overrides)
   - [Pattern 3: Spacing with calc() and var(--base)](#pattern-3-spacing-with-calc-and-var--base)
   - [Pattern 4: Fallback Values](#pattern-4-fallback-values)
9. [Quick Reference](#quick-reference)

---

## Design System Location

**ALWAYS reference these files instead of guessing:**

- `packages/ui/src/scss/vars.scss` - SCSS variables and functions
- `packages/ui/src/scss/colors.scss` - Color system and theme variables
- `packages/ui/src/scss/app.scss` - Global CSS variables

---

## Guidelines

### 1. Spacing

❌ **NEVER use SCSS `base()` function:**

```scss
padding: base(0.5); // WRONG
```

✅ **ALWAYS use `var(--base)` CSS variable:**

```scss
padding: calc(var(--base) / 2);
padding: calc(var(--base) * 2);
margin-bottom: var(--base);
```

**Why:** CSS variables work at runtime and support theming. SCSS functions are compile-time only.

---

### 2. Border Radius

❌ **Don't guess or make up values:**

```scss
border-radius: 8px; // WRONG - hardcoded
border-radius: var(--border-radius-m); // WRONG - doesn't exist
```

✅ **Use design system radius variables:**

```scss
border-radius: var(--style-radius-s); /* 3px */
border-radius: var(--style-radius-m); /* 4px */
border-radius: var(--style-radius-l); /* 8px */
```

---

### 3. Colors

❌ **Don't use hardcoded colors or invent variable names:**

```scss
color: #666; // WRONG
background: var(--gray-100); // WRONG - doesn't exist
border: 1px solid var(--border); // WRONG - too vague
```

✅ **Use theme elevation and semantic colors:**

```scss
/* Grayscale elevation (0 = lightest, 1000 = darkest, auto-inverts in dark mode) */
background-color: var(--theme-elevation-50);
border-color: var(--theme-elevation-150);
color: var(--theme-elevation-600);

/* Semantic theme colors */
background: var(--theme-bg);
color: var(--theme-text);
border-color: var(--theme-border-color);

/* Status colors (if needed) */
color: var(--theme-success-500);
color: var(--theme-error-500);
color: var(--theme-warning-500);
```

**Available elevation values:** 0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000

---

### 4. Shadows

❌ **Don't write shadow values manually:**

```scss
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); // WRONG
```

✅ **Use shadow mixins:**

```scss
@include shadow-sm; /* Subtle shadow */
@include shadow-m; /* Medium shadow */
@include shadow-lg; /* Large shadow */
```

---

### 5. Accessibility - Screen Reader Only Text

❌ **Don't try to extend .sr-only class:**

```scss
&__label {
  @extend .sr-only; // WRONG - will fail in isolated SCSS files
}
```

✅ **Write the sr-only pattern directly:**

```scss
&__label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

### 6. Before Writing - Check the Design System

**CRITICAL:** Before writing any styles, read the relevant design system files:

```
Read packages/ui/src/scss/vars.scss
Read packages/ui/src/scss/colors.scss
Read packages/ui/src/scss/app.scss
```

**Never guess variable names.** If you're unsure what variable to use:

1. Grep for similar patterns:

   ```
   Grep --glob="**/*.scss" "background-color:"
   ```

2. Look at similar components:
   ```
   Read packages/ui/src/elements/Button/index.scss
   Read packages/ui/src/elements/NavGroup/index.scss
   ```

---

## Real-World Example: Button Component

The Button component (`packages/ui/src/elements/Button/index.scss`) demonstrates advanced patterns:

### Pattern 1: Component-Scoped CSS Variables

Define local variables with a component prefix, then use them throughout:

```scss
.btn {
  // Define component-local variables
  --btn-icon-size: calc(var(--base) * 1.2);
  --btn-icon-content-gap: calc(var(--base) * 0.4);
  --btn-padding-block-start: 0;

  // Use them in properties
  padding: var(--btn-padding-block-start) var(--btn-padding-inline-end);

  &__icon {
    width: var(--btn-icon-size);
    gap: var(--btn-icon-content-gap);
  }
}
```

**Why:** Encapsulates component styling, makes variants easier to manage.

---

### Pattern 2: Modifier-Based Variable Overrides

Set different variable values per modifier, use same properties:

```scss
.btn {
  // Base styles use variables
  color: var(--color);
  background-color: var(--bg-color);

  // Each style variant overrides the variables
  &--style-primary {
    --color: var(--theme-elevation-0);
    --bg-color: var(--theme-elevation-800);
    --hover-bg: var(--theme-elevation-600);
  }

  &--style-secondary {
    --color: var(--theme-text);
    --bg-color: transparent;
    --hover-bg: var(--theme-elevation-100);
  }

  // Hover uses the variables (no duplication)
  &:hover {
    color: var(--hover-color);
    background-color: var(--hover-bg);
  }
}
```

**Why:** DRY - hover/active states defined once, variants just set different colors.

---

### Pattern 3: Spacing with calc() and var(--base)

Multiply or divide the base unit for different sizes:

```scss
.btn {
  &--size-small {
    --btn-icon-size: calc(var(--base) * 0.9);
    --btn-padding-inline-end: calc(var(--base) * 0.4);
    --btn-icon-content-gap: calc(var(--base) * 0.2);
  }

  &--size-large {
    --btn-icon-size: calc(var(--base) * 1.2);
    --btn-padding-inline-end: calc(var(--base) * 0.8);
    --btn-icon-content-gap: calc(var(--base) * 0.4);
  }
}
```

**Why:** Maintains consistent spacing ratios across the design system.

---

### Pattern 4: Fallback Values

Provide defaults when variables might not be set:

```scss
.btn {
  color: var(--color, inherit);
  background-color: var(--bg-color, transparent);
  box-shadow: var(--box-shadow, none);
}
```

**Why:** Makes component more resilient when used in different contexts.

---

## Quick Reference

| Need          | Use                                               | Don't Use                         |
| ------------- | ------------------------------------------------- | --------------------------------- |
| Spacing       | `var(--base)` with calc()                         | `base()` function                 |
| Border radius | `var(--style-radius-{s,m,l})`                     | Hardcoded px values               |
| Colors        | `var(--theme-elevation-*)`                        | `var(--color-*)` or hardcoded hex |
| Borders       | `var(--theme-border-color)`                       | `var(--border)` or hardcoded      |
| Shadows       | `@include shadow-{sm,m,lg}`                       | Manual box-shadow                 |
| Background    | `var(--theme-elevation-50)`                       | Made-up variable names            |
| Text color    | `var(--theme-text)` or `var(--theme-elevation-*)` | Hardcoded colors                  |
