# Hierarchy Feature - High-Level Design

## Goals

1. **Tree Structure Management**: Enable collections to maintain parent-child relationships with automatic tree metadata
2. **Path Generation**: Automatically compute human-readable paths based on document titles (e.g., `grandparent/parent/child`)
3. **Localization Support**: Handle localized fields where paths differ per locale
4. **Draft Versioning**: Support Payload's draft/publish workflow where documents can have separate draft and published versions
5. **Performance**: Handle unlimited tree depth with batch processing for descendants

## Core Constraints

### Hook Responsibilities

**beforeChange Hook:**

- ONLY updates THIS document for the CURRENT request locale
- Computes: `_h_depth`, `_h_parentTree`, paths (if enabled)
- Sets values on `data` object so Payload persists them
- Validates circular references
- Does NOT handle: other locales, descendants

**afterChange Hook:**

- Updates OTHER locales for this document (when parent changes and field is localized)
- Updates ALL descendants of this document (when parent or title changes)
- Handles draft versions if versioning is enabled
- Does NOT handle: current request locale for this document (already done by beforeChange)

### Data Flow Constraints

1. **beforeChange `data` parameter**: Contains non-localized data (strings)

   - When setting `data[localizedField] = 'value'`, Payload's internal mechanisms nest it under the locale key
   - Example: Setting `data._h_slugPath = 'clothing'` with `locale: 'es'` → DB gets `{en: '...', es: 'clothing'}`

2. **afterChange context**: Has access to localized data (objects)

   - `doc`: Current locale only
   - `docWithLocales`: All locales

3. **Database operations**:
   - `payload.update({locale: 'es'})`: Expects non-localized data (strings)
   - `payload.db.updateOne({locale: 'all'})`: Expects localized data (objects like `{en: '...', es: '...'}`)

### Localization Constraints

- Payload merges existing locale data with incoming data per request locale
- Each update with a specific locale only affects that locale's data
- To update multiple locales at once, must use `db.updateOne` with `locale: 'all'`
- Path fields can be localized (different per locale) or non-localized (same for all locales)

### Draft/Versioning Constraints

- Collections can have versioning enabled with drafts
- Documents can be: published-only, draft-only, or have both versions
- When updating a published document with `draft: true`, creates/updates draft version
- Version records are stored separately in `_versions` collection
- Hierarchy fields must be updated in BOTH the main collection AND version records

## Key Algorithms

### Parent Tree Computation

```
newParentTree = parentDoc._h_parentTree + [parentID]
depth = newParentTree.length
```

### Path Computation (Simple)

```
For current document:
  slugPath = parentSlugPath + "/" + slugify(title)
  titlePath = parentTitlePath + "/" + title

For root documents (no parent):
  slugPath = slugify(title)
  titlePath = title
```

### Descendant Path Adjustment

```
When ancestor path changes from "a/b" to "x/y":
  descendantPath = "a/b/c/d"
  1. Strip old prefix: "c/d"
  2. Add new prefix: "x/y/c/d"
```

## Architecture Decisions

### Why Split beforeChange and afterChange?

Originally tried to handle everything in one hook, which led to confusion about:

- Which locale is being updated
- Whether to fetch with `locale: 'all'` or specific locale
- When to use localized objects vs strings

The split makes responsibilities clear:

- **beforeChange**: Simple, focused on current operation
- **afterChange**: Complex, handles cascading updates

### Why Not Use computeTreeData in beforeChange?

`computeTreeData` was designed for `afterChange` context where we have full localized data. Reusing it in `beforeChange` caused confusion because:

- beforeChange has non-localized incoming data
- beforeChange shouldn't fetch all locales (performance)
- The logic for "current locale only" is simpler without the abstraction

### Why Update Descendants in afterChange Not beforeChange?

- Descendants need the updated parent document with all locales
- beforeChange hasn't persisted changes yet
- afterChange ensures parent is fully updated before cascading to children

## Current Status

- **26/32 tests passing** (81%)
- All non-localized tests pass
- Basic localization works
- Remaining issues:
  1. Path truncation in some localization scenarios
  2. Draft-only document descendant updates
  3. Minor test expectations (populated fields vs IDs)

## Testing Strategy

- Each test creates isolated documents
- Tests use MongoDB in-memory for speed
- Localization tests verify all three locales (en, es, de)
- Draft tests verify both published and draft versions
- Circular reference tests ensure validation works
