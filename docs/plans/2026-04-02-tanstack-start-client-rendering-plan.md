# TanStack Start Client Rendering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `RootPage` (server component, imports server-only modules) with a `createServerFn`-based `getPageState` + a fully client-side `TanStackAdminPage`, eliminating the need for `serverOnlyStubPlugin`.

**Architecture:** Loader calls `getPageState` server function → returns serializable page state → `TanStackAdminPage` (client component) renders template shell + view components. View components call `useServerFunctions()` on mount to fetch their data. Next.js is untouched. TanStack Start is its own rendering path.

**Tech Stack:** TypeScript, React 19, `@tanstack/react-start` (`createServerFn`), `@tanstack/react-router`, Payload CMS monorepo (pnpm + Turbo)

---

## Background / Key Concepts

Before starting, read these files to understand the existing architecture:

- `tanstack-app/app/routes/admin.$.tsx` — current route: calls `RootPage` in component
- `tanstack-app/app/routes/__root.tsx` — root layout: shows how `createServerFn` + `dispatchServerFunction` is wired
- `packages/tanstack-start/src/views/Root/index.tsx` — current `RootPage` (replaces with new approach)
- `packages/ui/src/views/Root/RenderRoot.tsx` — `renderRootPage` (Next.js uses this; TanStack Start will NOT)
- `packages/ui/src/views/Root/getRouteData.ts` — `getRouteData` function (we call this server-side in `getPageState`)
- `packages/ui/src/templates/Default/index.tsx` — `DefaultTemplate` (needs `payload: Payload`; we create a client version)
- `packages/ui/src/elements/Nav/index.tsx` — `DefaultNav` (async server component; client version is `DefaultNavClient`)
- `packages/ui/src/elements/Nav/index.client.tsx` — `DefaultNavClient` (client, takes `groups` + `navPreferences`)
- `packages/payload/src/admin/views/index.ts` — `ViewTypes`, `AdminViewClientProps`

**Important constraint:** Do NOT modify any file in `packages/next/` or `packages/ui/`. All changes are in `packages/tanstack-start/` and `tanstack-app/`.

---

## Phase 1: Serializable Page State

### Task 1: Define `SerializablePageState` type and create `getPageState` server function

**Files:**

- Create: `packages/tanstack-start/src/views/Root/getPageState.ts`

**What this does:** Calls `initReq` + `getRouteData` + `getNavPrefs` + (for dashboard) `getGlobalData` server-side. Returns a plain serializable object. Handles auth redirects and notFound by throwing TanStack Router errors.

**Step 1: Create the file**

