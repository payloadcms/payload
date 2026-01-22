# Hierarchy Path Updates - Implementation Reference

This document explains how paths are updated in different scenarios, from simple to complex.

## Basic Concepts

When hierarchy is enabled, four internal fields track tree structure:

- `_h_parentTree`: Array of ancestor IDs (e.g., `['grandparent-id', 'parent-id']`)
- `_h_depth`: Tree depth (0-indexed from root)
- `_h_slugPath`: Forward-slash separated slug path (e.g., `products/clothing/shirts`)
- `_h_titlePath`: Forward-slash separated title path (e.g., `Products/Clothing/Shirts`)

## Scenario 1: Creating a Root Document

**Operation:**

```ts
await payload.create({
  collection: 'pages',
  data: {
    title: 'Products',
    parent: null,
  },
})
```

**Flow:**

1. Hook: `collectionAfterChange` triggered with `operation: 'create'`
2. Detects: No parent (`newParentID = null`)
3. Computes (in `afterChange` hook):
   - `_h_parentTree = []`
   - `_h_depth = 0`
   - `_h_slugPath = 'products'` (slugified title)
   - `_h_titlePath = 'Products'`
4. Updates: Document in database with computed fields (via `db.updateOne`)
5. Returns: Updated document to user

**Result:**

```ts
{
  id: '1',
  title: 'Products',
  parent: null,
  _h_parentTree: [],
  _h_depth: 0,
  _h_slugPath: 'products',
  _h_titlePath: 'Products',
}
```

## Scenario 2: Creating a Child Document

**Operation:**

```ts
await payload.create({
  collection: 'pages',
  data: {
    title: 'Clothing',
    parent: '1', // Products
  },
})
```

**Flow:**

1. Hook: `collectionAfterChange` triggered
2. Detects: Parent changed (create with parent)
3. Fetches: Parent document with `locale: 'all'` to get all parent fields
   ```ts
   parentDoc = {
     id: '1',
     _h_parentTree: [],
     _h_slugPath: 'products',
     _h_titlePath: 'Products',
   }
   ```
4. Computes (in `afterChange` hook):
   - `_h_parentTree = [...parentDoc._h_parentTree, parentID] = ['1']`
   - `_h_depth = _h_parentTree.length = 1`
   - `_h_slugPath = parentDoc._h_slugPath + '/' + slugify('Clothing') = 'products/clothing'`
   - `_h_titlePath = parentDoc._h_titlePath + '/' + 'Clothing' = 'Products/Clothing'`
5. Updates: Document in database (via `db.updateOne`)
6. Returns: Updated document

**Result:**

```ts
{
  id: '2',
  title: 'Clothing',
  parent: '1',
  _h_parentTree: ['1'],
  _h_depth: 1,
  _h_slugPath: 'products/clothing',
  _h_titlePath: 'Products/Clothing',
}
```

## Scenario 3: Renaming a Document (Title Change)

**Operation:**

```ts
await payload.update({
  collection: 'pages',
  id: '2',
  data: {
    title: 'Apparel', // Changed from 'Clothing'
  },
})
```

**Flow:**

1. Hook: `collectionAfterChange` triggered
2. Detects: Title changed (`prevTitleData.slug !== newTitleData.slug`)
3. Optimizes: Derives parent paths from previous document instead of fetching parent
   ```ts
   // Strip last segment to get parent path
   previousDoc._h_slugPath = 'products/clothing'
   parentSlugPath = 'products' // Everything before last '/'
   ```
4. Computes (in `afterChange` hook):
   - `_h_slugPath = parentSlugPath + '/' + slugify('Apparel') = 'products/apparel'`
   - `_h_titlePath = 'Products/Apparel'`
5. Finds descendants: Queries `where: { _h_parentTree: { in: ['2'] } }`
6. Updates descendants: Calls `updateDescendants()` (see Scenario 5)
7. Updates: Current document in database (via `db.updateOne`)
8. Returns: Updated document

