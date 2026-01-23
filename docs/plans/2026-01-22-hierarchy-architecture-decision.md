# Hierarchy Architecture Decision: Computed Paths vs Stored Paths

**Date:** 2026-01-22
**Decision:** Move from stored path fields to computed-on-demand paths

## The Problem We Hit

**Original approach:** Store hierarchy path fields (`_h_slugPath`, `_h_titlePath`) directly in documents and cascade updates to descendants.

**Draft isolation attempt:** When a parent's draft changes (e.g., slug "about" → "about-us"), we tried to defer cascading those path updates to descendants until the parent publishes. Goal was to avoid modifying published descendants when only the parent's draft changed.

**Why this fails:**

The admin panel loads all documents with `draft: true`, which means:

- For documents WITH drafts: shows draft version
- For documents WITHOUT drafts: falls back to published version

**Scenario:**

1. Published parent "About" at `/about` with child "Team" at `/about/team`
2. User edits parent draft, changing slug to "about-us"
3. Parent's draft now has path `/about-us` ✓
4. Child has no draft (user didn't edit it), so falls back to published version
5. Child's published path is still `/about/team` ✗

**Result:** Admin UI shows parent at `/about-us` but child at `/about/team` - broken hierarchy display.

## Specific Problems with Stored Paths + Drafts

When you defer cascade updates to descendants until publish, here are the concrete user-facing problems:

### 1. Search Doesn't Work

**Scenario:** User creates a draft changing "Products" → "Shop"

```
Published:   /products/shoes
Draft:       /shop/shoes  (desired)
Actual:      /products/shoes  (child path never updated)
```

**Problem:** User searches for "shop/shoes" in admin panel → **0 results**. The child's stored path is still `/products/shoes` because we didn't cascade the update.

### 2. Breadcrumbs Show Wrong Parent

**Scenario:** Admin panel displays breadcrumbs for the "Shoes" page

```
Actual breadcrumb:  Products > Shoes
Expected:           Shop > Shoes
```

**Problem:** Breadcrumb component reads the stored `_h_titlePath` from the child document. Since we didn't update it, it still says "Products > Shoes" even though the parent draft says "Shop".

### 3. List View Shows Inconsistent Hierarchy

**Scenario:** Admin list view showing pages with their paths

```
| Title | Path            | Status    |
|-------|-----------------|-----------|
| Shop  | /shop           | Draft     |  ✓ Correct
| Shoes | /products/shoes | Published |  ✗ Wrong parent
| Pants | /products/pants | Published |  ✗ Wrong parent
```

**Problem:** Parent appears moved but children still show old parent path. The hierarchy looks broken.

### 4. Draft Preview Shows Wrong URLs

**Scenario:** User clicks "Preview" on the "Shoes" draft page

```
Expected URL: /shop/shoes
Actual URL:   /products/shoes
```

**Problem:** Preview URL builder uses the stored `_h_slugPath` from the document. Since we didn't update descendants, they still have the old path.

### 5. Collection Filters Break

**Scenario:** Admin filters "Show all pages under Shop"

```sql
WHERE _h_slugPath LIKE 'shop/%'
```

**Problem:** Returns 0 results because all child documents still have `_h_slugPath = 'products/%'` in their stored fields.

### 6. API Responses Are Inconsistent

**Scenario:** Frontend fetches published data vs draft data

```typescript
// Published API
GET /api/pages/shoes
{ _h_slugPath: "products/shoes" }  ✓ Correct for published

// Draft API
GET /api/pages/shoes?draft=true
{ _h_slugPath: "products/shoes" }  ✗ Wrong! Should be "shop/shoes"
```

**Problem:** Draft API returns stale paths because the child document wasn't updated when parent's draft changed.

### 7. Localized Drafts Break Differently Per Locale

**Scenario:** User changes Spanish draft title "Productos" → "Tienda"

```
EN published:  /products/shoes  ✓ Correct
EN draft:      /shop/shoes      ✓ Correct
ES published:  /productos/shoes ✓ Correct
ES draft:      /productos/shoes ✗ Wrong! Should be "tienda/shoes"
```

**Problem:** Spanish child paths still reference old parent slug because cascade didn't run for the Spanish locale draft.

## Why Alternatives Don't Work

**Option 1: Update published descendants during draft changes**

When parent draft changes from "Products" → "Shop", immediately update all descendant published documents:

```
Published descendant before: { _h_slugPath: "products/shoes" }
Published descendant after:  { _h_slugPath: "shop/shoes" }
```

Problems:

- ❌ Published page URLs change when you edit a draft (breaks live site links)
- ❌ SEO disaster: published URLs change before you're ready
- ❌ Confusing: "Why did my published /products/shoes URL break when I only edited a draft?"
- ❌ Version history breaks: published version now references draft parent path

**Option 2: Auto-create draft versions for all descendants**

When parent draft changes, auto-create draft versions of ALL descendants with updated paths:

```
Before: 1 draft (parent)
After:  101 drafts (parent + 100 children)
```

Problems:

- ❌ Scale: 100+ pages under "Products" means 100+ auto-generated drafts
- ❌ Draft list explodes: user only edited 1 page, sees 100 drafts
- ❌ Confusing: "Why do I have drafts for pages I never touched?"
- ❌ Cleanup nightmare: if you discard parent draft, what happens to the 100 auto-drafts?
- ❌ Storage: creates 100+ version records just for a parent slug change
- ❌ Nested edits: if user then edits a child draft, which path wins?

**Option 3: Add UI warnings about stale paths**

Keep stale paths, add warnings like "Path may be outdated until parent publishes":

Problems:

- ❌ Search broken: searching "shop/shoes" returns nothing
- ❌ Breadcrumbs wrong: shows "Products > Shoes" when viewing Shop draft
- ❌ Filters broken: "Show pages under Shop" returns nothing
- ❌ Preview URLs wrong: draft preview uses old path
- ❌ Confusing mental model: "Why does the hierarchy look broken in admin?"
- ❌ Trust issues: "Can I trust anything I see in the admin panel?"

**Option 4: Only cascade on publish**

Wait until parent publishes, then cascade path updates to descendants:

Problems (same as Option 3):

- ❌ All 7 problems listed above still exist while draft is unpublished
- ❌ Worse: problems persist indefinitely if draft never publishes
- ❌ Multiple editors: Editor A creates parent draft, Editor B can't find child pages by new path
- ❌ Draft workflows broken: can't preview full site with draft hierarchy

**Root cause:** Storing paths as database fields creates a data consistency problem. You cannot have accurate draft hierarchy AND stored paths simultaneously - they're fundamentally incompatible.

## The Solution: Computed Paths

**New approach:** Remove `_h_slugPath` and `_h_titlePath` fields from database. Compute paths on-demand from `_h_parentTree`.

**How it works:**

```typescript
// Document stores only structure
{
  id: 1,
  title: "Team",
  parent: 123,
  _h_parentTree: [123],  // Array of ancestor IDs
  _h_depth: 1
}

// When path is needed, query ancestors in one request
const ancestors = await payload.find({
  where: { id: { in: [123] } },
  draft: true,  // <-- Context flows naturally!
  locale: 'en'
})

// Build path from ancestor titles
path = ancestors.map(a => slugify(a.title)).join('/')
// Result: "about-us/team" ✓
```

**Key insight:** The `draft: true` context naturally flows through path computation. When computing a child's path, we fetch the parent with `draft: true` and get the draft title automatically.

## Why This Works

1. **Solves draft problem completely**

   - No cascade needed for title/draft changes
   - Admin UI always shows correct paths for current context
   - Search works because we fetch with proper draft context

2. **Simpler implementation**

   - Hooks only update tree structure (`_h_parentTree`, `_h_depth`)
   - No path string manipulation
   - No locale handling in cascades (tree structure is universal)
   - Draft operations don't trigger cascades at all

3. **Better performance in common case**

   - Changing a title: 0 cascades (was N descendant updates)
   - Draft operations: 0 cascades (was N descendant updates)
   - Moving parent: Still O(N) cascade, but only for tree structure

4. **More flexible**
   - Can compute paths in any context (draft/published, any locale)
   - Users can add custom path computation logic
   - No stale data issues

## Trade-offs

**Performance:**

- Path computation requires fetching ancestors (1 query, O(depth))
- Mitigated by: most trees are shallow, single query gets all ancestors
- Can add caching layer if needed for hot paths

**Breaking change:**

- Existing code relying on stored `_h_slugPath`/`_h_titlePath` must migrate
- Migration: Use new `computeSlugPath()` / `computeTitlePath()` utilities

**Search limitation:**

- Cannot filter directly on full paths in database queries
- Users search on `title` field instead (still effective)

## Benefits Summary

| Aspect                  | Stored Paths        | Computed Paths      |
| ----------------------- | ------------------- | ------------------- |
| Draft isolation         | ❌ Broken           | ✅ Natural          |
| Title change cascade    | ✅ Slow (N updates) | ✅ Fast (0 updates) |
| Draft operation cascade | ❌ Broken or slow   | ✅ Fast (0 updates) |
| Move parent cascade     | ✅ O(N)             | ✅ O(N)             |
| Localization complexity | ❌ High             | ✅ Low              |
| Code complexity         | ❌ High             | ✅ Low              |
| Path search             | ✅ Direct           | ❌ Title only       |
| Always accurate         | ❌ No               | ✅ Yes              |

## Decision

**Move to computed paths.** Stored paths make draft functionality fundamentally broken - search doesn't work, breadcrumbs are wrong, filters fail, and the admin UI shows inconsistent data. All attempted fixes create worse problems (breaking published URLs, exploding draft counts, or leaving the UI broken).

Computed paths solve all these problems by computing paths on-demand with the correct draft context. When you fetch a document with `draft: true`, path computation automatically fetches parent data with `draft: true`, so paths are always accurate for the current context.

The performance trade-off (computing paths vs storing them) is acceptable because:

1. Tree depth is typically shallow (2-4 levels)
2. Single query fetches all ancestors
3. Can add caching if needed
4. Eliminates all cascade operations for title/draft changes (better overall performance)
