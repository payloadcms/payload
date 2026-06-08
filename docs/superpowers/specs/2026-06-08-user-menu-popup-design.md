# User Menu Popup Design Spec

**Date:** 2026-06-08  
**Status:** Approved  
**Figma:** [node 7733-77615](https://staging.figma.com/design/6B2gypRIR35KTc60F1ZQjn/-Payload--Component-Library--WIP-?node-id=7733-77615)

---

## Overview

Replace the current Account link button in `AppHeader` (which navigates to `/account`) with a popup user menu. The popup shows the user's avatar, display name and email/username, and provides sub-menus for Theme, Language, and a plugin-extensible Settings section, plus a Log out item.

---

## Component Architecture

New element directory:

```
packages/ui/src/elements/UserMenu/
├── index.tsx               # Main popup (client component)
├── index.css
├── MenuSeparator/
│   └── index.tsx           # Horizontal separator for menu groups
├── ThemeMenu/
│   └── index.tsx           # Light / Dark / Auto sub-popup
├── LanguageMenu/
│   └── index.tsx           # Admin UI language sub-popup
└── SettingsMenu/
    └── index.tsx           # Plugin-extensible settings sub-popup
```

`AppHeader` drops its Account `<Link>` and renders `<UserMenu>` in its place. The `CustomAvatar` prop moves from `AppHeader` to `UserMenu`.

---

## Config Changes

### New field: `admin.components.userMenuSettingsItems`

```ts
// In SanitizedConfig / AdminConfig
userMenuSettingsItems?: CustomComponent[]
```

An array of `CustomComponent` entries (same type as `viewActions`). Each item is a server-rendered React node. Plugins push entries here to add rows to the Settings sub-menu. When the array is empty or absent, the Settings sub-trigger is not rendered.

`DefaultTemplate` renders each item server-side and passes the resulting `React.ReactNode[]` to `UserMenu` as the `settingsItems` prop — identical to how `viewActions` are passed to `ActionsProvider`.

---

## `UserMenu` Component

### Props

```ts
type UserMenuProps = {
  CustomAvatar?: React.ReactNode   // Server-rendered custom avatar (passed from DefaultTemplate)
  settingsItems?: React.ReactNode[] // Server-rendered plugin settings rows
}
```

### Data Sources (hooks)

| Data | Hook | Fields used |
|------|------|-------------|
| User identity | `useAuth()` | `user.name`, `user.email`, `user.username` |
| Theme | `useTheme()` | `theme`, `autoMode`, `setTheme` |
| Language | `useTranslation()` | `i18n.language`, `languageOptions`, `switchLanguage` |
| Config | `useConfig()` | `admin.theme`, `admin.routes`, `routes.admin`, `localization` |
| Translations | `useTranslation()` | `t()` |

### User Display Logic

- **Primary line (name):** `user.name` if present; omitted if absent.
- **Secondary line (identifier):** `user.username` if present, else `user.email`. Always rendered in muted/secondary style (grayed out per design).
- If no name, only the secondary line is shown.

### Popup Structure

The main `Popup` is configured with:
- `horizontalAlign="right"`
- `verticalAlign="bottom"`
- `theme="auto"` (inherits current light/dark theme)
- `size="fit-content"` (200px wide per Figma)
- `caret={false}` (clean edge per design)

Content structure (top to bottom):

1. **Profile header block**
   - Avatar (40px circle) — `RenderCustomComponent` with `<Account>` fallback
   - Name (if present)
   - Email or username (muted)

2. **Group 1: Preferences**
   - Theme sub-trigger → opens `ThemeMenu` sub-popup (only if `config.admin.theme === 'all'`)
   - Language sub-trigger → opens `LanguageMenu` sub-popup (only if `languageOptions` has >1 option)

3. **`<MenuSeparator />`**

4. **Settings sub-trigger** (only if `settingsItems` is non-empty) → opens `SettingsMenu` sub-popup
   - `<MenuSeparator />` after Settings trigger

5. **Group: Account actions**
   - Log out item (Link to logout route)

---

## Sub-Components

### `MenuSeparator`

A simple horizontal rule component styled for menu context. Provides consistent vertical padding (not a full-bleed `<hr>`). Reusable in any future menu-style popup.

```tsx
// Usage
<MenuSeparator />
```

### `ThemeMenu`

Nested `Popup` rendered from the Theme sub-trigger row. Contains three items:

| Label | Value | Active indicator |
|-------|-------|-----------------|
| Auto (System) | `'auto'` | checkmark when `autoMode === true` |
| Light | `'light'` | checkmark when `!autoMode && theme === 'light'` |
| Dark | `'dark'` | checkmark when `!autoMode && theme === 'dark'` |

Calls `setTheme(value)` on selection. Only rendered if `config.admin.theme === 'all'`.

### `LanguageMenu`

Nested `Popup` rendered from the Language sub-trigger row. Lists all entries from `languageOptions`. Active language gets a checkmark. Calls `switchLanguage(langCode)` from `useTranslation()` on selection. Only rendered if there is more than one language option.

### `SettingsMenu`

Nested `Popup` rendered from the Settings sub-trigger row. Renders each `React.ReactNode` from the `settingsItems` prop in sequence. Items are expected to be fully self-contained rows (rendered server-side by plugins via `CustomComponent`). The Settings sub-trigger is only shown when `settingsItems` has at least one entry.

---

## `AppHeader` Changes

- Keep the `CustomAvatar` prop on `AppHeader` (forwarded through to `UserMenu` instead of rendered directly at the AppHeader level).
- Add a new `settingsItems?: React.ReactNode[]` prop to `AppHeader`.
- Remove the Account `<Link>` block (lines 125–133 of current `AppHeader/index.tsx`).
- Render `<UserMenu CustomAvatar={CustomAvatar} settingsItems={settingsItems} />` in its place.

## `DefaultTemplate` Changes

- Continue to server-render `CustomAvatar` and pass it to `AppHeader` as before (unchanged logic).
- Render `userMenuSettingsItems` server-side (same pattern as `viewActions`) and pass resulting nodes as `settingsItems` to `AppHeader`, which forwards them to `UserMenu`.

---

## Accessibility

- The avatar trigger button has `aria-label` (e.g. `t('authentication:account')`).
- Sub-trigger rows use `role="menuitem"` or are `<button>` elements.
- Keyboard navigation is inherited from the existing `Popup` component (Tab, Arrow keys, Escape).
- Sub-popups opened via keyboard auto-focus their first item.

---

## What Changes on the Account Page

The `/account` Settings panel currently renders `ToggleTheme`, `LanguageSelector`, and `ToggleHighContrast`. Theme and Language switching now also live in the user menu, but the account page settings **remain as-is** — the user menu is additive. No removal from the account page in this iteration.

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/ui/src/elements/UserMenu/index.tsx` | Main popup |
| `packages/ui/src/elements/UserMenu/index.css` | Styles |
| `packages/ui/src/elements/UserMenu/MenuSeparator/index.tsx` | Menu group separator |
| `packages/ui/src/elements/UserMenu/ThemeMenu/index.tsx` | Theme sub-popup |
| `packages/ui/src/elements/UserMenu/LanguageMenu/index.tsx` | Language sub-popup |
| `packages/ui/src/elements/UserMenu/SettingsMenu/index.tsx` | Plugin settings sub-popup |

## Files to Modify

| File | Change |
|------|--------|
| `packages/ui/src/elements/AppHeader/index.tsx` | Remove Account link; render `UserMenu` |
| `packages/ui/src/templates/Default/index.tsx` | Pass `settingsItems` to `UserMenu`; update `CustomAvatar` destination |
| `packages/payload/src/types/Config.ts` (or equivalent) | Add `admin.components.userMenuSettingsItems` |
| `packages/ui/src/exports/client/index.ts` | Export `UserMenu` and sub-components |

---

## Out of Scope

- Removing Theme/Language from the `/account` settings page.
- Building specific plugin `userMenuSettingsItems` entries (e.g., Backups, Environments, MCP — those are cloud plugin concerns).
- Redesigning the Localizer (locale selector) in the header — it stays as-is.
