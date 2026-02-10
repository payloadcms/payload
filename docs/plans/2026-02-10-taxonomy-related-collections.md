# Taxonomy Related Collections Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign taxonomy `relatedCollections` so users declare which collections relate to their taxonomy, and Payload injects the relationship field automatically during sanitization.

**Architecture:** User-defined `relatedCollections` object in taxonomy config specifies each related collection with its `hasMany` setting. During sanitization, Payload injects a relationship field into each related collection pointing back to the taxonomy. All relationship metadata is computed once at sanitization time, eliminating runtime field traversal.

**Tech Stack:** TypeScript, Payload config sanitization, field injection (similar to hierarchy parent field)

---

## Current State

Currently, `relatedCollections` is an optional array of collection slugs:

```typescript
taxonomy: {
  relatedCollections: ['posts', 'pages'] // Just slugs
}
```

At runtime, `findRelatedDocuments` and `handleTaxonomy` traverse all collections' fields to find relationship fields pointing to the taxonomy - expensive and redundant.

## Target State

User declares relationship config:

```typescript
taxonomy: {
  relatedCollections: {
    posts: { hasMany: true },
    pages: { hasMany: false },
  }
}
```

Payload automatically:

1. Injects a relationship field into `posts` and `pages` during sanitization
2. Stores the field name and `hasMany` in the sanitized taxonomy config
3. Queries use this pre-computed info instead of traversing fields

---

### Task 1: Update Taxonomy Types

**Files:**

- Modify: `packages/payload/src/taxonomy/types.ts`

**Step 1: Update TaxonomyConfig type**

Change `relatedCollections` from array to object:

```typescript
/**
 * Configuration options for taxonomy feature
 */
export type TaxonomyConfig = {
  icon?: string
  /**
   * Collections that can reference this taxonomy.
   * Each entry specifies the collection slug and relationship configuration.
   * Payload will automatically inject a relationship field into each collection.
   *
   * @example
   * relatedCollections: {
   *   posts: { hasMany: true },   // Posts can have multiple tags
   *   pages: { hasMany: false },  // Pages have one category
   * }
   */
  relatedCollections?: {
    [collectionSlug: string]: {
      /** Whether documents can reference multiple taxonomy items. Default: false */
      hasMany?: boolean
    }
  }
  treeLimit?: number
} & Partial<HierarchyConfig>
```

**Step 2: Update SanitizedTaxonomyConfig type**

The sanitized version includes the computed field name:

```typescript
/**
 * Sanitized related collection info with computed field name
 */
export type SanitizedRelatedCollection = {
  /** Name of the injected relationship field */
  fieldName: string
  /** Whether the field allows multiple values */
  hasMany: boolean
}

/**
 * Sanitized taxonomy configuration with all defaults applied
 */
export type SanitizedTaxonomyConfig = {
  icon?: string
  /**
   * Related collections with their sanitized configuration.
   * Key is collection slug, value contains the injected field info.
   */
  relatedCollections: {
    [collectionSlug: string]: SanitizedRelatedCollection
  }
  treeLimit?: number
} & SanitizedHierarchyConfig
```

**Step 3: Commit**

```bash
git add packages/payload/src/taxonomy/types.ts
git commit -m "$(cat <<'EOF'
chore: update taxonomy relatedCollections types

Change relatedCollections from string[] to object with hasMany config.
Add SanitizedRelatedCollection type with computed fieldName.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Create Field Builder for Taxonomy Relationship

**Files:**

- Create: `packages/payload/src/taxonomy/buildTaxonomyRelationshipField.ts`

**Step 1: Create the field builder function**

Similar to `buildParentField` in hierarchy:

```typescript
import type { RelationshipField } from '../fields/config/types.js'

export type BuildTaxonomyRelationshipFieldArgs = {
  /** The taxonomy collection slug this field points to */
  taxonomySlug: string
  /** Name for the relationship field */
  fieldName: string
  /** Whether documents can reference multiple taxonomy items */
  hasMany: boolean
  /** Optional label override */
  label?: string
}

export const buildTaxonomyRelationshipField = ({
  taxonomySlug,
  fieldName,
  hasMany,
  label,
}: BuildTaxonomyRelationshipFieldArgs): RelationshipField => {
  return {
    name: fieldName,
    type: 'relationship',
    relationTo: taxonomySlug,
    hasMany,
    index: true,
    label: label || taxonomySlug,
    admin: {
      position: 'sidebar',
    },
  }
}
```

**Step 2: Commit**

```bash
git add packages/payload/src/taxonomy/buildTaxonomyRelationshipField.ts
git commit -m "$(cat <<'EOF'
chore: add buildTaxonomyRelationshipField utility

