# SCSS to CSS Migration Analysis — `packages/ui`

## Context

The UI package has **246 SCSS files** (13 shared in `scss/`, 233 component-level). The codebase already leans heavily on CSS custom properties for theming/tokens and `@layer` for cascade management. SCSS is used primarily for: a custom `base()` function, mixins, `@extend` with placeholders, breakpoint media query wrappers, and nesting. There is no PostCSS in the pipeline today — SCSS is compiled via `esbuild-sass-plugin`.

A new `design-tokens.css` file already exists alongside the legacy `colors.scss`, signaling an active migration toward CSS-only tokens.

---

## Current SCSS Feature Usage Inventory

| Feature                                    | Usage Scale                                 | Files Affected | Migration Difficulty                               |
| ------------------------------------------ | ------------------------------------------- | -------------- | -------------------------------------------------- |
| **Nesting** (`&__el`, `&:hover`, `&--mod`) | Every file                                  | 246            | **Trivial** — native CSS nesting                   |
| **`base()` function** (`base(2)` → `40px`) | 388 calls                                   | 84             | **Medium** — needs `calc()` replacement or PostCSS |
| **`@include` (mixins)**                    | 173 calls                                   | 90             | **Medium** — needs PostCSS or manual inlining      |
| **`@extend %placeholder`**                 | 31 calls                                    | 21             | **Medium** — replace with classes or mixins        |
| **`$variables`**                           | ~20 definitions, used in `#{interpolation}` | ~15            | **Easy** — most already mirrored as `--css-vars`   |
| **`@import 'styles'`** (every component)   | 192 files                                   | 192            | **Easy** — remove once mixins/functions resolved   |
| **`@use 'sass:math'` + `math.div()`**      | 1 call                                      | 1              | **Trivial** — use `calc()`                         |
| **`@layer payload-default`**               | ~50+ files                                  | Already CSS    | **None** — already native CSS                      |
| **CSS Custom Properties**                  | 200+ vars                                   | Already CSS    | **None** — already native CSS                      |

### Features NOT used (simplifies migration)

- No `@if`/`@for`/`@each`/`@while` control directives
- No SCSS maps
- No complex string interpolation
- No color manipulation functions (`darken()`, `lighten()`, `mix()`)
- No deep SCSS module system (`@forward`, namespaced `@use`)

---

## Feature-by-Feature Migration Path

### 1. Nesting — **Can migrate now**

Native CSS nesting has **~96% global browser support** (Chrome 120+, Firefox 117+, Safari 17.2+). The syntax is identical to SCSS for the patterns used in this codebase:

```css
/* Works identically in SCSS and native CSS */
.btn {
  color: blue;
  &:hover {
    color: darkblue;
  }
  &--primary {
    background: blue;
  }
  &__icon {
    width: 16px;
  }
}
```

**No changes needed to nesting syntax.** Once the SCSS compiler is removed, nesting works natively. For older browser support, Lightning CSS or `postcss-nesting` can transpile it down.

### 2. `base()` Function — **Needs a replacement strategy**

This is the most heavily used SCSS feature (388 calls across 84 files). The function multiplies a value by `$baseline-px` (20px):

```scss
// SCSS: base(2) → 40px, base(0.75) → 15px
@function base($multiplier) {
  @return ($baseline-px * $multiplier);
}
```

**Option A: CSS `calc()` with custom property** (no build tooling needed)

```css
:root {
  --base-px: 20;
}
/* base(2) becomes: */
padding: calc(var(--base-px) * 2 * 1px); /* = 40px */
```

Downside: verbose, every call becomes longer. Could use a shorter variable name.

