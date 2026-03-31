# AdminAdapter Pattern — Combined Design & Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple Payload CMS from Next.js by introducing an `AdminAdapter` pattern (like `DatabaseAdapter`), enabling frameworks like TanStack Start as alternatives.

**Architecture:** Two-layer abstraction — a `RouterProvider` React context replaces direct `next/navigation` imports in UI, and an `AdminAdapter` interface abstracts server-side concerns (request init, cookies, server functions, navigation primitives like `notFound`/`redirect`). Views move from `packages/next` to `packages/ui`. `packages/next` becomes a thin adapter implementation.

**Tech Stack:** TypeScript, React (RSC), Payload CMS monorepo (pnpm + Turbo)

## Table of Contents

- [Design Decisions](#design-decisions)
- [RSC Compatibility: Next.js vs TanStack Start](#rsc-compatibility-nextjs-vs-tanstack-start)
- [Package Responsibilities After Refactor](#package-responsibilities-after-refactor)
- [AdminAdapter Interface](#adminadapter-interface)
- [RouterProvider Abstraction](#routerprovider-abstraction)
- [Core Package Decoupling](#core-package-decoupling)
- [Data Flows](#data-flows)
- [TanStack Start Adapter Shape](#tanstack-start-adapter-shape)
- [Implementation Phases](#implementation-phases)
  - [Phase 1: Define AdminAdapter Interface in Core](#phase-1-define-adminadapter-interface-in-core)
  - [Phase 2: RouterProvider Abstraction](#phase-2-routerprovider-abstraction)
  - [Phase 3: Decouple Core Package](#phase-3-decouple-core-package)
  - [Phase 4: Move Views from packages/next to packages/ui](#phase-4-move-views-from-packagesnext-to-packagesui)
  - [Phase 5: Refactor packages/next to Implement AdminAdapter](#phase-5-refactor-packagesnext-to-implement-adminadapter)
  - [Phase 6: CLI and Template Changes](#phase-6-cli-and-template-changes)
  - [Phase 7: TanStack Start Proof-of-Concept](#phase-7-tanstack-start-proof-of-concept)
  - [Phase 8: Testing](#phase-8-testing)
- [Work Items Summary](#work-items-summary)
- [Dependency Graph](#dependency-graph)

---

## Design Decisions

| Decision          | Choice                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| Approach          | RouterProvider + AdminAdapter interface                                |
| React/RSC         | React-only, RSC-required                                               |
| Build plugins     | Each adapter owns its own                                              |
| Migration         | Non-breaking, auto-detect `@payloadcms/next`                           |
| Adapter name      | `AdminAdapter`                                                         |
| Views location    | Move from `packages/next` to `packages/ui`                             |
| Core decoupling   | Replace 3 Next.js imports with generic alternatives                    |
| UI decoupling     | `RouterProvider` context replaces ~38 direct `next/navigation` imports |
| Server navigation | `notFound()` / `redirect()` abstracted via adapter                     |
| Config            | `admin.adapter` field, optional (defaults to next)                     |

---

## RSC Compatibility: Next.js vs TanStack Start

Both frameworks support RSC but with different mechanisms. These differences drive the adapter contract:

| Concern          | Next.js                                       | TanStack Start                                              | Adapter Resolution                                                                 |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Server functions | `'use server'` directive                      | `createServerFn()` from `@tanstack/start`                   | `adapter.handleServerFunctions` — already abstracted via `ServerFunctionsProvider` |
| Request context  | `headers()` / `cookies()` from `next/headers` | `getWebRequest()` from `vinxi/http`                         | `adapter.initReq()` — each adapter reads request differently                       |
| `notFound()`     | Throws special error caught by Next.js        | `throw notFound()` from `@tanstack/react-router`            | `adapter.notFound()` — added to interface                                          |
| `redirect(url)`  | Throws special error caught by Next.js        | `throw redirect({ to: url })` from `@tanstack/react-router` | `adapter.redirect(url)` — added to interface                                       |
| Caching          | `unstable_cache()` / `React.cache()`          | Framework-level caching via Vinxi                           | Caching stays in adapter, not in shared views                                      |
| OG Images        | `ImageResponse` from `next/og`                | Custom implementation                                       | Stays in adapter package                                                           |
| Build config     | `withPayload()` wrapping `next.config.mjs`    | Vite plugin for `app.config.ts`                             | Each adapter owns its build plugin                                                 |

### Framework-Specific Code Audit (packages/next)

| Category                          | File Count                                               | Must Stay in Adapter                                            |
| --------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `notFound()` / `redirect()` calls | ~12 views                                                | Yes — views receive these as callbacks or adapter provides them |
| Client `next/navigation` hooks    | 7 client components in packages/next + 38 in packages/ui | No — replaced with `RouterProvider` hooks                       |
| `initReq` direct calls            | 2 views (Root, NotFound)                                 | Yes — adapter calls initReq, passes result as props             |
| `'use server'` directive          | 4 files (auth actions + Root layout)                     | Yes — server function transport is adapter-specific             |
| `next/headers` (cookies/headers)  | 7 utility files                                          | Yes — all go through adapter                                    |
| `ImageResponse` (OG)              | 1 file                                                   | Yes                                                             |

### Key Constraint

**`packages/ui` must be purely React — zero framework-specific imports.** Every `next/*` call must either:

1. Route through the `AdminAdapter` interface, or
2. Be passed as props from the adapter's server entry point

---

## Package Responsibilities After Refactor

| Package                   | Responsibility                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/payload`        | Core CMS logic + `AdminAdapter` interface + `createAdminAdapter` helper                                                                                      |
| `packages/ui`             | All React components + views (render only) + layouts + templates + `RouterProvider` context                                                                  |
| `packages/next`           | `nextAdapter()`: `initReq`, route handlers, `withPayload()`, cookies, auth actions, `notFound`/`redirect`, OG images, `RouterProvider` via `next/navigation` |
| `packages/tanstack-start` | `tanstackStartAdapter()`: same contract, TanStack-specific implementations                                                                                   |

### View Split Pattern

Views that currently call `initReq` or `notFound()`/`redirect()` are split:

```
BEFORE (in packages/next):
  DocumentView.tsx  →  calls initReq(), calls notFound(), renders UI

AFTER:
  packages/next:     DocumentEntry.tsx  →  calls initReq(), passes data as props
  packages/ui:       DocumentView.tsx   →  receives props, calls adapter.notFound() if needed, renders UI
```

For `notFound()` / `redirect()`: views receive these as functions from a `ServerNavigation` context provided by the adapter, or call `adapter.notFound()` / `adapter.redirect()` through a hook.

---

## AdminAdapter Interface

```typescript
// packages/payload/src/admin/adapter/types.ts

type AdminAdapterResult<T = BaseAdminAdapter> = {
  init: (args: { payload: Payload }) => T
  name: string
}

interface BaseAdminAdapter {
  name: string
  payload: Payload

  // Server-side request handling
  initReq: (args: {
    config: SanitizedConfig
    importMap: ImportMap
  }) => Promise<InitReqResult>

  // Cookie management
  getCookie: (name: string) => string | undefined
  setCookie: (name: string, value: string, options?: CookieOptions) => void
  deleteCookie: (name: string) => void

  // Server function dispatcher
  handleServerFunctions: ServerFunctionHandler

  // Server-side navigation (RSC)
  notFound: () => never
  redirect: (url: string) => never

  // Client-side router provider
  RouterProvider: React.ComponentType<{ children: React.ReactNode }>

  // Route handler factories for REST + GraphQL
  createRouteHandlers: (config: SanitizedConfig) => RouteHandlers

  // Optional
  generateMetadata?: (args: {
    config: SanitizedConfig
  }) => Promise<Record<string, unknown>>
  destroy?: () => void | Promise<void>
}
```

**Config usage:**

```typescript
export default buildConfig({
  db: postgresAdapter({ ... }),
  admin: {
    adapter: nextAdapter({ ... }), // optional, auto-detected
  },
})
```

### Auto-Detection (Backwards Compatibility)

1. If `admin.adapter` is explicitly set, use it
2. If not, check if `@payloadcms/next` is installed — auto-import and use as default
3. If neither, throw clear error

---

## RouterProvider Abstraction

```typescript
// packages/ui/src/providers/Router/types.ts

type RouterContextType = {
  Link: React.ComponentType<LinkProps>
  useParams: () => Record<string, string | string[]>
  usePathname: () => string
  useRouter: () => RouterInstance
  useSearchParams: () => URLSearchParams
}

type RouterInstance = {
  back: () => void
  forward: () => void
  prefetch: (url: string) => void
  push: (url: string) => void
  refresh: () => void
  replace: (url: string) => void
}
```

Replaces `next/navigation` / `next/link` imports in:

- ~38 files in `packages/ui/src/` (elements, providers, views, forms, graphics, utilities)
- ~7 client components in `packages/next/src/` (moved to packages/ui)

---

## Core Package Decoupling

| Import                   | File                                                   | Resolution                                                   |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------------------------ |
| `@next/env`              | `packages/payload/src/bin/loadEnv.ts`                  | Replace with `dotenv` + `dotenv-expand`                      |
| `Metadata` from `'next'` | `packages/payload/src/config/types.ts`                 | Define `PayloadMetadata` type (subset Payload actually uses) |
| `ReadonlyRequestCookies` | `packages/payload/src/utilities/getRequestLanguage.ts` | Remove from union — callers pass `Map<string, string>`       |

---

## Data Flows

**Admin page request:**

```
Request → Framework route handler
  → adapter.initReq() (framework-specific: reads headers/cookies)
    → PayloadRequest
      → View (packages/ui) renders with data as props
        → Components use RouterProvider for navigation
        → Views use adapter.notFound() / adapter.redirect() for server navigation
```

**Server function call (e.g., form state):**

```
UI calls useServerFunctions().getFormState()
  → ServerFunctionsProvider → adapter.handleServerFunctions()
    → adapter.initReq()
      → Dispatches to handler (buildFormStateHandler, etc.)
        → Returns result
```

---

## TanStack Start Adapter Shape

```typescript
export function tanstackStartAdapter(args?: TanStackStartArgs): AdminAdapterResult {
  return {
    name: 'tanstack-start',
    init: ({ payload }) => createAdminAdapter({
      name: 'tanstack-start',
      payload,
      initReq:               // vinxi getWebRequest / getEvent
      getCookie:             // vinxi/http getCookie
      setCookie:             // vinxi/http setCookie
      deleteCookie:          // vinxi/http deleteCookie
      handleServerFunctions: // TanStack createServerFn() wrapper
      notFound:              // throw notFound() from @tanstack/react-router
      redirect:              // throw redirect({ to: url }) from @tanstack/react-router
      RouterProvider:        // @tanstack/react-router hooks + Link
      createRouteHandlers:   // Vinxi API routes
    })
  }
}
```

Build plugin as separate export:

```typescript
// user's app.config.ts
import { withPayload } from '@payloadcms/tanstack-start/vite'
export default withPayload(defineConfig({ ... }))
```

---

## Implementation Phases

### Phase 1: Define AdminAdapter Interface in Core

#### Task 1: Create AdminAdapter types

**Files:**

- Create: `packages/payload/src/admin/adapter/types.ts`

Write the `BaseAdminAdapter`, `AdminAdapterResult`, `CookieOptions`, `RouteHandler`, `RouteHandlers` types as shown in the interface section above. Include `notFound` and `redirect` in the interface.

**Commit:** `feat: define AdminAdapter types`

#### Task 2: Create createAdminAdapter helper

**Files:**

- Create: `packages/payload/src/admin/adapter/createAdminAdapter.ts`
- Create: `packages/payload/src/admin/adapter/index.ts` (barrel export)
- Modify: `packages/payload/src/index.ts` (add public exports)

Factory helper modeled after `packages/payload/src/database/createDatabaseAdapter.ts`.

**Commit:** `feat: add createAdminAdapter helper and exports`

#### Task 3: Add adapter field to Config types

**Files:**

- Modify: `packages/payload/src/config/types.ts`

Add `adapter?: AdminAdapterResult` to the `admin` block (around line 820). Add the import for `AdminAdapterResult`.

**Commit:** `feat: add admin.adapter field to Config type`

#### Task 4: Wire adapter initialization into Payload lifecycle

**Files:**

- Modify: `packages/payload/src/index.ts` (around line 881)

Add `adminAdapter?: BaseAdminAdapter` property to Payload class. After db init, add:

```typescript
if (this.config.admin?.adapter) {
  this.adminAdapter = this.config.admin.adapter.init({ payload: this })
  this.adminAdapter.payload = this
}
```

**Commit:** `feat: wire AdminAdapter initialization into Payload lifecycle`

---

### Phase 2: RouterProvider Abstraction

#### Task 5: Create RouterProvider context in packages/ui

**Files:**

- Create: `packages/ui/src/providers/Router/types.ts`
- Create: `packages/ui/src/providers/Router/index.tsx`
- Modify: `packages/ui/src/exports/client/index.ts` (add exports)

Create `RouterContext`, `RouterProvider`, and hook wrappers (`useRouter`, `usePathname`, `useSearchParams`, `useParams`, `Link`) that read from context.

**Commit:** `feat(ui): add RouterProvider context and navigation hooks`

#### Task 6: Add RouterProvider to RootProvider tree

**Files:**

- Modify: `packages/ui/src/providers/Root/index.tsx`

Add optional `router?: RouterContextType` prop. Wrap with `<RouterProvider>` when provided. Keep backwards compatibility when not provided.

**Commit:** `feat(ui): integrate RouterProvider into RootProvider tree`

#### Task 7: Refactor UI files to use RouterProvider hooks

**Files:**

- Modify: ~38 files in `packages/ui/src/`

Mechanical refactoring — replace all `import { useRouter } from 'next/navigation.js'` with `import { useRouter } from '../../providers/Router/index.js'` (adjust paths). Do in batches of ~10, build between batches.

Full file list in implementation plan appendix.

**Commit:** `refactor(ui): replace next/navigation imports with RouterProvider hooks`

---

### Phase 3: Decouple Core Package

#### Task 8: Replace @next/env with dotenv

**Files:**

- Modify: `packages/payload/src/bin/loadEnv.ts`
- Modify: `packages/payload/package.json`

Replace `@next/env` with `dotenv` + `dotenv-expand`. Support same .env file priority (.env, .env.local, .env.development, .env.production).

**Commit:** `refactor: replace @next/env with dotenv in core package`

#### Task 9: Replace Metadata type with PayloadMetadata

**Files:**

- Modify: `packages/payload/src/config/types.ts`

Remove `import type { Metadata } from 'next'`. Define `PayloadMetadata` type covering the subset Payload uses (title, description, openGraph, icons, twitter). Change `MetaConfig` from `& DeepClone<Metadata>` to `& PayloadMetadata`.

**Commit:** `refactor: replace Next.js Metadata type with PayloadMetadata`

#### Task 10: Remove ReadonlyRequestCookies from core

**Files:**

- Modify: `packages/payload/src/utilities/getRequestLanguage.ts`
- Modify: `packages/ui/src/utilities/getRequestLanguage.ts` (if same import exists)

Remove `ReadonlyRequestCookies` type. Change parameter to `cookies: Map<string, string>`. Adapters convert their cookie format to Map before calling core.

**Commit:** `refactor: remove ReadonlyRequestCookies Next.js type from core`

#### Task 11: Remove 'next' from packages/payload dependencies

**Files:**

- Modify: `packages/payload/package.json`

Verify zero `next` / `@next/*` imports remain, then remove from deps/peerDeps.

**Commit:** `chore: remove next dependency from core payload package`

---

### Phase 4: Move Views from packages/next to packages/ui

**Complexity: High** — this is the hardest phase due to RSC framework differences.

#### Task 12: Split views into server entry + render component

Views that call `initReq`, `notFound()`, or `redirect()` must be split:

**Server entry (stays in packages/next):** Calls `initReq()`, fetches data, handles `notFound()`/`redirect()` at the framework level, passes results as props.

**Render component (moves to packages/ui):** Receives data as props, renders UI. Uses `adapter.notFound()` / `adapter.redirect()` from a `ServerNavigation` hook/context only when needed for post-init logic.

**Views requiring split (~12):**

| View              | Uses `initReq` | Uses `notFound()` | Uses `redirect()` |
| ----------------- | -------------- | ----------------- | ----------------- |
| Root              | Yes            | Yes               | Yes               |
| NotFound          | Yes            | -                 | -                 |
| Document          | -              | Yes               | Yes               |
| Account           | -              | Yes               | -                 |
| List              | -              | Yes               | -                 |
| Login             | -              | -                 | Yes               |
| BrowseByFolder    | -              | Yes               | Yes               |
| CollectionFolders | -              | Yes               | Yes               |
| CollectionTrash   | -              | Yes               | -                 |
| Version           | -              | Yes               | -                 |
| Versions          | -              | Yes               | -                 |

**Views that can move cleanly:** Dashboard, Edit, CreateFirstUser, ForgotPassword, ResetPassword, Logout, Verify, Unauthorized, API.

**Client components (~7) that need RouterProvider swap:** TabLink, Nav client, LogoutClient, ResetPasswordForm, Verify client, API client, CreatedAtCell — same mechanical refactoring as Task 7.

**Step 1:** Create `ServerNavigation` context in packages/ui for `notFound()` / `redirect()`:

```typescript
// packages/ui/src/providers/ServerNavigation/index.tsx
const ServerNavigationContext = createContext<{
  notFound: () => never
  redirect: (url: string) => never
}>()
```

Populated by the adapter at the root layout level.

**Step 2:** For each view requiring split, extract the render component to packages/ui. The server entry in packages/next becomes thin:

```typescript
// packages/next/src/views/Document/index.tsx (stays in adapter)
import { DocumentView } from '@payloadcms/ui/views'
import { initReq } from '../../utilities/initReq.js'
import { notFound, redirect } from 'next/navigation.js'

export async function DocumentEntry(props) {
  const { req, permissions } = await initReq(...)
  const doc = await payload.findByID(...)
  if (!doc) notFound()
  if (!permissions.canRead) redirect('/admin/unauthorized')
  return <DocumentView doc={doc} permissions={permissions} {...props} />
}
```

**Step 3:** Update packages/next export files to re-export from packages/ui for backwards compat.

**Step 4:** Move client components, apply RouterProvider hook swap.

**Commit:** `refactor: split views into server entries (adapter) and render components (ui)`

---

### Phase 5: Refactor packages/next to Implement AdminAdapter

#### Task 13: Create nextAdapter() factory function

**Files:**

- Create: `packages/next/src/adapter/index.ts`
- Create: `packages/next/src/adapter/RouterProvider.tsx`
- Modify: `packages/next/src/index.js`

Implement `nextAdapter()` returning `AdminAdapterResult`. Wire existing `initReq`, `handleServerFunctions`, cookie helpers. Create `NextRouterProvider` wrapping `next/navigation` hooks. Implement `notFound` and `redirect` using `next/navigation`.

**Commit:** `feat(next): create nextAdapter() implementing AdminAdapter interface`

#### Task 14: Wire NextRouterProvider into Root Layout

**Files:**

- Modify: `packages/next/src/layouts/Root/index.tsx`

Pass router context and `ServerNavigation` (notFound/redirect) to RootProvider.

**Commit:** `feat(next): wire NextRouterProvider into admin root layout`

---

### Phase 6: CLI and Template Changes

#### Task 15: Add --framework flag to create-payload-app

**Files:**

- Modify: `packages/create-payload-app/src/types.ts` (add `FrameworkType`, `--framework` arg)
- Modify: `packages/create-payload-app/src/main.ts` (add flag + alias, call framework prompt)
- Create: `packages/create-payload-app/src/lib/select-framework.ts` (prompt logic)

Add `--framework next|tanstack-start` flag (alias `-f`). Add interactive prompt similar to database selection. Default: `next`.

**Commit:** `feat(create-payload-app): add --framework flag and framework selection prompt`

#### Task 16: Update templates for framework support

**Files:**

- Create: `templates/blank-tanstack-start/` (TanStack Start blank template)
- Modify: `packages/create-payload-app/src/lib/templates.ts` (framework filtering)
- Modify: `packages/create-payload-app/src/lib/ast/payload-config.ts` (adapter imports)
- Modify: `packages/create-payload-app/src/lib/create-project.ts` (pass framework)

Separate template directories per framework (different project structure). Update AST to insert correct adapter import and config.

**Commit:** `feat(create-payload-app): add framework-specific templates and AST config`

---

### Phase 7: TanStack Start Proof-of-Concept

#### Task 17: Scaffold packages/tanstack-start

**Files:**

- Create: `packages/tanstack-start/package.json`
- Create: `packages/tanstack-start/src/index.ts`
- Create: `packages/tanstack-start/src/adapter/index.ts`
- Create: `packages/tanstack-start/src/adapter/RouterProvider.tsx`
- Create: `packages/tanstack-start/src/adapter/initReq.ts`
- Create: `packages/tanstack-start/src/vite/index.ts` (withPayload Vite plugin)

Implement full `AdminAdapterResult` using:

- `vinxi/http` for request context and cookies
- `@tanstack/start` `createServerFn()` for server functions
- `@tanstack/react-router` hooks for RouterProvider
- `@tanstack/react-router` `notFound()` / `redirect()` for server navigation

**Commit:** `feat: scaffold @payloadcms/tanstack-start adapter package`

---

### Phase 8: Testing

#### Task 18: Verify packages/next works identically

Run full test suite — all existing tests must pass unchanged:

```bash
pnpm run test:int
pnpm run test:e2e
pnpm run dev  # manual smoke test
```

#### Task 19: Add adapter-specific integration tests

**Files:**

- Create: `test/admin-adapter/config.ts`
- Create: `test/admin-adapter/int.spec.ts`

Test: explicit adapter config works, auto-detection works, missing adapter errors clearly, `payload.adminAdapter` is set.

**Commit:** `test: add AdminAdapter integration tests`

#### Task 20: Refactor e2e test architecture for multi-framework support

The current e2e test suite (Playwright) is tightly coupled to Next.js — the test harness spins up a Next.js dev server and tests assume Next.js routing behavior. This needs to become framework-agnostic.

**Current architecture:**

- Test harness starts a Next.js dev server per test suite
- Playwright navigates `localhost:3000/admin`
- Tests assume Next.js route transitions, loading states, error pages

**Target architecture:**

**Step 1: Abstract the dev server harness**

Create a `FrameworkTestHarness` interface:

```ts
interface FrameworkTestHarness {
  start(config: PayloadTestConfig): Promise<{ url: string }>
  stop(): Promise<void>
}
```

Each adapter provides its own harness:

- `@payloadcms/next` → starts Next.js dev server (existing behavior)
- `@payloadcms/tanstack-start` → starts Vinxi dev server

The harness is selected via `PAYLOAD_FRAMEWORK` env var (defaults to `next`).

**Step 2: Make tests framework-agnostic**

- Remove any assertions that depend on Next.js-specific behavior (route transition animations, specific error page markup, etc.)
- Tests should assert on Payload admin UI behavior, not framework behavior
- Use `data-testid` attributes and accessibility snapshots rather than framework-specific selectors

**Step 3: Run e2e matrix in CI**

Update `.github/workflows/main.yml` to run e2e tests against each framework:

```yaml
strategy:
  matrix:
    framework: [next, tanstack-start]
env:
  PAYLOAD_FRAMEWORK: ${{ matrix.framework }}
```

**Step 4: Shared vs adapter-specific e2e tests**

- **Shared tests** (~90%): Admin panel CRUD, navigation, auth, forms — these should work identically on any framework
- **Adapter-specific tests** (~10%): Framework-specific features like Next.js OG images, metadata, build config

```
test/
├── e2e/
│   ├── shared/          # framework-agnostic admin tests
│   ├── next/            # Next.js-specific e2e tests
│   └── tanstack-start/  # TanStack Start-specific e2e tests
```

**Commit:** `test: refactor e2e test architecture for multi-framework support`

---

## Work Items Summary

| Work Item                                                             | Complexity       | Phase |
| --------------------------------------------------------------------- | ---------------- | ----- |
| Define `AdminAdapter` interface (with `notFound`/`redirect`)          | Medium           | 1     |
| Create `createAdminAdapter` helper + exports                          | Low              | 1     |
| Add `admin.adapter` to Config types                                   | Low              | 1     |
| Wire adapter into Payload init lifecycle                              | Low              | 1     |
| Create `RouterProvider` context + hooks in `packages/ui`              | Low              | 2     |
| Add `RouterProvider` to `RootProvider` tree                           | Low              | 2     |
| Refactor ~45 UI files to use `RouterProvider` (38 existing + 7 moved) | Low (mechanical) | 2     |
| Replace `@next/env` with `dotenv`                                     | Low              | 3     |
| Replace `Metadata` type with `PayloadMetadata`                        | Low              | 3     |
| Remove `ReadonlyRequestCookies` from core                             | Trivial          | 3     |
| Remove `next` from core dependencies                                  | Trivial          | 3     |
| Split ~12 views into server entry + render component                  | **High**         | 4     |
| Move clean views + client components to packages/ui                   | Medium           | 4     |
| Create `ServerNavigation` context for `notFound`/`redirect`           | Medium           | 4     |
| Refactor `packages/next` to implement `AdminAdapter`                  | **High**         | 5     |
| Wire `NextRouterProvider` into root layout                            | Low              | 5     |
| CLI `--framework` flag + framework selection prompt                   | Medium           | 6     |
| Framework-specific templates                                          | Medium-High      | 6     |
| Scaffold `@payloadcms/tanstack-start`                                 | **High**         | 7     |
| Testing — integration + adapter-specific                              | Medium           | 8     |
| Testing — refactor e2e architecture for multi-framework               | **High**         | 8     |
| Testing — CI matrix for framework e2e                                 | Medium           | 8     |

## Dependency Graph

```
Phase 1 (Tasks 1-4): Foundation
    ↓
Phase 2 (Tasks 5-7) ──parallel──  Phase 3 (Tasks 8-11)
    ↓                                  ↓
Phase 4 (Task 12): Split & move views  ← depends on both
    ↓
Phase 5 (Tasks 13-14): Refactor packages/next
    ↓
Phase 6 (Tasks 15-16): CLI + Templates  ← can start after Phase 1
    ↓
Phase 7 (Task 17): TanStack Start PoC  ← depends on Phase 5
    ↓
Phase 8 (Tasks 18-19): Testing  ← depends on all
```

**Parallelizable:** Phase 2 + Phase 3. Phase 6 can start early (after Phase 1).
