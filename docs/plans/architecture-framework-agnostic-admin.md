# Architecture: Framework-Agnostic Admin UI

## The Idea in One Sentence

Payload's admin UI lives in `@payloadcms/ui` as shared React components. Framework packages (`@payloadcms/next`, `@payloadcms/tanstack-start`) are thin adapters that fetch data and wire routing — they don't own UI.

## Three Layers

```
┌─────────────────────────────────────────────────────────┐
│  Framework Adapter                                      │
│  (@payloadcms/next  or  @payloadcms/tanstack-start)     │
│                                                         │
│  - Request init (headers, cookies)                      │
│  - Data fetching (RSC / server functions / loaders)     │
│  - Navigation primitives (redirect, notFound, Link)     │
│  - Route handlers (REST, GraphQL)                       │
└────────────────────────┬────────────────────────────────┘
                         │ passes data as props
┌────────────────────────▼────────────────────────────────┐
│  Shared UI  (@payloadcms/ui)                            │
│                                                         │
│  - All React components (client + server)               │
│  - View composition (Dashboard, List, Document, etc.)   │
│  - Templates (Default, Minimal)                         │
│  - Server function handlers (form-state, render-list…)  │
│  - RouterProvider contract (framework-neutral hooks)     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  Core  (payload)                                        │
│                                                         │
│  - Collections, fields, hooks, access control           │
│  - Local API, database adapters                         │
│  - AdminAdapter interface + createAdminAdapter helper   │
│  - Config types                                         │
└─────────────────────────────────────────────────────────┘
```

## AdminAdapter Interface

Every framework implements this contract, similar to how database adapters work:

```ts
// Defined in payload core
interface BaseAdminAdapter {
  name: string

  initReq: (args) => Promise<InitReqResult>    // Read request context
  getCookie / setCookie / deleteCookie          // Cookie management
  handleServerFunctions: ServerFunctionHandler  // Dispatch server functions
  notFound: () => never                         // Framework-specific 404
  redirect: (url: string) => never              // Framework-specific redirect
  RouterProvider: React.ComponentType           // Client-side router context
  createRouteHandlers: () => RouteHandlers      // REST + GraphQL routes
}
```

Usage in config:

```ts
export default buildConfig({
  db: postgresAdapter({ ... }),
  admin: {
    adapter: nextAdapter(),  // or tanstackStartAdapter()
  },
})
```

## RouterProvider: One Hook API, Two Implementations

`@payloadcms/ui` defines a `RouterProvider` context. Each adapter fills it with its own primitives. All UI components use framework-neutral hooks.

```
@payloadcms/ui defines:        useRouter, usePathname, useSearchParams, useParams, Link
                                         ▲
         ┌───────────────────────────────┼──────────────────────────────────┐
         │                               │                                  │
   NextRouterProvider              TanStackRouterProvider             (future adapter)
   wraps next/navigation           wraps @tanstack/react-router      wraps ???
   wraps next/link                 wraps TanStack Link
```

**Next.js adapter** (`packages/next/src/adapter/RouterProvider.tsx`):

```tsx
const NextRouterProvider = ({ children }) => {
  const nextRouter = useNextRouter()
  const pathname = useNextPathname()
  // ... map to RouterContextType
  return <BaseRouterProvider router={routerCtx}>{children}</BaseRouterProvider>
}
```

**TanStack adapter** (`packages/tanstack-start/src/adapter/RouterProvider.tsx`):

```tsx
function TanStackRouterProvider({ children }) {
  const router = useRouter()
  const location = useLocation()
  // ... map to RouterContextType
  return <BaseRouterProvider router={routerCtx}>{children}</BaseRouterProvider>
}
```

Result: `@payloadcms/ui` has zero `next/*` or `@tanstack/*` imports.

## The Pattern: Dashboard as Reference

Every built-in admin view follows the same three-part structure. The dashboard was done first and is the reference for all others.

### Dashboard Example

**1. Shared UI** — `@payloadcms/ui` owns the interactive component:

```tsx
// packages/ui/src/views/Dashboard/Default/ModularDashboard/
// Exports: ModularDashboardClient, RenderWidget, etc.
// Pure React client components. No framework dependency.
```

**2. Next.js adapter** — thin RSC wrapper, ~2 lines:

```tsx
// packages/next/src/views/Dashboard/index.tsx
export { DashboardView } from '@payloadcms/ui/views/Dashboard'
```

Next re-exports the shared view directly (RSC handles data fetching inline).

**3. TanStack adapter** — thin client wrapper, ~30 lines:

```tsx
// packages/tanstack-start/src/views/Dashboard/index.tsx
export function DashboardView({ pageState }) {
  // Build widget instances from pageState (fetched server-side)
  const clientLayout = layoutItems.map(item => ({
    component: <RenderWidget widgetData={item.data} widgetId={item.id} />,
    item: { id: item.id, ... },
  }))

  return <ModularDashboardClient clientLayout={clientLayout} widgets={widgets} />
}
```

Both frameworks render the same `ModularDashboardClient`. Same drag-and-drop, same widget editing, same visual result.

### List View Example

**1. Shared UI** — `@payloadcms/ui` owns `renderListView` (server-side builder) and all list components.

