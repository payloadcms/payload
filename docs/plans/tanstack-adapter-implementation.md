# TanStack Start Adapter Implementation Plan

## Executive Summary

This plan describes the work needed to implement `packages/tanstack-start` — a framework adapter that lets Payload's admin panel run on TanStack Start instead of Next.js. TanStack Start uses SSR (not RSC), file-based routing via TanStack Router, and server functions via Vinxi/Nitro.

The existing framework adapter pattern (documented in `framework-adapter-pattern.md`) has completed Phases 1, 2, 5, 6, and most of 3. **Phase 4 (eliminating RSC from `packages/ui`) is the critical prerequisite** — without it, TanStack Start cannot render Payload's admin views.

---

## Current Readiness Assessment

### What's Already Done (supports TanStack immediately)

| Area                          | Status    | Notes                                                                                                                                                                          |
| ----------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Adapter contract types        | **Ready** | `RouterAdapterComponent`, `ServerAdapter`, `ComponentRenderer`, `DevReloadStrategy` all defined in `packages/payload/src/admin/adapters.ts`                                    |
| Router abstraction            | **Ready** | `RouterAdapterContext` + hooks (`useRouter`, `usePathname`, `useSearchParams`, `useParams`) in `packages/ui/src/providers/RouterAdapter`. No `next/navigation` imports remain. |
| `packages/ui` Next.js-free    | **Ready** | Zero `next/*` runtime imports. `next` removed from `peerDependencies`.                                                                                                         |
| `RootProvider` injection      | **Ready** | Accepts `RouterAdapter`, `serverFunction`, `switchLanguageServerAction` as props — all framework-injected.                                                                     |
| `ComponentRenderer` threading | **Ready** | `renderComponent` prop threaded through `ServerProps`, server functions, view slots.                                                                                           |
| `RenderClientComponent`       | **Ready** | Framework-agnostic renderer in `packages/ui` for non-RSC environments.                                                                                                         |
| Import map abstraction        | **Ready** | File path resolution supports adapter-specific output directories.                                                                                                             |
| Server function registry      | **Ready** | `sharedServerFunctions` exported from `packages/ui`; adapter merges its own handlers.                                                                                          |
| Dev server dispatch           | **Ready** | `test/dev.ts` switches on `PAYLOAD_FRAMEWORK` env var.                                                                                                                         |

### What's NOT Ready (blockers)

> **Last audited:** 2026-04-07

#### Resolved

| Area                              | Original Blocker                                                                                                                            | Resolution                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Async RSC in `packages/ui`~~    | `CollectionCards` was an `export async function` component — cannot render in SSR-only                                                      | `CollectionCardsView` is now a **sync** wrapper; async data loading is in `getCollectionCardsData`. No longer exported from `@payloadcms/ui/rsc`.                                                                                                                                                       |
| ~~Server functions return JSX~~   | `render-document`, `render-list`, `render-widget`, `render-field`, `render-document-slots` returned `React.ReactNode` (RSC flight payloads) | Six data-only handlers exist under `packages/ui/src/utilities/dataOnlyHandlers/` and are aggregated in `dataOnlyServerFunctions`. A non-RSC adapter swaps in this map instead of the Next.js JSX-returning handlers. Next.js adapter is unchanged.                                                      |
| ~~`@payloadcms/ui/rsc` exports~~  | Entrypoint re-exported `CollectionCards` (async component) alongside framework-agnostic utilities                                           | `CollectionCards` removed from `@payloadcms/ui/rsc`. The entrypoint only re-exports framework-agnostic utilities (`renderFilters`, `getColumns`, etc.).                                                                                                                                                 |
| ~~View data fetchers incomplete~~ | Many views in `packages/next/src/views/` mixed data fetching and RSC rendering. Extraction to `packages/ui` was incomplete.                 | All major view data fetchers extracted and wired: `getDocumentViewData`, `getListViewData`, `getLoginViewData`, `getAccountViewData`, `getVersionViewData`, `getVersionsViewData`, `getDashboardData`, `getCreateFirstUserData`, `getVerifyData`. Only `RootPage` remains (see "Still Blocking" below). |

#### Still Blocking

