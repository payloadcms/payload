# Custom Components in Payload CMS

Custom Components allow you to fully customize the Admin Panel by swapping in your own React components. You can replace nearly every part of the interface or add entirely new functionality.

## Component Types

There are four main types of Custom Components:

1. **Root Components** - Affect the Admin Panel globally (logo, nav, header)
2. **Collection Components** - Specific to collection views
3. **Global Components** - Specific to global document views
4. **Field Components** - Custom field UI and cells

## Defining Custom Components

### Component Paths

Components are defined using file paths (not direct imports) to keep the config lightweight and Node.js compatible.

```typescript
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    components: {
      logout: {
        Button: '/src/components/Logout#MyComponent', // Named export
      },
      Nav: '/src/components/Nav', // Default export
    },
  },
})
```

**Component Path Rules:**

1. Paths are relative to project root (or `config.admin.importMap.baseDir`)
2. For **named exports**: append `#ExportName` or use `exportName` property
3. For **default exports**: no suffix needed
4. File extensions can be omitted

### Component Config Object

Instead of a string path, you can pass a config object:

```typescript
{
  logout: {
    Button: {
      path: '/src/components/Logout',
      exportName: 'MyComponent',
      clientProps: { customProp: 'value' },
      serverProps: { asyncData: someData },
    },
  },
}
```

**Config Properties:**

| Property      | Description                                           |
| ------------- | ----------------------------------------------------- |
| `path`        | File path to component (named exports via `#`)        |
| `exportName`  | Named export (alternative to `#` in path)             |
| `clientProps` | Props for Client Components (must be serializable)    |
| `serverProps` | Props for Server Components (can be non-serializable) |

### Setting Base Directory

```typescript
import path from 'path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, 'src'), // Set base directory
    },
    components: {
      Nav: '/components/Nav', // Now relative to src/
    },
  },
})
```

## Server vs Client Components

**All components are React Server Components by default.**

### Server Components (Default)

Can use Local API directly, perform async operations, and access full Payload instance.

```tsx
import React from 'react'
import type { Payload } from 'payload'

async function MyServerComponent({ payload }: { payload: Payload }) {
  const page = await payload.findByID({
    collection: 'pages',
    id: '123',
  })

  return <p>{page.title}</p>
}

export default MyServerComponent
```

### Client Components

Use the `'use client'` directive for interactivity, hooks, state, etc.

```tsx
'use client'
import React, { useState } from 'react'

export function MyClientComponent() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
}
```

**Important:** Client Components cannot receive non-serializable props (functions, class instances, etc.). Payload automatically strips these when passing to client components.

## Default Props

All Custom Components receive these props by default:

| Prop      | Description                              | Type      |
| --------- | ---------------------------------------- | --------- |
| `payload` | Payload instance (Local API access)      | `Payload` |
| `i18n`    | Internationalization object              | `I18n`    |
| `locale`  | Current locale (if localization enabled) | `string`  |

**Server Component Example:**

```tsx
async function MyComponent({ payload, i18n, locale }) {
  const data = await payload.find({
    collection: 'posts',
    locale,
  })

  return <div>{data.docs.length} posts</div>
}
```

**Client Component Example:**

```tsx
'use client'
import { usePayload, useLocale, useTranslation } from '@payloadcms/ui'

export function MyComponent() {
  // Access via hooks in client components
  const { getLocal, getByID } = usePayload()
  const locale = useLocale()
  const { t, i18n } = useTranslation()

  return <div>{t('myKey')}</div>
}
```

## Custom Props

Pass additional props using `clientProps` or `serverProps`:

```typescript
{
  logout: {
    Button: {
      path: '/components/Logout',
      clientProps: {
        buttonText: 'Sign Out',
        onLogout: () => console.log('Logged out'),
      },
    },
  },
}
```

Receive in component:

```tsx
'use client'
export function Logout({ buttonText, onLogout }) {
  return <button onClick={onLogout}>{buttonText}</button>
}
```

## Root Components

Root Components affect the entire Admin Panel.

### Available Root Components