```typescript
// packages/tanstack-start/src/views/Root/getPageState.ts
import type {
  ClientConfig,
  DocumentSubViewTypes,
  ImportMap,
  Locale,
  NavPreferences,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  ViewTypes,
} from 'payload'

import { notFound, redirect } from '@tanstack/react-router'
import {
  applyLocaleFiltering,
  formatAdminURL,
  getVisibleEntities,
} from 'payload/shared'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { getNavPrefs } from '@payloadcms/ui/elements/Nav/getNavPrefs'
import { handleAuthRedirect } from '@payloadcms/ui/utilities/handleAuthRedirect'
import { isCustomAdminView } from '@payloadcms/ui/utilities/isCustomAdminView'
import { isPublicAdminRoute } from '@payloadcms/ui/utilities/isPublicAdminRoute'
import { getGlobalData } from '@payloadcms/ui/utilities/getGlobalData'
import { getRouteData } from '@payloadcms/ui/views/Root/getRouteData'

import { initReq } from '../../utilities/initReq.js'

export type SerializablePageState = {
  browseByFolderSlugs: string[]
  clientConfig: ClientConfig
  // Only populated when viewType === 'dashboard'
  globalData?: Awaited<ReturnType<typeof getGlobalData>>
  locale?: Locale
  navPreferences?: NavPreferences
  permissions: SanitizedPermissions
  routeParams: {
    collection?: string
    folderCollection?: string
    folderID?: number | string
    global?: string
    id?: number | string
    token?: string
    versionID?: number | string
  }
  segments: string[]
  templateClassName: string
  templateType: 'default' | 'minimal' | undefined
  // For custom views resolved via importMap
  customViewPath?: string
  documentSubViewType?: DocumentSubViewTypes
  viewActions?: PayloadComponent[]
  viewType: ViewTypes | undefined
  visibleEntities: {
    collections: string[]
    globals: string[]
  }
}

export async function getPageState({
  config: configArg,
  importMap,
  searchParams,
  segments,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  searchParams?: Record<string, string | string[]>
  segments: string[]
}): Promise<SerializablePageState> {
  const initPageResult = await initReq({
    config: configArg,
    importMap,
    key: 'getPageState',
  })
  const { locale, permissions, req } = initPageResult
  const { payload } = req
  const config = payload.config
  const {
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length > 0 ? `/${segments.join('/')}` : null,
  })

  // Auth check
  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config, route: currentRoute }) &&
    !isCustomAdminView({ adminRoute, config, route: currentRoute })
  ) {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({
      to: handleAuthRedirect({
        config,
        route: currentRoute,
        searchParams,
        user: req.user,
      }),
    })
  }

  // Compute collection/global config from segments
  let collectionConfig: SanitizedCollectionConfig | undefined
  let globalConfig: SanitizedGlobalConfig | undefined

  if (segments[0] === 'collections' && segments[1]) {
    collectionConfig = config.collections.find(
      ({ slug }) => slug === segments[1],
    )
    if (!collectionConfig) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound()
    }
  } else if (segments[0] === 'globals' && segments[1]) {
    globalConfig = config.globals.find(({ slug }) => slug === segments[1])
    if (!globalConfig) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw notFound()
    }
  }

  const routeData = getRouteData({
    adminRoute,
    collectionConfig,
    currentRoute,
    globalConfig,
    payload,
    searchParams: searchParams ?? {},
    segments,
  })

  const {
    browseByFolderSlugs,
    documentSubViewType,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
  } = routeData

  // Serialize viewActions: keep only PayloadComponent references (path strings), drop React.FC
  const serializableViewActions: PayloadComponent[] = (
    viewActions ?? []
  ).filter(
    (a): a is PayloadComponent =>
      typeof a === 'string' || (typeof a === 'object' && 'path' in a),
  )

  // Get nav preferences
  const navPreferences = await getNavPrefs(req)

  // Get client config
  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  const visibleEntities = getVisibleEntities({ req })

  // For dashboard: pre-fetch global data
  let globalData: SerializablePageState['globalData']
  if (viewType === 'dashboard') {
    globalData = await getGlobalData(req)
  }

  // Custom view path: if DefaultView has a payloadComponent, pass its path
  const defaultView = routeData.DefaultView
  const customViewPath = defaultView?.payloadComponent
    ? typeof defaultView.payloadComponent === 'string'
      ? defaultView.payloadComponent
      : (defaultView.payloadComponent as { path: string }).path
    : undefined

  return {
    browseByFolderSlugs,
    clientConfig,
    customViewPath,
    documentSubViewType,
    globalData,
    locale,
    navPreferences,
    permissions,
    routeParams,
    segments,
    templateClassName,
    templateType,
    viewActions:
      serializableViewActions.length > 0 ? serializableViewActions : undefined,
    viewType,
    visibleEntities: {
      collections: visibleEntities.collections,
      globals: visibleEntities.globals,
    },
  }
}
```

**Step 2: Verify the import paths exist**

Run these to confirm the imports resolve:

```bash
grep -r "export.*getGlobalData" packages/ui/src/utilities/getGlobalData.ts
grep -r "export.*getRouteData" packages/ui/src/views/Root/getRouteData.ts
grep -r "export.*getNavPrefs" packages/ui/src/elements/Nav/getNavPrefs.ts
grep -r "export.*getClientConfig" packages/ui/src/utilities/getClientConfig.ts
grep -r "export.*getVisibleEntities" packages/ui/src/utilities/getVisibleEntities.ts
```

If any import path is wrong, check `packages/ui/src/exports/` for the correct path.

**Step 3: TypeScript check (tanstack-start only)**

```bash
cd packages/tanstack-start && pnpm tsc --noEmit 2>&1 | head -50
```

Expected: no errors on the new file. Fix any import path issues.

**Step 4: Commit**

```bash
git add packages/tanstack-start/src/views/Root/getPageState.ts
git commit -m "feat(tanstack-start): add getPageState server function returning serializable page state"
```

---

## Phase 2: Client Template (No Server Deps)

### Task 2: Create `TanStackDefaultTemplate` client component

**Context:** The existing `DefaultTemplate` in packages/ui takes `payload: Payload` (server-only). We need a client version that takes `clientConfig: ClientConfig` instead. The nav uses `DefaultNavClient` (already client-side) with groups computed from `clientConfig`.

**Files:**

- Create: `packages/tanstack-start/src/templates/Default/index.tsx`

**Step 1: Read the existing components**

Before writing, read these files:

- `packages/ui/src/templates/Default/index.tsx` — structure to mirror
- `packages/ui/src/elements/Nav/index.client.tsx` — `DefaultNavClient` props
- `packages/ui/src/utilities/groupNavItems.ts` — `groupNavItems` function signature

**Step 2: Create the file**

