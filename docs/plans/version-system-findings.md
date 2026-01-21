# Version System Findings

## Storage Model

### Published Data

- **Location:** Main collection table (e.g., `pages` table)
- **Purpose:** Stores the "live" published version of documents
- **Access:** Returned by default for `findByID()` and `find()` operations when `draft` parameter is omitted or `false`

### Draft/Version Data

- **Location:** Versions table (e.g., `_pages_versions` table)
- **Structure:** Each version document contains:
  - `_id`: Unique ID of the version record
  - `parent`: ID of the parent document (for collections only)
  - `autosave`: Boolean flag for autosave versions
  - `latest`: Boolean flag marking the most recent version
  - `version`: Full copy of the document data (all fields are optional)
  - `createdAt`: Version creation timestamp
  - `updatedAt`: Version update timestamp
- **Purpose:** Stores version history and draft changes

### Status Field (`_status`)

- **Added when:** Drafts are enabled on a collection/global
- **Location:** Injected into both main table and version data
- **Values:** `'draft'` or `'published'`
- **Default:** `'draft'` when not explicitly provided
- **Note:** The `_status` field indicates the document's publication state but does NOT control where data is written

## Update Behavior

### `payload.update({ draft: false })` or omitted

**Write locations:**

1. Updates main collection table
2. Creates new entry in versions table (if versioning enabled)
3. Both locations reflect the new data

**Validation:** Required fields are enforced

**Flow (from `packages/payload/src/collections/operations/utilities/update.ts`):**

```typescript
// Line 362-372
if (!isSavingDraft) {
  // Ensure updatedAt date is always updated
  dataToUpdate.updatedAt = new Date().toISOString()
  resultWithLocales = await req.payload.db.updateOne({
    id,
    collection: collectionConfig.slug,
    data: dataToUpdate,
    locale,
    req,
  })
}

// Line 378-391: Then create version
if (collectionConfig.versions) {
  resultWithLocales = await saveVersion({
    id,
    autosave,
    collection: collectionConfig,
    docWithLocales: result,
    draft: isSavingDraft,
    operation: 'update',
    payload,
    publishSpecificLocale,
    req,
    snapshot: snapshotToSave,
  })
}
```

### `payload.update({ draft: true })`

**Write locations:**

1. Does NOT update main collection table
2. Only creates/updates entry in versions table

**Validation:** Required fields are NOT enforced (allows partial/incomplete documents)

**Flow (same file):**

```typescript
// Line 112-115: isSavingDraft determination
const isSavingDraft =
  Boolean(draftArg && hasDraftsEnabled(collectionConfig)) &&
  data._status !== 'published' &&
  !publishAllLocales

// Line 125-127: Sets _status to draft
if (isSavingDraft) {
  data._status = 'draft'
}

// Line 362: Skips main collection update when isSavingDraft is true
if (!isSavingDraft) {
  // ... main collection update
}

// Line 378-391: Only saves to versions table
if (collectionConfig.versions) {
  resultWithLocales = await saveVersion({
    draft: isSavingDraft, // true
    // ...
  })
}
```

## Read Behavior

### `payload.findByID({ draft: true })`

**Returns:** Most recent version from versions table (via `replaceWithDraftIfAvailable`)

**Query logic (from `packages/payload/src/versions/drafts/replaceWithDraftIfAvailable.ts`):**

```typescript
// Line 36-44: Queries for draft versions
let queryToBuild: Where = {
  and: [
    {
      'version._status': {
        equals: 'draft',
      },
    },
  ],
}

// Line 75-81: For collections, add parent filter
if (entityType === 'collection') {
  queryToBuild.and!.push({
    parent: {
      equals: doc.id,
    },
  })
}

// Line 83-98: Add timestamp filter to get newer versions
if (docHasTimestamps(doc)) {
  queryToBuild.and!.push({
    or: [
      {
        updatedAt: {
          greater_than: doc.updatedAt,
        },
      },
      {
        latest: {
          equals: true,
        },
      },
    ],
  })
}
```

**Ignores:** Main collection table

### `payload.findByID({ draft: false })` or omitted

**Returns:** Document from main collection table

**Ignores:** Versions table entirely

### `payload.db.queryDrafts()`

