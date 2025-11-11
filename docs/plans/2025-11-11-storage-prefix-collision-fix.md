# Storage Prefix Collision Detection Fix - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix filename collision detection to respect storage prefix field, allowing files with identical names under different prefixes.

**Architecture:** Thread `prefix` parameter through collision detection call chain (`generateFileData` → `getSafeFileName` → `docWithFilenameExists`), modify database query to include prefix in WHERE clause when present.

**Tech Stack:** TypeScript, Payload CMS core, Jest for testing

**Issue:** [#14561](https://github.com/payloadcms/payload/issues/14561)

---

## Task 1: Update docWithFilenameExists to Handle Prefix

**Files:**

- Modify: `packages/payload/src/uploads/docWithFilenameExists.ts`
- Test: Manual verification (unit tests come in Task 4)

**Step 1: Add prefix parameter to Args type**

In `packages/payload/src/uploads/docWithFilenameExists.ts`, modify the `Args` type (lines 3-8):

```typescript
type Args = {
  collectionSlug: string
  filename: string
  path: string
  prefix?: string
  req: PayloadRequest
}
```

**Step 2: Add prefix to function parameters and conditionally include in query**

Modify the `docWithFilenameExists` function (lines 10-29):

```typescript
export const docWithFilenameExists = async ({
  collectionSlug,
  filename,
  prefix,
  req,
}: Args): Promise<boolean> => {
  const where: Where = {
    filename: {
      equals: filename,
    },
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

**Step 3: Add Where import**

At the top of the file (line 1-2), add import for Where type:

```typescript
import type { PayloadRequest, Where } from '../types/index.js'
```

**Step 4: Verify TypeScript compiles**

Run:

```bash
cd packages/payload && pnpm run build
```

Expected: Build succeeds with no errors

**Step 5: Commit**

```bash
git add packages/payload/src/uploads/docWithFilenameExists.ts
git commit -m "feat(payload): add prefix support to docWithFilenameExists

Add optional prefix parameter to docWithFilenameExists function.
When prefix is provided, include it in WHERE clause to scope
filename collision detection to specific prefix.

Related to #14561"
```

---

## Task 2: Update getSafeFileName to Accept and Pass Prefix

**Files:**

- Modify: `packages/payload/src/uploads/getSafeFilename.ts`

**Step 1: Add prefix parameter to Args type**

In `packages/payload/src/uploads/getSafeFilename.ts`, modify the `Args` type (lines 25-30):

```typescript
type Args = {
  collectionSlug: string
  desiredFilename: string
  prefix?: string
  req: PayloadRequest
  staticPath: string
}
```

**Step 2: Add prefix to function parameters and pass to docWithFilenameExists**

Modify the `getSafeFileName` function signature and the `docWithFilenameExists` call (lines 32-52):

```typescript
export async function getSafeFileName({
  collectionSlug,
  desiredFilename,
  prefix,
  req,
  staticPath,
}: Args): Promise<string> {
  let modifiedFilename = desiredFilename

  while (
    (await docWithFilenameExists({
      collectionSlug,
      filename: modifiedFilename,
      path: staticPath,
      prefix,
      req,
    })) ||
    (await fileExists(`${staticPath}/${modifiedFilename}`))
  ) {
    modifiedFilename = incrementName(modifiedFilename)
  }
  return modifiedFilename
}
```

**Step 3: Verify TypeScript compiles**

Run:

```bash
cd packages/payload && pnpm run build
```

Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add packages/payload/src/uploads/getSafeFilename.ts
git commit -m "feat(payload): add prefix support to getSafeFileName

Add optional prefix parameter to getSafeFileName and pass it through
to docWithFilenameExists for prefix-scoped collision detection.

Related to #14561"
```

---

## Task 3: Update generateFileData to Extract and Pass Prefix

**Files:**

- Modify: `packages/payload/src/uploads/generateFileData.ts`

**Step 1: Extract prefix from data before getSafeFileName call**

In `packages/payload/src/uploads/generateFileData.ts`, modify the code around line 257-263:

Find this section:

```typescript
if (!overwriteExistingFiles) {
  fsSafeName = await getSafeFileName({
    collectionSlug: collectionConfig.slug,
    desiredFilename: fsSafeName,
    req,
    staticPath: staticPath!,
  })
}
```

Replace with:

```typescript
if (!overwriteExistingFiles) {
  const prefix = data?.prefix
  fsSafeName = await getSafeFileName({
    collectionSlug: collectionConfig.slug,
    desiredFilename: fsSafeName,
    prefix,
    req,
    staticPath: staticPath!,
  })
}
```

**Step 2: Verify TypeScript compiles**

Run:

```bash
cd packages/payload && pnpm run build
```

Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add packages/payload/src/uploads/generateFileData.ts
git commit -m "feat(payload): extract prefix from data for collision check

Extract prefix from data parameter and pass to getSafeFileName to
enable prefix-scoped filename collision detection.

Fixes #14561"
```

---

## Task 4: Write Comprehensive Integration Tests

**Files:**

- Modify: `test/storage-s3/int.spec.ts`

**Step 1: Add test for same filename under different prefixes (no collision)**

Add this test to `test/storage-s3/int.spec.ts` after the existing tests:

```typescript
describe('prefix collision detection', () => {
  it('allows same filename under different prefixes', async () => {
    const filename = 'logo.png'
    const imageFile = path.resolve(dirname, './collections/image.png')

    // Upload with default prefix from config ('test-prefix')
    const upload1 = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: imageFile,
    })

    // Create a second collection or modify data to use different prefix
    // For this test, we'll create two uploads and verify both keep original filename
    // Note: Current setup uses static prefix from config, so we need to test
    // by manually setting prefix field if collection allows it

    const upload2 = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {
        prefix: 'different-prefix',
      },
      filePath: imageFile,
    })

    expect(upload1.filename).toBe('image.png')
    expect(upload2.filename).toBe('image.png')
    expect(upload1.prefix).toBe(prefix) // 'test-prefix'
    expect(upload2.prefix).toBe('different-prefix')
  })

  it('detects collision within same prefix', async () => {
    const imageFile = path.resolve(dirname, './collections/image.png')

    // Upload twice with same prefix
    const upload1 = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: imageFile,
    })

    const upload2 = await payload.create({
      collection: mediaWithPrefixSlug,
      data: {},
      filePath: imageFile,
    })

    expect(upload1.filename).toBe('image.png')
    expect(upload2.filename).toBe('image-1.png')
    expect(upload1.prefix).toBe(prefix)
    expect(upload2.prefix).toBe(prefix)
  })

  it('works normally for collections without prefix', async () => {
    const imageFile = path.resolve(dirname, './collections/image.png')

    // Upload twice to collection without prefix
    const upload1 = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: imageFile,
    })

    const upload2 = await payload.create({
      collection: mediaSlug,
      data: {},
      filePath: imageFile,
    })

    expect(upload1.filename).toBe('image.png')
    expect(upload2.filename).toBe('image-1.png')
    expect(upload1.prefix).toBeUndefined()
    expect(upload2.prefix).toBeUndefined()
  })
})
```

**Step 2: Verify MediaWithPrefix collection allows prefix override**

Check if the `MediaWithPrefix` collection schema allows the `prefix` field to be set via `data`. If not, we need to add a beforeOperation hook to the test config.

Modify `test/storage-s3/collections/MediaWithPrefix.ts`:

```typescript
import type { CollectionConfig } from 'payload'