**Option B: PostCSS custom function** (`postcss-functions`)

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-functions')({
      functions: {
        base: (multiplier) => `${20 * parseFloat(multiplier)}px`,
      },
    }),
  ],
}
```

```css
/* In CSS files: */
padding: base(2); /* → 40px at build time */
```

Keeps the ergonomics identical. Build-time resolution, zero runtime cost.

**Option C: Codemod to static values**
Replace every `base(N)` call with its computed `px` value using a script. Loses the semantic meaning but is the simplest one-time migration.

**Recommendation: Option B** (PostCSS function) for migration parity, then potentially move to Option A for zero-dependency CSS if the verbosity is acceptable.

### 3. Mixins + Extends → Utility Classes

The goal: replace all `@include` and `@extend` usage with CSS utility classes defined in one central file. End users can override any of these in a single place.

All utility classes live in `@layer payload-default` so they can be overridden by any `@layer payload` rule or un-layered CSS.

#### Complete Mixin/Extend Inventory & Proposed Utility Classes

---

#### `.btn-reset` — Button reset

**Current:** `@mixin btn-reset` (6 uses) + `@extend %btn-reset` (12 uses) = **18 total**

Used in: `.drawer__close`, `.popup__button`, `.delete-document button`, `.pagination button`, `.clickable-arrow`, `.array-action`, `.tabs__tab`, `.per-page button`, `.restore-many button`, `.blocks__add-row button`, `.copy-to-clipboard`, `.collapsible__toggle`, `.rs__dropdown-indicator`, `.sidebar__fileRow`, `.sidebar__remove`, `.edit-upload__draggable`, `.droppable-button`, `.thumbnail-card`

```css
.btn-reset {
  border: 0;
  background: none;
  box-shadow: none;
  border-radius: 0;
  padding: 0;
  color: currentColor;
  font-family: var(--font-body);
}
```

**Override example:** `@layer payload { .btn-reset { font-family: 'Inter', sans-serif; } }`

---

#### `.form-input` — Standard form input styling

**Current:** `@include formInput` — **17 uses**

Used in: `.rs__control`, `.code-editor`, `.search-filter__input`, `.edit-upload input`, `.react-datepicker input`, `.condition-value-number`, `.condition-value-text`, `.items-drawer__search-input`, `.add-new-relation__input`, `.upload input`, `.block-selector__search-input`, `.point-field input`, `.password input`, `.confirm-password input`, `.number input`, `.text input`, `.email input`, `.checkbox input`, `.textarea`, `.auth-view input`

```css
.form-input {
  box-shadow: var(--shadow-sm);
  font-family: var(--font-body);
  width: 100%;
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--style-radius-s);
  background: var(--theme-input-bg);
  color: var(--theme-elevation-800);
  font-size: 1rem;
  height: base(2);
  line-height: base(1);
  padding: base(0.4) base(0.75);
  -webkit-appearance: none;
  transition-property: border, box-shadow, background-color;
  transition-duration: 100ms, 100ms, 500ms;
  transition-timing-function: cubic-bezier(0, 0.2, 0.2, 1);

  &[data-rtl='true'] {
    direction: rtl;
  }

  &::placeholder {
    color: var(--theme-elevation-400);
    font-weight: normal;
    font-size: 1rem;
  }

  &:not(:disabled):hover {
    border-color: var(--theme-elevation-250);
    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.2);
  }

  &:focus,
  &:focus-within,
  &:active {
    border-color: var(--theme-elevation-400);
    outline: 0;
  }

  &:disabled {
    background: var(--theme-elevation-100);
    color: var(--theme-elevation-400);
    box-shadow: none;

    &:hover {
      border-color: var(--theme-elevation-150);
      box-shadow: none;
    }
  }
}
```

**Override example:** End users change all inputs globally:

```css
@layer payload {
  .form-input {
    border-radius: 8px;
    height: 44px;
  }
}
```

---

#### `.input-error` / `.input-error--dark` — Error state for inputs

**Current:** `@include lightInputError` (10 uses) + `@include darkInputError` (10 uses) = **20 total**

Used in: `.password--error input`, `.confirm-password--error input`, `.date-time-field--error`, `.point-field--error input`, `.checkbox--error input`, `.number--error input`, `.relationship--error .rs__control`, `.text--error input`, `.select--error .rs__control`, `.email--error input`, `.radio-group--error .radio__input` — and dark variants of all

```css
.input-error {
  background-color: var(--theme-error-50);
  border: 1px solid var(--theme-error-500);
}

