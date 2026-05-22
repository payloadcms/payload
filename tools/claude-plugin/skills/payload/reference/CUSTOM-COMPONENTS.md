# Custom Components

Use when customizing the Payload Admin Panel — swapping in custom React components for views, fields, navigation, dashboard widgets, or admin slots. Also covers the React hooks available in client components and how to register components via path strings in the config.

## Quick Reference

| Task                                          | Solution                                                             | Section                                                      |
| --------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| Register a custom component in the config     | `'/src/components/MyComponent#MyExport'` string in the relevant slot | [Component Paths + Import Map](#component-paths--import-map) |
| Regenerate the import map after path change   | `pnpm payload generate:importmap`                                    | [Component Paths + Import Map](#component-paths--import-map) |
| Build a Server Component with Payload data    | Receive `payload` prop; call Local API directly                      | [Building Custom Components](#building-custom-components)    |
| Build a Client Component with React state     | Add `'use client'` directive at top of file                          | [Building Custom Components](#building-custom-components)    |
| Access Payload config from a client component | `useConfig()` from `@payloadcms/ui`                                  | [Admin React Hooks](#admin-react-hooks)                      |
| Read/write a field value in a custom field    | `useField({ path })` from `@payloadcms/ui`                           | [Admin React Hooks](#admin-react-hooks)                      |
| Add custom content before the dashboard       | `admin.components.beforeDashboard` array                             | [Root Component Slots](#root-component-slots)                |
| Replace the admin logo                        | `admin.components.graphics.Logo`                                     | [Root Component Slots](#root-component-slots)                |
| Add a custom root/collection/global view      | `admin.components.views` with `Component` + optional `path`          | [Custom Views](#custom-views)                                |
| Override the Edit View SaveButton             | `admin.components.edit.SaveButton` on collection or global config    | [Edit-View Slots](#edit-view-slots)                          |
| Inject content before the list table          | `admin.components.beforeListTable` on collection config              | [List-View Slots](#list-view-slots)                          |
| Wrap admin with a React context               | `admin.components.providers` array                                   | [Custom Providers](#custom-providers)                        |
| Add a dashboard widget                        | `admin.dashboard.widgets` array with `slug` + `Component`            | [Custom Dashboard Widgets](#custom-dashboard-widgets)        |

## Component Paths + Import Map

Components are **not imported directly** into `payload.config.ts`. Instead, supply a path string so the Admin Panel can resolve the import on its own. This keeps the config Node.js-compatible and tree-shakeable.

### Path string syntax

```ts
// Named export via # hash
'/src/components/MyComponent#MyExport'

// Default export (no hash)
'/src/components/MyComponent'

// Object form with explicit exportName
{
  path: '/src/components/MyComponent',
  exportName: 'MyExport',
}
```

Paths are relative to `config.admin.importMap.baseDir` (defaults to your project's current working directory). Set `baseDir` to `src/` and omit the `/src/` prefix:

```ts
// see docs/custom-components/overview.mdx
import { buildConfig } from 'payload'
import { fileURLToPath } from 'node:url'
import path from 'path'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, 'src'), // paths become '/components/...' not '/src/components/...'
    },
    components: {
      logout: {
        Button: '/components/Logout#MyComponent',
      },
    },
  },
})
```

### Import Map

Payload generates `src/app/(payload)/admin/importMap.js` (or `app/(payload)/admin/importMap.js`) containing every custom component path. It is regenerated:

- On every dev-server startup
- On HMR saves during development
- When you run `pnpm payload generate:importmap` manually

**Never edit `importMap.js` manually.** After changing a component path string in your config, run `pnpm payload generate:importmap` (or restart the dev server) before testing.

### serverProps vs clientProps

Pass extra data to your component alongside the default props:

```ts
admin: {
  components: {
    logout: {
      Button: {
        path: '/components/Logout#MyButton',
        serverProps: { label: 'Sign Out' },  // serializable + non-serializable OK
        clientProps: { color: 'red' },        // must be JSON-serializable
      },
    },
  },
}
```

- `serverProps` — forwarded as-is to Server Components (can include non-serializable values).
- `clientProps` — serialized across the RSC boundary; must be JSON-serializable.

## Building Custom Components

All custom components are **React Server Components by default**. Add `'use client'` at the top of the file to opt into the client boundary.

### Server Components

Server Components receive `payload` and `i18n` as default props. Call the Local API directly:

```tsx
// see test/admin/ for real-world patterns
import React from 'react'
import type { Payload } from 'payload'

export default async function MyWidget({ payload }: { payload: Payload }) {
  const posts = await payload.find({ collection: 'posts', limit: 5 })
  return (
    <ul>
      {posts.docs.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

Access the Payload config via `payload.config`:

```tsx
export default async function MyServerComponent({ payload: { config } }) {
  return <a href={config.serverURL}>Home</a>
}
```

Access locale (if localization is enabled) via `locale` prop:

```tsx
export default async function MyServerComponent({ payload, locale }) {
  const page = await payload.findByID({ collection: 'pages', id: '123', locale })
  return <p>{page.title}</p>
}
```

### Client Components

Add `'use client'` at the top. Non-serializable default props (like the full Payload class) are stripped automatically — use hooks instead:

```tsx
'use client'
import React, { useState } from 'react'

export function MyClientComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
}
```

Payload config is available via `useConfig()`. Field configs use `clientField` (not `field`) in client components:

```tsx
'use client'
import type { TextFieldClientComponent } from 'payload'

export const MyFieldClient: TextFieldClientComponent = ({ clientField: { name } }) => {
  return <p>Field name: {name}</p>
}
```

### Performance

- Prefer Server Components — shift rendering to the server and minimize client JS.
- Use `useFormFields` (not `useAllFormFields`) when a component needs only specific fields — it re-renders only when those fields change.
- Never pass inline array/object literals as props to custom hooks — memoize them with `useMemo` to prevent unnecessary re-renders (see `CLAUDE.md`).
- Use React Suspense to progressively load data-heavy components.

### Troubleshooting

**`useConfig is undefined` / `Assignment cannot be destructured`** — usually a Payload package version mismatch. Pin all `@payloadcms/*` packages to the same version.

**Component not updating after path change** — the import map is stale. Run `pnpm payload generate:importmap` or restart the dev server.

**Server Component importing a Client Component** — import from the client exports bundle, not via relative path (see [Gotchas](#gotchas)).

## Admin React Hooks

All hooks are from `@payloadcms/ui`. Hooks only work in **Client Components** (`'use client'` required).

| Hook                 | One-line usage                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `useField`           | `const { value, setValue } = useField({ path })` — read/write a single field's form state   |
| `useFormFields`      | `const amount = useFormFields(([fields]) => fields.amount)` — subscribe to specific fields  |
| `useAllFormFields`   | `const [fields, dispatch] = useAllFormFields()` — full form state + dispatch actions        |
| `useForm`            | `const { submit, validateForm } = useForm()` — trigger form actions without re-render       |
| `useDocumentForm`    | `const { fields } = useDocumentForm()` — access top-level document form from a child form   |
| `useCollapsible`     | `const { isCollapsed, toggle } = useCollapsible()` — control nearest collapsible section    |
| `useDocumentInfo`    | `const { id, collectionSlug } = useDocumentInfo()` — document id, slug, permissions         |
| `useDocumentTitle`   | `const { title, setDocumentTitle } = useDocumentTitle()` — read or override document title  |
| `useListQuery`       | `const { data, query } = useListQuery()` — current list view data and query state           |
| `useSelection`       | `const { count, toggleAll } = useSelection()` — selected rows in the list view              |
| `useLocale`          | `const locale = useLocale()` — currently selected locale `{ code, label, rtl }`             |
| `useAuth`            | `const { user, logOut, token } = useAuth()` — current user, token, permission refresh       |
| `useConfig`          | `const { config, getEntityConfig } = useConfig()` — serializable client config              |
| `useEditDepth`       | `const depth = useEditDepth()` — how many modal editing levels deep this component is       |
| `usePreferences`     | Get and set user-level preferences (column order, etc.)                                     |
| `useTheme`           | `const { theme, setTheme } = useTheme()` — current theme (`'light'` / `'dark'` / `'auto'`)  |
| `useTableColumns`    | `const { toggleColumn, resetColumnsState } = useTableColumns()` — list view column control  |
| `useDocumentEvents`  | `const { mostRecentUpdate } = useDocumentEvents()` — cross-document update events           |
| `useStepNav`         | `const { setStepNav } = useStepNav()` — set breadcrumb links in the admin header            |
| `usePayloadAPI`      | `const [{ data, isLoading }, { setParams }] = usePayloadAPI('/api/posts/123')` — REST fetch |
| `useRouteTransition` | `const { startRouteTransition } = useRouteTransition()` — trigger visual route transition   |

### useField — custom field components

```tsx
// see test/form-state/ for field interaction patterns
'use client'
import type { TextFieldClientComponent } from 'payload'
import { useField } from '@payloadcms/ui'

export const CustomTextField: TextFieldClientComponent = ({ path }) => {
  const { value, setValue } = useField({ path })
  return <input onChange={(e) => setValue(e.target.value)} value={value as string} />
}
```

### useFormFields — subscribe to specific fields

```tsx
'use client'
import { useFormFields } from '@payloadcms/ui'

const FeeCalculator: React.FC = () => {
  const amount = useFormFields(([fields]) => fields.amount)
  const feePercentage = useFormFields(([fields]) => fields.feePercentage)
  if (!amount?.value || !feePercentage?.value) return null
  return <span>Fee: ${(Number(amount.value) * Number(feePercentage.value)) / 100}</span>
}
```

### useAllFormFields + dispatchFields — update Lexical rich text

`useField`'s `setValue` updates the form state but **does not trigger the Lexical editor to re-render visually**. Use `dispatchFields` with both `value` and `initialValue`:

```tsx
// see docs/admin/react-hooks.mdx#updating-lexical-rich-text-fields
'use client'
import { useAllFormFields } from '@payloadcms/ui'

export const UpdateRichText: React.FC = () => {
  const [, dispatchFields] = useAllFormFields()

  const update = (newValue: unknown) => {
    dispatchFields({
      type: 'UPDATE',
      path: 'content', // the Lexical field path
      value: newValue,
      initialValue: newValue, // required — triggers editor re-render
    })
  }

  return (
    <button
      onClick={() =>
        update({
          /* new editor state */
        })
      }
    >
      Set Content
    </button>
  )
}
```

`dispatchFields` actions: `ADD_ROW`, `DUPLICATE_ROW`, `MODIFY_CONDITION`, `MOVE_ROW`, `REMOVE`, `REMOVE_ROW`, `REPLACE_STATE`, `UPDATE`.

## Root Component Slots

Override via `admin.components` in `buildConfig`. All path values accept the `'/path#Export'` string syntax.

| Slot              | Type   | Description                                                                                          |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `actions`         | array  | Rendered within the admin header — typically buttons or additional controls                          |
| `beforeDashboard` | array  | Injected before the default dashboard content                                                        |
| `afterDashboard`  | array  | Injected after the default dashboard content                                                         |
| `beforeLogin`     | array  | Injected before the login form                                                                       |
| `afterLogin`      | array  | Injected after the login form                                                                        |
| `beforeNavLinks`  | array  | Injected before the nav links in the sidebar                                                         |
| `afterNavLinks`   | array  | Injected after the nav links in the sidebar                                                          |
| `settingsMenu`    | array  | Items in the gear-icon popup menu above the logout button                                            |
| `Nav`             | string | Replaces the entire sidebar/mobile nav                                                               |
| `graphics.Icon`   | string | Small brand icon used in nav context                                                                 |
| `graphics.Logo`   | string | Full logo used in the login view                                                                     |
| `header`          | array  | Injected above the Payload header (announcements, banners, etc.)                                     |
| `logout.Button`   | string | Replaces the logout button in the sidebar                                                            |
| `providers`       | array  | Custom React Context providers wrapping the entire admin — see [Custom Providers](#custom-providers) |
| `views`           | object | Replace or add views — see [Custom Views](#custom-views)                                             |

```ts
// see docs/custom-components/root-components.mdx
export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ['/src/components/AnnouncementBanner'],
      afterNavLinks: ['/src/components/NavFooter#NavFooter'],
      graphics: {
        Icon: '/src/components/BrandIcon',
        Logo: '/src/components/BrandLogo',
      },
      logout: {
        Button: '/src/components/CustomLogout',
      },
    },
  },
})
```

## Custom Views

### Replacing a built-in view

```ts
// see docs/custom-components/custom-views.mdx
export default buildConfig({
  admin: {
    components: {
      views: {
        dashboard: {
          Component: '/src/views/MyDashboard',
        },
      },
    },
  },
})
```

Root view keys: `dashboard`, `account`, or any custom key.

### Adding a new root view

```ts
admin: {
  components: {
    views: {
      myCustomPage: {
        Component: '/src/views/MyCustomPage#MyCustomView',
        path: '/my-custom-page',
      },
    },
  },
}
```

Routes are cascading — add `exact: true` to prevent prefix matching, or define child routes before parent routes.

### Collection and global views

```ts
// Collection
export const Posts: CollectionConfig = {
  admin: {
    components: {
      views: {
        list: { Component: '/src/views/PostList' },
        edit: {
          default: { Component: '/src/views/PostEdit' },
        },
      },
    },
  },
}
```

### Securing custom views

All custom views are **public by default**. Check auth inside the component:

```tsx
import type { AdminViewServerProps } from 'payload'

export function MySecuredView({ initPageResult }: AdminViewServerProps) {
  const {
    req: { user },
  } = initPageResult
  if (!user) return <p>You must be logged in.</p>
  return <div>Protected content</div>
}
```

### DefaultTemplate

Use the `DefaultTemplate` from `@payloadcms/next/templates` to render your view inside the standard admin shell (nav, header, etc.):

```tsx
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'

export function MyCustomView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <h1>My Custom View</h1>
      </Gutter>
    </DefaultTemplate>
  )
}
```

### Default view props

| Prop             | Description                                                 |
| ---------------- | ----------------------------------------------------------- |
| `initPageResult` | `{ req, payload, permissions, locale, visibleEntities, … }` |
| `clientConfig`   | Serializable client config                                  |
| `importMap`      | The resolved import map                                     |
| `params`         | Next.js dynamic route params                                |
| `searchParams`   | URL search params                                           |
| `payload`        | The Payload class                                           |
| `i18n`           | The i18n object                                             |

## Document Views

Document Views are nested inside the `/collections/:slug/:id` or `/globals/:slug` route. They share a tab layout.

### Config options

| Key           | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `root`        | Overrides the entire document route — no tabs or controls rendered |
| `default`     | The Edit View (primary editing tab)                                |
| `versions`    | Version history tab                                                |
| `version`     | Single version tab                                                 |
| `api`         | REST API response viewer tab                                       |
| `livePreview` | Live Preview tab                                                   |
| `[key]`       | Any custom key adds a new tab-based document view                  |

```ts
// Collection config
admin: {
  components: {
    views: {
      edit: {
        root: { Component: '/src/views/DocRoot' },      // take over entire route
        default: { Component: '/src/views/CustomEdit' }, // replace edit tab only
        myTab: {                                          // add a new tab
          Component: '/src/views/MyTab#MyTabView',
          path: '/my-tab',
          tab: {
            label: 'My Tab',
            href: '/my-tab',
          },
        },
      },
    },
  },
}
```

### Document Root

Setting `root` gives you full control of the layout — useful when the default tab structure doesn't fit. The component receives `DocumentViewServerProps` / `DocumentViewClientProps`.

### Edit View component types

```tsx
import type { DocumentViewServerProps } from 'payload'

export function MyServerEditView(props: DocumentViewServerProps) {
  return <div>Custom Edit (Server)</div>
}
```

```tsx
'use client'
import type { DocumentViewClientProps } from 'payload'

export function MyClientEditView(props: DocumentViewClientProps) {
  return <div>Custom Edit (Client)</div>
}
```

## Edit-View Slots

Configure on `admin.components.edit` in a Collection or Global config. Collections and Globals share the same slots with one exception: `Upload` is collection-only.

| Slot                     | Type   | Description                                                              |
| ------------------------ | ------ | ------------------------------------------------------------------------ |
| `SaveButton`             | string | Replaces the primary Save button                                         |
| `SaveDraftButton`        | string | Replaces the Save Draft button (requires `versions.drafts: true`)        |
| `PublishButton`          | string | Replaces the Publish button (requires `versions.drafts: true`)           |
| `UnpublishButton`        | string | Replaces the Unpublish button (requires `versions.drafts: true`)         |
| `PreviewButton`          | string | Replaces the Preview button (requires `admin.preview` function)          |
| `beforeDocumentControls` | array  | Injected before the Save/Publish controls area                           |
| `editMenuItems`          | array  | Items appended to the 3-dot dropdown menu in the document controls bar   |
| `Description`            | string | Shared with List View — custom description displayed above the form      |
| `Status`                 | string | Replaces the draft/published status indicator                            |
| `Upload`                 | string | Replaces the file upload UI (collection only; must integrate with forms) |

```ts
// see docs/custom-components/edit-view.mdx
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    components: {
      edit: {
        SaveButton: '/src/components/MySaveButton',
        beforeDocumentControls: ['/src/components/WordCount'],
        editMenuItems: ['/src/components/ExportButton#ExportButton'],
      },
    },
  },
}
```

Custom `SaveButton` example (wraps the built-in):

```tsx
import React from 'react'
import { SaveButton } from '@payloadcms/ui'
import type { SaveButtonServerProps } from 'payload'