**Purpose:** Database adapter method that returns draft versions or published documents based on whether drafts exist

**Used in:** Bulk update operations when `draft: true` is specified (see `packages/payload/src/collections/operations/update.ts` line 178-199)

## Key Insights

### Problem: Three Possible Document States

When we call `payload.update()` on a descendant during hierarchy updates, we don't know if it has:

1. **Published version only** (main table, no newer drafts)

   - Common for documents that haven't been edited since publishing
   - Update with `draft: false` works correctly

2. **Draft version only** (versions table, never published)

   - Document created with `draft: true` and never published
   - Has `_status: 'draft'` in both main table and versions table
   - Update with `draft: false` works correctly (updates both)

3. **Both published AND draft** (main table + newer version in versions table)
   - Published document with unpublished changes
   - Main table has `_status: 'published'`
   - Versions table has newer entry with `_status: 'draft'`
   - **Problem:** Single `payload.update()` only updates ONE location
   - **This is the case we need to handle**

### How to Detect Case #3

**Method 1: Check `_status` field**

```typescript
// In updateDescendants, line 84-86
if (hasDraftsEnabled(collection)) {
  selectFields._status = true
}
```

If `affectedDoc._status === 'published'` AND versions are enabled, we know:

- There's a published version in main table
- There MAY be a draft version in versions table

**Method 2: Query for latest draft version**

```typescript
// Use getLatestCollectionVersion with published: false
const latestDraft = await getLatestCollectionVersion({
  id: affectedDoc.id,
  config: collectionConfig,
  payload,
  published: false, // Get latest version regardless of status
  query: {
    collection: collectionConfig.slug,
    locale: 'all',
    req,
    where: { id: { equals: affectedDoc.id } },
  },
  req,
})

// If latestDraft exists and latestDraft.updatedAt > affectedDoc.updatedAt,
// then there's a newer draft version
```

**Method 3: Use `queryDrafts` database operation**

```typescript
// Similar to what bulk update does (update.ts line 189-197)
const query = await payload.db.queryDrafts({
  collection: collectionConfig.slug,
  where: { id: { equals: affectedDoc.id } },
  limit: 1,
  // ...
})
// If query returns a document with newer updatedAt, there's a draft
```

### Solution Requirements

For case #3 (published + draft), we need to update BOTH:

1. Main collection document (published version)
2. Versions table entry (draft version)

This ensures hierarchy metadata stays in sync across both versions.

## Alternative Approaches Analysis

### Approach A: Dual Updates via payload.update()

**Implementation:**

```typescript
// In updateDescendants.ts, when updating a descendant:
if (affectedDoc._status === 'published' && hasDraftsEnabled(collection)) {
  // Update published version
  await req.payload.update({
    id: affectedDoc.id,
    collection: collection.slug,
    data: updateData,
    draft: false,
    depth: 0,
    locale,
    overrideAccess: true,
    req,
  })

  // Update draft version
  await req.payload.update({
    id: affectedDoc.id,
    collection: collection.slug,
    data: updateData,
    draft: true,
    depth: 0,
    locale,
    overrideAccess: true,
    req,
  })
} else {
  // Existing single update
  await req.payload.update({
    id: affectedDoc.id,
    collection: collection.slug,
    data: updateData,
    // draft parameter omitted - uses default behavior
  })
}
```

**Pros:**

- Simple and straightforward
- Uses existing public APIs
- Respects all hooks and validation
- Works with all database adapters
- No need to understand version table internals

**Cons:**

- Creates 2 new version entries per descendant (one for each update)
  - This may be acceptable since we're making real changes (hierarchy metadata)
  - Version history will show these updates
- Doubles the number of operations for documents with drafts
  - 1 descendant with drafts = 2 updates instead of 1
  - 50 descendants with drafts = 100 updates
  - With 3 locales: 300 updates instead of 150
- Each update fires full hook chain twice
  - Could trigger unexpected side effects if hooks do non-idempotent operations
  - Hooks see the same data twice (once for draft, once for published)

**Risk Assessment:**

- Low risk: Uses stable public API
- Hook compatibility: Hooks fire twice but see identical data
- Performance impact: 2x operations for published+draft documents

### Approach B: Direct Version Table Updates

