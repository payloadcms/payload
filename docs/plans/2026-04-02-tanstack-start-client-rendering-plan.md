# TanStack Start Client Rendering Implementation Plan

## Goal

Replace the current TanStack Start admin page path, which renders the server-side `RootPage`, with:

1. A serializable server-side page-state function
2. A client-only TanStack admin page shell
3. Client-side view wrappers that reuse existing client UI pieces from `packages/ui`

This removes the need for `serverOnlyStubPlugin` in the TanStack app while leaving the Next.js adapter untouched.

## Verified Current State

These points are based on the current repo, not assumptions:

- [tanstack-app/app/routes/admin.$.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/admin.$.tsx) still returns `segments` from the loader and renders `RootPage`.
- [packages/tanstack-start/src/views/Root/index.tsx](/Users/orakhmatulin/work/payload/packages/tanstack-start/src/views/Root/index.tsx) imports `@payloadcms/ui/views/Root/RenderRoot`, which keeps TanStack on the RSC path.
- [packages/tanstack-start/src/layouts/Root/index.tsx](/Users/orakhmatulin/work/payload/packages/tanstack-start/src/layouts/Root/index.tsx) already mounts `RootProvider`, `TanStackRouterProvider`, auth, translations, config, and server functions. The new page path must fit inside this provider tree.
- There is no existing TanStack-specific client page/view layer in `packages/tanstack-start/src/views` beyond the server `RootPage`.
- Existing reusable client view pieces already live in `packages/ui`, notably:
  - [packages/ui/src/views/List/index.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/views/List/index.tsx)
  - [packages/ui/src/views/Edit/index.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/views/Edit/index.tsx)
  - [packages/ui/src/views/CreateFirstUser/index.client.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/views/CreateFirstUser/index.client.tsx)
  - [packages/ui/src/views/Dashboard/Default/ModularDashboard/index.client.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/views/Dashboard/Default/ModularDashboard/index.client.tsx)
- Existing server functions `render-document` and `render-list` still return React nodes:
  - [packages/ui/src/views/Document/handleServerFunction.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/views/Document/handleServerFunction.tsx)
  - [packages/ui/src/views/List/handleServerFunction.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/views/List/handleServerFunction.tsx)
- The current default template/nav path is server-oriented:
  - [packages/ui/src/templates/Default/index.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/templates/Default/index.tsx)
  - [packages/ui/src/elements/Nav/index.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/elements/Nav/index.tsx)

## Constraints

- Do not modify `packages/next`.
- Keep Next.js behavior unchanged.
- Minimize changes in `packages/ui`.
- A small `packages/ui` exception is acceptable where required for serialization support. The main justified example is extracting a serializable `buildTableData`.
- Do not attempt to serialize React nodes across TanStack server functions.
- Keep `RootLayout` and `RootProvider` as the shared TanStack layout foundation.

## Architecture

### Next.js path

Unchanged. It continues to use:

- `renderRootPage`
- Server-rendered templates
- Server-rendered view entry points
- Existing `render-document` and `render-list` behavior

### TanStack Start path

New flow:

1. Route loader calls `getPageState`
2. `getPageState` runs server-side and returns only serializable data
3. Route component renders a client-only `TanStackAdminPage`
4. `TanStackAdminPage` picks a built-in client wrapper by `viewType`
5. Client wrappers reuse existing client components from `packages/ui`
6. Any view-specific mutations that currently depend on `render-document` / `render-list` trigger route invalidation instead of returning React nodes

### Important scope correction

The implementation should not try to make the existing `packages/ui` server view entry points directly serializable. Instead:

- Keep those server entry points for Next.js
- Add TanStack-specific client wrappers in `packages/tanstack-start`
- Reuse existing client components from `packages/ui` where they already exist

## Serializable Page State

Create a new server-side page-state function in:

- `packages/tanstack-start/src/views/Root/getPageState.ts`

Responsibilities:

- Call `initReq`
- Recreate the route-resolution logic currently buried in `renderRootPage`
- Handle redirects and notFound via TanStack Router errors
- Return only serializable data
- Recompute any page-level data the client shell cannot derive from context alone

### Required fields

The page state should include at least:

```ts
type SerializablePageState = {
  browseByFolderSlugs: string[]
  clientConfig: ClientConfig
  documentSubViewType?: DocumentSubViewTypes
  locale?: Locale
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
  searchParams?: Record<string, string | string[]>
  segments: string[]
  templateClassName: string
  templateType?: 'default' | 'minimal'
  viewType?: ViewTypes
  visibleEntities: VisibleEntities
  navPreferences?: NavPreferences
  customView?: PayloadComponent | undefined
  viewActions?: PayloadComponent[]
}
```

### Serialization rules

- Built-in views should be represented by `viewType`, not by a React function.
- `viewActions` should only include import-map-addressable payload components.
- Any direct React function references must be dropped from the serialized output.
- `visibleEntities` must be present unless the implementation instead serializes fully prepared nav groups.

### Auth and route handling

Move the route/auth checks into `getPageState` so the route loader becomes thin.