export function MySaveButton(props: SaveButtonServerProps) {
  return <SaveButton label="Save Post" />
}
```

## List-View Slots

Configure on `admin.components` in a Collection config. Only Collections have a List View.

| Slot              | Type   | Description                                                         |
| ----------------- | ------ | ------------------------------------------------------------------- |
| `beforeList`      | array  | Injected before the entire list (above pagination, filters, table)  |
| `beforeListTable` | array  | Injected immediately before the documents table                     |
| `afterList`       | array  | Injected after the entire list                                      |
| `afterListTable`  | array  | Injected immediately after the documents table                      |
| `listMenuItems`   | array  | Items in the controls menu next to Columns/Filters options          |
| `Description`     | string | Shared with Edit View — custom description displayed above the list |

```ts
// see docs/custom-components/list-view.mdx
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    components: {
      beforeList: ['/src/components/PostsHeader'],
      afterListTable: ['/src/components/BulkExport#BulkExport'],
      Description: '/src/components/PostsDescription',
    },
  },
}
```

All slot components receive `BeforeListServerProps` / `BeforeListClientProps` (and equivalents for `AfterList`, etc.) with collection info, paginated data (server), permissions, and the current user.

### Custom List View

Replace the entire list view with `admin.components.views.list`:

```ts
export const MyCollection: CollectionConfig = {
  admin: {
    components: {
      views: {
        list: { Component: '/src/views/MyListView' },
      },
    },
  },
}
```

Use `DefaultListView` from `@payloadcms/ui` to keep Payload's table while adding your own layout:

```tsx
'use client'
import { DefaultListView } from '@payloadcms/ui'
import type { ListViewClientProps } from 'payload'

