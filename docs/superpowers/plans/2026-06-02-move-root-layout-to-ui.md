# Move RootLayout from `packages/next` to `packages/ui` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the framework-agnostic parts of `RootLayout` into `@payloadcms/ui`. `packages/next` keeps a thin wrapper that injects Next-specific bits (fonts, router adapter, dependency check) so existing apps continue to work with zero migration.

**Architecture:** Lift-and-shift of layout + supporting utilities from `packages/next/src/{layouts,utilities}` into `packages/ui/src/{layouts,utilities}`. Replace `next/headers`/`next/font` couplings with: (1) `ServerAdapter` (`config.server.getHeaders/getCookies/setCookie`) for server bits, (2) a new `fonts` prop for fonts, (3) a `RouterAdapter` prop for the client router. The Next wrapper supplies all three.

**Tech Stack:** TypeScript, React Server Components, Next.js, pnpm workspaces, SWC, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-02-move-root-layout-to-ui-design.md`

---

## File Plan

### New files in `packages/ui`

| Path                                                  | Responsibility                                   |
| ----------------------------------------------------- | ------------------------------------------------ |
| `packages/ui/src/utilities/selectiveCache.ts`         | React `cache()` wrapper, pure                    |
| `packages/ui/src/utilities/getPreferences.ts`         | Reads `payload-preferences` for the request user |
| `packages/ui/src/utilities/getRequestLocale.ts`       | Resolves request locale from query/prefs         |
| `packages/ui/src/utilities/getRequestTheme.ts`        | Resolves theme from cookie/header/config         |
| `packages/ui/src/utilities/getRequestHighContrast.ts` | Resolves high-contrast preference                |
| `packages/ui/src/utilities/initReq.ts`                | Builds `InitReqResult` using `ServerAdapter`     |
| `packages/ui/src/layouts/Root/NestProviders.tsx`      | Recursive provider nester                        |
| `packages/ui/src/layouts/Root/index.tsx`              | Framework-agnostic `RootLayout`                  |
| `packages/ui/src/exports/layouts.ts`                  | Barrel re-exporting `metadata`, `RootLayout`     |

### Modified files in `packages/ui`

| Path                       | Change                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| `packages/ui/package.json` | Add `"./layouts"` and `"./utilities/initReq"` entries to `exports` |

### Modified files in `packages/next`

| Path                                                                                          | Change                                        |
| --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `packages/next/src/layouts/Root/index.tsx`                                                    | Rewrite as thin wrapper around `UIRootLayout` |
| `packages/next/src/utilities/handleServerFunctions.ts`                                        | Re-point `initReq` import                     |
| `packages/next/src/views/NotFound/index.tsx`                                                  | Re-point `initReq` import                     |
| `packages/next/src/views/Root/index.tsx`                                                      | Re-point `initReq` + `getPreferences` imports |
| `packages/next/src/views/Document/index.tsx`                                                  | Re-point `getPreferences` import              |
| `packages/next/src/views/Dashboard/Default/ModularDashboard/utils/getItemsFromPreferences.ts` | Re-point `getPreferences` import              |

### Deleted files in `packages/next`

- `packages/next/src/layouts/Root/NestProviders.tsx`
- `packages/next/src/utilities/initReq.ts`
- `packages/next/src/utilities/getRequestTheme.ts`
- `packages/next/src/utilities/getRequestHighContrast.ts`
- `packages/next/src/utilities/selectiveCache.ts`
- `packages/next/src/utilities/getRequestLocale.ts`
- `packages/next/src/utilities/getPreferences.ts`

---

## Phase 1: Move pure utilities to `packages/ui`

Phase 1 adds new files in `packages/ui`. No deletions yet; no `packages/next` files reference the new locations yet. Build still passes.

### Task 1: Move `selectiveCache` to ui

**Files:**

- Create: `packages/ui/src/utilities/selectiveCache.ts`

- [ ] **Step 1: Create the new file**

Write `packages/ui/src/utilities/selectiveCache.ts`:

```typescript
import { cache } from 'react'

type CachedValue = object

// Module-scoped cache container that holds all cached, stable containers
// - these may hold the stable value, or a promise to the stable value
const globalCacheContainer: Record<
  string,
  <TValue extends object = CachedValue>(
    ...args: unknown[]
  ) => {
    value: null | Promise<TValue> | TValue
  }
> = {}

/**
 * Creates a selective cache function that provides more control over React's request-level caching behavior.
 *
 * @param namespace - A namespace to group related cached values
 * @returns A function that manages cached values within the specified namespace
 */
