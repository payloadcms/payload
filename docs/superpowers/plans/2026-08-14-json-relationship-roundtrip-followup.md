# JSON Relationship Roundtrip Follow-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent dangling `hasMany` relationships from making JSON imports fail, constrain the new preview UI to JSON polymorphic relationships, and bring the added tests into compliance with Payload's conventions.

**Architecture:** Compact unresolved entries at the JSON export boundary because bare `null` relationship-array entries fail Payload validation. Keep CSV's indexed columns unchanged; unflattening already collapses their gaps on import. Select the grouped preview renderer at the `ImportPreview` boundary where both file format and field shape are known. Centralize relationship roundtrip resource tracking inside the integration-test describe block.

**Tech Stack:** TypeScript, React, Payload field hooks, Vitest, Playwright, pnpm.

## Global Constraints

- Always use object parameters for function arguments.
- Prefix booleans with `is`, `has`, `can`, or `should`.
- Tests must be self-contained and clean up every created database record and file.
- CSV export and import behavior must remain unchanged.
- JSON exports must omit unresolved `hasMany` entries.
- The grouped preview renderer applies only to JSON polymorphic relationship fields.

---

### Task 1: Drop dangling entries from JSON relationship arrays

**Files:**

- Modify: `packages/plugin-import-export/src/utilities/getExportFieldFunctions.spec.ts`
- Modify: `packages/plugin-import-export/src/utilities/getExportFieldFunctions.ts`

- [x] **Step 1: Add failing monomorphic and polymorphic export tests**

Change the existing dangling-reference expectations from `[null, surviving]` to compact arrays containing only the surviving relationship.

- [x] **Step 2: Run the focused unit test and confirm RED**

```bash
pnpm exec vitest run --project unit packages/plugin-import-export/src/utilities/getExportFieldFunctions.spec.ts
```

Expected: both tests receive a leading `null` before implementation.

- [x] **Step 3: Implement JSON-only compaction**

Filter nullish monomorphic IDs before returning JSON. Build polymorphic JSON arrays directly from resolved relationships rather than allocating a source-length array filled with `null`. Preserve the existing indexed CSV writes.

- [x] **Step 4: Run exporter, importer, and unflatten unit tests GREEN**

```bash
pnpm exec vitest run --project unit packages/plugin-import-export/src/utilities/getExportFieldFunctions.spec.ts packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts packages/plugin-import-export/src/utilities/unflattenObject.spec.ts
```

---

### Task 2: Constrain grouped preview rendering to JSON polymorphic relationships

**Files:**

- Modify: `packages/plugin-import-export/src/components/ImportPreview/index.tsx`
- Modify: `packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.ts`
- Modify: `packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.spec.ts`
- Modify: `packages/plugin-import-export/src/components/RelationshipCell/index.tsx`
- Modify: `test/plugin-import-export/e2e.spec.ts`

- [x] **Step 1: Update e2e expectations to the desired scope**

Keep the JSON polymorphic grouping assertion. Assert monomorphic relationship values use the plain formatter, retain populated titles, and do not cap after three entries.

- [x] **Step 2: Run the focused e2e tests and confirm RED**

```bash
PORT=3101 pnpm test:e2e plugin-import-export --grep "Relationship Preview"
```

Expected: monomorphic cells still contain `.import-preview-relationship`.

- [x] **Step 3: Restore the prior formatter for non-target fields**

Enter `RelationshipCell` only when:

```ts
const shouldRenderGroupedRelationship =
  format === 'json' &&
  field.type === 'relationship' &&
  Array.isArray(field.relationTo)
```

- [x] **Step 4: Fix documented convention violations**

Rename `showCollectionLabels` to `shouldShowCollectionLabels`. Change `isRecord`, `isPolymorphicRelationship`, and the unit-test `summarize` helper to take object parameters.

- [x] **Step 5: Run unit and e2e preview tests GREEN**

---

### Task 3: Make relationship roundtrip tests isolated and reusable

**Files:**

- Modify: `test/plugin-import-export/int.spec.ts`

- [x] **Step 1: Track every created resource**

Track import IDs, export IDs, page titles, and post IDs. Delete them in `afterEach` without swallowing cleanup failures.

- [x] **Step 2: Extract the repeated export/import lifecycle**

Use object-parameter helpers to create tracked exports and imports, run jobs, and resolve generated file paths. Keep each test's format-specific assertions inline.

- [x] **Step 3: Run all relationship roundtrip tests twice**

```bash
PAYLOAD_DATABASE=sqlite pnpm exec vitest run --project int test/plugin-import-export/int.spec.ts -t "relationship roundtrips"
```

Expected: four tests pass on both clean runs.

---

### Task 4: Verify the completed PR follow-up

- [ ] **Step 1: Run changed unit tests**

```bash
pnpm exec vitest run --project unit packages/plugin-import-export/src/components/RelationshipCell/getRelationshipGroups.spec.ts packages/plugin-import-export/src/utilities/getExportFieldFunctions.spec.ts packages/plugin-import-export/src/utilities/getImportFieldFunctions.spec.ts packages/plugin-import-export/src/utilities/unflattenObject.spec.ts
```

- [ ] **Step 2: Run the plugin integration suite with SQLite**

```bash
pnpm run test:int:sqlite plugin-import-export
```

- [ ] **Step 3: Run the focused preview e2e suite**

```bash
PORT=3101 pnpm test:e2e plugin-import-export --grep "Relationship Preview"
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
git log --oneline -8
```
