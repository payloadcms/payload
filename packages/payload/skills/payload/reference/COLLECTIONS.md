# Payload Collections Reference

Complete reference for collection configurations and patterns.

## Basic Collection

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    useAsTitle: 'title',
    // _status comes from versions.drafts below — no custom status field needed
    defaultColumns: ['title', 'author', '_status', 'createdAt'],
    group: 'Content', // Organize in admin sidebar
    description: 'Blog posts and articles',
    listSearchableFields: ['title', 'slug'],
  },
  // Enable drafts by default — auto-injects the _status field (draft/published/changed)
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
    },
    { name: 'slug', type: 'slug', useAsSlug: 'title' }, // unique + indexed, sidebar position — don't hand-roll a slug text field
  ],
  defaultSort: '-createdAt',
  timestamps: true,
}
```

> Don't add a custom `status` select for publish state — enabling
> `versions: { drafts: true }` injects a managed `_status` field
> (`draft` / `published` / `changed`) that the admin UI and Draft Preview already
> understand. Use it in `defaultColumns` and access control directly.

## `useAsTitle`

Set `admin.useAsTitle` to a stored top-level field. Do not use a computed field configured with `virtual: true`: it is not queryable, and
Payload rejects it as `useAsTitle`.

A relationship-path virtual field is supported when the title must come from a
related document:

```ts
export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'authorName',
  },
  fields: [
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
    },
    {
      name: 'authorName',
      type: 'text',
      virtual: 'author.name',
    },
  ],
}
```

This string-path form is queryable. It is different from a computed
`virtual: true` field populated by an `afterRead` hook.

## Auth Collection

```ts
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      required: true,
      defaultValue: ['user'],
      saveToJWT: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
```

## Upload Collection

```ts
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
      },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
    },
  ],
}
```

## Live Preview

Enable real-time content preview during editing.

```ts
import type { CollectionConfig } from 'payload'

const generatePreviewPath = ({
  slug,
  collection,
  req,
}: {
  slug: string
  collection: string
  req: any
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
  return `${baseUrl}/api/preview?slug=${slug}&collection=${collection}`
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    // Live preview during editing
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug as string,
          collection: 'pages',
          req,
        }),
    },
    // Static preview button
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'pages',
        req,
      }),
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
  ],
}
```

## Versioning & Drafts

Payload maintains version history and supports draft/publish workflows.

```ts
import type { CollectionConfig } from 'payload'

// Basic versioning (audit log only)
export const Users: CollectionConfig = {
  slug: 'users',
  versions: true, // or { maxPerDoc: 100 }
  fields: [{ name: 'name', type: 'text' }],
}

// Drafts enabled (draft/publish workflow)
export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: {
    drafts: true, // Enables _status field
    maxPerDoc: 50,
  },
  fields: [{ name: 'title', type: 'text' }],
}

// Full configuration with autosave and scheduled publish
export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: {
      autosave: true, // Auto-save while editing
      schedulePublish: true, // Schedule future publish/unpublish
      validate: false, // Don't validate drafts (default)
    },
    maxPerDoc: 100, // Keep last 100 versions (0 = unlimited)
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

### Version and action APIs

Reads use `version`. Writes use `action`. There is no public `draft` boolean on operations. `_status` stays on documents and in write `data`.

```ts
// Create draft (create/duplicate default is saveDraft when action and _status are omitted)
await payload.create({
  collection: 'posts',
  data: { title: 'Draft Post' },
  action: 'saveDraft',
})

// Publish (update/restore default is publish when action and _status are omitted)
await payload.update({
  collection: 'posts',
  id: '123',
  data: { title: 'Published Post' },
  action: 'publish',
})

// Unpublish — explicit action only; `_status: 'draft'` infers saveDraft, never unpublish
await payload.update({
  collection: 'posts',
  id: '123',
  action: 'unpublish',
})

// Reads
await payload.findByID({ collection: 'posts', id: '123' }) // published (default)
await payload.findByID({ collection: 'posts', id: '123', version: 'latest' }) // newest draft, else published
await payload.findByID({ collection: 'posts', id: '123', version: 'draft' }) // draft only, no fallback

// REST
// GET /api/posts?version=latest
// POST /api/posts?action=saveDraft
// PATCH /api/posts/123?action=publish

// GraphQL
// query { Posts(version: latest) { docs { title } } }
// mutation { createPost(data: { title: "Draft" }, action: saveDraft) { title } }

// SDK
await sdk.find({ collection: 'posts', version: 'latest' })
```

**Read matrix**

| `version`               | Result                                       |
| ----------------------- | -------------------------------------------- |
| omitted / `'published'` | Published main document                      |
| `'latest'`              | Newest draft if present, otherwise published |
| `'draft'`               | Newest draft only; empty / not-found if none |

**Write matrix** — precedence is explicit `action`, then recognized `_status`, then operation default. Action always wins; core canonicalizes persisted `_status` from the effective action.

| Operation          | Allowed actions                     | Default     |
| ------------------ | ----------------------------------- | ----------- |
| Create / duplicate | `saveDraft`, `publish`              | `saveDraft` |
| Update             | `saveDraft`, `publish`, `unpublish` | `publish`   |
| Restore            | `saveDraft`, `publish`              | `publish`   |

`_status: 'draft'` infers `saveDraft`. `_status: 'published'` infers `publish`. Localized `_status` uses the active write locale. Non-draft collections accept omitted/`publish` only; `saveDraft`/`unpublish` throw. `afterChange.action` is the resolved action, or `undefined` without drafts.

Local API and SDK types are always strict. `typescript.strictDraftTypes` is gone — do not add a replacement flag.

**Codemod will not rewrite these — migrate by hand:**

```ts
// Dynamic write
await payload.update({
  collection: 'posts',
  id,
  data,
  action: shouldSaveDraft ? 'saveDraft' : 'publish',
})

// Preview read from Next.js draftMode
const { isEnabled: isDraftMode } = await draftMode()
await payload.find({ collection: 'pages', version: isDraftMode ? 'latest' : 'published' })

// Update that used to pass draft: false without _status — old behavior depended on existing state.
// Pick explicit action: 'publish' | 'saveDraft' | 'unpublish'.
```

**Search checklist for leftover `draft` operation arguments:**

```sh
rg -n "draft:\\s*(true|false)|draft:\\s*\\w|[?&]draft=|strictDraftTypes" src
```

Do not rewrite `versions.drafts`, document `_status: 'draft'`, or UI "Save Draft" copy. Those are still correct.

Access control still uses `_status`, not `version`:

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  versions: { drafts: true },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { _status: { equals: 'published' } }
      return true
    },
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

### Document Status

The `_status` field is auto-injected when drafts are enabled:

- `draft` - Never published
- `published` - Published with no newer drafts
- `changed` - Published but has newer unpublished drafts

## Globals

Globals are single-instance documents (not collections).

```ts
import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'nav',
      type: 'array',
      maxRows: 8,
      fields: [
        {
          name: 'link',
          type: 'relationship',
          relationTo: 'pages',
        },
        {
          name: 'label',
          type: 'text',
        },
      ],
    },
  ],
}
```