.input-error--dark {
  background-color: var(--theme-error-100);
  border: 1px solid var(--theme-error-400);

  &:hover {
    border-color: var(--theme-error-500);
  }
}
```

**Override example:**

```css
@layer payload {
  .input-error {
    border-width: 2px;
  }
}
```

---

#### `.input-readonly` — Disabled/readonly input styling

**Current:** `@include readOnly` — **5 uses** (plus embedded in `formInput`)

Used in: `.rs--is-disabled .rs__control`, `.radio__input:disabled`, `.textarea:disabled`, `.code__textarea:disabled`, `.checkbox__input:disabled`

```css
.input-readonly {
  background: var(--theme-elevation-100);
  color: var(--theme-elevation-400);
  box-shadow: none;

  &:hover {
    border-color: var(--theme-elevation-150);
    box-shadow: none;
  }
}
```

---

#### `.blur-bg` / `.blur-bg--light` — Blurred overlay background

**Current:** `@include blur-bg` (12 uses) + `@include blur-bg-light` (1 use) = **13 total**

Used in: `.drawer__blur-bg`, `.delete-document`, `.document-take-over`, `.restore-many`, `.restore-button`, `.doc-stale-data`, `.doc-locked`, `.confirmation-modal`, `.sidebar__mobileBlur`, `.sidebar__filesContainer` (responsive), `.bulk-edit` (responsive), `.edit-many` (responsive), `.doc-controls`

The blur-bg mixin uses `:before`/`:after` pseudo-elements, so it must remain a class applied to the element itself (not composable via nesting). This is fine — all current usages apply it to the root of a component.

```css
.blur-bg {
  --blur-bg-color: var(--theme-bg);
  --blur-bg-opacity: 0.75;

  &:before,
  &:after {
    content: ' ';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  &:before {
    background: var(--blur-bg-color);
    opacity: var(--blur-bg-opacity);
  }

  &:after {
    backdrop-filter: blur(8px);
  }
}

.blur-bg--light {
  --blur-bg-opacity: 0.3;
}
```

**Override example:** Adjust blur intensity or overlay color:

```css
@layer payload {
  .blur-bg {
    --blur-bg-opacity: 0.9;
  }
  .blur-bg:after {
    backdrop-filter: blur(16px);
  }
}
```

**Note:** The 1 parameterized call `@include blur-bg(var(--theme-bg), 0.3)` is replaced by the `.blur-bg--light` variant. If future uses need different params, scope via CSS custom properties on the element: `style="--blur-bg-color: red; --blur-bg-opacity: 0.5"`.

---

#### `.input-shadow` — Input shadow with hover enhancement

**Current:** `@include inputShadow` — **2 direct uses** (plus embedded in `formInput`)

Used in: `.static-file-details`, `.static-file-details table input`

```css
.input-shadow {
  box-shadow: var(--shadow-sm);

  &:not(:disabled):hover {
    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.2);
  }
}
```

---

#### Shadow tokens — CSS custom properties (not classes)

**Current:** `@include shadow-sm` (1 direct use), `@include shadow-m` (2 uses), `@include shadow-lg` (4 uses)

These are single-property mixins. Replace with CSS custom properties, not utility classes:

```css
:root {
  --shadow-sm: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-m: 0 4px 8px -3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 -2px 16px -2px rgba(0, 0, 0, 0.2);
  --shadow-lg-top: 0 2px 16px -2px rgba(0, 0, 0, 0.2);
  --shadow-soft-bottom: 0 7px 14px 0px rgb(0 0 0 / 5%);
}
```

Usage in component CSS: `box-shadow: var(--shadow-sm);`

**Override:** `@layer payload { :root { --shadow-sm: 0 1px 3px rgba(0,0,0,0.12); } }`

Used in:

- `shadow-sm`: `.card button:hover`, `.radio__input` (+ inside `formInput`)
- `shadow-m`: `.dropzone`, `.thumbnail-card`
- `shadow-lg`: `.rs__menu`, `.popup__content`, `.lp-toolbar--draggable`, `.react-datepicker`
- `shadow-lg-top`: unused (can delete)
- `soft-shadow-bottom`: unused (can delete)

---

#### Typography classes — Replace `@extend %h1`–`%h6`, `%body`, `%small`, etc.

**Current:** `@extend %h1`–`%h6` (7 uses in `app.scss` for HTML elements + 3 in components), `@extend %body` (4 uses), `@extend %small` (2 uses)

For `app.scss` global element styling (`h1 { @extend %h1 }`), these become direct property declarations on the element selectors — no class needed.

For component usage, create typography utility classes:

```css
.text-h1 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: base(1.6);
  line-height: base(1.8);
}
.text-h2 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: base(1.3);
  line-height: base(1.6);
}
.text-h3 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: base(1);
  line-height: base(1.2);
}
.text-h4 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: base(0.8);
  line-height: base(1);
  letter-spacing: -0.375px;
}
.text-h5 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: base(0.65);
  line-height: base(0.8);
}
.text-h6 {
  margin: 0;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: base(0.6);
  line-height: base(0.8);
}
.text-body {
  font-size: 13px;
  line-height: 20px;
  font-weight: normal;
  font-family: var(--font-body);
}
.text-small {
  margin: 0;
  font-size: 12px;
  line-height: 20px;
}
.text-large-body {
  font-size: base(0.6);
  line-height: base(1);
  letter-spacing: base(0.02);
}
```

Component usage (where `@extend %h5` was used):

- `.card__title` → add `class="text-h5"` in JSX, or nest `.card__title { /* same props */ }` in CSS
- `.list-header__title` → `class="text-h2"`
- `.tabs__tab` → `class="text-h4"`
- `.breadcrumbs__button` → `class="text-h4"`
- `.collapsible__toggle` → reuse `.text-body` props
- `.rs__multi-value-label` → `class="text-small"`
- `.field-label` → reuse `.text-body` props

**Override example:** Customize all headings:

```css
@layer payload {
  .text-h1,
  .text-h2,
  .text-h3,
  .text-h4,
  .text-h5,
  .text-h6 {
    font-family: 'Inter', sans-serif;
  }
}
```

---

#### Breakpoint mixins — Stay as media queries (not utility classes)

**Current:** `@include small-break` (24 uses), `@include mid-break` (32 uses), `@include large-break` (5 uses), `@include extra-small-break` (1 use) = **62 total**

Breakpoints are not utility-class candidates — they wrap arbitrary responsive styles. These become direct media queries:

```css
/* Replace @include small-break { ... } with: */
@media (max-width: 768px) { ... }

