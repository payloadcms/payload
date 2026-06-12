# Payload CMS Hooks Reference

Complete reference for root hooks, collection hooks, global hooks, field hooks, and hook context patterns.

## Root Hooks

Root Hooks are not associated with any specific Collection, Global, or Field. Defined in `buildConfig({ hooks: ... })`.

| Hook         | When it runs                                                          |
| ------------ | --------------------------------------------------------------------- |
| `afterError` | After any error in the Payload application (REST, GraphQL, Local API) |

```ts
import { buildConfig } from 'payload'

export default buildConfig({
  hooks: {
    afterError: [
      async ({ error, req, result, graphqlResult }) => {
        // Log to Sentry, Datadog, etc.
        await reportError(error, { url: req?.url })
        // Optionally mutate result / status code for REST responses
        return result
      },
    ],
  },
})
```

`afterError` args: `error`, `req`, `context`, `result` (REST response object), `graphqlResult`, `collection` (present when error is collection-scoped).

## Collection Hooks

Full hook family — all available on `CollectionConfig.hooks`:

| Hook              | Operation(s)   | Runs                                                 |
| ----------------- | -------------- | ---------------------------------------------------- |
| `beforeOperation` | all            | Wraps the operation; return modified args            |
| `beforeValidate`  | create, update | Before server-side validation; after client validate |
| `beforeChange`    | create, update | After validation; before write                       |
| `afterChange`     | create, update | After write                                          |
| `beforeRead`      | find, findByID | Before locale flatten / hidden-field removal         |
| `afterRead`       | find, findByID | Last step before return                              |
| `beforeDelete`    | delete         | Before delete; return discarded                      |
| `afterDelete`     | delete         | After delete; return discarded                       |
| `afterOperation`  | all            | After operation completes; return modified result    |
| `afterError`      | all            | After any error on this collection                   |

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeOperation: [async ({ args, operation }) => args],
    beforeValidate: [async ({ data, operation }) => data],
    beforeChange: [async ({ data, req, operation, originalDoc }) => data],
    afterChange: [async ({ doc, req, operation, previousDoc }) => doc],
    beforeRead: [async ({ doc, req }) => doc],
    afterRead: [async ({ doc, req }) => doc],
    beforeDelete: [async ({ req, id }) => {}],
    afterDelete: [async ({ req, id, doc }) => {}],
    afterOperation: [async ({ result, operation }) => result],
    afterError: [async ({ error, req, result }) => result],
  },
}
```

### Common patterns

Real-world hook bodies demonstrating the most frequent use cases:

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    // Normalise slug from title on create
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],

    // Stamp publishedAt when status flips to published
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'update' && data.status === 'published') {
          data.publishedAt = new Date()
        }
        return data
      },
    ],

    // Send notification on first publish
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (operation === 'create') {
          await sendNotification(doc)
        }
        return doc
      },
    ],

    // Attach real-time view count (virtual field)
    afterRead: [
      async ({ doc, req }) => {
        doc.viewCount = await getViewCount(doc.id)
        return doc
      },
    ],

    // Clean up related data before deletion
    beforeDelete: [
      async ({ req, id }) => {
        await cleanupRelatedData(id)
      },
    ],
  },
}
```

### `originalDoc` vs delta `data` gotcha

On **update**, `data` contains only the fields being changed — not the full document. The document `id` is **not** in `data`. Read `originalDoc.id` and any unchanged fields from `originalDoc`:

```ts
const beforeChange: CollectionBeforeChangeHook = async ({ data, originalDoc, operation }) => {
  // WRONG on update — data.id is undefined
  // CORRECT:
  const id = operation === 'update' ? originalDoc.id : undefined

  // Enforce title cannot be cleared
  if (operation === 'update' && 'title' in (data ?? {}) && !data.title) {
    throw new Error(`Document ${id} must have a title`)
  }
  return data
}
```

On **create**, `originalDoc` is undefined and the document id is not yet assigned (use `afterChange` if you need it).