Creates relationship field config for injecting into related collections.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Create Constants for Taxonomy Field Name

**Files:**

- Modify: `packages/payload/src/taxonomy/constants.ts`

**Step 1: Add field name generator constant/function**

```typescript
export const TAXONOMY_PARENT_FIELD = '_t_parent'

/**
 * Generate the field name for a taxonomy relationship field
 * @param taxonomySlug - The slug of the taxonomy collection
 * @returns Field name like '_t_categories' or '_t_tags'
 */
export const getTaxonomyFieldName = (taxonomySlug: string): string => {
  return `_t_${taxonomySlug}`
}
```

**Step 2: Commit**

```bash
git add packages/payload/src/taxonomy/constants.ts
git commit -m "$(cat <<'EOF'
chore: add getTaxonomyFieldName to taxonomy constants

Generates consistent field names for injected taxonomy relationship fields.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Create Post-Sanitization Field Injection

**Files:**

- Create: `packages/payload/src/taxonomy/injectTaxonomyFields.ts`

**Step 1: Create the injection function**

This runs in `addTaxonomySidebarTabs` (after all collections are sanitized):

```typescript
import type { Config } from '../config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { buildTaxonomyRelationshipField } from './buildTaxonomyRelationshipField.js'
import { getTaxonomyFieldName } from './constants.js'

/**
 * Inject taxonomy relationship fields into related collections.
 * Must be called after all collections are sanitized.
 */