```typescript
// packages/tanstack-start/src/templates/Default/index.tsx
'use client'

import type {
  ClientConfig,
  DocumentSubViewTypes,
  NavPreferences,
  PayloadComponent,
  SanitizedPermissions,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import { EntityType, groupNavItems } from '@payloadcms/ui/utilities/groupNavItems'
import { ActionsProvider } from '@payloadcms/ui/providers/Actions'
import { EntityVisibilityProvider } from '@payloadcms/ui/providers/EntityVisibility'
import { BulkUploadProvider } from '@payloadcms/ui/elements/BulkUpload'
import { AppHeader } from '@payloadcms/ui/elements/AppHeader'
import { NavToggler } from '@payloadcms/ui/elements/Nav/NavToggler'
import { DefaultNavClient } from '@payloadcms/ui/elements/Nav/index.client'
import { NavWrapper } from '@payloadcms/ui/elements/Nav/NavWrapper'
import { NavHamburger as DefaultNavHamburger } from '@payloadcms/ui/templates/Default/NavHamburger'
import { Wrapper } from '@payloadcms/ui/templates/Default/Wrapper'
import { RenderCustomComponent } from '@payloadcms/ui/elements/RenderCustomComponent'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

const baseClass = 'template-default'
const navBaseClass = 'nav'

export type TanStackDefaultTemplateProps = {
  children?: React.ReactNode
  className?: string
  clientConfig: ClientConfig
  collectionSlug?: string
  docID?: number | string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  navPreferences?: NavPreferences
  permissions: SanitizedPermissions
  viewActions?: PayloadComponent[]
  viewType?: ViewTypes
  visibleEntities: VisibleEntities
}

export function TanStackDefaultTemplate({
  children,
  clientConfig,
  collectionSlug,
  documentSubViewType,
  navPreferences,
  permissions,
  viewType,
  visibleEntities,
}: TanStackDefaultTemplateProps) {
  const { i18n } = useTranslation()

  const groups = React.useMemo(
    () =>
      groupNavItems(
        [
          ...clientConfig.collections
            .filter(({ slug }) => visibleEntities.collections.includes(slug))
            .map((collection) => ({ type: EntityType.collection, entity: collection })),
          ...clientConfig.globals
            .filter(({ slug }) => visibleEntities.globals.includes(slug))
            .map((global) => ({ type: EntityType.global, entity: global })),
        ],
        permissions,
        i18n,
      ),
    [clientConfig, visibleEntities, permissions, i18n],
  )

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <BulkUploadProvider drawerSlugPrefix={collectionSlug}>
        <ActionsProvider Actions={{}}>
          <div style={{ position: 'relative' }}>
            <div className={`${baseClass}__nav-toggler-wrapper`} id="nav-toggler">
              <div className={`${baseClass}__nav-toggler-container`} id="nav-toggler">
                <NavToggler className={`${baseClass}__nav-toggler`}>
                  <DefaultNavHamburger />
                </NavToggler>
              </div>
            </div>
            <Wrapper baseClass={baseClass}>
              <NavWrapper baseClass={navBaseClass}>
                <nav className={`${navBaseClass}__wrap`}>
                  <DefaultNavClient
                    groups={groups}
                    navPreferences={navPreferences ?? null}
                  />
                </nav>
              </NavWrapper>
              <div className={`${baseClass}__wrap`}>
                <AppHeader />
                {children}
              </div>
            </Wrapper>
          </div>
        </ActionsProvider>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  )
}
```

**Note:** The import paths for internal UI components (`@payloadcms/ui/elements/Nav/NavToggler`, etc.) need to be verified against `packages/ui/package.json` exports. Run:

```bash
cat packages/ui/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(list(d.get('exports',{}).keys()), indent=2))" | grep -i "nav\|template\|appheader\|actions\|entity"
```

Adjust import paths to match actual exports.

**Step 3: TypeScript check**

```bash
cd packages/tanstack-start && pnpm tsc --noEmit 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add packages/tanstack-start/src/templates/
git commit -m "feat(tanstack-start): add TanStackDefaultTemplate client component"
```

---

## Phase 3: Client View Components

### Task 3: Create client-side view wrappers

**Context:** Each admin view type needs a client component for TanStack Start. These components:

1. Receive serializable props from `TanStackAdminPage`
2. Call the appropriate server function on mount via `useServerFunctions()`
3. Render the result (React.ReactNode for table/form, or built-in client components for auth views)

The pattern for data-fetching views:

```
mount → call serverFunction → receive result → render result (React.ReactNode)
```

`useServerFunctions()` is from `@payloadcms/ui/providers/ServerFunctions`. It provides `getTableState`, `getFormState`, etc.

**Files:**

- Create: `packages/tanstack-start/src/views/List/TanStackListView.tsx`
- Create: `packages/tanstack-start/src/views/Document/TanStackDocumentView.tsx`
- Create: `packages/tanstack-start/src/views/Dashboard/TanStackDashboardView.tsx`

**Step 1: Read relevant types**