### Auth-Enabled Collection Hooks

Available only on collections with `auth: true`:

| Hook                  | When it runs                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `beforeLogin`         | Credentials matched, before token generation — throw to reject login |
| `afterLogin`          | After successful login — receives `user`, `token`                    |
| `afterLogout`         | After logout                                                         |
| `afterRefresh`        | After token refresh — receives `token`, `exp`                        |
| `afterMe`             | After `/me` operation — receives `response`                          |
| `afterForgotPassword` | After forgotPassword — return discarded                              |
| `refresh`             | Replace default refresh logic entirely (return value short-circuits) |
| `me`                  | Replace default me logic entirely (return value short-circuits)      |

```ts
import type { CollectionBeforeLoginHook } from 'payload'
import { APIError } from 'payload'

const rejectBannedUsers: CollectionBeforeLoginHook = async ({ user }) => {
  if (user.isBanned) {
    throw new APIError('Your account has been suspended', 403)
  }
  return user
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  hooks: {
    beforeLogin: [rejectBannedUsers],
    afterLogin: [
      async ({ user, token }) => {
        await auditLog({ event: 'login', userId: user.id })
        return user
      },
    ],
  },
  fields: [],
}
```

## Global Hooks

Global hooks follow the same pattern as collection hooks but with a smaller set (no delete, no auth hooks). Defined on `GlobalConfig.hooks`:

| Hook              | When it runs                                 |
| ----------------- | -------------------------------------------- |
| `beforeOperation` | Before operation args are processed          |
| `beforeValidate`  | Before server-side validation                |
| `beforeChange`    | After validation; before write               |
| `afterChange`     | After write                                  |
| `beforeRead`      | Before locale flatten / hidden-field removal |
| `afterRead`       | Last step before return                      |

```ts
import type { GlobalConfig, GlobalAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'
import type { SiteSettings } from '@/payload-types'

const revalidateHeader: GlobalAfterChangeHook<SiteSettings> = ({ doc }) => {
  revalidatePath('/', 'layout')
  return doc
}

export const Header: GlobalConfig = {
  slug: 'header',
  hooks: {
    beforeChange: [async ({ data, originalDoc }) => data],
    afterChange: [revalidateHeader],
    afterRead: [async ({ doc }) => doc],
  },
  fields: [{ name: 'navItems', type: 'array', fields: [{ name: 'label', type: 'text' }] }],
}
```

Global TypeScript types:

```ts
import type {
  GlobalBeforeOperationHook,
  GlobalBeforeValidateHook,
  GlobalBeforeChangeHook,
  GlobalAfterChangeHook,
  GlobalBeforeReadHook,
  GlobalAfterReadHook,
} from 'payload'
```

## Field Hooks

Field hooks available: `beforeValidate`, `beforeChange`, `beforeDuplicate`, `afterChange`, `afterRead`.

| Hook              | When it runs                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `beforeValidate`  | Before server-side validation on create/update                                               |
| `beforeChange`    | After validation; before write                                                               |
| `beforeDuplicate` | Before a document duplicate is created; before `beforeValidate` — use to clear unique fields |
| `afterChange`     | After write                                                                                  |
| `afterRead`       | Before field is returned                                                                     |

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

### `beforeDuplicate` — clear unique fields on duplicate

Payload appends `" - Copy"` to unique required text fields by default. Supply your own `beforeDuplicate` hook to override:

```ts
const slugField: Field = {
  name: 'slug',
  type: 'text',
  unique: true,
  hooks: {
    // Clear slug so it gets regenerated from title on the duplicate
    beforeDuplicate: [({ value }) => undefined],
  },
}
```

## Validation Order

When a field has both client-side `validate` and server-side hooks, the execution order is:

1. **Client**: `validate` runs in the browser (if the field has a custom `validate` function in its component)
2. **Server**: `beforeValidate` hook runs (data formatting/normalisation)
3. **Server**: `validate` function runs (field-level validation)

