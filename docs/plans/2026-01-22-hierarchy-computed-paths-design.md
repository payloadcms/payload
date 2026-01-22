# Hierarchy Computed Paths - Design Document

**Date:** 2026-01-22
**Status:** Approved

## Problem Statement

The current hierarchy implementation stores computed path fields (`_h_slugPath`, `_h_titlePath`) in the database. This creates a cascade problem with drafts:

- When a parent's draft changes (e.g., slug changes from "about" to "about-us")
- Descendants don't get updated (to preserve draft isolation)
- Admin panel loads with `draft: true` and shows stale paths for descendants
- Users see inconsistent hierarchy in the UI

The fundamental issue: **stored paths become stale, and updating them breaks draft isolation.**

## Solution: Compute Paths On-Demand

Remove stored path fields and compute them dynamically when needed. The `_h_parentTree` field enables fetching all ancestors in a single query, and the `draft: true` context naturally flows through to get correct draft data.

## Core Architecture

### Current State (Store Paths)

- 4 hierarchy fields: `parent`, `_h_parentTree`, `_h_depth`, `_h_slugPath`, `_h_titlePath`
- Paths stored in DB, updated via cascading operations
- Draft cascade problem: stale paths in descendants

### New State (Compute Paths)

- 3 hierarchy fields: `parent`, `_h_parentTree`, `_h_depth`
- Paths computed on-demand by querying `_h_parentTree`
- Draft reads automatically get correct paths (no cascade needed)

### Key Insight

The `draft: true` context naturally flows through path computation. When you compute a child's path and fetch its parent with `draft: true`, you get the parent's draft data - solving the staleness problem without any cascade logic.

### What Changes

- Remove `_h_slugPath` and `_h_titlePath` fields from schema
- Remove all path computation from hooks (both beforeChange and afterChange)
- Add path computation utilities for frontend/API to call on-demand
- Keep `_h_parentTree` updates (still cascade when parent changes)

### What Stays

- `_h_parentTree` still needs cascading updates when parent changes
- Hooks still validate circular references
- Depth computation remains the same

## Configuration & API

### New Config Type

```typescript
export type HierarchyConfig = {
  /**
   * Name of the field that references the parent document
   * Will automatically create this field if it does not exist
   */
  parentFieldName: string

  /**
   * Custom function to slugify text for path generation
   * Defaults to internal slugify implementation
   */
  slugify?: (text: string) => string
}
```

### Collection Config Usage (unchanged)

```typescript
{
  slug: 'pages',
  hierarchy: {
    parentFieldName: 'parent',
    slugify: myCustomSlugify, // optional
  }
}
```

### Fields Added to Collection

- `parent` - relationship field (if not already defined)
- `_h_parentTree` - array of ancestor IDs
- `_h_depth` - tree depth

### Fields Removed

- ~~`_h_slugPath`~~
- ~~`_h_titlePath`~~

### New Utility Functions Exported

```typescript
// Compute slug path for a document
export function computeSlugPath(args: {
  doc: any
  collection: string
  locale?: string
  draft?: boolean
  req: PayloadRequest
}): Promise<string>

// Compute title path for a document
export function computeTitlePath(args: {
  doc: any
  collection: string
  locale?: string
  draft?: boolean
  req: PayloadRequest
}): Promise<string>
```

Users call these utilities when they need paths (e.g., in `afterRead` hooks, custom components, etc.)

## Path Computation Algorithm

### Core Algorithm

