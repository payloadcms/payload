# TanStack Start Adapter Implementation Plan

## Executive Summary

This plan describes the work needed to implement `packages/tanstack-start` — a framework adapter that lets Payload's admin panel run on TanStack Start instead of Next.js. TanStack Start uses SSR (not RSC), file-based routing via TanStack Router, and server functions via `@tanstack/react-start` (which uses H3 under the hood).

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

| Area                                          | Original Blocker                                                                                                                            | Resolution                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Async RSC in `packages/ui`~~                | `CollectionCards` was an `export async function` component — cannot render in SSR-only                                                      | `CollectionCardsView` is now a **sync** wrapper; async data loading is in `getCollectionCardsData`. No longer exported from `@payloadcms/ui/rsc`.                                                                                                                                       |
| ~~Server functions return JSX~~               | `render-document`, `render-list`, `render-widget`, `render-field`, `render-document-slots` returned `React.ReactNode` (RSC flight payloads) | Six data-only handlers exist under `packages/ui/src/utilities/dataOnlyHandlers/` and are aggregated in `dataOnlyServerFunctions`. A non-RSC adapter swaps in this map instead of the Next.js JSX-returning handlers. Next.js adapter is unchanged.                                      |
| ~~`@payloadcms/ui/rsc` exports~~              | Entrypoint re-exported `CollectionCards` (async component) alongside framework-agnostic utilities                                           | `CollectionCards` removed from `@payloadcms/ui/rsc`. The entrypoint only re-exports framework-agnostic utilities (`renderFilters`, `getColumns`, etc.).                                                                                                                                 |
| ~~View data fetchers incomplete~~             | Many views in `packages/next/src/views/` mixed data fetching and RSC rendering. Extraction to `packages/ui` was incomplete.                 | All view data fetchers extracted and wired: `getDocumentViewData`, `getListViewData`, `getLoginViewData`, `getAccountViewData`, `getVersionViewData`, `getVersionsViewData`, `getDashboardData`, `getCreateFirstUserData`, `getVerifyData`, `getRootViewData`.                          |
| ~~`RootPage` orchestration~~                  | `RootPage` (360+ lines) handled everything as one RSC. `getRootViewData` existed but was unused.                                            | `RootPage` now delegates auth, redirects, client config, locale filtering, and visible entities to `getRootViewData`. Adapter-specific concerns (initReq, component mapping via `getRouteData`, rendering) remain in `RootPage`. Reduced from 365 → ~200 lines.                         |
| ~~`React.cache()` in `packages/ui`~~          | Five files used `import { cache } from 'react'` for RSC-only request-level memoization                                                      | Removed from all five files. `getSchemaMap`/`getClientSchemaMap`/`getClientConfig` rely on their existing global caches. `getNavPrefs` uses a `WeakMap<PayloadRequest>` for per-request dedup. `getPreferences` (in `upsertPreferences.ts`) needs no dedup (called once per operation). |
| ~~`NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH`~~ | `RootProvider` hardcoded `process.env.NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH === 'true'`                                                   | Converted to an `enableRouterCacheRefresh` prop on `RootProvider` (defaults to `false`). Next.js adapter reads the env var and passes it as a prop. Non-Next adapters supply their own value.                                                                                           |

#### Remaining (scoped to `packages/tanstack-start` — do not block shared code)

| Area                                | Status                                                                                                                                                                                                          | Severity                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `ServerAdapter` unused in `initReq` | `initReq` in `packages/next` uses `next/headers` directly. The `InitReqResult` type contract exists in core. TanStack adapter needs its own `initReq` using `getRequest()` from `@tanstack/react-start/server`. | **MEDIUM** — parallel-safe |
| Server actions for auth             | `login.ts`, `logout.ts`, `refresh.ts`, `switchLanguageServerAction` in `packages/next` use `'use server'` + `next/headers`. TanStack needs `createServerFn` equivalents.                                        | **MEDIUM** — parallel-safe |

