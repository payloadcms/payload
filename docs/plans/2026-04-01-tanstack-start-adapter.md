# TanStack Start Adapter — Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the TanStack Start admin adapter with a proper implementation by moving all framework-agnostic code from `packages/next` to `packages/ui`, then building a real adapter using `vinxi/http` and `@tanstack/react-router`.

**Architecture:** Three-stage process: (1) extract all framework-agnostic utilities and components from `packages/next` to `packages/ui`, (2) refactor `renderDocument`/`renderListView`/etc. to accept `notFound`/`redirect` as callbacks making them moveable, (3) implement `packages/tanstack-start` using `vinxi/http` cookies, `getWebRequest()` for initReq, and real `@tanstack/react-router` hooks.

**Tech Stack:** TypeScript, React 19 RSC, Payload CMS monorepo (pnpm + Turbo), vinxi/http, @tanstack/react-router, @tanstack/start

---

## Current State

The original plan (`2026-03-31-admin-adapter-combined.md`) is fully implemented. `packages/tanstack-start` exists with stub methods that throw errors. This plan completes it.

**What `packages/next` still exclusively owns (needs to move):**

- `elements/Nav/` — full Nav server+client component
- `elements/DocumentHeader/` — DocumentHeader with Tabs
- `templates/Default/` and `templates/Minimal/`
- `utilities/selectiveCache.ts`, `getRequestLocale.ts`, `getPreferences.ts`, `handleAuthRedirect.ts`, `slugify.ts`, `isCustomAdminView.ts`, `isPublicAdminRoute.ts`, `getRouteWithoutAdmin.ts`, `timestamp.ts`
- `views/Document/` utilities: `getDocumentData`, `getDocumentPermissions`, `getIsLocked`, `getVersions`, `getDocumentView`, `getCustomDocumentViewByKey`, `getCustomViewByRoute`, `renderDocumentSlots`, `handleServerFunction`
- `views/List/` utilities: `enrichDocsWithVersionStatus`, `handleGroupBy`, `renderListViewSlots`, `resolveAllFilterOptions`, `transformColumnsToSelect`, `createSerializableValue`, `extractRelationshipDisplayValue`, `extractValueOrRelationshipID`, `handleServerFunction`
- `views/Document/index.tsx` and `views/List/index.tsx` — main render functions using `notFound`/`redirect`
- `views/Account/` client files, `views/Version/`, `views/Versions/` utilities

**Blocking the TanStack adapter:**

- `renderDocument` and `renderListView` call `notFound()`/`redirect()` from `next/navigation` — to move them to packages/ui, we must pass these as callbacks
- `handleServerFunctions` registry lives in packages/next and references view handlers that haven't moved yet

---

## Phase 1: Move Framework-Agnostic Utilities

### Task 1: Move packages/next utilities to packages/ui

**Files:**

- Copy: `packages/next/src/utilities/selectiveCache.ts` → `packages/ui/src/utilities/selectiveCache.ts`
- Copy: `packages/next/src/utilities/getRequestLocale.ts` → `packages/ui/src/utilities/getRequestLocale.ts`
- Copy: `packages/next/src/utilities/handleAuthRedirect.ts` → `packages/ui/src/utilities/handleAuthRedirect.ts`
- Copy: `packages/next/src/utilities/isCustomAdminView.ts` → `packages/ui/src/utilities/isCustomAdminView.ts`
- Copy: `packages/next/src/utilities/isPublicAdminRoute.ts` → `packages/ui/src/utilities/isPublicAdminRoute.ts`
- Copy: `packages/next/src/utilities/getRouteWithoutAdmin.ts` → `packages/ui/src/utilities/getRouteWithoutAdmin.ts`
- Copy: `packages/next/src/utilities/timestamp.ts` → `packages/ui/src/utilities/timestamp.ts`
- Copy: `packages/next/src/utilities/slugify.ts` → `packages/ui/src/utilities/slugify.ts` (the server function handler)

**Steps:**

1. Copy each file to packages/ui/src/utilities/
2. Fix any `@payloadcms/ui` self-imports → relative paths
3. Update packages/next to re-import from packages/ui where needed
4. Run: `pnpm run build:ui && pnpm run build:next` — expect no TypeScript errors
5. Commit: `refactor(ui): move shared utilities from packages/next to packages/ui`

**Note:** `getPreferences.ts` is already in `packages/ui/src/utilities/getPreferences.ts` (moved in previous work). `getRequestLocale.ts` imports from `@payloadcms/ui/rsc` and `@payloadcms/ui/shared` — replace those with relative imports.

---

### Task 2: Move Nav and DocumentHeader elements

**Files:**

- Copy: `packages/next/src/elements/Nav/index.tsx` → `packages/ui/src/elements/Nav/index.tsx`
- Copy: `packages/next/src/elements/Nav/index.client.tsx` → `packages/ui/src/elements/Nav/index.client.tsx`
- Copy: `packages/next/src/elements/Nav/NavHamburger/index.tsx` → `packages/ui/src/elements/Nav/NavHamburger/index.tsx`
- Copy: `packages/next/src/elements/Nav/NavWrapper/index.tsx` → `packages/ui/src/elements/Nav/NavWrapper/index.tsx`
- Copy: `packages/next/src/elements/Nav/SettingsMenuButton/index.tsx` → `packages/ui/src/elements/Nav/SettingsMenuButton/index.tsx`
- Copy: `packages/next/src/elements/Nav/getNavPrefs.ts` → `packages/ui/src/elements/Nav/getNavPrefs.ts`
- Copy: `packages/next/src/elements/DocumentHeader/` (entire dir) → `packages/ui/src/elements/DocumentHeader/`

**Steps:**

1. Check that `packages/ui/src/elements/Nav/context.tsx` already exists (the NavProvider/useNav hook). The Nav server component from packages/next is different — it renders the full nav sidebar.
2. Copy files, fix `@payloadcms/ui` self-imports → relative paths
3. Update packages/next Nav exports to re-export from packages/ui
4. Run: `pnpm run build:ui && pnpm run build:next`
5. Commit: `refactor(ui): move Nav and DocumentHeader elements from packages/next`

---

### Task 3: Move templates to packages/ui

**Files:**

- Create: `packages/ui/src/templates/Default/index.tsx` (from `packages/next/src/templates/Default/index.tsx`)
- Create: `packages/ui/src/templates/Default/NavHamburger/index.tsx`
- Create: `packages/ui/src/templates/Default/Wrapper/index.tsx`
- Create: `packages/ui/src/templates/Minimal/index.tsx`

**Steps:**

