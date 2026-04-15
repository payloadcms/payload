# Decoupling Payload Admin Panel from Next.js: Framework Adapter Pattern

## Key Architectural Constraint: No RSC in `packages/ui`

**Every component in `packages/ui` must be a regular React component (client component), never an async React Server Component.** This is the adapter abstraction boundary. RSC is a framework-specific rendering model (Next.js); other frameworks (TanStack Start, Remix, etc.) use SSR with different data-loading primitives.

For any view that needs server-side data:

1. **Data fetcher function** -- exported from `packages/ui` (or a shared entrypoint). A plain `async` function that takes a `PayloadRequest` (or similar args) and returns serializable data. Framework-agnostic.
2. **Client component** -- in `packages/ui`. A regular React component that receives pre-fetched data as props and renders the UI.
3. **Framework composer** -- in the adapter package (`packages/next`, `packages/tanstack-start`). The adapter calls the data fetcher on the server and passes the result to the client component using framework-native patterns:
   - **Next.js**: An async RSC in `packages/next` that `await`s the data fetcher and renders the client component with the data as props.
   - **TanStack Start**: A route loader that calls the data fetcher, then the route component renders the client component with loader data.

```
┌──────────────────────────────────────────────────────────────┐
│  packages/ui (framework-agnostic)                            │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │ Data Fetcher (async) │  │ Client Component (React FC)  │  │
│  │ getNavData(req)      │  │ DefaultNavClient({ data })   │  │
│  │ getDashboardData()   │  │ DashboardClient({ data })    │  │
│  │ getDocumentData()    │  │ DocumentClient({ data })     │  │
│  └──────────┬───────────┘  └──────────────▲───────────────┘  │
│             │                             │                  │
└─────────────┼─────────────────────────────┼──────────────────┘
              │                             │
   ┌──────────┼─────────────────────────────┼──────────────────┐
   │  Adapter  │    (framework-specific)     │                  │
   │          ▼                             │                  │
   │  ┌─────────────────────────────────────┴───────────────┐  │
   │  │ Framework Composer                                  │  │
   │  │ Next.js: async RSC → await getData → <Client />     │  │
   │  │ TanStack: loader → getData → route component → <C/> │  │
   │  └─────────────────────────────────────────────────────┘  │
   └───────────────────────────────────────────────────────────┘
```

This pattern means `packages/ui` has zero dependency on RSC runtime behavior (`$$typeof` checks, async components, `server-only`, React flight protocol). Any framework can use the data fetchers and client components with its own server-side rendering strategy.

---

## Current Architecture Summary

Today, Payload's admin panel is tightly coupled to Next.js through several mechanisms:

- **`packages/ui`** ~~has `next` as a `peerDependency` and imports `next/navigation.js` (~35 files), `next/link.js` (2 files), and `next/dist/*` types (3 files)~~ **DONE** -- all `next/*` imports removed, `next` removed from `peerDependencies`
- **`packages/next`** is a ~~monolithic~~ package ~~mixing Next.js plumbing with admin UI orchestration~~ that has been partially restructured as an adapter, but still contains view orchestration logic that should be split into data fetchers + client components
- **Server functions** (`handleServerFunctions`) are invoked via Next.js server actions -- the handler **registry** has been extracted to a shared location
- ~~**`RenderServerComponent`** in `packages/ui` relies on `isReactServerComponentOrFunction`~~ -- a `ComponentRenderer` type is defined and `RenderClientComponent` exists for non-RSC frameworks, but `RenderServerComponent` in `packages/ui` still uses the RSC `$$typeof` check
- ~~**`packages/payload/src/config/types.ts`** imports `Metadata` from `next`~~ **DONE** -- replaced with `AdminMeta`
- The `@payloadcms/ui/rsc` entrypoint still exports async server components and server-only utilities that violate the "no RSC in `packages/ui`" constraint
- Several server function handlers (`render-document`, `render-list`) return **React nodes** (RSC-serialized JSX), which fundamentally requires RSC flight protocol support

---

## Completed Work

### Phase 1: Define the Framework Adapter Contract -- COMPLETED

All adapter types defined in `packages/payload/src/admin/adapters.ts`:

- `RouterAdapterComponent` -- wraps children, populates `RouterAdapterContext`
- `RouterAdapterRouter` -- `{ push, replace, back, refresh }`
- `LinkAdapterProps` -- framework-agnostic link props
- `ServerAdapter` -- `{ getCookies, getHeaders, redirect, notFound, setCookie }`
- `CookieStore`, `CookieOptions` -- cookie abstraction types
- `ComponentRenderer` -- pluggable component renderer signature
- `DevReloadStrategy`, `DevReloadCleanup` -- HMR abstraction

