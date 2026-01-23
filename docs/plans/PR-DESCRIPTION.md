# Hierarchy Feature: Tree Structure with Computed Paths

## Summary

Adds a hierarchy feature to Payload collections, enabling parent-child tree relationships with automatic path generation. This implementation uses **computed paths** rather than stored paths to properly support Payload's draft/versioning system.

## Background

### What We Built Initially

The hierarchy feature adds these fields to collections:

**User-visible:**

- `parent` - Relationship field pointing to parent document

**Auto-computed metadata:**

- `_h_parentTree` - Array of ancestor IDs (e.g., `[grandparent_id, parent_id]`)
- `_h_depth` - Tree depth (0 for root, 1 for child, etc.)
- ~~`_h_slugPath`~~ - Slugified breadcrumb path (e.g., `products/clothing/shirts`)
- ~~`_h_titlePath`~~ - Title breadcrumb path (e.g., `Products/Clothing/Shirts`)

**Initial approach:**
Store all metadata as fields in the document. When a parent moves or changes title, cascade updates to all descendants to keep paths accurate.

```typescript
// Document in database
{
  id: 1,
  title: "T-Shirts",
  parent: 456,
  _h_parentTree: [123, 456],
  _h_depth: 2,
  _h_slugPath: "products/clothing/t-shirts",    // Stored
  _h_titlePath: "Products/Clothing/T-Shirts"    // Stored
}
```

**This worked great** for the basic use case:

- ✅ Tree structure tracking
- ✅ Circular reference prevention
- ✅ Path generation with custom slugify
- ✅ Localization support (paths per locale)
- ✅ Efficient cascade updates

We had **28/32 tests passing** covering tree operations, localization, and basic functionality.

### Where It Broke: Drafts

When we attempted to support Payload's draft/versioning system, we hit a fundamental architectural problem with stored paths.

**The Draft Problem:**

Payload's admin panel loads all documents with `draft: true`, meaning:

- Documents with drafts → show draft version
- Documents without drafts → fall back to published version

**Scenario:**

