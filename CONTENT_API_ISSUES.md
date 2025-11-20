# Content API & DB Adapter Issues

## Overview

This document tracks issues found while testing the `@payloadcms/db-content-api` adapter with the Content API server.

## ✅ CRITICAL BUG FIXED (Nov 19, 2025)

**Problem:** `DocumentFinder` and `DocumentCounter` were returning documents from the WRONG collections, breaking test isolation and causing validation errors.

**Root Cause:** Drizzle ORM's `.where()` overwrites previous WHERE clauses instead of combining with AND.

**Fix Applied:** Modified `buildAndAddWhereQuery()` to accept `baseConditions` parameter and combine all conditions with `and()`.

**Files Fixed:**

- `build_where_query.ts` - Added `baseConditions` parameter
- `document_finder.ts`, `document_counter.ts`, `document_updater.ts`, `document_deleter.ts`
- `document_version_finder.ts`, `document_version_counter.ts`, `document_version_updater.ts`, `document_version_deleter.ts`

**Test Result:** `_community` tests now pass (2/2 SUCCESS)

**New Issue Found:** Login has error `Cannot destructure property 'lockUntil' of '(intermediate value)' as it is null.` - likely the `update` operation not returning document correctly. See new issue tracking below.

---

## Development Guidelines

**IMPORTANT:** To minimize changes to the Content API codebase:

1. **Prefer adapter-side fixes**: If something can be fixed with a "hack" or workaround in the `db-content-api` adapter, do it there instead of modifying Content API
2. **Add TODO comments**: When implementing adapter-side workarounds, add clear comments explaining:
   - What the workaround does
   - Why it exists (what Content API should be fixed to do)
   - That it should be removed once Content API is fixed
3. **Document in this file**: Track all adapter-side workarounds here so we know what Content API changes are needed

**Example:** The `Where` clause format converter is a hack in the adapter. Content API should accept Payload's native `Where` format instead of requiring conversion.

---

## 🔧 Adapter-Side Workarounds

These are temporary fixes implemented in the `db-content-api` adapter that should eventually be resolved by fixing the Content API.

### Workaround #1: Where Clause Format Converter

**File:** `db-content-api/src/index.ts` - `convertPayloadWhereToContentAPI()`

**Problem:** Content API expects a different `Where` format than Payload uses.

**Payload's format:**

```typescript
{ email: { equals: 'test@example.com' }, status: { in: ['active', 'pending'] } }
```

**Content API expects:**

```typescript
{
  and: [
    { path: 'email', operator: 'equals', value: 'test@example.com' },
    { path: 'status', operator: 'in', value: ['active', 'pending'] },
  ]
}
```

**Workaround:** The adapter has a `convertPayloadWhereToContentAPI()` function that transforms Payload's native format to Content API's expected format.

**TODO:** Content API should accept Payload's `Where` format directly. This would:

- Eliminate conversion overhead
- Reduce code complexity
- Ensure 100% compatibility with Payload's query language
- Remove the need for adapter-side translation

---

## ✅ Fixed Issues

### #1: `findOne` Returns `undefined` Instead of `null`

**Status:** ✅ Fixed
**File:** `db-content-api/src/index.ts` (line 487-492)
**Test:** `kv` suite - `databaseKVAdapter`

**Problem:**

```typescript
const findOne: FindOne = async function findOne(this: ContentAPIAdapter, { collection, where }) {
  const {
    docs: [first],
  } = await this.find({ collection, limit: 1, pagination: false, where })
  return first as any // ← Returns undefined when no docs found
}
```

When no documents are found, `first` is `undefined`, but calling code expects `null`:

```typescript
// In DatabaseKVAdapter.ts
const doc = await this.payload.db.findOne(...)
if (doc === null) {  // ← Checks for null
  return null
}
return doc.data  // ← Crashes: Cannot read properties of undefined (reading 'data')
```

**Fix:**

```typescript
return (first ?? null) as any
```

**Build Status:** ✅ Built and installed

---

### #2: REST API Permission Error - Update Endpoint Not Implemented

**Status:** ✅ Fixed
**File:** `content-api/src/routes/documents.ts` and `content-api/src/services/documents/document_updater.ts`
**Test:** `_community` suite - REST API test

**Problem:**

