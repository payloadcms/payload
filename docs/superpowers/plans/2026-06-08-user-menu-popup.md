# User Menu Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Account `<Link>` in `AppHeader` with a `<UserMenu>` popup that shows the user's profile, theme/language selectors, plugin-extensible settings, and a logout link.

**Architecture:** New `UserMenu` element using the existing `Popup` component for the main popup and all sub-popups. Server-rendered plugin settings items are passed via a new `admin.components.userMenuSettingsItems` config field, rendered in `DefaultTemplate` and forwarded through `AppHeader` → `UserMenu` as `React.ReactNode[]`. A standalone `MenuSeparator` element provides generic horizontal dividers.

**Tech Stack:** React (client components), TypeScript, existing `Popup` / `PopupList` APIs, `useAuth`, `useTheme`, `useTranslation`, `useConfig` hooks.

---

## File Map

### New files (create)
| File | Responsibility |
|------|---------------|
| `packages/ui/src/elements/MenuSeparator/index.tsx` | Generic horizontal divider for menu groups |
| `packages/ui/src/elements/UserMenu/index.tsx` | Main user menu popup |
| `packages/ui/src/elements/UserMenu/index.css` | UserMenu styles |
| `packages/ui/src/elements/UserMenu/ThemeMenu/index.tsx` | Light/Dark/Auto theme sub-popup |
| `packages/ui/src/elements/UserMenu/LanguageMenu/index.tsx` | Admin language sub-popup |
| `packages/ui/src/elements/UserMenu/SettingsMenu/index.tsx` | Plugin settings sub-popup |

### Modified files
| File | Change |
|------|--------|
| `packages/payload/src/config/types.ts` | Add `userMenuSettingsItems?: CustomComponent[]` to `admin.components` |
| `packages/payload/src/bin/generateImportMap/iterateConfig.ts` | Call `addToImportMap` on the new `userMenuSettingsItems` field |
| `packages/ui/src/elements/AppHeader/index.tsx` | Remove Account `<Link>`; add `settingsItems` prop; render `<UserMenu>` |
| `packages/ui/src/templates/Default/index.tsx` | Render `userMenuSettingsItems` server-side; pass `settingsItems` to `AppHeader` |
| `packages/ui/src/exports/client/index.ts` | Export `UserMenu` and `MenuSeparator` |

---

## Task 1: Add `userMenuSettingsItems` to Config types

**Files:**
- Modify: `packages/payload/src/config/types.ts` (around line 1013 — `settingsMenu` exists nearby)
- Modify: `packages/payload/src/bin/generateImportMap/iterateConfig.ts` (around line 60)

Context: The `admin.components` object in `Config` already has `settingsMenu?: CustomComponent[]` used by the Nav sidebar gear icon. We add a NEW separate field `userMenuSettingsItems` for items in the user menu popup header. `SanitizedConfig` inherits via `DeepRequired<Config>` so no separate change needed there.

- [ ] **Step 1: Open `packages/payload/src/config/types.ts`**

  Find the block containing `settingsMenu?: CustomComponent[]` (around line 1009–1013). Add the new field directly after it:

  ```ts
  /**
   * Add custom menu items to the navigation menu accessible via the gear icon.
   * These components will be rendered in a popup menu above the logout button.
   */
  settingsMenu?: CustomComponent[]
  /**
   * Add custom items to the user menu popup in the admin panel header.
   * These components will be rendered in the Settings sub-popup of the user menu.
   * When empty or absent, the Settings sub-trigger is not shown.
   */
  userMenuSettingsItems?: CustomComponent[]
  ```

  That is, insert after line 1013:
  ```
      /**
       * Add custom items to the user menu popup in the admin panel header.
       * These components will be rendered in the Settings sub-popup of the user menu.
       * When empty or absent, the Settings sub-trigger is not shown.
       */
      userMenuSettingsItems?: CustomComponent[]
  ```