export function MyListView(props: ListViewClientProps) {
  return (
    <div>
      <h1>My Custom Header</h1>
      <DefaultListView {...props} />
    </div>
  )
}
```

## Custom Providers

Wrap the entire admin panel in a React Context provider via `admin.components.providers`. Useful for sharing state or services (analytics, feature flags, etc.) across all custom components.

```ts
// see docs/custom-components/custom-providers.mdx
export default buildConfig({
  admin: {
    components: {
      providers: ['/src/providers/MyProvider'],
    },
  },
})
```

```tsx
// src/providers/MyProvider.tsx
'use client'
import React, { createContext, use } from 'react'

const MyContext = React.createContext<{ theme: string }>({ theme: 'light' })

export function MyProvider({ children }: { children: React.ReactNode }) {
  return <MyContext value={{ theme: 'light' }}>{children}</MyContext>
}

export const useMyContext = () => use(MyContext)
```

Providers must be Client Components (`'use client'`). To include server-side logic, wrap the Client Provider with a Server Component.

## Custom Dashboard Widgets

> **Experimental:** The modular dashboard API may change in future releases.

Widgets appear on the dashboard and can fetch their own data server-side. Define them in `admin.dashboard.widgets`:

```ts
// see docs/custom-components/dashboard.mdx
export default buildConfig({
  admin: {
    dashboard: {
      widgets: [
        {
          slug: 'user-stats',
          Component: '/src/widgets/UserStats',
          minWidth: 'small',
          maxWidth: 'medium',
        },
      ],
      defaultLayout: ({ req }) => [
        { widgetSlug: 'collections', width: 'full' },
        { widgetSlug: 'user-stats', width: 'medium' },
      ],
    },
  },
})
```

### Widget component

```tsx
import type { WidgetServerProps } from 'payload'