export function selectiveCache<TValue extends object = CachedValue>(
  namespace: string,
) {
  if (!globalCacheContainer[namespace]) {
    globalCacheContainer[namespace] = cache((...args) => ({
      value: null,
    }))
  }

  /**
   * Gets or creates a cached value for a specific key within the namespace
   *
   * @param key - The key to identify the cached value
   * @param factory - A function that produces the value if not cached
   * @returns The cached or newly created value
   */
  const getCached = async (
    factory: () => Promise<TValue>,
    ...cacheArgs
  ): Promise<TValue> => {
    const stableObjectFn = globalCacheContainer[namespace]
    const stableObject = stableObjectFn<TValue>(...cacheArgs)

    if (
      stableObject?.value &&
      'then' in stableObject.value &&
      typeof stableObject.value?.then === 'function'
    ) {
      return await stableObject.value
    }

    stableObject.value = factory()

    return await stableObject.value
  }

  return {
    get: getCached,
  }
}
```

- [ ] **Step 2: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS (no errors related to the new file)

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/utilities/selectiveCache.ts
git commit -m "chore(ui): add selectiveCache utility (moving from @payloadcms/next)"
```

---

### Task 2: Move `getPreferences` to ui

**Files:**

- Create: `packages/ui/src/utilities/getPreferences.ts`

- [ ] **Step 1: Create the new file**

Write `packages/ui/src/utilities/getPreferences.ts`:

```typescript
import type { DefaultDocumentIDType, Payload } from 'payload'

import { cache } from 'react'

export const getPreferences = cache(
  async <T>(
    key: string,
    payload: Payload,
    userID: DefaultDocumentIDType,
    userSlug: string,
  ): Promise<{ id: DefaultDocumentIDType; value: T }> => {
    const result = (await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        pagination: false,
        where: {
          and: [
            {
              key: {
                equals: key,
              },
            },
            {
              'user.relationTo': {
                equals: userSlug,
              },
            },
            {
              'user.value': {
                equals: userID,
              },
            },
          ],
        },
      })
      .then((res) => res.docs?.[0])) as { id: DefaultDocumentIDType; value: T }

    return result
  },
)
```

- [ ] **Step 2: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/utilities/getPreferences.ts
git commit -m "chore(ui): add getPreferences utility (moving from @payloadcms/next)"
```

---

### Task 3: Move `getRequestLocale` to ui

**Files:**

- Create: `packages/ui/src/utilities/getRequestLocale.ts`

- [ ] **Step 1: Create the new file**

Note the relative imports: `upsertPreferences` and `findLocaleFromCode` are in ui already; replace package self-imports with local relative paths.

Write `packages/ui/src/utilities/getRequestLocale.ts`:

```typescript
import type { Locale, PayloadRequest } from 'payload'

import { findLocaleFromCode } from '../utilities/findLocaleFromCode/index.js'
import { upsertPreferences } from '../utilities/upsertPreferences.js'
import { getPreferences } from './getPreferences.js'

type GetRequestLocalesArgs = {
  req: PayloadRequest
}

export async function getRequestLocale({
  req,
}: GetRequestLocalesArgs): Promise<Locale> {
  if (req.payload.config.localization) {
    const localeFromParams = req.query.locale as string | undefined

    if (req.user && localeFromParams) {
      await upsertPreferences<Locale['code']>({
        key: 'locale',
        req,
        value: localeFromParams,
      })
    }

    return (
      (req.user &&
        findLocaleFromCode(
          req.payload.config.localization,
          localeFromParams ||
            (
              await getPreferences<Locale['code']>(
                'locale',
                req.payload,
                req.user.id,
                req.user.collection,
              )
            )?.value,
        )) ||
      findLocaleFromCode(
        req.payload.config.localization,
        req.payload.config.localization.defaultLocale || 'en',
      )
    )
  }

  return undefined
}
```

- [ ] **Step 2: Verify relative paths resolve**

Run: `ls packages/ui/src/utilities/findLocaleFromCode/index.* packages/ui/src/utilities/upsertPreferences.* 2>/dev/null`
Expected: paths exist. If not, use `grep -rn "export.*upsertPreferences\|export.*findLocaleFromCode" packages/ui/src/` to locate them and adjust imports.

- [ ] **Step 3: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/utilities/getRequestLocale.ts
git commit -m "chore(ui): add getRequestLocale utility (moving from @payloadcms/next)"
```

---

### Task 4: Move `getRequestTheme` to ui (type-cleaned)

**Files:**

- Create: `packages/ui/src/utilities/getRequestTheme.ts`

Drops the Next-internal `ReadonlyRequestCookies` type. The function reads only `.get(name)` from the cookie store, so any object that exposes `get(name): { value: string } | string | undefined` works.

- [ ] **Step 1: Inspect `CookieStore` from payload**

Run: `grep -n "type CookieStore" packages/payload/src/admin/adapters/cookies.ts`
Expected: a `CookieStore` shape with at least a `get(name)` method returning `{ name, value } | undefined`. Confirm the function signature accepts it. If `CookieStore.get` returns `undefined` or `{ value }`, the existing `themeCookie?.value` access matches.

