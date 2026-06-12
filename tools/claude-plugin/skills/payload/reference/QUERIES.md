# Payload CMS Querying Reference

Complete reference for querying data across Local API, REST, and GraphQL.

## Query Operators

```ts
import type { Where } from 'payload'

// Equals
const equalsQuery: Where = { color: { equals: 'blue' } }

// Not equals
const notEqualsQuery: Where = { status: { not_equals: 'draft' } }

// Greater/less than
const greaterThanQuery: Where = { price: { greater_than: 100 } }
const lessThanEqualQuery: Where = { age: { less_than_equal: 65 } }

// Contains (case-insensitive)
const containsQuery: Where = { title: { contains: 'payload' } }

// Like (all words present)
const likeQuery: Where = { description: { like: 'cms headless' } }

// In/not in
const inQuery: Where = { category: { in: ['tech', 'news'] } }

// All (value must contain ALL provided — MongoDB only)
const allQuery: Where = { tags: { all: ['javascript', 'typescript'] } }

// Exists
const existsQuery: Where = { image: { exists: true } }

// Near (point fields) — order: longitude, latitude, maxDistance (m), minDistance (m)
const nearQuery: Where = { location: { near: '-122.4194,37.7749,10000,0' } }

// Within / Intersects — GeoJSON polygon (point fields only)
// within: { type: 'Polygon', coordinates: [[...]] }
// intersects: { type: 'Polygon', coordinates: [[...]] }
```

> `all` is MongoDB-only. `within` / `intersects` require a Point field and a GeoJSON geometry object.

## AND/OR Logic

```ts
import type { Where } from 'payload'

const complexQuery: Where = {
  or: [
    { color: { equals: 'mint' } },
    {
      and: [{ color: { equals: 'white' } }, { featured: { equals: false } }],
    },
  ],
}
```

## Nested Properties

```ts
import type { Where } from 'payload'

const nestedQuery: Where = {
  'author.role': { equals: 'editor' },
  'meta.featured': { exists: true },
}
```

## Local API

### All Local API Options

These options apply to most Local API operations (`find`, `findByID`, `create`, `update`, `delete`, `count`, `findGlobal`, `updateGlobal`).