- [ ] **Step 2: Register in import map generation**

  Open `packages/payload/src/bin/generateImportMap/iterateConfig.ts`. Find line ~60 where `settingsMenu` is handled:
  ```ts
  addToImportMap(config.admin?.components?.settingsMenu)
  ```
  Add the line below it:
  ```ts
  addToImportMap(config.admin?.components?.userMenuSettingsItems)
  ```

- [ ] **Step 3: Type-check**

  Run from repo root:
  ```bash
  pnpm run build:payload 2>&1 | tail -20
  ```
  Expected: no type errors. (Build output may have warnings about other things; focus on payload package errors.)

- [ ] **Step 4: Commit**

  ```bash
  git add packages/payload/src/config/types.ts packages/payload/src/bin/generateImportMap/iterateConfig.ts
  git commit -m "feat(payload): add userMenuSettingsItems to admin.components config"
  ```

---

## Task 2: Create `MenuSeparator` element

**Files:**
- Create: `packages/ui/src/elements/MenuSeparator/index.tsx`

Context: A standalone, generic horizontal rule for use in popup/menu contexts. Styled via the existing `popup-divider` CSS class that already exists in `packages/ui/src/elements/Popup/PopupDivider/index.css`. We just re-use that styling by importing the CSS from there. Alternatively, `PopupDivider` already exports `PopupListDivider` — but `MenuSeparator` should be an independent element, not a re-export, to keep it generic (no Popup dependency).

- [ ] **Step 1: Create `packages/ui/src/elements/MenuSeparator/index.tsx`**

  ```tsx
  import React from 'react'

  import '../../elements/Popup/PopupDivider/index.css'

  export const MenuSeparator: React.FC = () => {
    return <hr className="popup-divider" />
  }
  ```

  > Note: We reuse the existing `popup-divider` CSS class from `Popup/PopupDivider/index.css` to stay consistent with existing divider styles. The component is standalone — no coupling to `Popup` in its own logic.

- [ ] **Step 2: Commit**

  ```bash
  git add packages/ui/src/elements/MenuSeparator/index.tsx
  git commit -m "feat(ui): add generic MenuSeparator element"
  ```

---

## Task 3: Create `ThemeMenu` sub-popup

**Files:**
- Create: `packages/ui/src/elements/UserMenu/ThemeMenu/index.tsx`

Context: A nested `Popup` rendered from the Theme row in `UserMenu`. Shows Light / Dark / Auto options. Uses `useTheme()` for reading/writing theme state. The `autoMode` field from `useTheme()` tells us whether "Auto" is active. `theme` tells the current resolved theme (`'light'|'dark'`). When `autoMode` is `true`, the Auto option is checked regardless of `theme`. Only rendered when `config.admin.theme === 'all'`.

- [ ] **Step 1: Create `packages/ui/src/elements/UserMenu/ThemeMenu/index.tsx`**

  ```tsx
  'use client'
  import React from 'react'

  import { useTheme } from '../../../providers/Theme/index.js'
  import { useTranslation } from '../../../providers/Translation/index.js'
  import { Popup, PopupList } from '../../Popup/index.js'

  export const ThemeMenu: React.FC = () => {
    const { autoMode, setTheme, theme } = useTheme()
    const { t } = useTranslation()

    const options: { label: string; value: 'auto' | 'dark' | 'light' }[] = [
      { label: t('general:auto'), value: 'auto' },
      { label: t('general:light'), value: 'light' },
      { label: t('general:dark'), value: 'dark' },
    ]

    const activeValue: 'auto' | 'dark' | 'light' = autoMode ? 'auto' : theme

    return (
      <Popup
        button={t('general:theme')}
        caret={false}
        horizontalAlign="right"
        size="fit-content"
        theme="auto"
        verticalAlign="bottom"
      >
        <PopupList.RadioGroup>
          {options.map(({ label, value }) => (
            <PopupList.RadioGroupItem
              active={activeValue === value}
              key={value}
              onClick={() => setTheme(value)}
            >
              {label}
            </PopupList.RadioGroupItem>
          ))}
        </PopupList.RadioGroup>
      </Popup>
    )
  }
  ```

  > **Translation keys note:** `'general:auto'`, `'general:light'`, `'general:dark'`, and `'general:theme'` may not exist yet in the translation files. If they don't exist, add them to `packages/translations/src/languages/en.ts` (or wherever English strings live) in Task 8 once the component compiles. For now, use string literals as fallbacks if the keys are missing.