- [ ] **Step 2: Create the new file**

Write `packages/ui/src/utilities/getRequestTheme.ts`:

```typescript
import type { CookieStore } from 'payload'
import type { SanitizedConfig } from 'payload'

import { defaultTheme, type Theme } from '../providers/Theme/types.js'

type GetRequestThemeArgs = {
  config: SanitizedConfig
  cookies: CookieStore | Map<string, string>
  headers: Request['headers']
}

const acceptedThemes: Theme[] = ['dark', 'light']

export const getRequestTheme = ({
  config,
  cookies,
  headers,
}: GetRequestThemeArgs): Theme => {
  if (
    config.admin.theme !== 'all' &&
    acceptedThemes.includes(config.admin.theme)
  ) {
    return config.admin.theme
  }

  const themeCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`)

  const themeFromCookie: Theme = (
    typeof themeCookie === 'string' ? themeCookie : themeCookie?.value
  ) as Theme

  if (themeFromCookie && acceptedThemes.includes(themeFromCookie)) {
    return themeFromCookie
  }

  const themeFromHeader = headers.get('Sec-CH-Prefers-Color-Scheme') as Theme

  if (themeFromHeader && acceptedThemes.includes(themeFromHeader)) {
    return themeFromHeader
  }

  return defaultTheme
}
```

- [ ] **Step 3: Verify `defaultTheme`/`Theme` import path**

Run: `grep -rn "export.*defaultTheme\|export type Theme\b" packages/ui/src/providers/Theme/`
Expected: located. Adjust the import if the actual path differs.

- [ ] **Step 4: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS. If `CookieStore` is not exported from `payload` root, import from `payload/shared` instead.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/utilities/getRequestTheme.ts
git commit -m "chore(ui): add getRequestTheme utility (moving from @payloadcms/next)"
```

---

### Task 5: Move `getRequestHighContrast` to ui (type-cleaned)

**Files:**

- Create: `packages/ui/src/utilities/getRequestHighContrast.ts`

- [ ] **Step 1: Create the new file**

Write `packages/ui/src/utilities/getRequestHighContrast.ts`:

```typescript
import type { CookieStore, SanitizedConfig } from 'payload'

type GetRequestHighContrastArgs = {
  config: SanitizedConfig
  cookies: CookieStore | Map<string, string>
  headers: Request['headers']
}

export const getRequestHighContrast = ({
  config,
  cookies,
  headers,
}: GetRequestHighContrastArgs): boolean => {
  const cookieKey = `${config.cookiePrefix || 'payload'}-high-contrast-mode`
  const modeCookie = cookies.get(cookieKey)

  const modeFromCookie =
    typeof modeCookie === 'string' ? modeCookie : modeCookie?.value

  if (modeFromCookie === 'true') {
    return true
  }
  if (modeFromCookie === 'false') {
    return false
  }

  const contrastHeader = headers.get('Sec-CH-Prefers-Contrast')

  return contrastHeader === 'more' || contrastHeader === 'forced'
}
```

- [ ] **Step 2: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/utilities/getRequestHighContrast.ts
git commit -m "chore(ui): add getRequestHighContrast utility (moving from @payloadcms/next)"
```

---

## Phase 2: Move `initReq` to ui using `ServerAdapter`

### Task 6: Create ui `initReq` decoupled from `next/headers`

**Files:**

- Create: `packages/ui/src/utilities/initReq.ts`

- [ ] **Step 1: Confirm `ServerAdapter.getHeaders` available on `config.server`**

Run: `grep -n "server:\|server?:" packages/payload/src/config/types.ts | head -5`
Expected: a `server: ServerAdapter` field on `SanitizedConfig`. The Next side already wires `config.server = nextServerAdapter` during init (verify with `grep -rn "config.server = \|server: nextServerAdapter" packages/next/src/`).

If the wiring is missing or only happens later than `initReq` runs, stop and resolve the gap before continuing. Without `config.server.getHeaders`, this task cannot be completed.

- [ ] **Step 2: Create the new file**

Write `packages/ui/src/utilities/initReq.ts`:

```typescript
import type { I18n, I18nClient } from '@payloadcms/translations'
import type {
  ImportMap,
  InitReqResult,
  PayloadRequest,
  SanitizedConfig,
} from 'payload'

import { initI18n } from '@payloadcms/translations'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'

import { getRequestLocale } from './getRequestLocale.js'
import { selectiveCache } from './selectiveCache.js'

type PartialResult = {
  i18n: I18nClient
} & Pick<InitReqResult, 'languageCode'> &
  Pick<PayloadRequest, 'payload' | 'responseHeaders' | 'user'>

const partialReqCache = selectiveCache<PartialResult>('partialReq')
const reqCache = selectiveCache<InitReqResult>('req')

/**
 * Initializes a full request object, including the `req` object and access control.
 * Reads headers/cookies through `config.server` (`ServerAdapter`) so the function is
 * framework-agnostic; the consuming framework wires its own adapter.
 */