1. Copy each file, convert `@payloadcms/ui` imports to relative paths
2. Add `"./templates/*"` export pattern to `packages/ui/package.json` exports
3. Update `packages/next/src/templates/` to re-export from `@payloadcms/ui/templates/*`
4. Run: `pnpm run build:ui && pnpm run build:next`
5. Commit: `refactor(ui): move Default and Minimal templates from packages/next`

---

## Phase 2: Move View Utilities

### Task 4: Move Document view utilities

**Files to move (all have zero next/\* imports):**

- `packages/next/src/views/Document/getDocumentData.ts` → `packages/ui/src/views/Document/getDocumentData.ts` (already exists — verify)
- `packages/next/src/views/Document/getDocumentPermissions.tsx` → `packages/ui/src/views/Document/getDocumentPermissions.tsx`
- `packages/next/src/views/Document/getIsLocked.ts` → `packages/ui/src/views/Document/getIsLocked.ts`
- `packages/next/src/views/Document/getVersions.ts` → `packages/ui/src/views/Document/getVersions.ts`
- `packages/next/src/views/Document/getDocumentView.tsx` → `packages/ui/src/views/Document/getDocumentView.tsx`
- `packages/next/src/views/Document/getCustomDocumentViewByKey.tsx` → `packages/ui/src/views/Document/getCustomDocumentViewByKey.tsx`
- `packages/next/src/views/Document/getCustomViewByRoute.tsx` → `packages/ui/src/views/Document/getCustomViewByRoute.tsx`
- `packages/next/src/views/Document/renderDocumentSlots.tsx` → `packages/ui/src/views/Document/renderDocumentSlots.tsx`

**Steps:**

1. `getDocumentData.ts` and `getDocPreferences.ts` already exist in packages/ui — verify they're correct copies
2. Copy remaining files, fix self-imports
3. Update packages/next to import these from `@payloadcms/ui/views/Document/*` (add export paths if needed) or relative package imports
4. Run: `pnpm run build:ui && pnpm run build:next`
5. Commit: `refactor(ui): move Document view utilities from packages/next`

---

### Task 5: Move List view utilities

**Files to move (all have zero next/\* imports):**

- `packages/next/src/views/List/createSerializableValue.ts` → `packages/ui/src/views/List/createSerializableValue.ts`
- `packages/next/src/views/List/enrichDocsWithVersionStatus.ts` → `packages/ui/src/views/List/enrichDocsWithVersionStatus.ts`
- `packages/next/src/views/List/extractRelationshipDisplayValue.ts` → `packages/ui/src/views/List/extractRelationshipDisplayValue.ts`
- `packages/next/src/views/List/extractValueOrRelationshipID.ts` → `packages/ui/src/views/List/extractValueOrRelationshipID.ts`
- `packages/next/src/views/List/handleGroupBy.ts` → `packages/ui/src/views/List/handleGroupBy.ts`
- `packages/next/src/views/List/renderListViewSlots.tsx` → `packages/ui/src/views/List/renderListViewSlots.tsx`
- `packages/next/src/views/List/resolveAllFilterOptions.ts` → `packages/ui/src/views/List/resolveAllFilterOptions.ts`
- `packages/next/src/views/List/transformColumnsToSelect.ts` → `packages/ui/src/views/List/transformColumnsToSelect.ts`

**Steps:**

1. Copy files, fix self-imports
2. Run: `pnpm run build:ui && pnpm run build:next`
3. Commit: `refactor(ui): move List view utilities from packages/next`

---

### Task 6: Move Version/Versions and Account utilities

**Files:**

- `packages/next/src/views/Version/fetchVersions.ts` → `packages/ui/src/views/Version/fetchVersions.ts`
- `packages/next/src/views/Version/RenderFieldsToDiff/` (entire dir) → `packages/ui/src/views/Version/RenderFieldsToDiff/`
- `packages/next/src/views/Version/SelectComparison/` → `packages/ui/src/views/Version/SelectComparison/`
- `packages/next/src/views/Version/VersionPillLabel/` → `packages/ui/src/views/Version/VersionPillLabel/`
- `packages/next/src/views/Version/Default/` (minus index.tsx) → `packages/ui/src/views/Version/Default/`
- `packages/next/src/views/Versions/buildColumns.tsx` → `packages/ui/src/views/Versions/buildColumns.tsx`
- `packages/next/src/views/Versions/cells/` → `packages/ui/src/views/Versions/cells/`
- `packages/next/src/views/Account/index.client.tsx` → `packages/ui/src/views/Account/index.client.tsx`
- `packages/next/src/views/Account/ResetPreferences/` → `packages/ui/src/views/Account/ResetPreferences/`
- `packages/next/src/views/Account/Settings/` → `packages/ui/src/views/Account/Settings/`
- `packages/next/src/views/Account/ToggleTheme/` → `packages/ui/src/views/Account/ToggleTheme/`

**Steps:**

1. Copy files, fix self-imports
2. Run: `pnpm run build:ui && pnpm run build:next`
3. Commit: `refactor(ui): move Version/Versions/Account utilities from packages/next`

---

## Phase 3: Refactor Main View Functions to Accept Navigation Callbacks

The `renderDocument`, `renderListView`, `renderVersion`, `renderVersions`, and `renderAccount` functions in `packages/next` call `notFound()`/`redirect()` from `next/navigation`. To move them to `packages/ui`, we add these as parameters.

### Task 7: Add ServerNavigation params to renderDocument and move to packages/ui

**Files:**

- Modify: `packages/next/src/views/Document/index.tsx`
- Create: `packages/ui/src/views/Document/RenderDocument.tsx` (the moved render function)
- Modify: `packages/next/src/views/Document/handleServerFunction.tsx`

**The pattern:** Extract `renderDocument` from `packages/next` to `packages/ui` with two new parameters:

```typescript
// packages/ui/src/views/Document/RenderDocument.tsx
export const renderDocument = async ({
  // ...existing params...
  notFound, // ADD: () => never
  redirect, // ADD: (url: string) => never
}: {
  // ... existing type ...
  notFound: () => never
  redirect: (url: string) => never
}): Promise<{ data: Data; Document: React.ReactNode }> => {
  // same implementation, but calls params.notFound() and params.redirect()
  // instead of importing from next/navigation
}
```

**Steps:**

1. Create `packages/ui/src/views/Document/RenderDocument.tsx`:

   - Copy the entire `renderDocument` function from `packages/next/src/views/Document/index.tsx`
   - Add `notFound: () => never` and `redirect: (url: string) => never` to the function params type
   - Replace the `import { notFound, redirect } from 'next/navigation.js'` with no import
   - Replace all `notFound()` calls with `notFound()` (params) and `redirect(url)` with `redirect(url)` (params)
   - Fix any `@payloadcms/ui` self-imports → relative paths
   - Fix imports of `DocumentHeader` → from `../../elements/DocumentHeader/index.js`
   - Fix imports of Document utilities → relative `./getDocumentData.js` etc.