export const injectTaxonomyFields = (config: Config): void => {
  const taxonomyCollections =
    config.collections?.filter((c) => c.taxonomy) || []

  for (const taxonomyCollection of taxonomyCollections) {
    const taxonomy = taxonomyCollection.taxonomy
    if (typeof taxonomy !== 'object' || !taxonomy.relatedCollections) {
      continue
    }

    const relatedCollectionsConfig = taxonomy.relatedCollections as Record<
      string,
      { hasMany?: boolean }
    >

    // Build sanitized relatedCollections with field info
    const sanitizedRelatedCollections: Record<
      string,
      { fieldName: string; hasMany: boolean }
    > = {}

    for (const [relatedSlug, relationConfig] of Object.entries(
      relatedCollectionsConfig,
    )) {
      const relatedCollection = config.collections?.find(
        (c) => c.slug === relatedSlug,
      )
      if (!relatedCollection) {
        console.warn(
          `Taxonomy "${taxonomyCollection.slug}" references unknown collection "${relatedSlug}" in relatedCollections`,
        )
        continue
      }

      const fieldName = getTaxonomyFieldName(taxonomyCollection.slug)
      const hasMany = relationConfig.hasMany ?? false

      // Check if field already exists
      const existingField = relatedCollection.fields.find(
        (field) => fieldAffectsData(field) && field.name === fieldName,
      )

      if (!existingField) {
        // Inject the relationship field
        const taxonomyField = buildTaxonomyRelationshipField({
          taxonomySlug: taxonomyCollection.slug,
          fieldName,
          hasMany,
          label: String(
            taxonomyCollection.labels?.singular || taxonomyCollection.slug,
          ),
        })

        relatedCollection.fields.push(taxonomyField)
      }

      // Store sanitized config
      sanitizedRelatedCollections[relatedSlug] = {
        fieldName,
        hasMany,
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    taxonomy.relatedCollections = sanitizedRelatedCollections
  }
}
```

**Step 2: Commit**

```bash
git add packages/payload/src/taxonomy/injectTaxonomyFields.ts
git commit -m "$(cat <<'EOF'
chore: add injectTaxonomyFields for post-sanitization field injection

Injects relationship fields into related collections and computes
sanitized relatedCollections with fieldName and hasMany info.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Update addTaxonomySidebarTabs to Call Field Injection

**Files:**

- Modify: `packages/payload/src/taxonomy/addTaxonomySidebarTab.ts`

**Step 1: Import and call injectTaxonomyFields**

Add the injection call at the start of the function:

```typescript
import type { Config } from '../config/types.js'

import { injectTaxonomyFields } from './injectTaxonomyFields.js'

/**
 * Add a sidebar tab for each taxonomy collection
 * Each tab shows the tree for that specific taxonomy
 */
export const addTaxonomySidebarTabs = (config: Config): void => {
  // Inject taxonomy relationship fields into related collections first
  injectTaxonomyFields(config)

  // Find all collections with taxonomy enabled
  const taxonomyCollections = config.collections?.filter(
    (collection) => collection.taxonomy,
  )

  // ... rest of existing code unchanged
}
```

**Step 2: Commit**

```bash
git add packages/payload/src/taxonomy/addTaxonomySidebarTab.ts
git commit -m "$(cat <<'EOF'
chore: call injectTaxonomyFields from addTaxonomySidebarTabs

Field injection happens after all collections are sanitized but before
sidebar tabs are added.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Update sanitizeTaxonomy to Handle New Config Shape

**Files:**

- Modify: `packages/payload/src/taxonomy/sanitizeTaxonomy.ts`

**Step 1: Update to preserve relatedCollections object**

The sanitization now preserves the object shape (full sanitization happens in `injectTaxonomyFields`):

```typescript
// In sanitizeTaxonomy function, change:
// const relatedCollections = collectionConfig.taxonomy.relatedCollections || []

// To:
const relatedCollections = collectionConfig.taxonomy.relatedCollections || {}

// And in the final assignment:
collectionConfig.taxonomy = {
  parentFieldName,
  relatedCollections, // Keep as object, will be sanitized in injectTaxonomyFields
  // ... rest unchanged
}
```

**Step 2: Commit**

```bash
git add packages/payload/src/taxonomy/sanitizeTaxonomy.ts
git commit -m "$(cat <<'EOF'
chore: update sanitizeTaxonomy for object relatedCollections

Preserve object shape during initial sanitization. Full sanitization
with field injection happens later in addTaxonomySidebarTabs.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Update handleTaxonomy to Use Pre-computed Field Info

**Files:**

- Modify: `packages/next/src/views/List/handleTaxonomy.ts`

**Step 1: Remove findRelationshipFieldsTo and findCollectionsWithRelationTo**

Delete these functions (lines ~299-367) - no longer needed.

**Step 2: Update related documents query logic**

Replace the field traversal with direct access to sanitized config:

```typescript
// Replace this section (around line 199-227):
// const relatedCollections = ...
// const collectionsToQuery = ...
// for (const relatedSlug of collectionsToQuery) {
//   const relationshipFields = findRelationshipFieldsTo(...)

// With:
const relatedCollectionsConfig =
  typeof taxonomyConfig === 'object' && taxonomyConfig.relatedCollections
    ? (taxonomyConfig.relatedCollections as Record<
        string,
        { fieldName: string; hasMany: boolean }
      >)
    : {}

for (const [relatedSlug, fieldInfo] of Object.entries(
  relatedCollectionsConfig,
)) {
  if (relatedSlug === collectionSlug) {
    continue
  }

  const relatedCollectionConfig = req.payload.collections[relatedSlug]?.config
  if (!relatedCollectionConfig) {
    continue
  }

  // Check if user has read permission for this collection
  if (!permissions?.collections?.[relatedSlug]?.read) {
    continue
  }

  const { fieldName, hasMany } = fieldInfo

  // Build where clause based on whether we're at root or nested level
  let relationshipWhere: Record<string, unknown>

  if (parentId === null) {
    // Root level: find documents where taxonomy field doesn't exist, is null, or is empty array
    const conditions = [
      { [fieldName]: { exists: false } },
      { [fieldName]: { equals: null } },
    ]
    if (hasMany) {
      conditions.push({ [fieldName]: { equals: [] } })
    }
    relationshipWhere = { or: conditions }
  } else {
    // Nested level: find documents assigned to this taxonomy item
    relationshipWhere = {
      [fieldName]: hasMany ? { contains: parentId } : { equals: parentId },
    }
  }

  // ... rest of query logic unchanged
}
```

**Step 3: Commit**

```bash
git add packages/next/src/views/List/handleTaxonomy.ts
git commit -m "$(cat <<'EOF'
fix(next): use pre-computed taxonomy field info in handleTaxonomy

Remove runtime field traversal. Use sanitized relatedCollections config
that contains fieldName and hasMany computed at sanitization time.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Update findRelatedDocuments Operation

**Files:**

- Modify: `packages/payload/src/taxonomy/operations/findRelatedDocuments.ts`

**Step 1: Remove findCollectionsWithRelationTo and findRelationshipFieldsTo**

Delete these functions (lines ~116-178).

**Step 2: Update to use pre-computed field info**

```typescript
// Replace the related collections query section (around line 63-111):

// 2. Find all collections from sanitized relatedCollections config
const relatedCollectionsConfig =
  collection.taxonomy && typeof collection.taxonomy === 'object'
    ? (collection.taxonomy.relatedCollections as Record<
        string,
        { fieldName: string; hasMany: boolean }
      >)
    : {}

// 3. Query each related collection
for (const [relatedSlug, fieldInfo] of Object.entries(
  relatedCollectionsConfig,
)) {
  const relatedCollection = payload.config.collections.find(
    (c) => c.slug === relatedSlug,
  )
  if (!relatedCollection) {
    continue
  }

  const { fieldName, hasMany } = fieldInfo

  // Build where clause using pre-computed field info
  const where: Where = {
    [fieldName]: hasMany ? { contains: id } : { equals: id },
  }

  try {
    results[relatedSlug] = await payload.find({
      collection: relatedSlug,
      depth,
      limit,
      page,
      req,
      where,
    })
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: `Failed to query ${relatedSlug} for taxonomy ${collection.slug}:${id}`,
    })
  }
}
```

**Step 3: Commit**

```bash
git add packages/payload/src/taxonomy/operations/findRelatedDocuments.ts
git commit -m "$(cat <<'EOF'
fix: use pre-computed field info in findRelatedDocuments