export const initReq = async function ({
  canSetHeaders,
  configPromise,
  importMap,
  key,
  overrides,
}: {
  canSetHeaders?: boolean
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key: string
  overrides?: Parameters<typeof createLocalReq>[0]
}): Promise<InitReqResult> {
  const config = await configPromise
  const headers = await config.server.getHeaders()
  const cookies = parseCookies(headers)

  const partialResult = await partialReqCache.get(async () => {
    const payload = await getPayload({ config, cron: true, importMap })
    const languageCode = getRequestLanguage({
      config,
      cookies,
      headers,
    })

    const i18n: I18nClient = await initI18n({
      config: config.i18n,
      context: 'client',
      language: languageCode,
    })

    const { responseHeaders, user } = await executeAuthStrategies({
      canSetHeaders,
      headers,
      payload,
    })

    return {
      i18n,
      languageCode,
      payload,
      responseHeaders,
      user,
    }
  }, 'global')

  return reqCache
    .get(async () => {
      const { i18n, languageCode, payload, responseHeaders, user } =
        partialResult

      const { req: reqOverrides, ...optionsOverrides } = overrides || {}

      const req = await createLocalReq(
        {
          req: {
            headers,
            host: headers.get('host'),
            i18n: i18n as I18n,
            responseHeaders,
            server: config.server,
            user,
            ...(reqOverrides || {}),
          },
          ...(optionsOverrides || {}),
        },
        payload,
      )

      const locale = await getRequestLocale({
        req,
      })

      req.locale = locale?.code

      const permissions = await getAccessResults({
        req,
      })

      return {
        cookies,
        headers,
        languageCode,
        locale,
        permissions,
        req,
      }
    }, key)
    .then((result) => {
      // Shallow-copy req before returning to prevent
      // mutations from propagating to the cached req object.
      // This ensures parallel operations using the same cache key don't affect each other.
      return {
        ...result,
        req: {
          ...result.req,
          ...(result.req?.context
            ? {
                context: { ...result.req.context },
              }
            : {}),
        },
      }
    })
}
```

Two substantive deltas vs the old `next` version:

1. `const config = await configPromise; const headers = await config.server.getHeaders()` replaces `const headers = await getHeaders()` and moves the config resolution above the partial cache.
2. `server: config.server` (inside `createLocalReq`'s `req`) replaces `server: nextServerAdapter`.

- [ ] **Step 3: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/utilities/initReq.ts
git commit -m "chore(ui): add initReq utility using ServerAdapter (moving from @payloadcms/next)"
```

---

## Phase 3: Add ui `RootLayout`

### Task 7: Add `NestProviders` to ui

**Files:**

- Create: `packages/ui/src/layouts/Root/NestProviders.tsx`

- [ ] **Step 1: Verify `RenderServerComponent` import path**

Run: `grep -rn "export.*RenderServerComponent" packages/ui/src/elements/RenderServerComponent/`
Expected: located. The current Next version imports from `@payloadcms/ui/elements/RenderServerComponent` — inside ui, use a relative path.

- [ ] **Step 2: Create the new file**

Write `packages/ui/src/layouts/Root/NestProviders.tsx`:

```tsx
import type { Config, ImportMap, ServerProps } from 'payload'

import React from 'react'

import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import '../../scss/app.scss'

type Args = {
  readonly children: React.ReactNode
  readonly importMap: ImportMap
  readonly providers: Config['admin']['components']['providers']
  readonly serverProps: ServerProps
}

export function NestProviders({
  children,
  importMap,
  providers,
  serverProps,
}: Args): React.ReactNode {
  return RenderServerComponent({
    clientProps: {
      children:
        providers.length > 1 ? (
          <NestProviders
            importMap={importMap}
            providers={providers.slice(1)}
            serverProps={serverProps}
          >
            {children}
          </NestProviders>
        ) : (
          children
        ),
    },
    Component: providers[0],
    importMap,
    serverProps,
  })
}
```