export default async function UserStats({ req }: WidgetServerProps) {
  const { totalDocs } = await req.payload.count({ collection: 'users' })
  return (
    <div className="card">
      <h3>Users</h3>
      <p style={{ fontSize: 32, fontWeight: 'bold' }}>{totalDocs}</p>
    </div>
  )
}
```

### Widget config properties

| Property    | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| `slug`      | Unique identifier                                                    |
| `Component` | Path string to the component (supports `#` named export syntax)      |
| `fields`    | Optional `Field[]` — shown in the widget edit drawer                 |
| `minWidth`  | `'x-small' \| 'small' \| 'medium' \| 'large' \| 'x-large' \| 'full'` |
| `maxWidth`  | Same options as `minWidth`                                           |

### Built-in widgets

Payload ships a `collections` widget (the default collection/globals cards). If `defaultLayout` is omitted it is included automatically.

### User customization

Users can edit, resize, reorder, and delete widgets via the dashboard dropdown → "Edit Dashboard". Layouts are saved to user preferences. "Reset Layout" reverts to `defaultLayout`.

## Gotchas

1. **Import a client component from a server component via the exports bundle, not a relative path.** Relative imports don't respect `'use client'` boundaries in production builds:

   ```ts
   // BAD — relative import breaks client boundary in prod
   import { MyClientComponent } from './MyComponent.js'

   // GOOD — import from the exports bundle (see CLAUDE.md)
   // eslint-disable-next-line payload/no-imports-from-exports-dir
   import { MyClientComponent } from '../../exports/client/index.js'
   ```