- [ ] **Step 2: Check translation keys exist**

  ```bash
  grep -n "'general:auto'\|'general:light'\|'general:dark'\|'general:theme'" packages/translations/src/languages/en.ts
  ```

  Note any missing keys — you'll add them in Task 8.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/ui/src/elements/UserMenu/ThemeMenu/index.tsx
  git commit -m "feat(ui): add ThemeMenu sub-popup for UserMenu"
  ```

---

## Task 4: Create `LanguageMenu` sub-popup

**Files:**
- Create: `packages/ui/src/elements/UserMenu/LanguageMenu/index.tsx`

Context: A nested `Popup` rendered from the Language row in `UserMenu`. Renders all entries from `languageOptions` (from `useTranslation()`). Active language gets a checkmark. Calls `switchLanguage(code)` on selection. Only rendered when there is more than one language option. The `LanguageSelector` on the Account page (`packages/ui/src/views/Account/Settings/LanguageSelector.tsx`) uses the same data — use it as a reference for extracting the current language from `i18n.language`.

- [ ] **Step 1: Create `packages/ui/src/elements/UserMenu/LanguageMenu/index.tsx`**

  ```tsx
  'use client'
  import React from 'react'

  import { useTranslation } from '../../../providers/Translation/index.js'
  import { Popup, PopupList } from '../../Popup/index.js'

  export const LanguageMenu: React.FC = () => {
    const { i18n, languageOptions, switchLanguage, t } = useTranslation()

    return (
      <Popup
        button={t('general:language')}
        caret={false}
        horizontalAlign="right"
        size="fit-content"
        theme="auto"
        verticalAlign="bottom"
      >
        <PopupList.RadioGroup>
          {languageOptions?.map(({ label, value }) => (
            <PopupList.RadioGroupItem
              active={i18n.language === value}
              key={value}
              onClick={() => {
                if (switchLanguage) {
                  void switchLanguage(value)
                }
              }}
            >
              {label}
            </PopupList.RadioGroupItem>
          ))}
        </PopupList.RadioGroup>
      </Popup>
    )
  }
  ```

  > **Translation key note:** `'general:language'` may need to be added. Check and note for Task 8.

- [ ] **Step 2: Check translation key**

  ```bash
  grep -n "'general:language'" packages/translations/src/languages/en.ts
  ```

  Note if missing.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/ui/src/elements/UserMenu/LanguageMenu/index.tsx
  git commit -m "feat(ui): add LanguageMenu sub-popup for UserMenu"
  ```

---

## Task 5: Create `SettingsMenu` sub-popup

**Files:**
- Create: `packages/ui/src/elements/UserMenu/SettingsMenu/index.tsx`

Context: A nested `Popup` rendered from the Settings row in `UserMenu`. Renders server-rendered plugin items passed in as `React.ReactNode[]`. The sub-trigger is only shown when `items` is non-empty (this conditional is handled by `UserMenu`, not here). `SettingsMenu` simply renders what it's given.