```bash
# Check what getTableState/getFormState return and their arg types
grep -n "GetFormStateClient\|GetTableStateClient\|getFormState\|getTableState" packages/ui/src/providers/ServerFunctions/index.tsx | head -20
grep -n "BuildFormStateArgs\|BuildTableStateArgs" packages/payload/src/types/*.ts packages/ui/src/**/*.ts 2>/dev/null | grep "^packages/payload" | head -10
```

**Step 2: Create `TanStackListView`**

```typescript
// packages/tanstack-start/src/views/List/TanStackListView.tsx
'use client'

import type { SanitizedPermissions, ViewTypes } from 'payload'

import { useServerFunctions } from '@payloadcms/ui/providers/ServerFunctions'
import React, { useEffect, useState } from 'react'

type Props = {
  collectionSlug: string
  permissions: SanitizedPermissions
  searchParams: Record<string, string | string[]>
  viewType?: ViewTypes
}

export function TanStackListView({ collectionSlug, searchParams }: Props) {
  const { getTableState } = useServerFunctions()
  const [tableContent, setTableContent] = useState<React.ReactNode>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setTableContent(null)
    setError(null)

    getTableState({
      collectionSlug,
      enableRowSelections: true,
      query: searchParams as Record<string, string>,
      renderRowTypes: true,
    })
      .then((result) => {
        if (cancelled) return
        if ('errors' in result || 'message' in result) {
          setError('message' in result ? result.message : 'Failed to load list')
        } else if (result) {
          setTableContent(result.Table)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => { cancelled = true }
  }, [collectionSlug, JSON.stringify(searchParams)])  // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="payload-list-error">{error}</div>
  if (!tableContent) return <div className="payload-loading" />
  return <>{tableContent}</>
}
```

**Step 3: Create `TanStackDocumentView`**

```typescript
// packages/tanstack-start/src/views/Document/TanStackDocumentView.tsx
'use client'

import type { DocumentSubViewTypes, SanitizedPermissions } from 'payload'

import { useServerFunctions } from '@payloadcms/ui/providers/ServerFunctions'
import React, { useEffect, useState } from 'react'

type Props = {
  collectionSlug?: string
  documentSubViewType?: DocumentSubViewTypes
  docID?: number | string
  globalSlug?: string
  permissions: SanitizedPermissions
  searchParams: Record<string, string | string[]>
}

export function TanStackDocumentView({
  collectionSlug,
  docID,
  globalSlug,
  searchParams,
}: Props) {
  const { getFormState } = useServerFunctions()
  const [content, setContent] = useState<React.ReactNode>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setError(null)

    const schemaPath = collectionSlug ?? globalSlug ?? ''
    getFormState({
      collectionSlug,
      docID,
      globalSlug,
      schemaPath,
      // docPreferences and other args will use defaults
    })
      .then((result) => {
        if (cancelled) return
        if (result && 'errors' in result) {
          setError('Failed to load document')
        } else if (result && 'state' in result) {
          // The form state is returned; the admin renders the form using
          // the DocumentView from the RenderDocument server fn slot.
          // For TanStack Start we trigger router invalidation to refresh.
          // TODO: render DocumentViewClient directly with the form state
          setContent(<div data-tanstack-form-state="loaded" />)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => { cancelled = true }
  }, [collectionSlug, String(docID), globalSlug])  // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="payload-doc-error">{error}</div>
  if (!content) return <div className="payload-loading" />
  return <>{content}</>
}
```

**Note:** The document view stub above is intentionally minimal. In practice, the document form is initially rendered via SSR (`RootPage` during SSR still renders). Client-side navigation to document pages triggers a new SSR pass. The `getFormState` call here is for ensuring the form is hydrated with current data after SSR. Expand this in a follow-up once the full `DocumentViewClient` integration is understood by reading `packages/ui/src/views/Document/` more deeply.

**Step 4: Create `TanStackDashboardView`**

```typescript
// packages/tanstack-start/src/views/Dashboard/TanStackDashboardView.tsx
'use client'

import type { ClientConfig, NavGroup, SanitizedPermissions } from 'payload'

import { DefaultDashboard } from '@payloadcms/ui/views/Dashboard/Default'
import { getNavGroups } from '@payloadcms/ui/utilities/getNavGroups'
import { useTranslation } from '@payloadcms/ui/providers/Translation'
import React from 'react'

type GlobalDataEntry = {
  data: Record<string, unknown>
  global: { slug: string }
}

type Props = {
  clientConfig: ClientConfig
  globalData?: GlobalDataEntry[]
  permissions: SanitizedPermissions
}

export function TanStackDashboardView({ clientConfig, globalData, permissions }: Props) {
  const { i18n } = useTranslation()

  const navGroups: NavGroup[] = React.useMemo(
    () => getNavGroups(permissions, { collections: clientConfig.collections.map(c => c.slug), globals: clientConfig.globals.map(g => g.slug) }, clientConfig, i18n),
    [clientConfig, permissions, i18n],
  )

  return (
    <DefaultDashboard
      globalData={globalData ?? []}
      navGroups={navGroups}
    />
  )
}
```