REST API requests failed with "You are not allowed to perform this action" while local API worked fine:

```javascript
// Local API: ✅ Works
await payload.create({ collection: 'posts', data: { title: '...' } })

// REST API: ❌ Permission denied
await restClient.POST('/api/posts', { json: { title: '...' } })
```

**Root Cause:**

The `/api/v0/documents:update` endpoint was **never implemented** - it only had a TODO:

```typescript
app.openapi(updateDocumentsRoute, (ctx) => {
  // TODO: Implement document update logic
  return ctx.json({ result: { count: 0 } })
})
```

When users logged in, Payload tried to save their session by calling `adapter.updateOne()`, which hit this unimplemented endpoint. Sessions were never persisted, so JWT validation failed on subsequent requests.

**Fix:**

1. Created `DocumentUpdater` service to handle document updates
2. Implemented the update endpoint to:
   - Map collection keys to IDs using `CollectionKeyMapper`
   - Update documents in database using `DocumentUpdater`
   - Return updated documents or count

**Test Results:**

```
✅ PASS _Community Tests > local API example (9ms)
✅ PASS _Community Tests > rest API example (15ms)
```

---

## 🔴 Active Issues

### #3: Where Clause Format Mismatch After Merge

**Status:** ✅ Fixed
**File:** `db-content-api/src/index.ts` - `findMany`, `updateOne`, `deleteMany`, etc.
**Test:** All tests fail during `onInit`

**Problem:**

After merging GitHub changes, Content API now expects a completely different `Where` format:

**Content API expects:**

```typescript
{
  and: [{ path: 'email', operator: 'equals', value: 'dev@payloadcms.com' }]
}
```

**Payload sends:**

```typescript
{
  email: {
    equals: 'dev@payloadcms.com'
  }
}
```

**Error:**

```
Content API HTTP 400: {"success":false,"error":{"name":"ZodError",...}}
```

All tests fail at initialization because the adapter sends Payload's `Where` format, but Content API rejects it.

**Fix Implemented:**

⚠️ **Temporary adapter-side workaround** - See "Workaround #1" section above for details.

Created `convertPayloadWhereToContentAPI()` function in `db-content-api/src/index.ts` to transform:

- Payload format: `{ fieldName: { operator: value } }`
- To Content API format: `{ and: [{ path: fieldName, operator, value }] }`

Applied converter to all operations: `findMany`, `findVersions`, `updateOne`, `updateMany`, `updateVersion`, `deleteOne`, `deleteMany`, `deleteVersions`, `count`, `countVersions`.

**Long-term fix:** Content API should be updated to accept Payload's native `Where` format directly.

---

### #4: User Creation Validation Error in onInit

**Status:** ✅ Resolved (with workaround)
**Test:** `_community` suite - onInit
**File:** `packages/payload/src/auth/strategies/local/register.ts:68`

**Problem:**

Tests fail during `onInit` with validation error:

```
ValidationError: The following field is invalid: email
    at registerLocalStrategy (/packages/payload/src/auth/strategies/local/register.ts:68:11)
    at createOperation (/packages/payload/src/collections/operations/create.ts:266:13)
    at Object.onInit (/test/_community/config.ts:28:5)
```

**Observations:**

- ✅ Database clear endpoint is being called successfully
- ✅ Response confirms: "Cleared content-api database..."
- ❌ User creation fails with validation error
- ❌ No `findOne` queries are logged (error happens before any DB lookup)

**Root Cause - UPDATED:**

The error IS about duplicate users. Through detailed debugging:

1. ✅ `/dev/clear-db` successfully clears the database
2. ✅ Immediately after clear, NO users exist in Content API (verified with curl)
3. ❌ During `getPayload()` initialization (BEFORE `onInit`), a user gets created
4. ❌ When `onInit` tries to create the same user, `registerLocalStrategy` finds it already exists (line 58-65) and throws ValidationError (line 68)

**Debug Evidence:**

```
[initPayloadInt] Clear-db response: {"success":true,...}
starting payload  ← getPayload() begins
[findMany] Looking up users...
[findMany] Found 1 users  ← User already exists!
[findMany] First user: "dev@payloadcms.com"
ValidationError: The following field is invalid: email  ← Because user found
```