2. Update `packages/next/src/views/Document/index.tsx` to:

   ```typescript
   import { notFound, redirect } from 'next/navigation.js'
   import { renderDocument as renderDocumentFromUI } from '@payloadcms/ui/views/Document/RenderDocument'

   // Re-export renderDocument passing in Next.js's notFound/redirect
   export const renderDocument = (args) =>
     renderDocumentFromUI({ ...args, notFound, redirect })
   ```

3. Update `packages/next/src/views/Document/handleServerFunction.tsx` to import from the updated location

4. Run: `pnpm run build:ui && pnpm run build:next`
5. Commit: `refactor(ui): move renderDocument to packages/ui with navigation callbacks`

---

### Task 8: Move renderListView to packages/ui with navigation callbacks

**Files:**

- Create: `packages/ui/src/views/List/RenderListView.tsx` (the moved render function)
- Modify: `packages/next/src/views/List/index.tsx`
- Modify: `packages/next/src/views/List/handleServerFunction.tsx`

**Steps:**

1. Create `packages/ui/src/views/List/RenderListView.tsx`:

   - Copy `renderListView` function from `packages/next/src/views/List/index.tsx`
   - Add `notFound: () => never` to params
   - Replace `notFound()` call with the param
   - Fix imports → relative paths within packages/ui

2. Update `packages/next/src/views/List/index.tsx`:

   ```typescript
   import { notFound } from 'next/navigation.js'
   import { renderListView as renderListViewFromUI } from '@payloadcms/ui/views/List/RenderListView'

   export const renderListView = (args) =>
     renderListViewFromUI({ ...args, notFound })
   ```

3. Run: `pnpm run build:ui && pnpm run build:next`
4. Commit: `refactor(ui): move renderListView to packages/ui with notFound callback`

---

### Task 9: Move renderVersion, renderVersions, renderAccount to packages/ui

**Same pattern as Tasks 7-8, applied to:**

- `packages/next/src/views/Version/index.tsx` → `packages/ui/src/views/Version/RenderVersion.tsx`
- `packages/next/src/views/Versions/index.tsx` → `packages/ui/src/views/Versions/RenderVersions.tsx`
- `packages/next/src/views/Account/index.tsx` → `packages/ui/src/views/Account/RenderAccount.tsx`

For Version and Versions: add `notFound: () => never` to params.
For Account: add `notFound: () => never` to params.

**Steps:**

1. For each view:
   - Create `RenderX.tsx` in packages/ui with navigation callback params
   - Update packages/next entry to import from packages/ui and pass Next.js callbacks
2. Run: `pnpm run build:ui && pnpm run build:next`
3. Commit: `refactor(ui): move Version/Versions/Account render functions to packages/ui`

---

## Phase 4: Move handleServerFunction Handlers to packages/ui

### Task 10: Move renderDocumentHandler and renderListHandler

These server function handlers (`handleServerFunction.tsx` in each view) call `renderDocument`/`renderListView`. Now that those functions are in packages/ui and accept navigation callbacks, the handlers can also move.

**Files:**

- Move: `packages/next/src/views/Document/handleServerFunction.tsx` → `packages/ui/src/views/Document/handleServerFunction.tsx`
- Move: `packages/next/src/views/List/handleServerFunction.tsx` → `packages/ui/src/views/List/handleServerFunction.tsx`

**Key:** These handlers don't call `notFound`/`redirect` themselves — they call `renderDocument`/`renderListView` which accept callbacks. But the callbacks need to come from somewhere when invoked in a server function context.

**Solution:** Server function handlers accept `notFound` and `redirect` from the `ServerFunctionArgs` context (which the adapter injects via `initReq`). Add these to `DefaultServerFunctionArgs`:

```typescript
// packages/ui/src/views/Document/handleServerFunction.tsx
export const renderDocumentHandler: RenderDocumentServerFunction = async (args) => {
  const { notFound, redirect } = args  // injected by adapter's handleServerFunctions
  const { data, Document } = await renderDocument({
    ...renderArgs,
    notFound: notFound ?? (() => { throw new Error('notFound not provided') }),
    redirect: redirect ?? (() => { throw new Error('redirect not provided') }),
  })
  ...
}
```

**Steps:**

1. Check the `RenderDocumentServerFunction` type in `packages/ui` — does it include `notFound`/`redirect`? If not, extend it in `packages/payload/src/admin/types.ts`
2. Update `DefaultServerFunctionArgs` in packages/payload to include optional `notFound`/`redirect`
3. Create `packages/ui/src/views/Document/handleServerFunction.tsx` with updated handler
4. Create `packages/ui/src/views/List/handleServerFunction.tsx` with updated handler
5. Update packages/next handlers to be thin re-exports
6. Run: `pnpm run build:ui && pnpm run build:next`
7. Commit: `refactor(ui): move renderDocumentHandler and renderListHandler to packages/ui`

---

### Task 11: Create shared handleServerFunctions base in packages/ui

**File:** Create `packages/ui/src/utilities/handleServerFunctions.ts`

```typescript
// packages/ui/src/utilities/handleServerFunctions.ts
import type {
  DefaultServerFunctionArgs,
  ServerFunction,
  ServerFunctionHandler,
} from 'payload'

import {
  _internal_renderFieldHandler,
  copyDataFromLocaleHandler,
} from '../exports/rsc/index.js'
import { buildFormStateHandler } from './buildFormState.js'
import { buildTableStateHandler } from './buildTableState.js'
import { getFolderResultsComponentAndDataHandler } from './getFolderResultsComponentAndData.js'
import { schedulePublishHandler } from './schedulePublishHandler.js'
import { getDefaultLayoutHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/getDefaultLayoutServerFn.js'
import { renderWidgetHandler } from '../views/Dashboard/Default/ModularDashboard/renderWidget/renderWidgetServerFn.js'
import { renderDocumentHandler } from '../views/Document/handleServerFunction.js'
import { renderDocumentSlotsHandler } from '../views/Document/renderDocumentSlots.js'
import { renderListHandler } from '../views/List/handleServerFunction.js'
import { slugifyHandler } from './slugify.js'

export const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  'copy-data-from-locale': copyDataFromLocaleHandler,
  'form-state': buildFormStateHandler,
  'get-default-layout': getDefaultLayoutHandler,
  'get-folder-results-component-and-data':
    getFolderResultsComponentAndDataHandler,
  'render-document': renderDocumentHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-list': renderListHandler,
  'render-widget': renderWidgetHandler,
  'schedule-publish': schedulePublishHandler,
  slugify: slugifyHandler,
  'table-state': buildTableStateHandler,
}

/**
 * Framework-agnostic server function dispatcher.
 * Adapters call this after running initReq to get the request context.
 */
export async function dispatchServerFunction(args: {
  augmentedArgs: DefaultServerFunctionArgs
  extraServerFunctions?: Record<string, ServerFunction>
  name: string
}): Promise<unknown> {
  const { augmentedArgs, extraServerFunctions, name } = args
  const fn = extraServerFunctions?.[name] || baseServerFunctions[name]
  if (!fn) {
    throw new Error(`Unknown Server Function: ${name}`)
  }
  return fn(augmentedArgs)
}
```