Adapter wiring remains at the app entry level (user's `layout.tsx` / route definitions), not in the Payload config.

### Phase 2: Make `packages/ui` Framework-Agnostic (Router/Navigation) -- COMPLETED

- All ~35 `next/navigation.js` imports replaced with `RouterAdapter` hooks from `packages/ui/src/providers/RouterAdapter`
- All `next/link.js` imports replaced with `PayloadLink` (uses `Link` from `RouterAdapterContext`)
- All `next/dist/*` type imports replaced with Payload-owned types
- `next` removed from `packages/ui/package.json` `peerDependencies`
- `NextRouterAdapter` created in `packages/next/src/elements/RouterAdapter/index.tsx` wiring Next.js hooks into the context

### Phase 3: Restructure `packages/next` (Partial) -- PARTIALLY COMPLETED

**Completed:**

- 3.1: Framework-agnostic route resolution extracted to `packages/ui` (`getRouteData`, `getCustomViewByRoute`, `handleAuthRedirect`, `isPublicAdminRoute`, `isCustomAdminView`, etc.)
- 3.2: UI elements moved from `packages/next` to `packages/ui`: `Nav`, `DocumentHeader`, `Logo`, `FormHeader`, `Default` template, `Minimal` template, auth views, API views, Account sub-components, Version/Versions client components, NotFound client component
- 3.4: Server function handler registry extracted to shared location
- `packages/next/src/elements/` now contains thin re-exports back to `@payloadcms/ui`

**Remaining:** Phase 3.3 (view splitting) -- see Phase 4 below.

### Phase 5: Import Map Generation -- COMPLETED

Import map file path resolution abstracted for framework adapters. The import map object structure is framework-agnostic; each adapter specifies its output path.

### Phase 6: Remove All Next.js Dependencies from `packages/payload` -- COMPLETED

- 6.1: `import type { Metadata } from 'next'` replaced with `AdminMeta` type in `packages/payload/src/config/types.ts`
- 6.2: `@next/env` replaced with `dotenv` + `dotenv-expand` in `packages/payload/src/bin/loadEnv.ts`
- 6.3: HMR WebSocket abstracted into pluggable `DevReloadStrategy` interface. `getPayload` accepts optional `devReloadStrategy` parameter. Default still uses Next.js `/_next/webpack-hmr` for backward compatibility.

### Phase 7: Testing (Partial) -- PARTIALLY COMPLETED

- `test/dev.ts` abstracted with `PAYLOAD_FRAMEWORK` env variable and `switch` dispatch
- Only the `next` adapter is implemented (`test/adapters/nextDevServer.ts`)

---

## Remaining Work

### Phase 4: Eliminate RSC from `packages/ui` (Data-First Pattern)

**Complexity: HIGH** -- This is the critical remaining work. Several components in `packages/ui` are currently async RSC that fetch data and render. They must be decomposed into data fetchers + client components.

#### 4.1 Async components to refactor

Each async component currently in `packages/ui` violates the "no RSC" constraint. For each one, extract a data fetcher function and reduce the component to a client component:

**`DefaultNav`** (`packages/ui/src/elements/Nav/index.tsx`):

- Currently: async component that `await`s `getNavPrefs(req)`, builds nav groups, calls `RenderServerComponent` for custom slots, renders `DefaultNavClient`
- Data fetcher: `getNavData(req)` → returns `{ groups, navPreferences, renderedSlots? }` (slot rendering must also be handled by the adapter, not inline)
- Client component: `DefaultNavClient` already exists, extend it to accept the full data shape
- Next.js adapter: async RSC in `packages/next` that calls `getNavData()` and renders `<DefaultNavClient />`

**`DashboardView`** (`packages/ui/src/views/Dashboard/index.tsx`):

- Currently: async component that `await`s `getGlobalData(req)`, calls `RenderServerComponent` for custom dashboard
- Data fetcher: `getDashboardData(req)` → returns `{ globalData, navGroups }`
- Client component: `DashboardClient` receives data as props
- The custom dashboard component (`config.admin.components.views.dashboard.Component`) rendering must move to the adapter layer

**`ModularDashboard`** (`packages/ui/src/views/Dashboard/Default/ModularDashboard/index.tsx`):

- Currently: async component that `await`s `getItemsFromPreferences` / `getItemsFromConfig`, maps widgets through `RenderServerComponent`
- Data fetcher: `getModularDashboardData(req, config)` → returns `{ layout, clientWidgets }`
- Client component: `ModularDashboardClient` already exists, extend to handle widget rendering via adapter's `ComponentRenderer`
- Widget rendering via `RenderServerComponent` must move to the adapter -- the data fetcher returns widget configs, the adapter renders them

**`CreateFirstUserView`** (`packages/ui/src/views/CreateFirstUser/index.tsx`):

- Currently: async component that `await`s `getDocumentData`, `getDocPreferences`, `buildFormState`
- Data fetcher: `getCreateFirstUserData(req)` → returns `{ formState, docPermissions, docPreferences, loginWithUsername, userSlug }`
- Client component: `CreateFirstUserClient` already exists and accepts these props

**`Verify`** (`packages/ui/src/views/Verify/index.tsx`):

- Currently: async component that `await`s `req.payload.verifyEmail`
- Data fetcher: `verifyEmailToken(req, { collection, token })` → returns `{ isVerified, message }`
- Client component: `VerifyClient` renders the result (already has `ToastAndRedirect`)

**`CollectionCards`** (`packages/ui/src/widgets/CollectionCards/index.tsx`):

- Currently: async component that `await`s `getAccessResults`, `getVisibleEntities`, `getGlobalData`
- Data fetcher: `getCollectionCardsData(req)` → returns `{ navGroups, globalData, user, adminRoute }`
- Client component: `CollectionCardsClient` renders cards from the data

#### 4.2 RenderServerComponent must leave `packages/ui` -- COMPLETED

`RenderServerComponent` has been moved to `packages/next/src/elements/RenderServerComponent/index.tsx` and exported via `@payloadcms/next/elements/RenderServerComponent`.

**Completed:**

- `RenderServerComponent` canonical implementation now lives in `packages/next`
- `packages/ui` retains only `RenderClientComponent` (in `clientOnly.tsx`) as its framework-agnostic renderer
- `renderComponent?: ComponentRenderer` added to `DefaultServerFunctionArgs`, injected by the adapter's `handleServerFunctions` dispatch
- All server function handlers in `packages/ui` (`buildFormStateHandler`, `buildTableStateHandler`, `renderDocumentSlotsHandler`, `renderWidgetHandler`, `getDefaultLayoutHandler`, `_internal_renderFieldHandler`) use `args.renderComponent` instead of a hardcoded import
- All regular functions/components in `packages/ui` (`renderDocumentSlots`, `renderListViewSlots`, `handleGroupBy`, `buildVersionFields`, `DocumentTabs`, `DefaultDocumentTab`, `DocumentHeader`) accept `renderComponent?: ComponentRenderer` parameter
- All callers in `packages/next` pass `RenderServerComponent` to these functions
- `@payloadcms/ui/elements/RenderServerComponent` retained as deprecated re-export for backward compat (removal in next major)
- `@payloadcms/ui/elements/RenderServerComponent/clientOnly` added as public export for `RenderClientComponent`
- `richtext-lexical` updated to import from `@payloadcms/next/elements/RenderServerComponent`
- `richtext-slate` left on deprecated path (slate is deprecated, removed in 4.0)
- `renderComponent?: ComponentRenderer` added to `ServerComponentProps` (field-level), `ServerProps` (view-level), and `WidgetServerProps` (widget-level) so the adapter injects the renderer when rendering import map components
- `'renderComponent'` added to the `serverProps` key array (ensures it's classified as server-only)
- All `serverProps` construction sites in `packages/next` include `renderComponent: RenderServerComponent`
- All `serverProps` construction sites in `packages/ui` that have access to a resolved renderer include `renderComponent` in the object
- `richtext-lexical` rscEntry now prefers `args.renderComponent` (adapter-injected) over direct import, with fallback for backward compatibility

#### 4.3 Custom component slot rendering strategy

Many views accept custom components via config (`beforeNav`, `afterNav`, `logout.Button`, dashboard widgets, etc.) and render them via `RenderServerComponent`. Since `packages/ui` cannot use RSC rendering:

**Option A (props-based):** The adapter pre-renders all custom component slots on the server and passes them as `React.ReactNode` props to the client component. The client component just places them in the layout.

```typescript
// packages/next (adapter)
const BeforeNav = RenderServerComponent({ Component: config.beforeNav, ... })
return <DefaultNavClient beforeNav={BeforeNav} groups={groups} ... />
```

**Option B (context-based):** The adapter provides a `ComponentRenderer` via React context. Client components in `packages/ui` call it to render custom slots. For Next.js, this renderer delegates to RSC; for non-RSC frameworks, it uses `RenderClientComponent`.

Option A is simpler and avoids the complexity of context-based rendering. The adapter is responsible for resolving and rendering all custom component slots, then threading the rendered nodes into the client component props.

#### 4.4 `@payloadcms/ui/rsc` entrypoint overhaul

The current `@payloadcms/ui/rsc` entrypoint exports a mix of:

- **Pure utilities** (framework-agnostic): `escapeDiffHTML`, `getHTMLDiffComponents`, `unescapeDiffHTML`, `getColumns`, `resolveFilterOptions`, `upsertPreferences`, `handleLivePreview`, `handlePreview`, `copyDataFromLocaleHandler`, `_internal_renderFieldHandler`
- **Sync components** (framework-agnostic): `FieldDiffContainer`, `FieldDiffLabel`, `FolderTableCell`, `FolderField`, `File`, `CheckIcon`
- **Data fetcher utilities** (framework-agnostic): `renderFilters`, `renderTable`, `getFolderResultsComponentAndData`
- **Async server component** (RSC-specific): `CollectionCards`

**Action:**

- Move pure utilities and sync components to `@payloadcms/ui` main entrypoint or a new `@payloadcms/ui/server` entrypoint (these are data-fetching utilities, not RSC)
- `CollectionCards` async component moves to `packages/next`; `packages/ui` exports only `getCollectionCardsData()` and `CollectionCardsClient`
- Deprecate or remove `@payloadcms/ui/rsc` once all consumers are migrated
- Any utility that calls `RenderServerComponent` internally (e.g., `renderTable`, `renderFilters`) must be refactored to accept a `ComponentRenderer` parameter or return data for the adapter to render

#### 4.5 Server functions returning React nodes

Several server functions return `React.ReactNode` (RSC flight payloads):

- `render-document` → returns `{ Document: React.ReactNode, data, preferences }`
- `render-list` → returns `{ List: React.ReactNode, preferences }`
- `render-widget` → returns rendered dashboard widgets
- `render-field` → returns rendered field components
- `render-document-slots` → returns `DocumentSlots`

For non-RSC frameworks, these must return **data only**:

- `render-document` → returns `{ data, preferences, viewConfig, formState }` (no JSX)
- `render-list` → returns `{ docs, totalDocs, columns, preferences }` (no JSX)

The Next.js adapter can keep the RSC flight path as an optimization. Non-RSC adapters use the data-only path and render client-side.

**Implementation:** Each handler should have two modes:

```typescript
type ServerFunctionMode = 'rsc' | 'data-only'

// The adapter declares its mode when wiring server functions
// Next.js: mode = 'rsc' (returns React nodes via flight protocol)
// TanStack: mode = 'data-only' (returns serializable JSON)
```

#### 4.6 Document/Account/Version views in `packages/next`

These views (`packages/next/src/views/Document/index.tsx`, `Account/index.tsx`, `Version/index.tsx`, `Versions/index.tsx`) are async RSC that mix data fetching and rendering. They should follow the same pattern:

- Extract data fetchers to `packages/ui` (e.g., `getDocumentViewData()`, `getAccountViewData()`, `getVersionViewData()`)
- Extract/reuse client components in `packages/ui`
- Keep the async RSC orchestrators in `packages/next` that compose fetcher + client component

This is already the direction of Phase 3.3 but is now explicitly motivated by the "no RSC in `packages/ui`" constraint.

---

### Phase 7: Testing Strategy for Multiple Adapters (Remaining)

**Complexity: MEDIUM**

#### 7.1 Dev server abstraction -- COMPLETED

The `test/dev.ts` script dispatches on `PAYLOAD_FRAMEWORK` env variable. Only the `next` case is implemented.

#### 7.2 Add TanStack Start dev server adapter

Implement `test/adapters/tanstackStartDevServer.ts` using Vite's dev server API. Wire into the `PAYLOAD_FRAMEWORK` switch in `test/dev.ts`.

#### 7.3 E2E test reuse

The same Playwright test specs should run against both framework adapters. The `PAYLOAD_FRAMEWORK` env variable controls which dev server boots. Test assertions are UI-based (selectors, accessibility) and should be framework-agnostic.

#### 7.4 Integration tests

Integration tests using the Payload Local API are already framework-agnostic. No changes needed.

---

### Phase 8: Reference Non-Next Adapter (TanStack Start)

**Complexity: HIGH** -- Proves the abstraction works end-to-end.

#### 8.1 `packages/tanstack-start` adapter

Implements the framework adapter using:

- TanStack Router for navigation (`useRouter`, `Link`, etc.) → provides `RouterAdapterComponent`
- Standard `fetch` to a REST endpoint for server functions (no server actions) → provides `ServerFunctionClient`
- SSR without RSC → uses `RenderClientComponent` as its `ComponentRenderer`
- TanStack's file-based routing for admin routes
- A `ServerAdapter` implementation using `@tanstack/react-start/server` for request context (cookies/headers) and TanStack Router's `redirect()`/`notFound()`
- Route loaders that call data fetcher functions from `packages/ui` and pass data to client components

#### 8.2 TanStack Start app configuration

- Route definitions for admin panel catch-all
- Route definitions for REST API and GraphQL endpoints
- Import map generation configured for TanStack Start's directory structure
- Layout entry wiring `RouterAdapter`, `ServerAdapter`, and `ComponentRenderer`

#### 8.3 View integration pattern

For each admin view, the TanStack adapter creates a route that:

```typescript
// TanStack Start route for dashboard
export const Route = createFileRoute('/admin/')({
  loader: async ({ context }) => {
    const req = await initReq(context)
    return getDashboardData(req)
  },
  component: () => {
    const data = Route.useLoaderData()
    return <DashboardClient {...data} />
  },
})
```

The data fetcher functions (`getDashboardData`, `getNavData`, etc.) are the same ones used by Next.js RSC -- the only difference is **how** and **when** they're called (route loader vs async component body).

---

## Risk Assessment and Open Questions

1. **Custom component slots in data-first world** -- Views that render user-provided `PayloadComponent` slots (nav, dashboard widgets, document header actions) need a strategy for non-RSC. Option A (adapter pre-renders, passes as props) is simplest but means slot components can't be interactive without hydration. Option B (context-based renderer) is more flexible but adds complexity. **Recommendation: Start with Option A, iterate if needed.**
2. **`RenderServerComponent` callers in `packages/ui`** -- Many components currently call `RenderServerComponent` inline. Each call site needs to be refactored: either the slot is pre-rendered by the adapter and passed as a prop, or a `ComponentRenderer` is threaded through. This is a significant but mechanical refactoring.
3. **`react` `cache()` usage** -- `getNavPrefs` and `getPreferences` use React's `cache()` for request-level memoization, which is an RSC/server feature. Data fetcher functions should use `PayloadRequest` for memoization context instead, or the adapter should provide an equivalent caching mechanism.
4. **Backward compatibility** -- Moving `RenderServerComponent` out of `packages/ui` is a breaking change for anyone importing it from `@payloadcms/ui`. Provide a re-export from `@payloadcms/ui` that delegates to `@payloadcms/next` during a deprecation period, or ship as a major version.
5. **Performance** -- RSC provides zero-JS overhead for server-rendered parts. Non-RSC adapters will ship more JavaScript to the client. This is an accepted trade-off. The data-fetcher pattern ensures no unnecessary waterfalls -- all data is loaded before the client component renders.
6. **Server functions returning React nodes** -- The biggest serialization challenge. The dual-mode approach (`rsc` vs `data-only`) adds complexity but avoids forcing Next.js users to lose RSC benefits.
7. **Payload config must stay framework-free** -- Preserved. Adapter wiring remains at the framework integration layer. The adapter contract types live in `packages/payload`, implementations never imported by config.

---

## Complexity Summary

| Phase | Description                                               | Status             | Complexity |
| ----- | --------------------------------------------------------- | ------------------ | ---------- |
| 1     | Define Framework Adapter Contract                         | **COMPLETED**      | HIGH       |
| 2     | Make `packages/ui` framework-agnostic (router/navigation) | **COMPLETED**      | HIGH       |
| 3     | Restructure `packages/next` as pure adapter               | **MOSTLY DONE**    | HIGH       |
| 4     | Eliminate RSC from `packages/ui` (data-first)             | **NOT STARTED**    | VERY HIGH  |
| 5     | Abstract import map generation                            | **COMPLETED**      | MEDIUM     |
| 6     | Remove all Next.js deps from `packages/payload`           | **COMPLETED**      | MEDIUM     |
| 7     | Testing strategy for multiple adapters                    | **PARTIALLY DONE** | MEDIUM     |
| 8     | Reference TanStack Start adapter                          | **NOT STARTED**    | HIGH       |

**Critical path:** Phase 4 is the primary remaining work. It unblocks Phase 8 (TanStack adapter) which validates the full abstraction. Phase 7 completion depends on Phase 8. Phase 3 final items (view splitting) are subsumed by Phase 4.