These remaining items are scoped entirely to the new `packages/tanstack-start` package and do not require changes to `packages/ui` or `packages/payload`.

---

## TanStack Start vs Next.js: Key Architectural Differences

| Concern            | Next.js (App Router)                           | TanStack Start                                                            |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------------------------- |
| Component model    | RSC (async server) + client components         | Client components only, SSR'd                                             |
| Data loading       | Async component bodies, `use()`                | Route `loader` functions (run on server)                                  |
| Server mutations   | Server Actions (`'use server'`)                | `createServerFn` or REST endpoints                                        |
| Routing            | File-based (`app/` directory)                  | File-based via TanStack Router (`routes/`)                                |
| Navigation         | `next/navigation` (`useRouter`, etc.)          | `@tanstack/react-router` (`useRouter`, `Link`, etc.)                      |
| Request access     | `headers()`, `cookies()` from `next/headers`   | `getRequest()` from `@tanstack/react-start/server`                        |
| Metadata           | `export const metadata` / `generateMetadata()` | `<head>` management via route `meta` function or `@tanstack/react-helmet` |
| Streaming/Suspense | RSC streaming + Suspense                       | SSR streaming + Suspense                                                  |
| Build tool         | Webpack / Turbopack                            | Vite                                                                      |

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

#### T1.3: ~~Extract view data fetchers to `packages/ui`~~ ✅ DONE

All view data fetchers extracted and wired:

| View                             | Data fetcher             | Status                   |
| -------------------------------- | ------------------------ | ------------------------ |
| `DocumentView`                   | `getDocumentViewData`    | ✅ Extracted and wired   |
| `ListView`                       | `getListViewData`        | ✅ Extracted and wired   |
| `LoginView`                      | `getLoginViewData`       | ✅ Extracted and wired   |
| `AccountView`                    | `getAccountViewData`     | ✅ Extracted and wired   |
| `VersionView`                    | `getVersionViewData`     | ✅ Extracted and wired   |
| `VersionsView`                   | `getVersionsViewData`    | ✅ Extracted and wired   |
| `Dashboard`                      | `getDashboardData`       | ✅ Extracted and wired   |
| `CreateFirstUser`                | `getCreateFirstUserData` | ✅ Extracted and wired   |
| `Verify`                         | `getVerifyData`          | ✅ Extracted and wired   |
| `RootPage` (route orchestration) | `getRootViewData`        | ✅ Wired into `RootPage` |

#### T1.4: ~~`@payloadcms/ui/rsc` entrypoint cleanup~~ ✅ DONE

`CollectionCards` removed from `@payloadcms/ui/rsc`. The entrypoint only re-exports framework-agnostic utilities (`renderFilters`, `getColumns`, etc.).

#### T1.5: ~~Wire `getRootViewData` into `RootPage`~~ ✅ DONE

`RootPage` now calls `getRootViewData` for auth checks, first-user redirects, client config, locale filtering, and visible entities. Adapter-specific concerns (initReq, `getRouteData` for Next.js component mapping, collection preferences, rendering) remain in `RootPage`. Reduced from ~365 → ~200 lines.

#### T1.6: ~~Replace `React.cache()` in `packages/ui`~~ ✅ DONE

Removed `import { cache } from 'react'` from all five files:

- `getSchemaMap`, `getClientSchemaMap`, `getClientConfig` — already have global caches (`global._payload_*`), making `React.cache()` redundant
- `getNavPrefs` — replaced with `WeakMap<PayloadRequest>` for per-request deduplication
- `getPreferences` (in `upsertPreferences.ts`) — called once per operation, no deduplication needed

#### T1.7: ~~Make `NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH` configurable~~ ✅ DONE