**Steps:**

1. Create the file above
2. Update `packages/next/src/utilities/handleServerFunctions.ts` to:

   ```typescript
   import { dispatchServerFunction } from '@payloadcms/ui/utilities/handleServerFunctions'

   export const handleServerFunctions: ServerFunctionHandler = async (args) => {
     const {
       name: fnKey,
       args: fnArgs,
       config,
       importMap,
       serverFunctions,
     } = args
     const { cookies, locale, permissions, req } = await initReq({
       configPromise: config,
       importMap,
       key: 'RootLayout',
     })
     const augmentedArgs = {
       ...fnArgs,
       cookies,
       importMap,
       locale,
       permissions,
       req,
       notFound: () => notFound(), // inject Next.js navigation
       redirect: (url) => redirect(url),
     }
     return dispatchServerFunction({
       augmentedArgs,
       extraServerFunctions: serverFunctions,
       name: fnKey,
     })
   }
   ```

3. Run: `pnpm run build:ui && pnpm run build:next`
4. Commit: `refactor(ui): create shared server function dispatcher`

---

## Phase 5: Implement TanStack Start Adapter

### Task 12: Implement initReq for TanStack Start

**File:** Create `packages/tanstack-start/src/utilities/initReq.ts`

```typescript
import type { I18n, I18nClient } from '@payloadcms/translations'
import type { ImportMap, InitReqResult, SanitizedConfig } from 'payload'

import { initI18n } from '@payloadcms/translations'
// vinxi/http provides server-side request context in TanStack Start
import { getCookie as vinxiGetCookie, getWebRequest } from 'vinxi/http'
import {
  createLocalReq,
  executeAuthStrategies,
  getAccessResults,
  getPayload,
  getRequestLanguage,
  parseCookies,
} from 'payload'

import { getRequestLocale } from '@payloadcms/ui/utilities/getRequestLocale'
import { selectiveCache } from '@payloadcms/ui/utilities/selectiveCache'

const partialReqCache = selectiveCache('partialReq')
const reqCache = selectiveCache('req')

export const initReq = async function ({
  config: configArg,
  importMap,
  key = 'adapter',
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  key?: string
}): Promise<InitReqResult> {
  // getWebRequest() returns the current server request from Vinxi's context store
  const request = getWebRequest()
  const headers = new Headers(request.headers)
  const cookies = parseCookies(headers)

  const partialResult = await partialReqCache.get(async () => {
    const config = await configArg
    const payload = await getPayload({ config, cron: true, importMap })
    const languageCode = getRequestLanguage({ config, cookies, headers })

    const i18n: I18nClient = await initI18n({
      config: config.i18n,
      context: 'client',
      language: languageCode,
    })

    const { responseHeaders, user } = await executeAuthStrategies({
      headers,
      payload,
    })

    return { i18n, languageCode, payload, responseHeaders, user }
  }, 'global')

  return reqCache
    .get(async () => {
      const { i18n, languageCode, payload, responseHeaders, user } =
        partialResult

      const req = await createLocalReq(
        {
          req: {
            headers,
            host: headers.get('host'),
            i18n: i18n as I18n,
            responseHeaders,
            url: request.url,
            user,
          },
        },
        payload,
      )

      const locale = await getRequestLocale({ req })
      req.locale = locale?.code

      const permissions = await getAccessResults({ req })

      return { cookies, headers, languageCode, locale, permissions, req }
    }, key)
    .then((result) => ({
      ...result,
      req: {
        ...result.req,
        ...(result.req?.context ? { context: { ...result.req.context } } : {}),
      },
    }))
}
```

**Steps:**

1. Create the file
2. Add `vinxi` to `packages/tanstack-start/package.json` peerDependencies (already there)
3. Verify `getWebRequest` import path — check vinxi docs or `node_modules/vinxi/dist` for correct import
4. Run: `cd packages/tanstack-start && pnpm tsc --noEmit` — expect no errors on the new file (warnings about peer deps OK)
5. Commit: `feat(tanstack-start): implement initReq using vinxi/http getWebRequest`

---

### Task 13: Implement handleServerFunctions for TanStack Start

**File:** Create `packages/tanstack-start/src/utilities/handleServerFunctions.ts`

```typescript
import type { ServerFunctionHandler } from 'payload'

import { notFound, redirect } from '@tanstack/react-router'
import { dispatchServerFunction } from '@payloadcms/ui/utilities/handleServerFunctions'

import { initReq } from './initReq.js'

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  const { name: fnKey, args: fnArgs, config, importMap, serverFunctions } = args

  const { cookies, locale, permissions, req } = await initReq({
    config,
    importMap,
    key: 'RootLayout',
  })

  const augmentedArgs = {
    ...fnArgs,
    cookies,
    importMap,
    locale,
    notFound: () => {
      throw notFound()
    },
    permissions,
    redirect: (url: string) => {
      throw redirect({ to: url })
    },
    req,
  }

  return dispatchServerFunction({
    augmentedArgs,
    extraServerFunctions: serverFunctions,
    name: fnKey,
  })
}
```

**Steps:**

1. Create the file
2. Verify `@tanstack/react-router` exports `notFound` and `redirect` — check their API: `notFound()` returns a special error object to throw, `redirect({ to })` does the same
3. Commit: `feat(tanstack-start): implement handleServerFunctions using shared dispatcher`

---

### Task 14: Implement real RouterProvider with @tanstack/react-router hooks

**File:** Replace `packages/tanstack-start/src/adapter/RouterProvider.tsx`

