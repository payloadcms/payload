# JSON Relationship Roundtrip Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dangling `hasMany` relationship JSON exports importable, constrain the new preview UI to JSON polymorphic relationships, and bring the added tests into compliance with Payload's conventions.

**Architecture:** Keep `null` placeholders in JSON export output, then normalize them out in the built-in relationship import hook before Payload validation. Select the grouped preview renderer at the `ImportPreview` boundary where both file format and field shape are known; all other relationship and upload values use the prior formatter. Centralize relationship roundtrip resource tracking inside the integration-test describe block.

**Tech Stack:** TypeScript, React, Payload field hooks, Vitest, Playwright, pnpm.

## Global Constraints

- Always use object parameters for function arguments.
- Prefix booleans with `is`, `has`, `can`, or `should`.
- Tests must be self-contained and clean up every created database record and file.
- CSV export and import behavior must remain unchanged.
- JSON exports must preserve unresolved `hasMany` positions as `null`.
- The grouped preview renderer applies only to JSON polymorphic relationship fields.

---

### Task 1: Normalize dangling JSON relationship entries during import

**Files:**
- Modify: `packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts`
- Modify: `packages/plugin-import-export/src/utilities/getImportFieldFunctions.ts`

**Interfaces:**
- Consumes: `getImportFieldFunctions({ fields })` and `FieldBeforeImportHook`.
- Produces: a built-in `hasMany` relationship/upload hook that returns arrays without bare `null` entries.

- [ ] **Step 1: Make the test helper follow the object-parameter convention**

Change the test helper to:

```ts
const callHook = ({
  format = 'csv',
  hooks,
  key,
  value,
}: {
  format?: 'csv' | 'json'
  hooks: ReturnType<typeof getImportFieldFunctions>
  key: string
  value: unknown
}) => {
  const entry = hooks[key]
  if (!entry || entry.type !== 'beforeImport') {
    throw new Error(`Expected beforeImport hook for ${key}`)
  }
  return entry.fn({
    columnName: key,
    data: {},
    format,
    operation: 'create',
    req: mockReq,
    siblingData: {},
    siblingDoc: {},
    value,
  })
}
```

Update existing calls to pass `{ hooks, key, value }`.

- [ ] **Step 2: Add failing monomorphic and polymorphic tests**

Add a `describe('hasMany relationships')` section with these assertions:

```ts
it('should remove null entries from a monomorphic JSON relationship array', () => {
  const fields: FlattenedField[] = [
    { name: 'rels', type: 'relationship', hasMany: true, relationTo: 'posts' } as FlattenedField,
  ]
  const hooks = getImportFieldFunctions({ fields })

  expect(callHook({ format: 'json', hooks, key: 'rels', value: [null, 'p1'] })).toEqual(['p1'])
})

it('should remove null entries from a polymorphic JSON relationship array', () => {
  const fields: FlattenedField[] = [
    {
      name: 'rels',
      type: 'relationship',
      hasMany: true,
      relationTo: ['posts', 'users'],
    } as FlattenedField,
  ]
  const hooks = getImportFieldFunctions({ fields })
  const surviving = { relationTo: 'posts', value: 'p1' }

  expect(callHook({ format: 'json', hooks, key: 'rels', value: [null, surviving] })).toEqual([
    surviving,
  ])
})
```

Also assert non-array values and arrays without `null` are returned unchanged.

- [ ] **Step 3: Run the focused unit test and confirm RED**

Run:

```bash
pnpm exec vitest run --project unit packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts
```

Expected: the monomorphic test retains `null`, and the polymorphic test fails because no built-in hook is registered.

- [ ] **Step 4: Implement the minimal import normalization**

In the relationship/upload branch, register one handler for every `hasMany` field:

```ts
if (field.hasMany === true) {
  registerBeforeImport(({ format, value }) =>
    format === 'json' && Array.isArray(value) ? value.filter((entry) => entry !== null) : value,
  )
  return
}
```