**Implementation:**

```typescript
// Query for latest draft version
const { docs } = await payload.db.findVersions({
  collection: collectionConfig.slug,
  where: {
    and: [{ parent: { equals: affectedDoc.id } }, { latest: { equals: true } }],
  },
  limit: 1,
})

if (docs[0]) {
  // Update version record directly via database adapter
  await payload.db.updateVersion({
    collection: collectionConfig.slug,
    id: docs[0].id, // Version record ID
    versionData: {
      ...docs[0],
      version: {
        ...docs[0].version,
        ...updateData, // Merge in hierarchy fields
      },
    },
    req,
  })
}

// Still update main collection
await payload.db.updateOne({
  id: affectedDoc.id,
  collection: collectionConfig.slug,
  data: updateData,
  locale,
  req,
})
```

**Pros:**

- More efficient: Only 1 version record updated (not created)
- No additional version history entries created
- Fewer operations overall
- No duplicate hook executions

**Cons:**

- Uses lower-level database adapter API (`db.updateVersion`)
  - Not documented as public API
  - Implementation details may change
- Bypasses Payload's version system
  - `saveVersion` function not called
  - May skip important version-related logic
  - Doesn't update `latest` flag properly
  - Doesn't handle autosave versions correctly
- No hooks fire for the version update
  - Could break plugins/customizations expecting hooks
- More complex implementation
  - Need to understand version table structure
  - Need to query, merge, and update manually
- Might not work consistently across all database adapters

**Risk Assessment:**

- High risk: Relies on internal implementation details
- Hook compatibility: Bypasses hooks entirely
- Maintainability: Could break with Payload updates

### Approach C: Hook into Version Creation

**Implementation:**

```typescript
// In saveVersion.ts, add logic to detect hierarchy field updates
// When creating a version, also update any newer draft versions

export async function saveVersion(
  {
    // ... existing params
  },
) {
  // Existing version creation logic...

  // NEW: After creating version, check if this is a hierarchy metadata update
  const isHierarchyUpdate =
    '_h_parentTree' in docWithLocales ||
    '_h_depth' in docWithLocales ||
    '_h_slugPath' in docWithLocales ||
    '_h_titlePath' in docWithLocales

  if (isHierarchyUpdate && !draft && collection) {
    // Published update - also update any newer draft versions
    const { docs: draftVersions } = await payload.db.findVersions({
      collection: collection.slug,
      where: {
        and: [
          { parent: { equals: id } },
          { 'version._status': { equals: 'draft' } },
          { latest: { equals: true } },
        ],
      },
      limit: 1,
    })

    if (draftVersions[0]) {
      // Update draft version with same hierarchy fields
      await payload.db.updateVersion({
        collection: collection.slug,
        id: draftVersions[0].id,
        versionData: {
          ...draftVersions[0],
          version: {
            ...draftVersions[0].version,
            _h_parentTree: docWithLocales._h_parentTree,
            _h_depth: docWithLocales._h_depth,
            _h_slugPath: docWithLocales._h_slugPath,
            _h_titlePath: docWithLocales._h_titlePath,
          },
        },
      })
    }
  }
}
```

**Pros:**

- Automatic: No changes needed in hierarchy code
- Centralized: All version updates go through one place
- Efficient: Only updates draft versions when needed
- Works for any hierarchy update, not just descendant updates

**Cons:**

- Modifies core Payload version system
  - Requires changes to `packages/payload/src/versions/saveVersion.ts`
  - Could affect other features using versions
  - Might conflict with future Payload changes
- Couples hierarchy feature to version system
  - Hierarchy-specific logic in general-purpose version code
  - Makes version system less generic
- Still uses low-level `db.updateVersion` API
  - Same risks as Approach B regarding internals
- May not handle all edge cases
  - What if autosave is enabled?
  - What if there are multiple draft versions?
  - What about scheduled publish?

**Risk Assessment:**

- Medium-high risk: Modifies core system with feature-specific logic
- Maintainability: Creates coupling between features
- Complexity: Adds conditional logic to critical path

### Approach D: Custom Version Update Operation

**Implementation:**

