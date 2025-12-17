---
title: Plugin Development
description: Creating Payload CMS plugins with TypeScript patterns
tags: [payload, plugins, architecture, patterns]
---

# Payload Plugin Development

## Plugin Architecture

Plugins are functions that receive configuration options and return a function that transforms the Payload config:

```typescript
import type { Config, Plugin } from 'payload'

interface MyPluginConfig {
  enabled?: boolean
  collections?: string[]
}

export const myPlugin =
  (options: MyPluginConfig): Plugin =>
  (config: Config): Config => ({
    ...config,
    // Transform config here
  })
```

**Key Pattern:** Double arrow function (currying)

- First function: Accepts plugin options, returns plugin function
- Second function: Accepts Payload config, returns modified config

## Adding Fields to Collections

```typescript
export const seoPlugin =
  (options: { collections?: string[] }): Plugin =>
  (config: Config): Config => {
    const seoFields: Field[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [
          { name: 'title', type: 'text' },
          { name: 'description', type: 'textarea' },
        ],
      },
    ]

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (options.collections?.includes(collection.slug)) {
          return {
            ...collection,
            fields: [...(collection.fields || []), ...seoFields],
          }
        }
        return collection
      }),
    }
  }
```

## Adding New Collections

```typescript
export const redirectsPlugin =
  (options: { overrides?: Partial<CollectionConfig> }): Plugin =>
  (config: Config): Config => {
    const redirectsCollection: CollectionConfig = {
      slug: 'redirects',
      access: { read: () => true },
      fields: [
        { name: 'from', type: 'text', required: true, unique: true },
        { name: 'to', type: 'text', required: true },
      ],
      ...options.overrides,
    }

    return {
      ...config,
      collections: [...(config.collections || []), redirectsCollection],
    }
  }
```

## Adding Hooks

```typescript
const resaveChildrenHook: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'update') {
    const children = await req.payload.find({
      collection: 'pages',
      where: { parent: { equals: doc.id } },
    })

    for (const child of children.docs) {
      await req.payload.update({
        collection: 'pages',
        id: child.id,
        data: child,
      })
    }
  }
  return doc
}

export const nestedDocsPlugin =
  (options: { collections: string[] }): Plugin =>
  (config: Config): Config => ({
    ...config,
    collections: (config.collections || []).map((collection) => {
      if (options.collections.includes(collection.slug)) {
        return {
          ...collection,
          hooks: {
            ...(collection.hooks || {}),
            afterChange: [resaveChildrenHook, ...(collection.hooks?.afterChange || [])],
          },
        }
      }
      return collection
    }),
  })
```

## Adding Root-Level Endpoints

```typescript
export const seoPlugin =
  (options: { generateTitle?: (doc: any) => string }): Plugin =>
  (config: Config): Config => {
    const generateTitleEndpoint: Endpoint = {
      path: '/plugin-seo/generate-title',
      method: 'post',
      handler: async (req) => {
        const data = await req.json?.()
        const result = options.generateTitle ? options.generateTitle(data.doc) : ''
        return Response.json({ result })
      },
    }

    return {
      ...config,
      endpoints: [...(config.endpoints ?? []), generateTitleEndpoint],
    }
  }
```

## Field Overrides with Defaults

```typescript
type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

interface PluginConfig {
  collections?: string[]
  fields?: FieldsOverride
}

export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    const defaultFields: Field[] = [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
    ]

    const fields =
      options.fields && typeof options.fields === 'function'
        ? options.fields({ defaultFields })
        : defaultFields

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (options.collections?.includes(collection.slug)) {
          return {
            ...collection,
            fields: [...(collection.fields || []), ...fields],
          }
        }
        return collection
      }),
    }
  }
```

## Disable Plugin Pattern

```typescript
interface PluginConfig {
  disabled?: boolean
  collections?: string[]
}

export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    // Always add collections/fields for database schema consistency
    if (!config.collections) {
      config.collections = []
    }

    config.collections.push({
      slug: 'plugin-collection',
      fields: [{ name: 'title', type: 'text' }],
    })

    // If disabled, return early but keep schema changes
    if (options.disabled) {
      return config
    }

    // Add endpoints, hooks, components only when enabled
    config.endpoints = [
      ...(config.endpoints ?? []),
      {
        path: '/my-endpoint',
        method: 'get',
        handler: async () => Response.json({ message: 'Hello' }),
      },
    ]

    return config
  }
```

## Admin Components

```typescript
export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    if (!config.admin) config.admin = {}
    if (!config.admin.components) config.admin.components = {}
    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    // Add client component
    config.admin.components.beforeDashboard.push('my-plugin-name/client#BeforeDashboardClient')

    // Add server component (RSC)
    config.admin.components.beforeDashboard.push('my-plugin-name/rsc#BeforeDashboardServer')

    return config
  }
```

## onInit Hook

```typescript
export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // IMPORTANT: Call existing onInit first
      if (incomingOnInit) await incomingOnInit(payload)

      // Plugin initialization
      payload.logger.info('Plugin initialized')

      // Example: Seed data
      const { totalDocs } = await payload.count({
        collection: 'plugin-collection',
        where: { id: { equals: 'seeded-by-plugin' } },
      })

      if (totalDocs === 0) {
        await payload.create({
          collection: 'plugin-collection',
          data: { id: 'seeded-by-plugin' },
        })
      }
    }

    return config
  }
```

## Best Practices

### Preserve Existing Config

```typescript
// ✅ Good
collections: [...(config.collections || []), newCollection]

// ❌ Bad
collections: [newCollection]
```

### Respect User Overrides

```typescript
const collection: CollectionConfig = {
  slug: 'redirects',
  fields: defaultFields,
  ...options.overrides, // User overrides last
}
```

### Hook Composition

```typescript
hooks: {
  ...collection.hooks,
  afterChange: [
    myHook,
    ...(collection.hooks?.afterChange || []),
  ],
}
```

### Type Safety

```typescript
import type { Config, Plugin, CollectionConfig, Field } from 'payload'
```