**2. Next.js adapter** — calls the shared builder, handles `notFound()`:

```tsx
// packages/next/src/views/List/index.tsx
export const ListView = async (args) => {
  try {
    const { List } = await renderListViewFromUI({ ...args })
    return List
  } catch (error) {
    if (error.message === 'not-found') notFound()
  }
}
```

**3. TanStack adapter** — calls the same builder via server function:

```tsx
// packages/tanstack-start/src/views/List/index.tsx
export function ListView({ pageState }) {
  const { serverFunction } = useServerFunctions()
  const [listView, setListView] = useState(null)

  useEffect(() => {
    const result = await serverFunction({
      name: 'render-list',
      args: buildRenderListArgs({ pageState, query }),
    })
    setListView(result.List)
  }, [pageState])

  return listView
}
```

### Document View Example

Same pattern. Next calls `renderDocument` server-side via RSC. TanStack calls `renderDocument` via a server function from a client component.

```
Next.js:      RSC page  →  renderDocument()  →  <DocumentView />
TanStack:     Client component  →  serverFunction('render-document')  →  <DocumentView />
```

The shared `renderDocument` in `@payloadcms/ui` handles data fetching, permissions, form state — all framework-agnostic. Each adapter just provides `notFound` and `redirect` callbacks.

## Server Functions: Shared Logic, Framework Transport

Reusable server-side logic lives in `@payloadcms/ui`. Each framework provides its own transport:

```
@payloadcms/ui registers handlers:
  'form-state'        → buildFormStateHandler
  'render-list'       → renderListHandler
  'render-document'   → renderDocumentHandler
  'render-widget'     → renderWidgetHandler
  'table-state'       → buildTableStateHandler
  ...

Next.js calls them via:       server actions ('use server')
TanStack calls them via:      createServerFn() from @tanstack/start
(future) could call via:      plain REST endpoints
```

Both frameworks share the same `dispatchServerFunction` from `@payloadcms/ui`. Framework-specific setup (request init, cookie access) happens in each adapter's `handleServerFunctions` before dispatching to the shared handler.

## File Structure

```
packages/
├── payload/                     # Core: types, Local API, AdminAdapter interface
├── ui/                          # Shared UI: all React components and views
│   └── src/
│       ├── views/
│       │   ├── Dashboard/       # Shared dashboard components
│       │   ├── List/            # Shared list rendering
│       │   ├── Document/        # Shared document rendering
│       │   ├── Login/           # Shared login form
│       │   └── ...
│       ├── templates/           # Default + Minimal shell templates
│       ├── elements/            # Reusable UI elements
│       ├── providers/           # RouterProvider, ServerFunctions, etc.
│       └── utilities/           # handleServerFunctions registry
│
├── next/                        # Next.js adapter (thin)
│   └── src/
│       ├── adapter/             # nextAdapter(), NextRouterProvider
│       ├── views/               # Per-view thin wrappers
│       │   ├── Dashboard/       # Re-exports from @payloadcms/ui
│       │   ├── List/            # RSC data fetch → shared component
│       │   ├── Document/        # RSC data fetch → shared component
│       │   └── ...
│       ├── layouts/Root/        # Next.js root layout
│       └── utilities/           # initReq, handleServerFunctions
│
├── tanstack-start/              # TanStack adapter (thin)
│   └── src/
│       ├── adapter/             # TanStackRouterProvider
│       ├── views/               # Per-view thin wrappers
│       │   ├── Dashboard/       # Server function → shared component
│       │   ├── List/            # Server function → shared component
│       │   ├── Document/        # Server function → shared component
│       │   └── ...
│       ├── layouts/Root/        # TanStack root layout
│       └── utilities/           # initReq, handleServerFunctions
```

## The Rule

For any view, ask: **where does this code belong?**

| If the code…                             | It belongs in…               |
| ---------------------------------------- | ---------------------------- |
| Renders UI (React components, JSX)       | `@payloadcms/ui`             |
| Fetches data via Payload Local API       | `@payloadcms/ui` (handler)   |
| Uses `next/navigation` or `next/headers` | `@payloadcms/next` (adapter) |
| Uses `@tanstack/react-router`            | `@payloadcms/tanstack-start` |
| Calls `redirect()` or `notFound()`       | adapter (passed as callback) |
| Defines collection/field/hook logic      | `payload` (core)             |

## What's Different Between Adapters

The only things that differ are **how** data reaches the shared component:

| Concern             | Next.js                         | TanStack Start                  |
| ------------------- | ------------------------------- | ------------------------------- |
| Initial data fetch  | RSC (async server component)    | Server function from client     |
| Server functions    | `'use server'` actions          | `createServerFn()`              |
| Request context     | `next/headers` cookies/headers  | `vinxi/http` getWebRequest      |
| Navigation          | `next/navigation` hooks + Link  | `@tanstack/react-router` hooks  |
| Redirect / NotFound | `next/navigation` throw helpers | `@tanstack/react-router` throws |
| Route definitions   | File-system routing (`app/`)    | TanStack route tree             |

Everything else — the components, the form state, the list rendering, the document editing, the dashboard widgets — is shared.