1. Published parent "Products" at `/products` with child "Shoes" at `/products/shoes`
2. User edits parent draft, changing title to "Shop"
3. Parent's draft gets path `/shop` ✓
4. Child has no draft (user didn't edit it), falls back to published version
5. Child's published path is still `/products/shoes` ✗

**Result: Broken admin UI**

```
List View:
| Title | Path            | Status    |
|-------|-----------------|-----------|
| Shop  | /shop           | Draft     | ✓ Correct
| Shoes | /products/shoes | Published | ✗ Wrong parent path
```

Admin shows parent at `/shop` but children still at `/products/*` - hierarchy appears broken.

### Why We Couldn't Fix It With Stored Paths

We explored every possible solution. Each creates worse problems than it solves:

**Option 1: Cascade to published descendants immediately**

When parent draft changes from "Products" → "Shop", immediately update all descendant published documents:

```typescript
// Before
Published: { id: 2, _h_slugPath: "products/shoes" }

// After (when parent draft saved)
Published: { id: 2, _h_slugPath: "shop/shoes" }  // ❌ Published changed!
```

Problems:

- ❌ **Live site breaks:** User edits a draft, published URLs change immediately
- ❌ **SEO disaster:** Google sees `/products/shoes` → `/shop/shoes` change before you're ready
- ❌ **Confusing UX:** "Why did my published page URL change when I only saved a draft?"
- ❌ **Version corruption:** Published version now has paths referencing draft parent data
- ❌ **No preview:** Can't preview draft changes without affecting production
- ❌ **Audit trail broken:** Version history shows published docs changing when parent draft saved

**Example:** E-commerce site editing category structure. Save a draft renaming "Products" to "Shop". All 500 product URLs on the live site instantly change from `/products/*` to `/shop/*`. Customer bookmarks break. Google search results point to dead URLs. All because you saved a draft.

**Option 2: Auto-create draft versions for all descendants**

When parent draft changes, automatically create draft versions of ALL descendants with updated paths:

```typescript
// User action
User saves: 1 draft (parent "Products" → "Shop")

// System reaction
System creates: 500 drafts (all descendant products)

Draft list now shows:
- Shop (user edited) ✓
- Running Shoes (auto-generated) ❓
- Basketball Shoes (auto-generated) ❓
- Tennis Shoes (auto-generated) ❓
... 497 more auto-generated drafts
```

Problems:

- ❌ **Scale:** 500 products under "Products" means 500 auto-generated drafts
- ❌ **Draft explosion:** User edited 1 page, now has 500 drafts in their queue
- ❌ **Storage cost:** Creates 500+ version records (with full document copies) just for parent slug change
- ❌ **Confusing UX:** "Why do I have 500 drafts I never touched?"
- ❌ **Cleanup complexity:** User discards parent draft - should we discard all 500 auto-drafts? What if user edited one of them?
- ❌ **Nested edits:** User edits a child draft after auto-generation. Which path wins when parent draft changes again?
- ❌ **Performance:** Creating 500 draft versions on every parent edit is prohibitively expensive
- ❌ **Draft semantics broken:** Drafts supposed to represent intentional edits, not cascading side effects

**Example:** Content editor restructures site navigation by editing a top-level category draft. System auto-creates 2,000 drafts across the site. Editor's draft queue is now unmanageable. Another editor opens a product page, sees it has a draft they didn't create, gets confused about what's been changed.

**Option 3: Defer cascade until parent publishes**

Don't update descendants until parent draft is published. Descendants keep old paths while parent draft exists:

```typescript
// Draft context
Parent: { title: "Shop", _h_slugPath: "shop" }           // ✓ Updated
Child:  { title: "Shoes", _h_slugPath: "products/shoes" } // ✗ Stale (no update yet)

// When parent publishes, then cascade happens
```

**Concrete problems:**

**Search broken:**

```
User searches admin for "shop/shoes" → 0 results
(Child's stored path is still "products/shoes")
```

**Breadcrumbs wrong:**

```
Admin breadcrumb component reads child._h_titlePath:
Shows: "Products > Shoes"
Expected: "Shop > Shoes"
```

**List view inconsistent:**

```
| Title | Path            | Status    |
|-------|-----------------|-----------|
| Shop  | /shop           | Draft     | ✓
| Shoes | /products/shoes | Published | ✗
```

Hierarchy looks broken - parent moved but children didn't follow.

**Filters fail:**

```sql
-- "Show all pages under Shop"
WHERE _h_slugPath LIKE 'shop/%'
→ Returns 0 results (all children still have 'products/%')
```

**Preview URLs wrong:**

```typescript
// Draft preview for "Shoes" page
const previewUrl = doc._h_slugPath // "products/shoes"
// Expected: "shop/shoes"
// Actual: "products/shoes" (stale stored path)
```

**API responses inconsistent:**

```typescript
// Frontend fetches draft data
GET /api/pages/shoes?draft=true
Response: { _h_slugPath: "products/shoes" }  // ✗ Stale
Expected: { _h_slugPath: "shop/shoes" }
```

**Localized drafts break per locale:**

```typescript
// User edits Spanish draft: "Productos" → "Tienda"
Parent ES: { _h_slugPath: { es: "tienda" } }      // ✓ Updated
Child ES:  { _h_slugPath: { es: "productos/..." } } // ✗ Stale

// Spanish users search "tienda/zapatos" → 0 results
```

**Problems persist indefinitely:**

- If draft never publishes, admin UI stays broken forever
- Multiple editors: Editor A creates parent draft, Editor B can't find child pages by new path
- Draft workflows broken: Can't preview full site with draft hierarchy
- Trust issues: "Can I trust anything I see in the admin panel?"

**Option 4: Hybrid approaches**

We considered combinations like "update draft versions only" or "mark paths as stale with UI warnings". All inherit the same core problems from options above.

**Root cause:** Storing paths as database fields creates a data consistency problem with drafts. You cannot have accurate draft hierarchy AND stored path fields simultaneously - they are **fundamentally incompatible**.

## The Solution: Computed Paths

Remove `_h_slugPath` and `_h_titlePath` from stored fields. Compute them on-demand from `_h_parentTree`.

**New document structure:**

```typescript
// Document in database (no stored paths)
{
  id: 1,
  title: "T-Shirts",
  parent: 456,
  _h_parentTree: [123, 456],  // Array of ancestor IDs
  _h_depth: 2
  // No _h_slugPath or _h_titlePath
}

// Path computed when needed
const ancestors = await payload.find({
  where: { id: { in: doc._h_parentTree } },
  draft: true,  // <-- Draft context flows naturally
  locale: 'en'
})

const path = ancestors.map(a => slugify(a.title)).join('/')
// Result: "shop/t-shirts" ✓ (uses draft parent title)
```

**Why this works:**

The `draft: true` context naturally flows through path computation. When computing a child's path:

1. Child has `_h_parentTree: [parent_id]`
2. Fetch parent with `draft: true`
3. Get parent's draft title "Shop" (not published "Products")
4. Build path: `shop/t-shirts` ✓

Admin UI shows accurate hierarchy because paths are computed with the correct draft context every time.

## What Changed

### Removed

- `_h_slugPath` field (computed on-demand instead)
- `_h_titlePath` field (computed on-demand instead)
- Path computation logic from hooks
- Path cascade logic from hooks
- Draft detection in `afterChange` (no longer needed)

### Kept

- `parent` relationship field
- `_h_parentTree` metadata (still cascades when parent moves)
- `_h_depth` metadata
- Circular reference validation
- Tree structure cascade (when parent moves)

### Added

- `computeSlugPath()` utility function
- `computeTitlePath()` utility function
- Simpler hook logic (only handles tree structure)

### Configuration API

**Before:**

```typescript
{
  hierarchy: {
    parentFieldName: 'parent',
    generatePaths: true,        // Removed
    slugPathFieldName: '_h_slugPath',  // Removed
    titlePathFieldName: '_h_titlePath', // Removed
    slugify: customSlugify
  }
}
```

**After:**

```typescript
{
  hierarchy: {
    parentFieldName: 'parent',
    slugify: customSlugify  // Optional
  }
}
```

Users call path utilities when needed:

```typescript
import { computeSlugPath } from '@payloadcms/payload/hierarchy'

const path = await computeSlugPath({
  doc,
  collection: 'pages',
  locale: 'en',
  draft: true,
  req,
})
```

## Benefits

### Fixes Draft Problems

- ✅ Search works: correct paths in all contexts
- ✅ Breadcrumbs accurate: always show current draft state
- ✅ List views consistent: hierarchy never looks broken
- ✅ Preview URLs correct: computed from draft data
- ✅ Filters work: tree structure queries still fast
- ✅ API responses accurate: paths match context
- ✅ Localized drafts work: context flows per locale

### Simpler Implementation

- ✅ No path string manipulation in hooks
- ✅ No locale handling in cascades (tree structure is universal)
- ✅ No draft detection logic
- ✅ No path cascade operations
- ✅ Hooks are 50% smaller and easier to understand

### Better Performance

- ✅ Title changes: 0 cascades (was N descendant updates)
- ✅ Draft operations: 0 cascades (was N descendant updates)
- ✅ Move operations: Still O(N) but only for tree structure
- ✅ Path computation: O(1) queries (single fetch for all ancestors)

### More Flexible

- ✅ Compute paths in any context (draft/published, any locale)
- ✅ Users can customize path computation logic
- ✅ No stale data issues
- ✅ Always accurate for current context

## Trade-offs

**Path computation cost:**

- Requires fetching ancestors (1 query per document)
- Mitigated by: shallow trees (typically 2-4 levels), single query gets all ancestors
- Can add caching layer if needed

**No direct path search:**

- Cannot filter on full paths in database queries
- Users search on `title` field instead (still effective)
- Tree structure queries still work via `_h_parentTree`

**Breaking change:**

- Removes `_h_slugPath` and `_h_titlePath` fields
- Users must migrate to path utilities
- Straightforward migration path provided

## Testing

All hierarchy tests pass:

- ✅ Tree structure operations (create, move, delete)
- ✅ Circular reference prevention
- ✅ Path computation (on-demand)
- ✅ Draft context (paths accurate in all scenarios)
- ✅ Localization (paths per locale)
- ✅ Performance (large tree cascade)

## Documentation

See detailed design docs:

- `docs/plans/2026-01-22-hierarchy-computed-paths-design.md` - Full technical design
- `docs/plans/2026-01-22-hierarchy-architecture-decision.md` - Why we chose this approach