Retain the existing single monomorphic pass-through behavior and leave single polymorphic relationships without a built-in hook.

- [ ] **Step 5: Run the focused unit test and confirm GREEN**

Run the command from Step 3. Expected: all tests in the file pass.

- [ ] **Step 6: Commit Task 1**

```bash
git add packages/plugin-import-export/src/utilities/getImportFieldFunctions.ts packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts
git commit -m "fix(plugin-import-export): normalize dangling JSON relationships"
```

---

### Task 2: Add a real dangling-reference roundtrip and reliable cleanup

**Files:**
- Modify: `test/plugin-import-export/int.spec.ts`

**Interfaces:**
- Consumes: Payload local API, `readJSON`, generated import/export collections.
- Produces: reusable object-parameter helpers for tracked relationship exports/imports and an integration regression for a dangling relationship.

- [ ] **Step 1: Replace partial cleanup with complete tracked cleanup**

Inside `describe('relationship roundtrips')`, track:

```ts
const createdExportIDs: (number | string)[] = []
const createdImportIDs: (number | string)[] = []
const createdPageTitles: string[] = []
const createdPostIDs: (number | string)[] = []
```

Add object-parameter helpers that create and immediately track export/import records. In `afterEach`, delete tracked import records, export records, pages matching each tracked title, and posts, then clear all four arrays. Do not swallow cleanup errors; use title-based page deletion so an imported replacement is removed even if an assertion fails before its ID is read.

- [ ] **Step 2: Add the failing dangling roundtrip test**

Create two posts and a page whose `hasManyMonomorphic` references both. Delete the first post before exporting so Payload returns `[null, survivingPost]`. Assert the JSON file contains:

```ts
{
  title: 'Dangling hasMany JSON Roundtrip',
  hasManyMonomorphic: [null, survivingPost.id],
}
```

Delete the source page, import the JSON file, and assert the job completes with one imported document, zero issues, and `hasManyMonomorphic` containing only the surviving post ID.

- [ ] **Step 3: Prove the integration regression fails without Task 1**

Temporarily reverse Task 1 in the working tree while leaving the new integration test in place:

```bash
git diff HEAD^ HEAD -- packages/plugin-import-export/src/utilities/getImportFieldFunctions.ts packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts | git apply -R
```

Then run:

```bash
pnpm exec vitest run --project int test/plugin-import-export/int.spec.ts -t "should roundtrip a dangling hasMany relationship through JSON export/import"
```

Expected: import status is not `completed` because the bare `null` reaches relationship validation. Restore Task 1 immediately:

```bash
git diff HEAD^ HEAD -- packages/plugin-import-export/src/utilities/getImportFieldFunctions.ts packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts | git apply
```

- [ ] **Step 4: Run the dangling roundtrip and cleanup tests GREEN**

Run the command from Step 3 after restoring Task 1. Expected: the test passes. Run it twice to confirm the cleanup leaves no conflicting records or files.

- [ ] **Step 5: Extract the repeated export/import lifecycle**

Use focused helpers with object parameters for creating tracked exports, resolving their file paths, deleting source pages, creating tracked imports, and querying imported pages. Keep each test's format-specific shape and relationship assertions inline.

- [ ] **Step 6: Run all relationship roundtrip integration tests**

Run:

```bash
pnpm exec vitest run --project int test/plugin-import-export/int.spec.ts -t "relationship roundtrips"
```

Expected: CSV, ordinary JSON, polymorphic JSON, and dangling JSON roundtrips all pass.

- [ ] **Step 7: Commit Task 2**

```bash
git add test/plugin-import-export/int.spec.ts
git commit -m "test(plugin-import-export): cover dangling relationship roundtrips"
```

---

### Task 3: Constrain grouped preview rendering to JSON polymorphic relationships

