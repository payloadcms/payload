# Versions Access Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Secure collection version reads by inheriting and translating collection `read` access when `readVersions` is not explicitly configured.

**Architecture:** Resolve `read` once in collection config defaults, preserve an explicit `readVersions`, and otherwise install an async wrapper that passes booleans through while translating `Where` results with `appendVersionToQueryKey`. Existing version operations and permission calculation continue consuming sanitized `readVersions` without call-site changes.

**Tech Stack:** TypeScript, Payload collection configuration sanitization, Vitest unit tests, Payload integration tests, MDX documentation.

## Global Constraints

- Preserve explicitly configured `access.readVersions` functions without wrapping or transforming them.
- Reuse the existing `appendVersionToQueryKey` helper for inherited queries.
- Pass inherited boolean access results through unchanged.
- Keep global version access behavior unchanged.
- Follow test-first red-green-refactor and Payload's descriptive `should ...` test naming convention.

---

### Task 1: Add the secure `readVersions` fallback

**Files:**

- Modify: `packages/payload/src/collections/config/defaults.spec.ts`
- Modify: `test/access-control/getConfig.ts`
- Modify: `test/access-control/int.spec.ts`
- Modify: `packages/payload/src/collections/config/defaults.ts`

**Interfaces:**

- Consumes: `hasWhereAccessResult(result: boolean | Where): result is Where` and `appendVersionToQueryKey(query: Where): Where`.
- Produces: `SanitizedCollectionConfig['access'].readVersions`, either the explicit function or an async fallback with the standard `Access` signature.

- [ ] **Step 1: Write unit tests that define fallback behavior**

Add tests to `defaults.spec.ts` that call the sanitized access functions with a typed `PayloadRequest` fixture and assert literal results:

```ts
import type { PayloadRequest } from '../../types/index.js'
import type { CollectionConfig } from './types.js'

const req = {} as PayloadRequest

it('should preserve an explicit readVersions access function', () => {
  const readVersions = () => true
  const result = addDefaultsToCollectionConfig({
    slug: 'posts',
    fields: [],
    access: { read: () => false, readVersions },
  })

  expect(result.access?.readVersions).toBe(readVersions)
})

it.each([true, false])(
  'should pass through a %s result from read access to readVersions',
  async (readResult) => {
    const result = addDefaultsToCollectionConfig({
      slug: 'posts',
      fields: [],
      access: { read: async () => readResult },
    })

    await expect(result.access?.readVersions?.({ req })).resolves.toBe(
      readResult,
    )
  },
)

it('should translate inherited read queries to version fields', async () => {
  const result = addDefaultsToCollectionConfig({
    slug: 'posts',
    fields: [],
    access: {
      read: async () => ({
        or: [{ id: { equals: 'post-id' } }, { owner: { equals: 'user-id' } }],
      }),
    },
  })

  await expect(result.access?.readVersions?.({ req })).resolves.toEqual({
    or: [
      { parent: { equals: 'post-id' } },
      { 'version.owner': { equals: 'user-id' } },
    ],
  })
})
```

- [ ] **Step 2: Convert the existing integration fixture into a fallback regression**

Remove the duplicated `readVersions` function from the `fields-and-top-access` collection in `getConfig.ts`, leaving its query-based `read` function and version configuration intact.

Extend the existing version access test to prove the fallback restricts every collection version read operation:

```ts
const resFind = await payload.findVersions({
  collection: 'fields-and-top-access',
  overrideAccess: false,
})
expect(resFind.docs).toHaveLength(1)
expect(resFind.docs[0].parent).toBe(hitID)

const resCount = await payload.countVersions({
  collection: 'fields-and-top-access',
  overrideAccess: false,
})
expect(resCount.totalDocs).toBe(1)

const deniedVersion = await payload.findVersions({
  collection: 'fields-and-top-access',
  limit: 1,
  overrideAccess: true,
  where: { 'version.secret': { equals: 'will-fail-access-read' } },
})

await expect(
  payload.findVersionByID({
    collection: 'fields-and-top-access',
    disableErrors: true,
    id: deniedVersion.docs[0].id,
    overrideAccess: false,
  }),
).resolves.toBeNull()

await payload.delete({ collection: 'fields-and-top-access', where: {} })
```