| Area                                      | Blocker                                                                                                                                                                                                                                                                                                                                                                               | Severity                                | Notes                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `RootPage` orchestration                  | `packages/next/src/views/Root/index.tsx` (360+ lines) handles routing, auth redirects, template selection, view resolution, metadata — all as one RSC. `getRootViewData` exists in `packages/ui/src/views/Root/getRootViewData.ts` and is listed in `package.json` exports but **nothing imports it yet**. The actual `RootPage` still uses its own local `getRouteData` + `initReq`. | **HIGH** — core routing                 | Biggest remaining blocker. TanStack admin layout route depends on a shared fetcher.                           |
| `ServerAdapter` unused in `initReq`       | `initReq` in `packages/next` imports directly from `next/headers`, bypassing the `ServerAdapter` interface. No framework-agnostic `initReq` exists in `packages/ui` or `packages/payload` — only the `InitReqResult` type contract is in core.                                                                                                                                        | **MEDIUM** — need generic `initReq`     | TanStack adapter needs its own `initReq` using Vinxi's `getWebRequest()`, conforming to `InitReqResult`.      |
| Server actions for auth                   | `login.ts`, `logout.ts`, `refresh.ts` in `packages/next/src/auth/` use `'use server'` + `next/headers`. `setPayloadAuthCookie` imports `cookies` from `next/headers.js`. `switchLanguageServerAction` in `Root/index.tsx` also uses `'use server'` + `next/headers`.                                                                                                                  | **MEDIUM** — alternative implementation | `LoginForm` in `packages/ui` is `'use client'` and posts to REST — the UI side is already framework-agnostic. |
| `React.cache()` in `packages/ui`          | Five files use `import { cache } from 'react'` for request-level memoization (RSC feature): `getNavPrefs.ts`, `upsertPreferences.ts`, `getSchemaMap.ts`, `getClientSchemaMap.ts`, `getClientConfig.ts`. This only works during RSC render passes.                                                                                                                                     | **MEDIUM** — 5 files                    | Needs request-scoped `Map` on Vinxi event context or similar alternative. Architecture decision required.     |
| `NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH` | `RouteCache` provider in `RootProvider` (`packages/ui/src/providers/Root/index.tsx` L85-87) hardcodes `process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === 'true'`                                                                                                                                                                                                                | **LOW** — make configurable             | Should become a prop or adapter-injected config.                                                              |

#### Unblocking Priority

| Priority | Blocker                                   | Effort | Notes                                                                                                    |
| -------- | ----------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| 1        | `RootPage` orchestration                  | High   | 360+ line RSC needs decomposition; wire existing `getRootViewData` into `Root/index.tsx`                 |
| 2        | Framework-agnostic `initReq`              | Medium | TanStack implementation using `InitReqResult` type + Vinxi's `getWebRequest()`                           |
| 3        | Auth server functions                     | Medium | Rewrite login/logout/refresh/switchLanguage for Vinxi; can run parallel with other TanStack adapter work |
| 4        | `React.cache()` in `packages/ui`          | Medium | 5 files; needs architecture decision for request-scoped memoization without RSC                          |
| 5        | `NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH` | Low    | Convert env var check to a prop on `RootProvider`                                                        |

Blockers 2, 3, and 5 are scoped to `packages/tanstack-start` (parallel-safe). Blockers 1 and 4 require changes to shared `packages/ui` code and must avoid regressions in the Next.js adapter.

---

## TanStack Start vs Next.js: Key Architectural Differences

| Concern            | Next.js (App Router)                           | TanStack Start                                                            |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Component model    | RSC (async server) + client components         | Client components only, SSR'd                                             |
| Data loading       | Async component bodies, `use()`                | Route `loader` functions (run on server)                                  |
| Server mutations   | Server Actions (`'use server'`)                | `createServerFn` or REST endpoints                                        |
| Routing            | File-based (`app/` directory)                  | File-based via TanStack Router (`routes/`)                                |
| Navigation         | `next/navigation` (`useRouter`, etc.)          | `@tanstack/react-router` (`useRouter`, `Link`, etc.)                      |
| Request access     | `headers()`, `cookies()` from `next/headers`   | Vinxi `getWebRequest()` / `getEvent()`                                    |
| Metadata           | `export const metadata` / `generateMetadata()` | `<head>` management via route `meta` function or `@tanstack/react-helmet` |
| Streaming/Suspense | RSC streaming + Suspense                       | SSR streaming + Suspense                                                  |
| Build tool         | Webpack / Turbopack                            | Vinxi (Vite + Nitro)                                                      |

**Fundamental implication:** Every piece of code that relies on RSC semantics (async components, `$$typeof` checks, React flight serialization) must have a data-only alternative path.

---

## Implementation Phases

### Phase T1: Complete Prerequisites in `packages/ui` (from Phase 4)

These items come from `framework-adapter-pattern.md` Phase 4 and **must** be done before the TanStack adapter can work.