| Component         | Description                      | Config Path                        |
| ----------------- | -------------------------------- | ---------------------------------- |
| `Nav`             | Entire navigation sidebar        | `admin.components.Nav`             |
| `graphics.Icon`   | Small icon (used in nav)         | `admin.components.graphics.Icon`   |
| `graphics.Logo`   | Full logo (used on login)        | `admin.components.graphics.Logo`   |
| `logout.Button`   | Logout button                    | `admin.components.logout.Button`   |
| `actions`         | Header actions (array)           | `admin.components.actions`         |
| `header`          | Above header (array)             | `admin.components.header`          |
| `beforeDashboard` | Before dashboard content (array) | `admin.components.beforeDashboard` |
| `afterDashboard`  | After dashboard content (array)  | `admin.components.afterDashboard`  |
| `beforeLogin`     | Before login form (array)        | `admin.components.beforeLogin`     |
| `afterLogin`      | After login form (array)         | `admin.components.afterLogin`      |
| `beforeNavLinks`  | Before nav links (array)         | `admin.components.beforeNavLinks`  |
| `afterNavLinks`   | After nav links (array)          | `admin.components.afterNavLinks`   |
| `settingsMenu`    | Settings menu items (array)      | `admin.components.settingsMenu`    |
| `providers`       | Custom React Context providers   | `admin.components.providers`       |
| `views`           | Custom views (dashboard, etc.)   | `admin.components.views`           |

### Example: Custom Logo

```typescript
export default buildConfig({
  admin: {
    components: {
      graphics: {
        Logo: '/components/Logo',
        Icon: '/components/Icon',
      },
    },
  },
})
```

```tsx
// components/Logo.tsx
export default function Logo() {
  return <img src="/logo.png" alt="My Brand" width={200} />
}
```

### Example: Header Actions

```typescript
export default buildConfig({
  admin: {
    components: {
      actions: ['/components/ClearCacheButton', '/components/PreviewButton'],
    },
  },
})
```

```tsx
// components/ClearCacheButton.tsx
'use client'
export default function ClearCacheButton() {
  return (
    <button
      onClick={async () => {
        await fetch('/api/clear-cache', { method: 'POST' })
        alert('Cache cleared!')
      }}
    >
      Clear Cache
    </button>
  )
}
```

## Collection Components

Collection Components are specific to a collection's views.

```typescript
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    components: {
      // Edit view components
      edit: {
        PreviewButton: '/components/PostPreview',
        SaveButton: '/components/CustomSave',
        SaveDraftButton: '/components/CustomSaveDraft',
        PublishButton: '/components/CustomPublish',
      },

      // List view components
      list: {
        Header: '/components/PostsListHeader',
        beforeList: ['/components/ListFilters'],
        afterList: ['/components/ListFooter'],
      },
    },
  },
  fields: [
    // ...
  ],
}
```

## Global Components

Similar to Collection Components but for Global documents.

```typescript
import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    components: {
      edit: {
        PreviewButton: '/components/SettingsPreview',
        SaveButton: '/components/SettingsSave',
      },
    },
  },
  fields: [
    // ...
  ],
}
```

## Field Components

Customize how fields render in Edit and List views.

### Field Component (Edit View)

```typescript
{
  name: 'status',
  type: 'select',
  options: ['draft', 'published'],
  admin: {
    components: {
      Field: '/components/StatusField',
    },
  },
}
```

```tsx
// components/StatusField.tsx
'use client'
import { useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'

export const StatusField: SelectFieldClientComponent = ({ path, field }) => {
  const { value, setValue } = useField({ path })

  return (
    <div>
      <label>{field.label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)}>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
```

### Cell Component (List View)

```typescript
{
  name: 'status',
  type: 'select',
  options: ['draft', 'published'],
  admin: {
    components: {
      Cell: '/components/StatusCell',
    },
  },
}
```

```tsx
// components/StatusCell.tsx
import type { SelectFieldCellComponent } from 'payload'

export const StatusCell: SelectFieldCellComponent = ({ data, cellData }) => {
  const isPublished = cellData === 'published'

  return (
    <span
      style={{
        color: isPublished ? 'green' : 'orange',
        fontWeight: 'bold',
      }}
    >
      {cellData}
    </span>
  )
}
```

