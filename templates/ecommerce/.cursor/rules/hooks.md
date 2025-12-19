---
title: Hooks
description: Collection hooks, field hooks, and context patterns
tags: [payload, hooks, lifecycle, context]
---

# Payload CMS Hooks

## Collection Hooks

```typescript
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    // Before validation - format data
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],

    // Before save - business logic
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'update' && data.status === 'published') {
          data.publishedAt = new Date()
        }
        return data
      },
    ],

    // After save - side effects
    afterChange: [
      async ({ doc, req, operation, previousDoc, context }) => {
        // Check context to prevent loops
        if (context.skipNotification) return

        if (operation === 'create') {
          await sendNotification(doc)
        }
        return doc
      },
    ],

    // After read - computed fields
    afterRead: [
      async ({ doc, req }) => {
        doc.viewCount = await getViewCount(doc.id)
        return doc
      },
    ],

    // Before delete - cascading deletes
    beforeDelete: [
      async ({ req, id }) => {
        await req.payload.delete({
          collection: 'comments',
          where: { post: { equals: id } },
          req, // Important for transaction
        })
      },
    ],
  },
}
```

## Field Hooks

```typescript
import type { FieldHook } from 'payload'

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

{
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

```typescript
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
}
```

## Next.js Revalidation Pattern

```typescript
import type { CollectionAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'

export const revalidatePage: CollectionAfterChangeHook = ({
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
      revalidatePath(oldPath)
    }
  }
  return doc
}
```

## Date Field Auto-Set

```typescript
{
  name: 'publishedOn',
  type: 'date',
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

## Best Practices

- Use `beforeValidate` for data formatting
- Use `beforeChange` for business logic
- Use `afterChange` for side effects
- Use `afterRead` for computed fields
- Store expensive operations in `context`
- Pass `req` to nested operations for transaction safety
- Use context flags to prevent infinite loops
