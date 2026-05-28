# Writing a Payload framework adapter

This guide is for contributors adding a new framework adapter (Remix, Astro, Solid Start, …) on top of `@payloadcms/ui`. It is an architectural reference, not a step-by-step tutorial. Read `packages/next` and `packages/tanstack-start` for the canonical implementations.

## Mental model

```
┌─────────────────────────────────────────────────────────────────┐
│ @payloadcms/ui                                                  │
│   views/<View>/<View>ViewRSC.tsx   ← every admin view as an RSC │
│   views/Root/renderAdminPage.tsx   ← single dispatcher          │
│   utilities/sharedHandlers/        ← render-list, render-doc, … │
│   utilities/serverFunctionRegistry ← shared handler registry    │
│   templates/Default,Minimal        ← page chrome                │
└────────────────────────▲────────────────────────────────────────┘
                         │  React Server Components / Flight
┌────────────────────────┴────────────────────────────────────────┐
│ @payloadcms/<framework>                                         │
│   utilities/initReq.ts        ← framework → PayloadRequest      │
│   admin/RootPage.tsx          ← entry point (`renderAdminPage`) │
│   utilities/handleServerFunctions.ts ← merges sharedRegistry    │
│   layouts/                    ← html shell + RootProvider       │
│   vite/ or next/ glue         ← bundling, request routing       │
└─────────────────────────────────────────────────────────────────┘
```

Adapters never fork view source. They only own:

1. **Request plumbing** — turning the framework's request object into a `PayloadRequest` (`initReq`).
2. **One entry point** — calling `renderAdminPage` and shipping its React tree.
3. **Server-function dispatch** — merging `sharedServerFunctions` from `@payloadcms/ui` with framework-specific extras (`render-tab`, `render-widget`, `get-default-layout`, etc.) and exposing them at a URL the client can hit.
4. **Layout + providers** — the `<html>` shell that wraps `RootProvider` from `@payloadcms/ui`.
5. **Navigation adapter** — implementing `NavigationAdapter` (`useNavigate`, `useLocation`, `useSearchParams`, `Link`) so shared client components stay framework-agnostic.

## Required pieces

### 1. `initReq`

```ts
import { initPageProps } from '@payloadcms/ui/utilities/initPageProps'
import type { InitReqResult } from 'payload'

export async function initReq({
  configPromise,
  importMap,
  overrides,
}: {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  overrides?: { fallbackLocale?: false | string; req?: Partial<PayloadRequest> }
}): Promise<InitReqResult> {
  // 1. Read cookies / headers from the framework's request context.
  // 2. Resolve config + payload instance.
  // 3. Build a PayloadRequest with i18n, locale, user, query, etc.
  // 4. Resolve permissions and visibleEntities.
  // Return { req, cookies, permissions, visibleEntities, i18n, locale, ... }.
}
```

The contract is `InitReqResult` (see `packages/payload/src/admin/types.ts`). Both the Next and TanStack adapters follow it; differences are limited to _how_ cookies/headers are read.

### 2. The admin entry point

```ts
import { renderAdminPage } from '@payloadcms/ui/views/Root/renderAdminPage'

export async function adminEntry({ params, searchParams }) {
  const initResult = await initReq({
    configPromise,
    importMap,
    overrides: { req: { query: searchParams } },
  })
  const metadata = {}

  try {
    const node = await renderAdminPage({
      config,
      importMap,
      initResult,
      metadata,
      params: { segments: parseSegments(params) },
      searchParams,
    })
    return ship(node, metadata) // framework-specific
  } catch (err) {
    if (err.message === 'not-found') return frameworkNotFound()
    if (err.message.startsWith('redirect:'))
      return frameworkRedirect(err.message.slice('redirect:'.length))
    throw err
  }
}
```

`renderAdminPage` is the **only** view dispatcher. It resolves the route, renders the appropriate `*ViewRSC` from `@payloadcms/ui`, wraps it in the right template, and throws an `Error('not-found')` or `Error('redirect:<url>')` to signal navigation. Adapters translate those into the framework's native primitives.

How the returned React tree is shipped to the client is framework-specific:

- **Next.js**: return the node from a Server Component — Next handles Flight natively.
- **TanStack Start**: pipe through `renderServerComponent(node)` from `@tanstack/react-start/rsc`, return the resulting handle from a `createServerFn` handler. The route component renders `data.rscPayload` as children.

### 3. Server-function dispatch

```ts
import { sharedServerFunctions } from '@payloadcms/ui/utilities/serverFunctionRegistry'

const baseServerFunctions: Record<string, ServerFunction<any, any>> = {
  ...sharedServerFunctions, // form-state, render-list, render-document, …
  'get-default-layout': getDefaultLayoutHandler,
  'render-document-slots': renderDocumentSlotsHandler,
  'render-field': _internal_renderFieldHandler,
  'render-tab': renderTabHandler,
  'render-widget': renderWidgetHandler,
}

export async function handleServerFunctions(args) {
  const { name, args: handlerArgs, req } = await decodeRequest(args)
  const handler = baseServerFunctions[name] ?? customHandlers[name]
  return await handler({ ...handlerArgs, req })
}
```

The wire format for any handler that returns a React element is **always RSC Flight** — never JSON. The shared handlers in `packages/ui/src/utilities/sharedHandlers/` already return React elements; the adapter is responsible for serializing them with the framework's RSC serializer (Next: native; TanStack: `serializeForRsc` from `@payloadcms/tanstack-start/server`).

There is no "data-only" branch — the legacy `dataOnlyHandlers` / `dataOnlyServerFunctions` registry has been removed. Don't reintroduce it.

### 4. Layout + providers

Wrap your app in the framework's `<html>` shell, mount `RootProvider` from `@payloadcms/ui`, and pass `getLayoutData(...)` (from `@payloadcms/<framework>/layouts`) so the provider receives `clientConfig`, translations, theme, locale, and permissions already resolved on the server. See `packages/next/src/layouts/Root/index.tsx` and `tanstack-app/src/app/_payload.tsx` for canonical examples.

### 5. Navigation adapter

Implement `NavigationAdapter` (`packages/ui/src/views/_shared/NavigationAdapter.ts`) using the framework's router hooks, then pass it to `RootProvider` via `RouterAdapter={MyAdapter}`. This is the only place where framework-specific router APIs are allowed in the admin tree.

## What you do NOT do

- **No view source in the adapter.** No `views/Login/`, `views/Document/`, etc. inside `packages/<framework>`.
- **No `getAdminPageData`-style data assembler.** `renderAdminPage` is the dispatcher.
- **No data-only / JSON wire format for renders.** Server functions returning React elements ship Flight.
- **No client-side rebuilders.** Don't reconstruct a "list view client props" object on the client; render the RSC tree the server returned.
- **No fork of the templates.** `DefaultTemplateServer` and `MinimalTemplate` live in `packages/ui` and accept the same props in every adapter.

## Reference implementations

- `packages/next/src/admin/RootPage.tsx` — Next adapter entry (~225 lines).
- `tanstack-app/src/functions/adminPageRSC.functions.tsx` — TanStack Start entry (~80 lines).
- `packages/next/src/utilities/handleServerFunctions.ts` — server-function dispatcher merging shared + framework handlers.
- `packages/tanstack-start/src/utilities/handleServerFunctions.ts` — same pattern, framework-specific transport (`createServerFn` + `serializeForRsc`).
- `packages/ui/src/utilities/sharedHandlers/renderList.ts` and `renderDocument.ts` — shared handlers; both adapters consume these directly.

## Validating an adapter

Per stage of an adapter PR:

1. Build all packages: `pnpm run build:core`.
2. Lint: `pnpm run lint`.
3. Production smoke: `pnpm prepare-run-test-against-prod && pnpm dev:prod _community` — confirms `'use client'` boundaries hold under bundling.
4. Integration tests for representative suites: `pnpm run test:int <suite>`.
5. e2e against the adapter's host app: `pnpm run test:e2e` (or the adapter-specific runner).

Dev mode (`pnpm dev`) does not catch RSC/client bundling regressions; always run the prod-build path before merging.