#### T1.1: ~~Refactor `CollectionCards` out of `packages/ui`~~ ✅ DONE

`CollectionCardsView` is now a sync wrapper in `packages/ui/src/widgets/CollectionCards/index.tsx`. Async data loading lives in `getCollectionCardsData`. Not exported from `@payloadcms/ui/rsc`.

#### T1.2: ~~Server functions data-only mode~~ ✅ DONE

Six data-only handlers exist in `packages/ui/src/utilities/dataOnlyHandlers/`:

| Handler                              | Returns                                           |
| ------------------------------------ | ------------------------------------------------- |
| `renderDocumentDataOnlyHandler`      | `{ data, documentViewData, preferences }`         |
| `renderListDataOnlyHandler`          | `{ listViewData, preferences }`                   |
| `renderFieldDataOnlyHandler`         | `{ fieldState }` (stripped of `customComponents`) |
| `renderWidgetDataOnlyHandler`        | `{ widgetConfig, widgetData }`                    |
| `renderDocumentSlotsDataOnlyHandler` | `{ slotConfigs }` (component refs, not nodes)     |
| `getDefaultLayoutDataOnlyHandler`    | `{ layout }`                                      |

These are aggregated in `dataOnlyServerFunctions` (`packages/ui/src/utilities/dataOnlyServerFunctions.ts`). A non-RSC adapter swaps this map in instead of the Next.js JSX-returning handlers. The Next.js adapter is unchanged.

#### T1.3: ~~Extract view data fetchers to `packages/ui`~~ ✅ MOSTLY DONE

| View                             | Data fetcher             | Status                                                                                                                                                                                             |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DocumentView`                   | `getDocumentViewData`    | ✅ Extracted and wired                                                                                                                                                                             |
| `ListView`                       | `getListViewData`        | ✅ Extracted and wired                                                                                                                                                                             |
| `LoginView`                      | `getLoginViewData`       | ✅ Extracted and wired                                                                                                                                                                             |
| `AccountView`                    | `getAccountViewData`     | ✅ Extracted and wired                                                                                                                                                                             |
| `VersionView`                    | `getVersionViewData`     | ✅ Extracted and wired                                                                                                                                                                             |
| `VersionsView`                   | `getVersionsViewData`    | ✅ Extracted and wired                                                                                                                                                                             |
| `Dashboard`                      | `getDashboardData`       | ✅ Extracted and wired                                                                                                                                                                             |
| `CreateFirstUser`                | `getCreateFirstUserData` | ✅ Extracted and wired                                                                                                                                                                             |
| `Verify`                         | `getVerifyData`          | ✅ Extracted and wired                                                                                                                                                                             |
| `RootPage` (route orchestration) | `getRootViewData`        | ⚠️ **Exists** at `packages/ui/src/views/Root/getRootViewData.ts` and listed in `package.json` exports, but **nothing imports it**. `RootPage` still uses its own local `getRouteData` + `initReq`. |

#### T1.4: ~~`@payloadcms/ui/rsc` entrypoint cleanup~~ ✅ DONE

`CollectionCards` removed from `@payloadcms/ui/rsc`. The entrypoint only re-exports framework-agnostic utilities (`renderFilters`, `getColumns`, etc.).

#### T1.5: Wire `getRootViewData` into `RootPage` ⬅ REMAINING WORK

**Current:** `getRootViewData` exists in `packages/ui/src/views/Root/getRootViewData.ts` and is exported via `package.json`, but `packages/next/src/views/Root/index.tsx` does not use it. The 360+ line RSC still handles routing, auth redirects, template selection, view resolution, and metadata with its own local `getRouteData` + `initReq`.

**Action:**

- Refactor `RootPage` to call `getRootViewData` for its data-fetching logic
- Keep RSC-specific rendering in the Next.js adapter
- The TanStack admin layout route loader will call `getRootViewData` directly

#### T1.6: Replace `React.cache()` in `packages/ui` ⬅ REMAINING WORK

**Current:** Five files use `import { cache } from 'react'` for request-level memoization (RSC-only feature):

- `packages/ui/src/elements/Nav/getNavPrefs.ts`
- `packages/ui/src/utilities/upsertPreferences.ts`
- `packages/ui/src/utilities/getSchemaMap.ts`
- `packages/ui/src/utilities/getClientSchemaMap.ts`
- `packages/ui/src/utilities/getClientConfig.ts`

**Action:** Replace with a framework-agnostic request-scoped memoization strategy (e.g., a `Map` on the Vinxi event context in TanStack, or an adapter-injected cache provider). Architecture decision required — the replacement must also work for the Next.js adapter (where `React.cache()` is valid).

#### T1.7: Make `NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH` configurable ⬅ REMAINING WORK

**Current:** `RootProvider` (`packages/ui/src/providers/Root/index.tsx` L85-87) hardcodes:

```typescript
<RouteCache cachingEnabled={process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === 'true'}>
```

**Action:** Convert to a `cachingEnabled` prop on `RootProvider`, with each adapter supplying the value. Next.js reads the env var; TanStack passes `false` (or its own config).

---

### Phase T2: Create `packages/tanstack-start` Package

#### T2.1: Package setup

```
packages/tanstack-start/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # Main exports
│   ├── exports/
│   │   ├── client.ts               # Client-side exports
│   │   └── server.ts               # Server-side exports
│   ├── elements/
│   │   ├── RouterAdapter/
│   │   │   └── index.tsx            # TanStackRouterAdapter
│   │   └── RenderComponent/
│   │       └── index.tsx            # RenderClientComponent wrapper
│   ├── layouts/
│   │   └── Root/
│   │       └── index.tsx            # Root layout (SSR shell)
│   ├── utilities/
│   │   ├── initReq.ts              # Request init using Vinxi
│   │   ├── handleServerFunctions.ts # Server function dispatch
│   │   └── serverAdapter.ts        # ServerAdapter implementation
│   ├── routes/
│   │   ├── __root.tsx              # TanStack Router root route
│   │   ├── admin/
│   │   │   ├── route.tsx           # Admin layout route (data loader)
│   │   │   ├── index.tsx           # Dashboard
│   │   │   ├── login.tsx           # Login
│   │   │   ├── logout.tsx          # Logout
│   │   │   ├── create-first-user.tsx
│   │   │   ├── forgot-password.tsx
│   │   │   ├── reset-password.tsx
│   │   │   ├── verify.tsx
│   │   │   ├── account.tsx
│   │   │   ├── collections/
│   │   │   │   ├── $slug.tsx       # Collection list
│   │   │   │   └── $slug/$id.tsx   # Document edit
│   │   │   └── globals/
│   │   │       └── $slug.tsx       # Global edit
│   │   └── api/
│   │       └── [...slug].ts        # REST API catch-all
│   └── auth/
│       ├── login.ts                # Login server function
│       ├── logout.ts               # Logout server function
│       └── refresh.ts              # Token refresh server function
```

**Dependencies:**

- `@tanstack/react-router` — client routing
- `@tanstack/start` — SSR framework
- `vinxi` — build/server tool (peer dep)
- `@payloadcms/ui` — admin UI components
- `payload` — core (peer dep)

#### T2.2: `TanStackRouterAdapter`

Implements `RouterAdapterComponent` using TanStack Router hooks:

```typescript
import { useRouter, useMatch, Link } from '@tanstack/react-router'
import { RouterAdapterContext } from '@payloadcms/ui'