**The REAL Problem - Shared Content System:**

```javascript
// In test/jest.setup.js - ALL test suites use the SAME content system!
process.env.CONTENT_SYSTEM_ID = '00000000-0000-4000-8000-000000000001'
```

1. All test suites share the same `CONTENT_SYSTEM_ID`
2. User from previous test run or parallel test exists in the shared content system
3. When `onInit` tries to create the user, it already exists

**How Other Adapters Handle This:**

Postgres adapter (in `connect.ts`):

```typescript
if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
  await this.dropDatabase({ adapter: this }) // Drops ALL tables
}
```

Content API adapter (in `index.ts`):

```typescript
if (process.env.PAYLOAD_DROP_DATABASE === 'true') {
  // Calls /dev/clear-db BUT happens during adapter init
  // Data from previous test or parallel test may still be there
}
```

**ACTUAL FINDINGS (2025-11-19):**

Test output shows:

```
[initPayloadInt] Cleared content system: 7ab28301-508c-4a7e-a6c5-5061ec938253
[adapter init()] Starting init with contentSystemId: 7ab28301-508c-4a7e-a6c5-5061ec938253
JWT token acquired successfully
[adapter init()] About to call clear-db for: 7ab28301-508c-4a7e-a6c5-5061ec938253
---- DROPPING CONTENT API SYSTEM ----
---- DROPPED CONTENT API SYSTEM ----
Created collection: posts, media, users, ...
ERROR: ValidationError: A user with the given email is already registered.
```

**So:**

1. ✅ `init()` IS being called
2. ✅ `/dev/clear-db` IS being called TWICE
3. ❌ But user STILL exists when `onInit` tries to create it

**CRITICAL BUG FOUND IN CONTENT API:**

The `DocumentFinder` is **NOT filtering documents by `collectionId`** correctly!

**Evidence:**

1. **Adapter request:**

   - `contentSystemId: "7ab28301-508c-4a7e-a6c5-5061ec938253"`
   - `collectionKey: "users"`

2. **Content API logs:**

   ```
   [CollectionKeyMapper] Mapped to collectionId=a4db363e-3a67-48ad-b746-0e0f706a8935
   [DocumentFinder] Looking for documents with collectionId: a4db363e-3a67-48ad-b746-0e0f706a8935
   ```

3. **PostgreSQL confirms:**

   - Collection `a4db363e-...` belongs to `contentSystemId: 7ab28301-...` ✅
   - Collection `a4db363e-...` has **0 documents** ✅
   - Content API SHOULD return empty array ✅

4. **BUT adapter receives document with:**
   - `collectionId: "96282738-566a-4224-b489-0ce23dadf920"` ❌ (DIFFERENT collection)
   - `contentSystemId: "451236af-ec65-58f0-a637-c4ebf74c20f3"` ❌ (DIFFERENT content system)

**ROOT CAUSE FOUND:**

In Drizzle ORM, calling `.where()` multiple times **OVERWRITES** the previous WHERE clause instead of combining with AND.

**Affected files:**

- `/content-api/src/services/documents/document_finder.ts` (lines 52-57)
- `/content-api/src/services/documents/document_counter.ts` (lines 31-38)
- Likely ALL other Finder/Counter services

**Current broken code:**

```typescript
const baseQuery = db
  .where(eq(documentsTable.collectionId, collectionId))  // ← First WHERE
  .$dynamic()

// Later...
buildAndAddWhereQuery(baseQuery, where, ...)
// ↑ Calls .where() again, OVERWRITES the collectionId filter!
```

**The Fix - Option 1 (Recommended):**

Modify `buildAndAddWhereQuery` to accept base conditions:

```typescript
// In build_where_query.ts:
export function buildAndAddWhereQuery<T extends PgSelect>(
  db: T,
  whereClause: WhereClause | undefined,
  columns: Columns,
  baseConditions: SQL[] = [],  // ← Add this parameter
): Result<T, Errors> {
  const conditions = [...baseConditions]

  if (whereClause) {
    const whereQuery = buildWhereQuery(whereClause, columns)
    if (whereQuery.isErr()) return err(whereQuery.error)
    if (whereQuery.value) conditions.push(whereQuery.value)
  }

  if (conditions.length === 0) return ok(db)
  return ok(db.where(and(...conditions)))  // ← Combine all with AND
}

// In DocumentFinder:
const baseQuery = db.select({...}).from(documentsTable).$dynamic()
const baseConditions = [eq(documentsTable.collectionId, collectionId)]
buildAndAddWhereQuery(baseQuery, where, columns, baseConditions)
```

