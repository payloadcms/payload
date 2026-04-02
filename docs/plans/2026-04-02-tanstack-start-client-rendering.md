# TanStack Start: Serializable Page State + Client Rendering

## Goal

Fix the TanStack Start admin rendering path by removing the dependency on `renderRootPage` and replacing it with:

- a serializable server-side page-state function
- a client-only TanStack admin page shell
- TanStack-specific client view wrappers that reuse existing client UI pieces from `packages/ui`

Next.js remains unchanged and continues using the existing RSC-based admin rendering path.

## Problem

TanStack Start is isomorphic by default. The current admin route still renders `RootPage`, and `RootPage` imports `@payloadcms/ui/views/Root/RenderRoot`. That pulls the server-rendered admin path into the TanStack route graph.

Because `renderRootPage` and the current server view/template chain transitively depend on server-only modules, TanStack’s client build currently needs `serverOnlyStubPlugin` in `tanstack-app/vite.config.ts`.

That plugin is only masking the real issue. Each new server-only dependency can create a new browser-bundle breakage point.

## Verified Current State

- `tanstack-app/app/routes/admin.$.tsx` still returns `segments` from the loader and renders `RootPage`.
- `packages/tanstack-start/src/views/Root/index.tsx` imports `@payloadcms/ui/views/Root/RenderRoot`.
- `packages/tanstack-start/src/layouts/Root/index.tsx` already sets up `RootProvider`, TanStack router integration, auth, translations, config, and server functions.
- `packages/ui` already contains reusable client pieces such as `DefaultListView`, `DefaultEditView`, `CreateFirstUserClient`, and dashboard client modules.
- `render-document` and `render-list` still return React nodes today, so they are not suitable as serializable TanStack page data primitives.
- The current default template and nav are server-oriented and rely on `RenderServerComponent`.

## Design

### Rendering model

**Next.js**

- Keeps `renderRootPage`
- Keeps RSC views and templates
- No behavior change

**TanStack Start**

- Loader calls `getPageState`
- `getPageState` returns serializable data only
- Route component renders `TanStackAdminPage`
- `TanStackAdminPage` is client-only
- Client wrappers map `viewType` to reusable client implementations
- Mutations that currently depend on `render-document` / `render-list` invalidate the route instead of returning React nodes

This is acceptable because Payload admin is authenticated application UI, not an SEO page.

## Core Principles

### 1. Do not serialize React nodes

No TanStack loader or server function used for route rendering should return:

- `React.ReactNode`
- rendered server components
- server-only component references

Only plain serializable data should cross the route boundary.

### 2. Do not repurpose the existing `packages/ui` server views as-is

The current server view entry points in `packages/ui` stay in place for Next.js.

TanStack should instead:

- add a page-state layer in `packages/tanstack-start`
- add client wrappers in `packages/tanstack-start`
- reuse client components from `packages/ui` where those already exist

### 3. Keep the existing TanStack root layout

The current `RootLayout` in `packages/tanstack-start` already provides the base app shell and providers. The new page flow should fit inside that tree.

`TanStackAdminPage` should use `PageConfigProvider` at the page level, not replace `RootProvider`.

## Main Components

### 1. `getPageState`

**File:** `packages/tanstack-start/src/views/Root/getPageState.ts`

This is the new server-side entry point for route rendering.

Responsibilities:

- call `initReq`
- perform auth/public-route/custom-route checks
- reproduce route resolution currently handled before rendering
- derive serializable page state from `getRouteData`
- throw TanStack `redirect` / `notFound` as needed

### Serializable state shape

At minimum:

```ts
type SerializablePageState = {
  browseByFolderSlugs: string[]
  clientConfig: ClientConfig
  documentSubViewType?: DocumentSubViewTypes
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
  searchParams?: Record<string, string | string[]>
  segments: string[]
  templateClassName: string
  templateType?: 'default' | 'minimal'
  viewType?: ViewTypes
  visibleEntities: VisibleEntities
  customView?: PayloadComponent
  viewActions?: PayloadComponent[]
}
```

### Important notes

- Built-in views should be represented by `viewType`, not by serializing a React function.
- `viewActions` and `customView` are only safe when they are import-map-addressable payload components.
- Direct function components should not be serialized through page state.
- `visibleEntities` or precomputed nav groups must be present so the client template can build navigation without server-only helpers.

### 2. Route loader rewrite

**File:** `tanstack-app/app/routes/admin.$.tsx`

Current route behavior:

- resolves `segments`
- performs some auth logic inline
- renders `<RootPage ... />`

Target route behavior:

- resolves `segments`
- delegates page-state work to `getPageState`
- renders `<TanStackAdminPage ... />`

The route component should pass TanStack search params as plain route search state into the page shell.

### 3. `TanStackAdminPage`

**File:** `packages/tanstack-start/src/views/Root/TanStackAdminPage.tsx`

Requirements:

- `'use client'`
- no server-only imports
- uses `PageConfigProvider`
- chooses template by `templateType`
- chooses built-in view wrapper by `viewType`
- resolves supported import-map custom views on the client

This component is the top of the new TanStack page tree.

## Templates