export const TanStackRouterAdapter: RouterAdapterComponent = ({ children }) => {
  const router = useRouter()
  const match = useMatch({ strict: false })

  const adaptedRouter = {
    push: (path, opts) => router.navigate({ to: path, ...opts }),
    replace: (path, opts) => router.navigate({ to: path, replace: true, ...opts }),
    back: () => router.history.back(),
    refresh: () => router.invalidate(),
  }

  return (
    <RouterAdapterContext
      value={{
        Link: TanStackLink,
        params: match.params,
        pathname: match.pathname,
        router: adaptedRouter,
        searchParams: new URLSearchParams(match.search),
      }}
    >
      {children}
    </RouterAdapterContext>
  )
}
```

#### T2.3: `initReq` for TanStack Start

TanStack Start runs on Vinxi/Nitro. Server-side request access uses `getWebRequest()`:

```typescript
import { getWebRequest } from 'vinxi/http'
import {
  createLocalReq,
  executeAuthStrategies,
  parseCookies,
  getPayload,
} from 'payload'

export async function initReq({ configPromise, importMap }) {
  const webRequest = getWebRequest()
  const headers = new Headers(webRequest.headers)
  const cookies = parseCookies(headers)

  const config = await configPromise
  const payload = await getPayload({ config, importMap })

  const { responseHeaders, user } = await executeAuthStrategies({
    headers,
    payload,
  })

  const req = await createLocalReq(
    { req: { headers, user, responseHeaders } },
    payload,
  )
  // ... locale, permissions, i18n setup (same as Next.js adapter)

  return { cookies, headers, locale, permissions, req }
}
```

#### T2.4: `ServerAdapter` implementation

```typescript
import { getWebRequest } from 'vinxi/http'
import { setCookie } from 'vinxi/http'