- [ ] **Step 3: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/layouts/Root/NestProviders.tsx
git commit -m "chore(ui): add NestProviders (moving from @payloadcms/next)"
```

---

### Task 8: Add ui `RootLayout`

**Files:**

- Create: `packages/ui/src/layouts/Root/index.tsx`

- [ ] **Step 1: Verify `getNavPrefs`, `getClientConfig` import paths**

Run:

```bash
grep -rn "export.*getNavPrefs\|export.*getClientConfig" packages/ui/src/elements/Nav/getNavPrefs.ts packages/ui/src/utilities/getClientConfig.ts
```

Expected: both exports located. Adjust relative paths in the file below if the actual locations differ.

- [ ] **Step 2: Create the new file**

Write `packages/ui/src/layouts/Root/index.tsx`:

````tsx
import type { AcceptedLanguages } from '@payloadcms/translations'
import type {
  ImportMap,
  LanguageOptions,
  SanitizedConfig,
  ServerFunctionClient,
} from 'payload'

import { rtlLanguages } from '@payloadcms/translations'
import { applyLocaleFiltering } from 'payload/shared'
import React, { Suspense } from 'react'

import { getNavPrefs } from '../../elements/Nav/getNavPrefs.js'
import { ProgressBar } from '../../providers/RouteTransition/ProgressBar/index.js'
import { RootProvider } from '../../providers/Root/index.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getRequestHighContrast } from '../../utilities/getRequestHighContrast.js'
import { getRequestTheme } from '../../utilities/getRequestTheme.js'
import { initReq } from '../../utilities/initReq.js'
import { NestProviders } from './NestProviders.js'

import '../../scss/app.scss'

type Font = {
  className?: string
  variable?: string
}

export const metadata = {
  description: 'Generated by Next.js',
  title: 'Next.js',
}

type RootLayoutProps = {
  readonly children: React.ReactNode
  readonly config: Promise<SanitizedConfig>
  /**
   * Fonts to apply to the admin `<html>` element. Each entry's
   * `variable ?? className` is appended to the `<html>` class list.
   * Framework-specific font loaders (e.g. `next/font`) are supplied by the caller.
   */
  readonly fonts?: Font[]
  /**
   * Custom content to render inside the admin panel's `<head>` element.
   *
   * Use this to inject scripts, meta tags, or links — for example, analytics
   * snippets via `next/script`, custom favicons, or preconnect hints.
   *
   * @example
   * ```tsx
   * import Script from 'next/script'
   *
   * <RootLayout
   *   head={<Script src="https://example.com/analytics.js" strategy="afterInteractive" />}
   *   {...rest}
   * />
   * ```
   */
  readonly head?: React.ReactNode
  readonly htmlProps?: React.HtmlHTMLAttributes<HTMLHtmlElement>
  readonly importMap: ImportMap
  /**
   * Client router adapter. Caller supplies a framework-specific provider
   * (for Next.js use the `NextRouterAdapter` exported from `@payloadcms/next`).
   */
  readonly RouterAdapter: React.FC<{ children: React.ReactNode }>
  readonly serverFunction: ServerFunctionClient
}

export const RootLayout = (props: RootLayoutProps) => {
  const content = <RootLayoutContent {...props} />

  if (process.env.PAYLOAD_CACHE_COMPONENTS_ENABLED === 'true') {
    return <Suspense fallback={null}>{content}</Suspense>
  }

  return content
}

const RootLayoutContent = async ({
  children,
  config: configPromise,
  fonts = [],
  head: headFromProps,
  htmlProps = {},
  importMap,
  RouterAdapter,
  serverFunction,
}: RootLayoutProps) => {
  const {
    cookies,
    headers,
    languageCode,
    permissions,
    req,
    req: {
      payload: { config },
    },
  } = await initReq({ configPromise, importMap, key: 'RootLayout' })

  const theme = getRequestTheme({
    config,
    cookies,
    headers,
  })

  const highContrastMode = getRequestHighContrast({
    config,
    cookies,
    headers,
  })

  const dir = (rtlLanguages as unknown as AcceptedLanguages[]).includes(
    languageCode,
  )
    ? 'RTL'
    : 'LTR'

  const languageOptions: LanguageOptions = Object.entries(
    config.i18n.supportedLanguages || {},
  ).reduce((acc, [language, languageConfig]) => {
    if (Object.keys(config.i18n.supportedLanguages).includes(language)) {
      acc.push({
        label: languageConfig.translations.general.thisLanguage,
        value: language,
      })
    }

    return acc
  }, [])

  async function switchLanguageServerAction(lang: string): Promise<void> {
    'use server'
    await config.server.setCookie(
      `${config.cookiePrefix || 'payload'}-lng`,
      lang,
      {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      },
    )
  }

  const navPrefs = await getNavPrefs(req)

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  const fontClassNames = fonts
    .map((f) => f.variable ?? f.className)
    .filter(Boolean)

  return (
    <html
      {...htmlProps}
      className={[...fontClassNames, htmlProps?.className]
        .filter(Boolean)
        .join(' ')}
      data-enhanced-contrast={highContrastMode ? '' : undefined}
      data-theme={theme}
      dir={dir}
      lang={languageCode}
      suppressHydrationWarning={
        config?.admin?.suppressHydrationWarning ?? false
      }
    >
      <head>
        <style>{`@layer payload-default, payload;`}</style>
        {headFromProps}
      </head>
      <body>
        <RootProvider
          config={clientConfig}
          dateFNSKey={req.i18n.dateFNSKey}
          fallbackLang={config.i18n.fallbackLanguage}
          highContrastMode={highContrastMode}
          isNavOpen={navPrefs?.open ?? true}
          languageCode={languageCode}
          languageOptions={languageOptions}
          locale={req.locale}
          permissions={req.user ? permissions : null}
          RouterAdapter={RouterAdapter}
          serverFunction={serverFunction}
          switchLanguageServerAction={switchLanguageServerAction}
          theme={theme}
          translations={req.i18n.translations}
          user={req.user}
        >
          <ProgressBar />
          {Array.isArray(config.admin?.components?.providers) &&
          config.admin?.components?.providers.length > 0 ? (
            <NestProviders
              importMap={req.payload.importMap}
              providers={config.admin?.components?.providers}
              serverProps={{
                i18n: req.i18n,
                payload: req.payload,
                permissions,
                server: req.server,
                user: req.user,
              }}
            >
              {children}
            </NestProviders>
          ) : (
            children
          )}
        </RootProvider>
        <div id="portal" />
      </body>
    </html>
  )
}
````

- [ ] **Step 3: Type-check ui**

Run: `pnpm --filter @payloadcms/ui exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/layouts/Root/index.tsx
git commit -m "feat(ui): add framework-agnostic RootLayout"
```

---

### Task 9: Add ui `layouts` export barrel + package export entries

**Files:**

- Create: `packages/ui/src/exports/layouts.ts`
- Modify: `packages/ui/package.json`

- [ ] **Step 1: Create the barrel**

Write `packages/ui/src/exports/layouts.ts`:

```typescript
export { metadata, RootLayout } from '../layouts/Root/index.js'
```

- [ ] **Step 2: Add `"./layouts"` and `"./utilities/initReq"` to `packages/ui/package.json` `exports`**

Open `packages/ui/package.json`. Find the `exports` object (it lists existing entries like `"./rsc"`, `"./scss"`, `"./elements/*"`). Add the following two entries (alphabetical ordering with siblings is fine but not required — match the file's current style):

```json
"./layouts": {
  "import": "./src/exports/layouts.ts",
  "types": "./src/exports/layouts.ts",
  "default": "./src/exports/layouts.ts"
},
"./utilities/initReq": {
  "import": "./src/utilities/initReq.ts",
  "types": "./src/utilities/initReq.ts",
  "default": "./src/utilities/initReq.ts"
},
```

- [ ] **Step 3: Verify the export resolves**

Run from the repo root:

```bash
node -e "console.log(require('./packages/ui/package.json').exports['./layouts'])"
```

Expected: prints the new entry object.

- [ ] **Step 4: Type-check both packages**

Run: `pnpm --filter @payloadcms/ui --filter @payloadcms/next exec tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/exports/layouts.ts packages/ui/package.json
git commit -m "feat(ui): export RootLayout and initReq utility"
```

---

## Phase 4: Switch `packages/next` to consume from ui

### Task 10: Rewrite Next-side `RootLayout` as thin wrapper

**Files:**

- Modify: `packages/next/src/layouts/Root/index.tsx`

- [ ] **Step 1: Replace the file contents entirely**

Write `packages/next/src/layouts/Root/index.tsx`:

```tsx
import { RootLayout as UIRootLayout } from '@payloadcms/ui/layouts'
// @ts-expect-error - TS6 NodeNext rejects deep imports into `next` (no `exports` field), but Next.js compiler requires this exact specifier
import { Inter, Roboto_Mono } from 'next/font/google'
import React from 'react'

