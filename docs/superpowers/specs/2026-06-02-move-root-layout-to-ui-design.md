# Move RootLayout from `packages/next` to `packages/ui`

**Date:** 2026-06-02
**Status:** Approved (design)

## Goal

Decouple the admin `RootLayout` from Next.js so the heavy implementation lives in `@payloadcms/ui` and can be consumed by any React framework that supplies a `ServerAdapter`. `packages/next` keeps a thin wrapper that injects Next-specific bits (fonts, router adapter) so existing apps continue to work with no code changes.

## Constraints

- `packages/ui` currently has **zero** dependency on `next` or `@payloadcms/next`. Preserve that boundary — no `next/*` imports introduced in ui.
- Existing public API `import { RootLayout } from '@payloadcms/next/layouts'` keeps working for current Next.js apps with **no behavior change**. Dependency checking runs inside ui `RootLayout`; the Next wrapper supplies its framework-specific constraints (Next ≥ 15.0.0) via the `additionalDependencyChecks` prop.
- `'use server'` directive inside `RootLayout` continues to work — `packages/ui` exports source files, so the consuming Next.js compiler processes the directive.

## New file layout

### `packages/ui` — added

- `packages/ui/src/layouts/Root/index.tsx` — framework-agnostic `RootLayout` (heavy logic).
- `packages/ui/src/layouts/Root/NestProviders.tsx` — moved verbatim.
- `packages/ui/src/utilities/initReq.ts` — uses `config.server.getHeaders()` from `ServerAdapter`.
- `packages/ui/src/utilities/getRequestTheme.ts` — uses `CookieStore` type from payload (drops Next-internal `ReadonlyRequestCookies`).
- `packages/ui/src/utilities/getRequestHighContrast.ts` — same type cleanup.
- `packages/ui/src/utilities/selectiveCache.ts` — pure React-`cache` util, moved.
- `packages/ui/src/utilities/getRequestLocale.ts` — moved.
- `packages/ui/src/utilities/getPreferences.ts` — moved.
- `packages/ui/src/utilities/checkDependencies.ts` — generic gating + React/react-dom version checks. Accepts an optional `additional: CheckDependenciesArgs` parameter for framework-specific dep groups/versions.
- `packages/ui/src/exports/layouts.ts` — new barrel exporting `metadata` and `RootLayout` from `../layouts/Root/index.js`.
- `packages/ui/package.json` — new `"./layouts"` export entry. Add `"./utilities/initReq"` export if `@payloadcms/next` needs to import it directly.

### `packages/next` — modified

- `packages/next/src/adapters/layout.tsx` — new thin wrapper (relocated from `packages/next/src/layouts/Root/index.tsx`): loads `Inter`/`Roboto_Mono` via `next/font/google`, imports `NextRouterAdapter` and `nextServerAdapter`, delegates to `UIRootLayout`. Re-exports `metadata`. Passes Next-specific `additionalDependencyChecks` (Next ≥ 15.0.0) into ui RootLayout. Sits next to existing flat adapters (`router.tsx`, `server.ts`).
- `packages/next/src/utilities/checkDependencies.ts` — **deleted**. Generic gating + React/react-dom version checks now live in `packages/ui/src/utilities/checkDependencies.ts`. Framework-specific constraints flow via the `additionalDependencyChecks` prop on ui `RootLayout`.
- `packages/next/src/layouts/` — directory removed.
- `packages/next/src/esbuildEntry.ts` — `RootLayout` re-export points at the new `./adapters/layout.js` path.
- `packages/next/src/utilities/initReq.ts` — **deleted**.
- `packages/next/src/utilities/getRequestTheme.ts` — **deleted**.
- `packages/next/src/utilities/getRequestHighContrast.ts` — **deleted**.
- `packages/next/src/utilities/selectiveCache.ts` — **deleted**.
- `packages/next/src/utilities/getRequestLocale.ts` — **deleted**.
- `packages/next/src/utilities/getPreferences.ts` — **deleted**.
- `packages/next/src/utilities/handleServerFunctions.ts` — update `initReq` import to `@payloadcms/ui/utilities/initReq`.
- `packages/next/src/views/NotFound/index.tsx` — update `initReq` import.
- `packages/next/src/views/Root/index.tsx` — update `initReq` and `getPreferences` imports.
- `packages/next/src/views/Document/index.tsx` — update `getPreferences` import.
- `packages/next/src/views/Dashboard/Default/ModularDashboard/utils/getItemsFromPreferences.ts` — update `getPreferences` import.
- `packages/next/src/exports/layouts.ts` — `metadata` + `RootLayout` re-export updated to point at `../adapters/layout.js`. Still exports `handleServerFunctions`.

## API surface

### ui — new public API

```typescript
type Font = { className?: string; variable?: string }

type RootLayoutProps = {
  readonly additionalDependencyChecks?: CheckDependenciesArgs
  readonly children: React.ReactNode
  readonly config: Promise<SanitizedConfig>
  readonly fonts?: Font[]
  readonly head?: React.ReactNode
  readonly htmlProps?: React.HtmlHTMLAttributes<HTMLHtmlElement>
  readonly importMap: ImportMap
  readonly RouterAdapter: React.FC<{ children: React.ReactNode }>
  readonly serverAdapter: ServerAdapter
  readonly serverFunction: ServerFunctionClient
}

export { metadata, RootLayout } from '@payloadcms/ui/layouts'
```