Delete the test documents at the end of the test so the regression remains self-contained.

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
pnpm exec vitest run --project unit packages/payload/src/collections/config/defaults.spec.ts
pnpm run test:int access-control
```

Expected: the new unit tests fail because `readVersions` is undefined, and the integration regression fails because version reads do not inherit `read`.

- [ ] **Step 4: Implement the minimal centralized fallback**

In `addDefaultsToCollectionConfig`, resolve `read` before assigning `collection.access`, then install the fallback:

```ts
const read = access?.read ?? defaultAccess

collection.access = {
  ...access,
  create: access?.create ?? defaultAccess,
  delete: access?.delete ?? defaultAccess,
  read,
  readVersions:
    access?.readVersions ??
    (async (args) => {
      const result = await read(args)

      return hasWhereAccessResult(result)
        ? appendVersionToQueryKey(result)
        : result
    }),
  unlock: access?.unlock ?? defaultAccess,
  update: access?.update ?? defaultAccess,
} satisfies SanitizedCollectionConfig['access']
```

Use these exact imports:

```ts
import { hasWhereAccessResult } from '../../auth/types.js'
import { appendVersionToQueryKey } from '../../versions/drafts/appendVersionToQueryKey.js'
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run both commands from Step 3. Expected: the unit file and all access-control integration tests pass with no new warnings or failures.

- [ ] **Step 6: Refactor and verify focused coverage remains green**

Review naming, imports, and test cleanup. Keep the wrapper in `defaults.ts`, avoid operation-specific changes, then rerun both focused commands.

- [ ] **Step 7: Commit the secure fallback**

```bash
git add packages/payload/src/collections/config/defaults.ts packages/payload/src/collections/config/defaults.spec.ts test/access-control/getConfig.ts test/access-control/int.spec.ts
git commit -m "fix: inherit read access for collection versions"
```

### Task 2: Document inherited version access

**Files:**

- Modify: `docs/access-control/collections.mdx`

**Interfaces:**

- Consumes: the fallback semantics implemented in Task 1.
- Produces: user-facing guidance distinguishing inherited `read` queries from explicit `readVersions` queries.

- [ ] **Step 1: Update collection access documentation**

Add this paragraph before the explicit `readVersions` example:

```mdx
If `readVersions` is not configured, Payload uses the Collection's `read` Access Control. Boolean
results are preserved, and query constraints are automatically adjusted to target fields within the
stored version document.
```

Change the existing warning to begin with “When you explicitly configure `readVersions`” so it remains clear that custom version queries must target version-row paths directly.

- [ ] **Step 2: Verify documentation formatting**

Run:

```bash
pnpm exec prettier --check docs/access-control/collections.mdx
git diff --check
```

Expected: both commands exit successfully.

- [ ] **Step 3: Commit documentation**

```bash
git add docs/access-control/collections.mdx
git commit -m "docs: explain inherited collection version access"
```

### Task 3: Final verification

**Files:**

- Verify: all files changed by Tasks 1 and 2.

**Interfaces:**

- Consumes: the completed fallback, regressions, and documentation.
- Produces: fresh evidence that the branch is ready for review.

- [ ] **Step 1: Run targeted lint and type checks**

```bash
pnpm exec eslint packages/payload/src/collections/config/defaults.ts packages/payload/src/collections/config/defaults.spec.ts test/access-control/getConfig.ts test/access-control/int.spec.ts
pnpm --filter payload build:types
```

- [ ] **Step 2: Run all focused behavioral tests**

```bash
pnpm exec vitest run --project unit packages/payload/src/collections/config/defaults.spec.ts
pnpm run test:int access-control
```

- [ ] **Step 3: Inspect the final diff**

Run `git diff origin/main...HEAD --check`, inspect `git diff origin/main...HEAD --stat`, and confirm `git status --short --branch` is clean.