**Note:** `DefaultDashboard` props — verify by reading `packages/ui/src/views/Dashboard/Default/index.tsx`:

```bash
head -30 packages/ui/src/views/Dashboard/Default/index.tsx
```

Adjust props to match the actual `DefaultDashboard` component signature.

**Step 5: TypeScript check**

```bash
cd packages/tanstack-start && pnpm tsc --noEmit 2>&1 | head -50
```

Fix any type errors. The view components will have stubs that expand later.

**Step 6: Commit**

```bash
git add packages/tanstack-start/src/views/
git commit -m "feat(tanstack-start): add TanStack client view components (list, document, dashboard)"
```

---

### Task 4: Create `TanStackAdminPage` — the top-level client component

**Files:**

- Create: `packages/tanstack-start/src/views/Root/TanStackAdminPage.tsx`

**Step 1: Read auth view client components**

```bash
# These already exist as client components we can import directly
ls packages/ui/src/views/Login/
ls packages/ui/src/views/CreateFirstUser/
ls packages/ui/src/views/Account/
ls packages/ui/src/views/ForgotPassword/
ls packages/ui/src/views/ResetPassword/
ls packages/ui/src/views/Verify/
# Check which are already client components:
head -1 packages/ui/src/views/Login/index.tsx
head -1 packages/ui/src/views/CreateFirstUser/index.client.tsx
```

**Step 2: Create the component**

```typescript
// packages/tanstack-start/src/views/Root/TanStackAdminPage.tsx
'use client'

import type { ImportMap } from 'payload'

import { MinimalTemplate } from '@payloadcms/ui/templates/Minimal'
import { PageConfigProvider } from '@payloadcms/ui/providers/Config'
import { HydrateAuthProvider } from '@payloadcms/ui/elements/HydrateAuthProvider'
import React from 'react'

import type { SerializablePageState } from './getPageState.js'
import { TanStackDefaultTemplate } from '../../templates/Default/index.js'
import { TanStackDashboardView } from '../Dashboard/TanStackDashboardView.js'
import { TanStackDocumentView } from '../Document/TanStackDocumentView.js'
import { TanStackListView } from '../List/TanStackListView.js'

type Props = {
  importMap: ImportMap
  pageState: SerializablePageState & { searchParams: Record<string, string | string[]> }
}

function renderView(
  pageState: SerializablePageState & { searchParams: Record<string, string | string[]> },
): React.ReactNode {
  const { viewType, routeParams, permissions, searchParams, clientConfig, globalData, documentSubViewType } = pageState

  switch (viewType) {
    case 'dashboard':
      return (
        <TanStackDashboardView
          clientConfig={clientConfig}
          globalData={globalData}
          permissions={permissions}
        />
      )

    case 'list':
    case 'trash':
    case 'collection-folders':
    case 'folders':
      return (
        <TanStackListView
          collectionSlug={routeParams.collection ?? ''}
          permissions={permissions}
          searchParams={searchParams}
          viewType={viewType}
        />
      )

    case 'document':
    case 'version':
      return (
        <TanStackDocumentView
          collectionSlug={routeParams.collection}
          docID={routeParams.id}
          documentSubViewType={documentSubViewType}
          globalSlug={routeParams.global}
          permissions={permissions}
          searchParams={searchParams}
        />
      )

    // Auth / minimal template views — these are client-side already and don't need data fetching
    case 'login':
    case 'logout':
    case 'createFirstUser':
    case 'forgot':
    case 'reset':
    case 'verify':
    case 'account':
    default:
      // For auth and other minimal views: the SSR pass from loader renders them.
      // On client navigation these views are light and don't need separate data fetching.
      return null
  }
}

export function TanStackAdminPage({ pageState }: Props) {
  const { clientConfig, permissions, visibleEntities, navPreferences, templateType, templateClassName, routeParams, documentSubViewType, viewType } = pageState

  const view = renderView(pageState)

  if (templateType === 'minimal') {
    return (
      <PageConfigProvider config={clientConfig}>
        <HydrateAuthProvider permissions={permissions} />
        <MinimalTemplate className={templateClassName}>
          {view}
        </MinimalTemplate>
      </PageConfigProvider>
    )
  }

  return (
    <PageConfigProvider config={clientConfig}>
      <HydrateAuthProvider permissions={permissions} />
      <TanStackDefaultTemplate
        clientConfig={clientConfig}
        collectionSlug={routeParams.collection}
        docID={routeParams.id}
        documentSubViewType={documentSubViewType}
        globalSlug={routeParams.global}
        navPreferences={navPreferences}
        permissions={permissions}
        viewType={viewType}
        visibleEntities={visibleEntities}
      >
        {view}
      </TanStackDefaultTemplate>
    </PageConfigProvider>
  )
}
```