Remove runtime field traversal. Use sanitized relatedCollections config
with pre-computed fieldName and hasMany values.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Update TaxonomyTable Client-Side Query

**Files:**

- Modify: `packages/ui/src/views/TaxonomyList/TaxonomyTable/index.tsx`

**Step 1: Remove findRelationshipFieldsTo function**

Delete the function at the bottom of the file (lines ~487-523).

**Step 2: Update handleLoadMoreRelated to receive field info from props**

The related groups already have the field info from the server. Update the load more logic:

```typescript
// Update RelatedGroup type:
type RelatedGroup = {
  collectionSlug: string
  data: PaginatedDocs
  fieldInfo: { fieldName: string; hasMany: boolean }  // Add this
  label: string
}

// Update handleLoadMoreRelated to use fieldInfo:
const handleLoadMoreRelated = useCallback(
  async (relatedSlug: string) => {
    const state = relatedState[relatedSlug]
    if (!state || state.isLoading || !state.hasNextPage) {
      return
    }

    // Find the group to get field info
    const group = relatedGroups.find((g) => g.collectionSlug === relatedSlug)
    if (!group) {
      return
    }

    setRelatedState((prev) => ({
      ...prev,
      [relatedSlug]: { ...prev[relatedSlug], isLoading: true },
    }))

    try {
      const { fieldName, hasMany } = group.fieldInfo

      // Build where clause using known field info
      const whereClause = hasMany
        ? { [fieldName]: { contains: parentId } }
        : { [fieldName]: { equals: parentId } }

      const relatedConfig = getEntityConfig({ collectionSlug: relatedSlug })
      const relatedUseAsTitle = relatedConfig?.admin?.useAsTitle || 'id'

      const where = search
        ? { and: [whereClause, { [relatedUseAsTitle]: { like: search } }] }
        : whereClause

      const queryString = qs.stringify(
        { limit: 10, page: state.page + 1, where },
        { addQueryPrefix: true },
      )
      const url = formatAdminURL({
        apiRoute,
        path: `/${relatedSlug}${queryString}`,
        serverURL,
      })

      const response = await fetch(url, { credentials: 'include' })
      // ... rest unchanged
    }
  },
  [/* update deps */],
)
```

**Step 3: Commit**

```bash
git add packages/ui/src/views/TaxonomyList/TaxonomyTable/index.tsx
git commit -m "$(cat <<'EOF'
fix(ui): remove runtime field traversal from TaxonomyTable

Use fieldInfo passed from server instead of traversing fields client-side.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Update TaxonomyListView to Pass Field Info

**Files:**

- Modify: `packages/ui/src/views/TaxonomyList/index.tsx`

**Step 1: Update relatedGroups mapping to include fieldInfo**

```typescript
// In the TaxonomyTable render, update the relatedGroups prop:
relatedGroups={Object.entries(taxonomyData.relatedDocuments || {}).map(
  ([slug, related]) => ({
    collectionSlug: slug,
    data: related.data,
    fieldInfo: related.fieldInfo,  // Add this
    label: related.label,
  }),
)}
```

**Step 2: Commit**

```bash
git add packages/ui/src/views/TaxonomyList/index.tsx
git commit -m "$(cat <<'EOF'
fix(ui): pass fieldInfo to TaxonomyTable relatedGroups

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Update handleTaxonomy Return Type

**Files:**

- Modify: `packages/next/src/views/List/handleTaxonomy.ts`

**Step 1: Update RelatedDocumentsGrouped type**

