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

## Why Alternatives Don't Work

**Option 1: Update published descendants during draft changes**

- ❌ Defeats draft isolation purpose
- ❌ Surprising behavior: editing a draft modifies other published documents

**Option 2: Auto-create draft versions for all descendants**

- ❌ Creates hundreds/thousands of auto-generated drafts
- ❌ Confusing UX: "Why do I have 50 drafts I didn't create?"
- ❌ Cleanup complexity: what if parent draft is discarded?
- ❌ Doesn't scale with large trees

**Option 3: Add UI warnings about stale paths**

- ❌ Poor UX: breadcrumbs/search appear broken
- ❌ Users can't search for draft paths that don't exist yet
- ❌ Confusing mental model

**Root cause:** Storing paths as database fields creates a data consistency problem that can't be solved with drafts.

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

**Move to computed paths.** The draft isolation problem with stored paths is unsolvable without creating worse problems. Computed paths solve it naturally while simplifying the codebase and improving performance for common operations.

The performance trade-off (computing paths vs storing them) is acceptable because:

1. Tree depth is typically shallow (2-4 levels)
2. Single query fetches all ancestors
3. Can add caching if needed
4. Eliminates all cascade operations for title/draft changes