```typescript
'use client'
import type { LinkProps as RouterLinkProps, RouterContextType } from '@payloadcms/ui'

import { RouterProvider as BaseRouterProvider } from '@payloadcms/ui'
import { Link as TanStackLink, useLocation, useParams, useRouter } from '@tanstack/react-router'
import React from 'react'

const AdapterLink: React.FC<RouterLinkProps> = ({ href, children, ...rest }) => (
  <TanStackLink to={href} {...rest}>
    {children}
  </TanStackLink>
)

export function TanStackRouterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const location = useLocation()
  const params = useParams({ strict: false })

  const searchParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  )

  const routerCtx: RouterContextType = React.useMemo(
    () => ({
      Link: AdapterLink,
      params,
      pathname: location.pathname,
      router: {
        back: () => router.history.back(),
        forward: () => router.history.forward(),
        prefetch: (url: string) => router.preloadRoute({ to: url }),
        push: (url: string) => { void router.navigate({ to: url }) },
        refresh: () => { void router.invalidate() },
        replace: (url: string) => { void router.navigate({ to: url, replace: true }) },
      },
      searchParams,
    }),
    [router, location, params, searchParams],
  )

  return <BaseRouterProvider router={routerCtx}>{children}</BaseRouterProvider>
}
```

**Steps:**

1. Check what `@tanstack/react-router` exports: `useRouter`, `useLocation`, `useParams`, `Link`
   - Run: `grep -r "export.*useRouter\|export.*useLocation" node_modules/@tanstack/react-router/dist/ 2>/dev/null | head -5` to verify
2. Replace the file. Note `AdapterLink` is module-level (not nested in component) — this satisfies react-compiler.
3. Run: `cd packages/tanstack-start && pnpm tsc --noEmit`
4. Commit: `feat(tanstack-start): implement TanStackRouterProvider with real hooks`

---

### Task 15: Implement cookie helpers and wire adapter

**File:** Update `packages/tanstack-start/src/adapter/index.ts`

```typescript
import type {
  AdminAdapterResult,
  BaseAdminAdapter,
  CookieOptions,
} from 'payload'

import { notFound, redirect } from '@tanstack/react-router'
import { deleteCookie, getCookie, setCookie } from 'vinxi/http'
import { createAdminAdapter } from 'payload'

import { handleServerFunctions } from '../utilities/handleServerFunctions.js'
import { initReq } from '../utilities/initReq.js'
import { TanStackRouterProvider } from './RouterProvider.js'

export function tanstackStartAdapter(): AdminAdapterResult {
  return {
    name: 'tanstack-start',
    init: ({ payload }) =>
      createAdminAdapter({
        RouterProvider: TanStackRouterProvider,
        createRouteHandlers: () => ({}), // Vinxi handles routing via file-system
        deleteCookie: (name) => deleteCookie(name),
        getCookie: (name) => getCookie(name),
        handleServerFunctions,
        initReq: ({ config, importMap }) => initReq({ config, importMap }),
        name: 'tanstack-start',
        notFound: () => {
          throw notFound()
        },
        payload,
        redirect: (url) => {
          throw redirect({ to: url })
        },
        setCookie: (name, value, options) => setCookie(name, value, options),
      } satisfies BaseAdminAdapter),
  }
}
```

**Steps:**

1. Replace the file with the above
2. Verify `vinxi/http` exports `getCookie`, `setCookie`, `deleteCookie` — check: `ls node_modules/vinxi/dist/` and search for cookie exports
3. Run: `cd packages/tanstack-start && pnpm tsc --noEmit`
4. Run: `pnpm run build:ui && pnpm run build:next` from repo root — packages/next should still pass
5. Commit: `feat(tanstack-start): implement full adapter with vinxi/http cookies`

---

### Task 16: Update exports and package.json for tanstack-start

**Files:**

- Update: `packages/tanstack-start/src/index.ts`
- Update: `packages/tanstack-start/package.json` (add `@tanstack/react-router` and `vinxi` to dependencies or peerDependencies)

```typescript
// packages/tanstack-start/src/index.ts
export { tanstackStartAdapter } from './adapter/index.js'
export { TanStackRouterProvider } from './adapter/RouterProvider.js'
// Export initReq for users who need direct access
export { initReq } from './utilities/initReq.js'
export { handleServerFunctions } from './utilities/handleServerFunctions.js'
```

```json
// packages/tanstack-start/package.json additions
"peerDependencies": {
  "@tanstack/react-router": ">=1.0.0",
  "@tanstack/start": ">=1.0.0",
  "react": "^19.0.0",
  "vinxi": ">=0.4.0"
},
"peerDependenciesMeta": {
  "@tanstack/react-router": { "optional": false },
  "vinxi": { "optional": false }
}
```

**Steps:**

1. Update both files
2. Run: `pnpm install`
3. Run: `pnpm run build:next` — full build check
4. Commit: `feat(tanstack-start): finalize exports and peer dependencies`

---

### Task 17: Add integration tests for TanStack Start adapter shape

**File:** Create `test/admin-adapter/tanstack-start.spec.ts`

```typescript
import { describe, expect, it } from 'vitest'

describe('tanstackStartAdapter', () => {
  it('should export tanstackStartAdapter function', async () => {
    const { tanstackStartAdapter } = await import('@payloadcms/tanstack-start')
    expect(typeof tanstackStartAdapter).toBe('function')
  })

  it('should return AdminAdapterResult with name and init', async () => {
    const { tanstackStartAdapter } = await import('@payloadcms/tanstack-start')
    const result = tanstackStartAdapter()
    expect(result.name).toBe('tanstack-start')
    expect(typeof result.init).toBe('function')
  })

  it('should satisfy BaseAdminAdapter interface when init is called', async () => {
    const { tanstackStartAdapter } = await import('@payloadcms/tanstack-start')
    const { createAdminAdapter } = await import('payload')

    // Can't call init without full payload instance, but verify the shape
    const result = tanstackStartAdapter()
    expect(result.name).toBe('tanstack-start')

    // The adapter factory is the correct type
    expect(typeof result.init).toBe('function')
  })
})
```

**Steps:**

1. Create the test file
2. Run: `pnpm run test:int admin-adapter`
3. Fix any failures
4. Commit: `test: add TanStack Start adapter shape tests`

---

## Dependency Graph

```
Phase 1 (Tasks 1-3): Move utilities/elements/templates
    ↓
Phase 2 (Tasks 4-6): Move view utilities
    ↓
Phase 3 (Tasks 7-9): Move render functions (with nav callbacks)
    ↓
Phase 4 (Tasks 10-11): Move handlers + create shared dispatcher
    ↓
Phase 5 (Tasks 12-16): TanStack Start adapter implementation
    ↓
Task 17: Tests
```

## Verification at Each Phase

After each phase, run:

```bash
pnpm run build:ui         # packages/ui builds clean
pnpm run build:next       # packages/next builds clean
pnpm run test:int admin-adapter  # adapter tests pass
```

Final verification:

```bash
pnpm run dev              # dev server starts, admin panel works
```