```typescript
export type RelatedDocumentsGrouped = {
  [collectionSlug: string]: {
    data: PaginatedDocs
    fieldInfo: { fieldName: string; hasMany: boolean }
    label: string
  }
}
```

**Step 2: Update the relatedDocuments assignment to include fieldInfo**

```typescript
if (data.totalDocs > 0) {
  relatedDocuments[relatedSlug] = {
    data,
    fieldInfo: { fieldName, hasMany }, // Add this
    label: getTranslation(relatedCollectionConfig.labels?.plural, req.i18n),
  }
}
```

**Step 3: Commit**

```bash
git add packages/next/src/views/List/handleTaxonomy.ts
git commit -m "$(cat <<'EOF'
fix(next): include fieldInfo in handleTaxonomy response

Pass pre-computed field info to client for pagination queries.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Export New Types and Functions

**Files:**

- Modify: `packages/payload/src/taxonomy/index.ts` (or create if doesn't exist)
- Modify: `packages/payload/src/index.ts`

**Step 1: Create/update taxonomy index exports**

```typescript
// packages/payload/src/taxonomy/index.ts
export { getTaxonomyFieldName, TAXONOMY_PARENT_FIELD } from './constants.js'
export { buildTaxonomyRelationshipField } from './buildTaxonomyRelationshipField.js'
export type {
  SanitizedRelatedCollection,
  SanitizedTaxonomyConfig,
  TaxonomyConfig,
} from './types.js'
```

**Step 2: Commit**

```bash
git add packages/payload/src/taxonomy/index.ts packages/payload/src/index.ts
git commit -m "$(cat <<'EOF'
chore: export taxonomy types and utilities

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Write Tests for Field Injection

**Files:**

- Create: `test/taxonomy/relatedCollections.spec.ts`

**Step 1: Test that fields are injected**

```typescript
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

describe('Taxonomy Related Collections', () => {
  it('should inject relationship field into related collection', async () => {
    const config = await buildConfigWithDefaults({
      collections: [
        {
          slug: 'categories',
          fields: [{ name: 'title', type: 'text' }],
          taxonomy: {
            relatedCollections: {
              posts: { hasMany: true },
            },
          },
        },
        {
          slug: 'posts',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
    })

    // Find the posts collection
    const postsCollection = config.collections.find((c) => c.slug === 'posts')

    // Verify the taxonomy field was injected
    const taxonomyField = postsCollection?.fields.find(
      (f) => 'name' in f && f.name === '_t_categories',
    )

    expect(taxonomyField).toBeDefined()
    expect(taxonomyField?.type).toBe('relationship')
    expect(taxonomyField?.relationTo).toBe('categories')
    expect(taxonomyField?.hasMany).toBe(true)
  })

  it('should store sanitized field info in taxonomy config', async () => {
    const config = await buildConfigWithDefaults({
      collections: [
        {
          slug: 'tags',
          fields: [{ name: 'name', type: 'text' }],
          taxonomy: {
            relatedCollections: {
              articles: { hasMany: false },
            },
          },
        },
        {
          slug: 'articles',
          fields: [{ name: 'title', type: 'text' }],
        },
      ],
    })

    const tagsCollection = config.collections.find((c) => c.slug === 'tags')
    const taxonomy = tagsCollection?.taxonomy

    expect(taxonomy?.relatedCollections).toEqual({
      articles: {
        fieldName: '_t_tags',
        hasMany: false,
      },
    })
  })
})
```

**Step 2: Commit**

```bash
git add test/taxonomy/relatedCollections.spec.ts
git commit -m "$(cat <<'EOF'
test: add tests for taxonomy field injection

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Run Tests and Verify

**Step 1: Run the taxonomy tests**

```bash
pnpm run test:int taxonomy
```

Expected: All tests pass

**Step 2: Run type checks**

```bash
pnpm run typecheck
```

Expected: No type errors

**Step 3: Test manually with dev server**

```bash
pnpm run dev taxonomy
```

- Navigate to taxonomy collection
- Verify related documents are displayed
- Verify "Load More" works for related documents

---

## Summary

This plan transforms taxonomy `relatedCollections` from a simple array of slugs to an object-based configuration where:

1. **User declares** which collections relate to the taxonomy and whether relationships are `hasMany`
2. **Payload injects** relationship fields into those collections automatically during sanitization
3. **All field metadata** (field name, hasMany) is computed once and stored in the sanitized config
4. **No runtime traversal** - queries use pre-computed field info directly

The key insight is that field injection must happen in `addTaxonomySidebarTabs` (after all collections are sanitized) since we need access to all collection configs to inject fields into them.