import { NextRouterAdapter } from '../../adapters/router.js'
import { checkDependencies } from './checkDependencies.js'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-family-sans',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-family-mono',
})

export { metadata } from '@payloadcms/ui/layouts'

type Props = Omit<
  React.ComponentProps<typeof UIRootLayout>,
  'fonts' | 'RouterAdapter'
>

export const RootLayout = (props: Props) => {
  checkDependencies()

  return (
    <UIRootLayout
      {...props}
      fonts={[
        { className: inter.className, variable: inter.variable },
        { className: robotoMono.className, variable: robotoMono.variable },
      ]}
      RouterAdapter={NextRouterAdapter}
    />
  )
}
```

- [ ] **Step 2: Type-check next**

Run: `pnpm --filter @payloadcms/next exec tsc --noEmit`
Expected: PASS. If you get a missing-export error for `@payloadcms/ui/layouts`, re-check Task 9 Step 2.

- [ ] **Step 3: Commit**

```bash
git add packages/next/src/layouts/Root/index.tsx
git commit -m "refactor(next): make RootLayout a thin wrapper over @payloadcms/ui/layouts"
```

---

### Task 11: Re-point Next-side callers of `initReq` and `getPreferences`

**Files:**

- Modify: `packages/next/src/utilities/handleServerFunctions.ts`
- Modify: `packages/next/src/views/NotFound/index.tsx`
- Modify: `packages/next/src/views/Root/index.tsx`
- Modify: `packages/next/src/views/Document/index.tsx`
- Modify: `packages/next/src/views/Dashboard/Default/ModularDashboard/utils/getItemsFromPreferences.ts`

- [ ] **Step 1: Discover every remaining caller**

Run:

```bash
grep -rn "from.*utilities/initReq\|from.*utilities/getPreferences\|from.*utilities/getRequestLocale\|from.*utilities/getRequestTheme\|from.*utilities/getRequestHighContrast\|from.*utilities/selectiveCache" packages/next/src/ 2>/dev/null
```

Expected: only the files listed above. If others show up, add them to this task before continuing.

- [ ] **Step 2: Update `handleServerFunctions.ts`**

In `packages/next/src/utilities/handleServerFunctions.ts`, replace:

```typescript
import { initReq } from './initReq.js'
```

with:

```typescript
import { initReq } from '@payloadcms/ui/utilities/initReq'
```

- [ ] **Step 3: Update `views/NotFound/index.tsx`**

In `packages/next/src/views/NotFound/index.tsx`, replace:

```typescript
import { initReq } from '../../utilities/initReq.js'
```

with:

```typescript
import { initReq } from '@payloadcms/ui/utilities/initReq'
```

- [ ] **Step 4: Update `views/Root/index.tsx`**

In `packages/next/src/views/Root/index.tsx`, replace both:

```typescript
import { initReq } from '../../utilities/initReq.js'
```

```typescript
import { getPreferences } from '../../utilities/getPreferences.js'
```

with the corresponding ui imports. `getPreferences` is exposed via the existing `@payloadcms/ui/rsc` export — verify:

Run: `grep -n "getPreferences" packages/ui/src/exports/rsc/index.ts`

- If it is already exported, use `import { getPreferences } from '@payloadcms/ui/rsc'`.
- If not, add this single line to `packages/ui/src/exports/rsc/index.ts`:
  ```typescript
  export { getPreferences } from '../../utilities/getPreferences.js'
  ```
  and then use the same import path in `views/Root/index.tsx`.

The `initReq` import becomes `import { initReq } from '@payloadcms/ui/utilities/initReq'`.

- [ ] **Step 5: Update `views/Document/index.tsx`**

In `packages/next/src/views/Document/index.tsx`, replace:

```typescript
import { getPreferences } from '../../utilities/getPreferences.js'
```

with:

```typescript
import { getPreferences } from '@payloadcms/ui/rsc'
```

(Use the same export path that Step 4 settled on.)

- [ ] **Step 6: Update `views/Dashboard/Default/ModularDashboard/utils/getItemsFromPreferences.ts`**

In that file, replace:

```typescript
import { getPreferences } from '../../../../../utilities/getPreferences.js'
```

with:

```typescript
import { getPreferences } from '@payloadcms/ui/rsc'
```

- [ ] **Step 7: Type-check next**

Run: `pnpm --filter @payloadcms/next exec tsc --noEmit`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add packages/next/src/utilities/handleServerFunctions.ts packages/next/src/views/NotFound/index.tsx packages/next/src/views/Root/index.tsx packages/next/src/views/Document/index.tsx packages/next/src/views/Dashboard/Default/ModularDashboard/utils/getItemsFromPreferences.ts packages/ui/src/exports/rsc/index.ts
git commit -m "refactor(next): consume initReq and getPreferences from @payloadcms/ui"
```