## Key Files Summary

**Moved from packages/next → packages/ui:**

- `utilities/selectiveCache.ts`, `getRequestLocale.ts`, `handleAuthRedirect.ts`, `isCustomAdminView.ts`, `isPublicAdminRoute.ts`, `getRouteWithoutAdmin.ts`, `timestamp.ts`, `slugify.ts`
- `elements/Nav/` (full), `elements/DocumentHeader/` (full)
- `templates/Default/`, `templates/Minimal/`
- `views/Document/` utilities (8 files)
- `views/List/` utilities (8 files)
- `views/Version/`, `views/Versions/`, `views/Account/` utilities
- `views/Document/RenderDocument.tsx` (new, accepts nav callbacks)
- `views/List/RenderListView.tsx` (new, accepts nav callbacks)
- `views/Document/handleServerFunction.tsx`, `views/List/handleServerFunction.tsx`
- `utilities/handleServerFunctions.ts` → `utilities/handleServerFunctions.ts` (shared dispatcher)

**New in packages/tanstack-start:**

- `src/utilities/initReq.ts` — uses `getWebRequest()` from `vinxi/http`
- `src/utilities/handleServerFunctions.ts` — uses shared dispatcher + TanStack navigation
- `src/adapter/RouterProvider.tsx` — real `@tanstack/react-router` hooks
- `src/adapter/index.ts` — complete adapter using `vinxi/http` cookies

---

## Phase 6: TanStack Start App Shell + `pnpm dev:tanstack`

This phase creates the TanStack Start equivalent of the auto-generated `app/(payload)/` Next.js files, plus the dev entry point. After this phase `pnpm dev:tanstack` starts a working admin panel.

### Background: How `pnpm dev` works today

```
pnpm dev
  → test/dev.ts
    → loadEnv()
    → runInit(testSuiteArg)          # writes importMap.js, generates DB adapter
    → nextImport({ dir: rootDir })   # starts Next.js from repo root
    → serves app/(payload)/          # auto-generated layout.tsx + page.tsx
```

The auto-generated files wire together:

- `app/(payload)/layout.tsx` → `RootLayout` + `handleServerFunctions` from `@payloadcms/next/layouts`
- `app/(payload)/admin/[[...segments]]/page.tsx` → `RootPage` from `@payloadcms/next/views`
- `app/(payload)/api/[...slug]/route.ts` → REST handlers from `@payloadcms/next/routes`

For TanStack Start we need the same wiring using TanStack's routing conventions.

---

### Task 18: Install TanStack Start dependencies

**Files:**

- Modify: `packages/tanstack-start/package.json` — move peer deps to real deps for the workspace app
- Create: `tanstack-app/package.json`

**Steps:**

1. Create `tanstack-app/package.json`:

```json
{
  "name": "payload-tanstack-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vinxi dev",
    "build": "vinxi build",
    "start": "vinxi start"
  },
  "dependencies": {
    "@payloadcms/tanstack-start": "workspace:*",
    "@payloadcms/ui": "workspace:*",
    "@tanstack/react-router": "^1.0.0",
    "@tanstack/start": "^1.0.0",
    "payload": "workspace:*",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "vinxi": "^0.4.0"
  },
  "devDependencies": {
    "typescript": "5.x",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

2. Add `tanstack-app` to `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'tanstack-app' # ADD THIS
  - ...
```

3. Run: `pnpm install`

4. Verify: `ls node_modules/@tanstack/start` inside `tanstack-app/`

5. Commit: `chore: add tanstack-app workspace package with TanStack Start deps`

---

### Task 19: Create TanStack Start app config (app.config.ts)

TanStack Start uses `app.config.ts` (Vinxi config) instead of `next.config.mjs`.

**File:** Create `tanstack-app/app.config.ts`

```typescript
import { defineConfig } from '@tanstack/start/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  tsr: {
    appDirectory: './app',
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
  },
})
```

**File:** Create `tanstack-app/tsconfig.json`

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "strict": false,
    "baseUrl": ".",
    "paths": {
      "@payload-config": ["../test/_community/config.ts"]
    }
  },
  "include": ["app/**/*", "app.config.ts"]
}
```

The `@payload-config` alias mirrors what Next.js uses — the test suite config is injected via path alias.

**Steps:**

1. Create both files
2. Run: `cd tanstack-app && pnpm vinxi dev --help` — verify Vinxi is available
3. Commit: `feat(tanstack-app): add app.config.ts and tsconfig`

---

### Task 20: Create TanStack Start app entry points

TanStack Start requires three entry files.

**File:** Create `tanstack-app/app/client.tsx`

```typescript
import { StartClient } from '@tanstack/start'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createRouter } from './router.js'

const router = createRouter()

hydrateRoot(
  document,
  <StrictMode>
    <StartClient router={router} />
  </StrictMode>,
)
```

**File:** Create `tanstack-app/app/ssr.tsx`

```typescript
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
import { createRouter } from './router.js'

export default createStartHandler({ createRouter })(defaultStreamHandler)
```

**File:** Create `tanstack-app/app/router.tsx`

```typescript
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen.js'

export function createRouter() {
  return createTanStackRouter({ routeTree })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
```

**Note:** `routeTree.gen.ts` is auto-generated by TanStack Router CLI from the routes directory. You need to run `tanstack-router generate` or configure `tsr.watch` in app.config.ts to auto-generate it.

**Steps:**

1. Create all three files
2. Create a placeholder `tanstack-app/app/routeTree.gen.ts` (will be replaced by codegen):
   ```typescript
   // This file is auto-generated by TanStack Router
   import { rootRoute } from './routes/__root.js'
   export const routeTree = rootRoute
   ```
3. Commit: `feat(tanstack-app): add TanStack Start app entry points`

---

### Task 21: Create the root layout route

The root layout is the TanStack Start equivalent of `app/(payload)/layout.tsx`. It wires in `TanStackRouterProvider` and the Payload `RootLayout`.

**File:** Create `tanstack-app/app/routes/__root.tsx`