/* Replace @include mid-break { ... } with: */
@media (max-width: 1024px) { ... }

/* Replace @include large-break { ... } with: */
@media (max-width: 1440px) { ... }

/* Replace @include extra-small-break { ... } with: */
@media (max-width: 400px) { ... }
```

End users can override via CSS custom properties on the breakpoint-affected properties, or via their own `@layer payload` media queries.

---

#### `color-svg($color)` — SVG coloring

**Current:** `@include color-svg(...)` — **3 uses** (each with a different color param)

Used in: `.icon--calendar .stroke/.fill` with `var(--theme-elevation-800)`, `.pill svg` with `var(--theme-elevation-0)`, `.banner svg` with `var(--theme-error-600)`

This is parameterized, so not a good fit for a single utility class. Replace by leveraging `currentColor`:

```css
/* SVG elements already use .stroke and .fill classes */
.stroke {
  stroke: currentColor;
  fill: none;
}
.fill {
  fill: currentColor;
}
```

Then on the parent, set `color` to the desired value:

```css
.icon--calendar {
  color: var(--theme-elevation-800);
}
.pill svg {
  color: var(--theme-elevation-0);
}
```

---

### Summary: All Utility Classes

| Utility Class           | Replaces                                  | Occurrences      | Type                              |
| ----------------------- | ----------------------------------------- | ---------------- | --------------------------------- |
| `.btn-reset`            | `@mixin btn-reset` + `@extend %btn-reset` | 18               | Class                             |
| `.form-input`           | `@mixin formInput`                        | 17               | Class                             |
| `.input-error`          | `@mixin lightInputError`                  | 10               | Class                             |
| `.input-error--dark`    | `@mixin darkInputError`                   | 10               | Class                             |
| `.input-readonly`       | `@mixin readOnly`                         | 5                | Class                             |
| `.blur-bg`              | `@mixin blur-bg`                          | 12               | Class (with CSS var params)       |
| `.blur-bg--light`       | `@mixin blur-bg-light`                    | 1                | Modifier class                    |
| `.input-shadow`         | `@mixin inputShadow`                      | 2                | Class                             |
| `.text-h1`–`.text-h6`   | `@extend %h1`–`%h6`                       | 3 component uses | Class                             |
| `.text-body`            | `@extend %body`                           | 4                | Class                             |
| `.text-small`           | `@extend %small`                          | 2                | Class                             |
| `.text-large-body`      | `@extend %large-body`                     | 0 component uses | Class                             |
| `--shadow-*` vars       | `@mixin shadow-sm/m/lg`                   | 7                | CSS custom property               |
| `.stroke` / `.fill`     | `@mixin color-svg`                        | 3                | Existing classes + `currentColor` |
| Direct `@media` queries | `@include small/mid/large-break`          | 62               | Inline media queries              |

**Total: 13 utility classes + 5 shadow tokens replace all 18 mixins + 11 placeholders**

### End-User Override Strategy

All utility classes are defined in `@layer payload-default`. Users override in `@layer payload` or un-layered CSS:

```css
/* User's custom stylesheet */
@layer payload {
  .form-input {
    border-radius: 8px;
    font-size: 14px;
    height: 44px;
  }

  .btn-reset {
    font-family: 'Inter', sans-serif;
  }

  :root {
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 4px 24px rgba(0, 0, 0, 0.15);
  }
}
```

This gives end users a single, predictable place to customize all input styling, button resets, shadows, typography, and overlay behaviors across the entire admin UI.

### 5. SCSS Variables + Interpolation — **Easy migration**

Most SCSS variables are already mirrored as CSS custom properties in `app.scss`:

```scss
// Current pattern:
--breakpoint-s-width: #{$breakpoint-s-width};
--style-radius-m: #{$style-radius-m};
--gutter-h: #{base(3)};
```

After migration, these become direct CSS custom property declarations. The SCSS variable + interpolation layer is removed entirely.

The deprecated color variables (`$color-dark-gray`, etc.) can be deleted — they're already replaced by CSS custom properties.

### 6. `@import` → Native CSS or bundler

Every component file has `@import '../../scss/styles.scss'`. Once mixins/functions are handled by PostCSS, these imports serve no purpose (components only imported `styles.scss` to access mixins and variables).

**Approach:** Remove all `@import 'styles'` lines. PostCSS plugins + CSS custom properties make them unnecessary. The bundler (esbuild) can handle CSS concatenation.

---

## Recommended Build Pipeline

### Current: `esbuild` + `esbuild-sass-plugin`

### Target: `esbuild` + `postcss` (via `esbuild-postcss` or similar)

```
PostCSS plugins needed:
├── postcss-mixins          — @define-mixin / @mixin syntax (replaces SCSS mixins)
├── postcss-functions        — custom functions like base() (replaces SCSS functions)
├── postcss-preset-env       — transpiles native nesting, @custom-media, color functions
│   └── stage: 2-3 features including nesting, custom media queries
└── (optional) postcss-import — resolves @import at build time
```

Alternatively, **Lightning CSS** can replace `postcss-preset-env` for nesting transpilation and is significantly faster (Rust-based). But it doesn't provide mixins or custom functions, so you'd still need PostCSS for those.

---

## What CSS Cannot Do (Even With Plugins)

| SCSS Feature                                                | CSS Limitation                                          | Mitigation                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| **`@extend %placeholder`** (selector merging)               | No native equivalent, no plugin equivalent              | Use classes or PostCSS mixins instead (minor CSS size increase) |
| **Compile-time computation** (`$baseline-px * $multiplier`) | CSS `calc()` is runtime only                            | PostCSS `postcss-functions` resolves at build time              |
| **`@media` with variables**                                 | CSS custom properties don't work in `@media` conditions | Use `postcss-custom-media` or hardcode breakpoint values        |
| **Parameterized `@extend`**                                 | N/A (not used in this codebase)                         | N/A                                                             |

---

## What About Native CSS `@function` and `@mixin`?

The **CSS Functions and Mixins Module** (W3C First Public Working Draft, 2025) proposes native `@function` and `@mixin` in CSS:

```css
@function --base(--multiplier) {
  result: calc(var(--multiplier) * 20px);
}
.element {
  padding: --base(2);
}
```

**Status as of March 2026:**

- Chrome Canary behind flag (`--enable-features=CSSMixins`)
- Not in stable browsers yet
- Estimated stable availability: **late 2026–2027**
- `@function` is more stable in spec than `@mixin`

**Verdict:** Not ready for production use today. PostCSS plugins bridge the gap until then. When native support lands, the PostCSS mixin syntax is close enough that migration will be straightforward.

---

## Competitor Analysis

### Keystone (KeystoneJS)

Keystone uses **CSS-in-JS via Emotion** with a dedicated design system (`@keystar/ui`). All styles are component-scoped and generated at runtime — there are no CSS files, utility classes, or user-facing stylesheet overrides. Theming is controlled through a JS token system. This approach is tightly coupled to the framework and does not prioritize end-user style customization.

### Sanity

Sanity uses **styled-components + CSS Modules** (`*.module.css`). Component styles are locally scoped via CSS Modules and driven by props in React. Sanity exposes stable `data-ui` attributes on elements for targeting, and provides a `buildLegacyTheme()` function that maps user values to CSS custom properties for theming. There are no global utility classes — overrides happen through the theme configuration API or by targeting `data-ui` selectors.

### Takeaway for Payload

Neither competitor uses utility classes. Both lock styling behind JS abstractions (Emotion / styled-components), making user customization indirect. Payload's approach of **plain CSS files + utility classes + `@layer` overrides** is a deliberate alternative: it gives end users direct, low-friction control over admin UI styling without requiring JS knowledge or build system integration. This is a differentiator worth preserving.

---

## Naming Convention: Flat Classes over Compound Selectors

### Decision

Use **flat, descriptive class names** (`.input-readonly`, `.input-error`, `.blur-bg`) rather than compound selectors (`.input.readonly`, `.input.error`).

### Why not compound selectors?

Since all Payload styles live in `@layer payload-default`, any user CSS in `@layer payload` or un-layered CSS will always win regardless of specificity. A user writing `.input.readonly { ... }` in `@layer payload` overrides `.input.readonly` in `@layer payload-default` just as easily as overriding `.input-readonly` — the layer boundary is the deciding factor, not selector weight.

This means **specificity is irrelevant for the end-user override story**. Both naming approaches work equally well for consumers.

However, flat classes are still preferred for **internal reasons**:

1. **Internal specificity management** — Within `@layer payload-default`, Payload's own styles still compete by specificity. Compound selectors like `.input.readonly` (specificity `0,2,0`) are harder to override internally than `.input-readonly` (specificity `0,1,0`). Flat classes keep the specificity floor low, making it easier to write contextual overrides within our own layer without resorting to escalation.

2. **Semantic clarity** — `.input-readonly` reads as a single concept ("an input in readonly state"). `.input.readonly` implies two independent concerns being composed, which misrepresents the intent — `readonly` is not a standalone class.

3. **Collision avoidance** — Short, generic class names like `.readonly` or `.error` risk colliding with user or third-party CSS. `.input-readonly` is self-namespacing.

### Summary

| Concern                                | Flat (`.input-readonly`) | Compound (`.input.readonly`)           |
| -------------------------------------- | ------------------------ | -------------------------------------- |
| End-user override via `@layer`         | Equivalent               | Equivalent                             |
| Internal specificity within same layer | Lower (easier to manage) | Higher (harder to override internally) |
| Semantic intent                        | Single concept           | Implies composition                    |
| Collision risk                         | Low (self-namespaced)    | Higher (generic fragments)             |

---

## Migration Strategy — Phased Approach

### Phase 1: Setup PostCSS pipeline (parallel to SCSS)

- Add `postcss-mixins`, `postcss-functions`, `postcss-preset-env` to build
- Configure esbuild to process `.css` files through PostCSS
- Keep SCSS compilation working alongside for incremental migration

### Phase 2: Migrate shared SCSS to CSS

- Convert `vars.scss` → CSS custom properties + PostCSS function for `base()`
- Convert `queries.scss` → PostCSS mixins or `@custom-media`
- Convert `type.scss` → PostCSS mixins or utility classes (replace `%placeholder`)
- Convert `resets.scss` → utility class `.btn-reset`
- Convert `svg.scss` → PostCSS mixin or `currentColor` pattern
- Convert `colors.scss` → already pure CSS custom properties, minimal changes
- Merge/consolidate with `design-tokens.css`

### Phase 3: Migrate component SCSS files to CSS

- Automated codemod for:
  - Rename `.scss` → `.css`
  - Remove `@import '../../scss/styles.scss'`
  - Replace `base(N)` → `base(N)` (PostCSS function handles it) or `calc(var(--base-px) * N * 1px)`
  - Replace `@include mixin-name` → `@mixin mixin-name` (PostCSS syntax)
  - Replace `@extend %name` → `@mixin name` (PostCSS syntax) or add class
  - Replace `$variable` references → `var(--variable)` where not already
- Process in batches (elements/, fields/, icons/, views/, etc.)

### Phase 4: Remove SCSS

- Remove `esbuild-sass-plugin` dependency
- Remove `sass` dependency
- Update `bundle.js` to use PostCSS for CSS processing
- Update package.json exports (`.scss` → `.css`)
- Update any downstream documentation for consumers who import SCSS

### Phase 5 (Future): Remove PostCSS mixins

- When native CSS `@function`/`@mixin` reach stable browsers, migrate PostCSS mixins to native
- Eventually reduce to just `postcss-preset-env` for backward compat, or drop PostCSS entirely

---

## Verification

- Run `pnpm run build:ui` after each phase to verify CSS output is correct
- Visual regression: start dev server and compare UI before/after with Playwright screenshots
- Check that `dist/styles.css` output is equivalent
- Verify that consumers importing `@payloadcms/ui/scss` or `@payloadcms/ui/css` still work (Phase 4 is a breaking change for SCSS consumers)
