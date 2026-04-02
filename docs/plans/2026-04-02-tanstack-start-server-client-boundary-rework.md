# TanStack Start Server/Client Boundary Rework Plan

## Goal

Fix TanStack Start `admin-root` e2e by removing server-only code from the client route graph.

This plan explicitly rejects browser-side module shims and mock Node builtins. The correct fix is:

1. keep client bundles client-only
2. keep server logic behind TanStack server functions or server loaders
3. split mixed entrypoints so route-tree imports never pull server modules into the browser

## Keep vs Revert

### Keep

- Keep the Sass warning suppression in [tanstack-app/vite.config.ts](/Users/orakhmatulin/work/payload/tanstack-app/vite.config.ts) (`silenceDeprecations: ['import']`)
- Keep the `@vite-ignore` update in [packages/payload/src/utilities/dynamicImport.ts](/Users/orakhmatulin/work/payload/packages/payload/src/utilities/dynamicImport.ts)
- Keep the route-level move away from static `@payload-config` imports as part of the rework direction

### Revert

- Revert all browser shim work in [tanstack-app/vite.config.ts](/Users/orakhmatulin/work/payload/tanstack-app/vite.config.ts)
- Do not add more client aliases for `node:*`, `react-dom/server`, or other server modules

## Verified Problem

The browser failures were not isolated package bugs. They were repeated proof that the client graph still imports server code.

Observed breakages included:

- `file-type`
- `sharp`
- `node:stream/web`
- `react-dom/server`
- `node:async_hooks`
- `util.isDeepStrictEqual`
- `ieee754`

These were downstream symptoms of one root issue: TanStack route modules imported server-oriented entrypoints that are also pulled into the client by [tanstack-app/app/routeTree.gen.ts](/Users/orakhmatulin/work/payload/tanstack-app/app/routeTree.gen.ts).

## Root Cause

### 1. Route-tree modules are client-visible

[tanstack-app/app/routeTree.gen.ts](/Users/orakhmatulin/work/payload/tanstack-app/app/routeTree.gen.ts) imports:

- [tanstack-app/app/routes/\_\_root.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/__root.tsx)
- [tanstack-app/app/routes/admin.index.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/admin.index.tsx)
- [tanstack-app/app/routes/admin.$.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/admin.$.tsx)

Anything statically imported by those files is at risk of entering the client graph.

### 2. `__root.tsx` imports a server-oriented layout entrypoint

[tanstack-app/app/routes/\_\_root.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/__root.tsx) currently depends on `RootLayout` behavior from `@payloadcms/tanstack-start`.

[packages/tanstack-start/src/layouts/Root/index.tsx](/Users/orakhmatulin/work/payload/packages/tanstack-start/src/layouts/Root/index.tsx) imports and executes server-oriented concerns:

- `initReq`
- nav preference lookup
- request/theme/cookie derivation
- client config generation
- locale filtering
- server action wiring

That file is not safe as a static route-tree import.

### 3. Package root exports are too mixed

`@payloadcms/tanstack-start` currently exposes both client-safe and server-oriented entrypoints from the same package root.

Using the package root from route files makes it too easy to drag server code into the client graph.

## Rework Direction

## Phase 1: Remove the Wrong Fix

1. Remove the browser shim plugin from [tanstack-app/vite.config.ts](/Users/orakhmatulin/work/payload/tanstack-app/vite.config.ts)
2. Keep only the Sass suppression in that file
3. Re-run focused TanStack `admin-root` e2e to confirm the route graph still fails without shims

## Phase 2: Split the Root Route into Client Shell + Server Data

### Target state

[tanstack-app/app/routes/\_\_root.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/__root.tsx) should import only client-safe UI and TanStack router components at module scope.

It should not statically import:

- `RootLayout`
- `initReq`
- `@payload-config`
- server-only request helpers
- mixed package-root exports that transitively pull server modules

### Required refactor

Extract the server work currently embedded in `RootLayout` into a data function that returns only serializable props.

Suggested split:

1. Add a server-only helper in `packages/tanstack-start`

   - example shape: `getRootLayoutData({ config, importMap })`
   - responsibility: run `initReq`, nav prefs lookup, client config generation, locale filtering, translation/theme derivation
   - output: plain data needed by the client root shell

2. Add a client-safe root-shell export in `packages/tanstack-start`

   - example shape: `TanStackRootShell`
   - responsibility: compose `TanStackRouterProvider`, `TanStackRootProvider`, `ProgressBar`, and `Outlet`
   - input: serialized root layout data, plus the TanStack server function clients

3. Update `__root.tsx`
   - route loader or `createServerFn` fetches root layout data
   - component renders the client shell with loader data
   - server functions stay behind `createServerFn`

## Phase 3: Add Explicit Client-Safe Exports

Avoid importing the mixed `@payloadcms/tanstack-start` package root from route files.

Add explicit client-safe subpath exports for pieces that are allowed in the client route graph, for example:

- router provider
- root provider shell
- client page shell

Add explicit server-only subpaths for:

- root layout data builder
- page-state loader helpers
- server function dispatcher

## Phase 4: Keep Admin Routes on the Same Pattern

[tanstack-app/app/routes/admin.index.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/admin.index.tsx) and [tanstack-app/app/routes/admin.$.tsx](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/admin.$.tsx) should keep page-state fetching behind a TanStack server function.

Follow through on that pattern:

1. keep page-state fetching behind a TanStack server function
2. keep route modules free of server-only static imports
3. keep [packages/tanstack-start/src/views/TanStackAdminPage.tsx](/Users/orakhmatulin/work/payload/packages/tanstack-start/src/views/TanStackAdminPage.tsx) client-only

## Phase 5: Re-evaluate Payload-Side Workarounds

Some Payload changes made during triage may still be valid independently of TanStack.

Rule:

- do not keep a Payload change just because it delayed the next client import crash
- keep only changes that are correct on their own merits after the route boundary is fixed

## Phase 6: Resolve the API Route Warning Separately

[tanstack-app/app/routes/api.$.ts](/Users/orakhmatulin/work/payload/tanstack-app/app/routes/api.$.ts) still produces the route-tree warning that it does not export `Route`.

Treat that as a separate cleanup task:

1. verify the correct TanStack Start API route file convention for this app version
2. move or rename the file to the framework-approved location/pattern
3. ensure the fix does not put the API handler back into the client route graph

## Validation

After the rework:

1. run focused lint on the touched TanStack and Payload files
2. run `PAYLOAD_FRAMEWORK=tanstack-start pnpm run test:e2e admin-root --workers=1`
3. confirm the browser no longer crashes on server-only imports
4. only then debug real UI/test assertion failures

## Suggested Implementation Order

1. remove the browser shims
2. extract root layout server data from `RootLayout`
3. add client-safe TanStack root-shell exports/subpaths
4. update `__root.tsx` to use only client-safe static imports
5. rerun focused e2e
6. prune any Payload-side workaround that is no longer justified
7. fix the API route warning separately