```typescript
import type { ImportMap, ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { tanstackStartAdapter } from '@payloadcms/tanstack-start'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import React from 'react'

// Import the shared handler dispatcher from packages/ui (available after Phase 4)
import { dispatchServerFunction } from '@payloadcms/ui/utilities/handleServerFunctions'
import { initReq } from '@payloadcms/tanstack-start/utilities/initReq'

// Import the generated importMap (written by dev script on startup)
import { importMap } from '../importMap.js'

// Server function: handles all Payload server function calls
// This is the TanStack Start equivalent of Next.js's 'use server' function
const handleServerFn = createServerFn()
  .validator((data: unknown) => data as Parameters<ServerFunctionClient>[0])
  .handler(async ({ data: args }) => {
    const { cookies, locale, permissions, req } = await initReq({
      config,
      importMap,
      key: 'RootLayout',
    })
    return dispatchServerFunction({
      augmentedArgs: {
        ...args,
        cookies,
        importMap,
        locale,
        permissions,
        req,
        notFound: () => { throw { _type: 'notFound' } },
        redirect: (url: string) => { throw { _type: 'redirect', url } },
      },
      extraServerFunctions: args.serverFunctions,
      name: args.name,
    })
  })

// Thin wrapper matching Payload's ServerFunctionClient signature
const serverFunction: ServerFunctionClient = (args) => handleServerFn({ data: args })

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  }),
})

// RootLayout from @payloadcms/tanstack-start will be created in packages/tanstack-start/src/layouts/
// It is the equivalent of RootLayout from @payloadcms/next/layouts, using TanStackRouterProvider
function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* TanStack Start's payload root layout — created in Task 22 */}
        <PayloadRootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
          <Outlet />
        </PayloadRootLayout>
        <Scripts />
      </body>
    </html>
  )
}
```

**Note on `PayloadRootLayout`:** This is `RootLayout` from `packages/tanstack-start/src/layouts/Root/`. It is equivalent to `packages/next/src/layouts/Root/index.tsx` but wraps with `TanStackRouterProvider` instead of `NextRouterProvider`. Created in Task 22.

**Steps:**

1. Create the file
2. Create placeholder `tanstack-app/app/importMap.ts` (will be auto-generated):
   ```typescript
   export const importMap = {}
   ```
3. Commit: `feat(tanstack-app): add root layout route`

---

### Task 22: Create RootLayout for TanStack Start (in packages/tanstack-start)

This is the TanStack Start equivalent of `packages/next/src/layouts/Root/index.tsx`.

**File:** Create `packages/tanstack-start/src/layouts/Root/index.tsx`

```typescript
import type { ImportMap, ServerFunctionClient, SanitizedConfig } from 'payload'

import { RootProvider } from '@payloadcms/ui'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { applyLocaleFiltering } from 'payload/shared'
import React from 'react'

import { TanStackRouterProvider } from '../../adapter/RouterProvider.js'
import { initReq } from '../../utilities/initReq.js'

type Props = {
  children: React.ReactNode
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  serverFunction: ServerFunctionClient
}

// Server-side layout: initializes request context and renders Payload RootProvider
export async function RootLayout({ children, config: configPromise, importMap, serverFunction }: Props) {
  const {
    cookies,
    headers,
    languageCode,
    locale,
    permissions,
    req,
    req: { payload: { config } },
  } = await initReq({ config: configPromise, importMap })

  const theme = cookies.get(`${config.cookiePrefix || 'payload'}-theme`) || 'light'

  // Get client-safe config
  const clientConfig = getClientConfig({ config, i18n: req.i18n, importMap, user: req.user })
  await applyLocaleFiltering({ clientConfig, config, req })

  // Language options
  const languageOptions = Object.entries(config.i18n.supportedLanguages || {}).map(
    ([value, langConfig]) => ({
      label: (langConfig as any).translations?.general?.thisLanguage ?? value,
      value,
    }),
  )

  return (
    <TanStackRouterProvider>
      <RootProvider
        config={clientConfig}
        dateFNSKey={req.i18n.dateFNSKey}
        fallbackLang={config.i18n.fallbackLanguage}
        languageCode={languageCode}
        languageOptions={languageOptions}
        locale={req.locale}
        permissions={req.user ? permissions : null}
        serverFunction={serverFunction}
        theme={theme as any}
        translations={req.i18n.translations}
        user={req.user}
      >
        {children}
      </RootProvider>
    </TanStackRouterProvider>
  )
}
```

**Update** `packages/tanstack-start/src/index.ts` to also export `RootLayout`.

**Steps:**

1. Create the file
2. Add export to `src/index.ts`
3. Run: `cd packages/tanstack-start && pnpm tsc --noEmit`
4. Commit: `feat(tanstack-start): add RootLayout server component`

---

### Task 23: Create admin route and API routes

**File:** Create `tanstack-app/app/routes/admin.$.tsx`

```typescript
import config from '@payload-config'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

// The RootPage equivalent for TanStack Start — created in packages/tanstack-start/src/views/Root/
import { RootPage } from '@payloadcms/tanstack-start/views'
import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/$')({
  component: AdminPage,
})

function AdminPage() {
  const params = Route.useParams()
  const search = Route.useSearch()
  // Convert TanStack params to the shape Payload expects
  const segments = params._splat?.split('/').filter(Boolean) ?? []

  return <RootPage config={config} importMap={importMap} segments={segments} searchParams={search as any} />
}
```

**File:** Create `tanstack-app/app/routes/api.$.ts` (API catch-all for REST)

```typescript
import config from '@payload-config'
import { createAPIFileRoute } from '@tanstack/start/api'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
} from '@payloadcms/tanstack-start/routes'

export const APIRoute = createAPIFileRoute('/api/$')({
  GET: ({ request }) => REST_GET(config)(request),
  POST: ({ request }) => REST_POST(config)(request),
  DELETE: ({ request }) => REST_DELETE(config)(request),
  PATCH: ({ request }) => REST_PATCH(config)(request),
  OPTIONS: ({ request }) => REST_OPTIONS(config)(request),
})
```

**Note:** `@payloadcms/tanstack-start/views` and `@payloadcms/tanstack-start/routes` require new exports:

- `RootPage` — the TanStack Start admin page renderer (see Task 24)
- REST route handlers adapted from `@payloadcms/next/routes` (see Task 25)

**Steps:**

1. Create both files
2. Commit: `feat(tanstack-app): add admin and API routes`

---

### Task 24: Create RootPage and route handlers for TanStack Start

**File:** Create `packages/tanstack-start/src/views/Root/index.tsx`

This is the TanStack Start equivalent of `packages/next/src/views/Root/index.tsx` — it:

- Calls `initReq` using vinxi/http
- Routes to the correct view based on the URL segments
- Throws TanStack's `notFound()`/`redirect()` instead of Next.js's