(If `rsc/index.ts` was not modified, drop it from the `git add` list.)

---

## Phase 5: Delete the old `packages/next` files

Once nothing in `packages/next` imports the old utilities, they can be removed.

### Task 12: Delete duplicated files

**Files:**

- Delete: `packages/next/src/layouts/Root/NestProviders.tsx`
- Delete: `packages/next/src/utilities/initReq.ts`
- Delete: `packages/next/src/utilities/getRequestTheme.ts`
- Delete: `packages/next/src/utilities/getRequestHighContrast.ts`
- Delete: `packages/next/src/utilities/selectiveCache.ts`
- Delete: `packages/next/src/utilities/getRequestLocale.ts`
- Delete: `packages/next/src/utilities/getPreferences.ts`

- [ ] **Step 1: Confirm zero remaining importers**

Run:

```bash
grep -rn "from.*layouts/Root/NestProviders\|from.*utilities/initReq\|from.*utilities/getRequestTheme\|from.*utilities/getRequestHighContrast\|from.*utilities/selectiveCache\|from.*utilities/getRequestLocale\|from.*utilities/getPreferences" packages/next/src/ 2>/dev/null
```

Expected: no matches. If any remain, fix them before continuing — do not proceed with the delete.

- [ ] **Step 2: Delete the files**

```bash
git rm \
  packages/next/src/layouts/Root/NestProviders.tsx \
  packages/next/src/utilities/initReq.ts \
  packages/next/src/utilities/getRequestTheme.ts \
  packages/next/src/utilities/getRequestHighContrast.ts \
  packages/next/src/utilities/selectiveCache.ts \
  packages/next/src/utilities/getRequestLocale.ts \
  packages/next/src/utilities/getPreferences.ts
```

