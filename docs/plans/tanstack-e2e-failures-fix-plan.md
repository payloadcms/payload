# Plan: Fixing TanStack Start E2E Test Failures and RSC Support

> Created: 2026-05-08
> Context: [CI Run #25546218920](https://github.com/payloadcms/payload/actions/runs/25546218920/job/74983023672?pr=16139) — build failure + E2E failures
> PR: [#16139](https://github.com/payloadcms/payload/pull/16139)

## Current State

### Build Failure (Blocking Everything)

The CI run fails at the `build` step before any E2E tests can run:

```
@payloadcms/next#build exited (1)
```

Root cause: The merge introduced references to deleted `withPayload.utils.js` exports in `@payloadcms/next`. The fix commit (`0ade1c2dd5`) landed but CI ran against the prior SHA.

### E2E Failures (From Previous Runs)

From the [last full E2E run](https://github.com/payloadcms/payload/actions/runs/24223922017) (2026-04-10):

| Framework        | Success | Failed | Success Rate |
| ---------------- | ------- | ------ | ------------ |
| `next`           | 95/102  | 7      | 93.1%        |
| `tanstack-start` | 4/102   | 82     | **3.9%**     |

Only 4 suites pass: `_community`, `bulk-edit (1/2)`, `hooks`, `queues`

### Three Distinct Failure Categories

1. **Browser runtime crash** (~70 suites): `scheduler` CJS/ESM interop failure — **already fixed** (version bump + `optimizeDeps.include` + `resolve.dedupe`)
2. **Import map resolution** (~5 suites): Plugin client entrypoints not resolvable from `tanstack-app/src/importMap.js`
3. **RSC / custom server component gaps** (~50+ tests skipped): Custom components that are server components never receive `serverProps`

---

## Fundamental Issue: RSC Support in TanStack Start vs Next.js

### How Next.js Handles RSC (The Gold Standard)

Next.js provides **native RSC support at the framework level**:

1. **Server-first component tree**: Components are server components by default. The bundler (Turbopack/webpack) handles the `'use client'` boundary automatically.
2. **Direct rendering**: `RenderServerComponent` in `packages/next` can directly render `<Component {...serverProps} {...clientProps} />` because the entire render happens in an RSC context.
3. **Transparent bundling**: Next.js compiler knows which modules are server-only and which are client. Users never configure Vite/webpack manually.
4. **Import map is simple**: A single `importMap.js` file that imports both server and client components. The framework resolves which environment runs each.

```
User writes a server component → registers in config → import map imports it →
RenderServerComponent checks $$typeof → passes serverProps → renders in RSC tree
```

Users don't need to know about bundler internals. They write a component, register it, and it works.

### How TanStack Start Handles RSC (Fundamentally Different Model)

TanStack Start (as of v1.120+) has **experimental RSC** via `@vitejs/plugin-rsc` + Vite 7:

1. **Client-first tree**: The router owns a client-side tree. RSCs are "data" fetched via `createServerFn` and decoded from Flight streams.
2. **Explicit server functions**: Server components must be rendered inside `createServerFn` handlers using `renderServerComponent()`. You cannot just render `<ServerComponent />` in a route component.
3. **Manual bundling boundaries**: Vite's RSC plugin handles `'use client'` boundaries, but requires explicit configuration of which modules are server-only (the `importProtection` config in our Vite plugin).
4. **Two environments**: Vite creates separate `rsc` and `client` module graphs. Server-only code must not leak into the client graph.

```
User writes a server component → registers in config → import map imports it →
BUT: the import map runs in the client environment → server component cannot be
rendered there → need a server function to pre-render it → serialize the output →
pass to client as data
```

### The Core Problem

In Next.js, the import map file (`importMap.js`) can safely import both server and client components because Next.js's bundler resolves them in the correct environment transparently. The `RenderServerComponent` function runs in the RSC environment.

In TanStack Start:

- `importMap.js` runs in the **client** environment (it's loaded by `AdminPageView`, a `'use client'` component)
- Server components imported in the client environment either:
  - Get tree-shaken to client references (if `@vitejs/plugin-rsc` is configured correctly), OR
  - Cause a bundling error because they import `node:` modules or server-only packages
- The `importMap.server.ts` exists but is a thin re-export of the client map — it doesn't actually provide separate server-side resolution

**This means: users cannot simply write a server component, register it in the config, and have it work. The current architecture requires workarounds that break the Payload developer experience.**

### What Users Should NOT Have to Do

- Modify their `vite.config.ts` to add server-only modules to `importProtection`
- Manually split their components into server/client pairs
- Use `createServerFn` directly in their custom components
- Understand Vite's RSC module graph separation
- Configure `ssr.external` or `optimizeDeps.exclude` for their own dependencies

---

## Fix Plan

### Phase 0: Fix the Build (Immediate — Unblocks CI)

**Status**: Already fixed by commit `0ade1c2dd5`

- Removed references to deleted `withPayload.utils.js` exports
- Need to verify CI passes with this fix

### Phase 1: Fix Import Map Resolution for Plugins

**Problem**: Plugin client entrypoints (e.g. `@payloadcms/plugin-form-builder/client`) are not resolvable from `tanstack-app/src/importMap.js`.

**Root Cause**: The import map generator creates import paths like `@payloadcms/plugin-form-builder/client#FormBuilder`. These paths must be resolvable by Vite in the client environment. If the plugin package doesn't properly expose a `/client` export condition that Vite can resolve, the import fails.

**Fix**:

1. Ensure all `@payloadcms/plugin-*` packages have correct `exports` field entries for their `/client` subpath
2. Add plugin packages to `ssr.noExternal` in the Vite config so Vite processes them (already partially done: `noExternal: [/^@payloadcms\/plugin-/, /^@payloadcms\/storage-/]`)
3. Add a Vite `resolve.alias` fallback that resolves `/client` subpaths to the package's `src/exports/client.ts` in the monorepo dev environment
4. Test with the plugin-form-builder and plugin-seo suites

**Files to modify**:

- `packages/tanstack-start/src/vite/plugin.ts` — add resolution logic
- Possibly individual plugin `package.json` files

### Phase 2: Remove `importMap.server.ts` — Single Import Map with RSC Plugin Boundaries

**Problem (as initially perceived)**: A single `importMap.js` imports both server components (which use `node:` APIs, `payload` instance, etc.) and client components. Wouldn't this break the client bundle?

**Why it's actually fine**: `@vitejs/plugin-rsc` already handles this. When RSC is enabled, Vite creates separate module graphs:

- **In the RSC/server environment**: All imports resolve normally — server components are real modules with full access to Node.js, `payload`, etc.
- **In the client environment**: The RSC plugin automatically transforms server component imports into **client reference proxies** (lightweight stubs that tell React to fetch the real output from the server).

This is exactly how Next.js works — a single `importMap.js` exists, and the bundler handles the boundary. We should follow the same model.

**Solution**: Remove `importMap.server.ts` entirely. Use `importMap.js` everywhere.

**Changes**:

1. Delete `tanstack-app/src/importMap.server.ts`
2. Update `tanstack-app/src/functions/admin.functions.tsx` to import directly from `../importMap.js` instead of `../importMap.server.js`
3. Remove `./src/importMap.server.ts` from Vite plugin's `server.warmup.clientFiles`
4. Ensure the `importProtection.ignoreImporters` pattern still covers `importMap.js` (it already does)

**Prerequisite**: The RSC plugin must be properly configured so that server component modules (those without `'use client'`) are correctly transformed to client references in the client graph. Verify this works for:

- `@payloadcms/richtext-lexical/rsc` exports
- `@payloadcms/next/rsc` exports (like `CollectionCards`)
- User custom server components (plain `.tsx` without `'use client'`)

**Files to modify**:

- `tanstack-app/src/importMap.server.ts` — delete
- `tanstack-app/src/functions/admin.functions.tsx` — import from `../importMap.js`
- `packages/tanstack-start/src/vite/plugin.ts` — remove `importMap.server.ts` from warmup
- `packages/tanstack-start/src/utilities/importMap.ts` — update `getImportMapOutputPath` docs

### Phase 3: Implement RSC Pre-Rendering in Server Functions

**Problem**: Custom server components need `serverProps` (payload instance, i18n, user, permissions, req) which are only available on the server. The current adapter passes `RenderClientComponent` which drops all server props.

**Solution**: Two-pass rendering using TanStack Start's `renderServerComponent`:

**Pass 1 — Server (in `getAdminPageData`)**:

```typescript
// For each PayloadComponent reference that resolves to a server component:
import { renderServerComponent } from '@tanstack/react-start/rsc'

const resolvedComponent = getFromImportMap({ importMap: serverImportMap, PayloadComponent: ref })

if (isReactServerComponentOrFunction(resolvedComponent)) {
  const rendered = await renderServerComponent(
    <resolvedComponent {...serverProps} {...clientProps} />
  )
  preRenderedMap[componentKey] = rendered
}
```

**Pass 2 — Client (in `AdminView`)**:

```typescript
// The ComponentRenderer checks the pre-rendered map first
const renderComponent: ComponentRenderer = ({
  Component,
  serverProps,
  clientProps,
  importMap,
}) => {
  const key = getComponentKey(Component)
  if (preRenderedMap[key]) {
    return preRenderedMap[key] // Already rendered on server as Flight stream
  }
  // Fall back to client-only rendering
  return RenderClientComponent({ Component, clientProps, importMap })
}
```

**Key insight**: This is already partially implemented! The `admin.functions.tsx` file already does this for custom views:

```typescript
if (customViewRenderContext) {
  const rscRendered = await renderServerComponent(
    <CustomComponent initPageResult={initPageResult} />
  )
  serialized.customViewRendered = rscRendered
}
```

We need to generalize this pattern to ALL server component slots (labels, descriptions, cells, beforeList, afterList, providers, etc.).

**Files to modify**:

- `packages/tanstack-start/src/views/Root/index.tsx` — scan for server components and pre-render them
- `packages/tanstack-start/src/views/AdminView.tsx` — accept pre-rendered map via props/context
- `packages/tanstack-start/src/rsc/renderPayloadRSC.tsx` — become the main RSC-aware renderer
- `tanstack-app/src/functions/admin.functions.tsx` — pass pre-rendered results

### Phase 4: Dynamic RSC Rendering for Post-Load Components

**Problem**: Some components are rendered after initial page load (e.g., opening a drawer, changing form state triggers re-render of field labels/descriptions). These can't be pre-rendered in `getAdminPageData`.

**Solution**: A dedicated server function for on-demand RSC rendering:

```typescript
// packages/tanstack-start/src/rsc/renderOnDemand.ts
import { createServerFn } from '@tanstack/react-start'
import { renderServerComponent } from '@tanstack/react-start/rsc'

export const renderPayloadComponent = createServerFn()
  .inputValidator((data: { componentPath: string; props: Record<string, unknown> }) => data)
  .handler(async ({ data }) => {
    const { importMap } = await import('../importMap.server.js')
    const Component = getFromImportMap({ importMap, PayloadComponent: data.componentPath })

    if (!Component || !isReactServerComponentOrFunction(Component)) {
      return null
    }

    // Reconstruct serverProps from the current request context
    const req = await initReq({ ... })
    const serverProps = { payload: req.payload, i18n: req.i18n, user: req.user }

    return renderServerComponent(<Component {...serverProps} {...data.props} />)
  })
```

On the client, the `TanStackComponentRenderer` calls this server function when it encounters an unresolved server component:

```typescript
// Client-side, lazy RSC rendering
const [rendered, setRendered] = useState(null)
useEffect(() => {
  if (isServerComponent && !preRendered) {
    renderPayloadComponent({ data: { componentPath, props } }).then(setRendered)
  }
}, [componentPath, props])
```

**Files to create/modify**:

- `packages/tanstack-start/src/rsc/renderOnDemand.ts` — new server function
- `packages/tanstack-start/src/elements/RenderComponent/index.tsx` — add lazy loading path
- `tanstack-app/src/functions/` — wire up the on-demand renderer

### Phase 5: Vite Plugin Auto-Configuration

**Problem**: Users currently need to know about `importProtection`, `ssr.external`, `optimizeDeps`, etc. for their own server-only dependencies.

**Solution**: The Vite plugin should handle this automatically:

1. **Auto-detect server components**: During dev, when the import map is regenerated, scan imported modules for `'use client'` directives. Components without it are server components — automatically add their dependencies to `importProtection.client.specifiers`.

2. **Auto-externalize Node.js dependencies**: When a server component imports a package that uses Node.js APIs, automatically add it to `ssr.external` and the client protection list.

3. **Watch mode**: The Vite plugin should watch the import map file and regenerate protections when it changes.

```typescript
// In payloadPlugin():
{
  name: 'payload:auto-server-boundaries',
  configureServer(server) {
    // Watch importMap.server.ts for changes
    // Scan newly imported modules for server-only deps
    // Update import protection dynamically
  }
}
```

**Files to modify**:

- `packages/tanstack-start/src/vite/plugin.ts` — add auto-detection plugin

### Phase 6: Handle `@payloadcms/ui/rsc` and `@payloadcms/richtext-lexical/rsc`

**Problem**: These entrypoints export async server components (like `RscEntryLexicalField`, `CollectionCards`) that are designed for the RSC environment. They're imported in the import map but cannot run in the client environment.

**Current workaround**: The Vite plugin has `importProtection` rules that block these from the client:

```typescript
/^@payloadcms\/next\/rsc/,
/^@payloadcms\/richtext-lexical\/rsc/,
```

**Proper fix**:

1. These components must only appear in `importMap.server.ts` (Phase 2 handles this)
2. On the server side, they're rendered via `renderServerComponent()` during `getAdminPageData`
3. Their rendered output (Flight stream) is passed to the client as data
4. The client `AdminView` renders the pre-rendered output in the correct slot

For Lexical specifically:

- `RscEntryLexicalField` renders the rich text field server-side with full payload context
- `RscEntryLexicalCell` renders the list cell preview server-side
- These MUST work for the Lexical editor to function properly

### Phase 7: Enable E2E Tests and Iterate

Once Phases 1-6 are implemented:

1. Remove `{ framework: 'rsc' }` skip condition from tests that should now pass
2. Update `test/__helpers/e2e/playwright.ts` — `isRSCEnabled()` should return `true` for TanStack Start
3. Run the full E2E matrix and triage remaining failures into:
   - RSC rendering bugs (fix in adapter)
   - Missing feature implementations (track separately)
   - Test infrastructure issues (fix in test helpers)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User's TanStack Start App                                              │
│                                                                         │
│  vite.config.ts:                                                        │
│    payloadPlugin({                                                      │
│      payloadConfigPath: './payload.config.ts',                          │
│      rscPlugin: rsc(),          ← @vitejs/plugin-rsc                    │
│      reactPlugin: react(),      ← @vitejs/plugin-react                  │
│      tanstackStart: tanstackStart,                                      │
│    })                                                                   │
│                                                                         │
│  ┌──── Server Environment (RSC) ────┐  ┌──── Client Environment ─────┐ │
│  │                                   │  │                             │ │
│  │  importMap.js (full resolution)   │  │  importMap.js (same file,   │ │
│  │  ├── Server components resolve    │  │  RSC plugin transforms      │ │
│  │  │   to real modules              │  │  server imports → client    │ │
│  │  └── Client components resolve    │  │  reference proxies)         │ │
│  │      normally                     │  │                             │ │
│  │                                   │  │  AdminPageView/             │ │
│  │  admin.functions.tsx              │  │  ├── AdminView (client)     │ │
│  │  ├── loadAdminPage()             │  │  ├── Uses importMap.js      │ │
│  │  │   ├── getAdminPageData()      │  │  └── Renders pre-rendered   │ │
│  │  │   ├── Pre-render RSCs         │  │      RSC output as-is       │ │
│  │  │   └── Return serialized data  │  │                             │ │
│  │  └── renderOnDemand()            │  │  ComponentRenderer:         │ │
│  │      └── For dynamic RSC needs   │  │  ├── Check pre-rendered map │ │
│  │                                   │  │  ├── If found → render it  │ │
│  └───────────────────────────────────┘  │  ├── If client → render    │ │
│                                         │  └── If server → call       │ │
│                                         │      renderOnDemand()       │ │
│                                         └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Priority Order

| Priority | Phase                               | Impact               | Effort | Unblocks         |
| -------- | ----------------------------------- | -------------------- | ------ | ---------------- |
| P0       | Phase 0: Fix build                  | All CI               | Done   | Everything       |
| P1       | Phase 1: Plugin import resolution   | ~5 test suites       | Small  | Plugin tests     |
| P1       | Phase 2: Remove importMap.server.ts | Simplification       | Small  | Phases 3-6       |
| P2       | Phase 3: Pre-render RSCs            | ~50 test assertions  | Large  | Most RSC tests   |
| P2       | Phase 4: Dynamic RSC rendering      | Dynamic UI features  | Medium | Drawer/form RSCs |
| P3       | Phase 5: Auto Vite config           | DX improvement       | Medium | User adoption    |
| P3       | Phase 6: Lexical/UI RSC entries     | Lexical + list cells | Medium | Lexical tests    |
| P4       | Phase 7: Enable tests               | Validation           | Small  | Confidence       |

---

## Key Constraints and Non-Goals

### Constraints

- **No user Vite config modification for RSC**: The `payloadPlugin` must handle all bundling boundaries automatically. Users pass `rscPlugin: rsc()` and that's it.
- **Backward compatibility**: RSC support can be opt-in initially (require `@vitejs/plugin-rsc`), but must not break apps that don't opt in.
- **Same component API**: Users write the same `PayloadComponent` descriptors as with Next.js. No TanStack-specific component authoring patterns.
- **Single import map**: One `importMap.js` for both environments. `@vitejs/plugin-rsc` handles the server/client boundary at the module graph level (same as Next.js's bundler). No dual file generation needed.

### Non-Goals (For This Plan)

- Achieving 100% test parity with Next.js immediately (some features may need adapter-specific implementations)
- Supporting RSC in production builds before TanStack Start's RSC exits experimental
- Streaming RSC responses (initial implementation can use non-streaming `renderServerComponent`)
- Composite components with slots (only needed for rare interactive server components)

---

## Risks

1. **TanStack Start RSC is experimental**: API may change. Mitigate by abstracting behind our own `renderPayloadRSC` wrapper.

2. **Performance**: Pre-rendering all server components in `getAdminPageData` adds latency to the initial server function call. Mitigate with parallel rendering and caching.

3. **Serialization limits**: React Flight protocol has constraints on what's serializable. Complex objects in `serverProps` (like the `payload` instance) cannot be serialized. These must be constructed fresh on the server side, not passed through.

4. **Vite 7 + RSC plugin maturity**: `@vitejs/plugin-rsc` is relatively new. Edge cases in module graph splitting may cause issues. Mitigate by maintaining the `importProtection` safety net.

5. **Import map size**: A single import map with all components (server + client) may grow large for complex configs. The RSC plugin handles boundary splitting, but initial parse time could be a concern. Consider lazy imports for large configs.

---

## Success Criteria

- [ ] Build passes in CI
- [ ] `scheduler` runtime crash stays fixed (already done)
- [ ] Plugin client entrypoints resolve correctly (Phase 1)
- [ ] Custom server view components render with `initPageResult` props (Phase 3)
- [ ] Field-level server components (labels, descriptions, cells) render correctly (Phase 3)
- [ ] Lexical RSC entries work (`RscEntryLexicalField`, `RscEntryLexicalCell`) (Phase 6)
- [ ] `beforeListTable`, `afterList`, `afterDashboard`, `beforeDashboard` server components work (Phase 3)
- [ ] Admin providers that are server components work (Phase 3)
- [ ] Users can register a custom server component without modifying `vite.config.ts` (Phase 5)
- [ ] E2E pass rate > 80% for TanStack Start (Phase 7)
- [ ] Parity with Next.js on the `{ framework: 'rsc' }` test subset (Phase 7)