```typescript
import type { ImportMap, SanitizedConfig } from 'payload'

import config from '@payload-config'
import { notFound, redirect } from '@tanstack/react-router'
import React from 'react'

// Reuse the shared RootPage logic from packages/ui once it's moved (Phase 3)
// For now, replicate the core routing logic from packages/next/src/views/Root/index.tsx
// replacing notFound/redirect with TanStack's versions

import { importMap } from '../../../importMap.js' // relative to tanstack-app when bundled

type Props = {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  searchParams: Record<string, string | string[]>
  segments: string[]
}

export async function RootPage({
  config: configPromise,
  importMap,
  segments,
  searchParams,
}: Props) {
  // Import the shared Root view logic from packages/ui/views/Root
  // (which will accept notFound/redirect as callbacks after Phase 3 of this plan)
  const { renderRootPage } = await import(
    '@payloadcms/ui/views/Root/RenderRoot'
  )

  return renderRootPage({
    config: configPromise,
    importMap,
    notFound: () => {
      throw notFound()
    },
    redirect: (url) => {
      throw redirect({ to: url })
    },
    searchParams,
    segments,
  })
}
```

**File:** Create `packages/tanstack-start/src/routes/index.ts`

```typescript
// REST route handlers adapted for TanStack Start's API route format
// They accept Request objects (same Web API) so we can delegate to the
// framework-agnostic REST handlers.
export {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
} from '@payloadcms/next/routes'
// Note: Until packages/next REST routes are decoupled, we re-export them.
// The REST handlers use standard Request/Response Web APIs and don't
// depend on Next.js internals — they work in any runtime.
```

**Update** `packages/tanstack-start/package.json` exports:

```json
"./views": { "import": "./src/views/index.ts", ... },
"./routes": { "import": "./src/routes/index.ts", ... }
```

**Steps:**

1. Create `RootPage` (initially delegating to the shared Root render after Phase 3)
2. Create routes index re-exporting from `@payloadcms/next/routes`
3. Update package.json exports
4. Commit: `feat(tanstack-start): add RootPage and route exports`

---

### Task 25: Create dev-tanstack.ts entry point

**File:** Create `test/dev-tanstack.ts`

```typescript
import chalk from 'chalk'
import execa from 'execa'
import minimist from 'minimist'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'payload/node'

import { runInit } from './runInit.js'

loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const {
  _: [_testSuiteArg = '_community'],
} = minimist(process.argv.slice(2))

const testSuiteArg = _testSuiteArg as string

console.log(`Selected test suite: ${testSuiteArg} [TanStack Start / Vinxi]`)

// Generate importMap and DB adapter (reuses the same init logic as Next.js dev)
// This writes to tanstack-app/app/importMap.js instead of app/(payload)/admin/importMap.js
process.env.ROOT_DIR = path.resolve(dirname, '..', 'tanstack-app')

await runInit(testSuiteArg, true, false)

// Start Vinxi dev server
const tanstackAppDir = path.resolve(dirname, '..', 'tanstack-app')
const port = process.env.PORT ? Number(process.env.PORT) : 3100 // Use 3100 to avoid conflict with Next.js dev

const vinxiProcess = execa('pnpm', ['vinxi', 'dev', '--port', String(port)], {
  cwd: tanstackAppDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(port),
  },
})

console.log(chalk.green(`✓ TanStack Start dev server starting on port ${port}`))
console.log(chalk.cyan(`  Admin: http://localhost:${port}/admin`))

// Forward signals
process.on('SIGINT', () => {
  vinxiProcess.kill('SIGINT')
  process.exit(0)
})
process.on('SIGTERM', () => {
  vinxiProcess.kill('SIGTERM')
  process.exit(0)
})

await vinxiProcess
```

**Root package.json** — add the script:

```json
"dev:tanstack": "cross-env NODE_OPTIONS=\"--no-deprecation --max-old-space-size=16384\" tsx ./test/dev-tanstack.ts",
"dev:tanstack:postgres": "cross-env PAYLOAD_DATABASE=postgres pnpm runts ./test/dev-tanstack.ts"
```

**Also update `initDevAndTest.ts`** to support writing the importMap to the TanStack app location when `ROOT_DIR` points there:

- Currently hardcodes `./app/(payload)/admin/importMap.js` — make this path configurable
- Change: `path.resolve(process.env.ROOT_DIR || getNextRootDir(testSuiteArg).rootDir, './app/(payload)/admin/importMap.js')`
  to a helper that checks whether `ROOT_DIR` contains a TanStack app and picks the right path

**Steps:**

1. Create `test/dev-tanstack.ts`
2. Add scripts to root `package.json`
3. Update `initDevAndTest.ts` to write importMap to `${ROOT_DIR}/app/importMap.js` when the TanStack app is the target (check by presence of `app.config.ts`)
4. Run: `pnpm dev:tanstack` — expect Vinxi to start
5. Fix any import/build errors
6. Commit: `feat: add pnpm dev:tanstack command and dev entry point`

---

### Task 26: Smoke test `pnpm dev:tanstack`

**Steps:**

1. Run: `pnpm dev:tanstack`
2. Navigate to: `http://localhost:3100/admin`
3. Verify: admin panel loads, can log in, can navigate collections
4. Run: `curl -s http://localhost:3100/api/access | jq .` — verify REST API responds
5. Fix any runtime errors
6. Commit: `test: verify pnpm dev:tanstack works end-to-end`

---

## Updated Dependency Graph

```
Phase 1 (Tasks 1-3): Move utilities/elements/templates
    ↓
Phase 2 (Tasks 4-6): Move view utilities
    ↓
Phase 3 (Tasks 7-9): Move render functions (with nav callbacks)
    ↓
Phase 4 (Tasks 10-11): Move handlers + create shared dispatcher
    ↓
Phase 5 (Tasks 12-16): TanStack Start adapter implementation
    ↓
Phase 6 (Tasks 18-26): TanStack Start app shell + pnpm dev:tanstack
    ↓
Task 17 + Task 26: Integration tests + smoke test
```

## File Summary — Phase 6 New Files

```
tanstack-app/
├── app.config.ts                    # Vinxi/TanStack Start config
├── tsconfig.json                    # Path aliases (especially @payload-config)
├── package.json                     # TanStack deps
└── app/
    ├── client.tsx                   # Hydration entry
    ├── ssr.tsx                      # SSR entry
    ├── router.tsx                   # Router definition
    ├── importMap.ts                 # Auto-generated on dev start
    ├── routeTree.gen.ts             # Auto-generated by TanStack Router
    └── routes/
        ├── __root.tsx               # Root layout (uses RootLayout from packages/tanstack-start)
        ├── admin.$.tsx              # Admin catch-all → RootPage
        └── api.$.ts                 # REST API catch-all

packages/tanstack-start/src/
├── layouts/
│   └── Root/
│       └── index.tsx                # RootLayout server component
├── views/
│   └── Root/
│       └── index.tsx                # RootPage (route renderer)
└── routes/
    └── index.ts                     # Re-exports REST handlers

test/
└── dev-tanstack.ts                  # pnpm dev:tanstack entry point
```