**Result:**

```ts
{
  id: '2',
  title: 'Apparel',
  parent: '1',
  _h_parentTree: ['1'],
  _h_depth: 1,
  _h_slugPath: 'products/apparel', // ✅ Changed
  _h_titlePath: 'Products/Apparel', // ✅ Changed
}
```

## Scenario 4: Moving a Document (Re-parenting)

**Setup:**

```ts
// Tree before move:
// - Products (id: 1)
//   - Clothing (id: 2)
//     - Shirts (id: 3)
// - Accessories (id: 4)
```

**Operation:**

```ts
// Move Clothing from Products to Accessories
await payload.update({
  collection: 'pages',
  id: '2',
  data: {
    parent: '4', // Changed from '1'
  },
})
```

**Flow:**

1. Hook: `collectionAfterChange` triggered
2. Detects: Parent changed (`'1'` → `'4'`)
3. **Validates circular references (in `afterChange` hook):**
   ```ts
   if (newParentID === doc.id) throw Error // Self-parent
   if (doc._h_parentTree.includes(newParentID)) throw Error // Circular
   ```
4. Fetches: New parent document (`id: '4'`)
   ```ts
   newParentDoc = {
     id: '4',
     _h_parentTree: [],
     _h_slugPath: 'accessories',
     _h_titlePath: 'Accessories',
   }
   ```
5. Computes (in `afterChange` hook):
   - `_h_parentTree = [...newParentDoc._h_parentTree, '4'] = ['4']`
   - `_h_depth = 1`
   - `_h_slugPath = 'accessories/clothing'`
   - `_h_titlePath = 'Accessories/Clothing'`
6. Updates descendants: See Scenario 5
7. Updates: Current document (via `db.updateOne`)
8. Returns: Updated document

**Result:**

```ts
// Tree after move:
// - Products (id: 1)
// - Accessories (id: 4)
//   - Clothing (id: 2) ← Moved here
//     - Shirts (id: 3) ← Also updated!
```

## Scenario 5: Updating Descendants (Cascade Updates)

**Context:** When document `id: '2'` moves (Scenario 4), its descendants must be updated.

**Flow:**

### Step 1: Collect Descendant IDs

```ts
// Prevents race conditions by capturing IDs upfront
const descendantIDs = []
let page = 1

while (hasNextPage) {
  const result = await payload.find({
    collection: 'pages',
    where: { _h_parentTree: { in: ['2'] } },
    select: { id: true },
    limit: 1000,
    page,
  })
  descendantIDs.push(...result.docs.map((d) => d.id))
  page++
}
// Result: descendantIDs = ['3'] (Shirts)
```

### Step 2: Fetch Descendants in Batches

```ts
// Process 100 at a time
const batch = await payload.find({
  collection: 'pages',
  where: { id: { in: ['3'] } },
  select: {
    _h_parentTree: true,
    _h_slugPath: true,
    _h_titlePath: true,
  },
})

// affectedDoc = Shirts:
// {
//   id: '3',
//   _h_parentTree: ['1', '2'],
//   _h_slugPath: 'products/clothing/shirts',
//   _h_titlePath: 'Products/Clothing/Shirts',
// }
```

### Step 3: Adjust Descendant Paths

```ts
// Strip old parent prefix, add new parent prefix
adjustDescendantTreePaths({
  doc: {
    slugPath: 'products/clothing/shirts',
    titlePath: 'Products/Clothing/Shirts',
  },
  previousParentDoc: {
    slugPath: 'products/clothing',
    titlePath: 'Products/Clothing',
  },
  parentDoc: {
    slugPath: 'accessories/clothing',
    titlePath: 'Accessories/Clothing',
  },
})

// Steps:
// 1. Strip 'products/clothing' → 'shirts'
// 2. Prepend 'accessories/clothing' → 'accessories/clothing/shirts'
```

### Step 4: Update Descendant