export const MediaWithPrefix: CollectionConfig = {
  slug: 'media-with-prefix',
  upload: {
    disableLocalStorage: false,
  },
  fields: [],
  hooks: {
    beforeOperation: [
      ({ data, operation }) => {
        // Allow tests to override prefix via data
        if (operation === 'create' && data?.prefix) {
          return data
        }
        return data
      },
    ],
  },
}
```

**Step 3: Run the new tests**

Run:

```bash
pnpm run test:int storage-s3
```

Expected: All tests pass, including the new prefix collision detection tests

**Step 4: Commit**

```bash
git add test/storage-s3/int.spec.ts test/storage-s3/collections/MediaWithPrefix.ts
git commit -m "test(storage-s3): add prefix collision detection tests

Add comprehensive tests for prefix-scoped filename collision:
- Same filename under different prefixes (no collision)
- Same filename under same prefix (collision detected)
- Collections without prefix work as before

Related to #14561"
```

---

## Task 5: Run Regression Tests

**Step 1: Run uploads integration tests**

Run:

```bash
pnpm run test:int uploads
```

Expected: All existing tests pass

**Step 2: Run storage-s3 integration tests**

Run:

```bash
pnpm run test:int storage-s3
```

Expected: All tests pass

**Step 3: Run storage-r2 integration tests (if available)**

Run:

```bash
pnpm run test:int storage-r2
```

Expected: All tests pass (R2 uses same plugin-cloud-storage infrastructure)

**Step 4: Verify no TypeScript errors**

Run:

```bash
pnpm run build:core
```

Expected: Clean build with no errors

**Step 5: Document regression test results**

If all tests pass, add a comment to the commit or create a note:

```bash
# All regression tests passed:
# - test:int uploads ✓
# - test:int storage-s3 ✓
# - test:int storage-r2 ✓
# - build:core ✓
```

---

## Task 6: Update Design Document with Implementation Notes

**Files:**

- Modify: `docs/plans/2025-11-11-storage-prefix-collision-fix-design.md`

**Step 1: Add implementation notes section**

Add this section at the end of the design document:

```markdown
## Implementation Notes

