# Payload Querying Reference

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

// Exists
const existsQuery: Where = { image: { exists: true } }

// Near (point fields)
const nearQuery: Where = { location: { near: '-122.4194,37.7749,10000' } }
```

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

Access control runs for every Local API operation by default. The examples below do not pass a
`user` or `req`, so they run with anonymous access.

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
})

// Create
const post = await payload.create({
  collection: 'posts',
  data: {
    title: 'New Post',
    status: 'draft',
  },
})

// Update
await payload.update({
  collection: 'posts',
  id: '123',
  data: {
    status: 'published',
  },
})

// Delete
await payload.delete({
  collection: 'posts',
  id: '123',
})

// Count
const count = await payload.count({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
  },
})
```

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

**Important**: Access control runs by default for Local API operations (`overrideAccess: false`).
Pass `user` or `req` when acting on behalf of an authenticated user. Without either, the operation
runs as an anonymous user.

```ts
// ✅ User-scoped operation: respects the user's permissions by default
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
})

// ✅ Public operation: access control runs as an anonymous user
const publicPosts = await payload.find({
  collection: 'posts',
})

// ✅ Trusted internal operation: intentionally bypasses access control
const allPosts = await payload.find({
  collection: 'posts',
  overrideAccess: true,
})
```

**When to use the default access behavior:**

- Performing operations on behalf of a user
- Testing access control logic
- API routes that should respect user permissions
- Public operations that should use anonymous access

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

### REST Endpoints

```txt
GET    /api/{collection}           - Find documents
GET    /api/{collection}/{id}      - Find by ID
POST   /api/{collection}           - Create
PATCH  /api/{collection}/{id}      - Update
DELETE /api/{collection}/{id}      - Delete
GET    /api/{collection}/count     - Count documents

GET    /api/globals/{slug}         - Get global
POST   /api/globals/{slug}         - Update global
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

## Performance Best Practices

- Set `maxDepth` on relationships to prevent over-fetching
- Use `select` to limit returned fields
- Index frequently queried fields
- Use `virtual` fields for computed data
- Cache expensive operations in hook `context`