```ts
// Uses payload.update() - NOT db.updateOne() - to ensure hooks fire
// IMPORTANT: Only updates hierarchy metadata, NOT the parent relationship!
await payload.update({
  id: '3',
  collection: 'pages',
  data: {
    _h_parentTree: ['4', '2'], // Updated!
    _h_depth: 2,
    _h_slugPath: 'accessories/clothing/shirts', // Updated!
    _h_titlePath: 'Accessories/Clothing/Shirts', // Updated!
    // NOTE: parent field NOT included - Shirts keeps parent: '2' (Clothing)
  },
  overrideAccess: true,
})
```

**Result:**

- ✅ Hooks fire on descendant (`beforeChange`, `afterChange`, etc.)
- ✅ Version created (if versioning enabled)
- ✅ All hierarchy fields updated
- ✅ Parent relationship preserved (not overwritten)

## Scenario 6: Localized Fields

**Setup:**

```ts
export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true, // ← Localized
    },
  ],
  hierarchy: { parentFieldName: 'parent' },
}
```

**Operation:**

```ts
await payload.create({
  collection: 'pages',
  data: {
    title: {
      en: 'Products',
      fr: 'Produits',
      de: 'Produkte',
    },
    parent: null,
  },
  locale: 'en',
})
```

**Flow:**

1. Hook: `collectionAfterChange` triggered with `reqLocale: 'en'`
2. Detects: Title field is localized
3. Fetches parent: `locale: 'all'` (gets all locales)
4. Generates paths for ALL locales (in `afterChange` hook):
   ```ts
   for (const locale of ['en', 'fr', 'de']) {
     const title = docWithLocales.title[locale]
     slugPath[locale] = slugify(title)
     titlePath[locale] = title
   }
   ```
5. Updates: Document with localized paths (via `db.updateOne`)
6. Returns: Document with current locale's path

**Result:**

```ts
{
  id: '1',
  title: 'Products', // Current locale (en)
  _h_slugPath: 'products', // Current locale (en)
  _h_titlePath: 'Products', // Current locale (en)

  // Full document with all locales:
  _h_slugPath: {
    en: 'products',
    fr: 'produits',
    de: 'produkte',
  },
  _h_titlePath: {
    en: 'Products',
    fr: 'Produits',
    de: 'Produkte',
  },
}
```

## Scenario 7: Localized Descendant Updates

**Context:** When a parent with localized fields moves, descendants must be updated for ALL locales.

**Flow:**

### Step 1: Adjust Paths (All Locales)

```ts
// adjustDescendantTreePaths iterates through localeCodes
for (const locale of ['en', 'fr', 'de']) {
  const oldPrefix = previousParentDoc.slugPath[locale] // 'products'
  const newPrefix = parentDoc.slugPath[locale] // 'accessories'
  const currentPath = doc.slugPath[locale] // 'products/clothing'

  // Strip 'products' → 'clothing'
  // Prepend 'accessories' → 'accessories/clothing'
  newPaths[locale] = `${newPrefix}/${currentPath.slice(oldPrefix.length)}`
}
```

### Step 2: Update Each Locale Separately

```ts
// payload.update() requires ONE locale at a time
for (const locale of ['en', 'fr', 'de']) {
  await payload.update({
    id: '2',
    collection: 'pages',
    data: {
      _h_slugPath: newPaths[locale],
      _h_titlePath: newTitlePaths[locale],
      _h_depth: newDepth,
      _h_parentTree: newParentTree,
      // NOTE: parent field NOT included - no recursion!
    },
    locale, // ← One locale per call
    overrideAccess: true,
  })
}
```

**Recursion Prevention:**

Since we only update `_h_*` internal fields (not `parent` or `title`), the hierarchy hook detects:

- `parentChanged = false` (parent field not in update data)
- `titleChanged = false` (title field not in update data)
- Hook returns early - **no infinite recursion** ✅

**Performance Impact:**

- 1 descendant × 3 locales = **3 update operations**
- 50 descendants × 3 locales = **150 update operations**
- Each operation: hooks fire, version created