- [ ] **Step 1: Create `packages/ui/src/elements/UserMenu/SettingsMenu/index.tsx`**

  ```tsx
  'use client'
  import React, { Fragment } from 'react'

  import { useTranslation } from '../../../providers/Translation/index.js'
  import { Popup } from '../../Popup/index.js'

  type SettingsMenuProps = {
    items: React.ReactNode[]
  }

  export const SettingsMenu: React.FC<SettingsMenuProps> = ({ items }) => {
    const { t } = useTranslation()

    return (
      <Popup
        button={t('general:settings')}
        caret={false}
        horizontalAlign="right"
        size="fit-content"
        theme="auto"
        verticalAlign="bottom"
      >
        {items.map((item, i) => (
          <Fragment key={`settings-item-${i}`}>{item}</Fragment>
        ))}
      </Popup>
    )
  }
  ```

  > **Translation key note:** `'general:settings'` may need to be added. Check and note for Task 8.

- [ ] **Step 2: Check translation key**

  ```bash
  grep -n "'general:settings'" packages/translations/src/languages/en.ts
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add packages/ui/src/elements/UserMenu/SettingsMenu/index.tsx
  git commit -m "feat(ui): add SettingsMenu sub-popup for UserMenu"
  ```

---

## Task 6: Create main `UserMenu` component

**Files:**
- Create: `packages/ui/src/elements/UserMenu/index.tsx`
- Create: `packages/ui/src/elements/UserMenu/index.css`

Context: The main popup trigger replacing the Account `<Link>` in `AppHeader`. Uses `renderButton` prop of `Popup` (not `button`) so we can render the avatar as the custom trigger. Uses `useAuth()` for user data, `useConfig()` for `admin.theme` and route config, `useTranslation()` for language options count, `useTheme()` for theme config. The `RenderCustomComponent` utility is used to render the `CustomAvatar` prop with `<Account>` as fallback — matches the existing pattern in `AppHeader`.

The popup content from top to bottom:
1. Profile header block (avatar + name + email/username)
2. Theme sub-trigger (only if `config.admin.theme === 'all'`)
3. Language sub-trigger (only if `languageOptions.length > 1`)
4. `<MenuSeparator />` (always shown — separates preferences from actions)
5. Settings sub-trigger (only if `settingsItems.length > 0`), followed by `<MenuSeparator />`
6. Log out link (Link to `routes.admin + admin.routes.logout`)

The logout route is obtained from `useConfig()`. See `packages/ui/src/elements/Logout/index.tsx` for the exact pattern:
```ts
const { config: { admin: { routes: { logout: logoutRoute } }, routes: { admin: adminRoute } } } = useConfig()
const href = formatAdminURL({ adminRoute, path: logoutRoute })
```

