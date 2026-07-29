# Payload Hooks Reference

Complete reference for collection hooks, field hooks, and hook context patterns.

## Collection Hooks

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    // Before validation
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],

    // Before save
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'update' && data.status === 'published') {
          data.publishedAt = new Date()
        }
        return data
      },
    ],

    // After save
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (operation === 'create') {
          await sendNotification(doc)
        }
        return doc
      },
    ],

    // After read
    afterRead: [
      async ({ doc, req }) => {
        doc.viewCount = await getViewCount(doc.id)
        return doc
      },
    ],

    // Before delete
    beforeDelete: [
      async ({ req, id }) => {
        await cleanupRelatedData(id)
      },
    ],
  },
}
```

## Field Hooks

```ts
import type { EmailField, FieldHook } from 'payload'

const beforeValidateHook: FieldHook = ({ value }) => {
  return value.trim().toLowerCase()
}

const afterReadHook: FieldHook = ({ value, req }) => {
  // Hide email from non-admins
  if (!req.user?.roles?.includes('admin')) {
    return value.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  }
  return value
}

const emailField: EmailField = {
  name: 'email',
  type: 'email',
  hooks: {
    beforeValidate: [beforeValidateHook],
    afterRead: [afterReadHook],
  },
}
```

## Hook Context

Share data between hooks or control hook behavior using request context:

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeChange: [
      async ({ context }) => {
        context.expensiveData = await fetchExpensiveData()
      },
    ],
    afterChange: [
      async ({ context, doc }) => {
        // Reuse from previous hook
        await processData(doc, context.expensiveData)
      },
    ],
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

## Next.js Revalidation with Context Control

```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { Page } from '../payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
      payload.logger.info(`Revalidating page at path: ${path}`)
      revalidatePath(path)
    }

    // Revalidate old path if unpublished
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`
      payload.logger.info(`Revalidating old page at path: ${oldPath}`)
      revalidatePath(oldPath)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    revalidatePath(path)
  }
  return doc
}
```

## Date Field Auto-Set

Automatically set date when document is published:

```ts
import type { DateField } from 'payload'

const publishedOnField: DateField = {
  name: 'publishedOn',
  type: 'date',
  admin: {
    date: {
      pickerAppearance: 'dayAndTime',
    },
    position: 'sidebar',
  },
  hooks: {
    beforeChange: [
      ({ siblingData, value }) => {
        if (siblingData._status === 'published' && !value) {
          return new Date()
        }
        return value
      },
    ],
  },
}
```

## Hook Patterns Best Practices

- Use `beforeValidate` for data formatting
- Use `beforeChange` for business logic
- Use `afterChange` for side effects
- Use `afterRead` for computed fields
- Store expensive operations in `context`
- Pass `req` to nested operations for transaction safety (see [ADAPTERS.md#threading-req-through-operations](ADAPTERS.md#threading-req-through-operations))