Reuse logic from:

- [packages/ui/src/views/Root/getRouteData.ts](/Users/orakhmatulin/work/payload/packages/ui/src/views/Root/getRouteData.ts)
- [packages/ui/src/utilities/handleAuthRedirect.ts](/Users/orakhmatulin/work/payload/packages/ui/src/utilities/handleAuthRedirect.ts)
- [packages/ui/src/utilities/isPublicAdminRoute.ts](/Users/orakhmatulin/work/payload/packages/ui/src/utilities/isPublicAdminRoute.ts)
- [packages/ui/src/utilities/isCustomAdminView.ts](/Users/orakhmatulin/work/payload/packages/ui/src/utilities/isCustomAdminView.ts)

Do not call `renderRootPage` from `getPageState`.

## Route Rewrite

Replace the current route flow in:

- `tanstack-app/app/routes/admin.$.tsx`

Current:

- Loader returns `{ segments }`
- Component renders `<RootPage ... />`

Target:

- Loader calls `getPageState`
- Component renders `<TanStackAdminPage ... />`

The route should pass `search` from TanStack Router into the client page as plain search params.

## Client Page Shell

Create:

- `packages/tanstack-start/src/views/Root/TanStackAdminPage.tsx`

Requirements:

- `'use client'`
- Must not import server-only modules
- Must sit inside the existing layout/provider tree from `RootLayout`
- Should use `PageConfigProvider`, not replace `RootProvider`

Responsibilities:

1. Apply page-level config shadowing with `PageConfigProvider`
2. Pick template by `templateType`
3. Pick the built-in TanStack view wrapper by `viewType`
4. Resolve import-map based custom views if they are safe client components
5. Pass route/search/page state into the selected client wrapper

## Template Strategy

Do not try to render [packages/ui/src/templates/Default/index.tsx](/Users/orakhmatulin/work/payload/packages/ui/src/templates/Default/index.tsx) directly in the client path. It depends on server-side `RenderServerComponent`, `payload`, and server props.

Instead create TanStack-safe client templates in `packages/tanstack-start`, likely:

- `packages/tanstack-start/src/templates/Default/TanStackDefaultTemplate.tsx`
- `packages/tanstack-start/src/templates/Minimal/TanStackMinimalTemplate.tsx`

These should reuse client-safe UI pieces from `packages/ui` where possible.

### Default template requirements

- Use `visibleEntities` and/or precomputed nav groups
- Use `DefaultNavClient` instead of `DefaultNav`
- Preserve core layout structure, app header behavior, nav toggling, and wrappers where client-safe
- Avoid `RenderServerComponent`

### Minimal template requirements

- Mirror the minimal shell used for login/reset/verify-like routes
- Avoid any server component hooks

## View Wrapper Strategy

Add TanStack-specific client wrappers under `packages/tanstack-start/src/views`.

These wrappers should map built-in `viewType` values to existing client functionality in `packages/ui`.

### Views that can reuse existing client components

- `list`
  - Reuse `DefaultListView`
- `document`
  - Reuse `DefaultEditView` and surrounding client providers required by the edit path
- `createFirstUser`
  - Reuse `CreateFirstUserClient`
- `account`
  - Reuse `AccountClient`
- Dashboard internals
  - Reuse the modular dashboard client pieces where feasible

### Views that still need server-derived state

If a view currently has only a server entry point, add a thin TanStack client wrapper that:

- fetches serializable state from server functions on mount, or
- consumes state already prepared by `getPageState`

Do not pass server-rendered React nodes through page state.

### Custom views

Support only import-map-addressable custom views in the serialized route state.

Rules:

- If `PayloadComponent` is a path/object reference, resolve it through the import map on the client.
- If the current route resolves to a direct React function that is not safely serializable, do not attempt to pass it through page state.
- If needed, document that TanStack custom views require import-map-addressable components for this path.

## List View Data

The current plan to extract `buildTableData` is valid, but it needs one correction:

- It should be framed as a small, deliberate `packages/ui` exception to support a serializable TanStack path.

### New utility

Add:

- `packages/ui/src/utilities/buildTableData.ts`

Export it from:

- `packages/ui/src/exports/utilities.ts`

### Behavior

This helper should:

- Share the data-fetching and column-building logic from `buildTableState`
- Return only serializable data:
  - `columns`
  - `data`
  - `preferences`
- Not render:
  - `Table`
  - `renderedFilters`

### Consistency requirement

Do not introduce a TanStack-only behavior fork in the shared fetch logic.

Note:

- [packages/ui/src/utilities/buildTableState.ts](/Users/orakhmatulin/work/payload/packages/ui/src/utilities/buildTableState.ts) currently contains a `joinQuery.page` / `joinQuery.limit` inconsistency in the array-of-collections branch.

If that logic is touched, either:

- preserve the current behavior exactly in both paths, or
- fix the bug intentionally for both shared consumers

Do not silently make TanStack behave differently from Next.js.

## List Wrapper

Add a TanStack list wrapper that:

1. Obtains serializable list data
2. Builds client-safe list props
3. Reuses `DefaultListView`