### UI Field (Presentational Only)

Special field type for adding custom UI without affecting data:

```typescript
{
  name: 'refundButton',
  type: 'ui',
  admin: {
    components: {
      Field: '/components/RefundButton',
    },
  },
}
```

```tsx
// components/RefundButton.tsx
'use client'
import { useDocumentInfo } from '@payloadcms/ui'

export default function RefundButton() {
  const { id } = useDocumentInfo()

  return (
    <button
      onClick={async () => {
        await fetch(`/api/orders/${id}/refund`, { method: 'POST' })
        alert('Refund processed')
      }}
    >
      Process Refund
    </button>
  )
}
```

## Using Hooks

Payload provides many React hooks for Client Components:

```tsx
'use client'
import {
  useAuth, // Current user
  useConfig, // Payload config (client-safe)
  useDocumentInfo, // Current document info (id, slug, etc.)
  useField, // Field value and setValue
  useForm, // Form state and dispatch
  useFormFields, // Multiple field values (optimized)
  useLocale, // Current locale
  useTranslation, // i18n translations
  usePayload, // Local API methods
} from '@payloadcms/ui'

export function MyComponent() {
  const { user } = useAuth()
  const { config } = useConfig()
  const { id, collection } = useDocumentInfo()
  const locale = useLocale()
  const { t } = useTranslation()

  return <div>Hello {user?.email}</div>
}
```

**Important:** These hooks only work in Client Components within the Admin Panel context.

## Accessing Payload Config

**In Server Components:**

```tsx
async function MyServerComponent({ payload }) {
  const { config } = payload
  return <div>{config.serverURL}</div>
}
```

**In Client Components:**

```tsx
'use client'
import { useConfig } from '@payloadcms/ui'

export function MyClientComponent() {
  const { config } = useConfig() // Client-safe config
  return <div>{config.serverURL}</div>
}
```

**Important:** Client Components receive a serializable version of the config (functions, validation, etc. are stripped).

## Field Config Access

**Server Component:**

```tsx
import type { TextFieldServerComponent } from 'payload'

export const MyFieldComponent: TextFieldServerComponent = ({ field }) => {
  return <div>Field name: {field.name}</div>
}
```

**Client Component:**

```tsx
'use client'
import type { TextFieldClientComponent } from 'payload'

export const MyFieldComponent: TextFieldClientComponent = ({ clientField }) => {
  // clientField has non-serializable props removed
  return <div>Field name: {clientField.name}</div>
}
```

## Translations (i18n)

**Server Component:**

```tsx
import { getTranslation } from '@payloadcms/translations'

async function MyServerComponent({ i18n }) {
  const translatedTitle = getTranslation(myTranslation, i18n)
  return <p>{translatedTitle}</p>
}
```

**Client Component:**

```tsx
'use client'
import { useTranslation } from '@payloadcms/ui'

export function MyClientComponent() {
  const { t, i18n } = useTranslation()

  return (
    <div>
      <p>{t('namespace:key', { variable: 'value' })}</p>
      <p>Language: {i18n.language}</p>
    </div>
  )
}
```

## Styling Components

### Using CSS Variables

```tsx
import './styles.scss'

export function MyComponent() {
  return <div className="my-component">Custom Component</div>
}
```

```scss
// styles.scss
.my-component {
  background-color: var(--theme-elevation-500);
  color: var(--theme-text);
  padding: var(--base);
  border-radius: var(--border-radius-m);
}
```

### Importing Payload SCSS

```scss
@import '~@payloadcms/ui/scss';

.my-component {
  @include mid-break {
    background-color: var(--theme-elevation-900);
  }
}
```

## Common Patterns

### Conditional Field Visibility

```tsx
'use client'
import { useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

export const ConditionalField: TextFieldClientComponent = ({ path }) => {
  const showField = useFormFields(([fields]) => fields.enableFeature?.value)

  if (!showField) return null

  return <input type="text" />
}
```