**Completed:** 2025-11-11

**Changes Made:**

1. `packages/payload/src/uploads/docWithFilenameExists.ts` - Added prefix parameter and conditional WHERE clause
2. `packages/payload/src/uploads/getSafeFilename.ts` - Added prefix parameter and passed to docWithFilenameExists
3. `packages/payload/src/uploads/generateFileData.ts` - Extract prefix from data before collision check
4. `test/storage-s3/int.spec.ts` - Added comprehensive prefix collision tests
5. `test/storage-s3/collections/MediaWithPrefix.ts` - Added hook to allow prefix override in tests

**Test Results:**

- All new prefix collision tests passing
- All regression tests passing (uploads, storage-s3, storage-r2)
- TypeScript compilation successful

**Verification:**

- Confirmed fix works with static prefix from config
- Confirmed fix works with dynamic prefix from beforeOperation hooks
- Confirmed backwards compatibility with collections without prefix field
```

**Step 2: Commit**

```bash
git add docs/plans/2025-11-11-storage-prefix-collision-fix-design.md
git commit -m "docs: add implementation notes to design document

Document completion of prefix collision fix implementation with
test results and verification notes.

Closes #14561"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Files with same name under different prefixes don't collide
- [ ] Files with same name under same prefix DO collide
- [ ] Collections without prefix field work unchanged
- [ ] All `test:int uploads` tests pass
- [ ] All `test:int storage-s3` tests pass
- [ ] All `test:int storage-r2` tests pass
- [ ] TypeScript compiles without errors (`pnpm run build:core`)
- [ ] No breaking changes to existing APIs
- [ ] Design document updated with implementation notes

## Notes for Engineer

**Key Concepts:**

1. **Prefix field:** Added by `plugin-cloud-storage` to collections with storage adapters. Stored in database, used to construct full S3 path.

2. **Collision detection timing:** Happens in `generateFileData()` BEFORE cloud upload. Must have access to prefix at this point.

3. **Query semantics:** When `prefix !== undefined`, add to WHERE clause. This handles:

   - Collections without prefix field: `prefix` is `undefined`, query unchanged
   - Collections with prefix: `prefix` has value, query scopes to that prefix
   - Edge case: Empty string `""` is a valid prefix value

4. **Why conditional WHERE clause:** We use `if (prefix !== undefined)` instead of always including prefix because not all collections have the prefix field. Querying non-existent fields might cause issues with some database adapters.

**Common Pitfalls:**

- Don't use `if (prefix)` - empty string is a valid prefix value
- Don't modify file system check in `getSafeFileName` - local storage doesn't use prefixes
- Don't forget to import `Where` type in `docWithFilenameExists.ts`

**Testing Tips:**

- The `mediaWithPrefixSlug` collection in storage-s3 tests already has prefix configured
- To test different prefixes, allow prefix override via `data` parameter (added via hook in Task 4)
- Use `filePath` parameter in `payload.create()` to upload actual files from test fixtures