export const tanstackServerAdapter: ServerAdapter = {
  getCookies: () => {
    const request = getWebRequest()
    const headers = new Headers(request.headers)
    return parseCookies(headers)
  },
  getHeaders: () => {
    const request = getWebRequest()
    return new Headers(request.headers)
  },
  redirect: (path) => {
    throw redirect({ to: path })
  },
  notFound: () => {
    throw notFound()
  },
  setCookie: (name, value, options) => {
    setCookie(name, value, options)
  },
}
```

#### T2.5: `handleServerFunctions` for TanStack

Uses `createServerFn` from `@tanstack/start` instead of Next.js server actions:

```typescript
import { createServerFn } from '@tanstack/start'
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'
import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'

const serverFunctions = {
  ...sharedServerFunctions,
  // TanStack-specific handlers that return data-only responses
  'render-document': renderDocumentDataOnlyHandler,
  'render-list': renderListDataOnlyHandler,
  // etc.
}

export const callServerFunction = createServerFn({ method: 'POST' })
  .validator((args: { name: string; args: Record<string, unknown> }) => args)
  .handler(async ({ data }) => {
    const { name, args } = data
    const { req, cookies, locale, permissions } = await initReq({ ... })

    const fn = serverFunctions[name]
    return fn({
      ...args,
      cookies,
      locale,
      permissions,
      renderComponent: RenderClientComponent,
      req,
    })
  })
```

The client-side `serverFunction` prop passed to `RootProvider`:

```typescript
const serverFunction: ServerFunctionClient = async ({ name, args }) => {
  return callServerFunction({ data: { name, args } })
}
```

#### T2.6: Auth server functions

Replace Next.js server actions with TanStack Start server functions:

```typescript
// src/auth/login.ts
import { createServerFn } from '@tanstack/start'

export const loginServerFn = createServerFn({ method: 'POST' })
  .validator((args: { collection: string; data: Record<string, unknown> }) => args)
  .handler(async ({ data }) => {
    const { collection, data: loginData } = data
    const payload = await getPayload({ config })
    const result = await payload.login({ collection, data: loginData })
    // Set auth cookie via Vinxi
    setCookie(`${payload.config.cookiePrefix}-token`, result.token, { ... })
    return result
  })
```

#### T2.7: `switchLanguageServerFn`

```typescript
export const switchLanguageServerFn = createServerFn({ method: 'POST' })
  .validator((lang: string) => lang)
  .handler(async ({ data: lang }) => {
    const config = await configPromise
    setCookie(`${config.cookiePrefix || 'payload'}-lng`, lang, { path: '/' })
  })
```

---

### Phase T3: Route Definitions (Admin Panel)

Each TanStack route mirrors a Next.js view but uses loaders instead of RSC.

#### T3.1: Admin layout route (root data loader)

This replaces the massive `RootPage` RSC. The layout route loader handles auth, config, locale, permissions — data that every child route needs.

```typescript
// routes/admin/route.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getRouteInitData } from '@payloadcms/ui/views/Root/getRouteInitData'

