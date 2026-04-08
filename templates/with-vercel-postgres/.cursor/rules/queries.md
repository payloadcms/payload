---
title: Queries
description: Local API, REST, and GraphQL query patterns
tags: [payload, queries, local-api, rest, graphql]
---

# Payload CMS Queries

## Query Operators

```typescript
// Equals
{ color: { equals: 'blue' } }

// Not equals
{ status: { not_equals: 'draft' } }

// Greater/less than
{ price: { greater_than: 100 } }
{ age: { less_than_equal: 65 } }

// Contains (case-insensitive)
{ title: { contains: 'payload' } }

// Like (all words present)
{ description: { like: 'cms headless' } }

// In/not in
{ category: { in: ['tech', 'news'] } }

// Exists
{ image: { exists: true } }

// Near (point fields)
{ location: { near: [10, 20, 5000] } } // [lng, lat, maxDistance]
```

## AND/OR Logic

```typescript
{
  or: [
    { color: { equals: 'mint' } },
    {
      and: [
        { color: { equals: 'white' } },
        { featured: { equals: false } },
      ],
    },
  ],
}
```

## Nested Properties

```typescript
{
  'author.role': { equals: 'editor' },
  'meta.featured': { exists: true },
}
```

## Local API

```typescript
// Find documents
const posts = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    'author.name': { contains: 'john' },
  },
  depth: 2, // Populate relationships
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

## Access Control in Local API

**CRITICAL**: Local API bypasses access control by default (`overrideAccess: true`).

```typescript
// ❌ WRONG: User is passed but access control is bypassed
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
  // Result: Operation runs with ADMIN privileges
})

// ✅ CORRECT: Respects user's access control permissions
const posts = await payload.find({
  collection: 'posts',
  user: currentUser,
  overrideAccess: false, // Required to enforce access control
})

// Administrative operation (intentionally bypass access control)
const allPosts = await payload.find({
  collection: 'posts',
  // No user parameter, overrideAccess defaults to true
})
```

**When to use `overrideAccess: false`:**

- Performing operations on behalf of a user
- Testing access control logic
- API routes that should respect user permissions

## REST API

```typescript
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

```
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
```

## Performance Best Practices

- Set `maxDepth` on relationships to prevent over-fetching
- Use `select` to limit returned fields
- Index frequently queried fields
- Use `virtual` fields for computed data
- Cache expensive operations in hook `context`
