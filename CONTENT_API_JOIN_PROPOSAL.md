# Content API Join Architecture Proposal

## Problem

Current mismatch between Content API and Payload architectures:

| Aspect             | Payload                     | Content API (Figma)                   |
| ------------------ | --------------------------- | ------------------------------------- |
| Join definition    | Schema-based (declarative)  | Query-based (dynamic)                 |
| Collection/On/Path | In field config             | In runtime query                      |
| Pagination         | `page`                      | `offset`                              |
| Sort format        | `string` (e.g., `"-title"`) | `array` (e.g., `[{path, direction}]`) |

## Goal

Make Content API more compatible with Payload's architecture **without** requiring Content API to know Payload's schema.

## Proposed Solution: Optional Join Definitions

### 1. Store Join Metadata in Collections

Add optional `joinDefinitions` to collection schema:

```typescript
// Collection schema extension
{
  id: string
  contentSystemId: string
  key: string
  // ✨ New optional field
  joinDefinitions?: Record<string, {
    collection: string     // Target collection
    on: string            // Path in target collection to join on
    defaultLimit?: number
    defaultSort?: SortClause
    defaultWhere?: WhereClause
  }>
}
```

### 2. Register Joins When Creating Collection

The `db-content-api` adapter would register joins when initializing:

```typescript
// In adapter's init() method
await contentAPI.createCollection({
  contentSystemId: this.contentSystemId,
  key: 'posts',
  joinDefinitions: {
    author: {
      collection: 'users',
      on: 'authorId',
      defaultLimit: 1,
    },
    comments: {
      collection: 'comments',
      on: 'postId',
      defaultLimit: 10,
      defaultSort: [{ path: 'createdAt', direction: 'desc' }],
    },
  },
})
```

### 3. Support Two Query Formats

#### Format A: Named Joins (Payload-style)

```typescript
// POST /api/v0/documents:find
{
  contentSystemId: "xyz",
  collectionKey: "posts",
  joins: {
    "author": {
      // Only runtime parameters
      where: {...},
      limit: 5,
      page: 1,
      sort: "-name"
    }
  }
}
```

Content API behavior:

1. Look up `joinDefinitions.author` in `posts` collection
2. Merge with runtime parameters
3. Execute join using `collection` and `on` from definition

#### Format B: Dynamic Joins (Current style)

```typescript
// POST /api/v0/documents:find
{
  contentSystemId: "xyz",
  collectionKey: "posts",
  joins: [
    {
      path: "author",
      collectionId: "users",
      on: "authorId",
      where: {...},
      limit: 5,
      offset: 0
    }
  ]
}
```

### 4. Type Definition

```typescript
// In query-builder.ts

// Named join (new)
type NamedJoinQuery = Record<
  string,
  {
    where?: WhereClause
    limit?: number
    page?: number // Convert to offset internally
    sort?: string // Convert to SortClause internally
    count?: boolean
  }
>

// Dynamic join (existing)
type DynamicJoin = {
  path: string
  collectionId: string
  on: string
  where?: WhereClause
  limit?: number
  offset?: number
  sort?: SortClause
  count: boolean
}

// Accept both formats
type JoinInput = NamedJoinQuery | DynamicJoin[]
```

## Implementation Plan

### Phase 1: Content API Changes

1. **Add `joinDefinitions` to collections table**

   ```sql
   ALTER TABLE collections
   ADD COLUMN join_definitions JSONB;
   ```

2. **Update collection creation endpoint**

   - Accept `joinDefinitions` in request body
   - Store in database

3. **Create join resolution service**

   ```typescript
   // services/query/resolveNamedJoins.ts
   function resolveNamedJoins(
     collection: CollectionSchema,
     namedJoins: NamedJoinQuery,
   ): DynamicJoin[] {
     // Convert named joins to dynamic joins using joinDefinitions
   }
   ```

4. **Update documents:find endpoint**
   - Detect join format (object vs array)
   - If object, resolve using `joinDefinitions`
   - Execute as dynamic joins

### Phase 2: Adapter Changes

1. **Register joins during init**

   ```typescript
   // In db-content-api adapter
   async init() {
     for (const collection of this.payload.config.collections) {
       const joinDefinitions = extractJoinDefinitions(collection)
       await this.createCollection({
         key: collection.slug,
         joinDefinitions
       })
     }
   }
   ```

2. **Simplify query translation**
   ```typescript
   // In find() method
   async find(args) {
     const joins = this.translatePayloadJoins(args.joins)
     // Now just passes join names + runtime params
     const response = await this.contentAPI.find({
       joins // Payload-style format
     })
   }
   ```

### Phase 3: Type Alignment

1. **Add `page` support in Content API**

   ```typescript
   // Convert page to offset
   const offset = (page - 1) * limit
   ```

2. **Add string `sort` support**
   ```typescript
   // Parse "-title,createdAt" to:
   // [{ path: "title", direction: "desc" },
   //  { path: "createdAt", direction: "asc" }]
   ```

## Benefits

✅ **Content API remains generic** - no Payload schema knowledge required
✅ **Backward compatible** - dynamic joins still work
✅ **Type-safe** - join definitions validated at registration
✅ **Better DX** - simpler queries, less repetition
✅ **Performance** - no need to send `collection`/`on` every query
✅ **Matches Payload semantics** - easier adapter implementation

## Migration Path

1. **Week 1**: Add `joinDefinitions` to Content API schema
2. **Week 2**: Implement named join resolution
3. **Week 3**: Update adapter to register joins
4. **Week 4**: Add `page` and string `sort` support
5. **Week 5**: Testing and validation

## Alternative: Keep Current Architecture

If we want to minimize Content API changes, the adapter can continue translating:

**Pros:**

- No Content API changes needed
- Maximum flexibility
- Works today

**Cons:**

- Adapter complexity remains high
- Every query sends full join config
- Harder to debug
- Population issues persist

## Recommendation

Implement **Phase 1 & 2** (join definitions + named joins) as they provide the best balance of:

- Keeping Content API generic
- Improving Payload compatibility
- Simplifying adapter logic
- Better developer experience

Phase 3 (type alignment) can be done later if needed.