The existing `packages/ui` templates are server-oriented and should not be reused directly in the TanStack page path.

Instead create TanStack-safe client templates under `packages/tanstack-start`.

### Default template

Should:

- use client-safe wrappers and layout primitives
- use `DefaultNavClient` rather than `DefaultNav`
- rely on `visibleEntities` or precomputed nav groups
- preserve the admin shell structure where possible
- avoid `RenderServerComponent`

### Minimal template

Should:

- cover login/reset/verify-like minimal routes
- remain client-safe
- avoid server-render helpers

## View Strategy

TanStack needs its own client wrappers for built-in views.

### Reuse from existing client components

Reuse existing client components in `packages/ui` where practical:

- list: `DefaultListView`
- document: `DefaultEditView`
- create first user: `CreateFirstUserClient`
- account: `AccountClient`
- dashboard internals: modular dashboard client pieces

### Views with server-only current entry points

If a view still only exists as a server entry point, add a TanStack client wrapper that:

- consumes serializable state from `getPageState`, or
- fetches serializable data via existing server functions or new data-only helpers

Do not route page rendering through the server view entry point.

### Custom views

TanStack should only support custom views that can be addressed through the import map on the client.

If a custom view is only represented by a direct React function and cannot be safely serialized or resolved client-side, it should not be passed through route state.

## List Data

The list page needs a data-only path instead of the current RSC rendering path.

### Shared utility

Add a small `packages/ui` exception:

- `packages/ui/src/utilities/buildTableData.ts`

Export it from:

- `packages/ui/src/exports/utilities.ts`

This helper should:

- share data-fetching and column-building behavior with `buildTableState`
- return serializable data only
- not render `Table`
- not render filters

### Consistency requirement

Do not let TanStack and Next.js diverge accidentally.

If shared list-fetch logic is adjusted, either:

- preserve existing behavior in both paths, or
- intentionally fix the behavior in both places

## Document Data

The document page also needs a serializable, non-RSC path.

TanStack should not use `renderDocument` for route rendering because it returns React nodes.

Instead:

- derive document state with existing server-side utilities where possible
- return plain data, permissions, preferences, locks, form state, and route metadata
- mount a client wrapper that reuses `DefaultEditView` and the required client providers

## Dashboard

Dashboard is the highest-risk view because the current server path still wraps modular dashboard pieces with server rendering behavior.

Recommended initial scope:

- make the default dashboard functional in TanStack
- reuse modular dashboard client pieces
- avoid dragging server-only dashboard extensions into the TanStack client graph

If some advanced dashboard customizations are still server-only, keep the first pass conservative instead of reintroducing the underlying problem.

## Server Functions and Invalidation

The shared dispatcher in `packages/ui` should remain unchanged.

TanStack-specific behavior belongs in:

- `packages/tanstack-start/src/utilities/handleServerFunctions.ts`

### Special-case invalidation

Intercept:

- `render-document`
- `render-list`

Instead of returning React nodes, return an invalidation sentinel such as:

```ts
{
  __tanstack_invalidate: true
}
```

All other server functions should continue dispatching through the existing shared handler.

## Router Invalidation

The TanStack adapter/router path should recognize the invalidation sentinel and call:

- `router.invalidate()`

This keeps the route data model TanStack-native:

- route state comes from the loader
- updates trigger loader refresh
- page state rehydrates from fresh serialized data

## Vite Cleanup

Once the TanStack admin route no longer pulls server-only code into the client graph:

- remove `serverOnlyStubPlugin` from `tanstack-app/vite.config.ts`

Keep the compatibility shim plugin that is unrelated to this issue.

## What Does Not Change

- `packages/next`
- `renderRootPage`
- the shared server-function dispatcher in `packages/ui`
- REST and auth semantics
- the Next.js admin rendering path

## Trade-offs

| Aspect                           | Next.js             | TanStack Start                 |
| -------------------------------- | ------------------- | ------------------------------ |
| View rendering                   | RSC-first           | client wrappers + loader state |
| Route payload                    | React nodes allowed | serializable data only         |
| Route refresh                    | framework RSC flow  | loader invalidation            |
| Server-only deps in client graph | none                | none after migration           |
| Stub maintenance                 | not needed          | removed                        |

## Testing

### Integration

Extend `test/admin-adapter/tanstack-start.int.spec.ts` to cover:

- `getPageState` export and shape
- redirect/notFound behavior
- invalidation responses for `render-document` and `render-list`
- normal dispatch behavior for other server functions

### E2E

Add or extend TanStack app coverage for:

- dashboard route loads
- list route loads
- document route loads
- client-side navigation works
- mutations refresh the route via invalidation
- browser console has no server-only module errors

### Manual verification

Verify at minimum:

1. TanStack app builds without `serverOnlyStubPlugin`
2. admin root route renders
3. list route renders
4. document route renders
5. save/delete style flows refresh correctly

## Outcome

This design succeeds when TanStack admin rendering:

- no longer routes through `RootPage` / `RenderRoot`
- no longer needs `serverOnlyStubPlugin`
- remains compatible with the existing `RootLayout` provider tree
- keeps Next.js untouched