2. **Regenerate the import map after changing a component path string.** The admin panel uses `importMap.js` to resolve component paths. Run `pnpm payload generate:importmap` after any path change — otherwise you'll see "component not found" errors in production or after a fresh build.

3. **`'use client'` is required for all React hooks.** Hooks (`useField`, `useConfig`, `useAuth`, etc.) are client-only. Forgetting the directive causes a React error about hooks outside of a component.

4. **Write the component file first, then add the path string to the config.** A common mistake is to add the path string to config.ts and forget to create the actual component file. Payload will silently fall back to the default component if the path resolves to nothing at runtime.

5. **Avoid barrel exports (`export *`).** Barrel exports break tree-shaking and can leak client code into server bundles. Use explicit named exports in your component files. See `CLAUDE.md` for the full rule.

6. **`useField`'s `setValue` does not visually refresh a Lexical editor.** Use `dispatchFields` with `UPDATE` and set both `value` and `initialValue` to trigger a Lexical re-render. See [useAllFormFields](#useallformfields--dispatchfields--update-lexical-rich-text) above.

## Related

- [RICHTEXT.md](RICHTEXT.md) — updating Lexical rich text fields via `useField` / `dispatchFields`, adding custom Lexical features
- [COLLECTIONS.md](COLLECTIONS.md) — edit-view and list-view slot configuration in collection config, versioning/drafts which affects which buttons appear
- [FIELDS.md](FIELDS.md) — `admin.components.Field` on custom and UI fields, field-level `Description`, `Label`, `Error` slot overrides