```typescript
async function computeSlugPath({ doc, collection, locale, draft, req }) {
  // Base case: no parent = just this doc's slug
  if (!doc._h_parentTree || doc._h_parentTree.length === 0) {
    return slugify(doc.title)
  }

  // Fetch all ancestors in one query
  const ancestors = await req.payload.find({
    collection,
    where: { id: { in: doc._h_parentTree } },
    locale: locale || 'en',
    draft: draft ?? false,
    depth: 0, // Don't populate relationships
  })

  // Order ancestors by their position in parentTree
  const orderedAncestors = doc._h_parentTree.map((id) =>
    ancestors.docs.find((a) => a.id === id),
  )

  // Build path: ancestor1/ancestor2/.../currentDoc
  const ancestorSlugs = orderedAncestors.map((a) => slugify(a.title))
  const currentSlug = slugify(doc.title)

  return [...ancestorSlugs, currentSlug].join('/')
}
```

### Key Points

1. **Single query** - fetch all ancestors at once using `where: { id: { in: [...] } }`
2. **Draft context flows** - when `draft: true`, gets draft versions of ancestors
3. **Localization flows** - when `locale: 'es'`, gets Spanish titles
4. **Ordering matters** - must preserve ancestor order from `_h_parentTree`

### Edge Cases

- Missing ancestor (deleted parent) → Remove ID from tree structure via cascade
- Unpublished ancestor when querying published → Handle gracefully (skip or throw?)
- Title field not found → Fallback to ID or throw error

### Performance

- O(1) queries regardless of tree depth
- Could add optional caching layer for hot paths

## Cascade Logic

### When Cascades Happen

**1. Document Deleted**

- Direct children: `parent = null`, remove ID from `_h_parentTree`, adjust depth
- All descendants: remove ID from `_h_parentTree`, adjust depth

**2. Document Parent Changes**

- Current doc: update `_h_parentTree`, `_h_depth`
- All descendants: update their `_h_parentTree`, `_h_depth`

**3. Document Title Changes**

- ~~No cascade needed~~ ✓ (paths computed on-demand)

**4. Draft Operations**

- ~~No cascade needed~~ ✓ (paths computed on-demand)

### Simplifications vs Current Implementation

- No path string manipulation
- No locale considerations for cascade (tree structure is not localized)
- Draft operations don't trigger cascades
- Much simpler logic overall

## Hook Implementation

### beforeChange Hook

**Responsibilities:**

1. Validate circular references
2. Compute and set `_h_parentTree` for current doc
3. Compute and set `_h_depth` for current doc

```typescript
async beforeChange({ data, req, operation, originalDoc }) {
  // Skip if parent hasn't changed (and not creating)
  if (operation === 'update' && data.parent === originalDoc.parent) {
    return data
  }

  // Validate circular reference
  if (data.parent) {
    const parentDoc = await req.payload.findByID({
      id: data.parent,
      collection: collection.slug,
      depth: 0,
      select: { _h_parentTree: true }
    })

    if (parentDoc._h_parentTree?.includes(originalDoc.id)) {
      throw new Error('Circular reference detected')
    }

    // Build new parentTree
    data._h_parentTree = [...(parentDoc._h_parentTree || []), data.parent]
    data._h_depth = data._h_parentTree.length
  } else {
    // Root document
    data._h_parentTree = []
    data._h_depth = 0
  }

  return data
}
```

### afterChange Hook

**Responsibilities:**

1. Cascade `_h_parentTree` updates to descendants when parent changes
2. Cascade `_h_depth` updates to descendants

```typescript
async afterChange({ doc, previousDoc, operation, req }) {
  // Skip if parent hasn't changed
  if (operation === 'update' && doc.parent === previousDoc.parent) {
    return
  }

  // Find all descendants
  const descendants = await req.payload.find({
    collection: collection.slug,
    where: { _h_parentTree: { contains: doc.id } },
    limit: 0, // Get all
    depth: 0,
  })

  // Update each descendant's parentTree and depth
  for (const descendant of descendants.docs) {
    const newParentTree = updateParentTreeAfterAncestorMove(
      descendant._h_parentTree,
      doc.id,
      doc._h_parentTree
    )

    await req.payload.update({
      id: descendant.id,
      collection: collection.slug,
      data: {
        _h_parentTree: newParentTree,
        _h_depth: newParentTree.length,
      },
      context: { hierarchyUpdating: true }, // Prevent recursion
    })
  }
}
```