- [ ] **Step 3: Type-check next**

Run: `pnpm --filter @payloadcms/next exec tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(next): drop duplicated layout utilities now living in @payloadcms/ui"
```

---

## Phase 6: Build + verification

### Task 13: Full type-check across both packages

- [ ] **Step 1: Run combined type-check**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 2: Build the core packages**

Run: `pnpm run build:core`
Expected: PASS

- [ ] **Step 3: If failures, fix and re-run**

Read the first error, fix it inline, re-run from Step 2 until clean. Do not commit until clean. Once clean, no commit needed — this is a verification gate.

---

### Task 14: Dev-mode smoke test

- [ ] **Step 1: Start the dev server**

Run (in a terminal you can leave open): `pnpm run dev`
Wait for `Ready in ...` log line on `http://localhost:3000`.

- [ ] **Step 2: Verify admin loads**

Open `http://localhost:3000/admin` in a browser. Auto-login should land you on the dashboard.

- [ ] **Step 3: Inspect `<html>` for font variables**

Right-click → Inspect the `<html>` element. The `class` attribute must contain both `--font-family-sans` (Inter variable) and `--font-family-mono` (Roboto Mono variable) class strings.

If either variable is missing, the `fonts` prop is not being wired correctly — revisit Task 8 (font class merging) and Task 10 (font instances passed in).

- [ ] **Step 4: Test theme toggle**

In the admin, switch the theme via the user menu. Reload the page. The theme cookie should persist; `data-theme` on `<html>` should reflect the choice.

- [ ] **Step 5: Test language switcher**

Switch language via the user menu. The page reloads in the chosen language and the cookie persists across reloads. This exercises the inline `switchLanguageServerAction` and `config.server.setCookie` path.

If the cookie does not persist, the `ServerAdapter.setCookie` wiring is wrong — verify `nextServerAdapter.setCookie` does write the cookie (`packages/next/src/adapters/server.ts`).

- [ ] **Step 6: Stop the dev server**

Ctrl-C the terminal from Step 1.

---

### Task 15: Production-mode smoke test

Dev mode does not catch client/server boundary issues. Per the project's `CLAUDE.md`, production-mode test is required.

- [ ] **Step 1: Prepare prod test setup**

Run: `pnpm prepare-run-test-against-prod`
Expected: PASS

- [ ] **Step 2: Start the prod-mode dev server**

Run (in a terminal you can leave open): `pnpm dev:prod fields`
Wait for ready log.

- [ ] **Step 3: Repeat the admin smoke test**

Open the admin in a browser. Click into the `fields` collection. Edit a document. Save.

If you see an "`use client` boundary"-related error or a missing component error in the browser console, that signals the move broke a server/client export. Inspect the offending import and verify it uses the explicit named-export pattern (see `CLAUDE.md` — "RSC/Client Bundling Rules"). Fix and rerun from Step 1.

- [ ] **Step 4: Stop the prod-mode server**

Ctrl-C the terminal from Step 2.

---

### Task 16: Integration + e2e tests

- [ ] **Step 1: Run integration tests for `fields` suite**

Run: `pnpm run test:int fields`
Expected: PASS

- [ ] **Step 2: Run an e2e suite that exercises the admin shell**

Run: `pnpm run test:e2e fields`
Expected: PASS

If either suite fails with a pre-existing flake, re-run once. If a failure references RootLayout/initReq/getPreferences specifically, fix in place.

---

### Task 17: Final commit cleanup

- [ ] **Step 1: Inspect commit log**

Run: `git log --oneline refactor/move-root-layout ^main`
Expected: an ordered list of small commits matching the phases above.

- [ ] **Step 2: Inspect diff stat**

Run: `git diff --stat main..HEAD`
Expected: shows files added in `packages/ui`, files deleted in `packages/next`, a single rewritten `packages/next/src/layouts/Root/index.tsx`, and import-path tweaks in five Next-side files.

No commit needed. Plan complete.

---

## Verification checklist

After all tasks complete:

- [ ] `pnpm run lint` clean
- [ ] `pnpm run build:core` clean
- [ ] `pnpm run dev` → admin loads, fonts present, theme/language cookies persist
- [ ] `pnpm dev:prod fields` → admin loads in prod build, no client/server boundary errors
- [ ] `pnpm run test:int fields` clean
- [ ] `pnpm run test:e2e fields` clean
- [ ] `packages/ui` has no `next/*` imports: `grep -rn "from 'next" packages/ui/src/ | wc -l` → `0`
- [ ] Existing callers of `RootLayout` (e.g. `app/(payload)/layout.tsx`, `test/*/app/(payload)/layout.tsx`) unchanged