| Option               | Default | Description                                                                                |
| -------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `collection`         | —       | Required for collection ops. The collection slug.                                          |
| `data`               | —       | Document data. Required for `create` / `update`.                                           |
| `depth`              | `2`     | Auto-populate depth for relationships/uploads.                                             |
| `locale`             | —       | Return docs in this locale.                                                                |
| `fallbackLocale`     | —       | Fallback locale(s) when the primary locale has no value.                                   |
| `select`             | —       | Field selection — include or exclude fields. See [Select](#selectpopulate).                |
| `populate`           | —       | Per-collection select override for populated documents.                                    |
| `overrideAccess`     | `true`  | Skip access control. Set to `false` when acting on behalf of a user.                       |
| `user`               | —       | User document for access checks (only meaningful when `overrideAccess: false`).            |
| `overrideLock`       | `true`  | Ignore document locks. Set to `false` to enforce locks.                                    |
| `showHiddenFields`   | `false` | Return hidden fields.                                                                      |
| `pagination`         | `true`  | Set `false` to return all docs and skip count queries.                                     |
| `disableErrors`      | `false` | When `true`, `findByID` returns `null` and `find` returns empty array instead of throwing. |
| `disableTransaction` | `false` | Skip initialising a database transaction for this operation.                               |
| `context`            | —       | Arbitrary key/value map passed to `req.context` — readable by all hooks in this operation. |
| `req`                | —       | Pass a `PayloadRequest` to join an existing transaction. Recommended in hooks.             |

```ts
// Find documents
const posts = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    'author.name': { contains: 'john' },
  },
  depth: 2,
  limit: 10,
  page: 1,
  sort: '-createdAt',
  locale: 'en',
  select: {
    title: true,
    author: true,
  },
})

// Find by ID
const post = await payload.findByID({
  collection: 'posts',
  id: '123',
  depth: 2,
  disableErrors: true, // returns null instead of 404
})

// findDistinct — distinct values for a field
const result = await payload.findDistinct({
  collection: 'posts',
  field: 'category',
  where: { status: { equals: 'published' } },
  sort: 'category',
  limit: 50,
  // result: { values: ['tech', 'news'], field: 'category', totalDocs: 2, perPage: 50 }
})

// Create
const post = await payload.create({
  collection: 'posts',
  data: { title: 'New Post', status: 'draft' },

  // Duplicate an existing document
  duplicateFromID: 'existing-doc-id',

  // File upload (Node.js — server-side only)
  filePath: path.resolve(__dirname, './image.jpg'),
  // OR pass a File/Blob directly (filePath ignored if file is provided)
  // file: uploadedFile,

  // Auth collections: skip the verification email
  disableVerificationEmail: true,
})

// Update by ID
const updated = await payload.update({
  collection: 'posts',
  id: '123',
  data: { status: 'published' },
  overwriteExistingFiles: true, // replace existing upload rather than generating a new filename
})

// Bulk update — returns { docs, errors }
const bulkResult = await payload.update({
  collection: 'posts',
  where: { status: { equals: 'draft' } },
  data: { status: 'archived' },
  // result: { docs: [...], errors: [] }
})

// Delete by ID
await payload.delete({ collection: 'posts', id: '123' })

// Bulk delete — returns { docs, errors }
const deletedResult = await payload.delete({
  collection: 'posts',
  where: { status: { equals: 'archived' } },
  // result: { docs: [...], errors: [] }
})

// Count
const { totalDocs } = await payload.count({
  collection: 'posts',
  where: { status: { equals: 'published' } },
})
```

### Globals via Local API

```ts
// Read a global
const header = await payload.findGlobal({
  slug: 'header',
  depth: 1,
  locale: 'en',
})

// Update a global
const updated = await payload.updateGlobal({
  slug: 'header',
  data: { navItems: [{ label: 'Home', url: '/' }] },
  overrideLock: false, // enforce lock
})
```

### Versions API

For collections and globals with `versions` enabled:

```ts
// Find version history
const versions = await payload.findVersions({
  collection: 'posts',
  where: { parent: { equals: postId } },
  limit: 10,
})

// Find a single version
const version = await payload.findVersionByID({
  collection: 'posts',
  id: versionId,
})

// Restore a version
const restored = await payload.restoreVersion({
  collection: 'posts',
  id: versionId,
})

// Global equivalents
const globalVersions = await payload.findGlobalVersions({ slug: 'header' })
const globalVersion = await payload.findGlobalVersionByID({ slug: 'header', id: versionId })
await payload.restoreGlobalVersion({ slug: 'header', id: versionId })
```

### Server Functions (Next.js)

Local API is server-only. Expose it to client components via `'use server'` functions:

```ts
'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export async function createPost(data: { title: string }) {
  const payload = await getPayload({ config })
  return payload.create({ collection: 'posts', data })
}

// File upload from client — accept File/Blob argument
export async function uploadMedia(file: File) {
  const payload = await getPayload({ config })
  return payload.create({
    collection: 'media',
    data: {},
    file,
  })
}
```

**Reusable auth server functions** — `@payloadcms/next/auth` ships `login`, `logout`, and `refresh` that handle cookie management automatically. Do not re-implement these:

```ts
'use server'

import { login, logout, refresh } from '@payloadcms/next/auth'
import config from '@payload-config'

export const loginAction = (email: string, password: string) =>
  login({ collection: 'users', config, email, password })

export const logoutAction = () => logout({ allSessions: true, config })

export const refreshAction = () => refresh({ config })
```

### Standalone Scripts (`payload run`)

Run TypeScript files with the Local API outside Next.js — seeders, one-off transforms, manual migrations.

```ts
// scripts/seed.ts — see docs/local-api/outside-nextjs.mdx
import { getPayload } from 'payload'
import config from '@payload-config'
const payload = await getPayload({ config })
await payload.create({ collection: 'posts', data: { title: 'Hello' } })
```

```sh
pnpm payload run scripts/seed.ts
# --use-swc       use SWC instead of tsx (requires @swc-node/register)
# --disable-transpile  skip transpilation (pre-compiled JS or bun runtime)
```

Loads `.env` the same way Next.js does — no `dotenv` needed.

### Threading req Parameter

When performing operations in hooks or nested operations, pass the `req` parameter to maintain transaction context:

```ts
// ✅ CORRECT: Pass req for transaction safety
const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await req.payload.create({
    collection: 'audit-log',
    data: { action: 'created', docId: doc.id },
    req, // Maintains transaction atomicity
  })
}

// ❌ WRONG: Missing req breaks transaction
const afterChange: CollectionAfterChangeHook = async ({ doc, req }) => {
  await req.payload.create({
    collection: 'audit-log',
    data: { action: 'created', docId: doc.id },
    // Missing req - runs in separate transaction
  })
}
```

This is critical for MongoDB replica sets and Postgres. See [ADAPTERS.md#threading-req-through-operations](ADAPTERS.md#threading-req-through-operations) for details.

### Access Control in Local API

**Important**: Local API bypasses access control by default (`overrideAccess: true`). When passing a `user` parameter, you must explicitly set `overrideAccess: false` to respect that user's permissions.

```ts
// ❌ WRONG: User is passed but access control is bypassed
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
  // Missing: overrideAccess: false
  // Result: Operation runs with ADMIN privileges, ignoring user's permissions
})

// ✅ CORRECT: Respects user's access control permissions
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
  overrideAccess: false, // Required to enforce access control
  // Result: User only sees posts they have permission to read
})

// Administrative operation (intentionally bypass access control)
const allPosts = await payload.find({
  collection: 'posts',
  // No user parameter
  // overrideAccess defaults to true
  // Result: Returns all posts regardless of access control
})
```

**When to use `overrideAccess: false`:**

- Performing operations on behalf of a user
- Testing access control logic
- API routes that should respect user permissions
- Any operation where `user` parameter is provided

**When `overrideAccess: true` is appropriate:**

- Administrative operations (migrations, seeds, cron jobs)
- Internal system operations
- Operations explicitly intended to bypass access control

See [ACCESS-CONTROL.md#important-notes](ACCESS-CONTROL.md#important-notes) for more details.

## REST API

```ts
import { stringify } from 'qs-esm'

const query = {
  status: { equals: 'published' },
}

const queryString = stringify(
  {
    where: query,
    depth: 2,
    limit: 10,
  },
  { addQueryPrefix: true },
)

const response = await fetch(`https://api.example.com/api/posts${queryString}`)
const data = await response.json()
```

### REST Endpoint Inventory

```txt
// Collections
GET    /api/{collection}                    Find (paginated)
GET    /api/{collection}/{id}               Find by ID
GET    /api/{collection}/count              Count
POST   /api/{collection}                    Create
PATCH  /api/{collection}                    Bulk update (where query in body)
PATCH  /api/{collection}/{id}               Update by ID
DELETE /api/{collection}                    Bulk delete (where query in body)
DELETE /api/{collection}/{id}               Delete by ID

// Auth (auth-enabled collections only)
POST   /api/{collection}/login
POST   /api/{collection}/logout
POST   /api/{collection}/refresh-token
GET    /api/{collection}/me
POST   /api/{collection}/forgot-password
POST   /api/{collection}/reset-password
POST   /api/{collection}/unlock
POST   /api/{collection}/verify/{token}

// Globals
GET    /api/globals/{slug}                  Get global
POST   /api/globals/{slug}                  Update global

// Versions (versions-enabled collections/globals)
GET    /api/{collection}/versions
GET    /api/{collection}/versions/{id}
POST   /api/{collection}/versions/{id}/restore
GET    /api/globals/{slug}/versions
GET    /api/globals/{slug}/versions/{id}
POST   /api/globals/{slug}/versions/{id}/restore

// Admin preferences
GET    /api/payload-preferences/{key}
POST   /api/payload-preferences/{key}
DELETE /api/payload-preferences/{key}

// GraphQL
POST   /api/graphql
GET    /api/graphql-playground
```

### REST Query Parameters

| Parameter         | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `depth`           | Relationship/upload population depth (default `2`)              |
| `limit`           | Max docs per page (default `10`; `0` disables pagination)       |
| `page`            | Page number                                                     |
| `sort`            | Field name, prefix `-` for desc; comma-separate for multi-field |
| `where`           | Query filter object (serialize with `qs-esm`)                   |
| `select`          | Field inclusion/exclusion object                                |
| `populate`        | Per-collection populate override (`populate[pages][slug]=true`) |
| `locale`          | Return docs in this locale                                      |
| `fallback-locale` | Fallback locale when primary has no value                       |
| `joins`           | Per-join-field request customization                            |

### Method Override for Long Queries

When a `where` clause makes the URL too long, POST with a special header:

```ts
const res = await fetch(`/api/posts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Payload-HTTP-Method-Override': 'GET',
  },
  body: qs.stringify({ depth: 1, where: complexQuery }),
})
```

### Payload REST SDK

Type-safe REST client (`@payloadcms/sdk`, **beta**) — mirrors the Local API interface over HTTP. Pass the generated `Config` type for full type safety.

```ts
import { PayloadSDK } from '@payloadcms/sdk'
import type { Config } from './payload-types'

const sdk = new PayloadSDK<Config>({ baseURL: 'https://example.com/api' })
const posts = await sdk.find({ collection: 'posts', limit: 10 })
await sdk.restoreVersion({ collection: 'posts', id: versionId })
```

## GraphQL

```graphql
query {
  Posts(where: { status: { equals: published } }, limit: 10, sort: "-createdAt") {
    docs {
      id
      title
      author {
        name
      }
    }
    totalDocs
    hasNextPage
  }
}

mutation {
  createPost(data: { title: "New Post", status: draft }) {
    id
    title
  }
}

mutation {
  updatePost(id: "123", data: { status: published }) {
    id
    status
  }
}

mutation {
  deletePost(id: "123") {
    id
  }
}
```

> **Depth in GraphQL** — the `depth` param is ignored. Population depth is determined by the shape of your query (which fields you select). Relationship fields you include are populated automatically.

### GraphQL Config Options

```ts
export default buildConfig({
  graphQL: {
    // Disable GraphQL entirely
    disable: false,

    // Complexity limit (prevents overly expensive queries)
    maxComplexity: 1000,

    // Playground available at /api/graphql-playground
    disablePlaygroundInProduction: true, // default

    // Introspection in production (schema discovery)
    disableIntrospectionInProduction: true, // default

    // Custom validation rules
    validationRules: (executionArgs) => [myRule],

    // Custom queries and mutations — see below
    queries: (GraphQL, payload) => ({ ... }),
    mutations: (GraphQL, payload) => ({ ... }),
  },
})
```

### Custom GraphQL Queries and Mutations

Add bespoke queries/mutations that sit alongside Payload's auto-generated ones:

```ts
import { buildConfig } from 'payload'
import { GraphQLString } from 'graphql'
import { buildPaginatedListType, GraphQLJSON } from '@payloadcms/graphql/types'

export default buildConfig({
  graphQL: {
    queries: (GraphQL, payload) => ({
      recentPosts: {
        // Use buildPaginatedListType to return { docs, totalDocs, ... }
        type: buildPaginatedListType('RecentPosts', payload.collections['posts'].graphQL?.type),
        args: {
          limit: { type: GraphQL.GraphQLInt },
        },
        resolve: async (obj, { limit = 5 }, { req }) => {
          // IMPORTANT: use depth: 0 so GraphQL resolves nested fields itself
          return req.payload.find({
            collection: 'posts',
            depth: 0,
            limit,
            overrideAccess: false,
            user: req.user,
          })
        },
      },
    }),

    mutations: (GraphQL, payload) => ({
      publishPost: {
        type: payload.collections['posts'].graphQL?.type,
        args: { id: { type: new GraphQL.GraphQLNonNull(GraphQL.GraphQLString) } },
        resolve: async (obj, { id }, { req }) =>
          req.payload.update({
            collection: 'posts',
            id,
            data: { status: 'published' },
            depth: 0,
          }),
      },
    }),
  },
})
```

**Resolver signature:** `(obj, args, context, info)` — `context.req` holds `req.payload` and `req.user`.

**`depth: 0` in resolvers** — always use `depth: 0` when returning Local API data to GraphQL. GraphQL resolves sub-fields itself; a higher depth pre-populates needlessly and can break the shape.

### Per-Field GraphQL Complexity

Assign higher complexity to expensive fields (relationship, upload, join):

```ts
const authorsField = {
  name: 'authors',
  type: 'relationship',
  relationTo: 'users',
  graphQL: {
    complexity: 100, // counts toward maxComplexity
  },
}
```

### GraphQL Schema Generation

```bash
pnpm add @payloadcms/graphql -D
pnpm payload-graphql generate:schema
# outputs schema.graphql (or graphql/schema.graphql next to your config)
```

Add to `package.json` for convenience:

```json
{
  "scripts": {
    "generate:graphQLSchema": "cross-env PAYLOAD_CONFIG_PATH=src/payload.config.ts payload-graphql generate:schema"
  }
}
```

**`interfaceName`** — for `array`, `block`, `group`, and named `tab` fields, set `interfaceName` to generate a reusable top-level GraphQL type instead of an inline anonymous type:

```ts
{
  type: 'group',
  name: 'meta',
  interfaceName: 'SharedMeta',
  fields: [{ name: 'title', type: 'text' }],
}
```

### Collection-Level GraphQL Options

```ts
const Posts: CollectionConfig = {
  slug: 'posts',

  // Override generated type names
  graphQL: {
    singularName: 'Article', // query name: Article / createArticle / ...
    pluralName: 'Articles',
  },

  // Disable GraphQL entirely for this collection
  // graphQL: false,
}
```

## Pagination

### Response Shape

All `find` operations return:

```ts
{
  docs: Post[],        // current page of documents
  totalDocs: number,   // total matching documents
  limit: number,       // current limit
  totalPages: number,
  page: number,        // current page
  pagingCounter: number, // index of first doc on this page
  hasPrevPage: boolean,
  hasNextPage: boolean,
  prevPage: number | null,
  nextPage: number | null,
}
```

### Pagination Options

```ts
// Standard pagination
const result = await payload.find({ collection: 'posts', limit: 20, page: 2 })

// Disable pagination — skips totalDocs/count query (faster when you need all docs)
const all = await payload.find({ collection: 'posts', pagination: false })
// all.docs contains every document; pagination meta is omitted

// ⚠️ limit: 0 is equivalent to pagination: false — loads EVERY document
// Only use limit: 0 / pagination: false when you intend to load all results
```

Collection-level admin pagination defaults: `admin.pagination.defaultLimit` (integer) and `admin.pagination.limits` (integer array) — applies to the admin list view only.

## Depth and Population

### Default Depth

Payload's default depth is `2`. Override globally:

```ts
export default buildConfig({
  defaultDepth: 1, // change the global default
})
```

### Field-Level maxDepth

Relationship and upload fields can cap depth regardless of the request:

```ts
{
  name: 'author',
  type: 'relationship',
  relationTo: 'users',
  maxDepth: 1, // never populated deeper than 1, even if request asks for depth: 5
}
```

### Select / Exclude Fields

```ts
// Include mode — only return listed fields (plus id)
await payload.find({
  collection: 'posts',
  select: { title: true, 'meta.description': true },
})

// Exclude mode — return all fields EXCEPT the listed ones
await payload.find({
  collection: 'posts',
  select: { content: false, internalNotes: false },
})

// Empty select — only id is returned
await payload.findByID({ collection: 'posts', id: '1', select: {} })
// result: { id: '1' }
```

### defaultPopulate (Collection Config)

Controls which fields are selected when this collection is populated from another document. Avoids returning the entire document when only a slug is needed:

```ts
const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  defaultPopulate: {
    slug: true,
    title: true,
  },
  fields: [...],
}
```

> When using `defaultPopulate` on an upload collection and you need `url`, also include `filename: true` — Payload needs it to build the URL.

### populate Override

Override `defaultPopulate` for a specific query:

```ts
const posts = await payload.find({
  collection: 'posts',
  populate: {
    pages: { slug: true, title: true, heroImage: true }, // override for 'pages' populated docs
  },
})
```

### Entity-Level select Function

Force certain fields to always be available regardless of the caller's `select`:

```ts
const Posts: CollectionConfig = {
  slug: 'posts',
  // Always include title so hooks/access control can read it
  select: ({ select }) => (select ? { ...select, title: true } : undefined),
  fields: [...],
}
```

## Sort

Prefix field name with `-` for descending order. Multi-field: array in Local API, comma-separated in REST.

```ts
await payload.find({ collection: 'posts', sort: '-createdAt' })
await payload.find({ collection: 'posts', sort: ['priority', '-createdAt'] })
// REST: GET /api/posts?sort=priority,-createdAt
```

> **Virtual fields cannot be sorted** unless linked with a relationship field. Sorting runs at the database level and requires the field to be stored.

## Performance Best Practices

- Set `maxDepth` on relationships to prevent over-fetching
- Use `select` to limit returned fields
- Index frequently queried fields
- Use `virtual` fields for computed data
- Cache expensive operations in hook `context`