- [ ] **Step 1: Create `packages/ui/src/elements/UserMenu/index.tsx`**

  ```tsx
  'use client'
  import { formatAdminURL } from 'payload/shared'
  import React from 'react'

  import { Account } from '../../graphics/Account/index.js'
  import { useAuth } from '../../providers/Auth/index.js'
  import { useConfig } from '../../providers/Config/index.js'
  import { useTheme } from '../../providers/Theme/index.js'
  import { useTranslation } from '../../providers/Translation/index.js'
  import { Link } from '../Link/index.js'
  import { MenuSeparator } from '../MenuSeparator/index.js'
  import { Popup, PopupList } from '../Popup/index.js'
  import { RenderCustomComponent } from '../RenderCustomComponent/index.js'
  import { LanguageMenu } from './LanguageMenu/index.js'
  import { SettingsMenu } from './SettingsMenu/index.js'
  import { ThemeMenu } from './ThemeMenu/index.js'
  import './index.css'

  const baseClass = 'user-menu'

  type UserMenuProps = {
    CustomAvatar?: React.ReactNode
    settingsItems?: React.ReactNode[]
  }

  export const UserMenu: React.FC<UserMenuProps> = ({ CustomAvatar, settingsItems = [] }) => {
    const { user } = useAuth()
    const { t, languageOptions } = useTranslation()
    const { autoMode, theme } = useTheme()
    const {
      config: {
        admin: {
          routes: { logout: logoutRoute },
          theme: adminTheme,
        },
        routes: { admin: adminRoute },
      },
    } = useConfig()

    const identifier = user?.username ?? user?.email ?? ''
    const hasMultipleLanguages = Array.isArray(languageOptions) && languageOptions.length > 1
    const showThemeMenu = adminTheme === 'all'
    const hasSettingsItems = settingsItems.length > 0
    const showPreferencesGroup = showThemeMenu || hasMultipleLanguages

    const logoutHref = formatAdminURL({ adminRoute, path: logoutRoute })

    return (
      <Popup
        caret={false}
        className={baseClass}
        horizontalAlign="right"
        renderButton={({ active, ...ariaProps }) => (
          <button
            {...ariaProps}
            aria-label={t('authentication:account')}
            className={[`${baseClass}__trigger`, active && `${baseClass}__trigger--active`]
              .filter(Boolean)
              .join(' ')}
            type="button"
          >
            <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
          </button>
        )}
        size="fit-content"
        theme="auto"
        verticalAlign="bottom"
      >
        {/* Profile header */}
        <div className={`${baseClass}__profile`}>
          <div className={`${baseClass}__avatar`}>
            <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
          </div>
          {user?.name && <p className={`${baseClass}__name`}>{user.name}</p>}
          {identifier && <p className={`${baseClass}__identifier`}>{identifier}</p>}
        </div>

        {/* Preferences group: Theme + Language */}
        {showPreferencesGroup && (
          <PopupList.ButtonGroup>
            {showThemeMenu && (
              <PopupList.Button>
                <ThemeMenu />
              </PopupList.Button>
            )}
            {hasMultipleLanguages && (
              <PopupList.Button>
                <LanguageMenu />
              </PopupList.Button>
            )}
          </PopupList.ButtonGroup>
        )}

        <MenuSeparator />

        {/* Settings group */}
        {hasSettingsItems && (
          <>
            <PopupList.ButtonGroup>
              <PopupList.Button>
                <SettingsMenu items={settingsItems} />
              </PopupList.Button>
            </PopupList.ButtonGroup>
            <MenuSeparator />
          </>
        )}

        {/* Account actions */}
        <PopupList.ButtonGroup>
          <PopupList.Button href={logoutHref}>{t('authentication:logOut')}</PopupList.Button>
        </PopupList.ButtonGroup>
      </Popup>
    )
  }
  ```

- [ ] **Step 2: Create `packages/ui/src/elements/UserMenu/index.css`**

  ```css
  .user-menu {
    display: inline-flex;
    align-items: center;
  }

  .user-menu__trigger {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .user-menu__trigger--active {
    opacity: 0.8;
  }

  .user-menu__profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacer-2) var(--spacer-2) var(--spacer-1);
    gap: var(--spacer-s);
  }

  .user-menu__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .user-menu__name {
    font-size: var(--font-size-s);
    font-weight: 600;
    margin: 0;
    text-align: center;
  }

  .user-menu__identifier {
    font-size: var(--font-size-xs);
    color: var(--theme-text-muted);
    margin: 0;
    text-align: center;
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add packages/ui/src/elements/UserMenu/
  git commit -m "feat(ui): add UserMenu popup component"
  ```

---

## Task 7: Update `AppHeader`

**Files:**
- Modify: `packages/ui/src/elements/AppHeader/index.tsx`

Context: Currently renders an Account `<Link>` in lines 125–133. We replace that with `<UserMenu>`. The `CustomAvatar` prop stays on `AppHeader` (forwarded to `UserMenu`). We add a new `settingsItems?: React.ReactNode[]` prop.