export const Route = createFileRoute('/admin')({
  loader: async ({ context, location }) => {
    const { req, permissions, locale, clientConfig, ... } = await getRouteInitData({
      configPromise: context.config,
      importMap: context.importMap,
      currentRoute: location.pathname,
      searchParams: location.search,
    })
    return { permissions, locale, clientConfig, user: req.user, ... }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const data = Route.useLoaderData()
  return (
    <RootProvider
      config={data.clientConfig}
      permissions={data.permissions}
      RouterAdapter={TanStackRouterAdapter}
      serverFunction={serverFunction}
      switchLanguageServerAction={switchLanguageAction}
      // ... other props from loader data
    >
      <Outlet />
    </RootProvider>
  )
}
```

#### T3.2: Dashboard route

```typescript
// routes/admin/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getDashboardData } from '@payloadcms/ui/views/Dashboard/getDashboardData'
import { DashboardClient } from '@payloadcms/ui/views/Dashboard'

export const Route = createFileRoute('/admin/')({
  loader: async ({ context }) => getDashboardData(context),
  component: () => {
    const data = Route.useLoaderData()
    return <DashboardClient {...data} />
  },
})
```

#### T3.3: Document edit route

```typescript
// routes/admin/collections/$slug/$id.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getDocumentViewData } from '@payloadcms/ui/views/Document/getDocumentViewData'
import { DocumentClient } from '@payloadcms/ui/views/Document'

export const Route = createFileRoute('/admin/collections/$slug/$id')({
  loader: async ({ params, context }) => {
    return getDocumentViewData({
      collectionSlug: params.slug,
      id: params.id,
      req: context.req,
    })
  },
  component: () => {
    const data = Route.useLoaderData()
    return <DocumentClient {...data} />
  },
})
```

#### T3.4: Collection list route

```typescript
// routes/admin/collections/$slug.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getListViewData } from '@payloadcms/ui/views/List/getListViewData'
import { DefaultListView } from '@payloadcms/ui'

export const Route = createFileRoute('/admin/collections/$slug')({
  loader: async ({ params, context, location }) => {
    return getListViewData({
      collectionSlug: params.slug,
      req: context.req,
      query: location.search,
    })
  },
  component: () => {
    const data = Route.useLoaderData()
    return <DefaultListView {...data} />
  },
})
```

#### T3.5: Auth routes (login, logout, create-first-user, forgot-password, reset-password, verify)

Each follows the same loader + client component pattern. Login example:

```typescript
// routes/admin/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getLoginViewData } from '@payloadcms/ui/views/Login/getLoginViewData'
import { LoginForm } from '@payloadcms/ui/views/Login/LoginForm'
import { LogoClient } from '@payloadcms/ui/elements/Logo'

export const Route = createFileRoute('/admin/login')({
  loader: async ({ context }) => {
    const data = await getLoginViewData(context)
    if (data.user) {
      throw redirect({ to: data.redirectUrl })
    }
    return data
  },
  component: () => {
    const data = Route.useLoaderData()
    return (
      <>
        <div className="login__brand"><LogoClient /></div>
        <LoginForm
          prefillEmail={data.prefillEmail}
          prefillPassword={data.prefillPassword}
          prefillUsername={data.prefillUsername}
          searchParams={data.searchParams}
        />
      </>
    )
  },
})
```

#### T3.6: API routes

REST and GraphQL endpoints use Vinxi/Nitro API routes:

```typescript
// api/[...slug].ts (Vinxi API route)
import { handleEndpoints } from 'payload'

export default defineEventHandler(async (event) => {
  const payload = await getPayload({ config })
  return handleEndpoints({ event, payload })
})
```

---

### Phase T4: Custom Component Rendering Strategy

TanStack Start cannot use RSC, so custom `PayloadComponent` slots (nav items, dashboard widgets, document header actions, etc.) must render via `RenderClientComponent`.

#### T4.1: Adapter-level `ComponentRenderer`

```typescript
import { RenderClientComponent } from '@payloadcms/ui/elements/RenderServerComponent/clientOnly'

// The TanStack adapter's ComponentRenderer is simply RenderClientComponent
export const TanStackComponentRenderer: ComponentRenderer = (args) => {
  return RenderClientComponent(args)
}
```

This means all custom components in a TanStack-based Payload app **must** be client components (or regular React components). They cannot be async server components. This is an explicit, documented trade-off.

#### T4.2: Custom slot pre-rendering in loaders

For views that have custom component slots (nav `beforeNav`/`afterNav`, dashboard custom view, document header actions), the adapter's route loader resolves which components to render and passes their import map references as data. The client component then uses `RenderClientComponent` to render them:

```typescript
// In route loader
const navSlots = {
  beforeNavComponent: config.admin?.components?.beforeNav,
  afterNavComponent: config.admin?.components?.afterNav,
}
return { ...navData, navSlots }

// In client component
<RenderClientComponent
  Component={navSlots.beforeNavComponent}
  importMap={importMap}
/>
```

---

### Phase T5: HMR / Dev Reload Strategy

#### T5.1: Vinxi HMR strategy

```typescript
export const vinxiDevReloadStrategy: DevReloadStrategy = {
  connect: (onReload) => {
    // Vinxi/Vite uses HMR over WebSocket at /__vite_hmr or similar
    const ws = new WebSocket(`ws://localhost:${port}/__vite_hmr`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'full-reload') {
        onReload()
      }
    }
    return () => ws.close()
  },
}
```

---

### Phase T6: Import Map Generation

#### T6.1: Adapter-specific import map path

The import map generator already supports custom `candidateDirectories`. The TanStack adapter provides its output path:

```typescript
// In TanStack Start adapter config
export function getImportMapPath() {
  return path.resolve(process.cwd(), 'app', 'payload-import-map.ts')
}
```

#### T6.2: Import map component constraint

Since TanStack Start has no RSC, **all components in the import map must be client-safe**. The import map generator should emit a warning if a component is detected as async (server-only) when the target framework is not RSC-capable.

---

### Phase T7: Metadata / Head Management

Next.js uses `export const metadata` and `generateMetadata()`. TanStack Start uses route-level `meta` functions or a head management library.

```typescript
// Route-level meta
export const Route = createFileRoute('/admin/collections/$slug')({
  meta: ({ loaderData }) => [
    { title: `${loaderData.collectionLabel} | Payload Admin` },
    { name: 'description', content: loaderData.description },
  ],
  // ...
})
```

The `AdminMeta` type in `packages/payload` is already framework-agnostic. Each adapter maps it to its framework's head management pattern.

---

## Testing Plan

### T-Test-1: Test infrastructure setup

**File:** `test/adapters/tanstackStartDevServer.ts`

```typescript
import { createApp } from 'vinxi'

export async function startTanStackDevServer({
  port,
  testSuiteArg,
}: {
  port: number
  testSuiteArg: string
}): Promise<DevServerResult> {
  // 1. Resolve test config
  // 2. Generate TanStack Start app config
  // 3. Start Vinxi dev server
  // 4. Return { adminRoute, port, rootDir }
}
```

**File:** `test/dev.ts` — add case to the framework switch:

```typescript
case 'tanstack-start': {
  const { startTanStackDevServer } = await import('./adapters/tanstackStartDevServer.js')
  serverResult = await startTanStackDevServer({ port: availablePort, testSuiteArg })
  break
}
```

### T-Test-2: Integration tests (Local API)

Integration tests (`test/*/int.spec.ts`) use the Payload Local API directly and are **already framework-agnostic**. No changes needed. They should pass with `PAYLOAD_FRAMEWORK=tanstack-start`.

### T-Test-3: E2E tests (Playwright)

E2E tests (`test/*/e2e.spec.ts`) interact with the admin UI via browser. The same specs should run against both adapters:

```bash
PAYLOAD_FRAMEWORK=next pnpm run test:e2e fields
PAYLOAD_FRAMEWORK=tanstack-start pnpm run test:e2e fields
```

**Potential issues:**

- Tests that assert Next.js-specific behavior (e.g., checking `/_next/` asset paths) need framework-conditional skips
- Tests that rely on RSC streaming behavior may differ in timing
- Tests that check `<meta>` tags need adapter-specific assertions

**Action:** Audit all E2E tests for framework-specific assertions. Create a test utility:

```typescript
export function isFramework(name: 'next' | 'tanstack-start'): boolean {
  return process.env.PAYLOAD_FRAMEWORK === name
}
```

### T-Test-4: Component tests

Component tests (`test/*/components.spec.ts`) render `packages/ui` components in isolation. Since `packages/ui` is framework-agnostic, these should pass unchanged.

### T-Test-5: Adapter-specific tests

New test suite for TanStack-specific concerns:

```
test/tanstack-adapter/
├── config.ts              # Payload config for adapter tests
├── int.spec.ts            # Server function dispatch, initReq, auth
├── e2e.spec.ts            # Admin panel navigation, login, CRUD
└── routes.spec.ts         # Route loader behavior, redirects
```

Key test scenarios:

1. **Login/logout flow** — server function sets/clears cookies correctly
2. **Document CRUD** — create, read, update, delete via admin UI
3. **List view** — pagination, sorting, filtering, column preferences
4. **Custom components** — custom nav items, dashboard widgets render via `RenderClientComponent`
5. **Locale switching** — language cookie set via server function
6. **Auth redirects** — unauthenticated users redirected to login
7. **Create first user** — initial setup flow works
8. **Live preview** — preview URL generation works
9. **Server functions** — `buildFormState`, `buildTableState` return correct data
10. **HMR** — dev reload triggers on file changes

### T-Test-6: CI matrix

Add `PAYLOAD_FRAMEWORK=tanstack-start` to the CI test matrix:

```yaml
strategy:
  matrix:
    framework: [next, tanstack-start]
    database: [mongodb, postgres]
```

---

## Step-by-Step Implementation Order

### Sprint 1: Prerequisites (Phase T1) — ~2-3 weeks

1. ~~**T1.1** — Refactor `CollectionCards` async component out of `packages/ui`~~ ✅
2. ~~**T1.3** — Extract `getDocumentViewData` from `packages/next/src/views/Document/index.tsx`~~ ✅
3. ~~**T1.3** — Extract `getListViewData` from `packages/next/src/views/List/index.tsx`~~ ✅
4. ~~**T1.3** — Extract `getLoginViewData` from `packages/next/src/views/Login/index.tsx`~~ ✅
5. **T1.5** — Wire `getRootViewData` into `RootPage` (exists but unused)
6. ~~**T1.3** — Extract remaining view data fetchers (Account, Version, Versions)~~ ✅
7. ~~**T1.2** — Implement dual-mode server functions (`rsc` / `data-only`)~~ ✅
8. ~~**T1.4** — Clean up `@payloadcms/ui/rsc` entrypoint~~ ✅
9. **T1.6** — Replace `React.cache()` in 5 `packages/ui` files with framework-agnostic memoization
10. **T1.7** — Make `NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH` configurable via prop

### Sprint 2: Core adapter (Phase T2) — ~2 weeks

1. **T2.1** — Scaffold `packages/tanstack-start` package
2. **T2.2** — Implement `TanStackRouterAdapter`
3. **T2.3** — Implement `initReq` for Vinxi
4. **T2.4** — Implement `ServerAdapter` for Vinxi
5. **T2.5** — Implement `handleServerFunctions` with `createServerFn`
6. **T2.6** — Implement auth server functions (login, logout, refresh)
7. **T2.7** — Implement language switch server function

### Sprint 3: Routes + views (Phase T3) — ~2 weeks

1. **T3.1** — Admin layout route with root data loader
2. **T3.2** — Dashboard route
3. **T3.5** — Auth routes (login, create-first-user, logout, forgot-password, reset-password, verify)
4. **T3.3** — Document edit route
5. **T3.4** — Collection list route
6. **T3.6** — REST/GraphQL API routes
7. Global edit route, Account route, Version/Versions routes

### Sprint 4: Polish + custom components (Phases T4-T7) — ~1 week

1. **T4.1-T4.2** — Custom component rendering strategy
2. **T5.1** — Vinxi HMR dev reload strategy
3. **T6.1-T6.2** — Import map path + validation
4. **T7** — Metadata/head management

### Sprint 5: Testing (Phase T-Test) — ~2 weeks

1. **T-Test-1** — Dev server adapter + test infrastructure
2. **T-Test-5** — Adapter-specific test suite
3. **T-Test-3** — Audit and fix E2E tests for framework-agnostic behavior
4. **T-Test-6** — CI matrix setup
5. End-to-end validation of all test suites with `PAYLOAD_FRAMEWORK=tanstack-start`

---

## Risk Assessment

| Risk                                                                         | Impact                       | Mitigation                                                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Phase T1 (RSC elimination) takes longer than expected                        | Blocks everything            | Prioritize the three most complex views (Document, List, Root) first; others can follow incrementally               |
| TanStack Start API instability                                               | May require rework           | Pin to a stable release; abstract Vinxi internals behind adapter utilities                                          |
| Performance regression (more client JS without RSC)                          | User perception              | Accepted trade-off; document clearly. Optimize with code splitting and lazy loading.                                |
| Custom component ecosystem breakage                                          | Plugin authors               | Document that TanStack adapter requires client-safe components; provide migration guide                             |
| `renderTable` / `renderFilters` depend on `RenderServerComponent` internally | Breaks list view in TanStack | Already partially addressed — they accept `renderComponent` param. Verify all code paths use the injected renderer. |
| Server function serialization differences                                    | Data loss or errors          | Comprehensive integration tests for each server function with both adapters                                         |
| Import map components that are async/RSC                                     | Runtime crash in TanStack    | Build-time validation + clear error message                                                                         |

---

## Open Questions

1. **Should `packages/tanstack-start` support TanStack Router (client SPA) in addition to TanStack Start (SSR)?** — A client-only SPA mode could be useful for simpler deployments but would require a different auth strategy (no server-side cookies, use REST API directly).

2. **GraphQL playground** — The current GraphQL playground uses a Next.js route handler. Should the TanStack adapter include a playground, or defer to external tools?

3. **OG image generation** — `packages/next` uses `next/og` (Satori). The TanStack adapter would need an alternative (e.g., `@vercel/og` standalone, or a Nitro route with Satori directly).

4. **Static generation / ISR** — TanStack Start doesn't have Next.js-style ISR. For Payload sites that use static generation, this adapter wouldn't be suitable. Document this limitation.

5. **Middleware** — Next.js middleware runs at the edge before route handlers. TanStack Start uses Nitro middleware. Determine if any Payload functionality depends on Next.js middleware patterns.

6. **`react cache()` usage** — `getNavPrefs` and other functions use `React.cache()` for request-level memoization (RSC feature). In TanStack, use a request-scoped Map on the Vinxi event context instead.