Prefer:

- server-side serializable data from `buildTableData`
- client-side `ListQueryProvider`
- client-side `TableColumnsProvider`
- client-side filters/table behavior only where the underlying props are serializable

Do not depend on `renderListView` or `render-list` for page rendering.

## Document Wrapper

Add a TanStack document wrapper that:

1. Fetches or derives serializable document state
2. Reuses `DefaultEditView`
3. Provides the same client providers the edit view expects

The wrapper must not rely on `renderDocument` returning a React node.

Reuse existing document-related server utilities where possible for data, permissions, preferences, lock state, and form state, but return plain data only.

## Dashboard Wrapper

The dashboard path needs special care because the existing server view still resolves server-rendered content around modular dashboard widgets.

Recommended approach:

1. Start with a minimal TanStack dashboard wrapper that renders the core dashboard client shell and widget area without server-only imports.
2. Reuse the modular dashboard client pieces from `packages/ui`.
3. If some dashboard extensions remain server-only, explicitly leave them unsupported in the first TanStack slice rather than sneaking server imports back into the client tree.

The first implementation should optimize for removing the stub plugin and keeping the default dashboard functional.

## Server Function Invalidation

Keep the existing shared dispatcher in `packages/ui` intact.

Change TanStack-specific handling in:

- `packages/tanstack-start/src/utilities/handleServerFunctions.ts`

### Required behavior

Intercept:

- `render-document`
- `render-list`

Return a TanStack-specific invalidation sentinel, for example:

```ts
{
  __tanstack_invalidate: true
}
```

All other server functions should continue to dispatch normally through `dispatchServerFunction`.

## Router Provider Invalidation Hook

Update:

- `packages/tanstack-start/src/adapter/RouterProvider.tsx`

So that the client-side router/server-function flow recognizes the TanStack invalidation sentinel and calls:

- `router.invalidate()`

This should refresh route data and allow the client page shell to rebuild from fresh serialized page state.

## Export Surface

Update TanStack exports as needed so the new view/page helpers are available from:

- `packages/tanstack-start/src/index.ts`

If `RootPage` is removed or superseded, update the export surface accordingly and adjust the route import sites.

## Vite Cleanup

After the new page path is fully client-safe, remove:

- `serverOnlyStubPlugin`

from:

- [tanstack-app/vite.config.ts](/Users/orakhmatulin/work/payload/tanstack-app/vite.config.ts)

Keep:

- `tanstackStartCompatPlugin`

Do not remove the stub plugin before the new route path is verified to build and hydrate cleanly.

## Implementation Order

Implement in this order:

### Phase 0

- Rewrite the TanStack plan and align it with repo reality

### Phase 1

- Add `buildTableData` in `packages/ui`
- Export it
- Typecheck `packages/ui`

### Phase 2

- Add `getPageState`
- Move route/auth/page-state logic into it
- Add tests for the serialized page-state shape

### Phase 3

- Replace `RootPage` route usage with `TanStackAdminPage`
- Keep the first shell minimal but functional
- Verify there are no server-only imports in the page client graph

### Phase 4

- Add TanStack-safe default/minimal templates
- Add nav handling using client-safe pieces

### Phase 5

- Add built-in client wrappers for:
  - list
  - document
  - dashboard
  - account
  - createFirstUser
  - remaining simple auth/minimal views as needed

### Phase 6

- Add TanStack invalidation handling for `render-document` and `render-list`
- Wire router invalidation in the TanStack adapter/provider

### Phase 7

- Remove `serverOnlyStubPlugin`
- Run targeted tests/build verification

## Testing

### Integration

Expand:

- `test/admin-adapter/tanstack-start.int.spec.ts`

Add coverage for:

- `getPageState` exports and returns a plain serializable object
- built-in view types resolve to expected serializable state
- auth redirect/notFound behavior is preserved
- TanStack `handleServerFunctions` returns invalidation for:
  - `render-document`
  - `render-list`
- other server functions still dispatch normally

### E2E

Add or extend TanStack app coverage in the appropriate test location for:

- dashboard loads without server-only import/runtime errors
- list view loads and navigates
- document view loads and saves
- client-side navigation between admin routes works
- document/list mutations trigger route invalidation and refresh
- browser console does not show server-only module failures

### Manual verification

At minimum verify:

1. TanStack app builds without relying on `serverOnlyStubPlugin`
2. Admin root route loads
3. List route loads
4. Document route loads
5. Save/delete flows refresh correctly

## Non-Goals

- Reworking the Next.js adapter
- Converting all existing `packages/ui` server views into dual server/client implementations
- Full parity for every custom server-rendered extension on day one if that would reintroduce server-only imports into the TanStack client graph

## Deliverable

The final implementation is successful when:

- `tanstack-app/app/routes/admin.$.tsx` no longer renders `RootPage`
- TanStack admin rendering no longer imports `RenderRoot` into the page path
- the TanStack app works without `serverOnlyStubPlugin`
- Next.js behavior remains unchanged
- the new plan is accurately reflected in code and tests