**Files:**
- Modify: `packages/plugin-import-export/src/components/ImportPreview/index.tsx`
- Modify: `packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.ts`
- Modify: `packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.spec.ts`
- Modify: `packages/plugin-import-export/src/components/RelationshipCell/index.tsx`
- Modify: `test/plugin-import-export/e2e.spec.ts`

**Interfaces:**
- Consumes: the local `format` variable in `ImportPreview`, `field.relationTo`, and the existing `RelationshipCell`.
- Produces: grouped cells only for `format === 'json' && field.type === 'relationship' && Array.isArray(field.relationTo)`.

- [ ] **Step 1: Update e2e expectations to the desired scope**

Keep the JSON polymorphic grouping test. Replace the monomorphic grouping/capping tests with one test that uploads five monomorphic JSON IDs and asserts:

```ts
await expect(cell.locator('.import-preview-relationship')).toHaveCount(0)
await expect(cell).toContainText('preview-post-1, preview-post-2, preview-post-3, preview-post-4, preview-post-5')
```

Keep a populated monomorphic document assertion, but assert it uses the previous plain-cell path rather than `RelationshipCell`.

- [ ] **Step 2: Run the focused e2e tests and confirm RED**

Run:

```bash
pnpm exec playwright test test/plugin-import-export/e2e.spec.ts --grep "Relationship Preview"
```

Expected: monomorphic cells still contain `.import-preview-relationship` and cap after three items.

- [ ] **Step 3: Restore the prior formatter for non-target fields**

Restore the previous relationship/upload formatting logic in `ImportPreview`. Enter `RelationshipCell` only for:

```ts
const shouldRenderGroupedRelationship =
  format === 'json' && field.type === 'relationship' && Array.isArray(field.relationTo)
```

Use `formatDocTitle` for the prior populated-document path and leave upload, CSV, and monomorphic behavior unchanged.

- [ ] **Step 4: Fix documented convention violations**

Rename `showCollectionLabels` to `shouldShowCollectionLabels`. Change `isRecord`, `isPolymorphicRelationship`, and the unit-test `summarize` helper to take object parameters, updating all calls.

- [ ] **Step 5: Run unit and e2e preview tests GREEN**

Run:

```bash
pnpm exec vitest run --project unit packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.spec.ts
pnpm exec playwright test test/plugin-import-export/e2e.spec.ts --grep "Relationship Preview"
```

Expected: both commands pass.

- [ ] **Step 6: Commit Task 3**

```bash
git add packages/plugin-import-export/src/components/ImportPreview/index.tsx packages/plugin-import-export/src/components/RelationshipCell test/plugin-import-export/e2e.spec.ts
git commit -m "fix(plugin-import-export): scope relationship preview formatting"
```

---

### Task 4: Verify the completed PR follow-up

**Files:**
- Verify all modified files from Tasks 1-3.

**Interfaces:**
- Consumes: the complete branch diff and package scripts.
- Produces: fresh evidence that the fixes pass unit, integration, lint, and type/build checks.

- [ ] **Step 1: Run changed unit tests**

```bash
pnpm exec vitest run --project unit packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.spec.ts packages/plugin-import-export/src/utilities/getExportFieldFunctions.spec.ts packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts packages/plugin-import-export/src/utilities/unflattenObject.spec.ts
```

- [ ] **Step 2: Run the plugin integration suite**

```bash
pnpm run test:int plugin-import-export
```

- [ ] **Step 3: Run the focused preview e2e suite**

```bash
pnpm exec playwright test test/plugin-import-export/e2e.spec.ts --grep "Relationship Preview"
```

- [ ] **Step 4: Run lint and the package build**

```bash
pnpm --filter @payloadcms/plugin-import-export lint
pnpm run build:plugin-import-export
```

- [ ] **Step 5: Review the final diff and repository state**

```bash
git diff 411bb4d60b3c6698792420d08ef7cd53f031fa41...HEAD --check
git status --short
git log --oneline -6
```

Confirm the current checkout is the isolated PR worktree, the user's original checkout remains untouched, and no generated test uploads are untracked.