### beforeDelete Hook

**Responsibilities:**

1. Clear parent field on direct children
2. Remove this ID from all descendants' parentTree

```typescript
async beforeDelete({ req, id }) {
  // Update direct children
  await req.payload.update({
    collection: collection.slug,
    where: { parent: { equals: id } },
    data: { parent: null },
  })

  // Find and update all descendants
  const descendants = await req.payload.find({
    collection: collection.slug,
    where: { _h_parentTree: { contains: id } },
  })

  for (const descendant of descendants.docs) {
    const newParentTree = descendant._h_parentTree.filter(ancestorId => ancestorId !== id)

    await req.payload.update({
      id: descendant.id,
      collection: collection.slug,
      data: {
        _h_parentTree: newParentTree,
        _h_depth: newParentTree.length,
      },
    })
  }
}
```

## Testing Strategy

### What to Test

**1. Basic Tree Operations**

- Create root document → `_h_parentTree: [], _h_depth: 0`
- Create child → `_h_parentTree: [parentId], _h_depth: 1`
- Move document to new parent → parentTree updates
- Delete parent → children become roots, descendants update

**2. Circular Reference Prevention**

- Cannot set self as parent
- Cannot set descendant as parent
- Error messages are clear

**3. Path Computation**

- `computeSlugPath()` builds correct path from ancestors
- `computeTitlePath()` builds correct path from ancestors
- Root documents return simple slug/title
- Deep nesting (3+ levels) works correctly

**4. Draft Context**

- Published parent + draft changes → child path computed with draft parent title
- Draft-only documents → paths compute correctly
- Mixed published/draft trees

**5. Localization**

- Localized titles → paths computed per locale
- `computeSlugPath({ locale: 'es' })` fetches Spanish ancestor titles
- Non-localized collections work

**6. Performance/Edge Cases**

- Large trees (100+ descendants) cascade efficiently
- Missing ancestors handled gracefully
- Deleted ancestors don't break path computation

### Tests to Migrate from Current Suite

- All the tree structure tests (most should work as-is)
- Circular reference tests (unchanged)
- Localization tests (need updates for on-demand paths)
- Draft tests (need updates for on-demand paths)

### Tests to Remove

- Path cascade tests (no longer relevant)
- Draft cascade deferral tests (no longer relevant)

## Benefits

1. **Solves draft problem** - Admin UI always shows accurate paths for current context
2. **Simpler hooks** - No path string manipulation, no locale handling in cascade
3. **Better performance** - Fewer cascade operations, no path updates on title changes
4. **More flexible** - Paths can be computed with different contexts (draft/published, different locales)
5. **Easier to understand** - Clear separation: tree structure cascades, paths are computed

## Trade-offs

1. **Performance** - Path computation adds query overhead (mitigated by single ancestor query)
2. **Caching needed** - Frequently accessed paths may need caching layer
3. **Breaking change** - Existing code relying on stored path fields must migrate
4. **No path search** - Cannot search/filter directly on full paths (must search on title field)

## Migration Path

For existing deployments:

1. Add computed path utilities
2. Deprecate stored path fields (keep them for backward compatibility)
3. Provide migration script to remove old path fields
4. Update documentation with new API

## Implementation Checklist

- [ ] Update types (remove path fields, simplify config)
- [ ] Implement `computeSlugPath()` utility
- [ ] Implement `computeTitlePath()` utility
- [ ] Simplify `beforeChange` hook (remove path logic)
- [ ] Simplify `afterChange` hook (remove path logic, keep tree cascade)
- [ ] Implement `beforeDelete` hook
- [ ] Update schema generation (remove path fields)
- [ ] Migrate existing tests
- [ ] Add new tests for path computation
- [ ] Update documentation
- [ ] Add migration guide for users