- [ ] **Step 1: Update `Props` type and import in `AppHeader/index.tsx`**

  Change the `Props` type (around line 24):
  ```tsx
  // BEFORE:
  type Props = {
    CustomAvatar?: React.ReactNode
  }

  // AFTER:
  type Props = {
    CustomAvatar?: React.ReactNode
    settingsItems?: React.ReactNode[]
  }
  ```

  Add import for `UserMenu` (add near other imports at top of file):
  ```tsx
  import { UserMenu } from '../UserMenu/index.js'
  ```

  Remove the import for `Link` only if it's no longer used (check: `Link` is not used elsewhere in this file, so remove it):
  ```tsx
  // Remove this import if Link is only used for the Account link:
  // import { Link } from '../Link/index.js'
  ```

  > Verify `Link` is not used elsewhere in the file before removing it. If it is used elsewhere, keep the import.

- [ ] **Step 2: Update function signature and JSX in `AppHeader/index.tsx`**

  Change the function signature:
  ```tsx
  // BEFORE:
  export function AppHeader({ CustomAvatar }: Props) {

  // AFTER:
  export function AppHeader({ CustomAvatar, settingsItems }: Props) {
  ```

  Replace lines 125–133 (the Account Link block):
  ```tsx
  // BEFORE:
  <Link
    aria-label={t('authentication:account')}
    className={`${baseClass}__account`}
    href={formatAdminURL({ adminRoute, path: accountRoute })}
    prefetch={false}
    tabIndex={0}
  >
    <RenderCustomComponent CustomComponent={CustomAvatar} Fallback={<Account />} />
  </Link>

  // AFTER:
  <UserMenu CustomAvatar={CustomAvatar} settingsItems={settingsItems} />
  ```

  Since `accountRoute` and `formatAdminURL` are only used for the Account link (check the rest of the file), remove their usage if no longer needed. Specifically:
  - `accountRoute` is destructured from `useConfig()` — remove it from the destructure if unused
  - `formatAdminURL` import — remove if unused
  - `Account` import from `../../graphics/Account/index.js` — remove if unused (now inside `UserMenu`)
  - `RenderCustomComponent` import — remove if unused (now inside `UserMenu`)

