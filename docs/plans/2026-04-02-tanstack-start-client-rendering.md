# TanStack Start: Serializable Page State + Client Rendering

## Goal

Fix the isomorphic rendering problem in TanStack Start by replacing `renderRootPage` (RSC, returns React nodes) with a serializable page state server function + a client-only component tree.

**Constraint:** Next.js is untouched. It keeps full RSC support. TanStack Start is its own independent rendering path.

---

## Problem

TanStack Start v1.167 is isomorphic by default — route components execute on both server (SSR) and client (hydration). `RootPage` is an async function that imports `renderRootPage`, which transitively imports server-only modules (mongoose, pino, util, sharp, etc.). These get bundled for the client.

The current `serverOnlyStubPlugin` stubs these out, but each new missing export requires a manual addition. It's a maintenance leak, not a fix.

---

## Design

### Rendering model

**Next.js:** RSC-first. `renderRootPage` returns `React.ReactNode`. Server components render server-only code. Unchanged.

**TanStack Start:**

- Loader runs server-side → `getPageState` server function → serializable data only
- `TanStackAdminPage` is a `'use client'` component — no server-only imports anywhere in the component tree
- View components (DashboardView, ListView, DocumentView, etc.) mount client-side and fetch their data via `buildFormState` / `buildTableState` / other server functions
- SSR output: template shell + loading skeleton. View content loads after hydration.

This is intentional. Payload admin is behind auth — SEO doesn't matter. The auth/permissions security boundary is maintained by the server-side loader.

---

## Components

### 1. `getPageState` server function

**File:** `packages/tanstack-start/src/views/Root/getPageState.ts`

Calls `initReq` then `getRouteData`. Handles auth redirects and notFound. Returns:

```typescript
type SerializablePageState = {
  viewType: ViewTypes | undefined
  templateType: 'default' | 'minimal' | undefined
  templateClassName: string
  routeParams: {
    collection?: string
    folderCollection?: string
    folderID?: number | string
    global?: string
    id?: number | string
    token?: string
    versionID?: number | string
  }
  documentSubViewType?: DocumentSubViewTypes
  browseByFolderSlugs: string[]
  clientConfig: ClientConfig // already serializable
  permissions: Permissions // already serializable
  locale?: Locale // already serializable
  viewActions?: PayloadComponent[] // serializable; React.FC actions omitted
  customViewPath?: string // path string for custom views, resolved via importMap
}
```

`DefaultView.Component` (a React function) is discarded. The client derives the component from `viewType` via a fixed registry. Custom views use `customViewPath` (the `PayloadComponent` path string) resolved via `importMap` on the client.

### 2. Updated route loader

**File:** `tanstack-app/app/routes/admin.$.tsx`

```typescript
export const Route = createFileRoute('/admin/$')({
  loader: async ({ params }) => {
    const segments = params._splat?.split('/').filter(Boolean) ?? []
    return getPageState({ data: { segments } })
    // redirects and notFound thrown inside getPageState
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

The inline auth checks and `<RootPage>` are removed entirely.

### 3. `TanStackAdminPage` client component

**File:** `packages/tanstack-start/src/views/Root/TanStackAdminPage.tsx`

```
'use client'
```

Receives `pageState + importMap`. Responsibilities:

1. Wrap in `<PageConfigProvider config={pageState.clientConfig}>`
2. Map `viewType` → built-in view component via a local registry; custom views via `importMap`
3. Render `<DefaultTemplate>` or `<MinimalTemplate>` with client-safe props only (no `req`, no `payload`, no `i18n` object)
4. Pass `clientConfig`, `permissions`, `routeParams`, `searchParams`, `locale`, `documentSubViewType`, `browseByFolderSlugs` as client props to the view

**View props type:**

```typescript
type TanStackViewProps = {
  clientConfig: ClientConfig
  permissions: Permissions
  routeParams: SerializablePageState['routeParams']
  searchParams: Record<string, string | string[]>
  locale?: Locale
  documentSubViewType?: DocumentSubViewTypes
  browseByFolderSlugs: string[]
  viewType: ViewTypes
  importMap: ImportMap
}
```

### 4. `render-document` / `render-list` in TanStack Start

These server functions return `React.ReactNode` — not serializable. TanStack Start's `handleServerFunctions` intercepts them:

```typescript
const TANSTACK_UNSUPPORTED_FNS = new Set(['render-document', 'render-list'])

export const handleServerFunctions: ServerFunctionHandler = async (args) => {
  if (TANSTACK_UNSUPPORTED_FNS.has(args.name)) {
    return { __tanstack_invalidate: true }
  }
  // ...existing dispatch logic
}
```

`TanStackRouterProvider` (or a wrapper) intercepts `__tanstack_invalidate: true` responses and calls `router.invalidate()`, triggering a full loader re-run. This is the TanStack-native pattern for refreshing route data.

### 5. Remove `serverOnlyStubPlugin`

Once `TanStackAdminPage` has no server-only imports, `serverOnlyStubPlugin` in `tanstack-app/vite.config.ts` can be removed. The `tanstackStartCompatPlugin` for the virtual module shim stays.

---

## What does NOT change

- `packages/next` — zero modifications
- `packages/ui` — zero modifications (existing views, templates, utilities all stay)
- `renderRootPage` — stays, used by Next.js only
- `baseServerFunctions` dispatcher — stays; TanStack Start overrides only `render-document`/`render-list`
- All REST API routes, auth, collections, globals — unchanged

---

## Trade-offs

|                            | Next.js                | TanStack Start                     |
| -------------------------- | ---------------------- | ---------------------------------- |
| SSR content                | Full view pre-rendered | Shell + skeleton                   |
| Server-only deps in bundle | None (RSC)             | None (client component)            |
| Client-side navigation     | RSC re-render          | Loader re-run + client mount       |
| View data fetch            | Server (RSC)           | Client (server functions on mount) |
| Stub maintenance           | N/A                    | None needed                        |

---

## Testing

**Integration** (`test/admin-adapter/tanstack-start.int.spec.ts`):

- `getPageState` returns a plain serializable object for each `viewType`
- `render-document` / `render-list` return `{ __tanstack_invalidate: true }`
- All other server functions dispatch normally

**E2E** (`test/admin-adapter/tanstack-start.e2e.spec.ts`):

- Dashboard, list view, document view render without server-only errors in browser console
- Client-side navigation between routes works
- Document save triggers route invalidation
- Next.js e2e suite: no regressions