### Loading Data from API

```tsx
'use client'
import { useState, useEffect } from 'react'

export function DataLoader() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/custom-data')
      .then((res) => res.json())
      .then(setData)
  }, [])

  return <div>{JSON.stringify(data)}</div>
}
```

### Using Local API in Server Components

```tsx
import type { Payload } from 'payload'

async function RelatedPosts({ payload, id }: { payload: Payload; id: string }) {
  const post = await payload.findByID({
    collection: 'posts',
    id,
    depth: 0,
  })

  const related = await payload.find({
    collection: 'posts',
    where: {
      category: { equals: post.category },
      id: { not_equals: id },
    },
    limit: 5,
  })

  return (
    <div>
      <h3>Related Posts</h3>
      <ul>
        {related.docs.map((doc) => (
          <li key={doc.id}>{doc.title}</li>
        ))}
      </ul>
    </div>
  )
}

export default RelatedPosts
```

## Performance Best Practices

### 1. Minimize Client Bundle Size

```tsx
// ❌ BAD: Imports entire package
'use client'
import { Button } from '@payloadcms/ui'

// ✅ GOOD: Tree-shakeable import for frontend
import { Button } from '@payloadcms/ui/elements/Button'
```

**Rule:** In Admin Panel UI, import from `@payloadcms/ui`. In frontend code, use specific paths.

### 2. Optimize Re-renders

```tsx
// ❌ BAD: Re-renders on every form change
'use client'
import { useForm } from '@payloadcms/ui'

export function MyComponent() {
  const { fields } = useForm()
  // Re-renders on ANY field change
}

// ✅ GOOD: Only re-renders when specific field changes
;('use client')
import { useFormFields } from '@payloadcms/ui'

export function MyComponent({ path }) {
  const value = useFormFields(([fields]) => fields[path])
  // Only re-renders when this field changes
}
```

### 3. Use Server Components When Possible

```tsx
// ✅ GOOD: No JavaScript sent to client
async function PostCount({ payload }) {
  const { totalDocs } = await payload.find({
    collection: 'posts',
    limit: 0,
  })

  return <p>{totalDocs} posts</p>
}

// Only use client components when you need:
// - State (useState, useReducer)
// - Effects (useEffect)
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)
```

### 4. React Best Practices

- Use React.memo() for expensive components
- Implement proper key props in lists
- Avoid inline function definitions in renders
- Use Suspense boundaries for async operations

## Import Map

Payload generates an import map at `app/(payload)/admin/importMap.js` that resolves all component paths.

**Regenerate manually:**

```bash
payload generate:importmap
```

**Override location:**

```typescript
export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, 'src'),
      importMapFile: path.resolve(dirname, 'app', 'custom-import-map.js'),
    },
  },
})
```

## Type Safety

Use Payload's TypeScript types for components:

```tsx
import type {
  TextFieldServerComponent,
  TextFieldClientComponent,
  TextFieldCellComponent,
} from 'payload'

export const MyFieldComponent: TextFieldServerComponent = (props) => {
  // Fully typed props
}
```

## Troubleshooting

### "useConfig is undefined" or similar hook errors

**Cause:** Dependency version mismatch between Payload packages.

**Solution:** Pin all `@payloadcms/*` packages to the exact same version:

```json
{
  "dependencies": {
    "payload": "3.0.0",
    "@payloadcms/ui": "3.0.0",
    "@payloadcms/richtext-lexical": "3.0.0"
  }
}
```

### Component not loading

1. Check file path is correct (relative to baseDir)
2. Verify named export syntax: `/path/to/file#ExportName`
3. Run `payload generate:importmap` to regenerate
4. Check for TypeScript errors in component file

## Resources

- [Custom Components Docs](https://payloadcms.com/docs/custom-components/overview)
- [Root Components](https://payloadcms.com/docs/custom-components/root-components)
- [Custom Views](https://payloadcms.com/docs/custom-components/custom-views)
- [React Hooks](https://payloadcms.com/docs/admin/react-hooks)
- [Custom CSS](https://payloadcms.com/docs/admin/customizing-css)
