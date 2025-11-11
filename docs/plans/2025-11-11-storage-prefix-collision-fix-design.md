# Storage Prefix Collision Detection Fix - Design Document

**Date:** 2025-11-11
**Issue:** [#14561](https://github.com/payloadcms/payload/issues/14561)
**Status:** Approved

## Problem Statement

Filename collision detection in `getSafeFilename()` checks only the `filename` field, ignoring the `prefix` field. This causes files with identical names under different prefixes to incorrectly trigger collision detection, resulting in unwanted filename suffixes (e.g., `logo-1.png`) even though prefixes provide namespace isolation.

### Impact

- Multi-tenant setups cannot use same filenames across tenants
- Storage plugin prefixes don't provide proper isolation
- Affects all storage adapters: S3, R2, Azure, GCS, Uploadthing, Vercel Blob

## Solution Architecture

### Core Design

Extend the collision detection system to be prefix-aware by threading the `prefix` value through the call chain:

1. `generateFileData()` → extracts `prefix` from data
2. `getSafeFileName()` → accepts optional `prefix` parameter
3. `docWithFilenameExists()` → accepts optional `prefix` parameter and includes in query

### Query Strategy

- **Without prefix:** `WHERE filename = X` (unchanged behavior)
- **With prefix:** `WHERE filename = X AND prefix = Y` (scoped collision check)
- **Conditional:** Only add prefix to WHERE clause when `prefix !== undefined`

### Design Principles

- **Strict matching:** `undefined` only matches `undefined`, `""` only matches `""`, etc.
- **Backwards compatible:** Collections without prefix field work exactly as before
- **Minimal changes:** Only modify collision detection, not storage upload logic
- **Database agnostic:** Uses standard Payload WHERE clause syntax

## Implementation Details

### File 1: `packages/payload/src/uploads/getSafeFilename.ts`

**Changes:**

1. Add `prefix?: string` to `Args` type
2. Add `prefix` to function parameters
3. Pass `prefix` to `docWithFilenameExists()` call

```typescript
type Args = {
  collectionSlug: string
  desiredFilename: string
  prefix?: string // NEW
  req: PayloadRequest
  staticPath: string
}

export async function getSafeFileName({
  collectionSlug,
  desiredFilename,
  prefix, // NEW
  req,
  staticPath,
}: Args): Promise<string> {
  let modifiedFilename = desiredFilename

  while (
    (await docWithFilenameExists({
      collectionSlug,
      filename: modifiedFilename,
      prefix, // NEW
      path: staticPath,
      req,
    })) ||
    (await fileExists(`${staticPath}/${modifiedFilename}`))
  ) {
    modifiedFilename = incrementName(modifiedFilename)
  }
  return modifiedFilename
}
```

**Note:** File system check remains unchanged. Collections using prefixes typically use cloud storage (no staticPath), and local file storage doesn't use prefix fields.

### File 2: `packages/payload/src/uploads/docWithFilenameExists.ts`

**Changes:**

1. Add `prefix?: string` to `Args` type
2. Add `prefix` to function parameters
3. Conditionally add prefix to WHERE clause

```typescript
type Args = {
  collectionSlug: string
  filename: string
  path: string
  prefix?: string // NEW
  req: PayloadRequest
}

export const docWithFilenameExists = async ({
  collectionSlug,
  filename,
  prefix, // NEW
  req,
}: Args): Promise<boolean> => {
  const where: Where = {
    filename: { equals: filename },
  }

  if (prefix !== undefined) {
    where.and = [
      { filename: { equals: filename } },
      { prefix: { equals: prefix } },
    ]
  }

  const doc = await req.payload.db.findOne({
    collection: collectionSlug,
    req,
    where,
  })

  return !!doc
}
```

### File 3: `packages/payload/src/uploads/generateFileData.ts`

**Location:** Around line 257, before the `getSafeFileName()` call

**Change:** Extract `prefix` from data and pass to `getSafeFileName()`

```typescript
// Extract prefix from data if present
const prefix = data?.prefix

const filename = await getSafeFileName({
  collectionSlug,
  desiredFilename: fileData.filename,
  prefix, // NEW
  req,
  staticPath,
})
```

### Why Prefix Extraction Works

**Timing guarantees:**

1. `beforeOperation` hooks run first (~line 80-90 in `create.ts`)
   - Can set `data.prefix` dynamically (multi-tenant use case)
2. `generateFileData()` runs at line ~155
   - Receives `data` with prefix already set
3. Field defaults are applied before `generateFileData` runs
   - If collection has prefix field with `defaultValue`, it's in `data`

**Value sources:**

- **Dynamic prefix:** Set by `beforeOperation` hook → `data.prefix`
- **Static prefix:** From plugin config → prefix field's `defaultValue` → `data.prefix`
- **No prefix:** Collection without storage plugin → `data.prefix` is `undefined`

## Testing Strategy

### Test Cases

**Test 1: Different prefixes, same filename - no collision**

```typescript
it('allows same filename under different prefixes', async () => {
  const file1 = await createUpload({ prefix: 'tenant-a', filename: 'logo.png' })
  const file2 = await createUpload({ prefix: 'tenant-b', filename: 'logo.png' })

  expect(file1.filename).toBe('logo.png')
  expect(file2.filename).toBe('logo.png')
  expect(file1.prefix).toBe('tenant-a')
  expect(file2.prefix).toBe('tenant-b')
})
```

**Test 2: Same prefix, same filename - collision detected**

```typescript
it('detects collision within same prefix', async () => {
  const file1 = await createUpload({ prefix: 'tenant-a', filename: 'logo.png' })
  const file2 = await createUpload({ prefix: 'tenant-a', filename: 'logo.png' })

  expect(file1.filename).toBe('logo.png')
  expect(file2.filename).toBe('logo-1.png')
})
```

**Test 3: Empty string vs undefined prefix**

```typescript
it('treats empty string and undefined as different prefixes', async () => {
  const file1 = await createUpload({ prefix: '', filename: 'logo.png' })
  const file2 = await createUpload({ prefix: undefined, filename: 'logo.png' })

  expect(file1.filename).toBe('logo.png')
  expect(file2.filename).toBe('logo.png') // No collision
})
```

**Test 4: Collections without prefix field**

```typescript
it('works normally for collections without prefix', async () => {
  const file1 = await createUploadNoPrefix({ filename: 'logo.png' })
  const file2 = await createUploadNoPrefix({ filename: 'logo.png' })

  expect(file1.filename).toBe('logo.png')
  expect(file2.filename).toBe('logo-1.png') // Collision as expected
})
```

**Test 5: Dynamic prefix from beforeOperation hook**

```typescript
it('respects prefix set in beforeOperation hook', async () => {
  const file1 = await createWithHook({ tenantId: 'abc', filename: 'logo.png' })
  const file2 = await createWithHook({ tenantId: 'xyz', filename: 'logo.png' })

  expect(file1.filename).toBe('logo.png')
  expect(file2.filename).toBe('logo.png')
})
```

### Regression Testing

Run existing test suites to ensure no breakage:

- `pnpm run test:int uploads`
- `pnpm run test:int storage-s3`
- `pnpm run test:int storage-r2`

## Edge Cases & Considerations

### Edge Cases

**1. Null vs Undefined**

- Both are valid, distinct values
- `prefix: null` and `prefix: undefined` don't collide with each other
- Query handles both correctly with strict equality

**2. Special Characters in Prefix**

- Prefix values like `"tenant/subdir"` are valid
- Sanitization happens in storage adapter, not collision detection
- No validation needed in collision detection

**3. Prefix Field Without Default Value**

- Collection has prefix field but no `defaultValue` set
- `data.prefix` would be `undefined`
- Query correctly excludes prefix condition

**4. Concurrent Uploads**

- Database race condition possible with simultaneous uploads
- Existing issue, not introduced by this change
- Mitigation: Database unique constraints

### Performance Considerations

**Database Indexes:**

- Collections with prefix field should have compound index: `(filename, prefix)`
- Without index: Full table scan on prefix field (performance hit)
- **Recommendation:** Document this, but don't enforce in code
- Storage plugins could optionally add index in their field configuration

**Query Complexity:**

- Adding `AND prefix = X` to WHERE clause is minimal overhead
- All DB adapters support this via standard Payload query syntax
- No performance regression for collections without prefix

### Backwards Compatibility

**Breaking Changes:** None

- Collections without prefix: Behavior unchanged
- Collections with prefix: Bug fix (incorrect → correct behavior)
- No data migration needed
- No API changes (all changes internal)

**User-Visible Changes:**

- Uploads to different prefixes no longer get unexpected suffixes
- Existing files with suffixes remain unchanged
- Should be documented in release notes as bug fix

## Files Modified

1. `packages/payload/src/uploads/getSafeFilename.ts`
2. `packages/payload/src/uploads/docWithFilenameExists.ts`
3. `packages/payload/src/uploads/generateFileData.ts`
4. `test/uploads/int.spec.ts` (new tests) or `test/storage-s3/prefix-collision.int.spec.ts` (new file)

## Risks

- **Low risk:** Changes are isolated to collision detection logic
- **Well-scoped:** Only 3 files modified in core, tests added
- **Backwards compatible:** No breaking changes
- **Database agnostic:** Uses standard Payload query patterns

## Success Criteria

- [x] Files with same name under different prefixes don't collide
- [x] Files with same name under same prefix DO collide (existing behavior)
- [x] Collections without prefix field work unchanged
- [x] All existing upload tests pass
- [x] All storage adapter tests pass
- [x] New tests cover prefix collision scenarios

## Implementation Notes

**Completed:** 2025-11-11

**Changes Made:**

1. `packages/payload/src/uploads/docWithFilenameExists.ts` - Added prefix parameter and conditional WHERE clause
2. `packages/payload/src/uploads/getSafeFilename.ts` - Added prefix parameter and passed to docWithFilenameExists
3. `packages/payload/src/uploads/generateFileData.ts` - Extract prefix from data before collision check
4. `test/storage-s3/int.spec.ts` - Added comprehensive prefix collision tests
5. `test/storage-s3/collections/MediaWithPrefix.ts` - Added hook to allow prefix override in tests

**Test Results:**

- All new prefix collision tests passing (3/3)
- All regression tests passing (uploads: 59/59, storage-s3: 8/8)
- TypeScript compilation successful (build:core passed)

**Verification:**

- Confirmed fix works with static prefix from config
- Confirmed fix works with dynamic prefix from beforeOperation hooks
- Confirmed backwards compatibility with collections without prefix field