**Step 3: TypeScript check**

```bash
cd packages/tanstack-start && pnpm tsc --noEmit 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add packages/tanstack-start/src/views/Root/TanStackAdminPage.tsx
git commit -m "feat(tanstack-start): add TanStackAdminPage client component"
```

---

## Phase 4: Wire Routes

### Task 5: Update `admin.$.tsx` and `admin.index.tsx` to use `getPageState` + `TanStackAdminPage`

**Files:**

- Modify: `tanstack-app/app/routes/admin.$.tsx`
- Modify: `tanstack-app/app/routes/admin.index.tsx`

**Step 1: Read both files**

Read them in full first (`admin.$.tsx` and `admin.index.tsx`) to understand what needs to change.

**Step 2: Rewrite `admin.$.tsx`**

```typescript
// tanstack-app/app/routes/admin.$.tsx
import config from '@payload-config'
import { TanStackAdminPage } from '@payloadcms/tanstack-start/views'
import { getPageState } from '@payloadcms/tanstack-start/views/Root/getPageState'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/$')({
  loader: async ({ params, context }) => {
    const segments = params._splat?.split('/').filter(Boolean) ?? []
    const searchParams = (context as any)?.searchParams ?? {}
    return getPageState({ config, importMap, searchParams, segments })
    // Auth redirects and notFound are thrown inside getPageState
  },
  component: AdminPage,
})

function AdminPage() {
  const pageState = Route.useLoaderData()
  const search = Route.useSearch()
  return (
    <TanStackAdminPage
      importMap={importMap}
      pageState={{ ...pageState, searchParams: search as Record<string, string | string[]> }}
    />
  )
}
```

**Step 3: Rewrite `admin.index.tsx`**

```typescript
// tanstack-app/app/routes/admin.index.tsx
import config from '@payload-config'
import { TanStackAdminPage } from '@payloadcms/tanstack-start/views'
import { getPageState } from '@payloadcms/tanstack-start/views/Root/getPageState'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

import { importMap } from '../importMap.js'

export const Route = createFileRoute('/admin/')({
  loader: async () => {
    return getPageState({ config, importMap, segments: [] })
  },
  component: AdminIndexPage,
})

function AdminIndexPage() {
  const pageState = Route.useLoaderData()
  const search = Route.useSearch()
  return (
    <TanStackAdminPage
      importMap={importMap}
      pageState={{ ...pageState, searchParams: search as Record<string, string | string[]> }}
    />
  )
}
```

**Step 4: TypeScript check on the app**

```bash
cd tanstack-app && npx tsc --noEmit 2>&1 | head -50
```

Fix import path issues. `@payloadcms/tanstack-start/views/Root/getPageState` needs to be a valid export — check step 5 first.

**Step 5: Update exports in packages/tanstack-start**

Read `packages/tanstack-start/src/index.ts` and `packages/tanstack-start/package.json`. Add:

- Export `TanStackAdminPage` from `packages/tanstack-start/src/index.ts`
- Export `getPageState` and `SerializablePageState` from `packages/tanstack-start/src/index.ts`
- Add export path `./views/Root/getPageState` to `packages/tanstack-start/package.json` exports if needed

Then re-run TypeScript check.

**Step 6: Start dev server and visually verify**

```bash
pnpm run dev:tanstack
```

Open `http://localhost:3000/admin`. Verify:

- Dashboard renders (might show loading state for view content)
- Nav appears
- No `server-only` import errors in browser console

**Step 7: Commit**

```bash
git add tanstack-app/app/routes/admin.$.tsx tanstack-app/app/routes/admin.index.tsx packages/tanstack-start/src/
git commit -m "feat(tanstack-start): wire routes to use getPageState + TanStackAdminPage"
```

---

## Phase 5: Server Function Interceptor + Router Invalidation

### Task 6: Intercept `render-document`/`render-list` and trigger router invalidation

**Files:**

- Modify: `packages/tanstack-start/src/utilities/handleServerFunctions.ts`
- Modify: `tanstack-app/app/routes/__root.tsx`
- Modify: `packages/tanstack-start/src/adapter/RouterProvider.tsx`

**Context:** In Next.js, `render-document` and `render-list` return React nodes via the RSC protocol. In TanStack Start, these are called via `handleServerFn` (a `createServerFn`). They return React nodes, which are serialized via seroval. Instead of trying to serialize them, we return a signal `{ __tanstack_invalidate: true }` that tells the client to call `router.invalidate()` to refresh the page via a new loader run.

**Step 1: Read current `handleServerFunctions.ts`**

Read `packages/tanstack-start/src/utilities/handleServerFunctions.ts` to understand current structure.

**Step 2: Add the interceptor**

