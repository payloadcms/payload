# DESIGN.md - Payload CMS Admin UI Design System

> Plain-text design system document following the Google Stitch / awesome-design-md specification.
> Single Source of Truth (SSoT) for developers and AI agents styling Payload CMS Admin UI.

---

## 1. Visual Theme & Atmosphere

- **Archetype**: Linear / Vercel modern engineering minimalism.
- **Aesthetic Tone**: Ultra-precise, high-density, functional, developer-first aesthetic.
- **Atmosphere**: Deep carbon dark tones paired with surgical hairline borders (`1px solid #232528`), and clean, high-contrast light surfaces (`#fcfcfc` canvas, `#ffffff` surface, `#e5e7eb` borders).
- **Density**: Compact to medium density, optimized for data-dense tables, schema definitions, and content authoring.

---

## 2. Color Palette & Roles

### Dark Theme (`[data-theme='dark']`)

- **Canvas / App Background**: `--color-bg`: `#08090a` (pure deep carbon)
- **Secondary Surface (Sidebar, Drawer)**: `--color-bg-secondary`: `#101113`
- **Tertiary Surface (Card, Modal, Dropdown, Hover)**: `--color-bg-tertiary`: `#18191b`
- **Text Primary**: `--color-text`: `#f7f8f8` (crisp white, high contrast)
- **Text Secondary**: `--color-text-secondary`: `#8a8f98` (muted grey)
- **Text Muted / Placeholder**: `--color-text-muted`: `#62666d`
- **Hairline Border Primary**: `--color-border`: `#232528` (precision separator)
- **Border Subtle**: `--color-border-secondary`: `#1c1d20`
- **Accent Brand Primary**: `--color-bg-brand`: `#0070f3` (tech electric blue)
- **Accent Brand Hover**: `--color-bg-brand-hover`: `#0060df`
- **Success**: `#00d68f` (emerald)
- **Warning**: `#f5a623` (amber)
- **Error / Danger**: `#eb5757` (crimson)

### Light Theme (`:root`)

- **Canvas / App Background**: `--color-bg`: `#fcfcfc` (soft off-white)
- **Secondary Surface (Sidebar, Panels)**: `--color-bg-secondary`: `#f4f5f6`
- **Tertiary Surface (Cards, Modals)**: `--color-bg-tertiary`: `#ffffff`
- **Text Primary**: `--color-text`: `#111827` (slate black)
- **Text Secondary**: `--color-text-secondary`: `#4b5563`
- **Text Muted / Placeholder**: `--color-text-muted`: `#9ca3af`
- **Hairline Border Primary**: `--color-border`: `#e5e7eb` (sharp clean border)
- **Border Subtle**: `--color-border-secondary`: `#f3f4f6`
- **Accent Brand Primary**: `--color-bg-brand`: `#0070f3`
- **Accent Brand Hover**: `--color-bg-brand-hover`: `#005bb5`
- **Success**: `#059669`
- **Warning**: `#d97706`
- **Error / Danger**: `#dc2626`

---

## 3. Typography Rules

- **Primary Font Stack**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace Stack**: `JetBrains Mono, "Fira Code", Menlo, Monaco, Consolas, monospace`
- **Scale**:
  - `Display / H1`: `24px / 1.25`, font-weight `600`, letter-spacing `-0.02em`
  - `Title / H2`: `20px / 1.3`, font-weight `600`, letter-spacing `-0.015em`
  - `Subtitle / H3`: `16px / 1.4`, font-weight `500`, letter-spacing `-0.01em`
  - `Body / Default`: `14px / 1.5`, font-weight `400`
  - `Caption / Meta`: `12px / 1.4`, font-weight `400`, letter-spacing `0`
  - `Code / IDs`: `12px / 1.5`, font-weight `400`, monospace

---

## 4. Component Stylings

### Buttons