`beforeValidate` is the right place to normalise data (e.g. slugify, lowercase). Keep `validate` for pure constraint checks. Do not put side effects in `validate`.

## Blocking vs Non-Blocking Hooks

A hook blocks the operation if it returns a Promise (e.g. declared `async`). Payload awaits blocking hooks in series before continuing the lifecycle.

A hook that returns `void` (not `async`, no explicit `return`) is **fire-and-forget** — Payload does not wait for it. Use for side effects that don't affect the response (analytics, audit pings). Any work started this way may continue after the request completes.

```ts
// Blocking — Payload waits for fetchProfile to resolve
const beforeChange: CollectionBeforeChangeHook = async ({ data }) => {
  const enriched = await fetchProfile(data.userId)
  return { ...data, profile: enriched }
}

// Non-blocking — fires and forgets; does not delay response
const afterChange: CollectionAfterChangeHook = ({ doc }) => {
  void pingAnalytics(doc.id) // no return → Payload does not await
}
```

For long-running tasks that don't affect the response, offload to the jobs queue instead (see [JOBS-QUEUE.md](JOBS-QUEUE.md)).

## Server-Only Execution

Hooks run **only on the server** and are excluded from the client bundle automatically. Safe to use secrets, DB calls, or internal service calls directly in hook functions.

## Throwing Custom Errors

Use `APIError` to return a meaningful HTTP status + message from any hook:

```ts
import { APIError } from 'payload'
import type { CollectionBeforeChangeHook } from 'payload'

const rateLimitHook: CollectionBeforeChangeHook = async ({ data, req }) => {
  const exceeded = await checkRateLimit(req.user?.id)
  if (exceeded) {
    throw new APIError('Too many requests', 429)
  }
  return data
}
```

`APIError(message, httpStatus?, data?, isPublic?)` — `isPublic: true` (default) surfaces the message to the client.

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

### Context Module Augmentation

The default `context` type is `{ [key: string]: unknown }`. For strict typing, augment the `RequestContext` interface in any `.ts` or `.d.ts` file:

```ts
declare module 'payload' {
  export interface RequestContext {
    skipHooks?: boolean
    expensiveData?: MyDataShape
  }
}
```

After augmentation, `context.skipHooks` is typed everywhere hooks receive `context`.

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

## Generic-Typed Hook Helpers

Pass your generated document type as a generic for full type safety:

```ts
import type { CollectionAfterChangeHook, FieldHook } from 'payload'
import type { Post } from '@/payload-types'

// Collection hook — doc and previousDoc typed as Post
const afterChange: CollectionAfterChangeHook<Post> = async ({ doc, previousDoc }) => {
  return doc
}

// Field hook — three generics: <DocType, FieldValueType, SiblingDataType>
const slugHook: FieldHook<Post, string, Post> = ({ value, siblingData }) => {
  if (!siblingData.slug && value) {
    return value.toLowerCase().replace(/\s+/g, '-')
  }
  return value
}
```

All collection hook types accept an optional generic (`CollectionBeforeChangeHook<Post>`, `CollectionBeforeLoginHook`, etc.). `FieldHook<Doc, Value, Sibling>` gives you typed `value`, `data`, `siblingData`, and `originalDoc`.

## Hook Patterns Best Practices

- Use `beforeValidate` for data formatting (normalize before validation runs)
- Use `beforeChange` for business logic (data is validated at this point)
- Use `afterChange` for side effects (doc id is available; use context to prevent infinite loops)
- Use `afterRead` for computed/virtual fields
- Store expensive operations in `context` to avoid repeat fetches across hooks
- Pass `req` to nested operations for transaction safety (see [ADAPTERS.md#threading-req-through-operations](ADAPTERS.md#threading-req-through-operations))
- Throw `APIError` (not plain `Error`) for user-facing error messages with HTTP status codes
- Prefer field-level `afterRead` hooks over collection-level when the computation is scoped to one field