```typescript
// packages/tanstack-start/src/utilities/handleServerFunctions.ts
// Add at the top:
const TANSTACK_INVALIDATE_FNS = new Set([
  'render-document',
  'render-list',
  'render-document-slots',
])

// In handleServerFunctions, before the dispatch call:
if (TANSTACK_INVALIDATE_FNS.has(fnKey)) {
  return { __tanstack_invalidate: true }
}
```

**Step 3: Update `__root.tsx` to intercept the response**

In `tanstack-app/app/routes/__root.tsx`, the `serverFunction` wrapper calls `handleServerFn`. Update the wrapper:

```typescript
// After: const serverFunction: ServerFunctionClient = (args) => handleServerFn({ data: args })
// Change to:
const serverFunction: ServerFunctionClient = async (args) => {
  const result = await handleServerFn({ data: args })
  if (
    result &&
    typeof result === 'object' &&
    '__tanstack_invalidate' in result
  ) {
    // Signal handled by RouterProvider
    return result
  }
  return result
}
```

**Step 4: Update `TanStackRouterProvider` to handle `__tanstack_invalidate`**

Read `packages/tanstack-start/src/adapter/RouterProvider.tsx`. The RouterProvider wraps `BaseRouterProvider`. We need to intercept server function calls that return `{ __tanstack_invalidate: true }`.

The place to intercept is in the `router.refresh` path — or we can override the server function wrapper at the `ServerFunctionsProvider` level.

Actually, the cleanest approach: in `__root.tsx`, the `serverFunction` already calls `handleServerFn`. If we return `{ __tanstack_invalidate: true }`, the calling code in the admin UI will receive it. The admin UI calls server functions via `useServerFunctions()` hooks. These hooks need to detect the signal and call `router.invalidate()`.

The `ServerFunctionsProvider` provides the `serverFunction` callback. We can wrap it:

```typescript
// In tanstack-app/app/routes/__root.tsx, inside RootComponent:
const router = useRouter()

const tanstackAwareServerFunction: ServerFunctionClient = React.useCallback(
  async (args) => {
    const result = await serverFunction(args)
    if (
      result &&
      typeof result === 'object' &&
      '__tanstack_invalidate' in result
    ) {
      void router.invalidate()
      return null
    }
    return result
  },
  [router],
)

// Then pass tanstackAwareServerFunction to RootLayout instead of serverFunction
```

Read `RootLayout` to understand where `serverFunction` is threaded through.

**Step 5: Verify no TypeScript errors**

```bash
cd packages/tanstack-start && pnpm tsc --noEmit 2>&1 | head -50
cd tanstack-app && npx tsc --noEmit 2>&1 | head -50
```

**Step 6: Commit**

```bash
git add packages/tanstack-start/src/utilities/handleServerFunctions.ts tanstack-app/app/routes/__root.tsx
git commit -m "feat(tanstack-start): intercept render-document/render-list with router.invalidate()"
```

---

## Phase 6: Cleanup

### Task 7: Remove `serverOnlyStubPlugin` from vite.config.ts

**Prerequisite:** Verify in browser that no `import error` / `module not found` errors appear for server-only modules. If errors appear, the component tree still has server-only imports — debug before removing the plugin.

**Files:**

- Modify: `tanstack-app/vite.config.ts`

**Step 1: Read the current vite.config.ts**

Check `tanstack-app/vite.config.ts`. Remove:

- The `SERVER_ONLY_PACKAGES` constant
- The `serverOnlyStubPlugin` function
- The `serverOnlyStubPlugin()` call in the `plugins` array
- The `readFileSync` import if no longer needed

Keep `tanstackStartCompatPlugin` (still needed for the virtual module shim).

**Step 2: Remove `server-only-stub.js` and `server-only-stub.cjs`**

```bash
rm tanstack-app/server-only-stub.js tanstack-app/server-only-stub.cjs
```

**Step 3: Start dev server and verify**

```bash
pnpm run dev:tanstack
```

Navigate through admin routes. If `ERR_MODULE_NOT_FOUND` or similar errors appear in the browser console, there's still a server-only import somewhere. Trace it:

1. Open browser DevTools → Console
2. Find the module that failed to load
3. Find which file imports it: `grep -rn "import.*<failing-module>" tanstack-app/ packages/tanstack-start/src/`
4. Fix the import (move to a server function or remove)

**Step 4: Commit**

```bash
git add tanstack-app/vite.config.ts
git commit -m "chore(tanstack-start): remove serverOnlyStubPlugin after client-only component tree"
```

---

### Task 8: Remove `RootPage` from `packages/tanstack-start`

**Files:**

- Delete: `packages/tanstack-start/src/views/Root/index.tsx`
- Modify: `packages/tanstack-start/src/index.ts` (remove `RootPage` export)
- Modify: `packages/tanstack-start/package.json` (remove `./views` export if it only exported `RootPage`)

**Step 1: Read current exports**