### next — thin wrapper (signature unchanged for callers)

```tsx
import { RootLayout as UIRootLayout } from '@payloadcms/ui/layouts'
import { Inter, Roboto_Mono } from 'next/font/google'

import { NextRouterAdapter } from './router.js'
import { nextServerAdapter } from './server.js'

const inter = Inter({ subsets: ['latin'], variable: '--font-family-sans' })
const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-family-mono',
})

const nextDependencyChecks = {
  dependencyVersions: {
    next: { required: false, version: '>=15.0.0' },
  },
}

export { metadata } from '@payloadcms/ui/layouts'

type Props = Omit<
  React.ComponentProps<typeof UIRootLayout>,
  'additionalDependencyChecks' | 'fonts' | 'RouterAdapter' | 'serverAdapter'
>

export const RootLayout = (props: Props) => (
  <UIRootLayout
    {...props}
    additionalDependencyChecks={nextDependencyChecks}
    fonts={[
      { className: inter.className, variable: inter.variable },
      { className: robotoMono.className, variable: robotoMono.variable },
    ]}
    RouterAdapter={NextRouterAdapter}
    serverAdapter={nextServerAdapter}
  />
)
```

## Behavior changes inside ui `RootLayout`

Compared to current implementation:

1. **Fonts.** Drops `next/font` import and the local `inter`/`robotoMono` constants. Reads them from `props.fonts`. Each entry's `variable ?? className` is merged into the `<html>` class list.
2. **Server action for language switching.** Inlined `'use server'` function. Body uses the `serverAdapter.setCookie(...)` prop (closed over) instead of `next/headers` `cookies().set(...)`.
3. **`NextRouterAdapter` and `nextServerAdapter` imports removed.** Both become required props (`RouterAdapter` and `serverAdapter`); passed into `RootProvider` and `initReq` respectively.
4. **`checkDependencies()` lives in ui.** The universal React/react-dom check runs inside ui `RootLayout`. Framework adapters add their own constraints via the `additionalDependencyChecks` prop.
5. **Internal imports.** Relative paths to `RootProvider`, `ProgressBar`, `getNavPrefs`, `getClientConfig` (no `@payloadcms/ui/*` self-references).

## `initReq` decoupling

Today (`packages/next/src/utilities/initReq.ts`):

```typescript
import { headers as getHeaders } from 'next/headers.js'
// ...
const headers = await getHeaders()
const cookies = parseCookies(headers)
```

After move to `packages/ui/src/utilities/initReq.ts`:

```typescript
const headers = await serverAdapter.getHeaders()
const cookies = parseCookies(headers)
```

The `serverAdapter` is added as a new required argument to `initReq` (alongside `configPromise`, `importMap`, `key`, etc.). Inside `createLocalReq`, `req.server = serverAdapter`. The Next-side wrapper supplies `nextServerAdapter`; the same value flows through `handleServerFunctions` for server-function dispatch.

`selectiveCache`, `getRequestLocale`, `getPreferences` move alongside since they form `initReq`'s import chain and are framework-pure (`react` `cache()` only).

## Caller migration

### Existing Next.js apps

No change required. `import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'` still works. Dependency checking still runs (now invoked inside ui `RootLayout` with the Next wrapper supplying its `additionalDependencyChecks`).

### Non-Next frameworks

```tsx
import { RootLayout } from '@payloadcms/ui/layouts'
;<RootLayout
  config={config}
  importMap={importMap}
  fonts={[{ className: '...', variable: '--font-family-sans' }]}
  RouterAdapter={MyFrameworkRouterAdapter}
  serverFunction={serverFunction}
>
  {children}
</RootLayout>
```

Caller must also supply `config.server` (`ServerAdapter`) with `getHeaders`, `getCookies`, `setCookie`, `redirect`, `notFound`, etc.

## Testing + verification

- `pnpm run build:ui` and `pnpm run build:next` — no type errors, no missing exports.
- `pnpm run dev` — admin UI mounts. Inspect `<html>` for both `--font-family-sans` and `--font-family-mono` variables. Theme cookie toggle, language switcher, nav state persistence.
- `pnpm prepare-run-test-against-prod` + `pnpm dev:prod fields` — production build. Catches client/server boundary mistakes that dev mode hides.
- `pnpm run test:int fields` — integration sanity.
- `pnpm run test:e2e fields` — one e2e suite end-to-end.
- Playwright MCP visual check on admin home + a collection list/edit view.

## Out of scope

- Refactoring `NextRouterAdapter`. Stays as-is.
- `handleServerFunctions` moves to ui. Stays in `packages/next` (references Next-specific view handlers).
- Cleaning up other Next-coupled utilities (`setPayloadAuthCookie`, `getExistingAuthToken`, `getNextRequestI18n`). Separate effort.
- Adding a non-Next reference framework adapter. Future work.

## Changelog entry

```
- RootLayout implementation moved to @payloadcms/ui/layouts. Existing
  `import { RootLayout } from '@payloadcms/next/layouts'` continues to
  work unchanged via a thin Next-side wrapper that injects fonts and
  the Next router adapter and runs the peer-dependency version check.

- Non-Next consumers can now use the framework-agnostic RootLayout from
  @payloadcms/ui/layouts directly, supplying `fonts` and `RouterAdapter`
  props and a `ServerAdapter` on the config.
```