## Scenario 8: Draft State (TODO: Not yet implemented)

**Setup:**

```ts
// Document has published version + draft changes
{
  id: '2',
  title: 'Clothing',
  _status: 'published',
  _h_slugPath: 'products/clothing',
}

// Draft version (in versions table):
{
  parent: '2',
  version: {
    title: 'Apparel', // Draft change
    _status: 'draft',
    _h_slugPath: 'products/clothing', // Still old path!
  }
}
```

**Problem:**
When parent moves:

1. Published doc updated: `_h_slugPath: 'accessories/clothing'` ✅
2. Draft version NOT updated: `_h_slugPath: 'products/clothing'` ❌

**Solution (needs implementation):**

```ts
// Detect published documents with drafts
const isPublished = affectedDoc._status === 'published'
const hasVersions = collection.versions

if (isPublished && hasVersions) {
  // Update published version
  await payload.update({
    id: affectedDoc.id,
    draft: false,
    data: updateData,
  })

  // Update draft version
  await payload.update({
    id: affectedDoc.id,
    draft: true,
    data: updateData,
  })
}
```

**Impact:**

- 1 descendant with draft = **2 updates** (published + draft)
- 1 descendant with draft × 3 locales = **6 updates**

## Performance Summary

| Scenario                              | Operations                | Notes                             |
| ------------------------------------- | ------------------------- | --------------------------------- |
| Create root                           | 1 update                  | Simple                            |
| Create child                          | 1 update + 1 parent fetch | Simple                            |
| Rename (no descendants)               | 1 update                  | Uses path derivation optimization |
| Rename (50 descendants)               | 51 updates                | 1 parent + 50 descendants         |
| Move (50 descendants)                 | 51 updates + 1 fetch      | Fetches new parent                |
| Localized (3 locales, 50 descendants) | 150 updates               | 50 × 3 locales                    |
| With drafts (50 descendants)          | 102 updates               | 51 × 2 (published + draft)        |
| Localized + Drafts (50 descendants)   | 300 updates               | 50 × 3 locales × 2 versions       |

## Code Flow Reference

### Main Hook: `collectionAfterChange`

File: `packages/payload/src/hierarchy/hooks/collectionAfterChange.ts`

1. Get request locale
2. Skip if `locale === 'all'`
3. Detect changes (parent, title)
4. **Validate circular references** (new!)
5. Compute tree data
6. Update current document via `db.updateOne`
7. Update descendants via `updateDescendants`
8. Return mutated doc object

### Computing Tree Data: `computeTreeData`

File: `packages/payload/src/hierarchy/utils/computeTreeData.ts`

- **Parent changed?** Fetch new parent with `locale: 'all'`
- **Title changed?** Derive parent paths (optimization)
- Call `generateTreePaths` with parent data

### Generating Paths: `generateTreePaths`

File: `packages/payload/src/hierarchy/utils/generateTreePaths.ts`

- **Localized?** Iterate through `localeCodes`, build paths per locale
- **Non-localized?** Single path string
- Use `slugify` function for slug generation

### Updating Descendants: `updateDescendants`

File: `packages/payload/src/hierarchy/utils/updateDescendants.ts`

1. **Collect IDs:** Query all descendants, capture IDs upfront (prevents race conditions)
2. **Batch process:** 100 docs at a time
3. **Adjust paths:** Call `adjustDescendantTreePaths` per doc
4. **Update per locale:** If localized, loop through locales and call `payload.update` per locale
5. **Hooks fire:** Each update triggers full hook chain + versions

### Adjusting Paths: `adjustDescendantTreePaths`

File: `packages/payload/src/hierarchy/utils/adjustDescendantTreePaths.ts`

- Strip old parent prefix from current path
- Prepend new parent prefix
- Handle localized vs non-localized

## Edge Cases & Gotchas

### 0. Why `afterChange` Instead of `beforeChange`? (ARCHITECTURAL LIMITATION)