```typescript
// Create new Payload operation: payload.updateVersionMetadata()
// Located in packages/payload/src/versions/operations/updateMetadata.ts

type UpdateVersionMetadataArgs = {
  id: number | string
  collection: CollectionSlug
  data: Partial<TypeWithID>
  updateAllVersions?: boolean // Update all versions, not just latest draft
  req: PayloadRequest
}

export async function updateVersionMetadata({
  id,
  collection,
  data,
  updateAllVersions = false,
  req,
}: UpdateVersionMetadataArgs) {
  const collectionConfig = req.payload.collections[collection].config

  // Build query for versions to update
  const whereQuery = {
    and: [
      { parent: { equals: id } },
      updateAllVersions
        ? {} // All versions
        : { latest: { equals: true } }, // Just latest
    ],
  }

  const { docs: versions } = await req.payload.db.findVersions({
    collection,
    where: whereQuery,
    pagination: false,
  })

  // Update each version
  for (const version of versions) {
    await req.payload.db.updateVersion({
      collection,
      id: version.id,
      versionData: {
        ...version,
        version: {
          ...version.version,
          ...data, // Merge in metadata fields
        },
      },
      req,
    })
  }
}

// In updateDescendants.ts:
if (affectedDoc._status === 'published' && hasDraftsEnabled(collection)) {
  // Update published version
  await req.payload.update({
    id: affectedDoc.id,
    collection: collection.slug,
    data: updateData,
    draft: false,
  })

  // Update all draft versions with metadata
  await req.payload.updateVersionMetadata({
    id: affectedDoc.id,
    collection: collection.slug,
    data: updateData,
    updateAllVersions: false, // Just latest draft
    req,
  })
}
```

**Pros:**

- Clean API: New operation specifically for metadata updates
- Doesn't pollute version history with duplicate entries
- Reusable: Other features could use this operation
- Respects version system: Goes through proper channels
- Flexible: Could update all versions or just latest

**Cons:**

- **Payload doesn't have this operation**: Would need to be implemented
  - Significant development effort
  - Needs to be added to Payload core, not just hierarchy feature
  - Would require PR to Payload repository
- Still uses `db.updateVersion` internally
  - Same concerns about low-level API
- No hooks fire for version metadata updates
  - Could be intentional (it's just metadata)
  - But might surprise users expecting hooks
- Unclear if Payload team would accept this feature
  - Might not align with their vision for version API
  - Could be rejected as too niche

**Risk Assessment:**

- Low risk IF implemented: Clean abstraction
- High risk in practice: Requires Payload core changes
- Timeline: Much longer than other approaches

## Recommendation

**Best approach: Approach A (Dual Updates via payload.update())**

**Rationale:**

1. **Simplicity & Safety:**

   - Uses only public, documented APIs
   - No risk of breaking with Payload updates
   - Easiest to understand and maintain

2. **Correctness:**

   - Respects all hooks and validation
   - Works consistently across all database adapters
   - Version history accurately reflects what happened

3. **Acceptable Trade-offs:**

   - Yes, it creates 2 version entries instead of 1
   - But these are legitimate changes to the document (hierarchy metadata changed)
   - Version history should show when hierarchy metadata was updated
   - The performance impact (2x updates) is acceptable:
     - Only affects documents with BOTH published + draft versions
     - Most documents are either published-only or draft-only
     - Hierarchy updates are relatively infrequent compared to normal edits

4. **Implementation Risk:**

   - Very low risk: uses stable APIs
   - Easy to test and verify
   - Easy to roll back if issues arise

5. **Future-proof:**
   - If Payload later adds `updateVersionMetadata()` operation (Approach D), we can switch to it
   - Until then, this approach works reliably

**Implementation Steps:**

1. In `updateDescendants.ts`, detect published documents with drafts via `_status` field
2. For these documents, call `payload.update()` twice:
   - Once with `draft: false` (updates main collection + creates version)
   - Once with `draft: true` (updates/creates draft version)
3. For all other documents, use existing single-update logic
4. Add test coverage for all three cases:
   - Published-only documents
   - Draft-only documents
   - Published + draft documents

**Alternative if performance becomes an issue:**

If the 2x update overhead proves problematic in production:

- Consider Approach B (direct version table updates) as an optimization
- But only after proving Approach A works correctly
- And with extensive testing to ensure version system integrity