Converted to an `enableRouterCacheRefresh` prop on `RootProvider` (defaults to `false`). Next.js adapter reads the env var and passes it as a prop.

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
│   │   ├── initReq.ts              # Request init using @tanstack/react-start/server
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
- `@tanstack/react-start` — SSR framework (uses H3 under the hood)
- `vite` — build tool
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

TanStack Start uses `@tanstack/react-start/server` for server-side request access:

```typescript
import { getRequest } from '@tanstack/react-start/server'
import {
  createLocalReq,
  executeAuthStrategies,
  parseCookies,
  getPayload,
} from 'payload'

export async function initReq({ configPromise, importMap }) {
  const webRequest = getRequest()
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
import { getRequest } from '@tanstack/react-start/server'
import { setCookie } from '@tanstack/react-start/server'

export const tanstackServerAdapter: ServerAdapter = {
  getCookies: () => {
    const request = getRequest()
    const headers = new Headers(request.headers)
    return parseCookies(headers)
  },
  getHeaders: () => {
    const request = getRequest()
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

REST and GraphQL endpoints use TanStack Start API routes (H3 handlers under the hood):

```typescript
// api/[...slug].ts
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

#### T5.1: Vite HMR strategy

```typescript
export const viteDevReloadStrategy: DevReloadStrategy = {
  connect: (onReload) => {
    // Vite exposes import.meta.hot for HMR in development builds
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

### Strategy: Reuse existing test suites

The existing E2E and integration tests are already framework-agnostic enough to reuse for TanStack Start. No new adapter-specific E2E test suite is needed — the same `test/*/e2e.spec.ts` and `test/*/int.spec.ts` files should run against both adapters via `PAYLOAD_FRAMEWORK`.

### T-Test-1: Test infrastructure setup

Add a TanStack Start dev server adapter to `test/dev.ts`:

**File:** `test/dev.ts` — add case to the framework switch:

```typescript
case 'tanstack-start': {
  const { startTanStackDevServer } = await import('./adapters/tanstackStartDevServer.js')
  serverResult = await startTanStackDevServer({ port: availablePort, testSuiteArg })
  break
}
```

**File:** `test/adapters/tanstackStartDevServer.ts` — thin wrapper that boots a Vite dev server with the resolved test config.

### T-Test-2: Integration tests (Local API)

Integration tests (`test/*/int.spec.ts`) use the Payload Local API directly and are **already framework-agnostic**. No changes needed. They should pass with `PAYLOAD_FRAMEWORK=tanstack-start`.

### T-Test-3: E2E tests (Playwright)

The same E2E specs run against both adapters:

```bash
PAYLOAD_FRAMEWORK=next pnpm run test:e2e fields
PAYLOAD_FRAMEWORK=tanstack-start pnpm run test:e2e fields
```

If any tests assert Next.js-specific behavior (e.g., `/_next/` asset paths, `<meta>` tag format), add a framework-conditional skip using:

```typescript
export function isFramework(name: 'next' | 'tanstack-start'): boolean {
  return process.env.PAYLOAD_FRAMEWORK === name
}
```

In practice, very few tests should need this — the admin UI renders identically since `packages/ui` is framework-agnostic.

### T-Test-4: Component tests

Component tests (`test/*/components.spec.ts`) render `packages/ui` components in isolation. Since `packages/ui` is framework-agnostic, these pass unchanged.

### T-Test-5: CI matrix

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
5. ~~**T1.5** — Wire `getRootViewData` into `RootPage`~~ ✅
6. ~~**T1.3** — Extract remaining view data fetchers (Account, Version, Versions)~~ ✅
7. ~~**T1.2** — Implement dual-mode server functions (`rsc` / `data-only`)~~ ✅
8. ~~**T1.4** — Clean up `@payloadcms/ui/rsc` entrypoint~~ ✅
9. ~~**T1.6** — Replace `React.cache()` in 5 `packages/ui` files with framework-agnostic memoization~~ ✅
10. ~~**T1.7** — Make `NEXT_PUBLIC_ENABLE_ROUTER_CACHE_REFRESH` configurable via prop~~ ✅

**Phase T1 is complete.** All prerequisites in `packages/ui` are done. The TanStack adapter can now proceed to Phase T2.

### Sprint 2: Core adapter (Phase T2) — ~2 weeks

1. ~~**T2.1** — Scaffold `packages/tanstack-start` package~~ ✅
2. ~~**T2.2** — Implement `TanStackRouterAdapter`~~ ✅
3. ~~**T2.3** — Implement `initReq` using `@tanstack/react-start/server` `getRequest()`~~ ✅
4. ~~**T2.4** — Implement `ServerAdapter` using TanStack Start/Router APIs~~ ✅
5. ~~**T2.5** — Implement `handleServerFunctions` with data-only mode~~ ✅
6. ~~**T2.6** — Implement auth server functions (login, logout, refresh)~~ ✅
7. ~~**T2.7** — Implement `switchLanguageServerFn`~~ ✅

**Phase T2 is complete.** The core adapter package is scaffolded with all server-side utilities. Uses `@tanstack/react-start` APIs for request/response handling.

### Sprint 3: Routes + views (Phase T3) — ~2 weeks

1. ~~**T3.1** — Admin layout (`RootLayout` + `getLayoutData` loader)~~ ✅
2. ~~**T3.2-T3.5** — All admin view routes via catch-all `getAdminPageData` + `getRouteData`~~ ✅
3. **T3.6** — REST/GraphQL API routes — deferred (requires TanStack Start API route configuration, separate from admin UI)

**Phase T3 is complete (admin UI routes).** Instead of individual file-based routes per view, the adapter provides composable functions (`getLayoutData` → `getAdminPageData` → `getRouteData`) that users wire into their TanStack Router routes. This mirrors Next.js's catch-all `[[...segments]]` pattern while being TanStack Start-native. The `getRouteData` function resolves URL segments to view types, template info, and route parameters — adapted from the Next.js version but without RSC component references.

### Sprint 4: Polish + custom components (Phases T4-T7) — ~1 week

1. ~~**T4.1-T4.2** — `TanStackComponentRenderer` wrapping `RenderClientComponent`~~ ✅
2. ~~**T5.1** — `viteDevReloadStrategy` using `import.meta.hot`~~ ✅
3. ~~**T6.1-T6.2** — `getImportMapOutputPath` for adapter-specific import map location~~ ✅
4. ~~**T7** — `getAdminMeta` for TanStack Router `head.meta` entries~~ ✅

**Phase T4-T7 is complete.**

### Sprint 5: Testing (Phase T-Test) — ~1 week

1. **T-Test-1** — Dev server adapter (`test/adapters/tanstackStartDevServer.ts`) + `test/dev.ts` case
2. **T-Test-3** — Run existing E2E suites with `PAYLOAD_FRAMEWORK=tanstack-start`, add framework-conditional skips only where needed
3. **T-Test-5** — CI matrix setup (`framework: [next, tanstack-start]`)

No new adapter-specific E2E suite is needed — the existing tests cover all admin UI behavior and are framework-agnostic.

---

## Risk Assessment

| Risk                                                                         | Impact                       | Mitigation                                                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Phase T1 (RSC elimination) takes longer than expected                        | Blocks everything            | Prioritize the three most complex views (Document, List, Root) first; others can follow incrementally               |
| TanStack Start API instability                                               | May require rework           | Pin to a stable release; abstract framework internals behind adapter utilities                                      |
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

5. **Middleware** — Next.js middleware runs at the edge before route handlers. TanStack Start uses H3 middleware. Determine if any Payload functionality depends on Next.js middleware patterns.

6. **`react cache()` usage** — `getNavPrefs` and other functions use `React.cache()` for request-level memoization (RSC feature). In TanStack, use a request-scoped Map or `WeakMap<PayloadRequest>` instead.