- [ ] **Step 3: Type-check `AppHeader`**

  ```bash
  pnpm run build:ui 2>&1 | tail -30
  ```
  Expected: no errors. Any error about unused imports should already be cleaned up.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/ui/src/elements/AppHeader/index.tsx
  git commit -m "feat(ui): replace Account link with UserMenu in AppHeader"
  ```

---

## Task 8: Update `DefaultTemplate`

**Files:**
- Modify: `packages/ui/src/templates/Default/index.tsx`

Context: `DefaultTemplate` is a server component. It already server-renders `CustomAvatar` and passes it to `AppHeader`. We need to:
1. Also server-render `userMenuSettingsItems` from `payload.config.admin.components` using the same `RenderServerComponent` loop pattern as `viewActions`.
2. Pass the resulting `React.ReactNode[]` to `AppHeader` as `settingsItems`.

- [ ] **Step 1: Add `userMenuSettingsItems` rendering to `DefaultTemplate`**

  In `packages/ui/src/templates/Default/index.tsx`, after the `Actions` rendering loop (around line 98–110), add:

  ```tsx
  const settingsItems: React.ReactNode[] =
    components?.userMenuSettingsItems && Array.isArray(components.userMenuSettingsItems)
      ? components.userMenuSettingsItems.map((item, index) =>
          RenderServerComponent({
            clientProps,
            Component: item,
            importMap: payload.importMap,
            key: `user-menu-settings-item-${index}`,
            serverProps,
          }),
        )
      : []
  ```

  This requires accessing `components` (which is already destructured: `const { ..., components, ... } = payload.config || {}`).

  Check the existing destructure at lines 62–70. Currently it reads:
  ```tsx
  const {
    admin: {
      avatar,
      components,
      components: { header: CustomHeader, Nav: CustomNav } = {
        header: undefined,
        Nav: undefined,
      },
    } = {},
  } = payload.config || {}
  ```
  The `components` variable is already available.

- [ ] **Step 2: Pass `settingsItems` to `<AppHeader>`**

  Update the `<AppHeader>` JSX (around lines 135–145):
  ```tsx
  // BEFORE:
  <AppHeader
    CustomAvatar={
      avatar !== 'gravatar' && avatar !== 'default'
        ? RenderServerComponent({
            Component: avatar.Component,
            importMap: payload.importMap,
            serverProps,
          })
        : undefined
    }
  />

  // AFTER:
  <AppHeader
    CustomAvatar={
      avatar !== 'gravatar' && avatar !== 'default'
        ? RenderServerComponent({
            Component: avatar.Component,
            importMap: payload.importMap,
            serverProps,
          })
        : undefined
    }
    settingsItems={settingsItems}
  />
  ```

- [ ] **Step 3: Type-check `DefaultTemplate`**

  ```bash
  pnpm run build:ui 2>&1 | tail -30
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/ui/src/templates/Default/index.tsx
  git commit -m "feat(ui): pass userMenuSettingsItems to AppHeader from DefaultTemplate"
  ```

---

## Task 9: Add missing translation keys

**Files:**
- Modify: `packages/translations/src/languages/en.ts` (and equivalent files for other languages if present, or run `pnpm run translateNewKeys` after English)

Context: The sub-popups use translation keys that may not yet exist. Check and add any missing ones.

- [ ] **Step 1: Identify missing keys**

  Run:
  ```bash
  grep -n "general:auto\|general:light\|general:dark\|general:theme\|general:language\|general:settings" packages/translations/src/languages/en.ts
  ```

  Also check for any existing equivalent keys (e.g. `general:theme` might exist as `theme` under a different namespace).

- [ ] **Step 2: Add missing keys to English translations**

  Open `packages/translations/src/languages/en.ts`. Find the `general` section and add any missing keys. Typical structure:
  ```ts
  general: {
    // ... existing keys ...
    auto: 'Auto',
    dark: 'Dark',
    language: 'Language',
    light: 'Light',
    settings: 'Settings',
    theme: 'Theme',
  }
  ```

  > Only add keys that are genuinely missing. If a key exists under a different path (e.g. `theme:light` instead of `general:light`), update `ThemeMenu` to use the existing key path instead.

- [ ] **Step 3: Update sub-popup components to use confirmed key paths**

  If any key paths in `ThemeMenu`, `LanguageMenu`, or `SettingsMenu` differ from what was added, update those files now.

- [ ] **Step 4: Commit**

  ```bash
  git add packages/translations/src/languages/en.ts packages/ui/src/elements/UserMenu/
  git commit -m "feat(translations): add theme/language/settings keys for UserMenu"
  ```

---

## Task 10: Export `UserMenu` and `MenuSeparator` from client exports

**Files:**
- Modify: `packages/ui/src/exports/client/index.ts`

Context: Components used in server/client code should be exported from the client bundle. The pattern is explicit named exports (no barrel `export *`). `AppHeader` is already exported at line 84.

- [ ] **Step 1: Add exports to `packages/ui/src/exports/client/index.ts`**

  Find the `AppHeader` export (around line 84):
  ```ts
  export { AppHeader } from '../../elements/AppHeader/index.js'
  ```

  Add after it:
  ```ts
  export { MenuSeparator } from '../../elements/MenuSeparator/index.js'
  ```

  Find the `Logout` export (around line 186) and add `UserMenu` nearby (alphabetically between `U` entries):
  ```ts
  export { UserMenu } from '../../elements/UserMenu/index.js'
  ```

- [ ] **Step 2: Verify build**

  ```bash
  pnpm run build:ui 2>&1 | tail -30
  ```
  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add packages/ui/src/exports/client/index.ts
  git commit -m "feat(ui): export UserMenu and MenuSeparator from client bundle"
  ```

---

## Task 11: Full build verification and dev server smoke test

- [ ] **Step 1: Full build**

  ```bash
  pnpm run build:core 2>&1 | tail -40
  ```
  Expected: clean build, no type errors.