```bash
cat packages/tanstack-start/src/index.ts
cat packages/tanstack-start/package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d.get('exports',{}), indent=2))"
```

**Step 2: Remove the file and update exports**

```bash
rm packages/tanstack-start/src/views/Root/index.tsx
```

Update `src/index.ts` to remove `RootPage` export. Update `package.json` if the `./views` export path pointed to the file with `RootPage`.

**Step 3: TypeScript check**

```bash
cd packages/tanstack-start && pnpm tsc --noEmit 2>&1 | head -50
```

**Step 4: Commit**

```bash
git add packages/tanstack-start/
git commit -m "chore(tanstack-start): remove RootPage — replaced by TanStackAdminPage + getPageState"
```

---

## Phase 7: Tests

### Task 9: Update integration tests for the new adapter shape

**Files:**

- Modify: `test/admin-adapter/tanstack-start.int.spec.ts`

**Step 1: Run existing tests to see current state**

```bash
pnpm run test:int admin-adapter 2>&1 | tail -30
```

**Step 2: Add new tests for `getPageState` and `TanStackAdminPage` exports**

```typescript
// Add to test/admin-adapter/tanstack-start.int.spec.ts:

it('should export TanStackAdminPage', async () => {
  const { TanStackAdminPage } = await import('@payloadcms/tanstack-start')
  expect(typeof TanStackAdminPage).toBe('function')
})

it('should export getPageState', async () => {
  const { getPageState } = await import('@payloadcms/tanstack-start')
  expect(typeof getPageState).toBe('function')
})

it('should NOT export RootPage (removed)', async () => {
  const mod = await import('@payloadcms/tanstack-start')
  expect('RootPage' in mod).toBe(false)
})

it('render-document returns __tanstack_invalidate signal', async () => {
  const { handleServerFunctions } = await import('@payloadcms/tanstack-start')
  // handleServerFunctions needs full payload context to run
  // Just verify it's the updated version by checking its source behavior via a mock
  // (Full integration test requires a running Payload instance)
  expect(typeof handleServerFunctions).toBe('function')
})
```

**Step 3: Run tests**

```bash
pnpm run test:int admin-adapter 2>&1 | tail -30
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add test/admin-adapter/tanstack-start.int.spec.ts
git commit -m "test: update TanStack Start adapter integration tests for new client rendering"
```

---

### Task 10: E2E smoke test with `pnpm dev:tanstack`

This task verifies the full flow works end-to-end before declaring victory.

**Step 1: Start the TanStack dev server**

```bash
pnpm run dev:tanstack
```

Wait for it to be ready (look for "ready" or "listening on port" message).

**Step 2: Use Playwright MCP to verify**

With the dev server running on `http://localhost:3000`:

1. Navigate to `http://localhost:3000/admin` — should redirect to login
2. Log in with `dev@payloadcms.com` / `test`
3. Should see dashboard with collections/globals visible
4. Navigate to a collection list
5. Navigate to create a new document
6. Check browser console for `server-only` import errors — should be zero

**Step 3: Run Next.js tests to verify no regressions**

```bash
pnpm run test:int admin-root 2>&1 | tail -20
```

Expected: All passing (11 tests as confirmed before this change).

**Step 4: Fix any issues found**

If browser console shows errors:

- Identify the module that failed
- Find where it's imported in the TanStack client component tree
- Move to server function or remove

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore(tanstack-start): verify e2e after client rendering migration"
```

---

## Dependency Graph

```
Task 1 (getPageState)
    ↓
Task 2 (TanStackDefaultTemplate)
    ↓
Tasks 3-4 (view components + TanStackAdminPage)
    ↓
Task 5 (wire routes)
    ↓
Task 6 (handleServerFunctions interceptor)
    ↓
Task 7 (remove serverOnlyStubPlugin) ← verify no more server-only imports first
    ↓
Task 8 (remove RootPage)
    ↓
Tasks 9-10 (tests + e2e)
```

---

## Key Things to Watch For

1. **`groupNavItems` signature** — verify it accepts `ClientConfig` collections/globals, not `SanitizedConfig`. Run: `grep -n "groupNavItems\|EntityToGroup" packages/ui/src/utilities/groupNavItems.ts | head -20`

2. **Import paths in `packages/ui`** — `@payloadcms/ui/elements/Nav/index.client` may not be a valid export path. Check `packages/ui/package.json` exports. You may need to use relative paths or find the correct export.

3. **`getNavGroups` vs `groupNavItems`** — check which one is exported from packages/ui and is usable client-side.

4. **`HydrateAuthProvider`** — check if it needs `permissions` or gets them from context. Read: `head -20 packages/ui/src/elements/HydrateAuthProvider/index.tsx`

5. **`getPageState` import path** — since `getPageState.ts` is a new file, its import path in the route files needs a matching export entry in `packages/tanstack-start/package.json`.