- **Height**: `--button-height` = `32px` (`--spacer-4`) for standard, `24px` for compact.
- **Border Radius**: `--button-radius` = `6px` (`--radius-medium`).
- **Variants**:
  - `Primary`: Accent background (`#0070f3` or pure monochrome), white text, no visible border, subtle glow on active.
  - `Secondary`: Surface background, `1px solid var(--color-border)`, primary text.
  - `Ghost`: Transparent background, hover background `var(--color-bg-tertiary)`, secondary text hover to primary.
  - `Danger`: Subtle red tinted background or border, `#eb5757` text.

### Form Inputs & Controls

- **Height**: `32px` (`--spacer-4`), padding-inline `8px` (`--spacer-2`).
- **Border**: `1px solid var(--color-border)`.
- **Radius**: `6px` (`--field-border-radius`).
- **Focus State**: `1px solid var(--color-bg-brand)`, outline none, optional subtle ring.
- **Disabled State**: Opacity `0.5`, cursor `not-allowed`.

### Tables & Lists

- **Row Height**: `40px` (`--spacer-6`).
- **Border**: `border-block-end: 1px solid var(--color-border)`.
- **Hover**: Background `var(--color-bg-secondary)` transition `background 120ms ease`.

### Modals & Drawers

- **Radius**: `8px` (`--radius-large`).
- **Border**: `1px solid var(--color-border)`.
- **Backdrop**: `rgba(0, 0, 0, 0.6)` with backdrop-filter `blur(4px)`.

---

## 5. Layout Principles

- **Spacing System**: Strictly use `--spacer-*` tokens:
  - `--spacer-1`: 4px | `--spacer-2`: 8px | `--spacer-2-5`: 12px
  - `--spacer-3`: 16px | `--spacer-4`: 24px | `--spacer-5`: 32px | `--spacer-6`: 40px
- **Canonical Breakpoints**:
  - `400px` (mobile)
  - `768px` (tablet)
  - `1024px` (desktop)
  - `1440px` (wide desktop)
- **Property Standards**: Always use logical properties:
  - `padding-inline` instead of `padding-left`/`padding-right`
  - `margin-block` instead of `margin-top`/`margin-bottom`
  - `border-inline-start` instead of `border-left`

---

## 6. Depth & Elevation

- **Principle**: In Dark mode, elevation is conveyed via **border contrast and surface brightness**, not muddy drop shadows.
- `--elevation-100-canvas`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `--elevation-300-tooltip`: `0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--color-border)`
- `--elevation-400-menu-panel`: `0 0 0 1px var(--color-border), 0 10px 20px -3px rgba(0, 0, 0, 0.4)`
- `--elevation-500-modal-window`: `0 0 0 1px var(--color-border), 0 24px 48px -12px rgba(0, 0, 0, 0.6)`

---

## 7. Do's and Don'ts

### Do:

- Wrap all custom tokens within `@layer payload-default`.
- Use `--color-*` semantic tokens rather than raw hex codes in component CSS.
- Use mobile-first `@media (min-width: ...)` queries.
- Keep integer pixel values for layout properties (`width`, `height`, `padding`, `margin`).

### Don't:

- NEVER use `!important` (enforce specificity via layers or structure).
- NEVER use `@media (max-width: ...)` queries (violates Stylelint).
- NEVER use arbitrary breakpoints like `500px`, `800px`, `1200px`.
- NEVER use sub-pixel box-model values like `padding: 4.5px`.

---

## 8. Responsive Behavior

- Sidebars collapse to icon-only or sliding drawer under `1024px`.
- Data tables enable horizontal scroll container (`overflow-x: auto`) rather than clipping content on small viewports.
- Touch targets maintain minimum height of `32px`, recommended `40px` on mobile (`< 768px`).

---

## 9. Agent Prompt Guide

When asking AI agents or subagents to create or modify UI in Payload:

> "Follow DESIGN.md: Linear/Vercel tech minimalism. Use @layer payload-default, --color-bg, --color-border, --spacer-\* tokens, logical properties (padding-inline), mobile-first media queries with standard breakpoints (400, 768, 1024, 1440px), and no !important."