- [ ] **Step 2: Start dev server**

  ```bash
  pnpm run dev
  ```
  Open `http://localhost:3000/admin` in a browser (auto-login enabled with `dev@payloadcms.com` / `test`).

- [ ] **Step 3: Manual smoke test**

  - [ ] The header no longer shows a link; it shows the avatar button
  - [ ] Clicking the avatar opens a popup with the profile header (email or name)
  - [ ] The Theme sub-trigger opens a sub-popup with Light / Dark / Auto; clicking each changes the theme
  - [ ] The Language sub-trigger opens if >1 language is configured; clicking a language switches it
  - [ ] A `<MenuSeparator />` visually separates preferences from actions
  - [ ] The Log out item navigates to the logout route
  - [ ] The Settings sub-trigger is hidden (no items registered in dev config)
  - [ ] Keyboard navigation (Tab, Escape) works as expected

- [ ] **Step 4: Final commit (if any cleanup needed)**

  ```bash
  git add -A
  git commit -m "chore: cleanup after user menu popup implementation"
  ```

---

## Self-review checklist

- [x] **Config**: `userMenuSettingsItems` added to `admin.components` in `Config` type; import map generation updated
- [x] **MenuSeparator**: standalone element, reuses `popup-divider` CSS, no coupling to UserMenu or Popup
- [x] **ThemeMenu**: only renders if `config.admin.theme === 'all'` (checked in `UserMenu`, not `ThemeMenu` itself)
- [x] **LanguageMenu**: only renders if `languageOptions.length > 1` (checked in `UserMenu`)
- [x] **SettingsMenu**: only renders if `settingsItems.length > 0` (checked in `UserMenu`)
- [x] **UserMenu props**: `CustomAvatar: React.ReactNode`, `settingsItems: React.ReactNode[]` — matches spec
- [x] **AppHeader**: `settingsItems` prop added; Account `<Link>` removed; unused imports cleaned up
- [x] **DefaultTemplate**: `userMenuSettingsItems` rendered server-side; passed as `settingsItems` to `AppHeader`
- [x] **Exports**: `UserMenu` and `MenuSeparator` exported from client bundle
- [x] **No barrel exports**: all exports are explicit named exports
- [x] **`SanitizedConfig`**: inherits from `Config` via `DeepRequired` — no separate type change needed
- [x] **Account page unchanged**: no changes to `/account` settings; theme/language remain there too
- [x] **Localizer unchanged**: locale selector in `AppHeader` is untouched
- [x] **`formatAdminURL` pattern**: used for logout href (same as `Logout` component reference pattern)
- [x] **User display**: `user.name` (primary, shown if present) + `user.username ?? user.email` (secondary, always muted)

### Potential gap: `name` field on `ClientUser`

`BaseUser` (auth types) has `email` and `username` but not `name`. The spec says to show `user.name` as the primary display name. Since `ClientUser` is typed as `{ [key: string]: any } & BaseUser`, accessing `user?.name` will work at runtime if the collection has a `name` field. If the user collection does not have a `name` field, the primary line simply won't render (conditional `{user?.name && ...}` handles this correctly). No change needed to types.

### Potential gap: `renderButton` vs `button` prop

`Popup` accepts both `button` (a `React.ReactNode` placed as the trigger) and `renderButton` (a render prop for full trigger customization). `UserMenu` uses `renderButton` to get full control over the trigger button's `aria-*` attributes and className. The sub-menus (`ThemeMenu`, `LanguageMenu`, `SettingsMenu`) use `button` (a string label) which uses the default `PopupTrigger` button styling. This is intentional — only the top-level trigger needs the avatar.

### Potential gap: double avatar render

`UserMenu` renders the avatar twice — once in the trigger button and once in the profile header inside the popup. This matches the Figma design (trigger = avatar only, popup header = avatar + name + identifier). This is correct behavior per spec.