**The Core Issue:**

Hierarchy uses `afterChange` collection hooks instead of `beforeChange`, resulting in **2 database writes** instead of 1:

1. Initial document write (via operation)
2. Hierarchy fields update (via `db.updateOne` in `afterChange`)

**Why We Can't Use `beforeChange`:**

Collection `beforeChange` hooks don't receive `docWithLocales` (the full document with all locales):

```ts
// Collection beforeChange hook signature:
beforeChange({
  data, // ← Incoming changes (current locale only)
  originalDoc, // ← Previous state (current locale only)
  // ❌ NO docWithLocales!
})

// Collection afterChange hook signature:
afterChange({
  data,
  doc,
  docWithLocales, // ✅ Full document with ALL locales
  previousDocWithLocales, // ✅ Previous state with ALL locales
})
```

**Why This Matters:**

For localized title fields, we NEED all locales to compute paths:

```ts
// User updates English title:
await payload.update({
  id: 'doc-1',
  data: { title: 'New Title' },
  locale: 'en',
})

// In beforeChange:
// - data.title = 'New Title' (en only)
// - originalDoc.title = 'Old Title' (en only)
// - Can't compute French/German paths! ❌

// In afterChange:
// - docWithLocales.title = { en: 'New Title', fr: 'Nouveau Titre', de: 'Neuer Titel' }
// - Can compute paths for ALL locales! ✅
```

**Interestingly, Field Hooks DO Get `docWithLocales`:**

```ts
// Field beforeChange hook signature (line 245-261 in update.ts):
beforeChange({
  data,
  doc: originalDoc,
  docWithLocales, // ✅ Field hooks have this!
  // ...
})
```

But hierarchy needs to run at the **collection level** because:

- Need to query descendants
- Need to trigger descendant updates
- Field hooks can't orchestrate cross-document updates

**The Trade-off:**

- **Current:** 2 DB writes (necessary due to hook limitations)
- **Ideal:** 1 DB write (if collection `beforeChange` had `docWithLocales`)

**Why Payload Doesn't Provide `docWithLocales` in Collection `beforeChange`:**

Likely because:

1. Requires fetching with `locale: 'all'` - extra DB overhead for every hook
2. Most collection hooks don't need all locales
3. Historical design decision

**Could This Be Fixed?**

Yes, if Payload added `docWithLocales` to collection `beforeChange` hooks:

- Hierarchy could compute paths in `beforeChange`
- Return `data` with hierarchy fields included
- **Single database write** with everything
- More efficient, more atomic

But this would be a breaking change to Payload's hook API.

### 1. Circular References (HANDLED ✅)

- **Problem:** User could create `doc.parent = doc.id` or circular loops
- **Solution:** Validation in `collectionAfterChange` before processing
- **Error:** Throws before any updates happen

### 2. Race Conditions (HANDLED ✅)

- **Problem:** Concurrent updates during descendant pagination could miss docs
- **Solution:** Capture all descendant IDs upfront before processing batches

### 3. Locale 'all' (HANDLED ✅)

- **Problem:** If `req.locale === 'all'`, hook can't determine which locale to process
- **Solution:** Early return with comment explaining defensive check

### 4. Draft State (NOT HANDLED ❌)

- **Problem:** Descendants with draft versions only update published version
- **Impact:** Draft versions get stale paths
- **Needs:** Detection via `_status` field + dual updates

### 5. Deep Trees (HANDLED ✅)

- **Problem:** Deeply nested trees could cause memory issues
- **Solution:** Batch processing (100 docs at a time), pagination for ID collection

### 6. Title Field Changes (HANDLED ✅)

- **Problem:** When only title changes, fetching parent is wasteful
- **Solution:** Path derivation optimization - strips last segment instead of fetching

### 7. Localization Performance (KNOWN LIMITATION)

- **Problem:** Localized updates multiply operations by locale count
- **Impact:** 3 locales = 3× slower
- **Mitigation:** None currently, just document behavior