**The Fix - Option 2:**

Manually combine in each service (more code duplication but simpler)

---

### #5: KV Adapter - Content System Disappears

**Status:** 🔴 Open
**Test:** `kv` suite - `databaseKVAdapter`

**Problem:**

```
Content API HTTP 404: {"message":"Content system with ID 00000000-0000-4000-8000-000000000001 not found."}
```

When KV adapter tries to use database storage, the content system is not found.

**Probable Cause:**

- The `/dev/clear-db` endpoint completely removes the content system, including during test execution.
- Content API doesn't support KV yet.

**Current `/dev/clear-db` behavior:**

```typescript
await tx.delete(contentSystemsTable).where(eq(contentSystemsTable.id, contentSystemId))
// Then recreates it
await tx.insert(contentSystemsTable).values({ id: contentSystemId, ... })
```

**Potential Solutions:**

1. Don't delete the content system, only its data
2. Ensure recreation happens immediately in same transaction
3. Add retry logic for "content system not found" errors

---

## ⚠️ Known Issues (Deferred)

### #4: Document Versions - Race Condition

**Status:** ⚠️ Being fixed by other engineer
**Test:** Most suites with `versions: true`

**Problem:**
When Payload creates a document with versions enabled:

1. `adapter.create()` creates document
2. `adapter.createVersion()` immediately tries to create version
3. Fails with: `Document with key {uuid} not found`

**Root Cause:**
The Content API's `createVersion` endpoint needs to lookup the document to copy `contentSystemId`:

```typescript
// DocumentVersionCreator needs contentSystemId
const contentSystemId = sql`(SELECT content_system_id FROM documents WHERE id = ${documentId})`
```

If the document was just created, the SELECT may not see it yet (transaction isolation, timing).

**Proposed Solutions:**

1. **Pass `contentSystemId` in request** (recommended)

   - Adapter already has it, send it directly
   - No need to lookup document

2. **Change FK to reference `documentKey` instead of internal `id`**

   - Allows orphan versions
   - Requires composite PK: `(contentSystemId, collectionId, documentKey, versionId)`

3. **Auto-create document in `createVersion` endpoint** (current workaround)
   - If document not found, create it with version data
   - Not ideal but works immediately

**Status:** Engineer implementing solution #2

---

### #5: Redis KV Adapter Connection Failure

**Status:** ⚠️ Environment issue
**Test:** `kv` suite - `redisKVAdapter`

**Problem:**

```
MaxRetriesPerRequestError: Reached the max retries per request limit (which is 20)
```

**Cause:** Redis server not running or not accessible.

**Not a Content API issue** - this is a test environment configuration problem.

---

## Test Execution Summary

### Passing Tests

- ✅ `kv` suite - `inMemoryKVAdapter`
- ✅ `_community` suite - Local API test

### Failing Tests

- ❌ `_community` suite - REST API test (Issue #2)
- ❌ `kv` suite - `databaseKVAdapter` (Issue #3)
- ❌ `kv` suite - `redisKVAdapter` (Issue #5 - environment)
- ❌ Most other suites - fail during init due to version creation (Issue #4)

### Blocked Tests

Most test suites cannot complete initialization because they have collections with `versions: true`, which triggers Issue #4 during the seed/onInit phase.

---

## Next Actions

**High Priority:**

1. Fix Issue #2 (REST API permissions) - blocking basic functionality tests
2. Wait for Issue #4 fix (versions) - blocking most test suites

**Medium Priority:** 3. Fix Issue #3 (KV content system disappearing) - specific to KV tests

**Low Priority:** 4. Fix Issue #5 (Redis) - environment setup, not code issue

---

## Notes

- The `findOne` fix (#1) is confirmed working
- Issue #4 (versions) is the main blocker for comprehensive testing
- Once versions are fixed, we can run full test suites to find more issues
- The Content API server needs restart after each code change (uses ibazel but sometimes doesn't auto-reload)
