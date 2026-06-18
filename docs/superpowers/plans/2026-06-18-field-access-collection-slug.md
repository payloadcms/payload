# Field Access Collection Slug Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the owning collection slug (`collectionSlug`) to field access functions for create/read/update across all core field-access execution paths, including relationship child traversal and permissions projection paths.

**Architecture:** Add one optional property to `FieldAccessArgs`, then thread it from the existing traversal/access call sites that already know the owning collection config. Keep globals behavior explicit by passing `undefined` for global fields. Validate behavior with a dedicated integration suite that exercises Local API, REST, and GraphQL read paths plus create/update and `findDistinct`.

**Tech Stack:** TypeScript, Payload core field hook/access pipeline, Vitest integration tests, Next REST/GraphQL test client helpers.

## Global Constraints

- Preserve backward compatibility: new access arg must be optional.
- Do not infer collection from `req.routeParams`; pass explicit owning collection slug from traversal context.
- Keep behavior identical for globals (`collectionSlug` undefined).

---

## File Structure

- **Create** `test/field-access-context/config.ts` — dedicated test config entrypoint.
- **Create** `test/field-access-context/int.spec.ts` — integration assertions for local/REST/GraphQL parity and relationship child behavior.
- **Create** `test/field-access-context/shared.ts` — shared slugs and recorder utilities.
- **Create** `test/field-access-context/collections/Parents/index.ts` — parent collection with `create/read/update` field access probes and relationship field.
- **Create** `test/field-access-context/collections/Children/index.ts` — child collection with `read` field access probe.
- **Create** `test/field-access-context/globals/AccessContextGlobal.ts` — global with field `read` access probe.
- **Modify** `packages/payload/src/fields/config/types.ts` — add optional `collectionSlug` to `FieldAccessArgs`.
- **Modify** `packages/payload/src/fields/hooks/beforeValidate/promise.ts` — pass `collectionSlug` for `create/update` field access checks.
- **Modify** `packages/payload/src/fields/hooks/afterRead/promise.ts` — pass `collectionSlug` for `read` field access checks.
- **Modify** `packages/payload/src/collections/operations/findDistinct.ts` — pass `collectionSlug` for direct field `read` access check.
- **Modify** `packages/payload/src/utilities/getEntityPermissions/getEntityPermissions.ts` — pass owning entity collection slug into field-permission traversal.
- **Modify** `packages/payload/src/utilities/getEntityPermissions/populateFieldPermissions.ts` — accept/thread `collectionSlug` and pass it to all field access calls.

### Task 1: Add failing integration coverage for field access collection context

**Files:**

- Create: `test/field-access-context/shared.ts`
- Create: `test/field-access-context/collections/Parents/index.ts`
- Create: `test/field-access-context/collections/Children/index.ts`
- Create: `test/field-access-context/globals/AccessContextGlobal.ts`
- Create: `test/field-access-context/config.ts`
- Create: `test/field-access-context/int.spec.ts`

**Interfaces:**

- Consumes: existing `initPayloadInt`, `NextRESTClient`, and Payload Local API methods (`create`, `update`, `find`, `findByID`, `findDistinct`, `findGlobal`).
- Produces: deterministic test failures proving `collectionSlug` is currently absent and required.

- [x] **Step 1: Create shared slugs and access recorder utilities**

```ts
// test/field-access-context/shared.ts
export const parentsSlug = 'field-access-context-parents'
export const childrenSlug = 'field-access-context-children'
export const globalSlug = 'field-access-context-global'

export type AccessLogEntry = {
  collectionSlug: string | undefined
  fieldName: string
  operation: 'create' | 'read' | 'update'
  source: 'field-access' | 'find-distinct' | 'permissions'
}

const accessLog: AccessLogEntry[] = []

export const pushAccessLog = (entry: AccessLogEntry): void => {
  accessLog.push(entry)
}

export const readAccessLog = (): AccessLogEntry[] => [...accessLog]

export const resetAccessLog = (): void => {
  accessLog.length = 0
}
```

- [x] **Step 2: Create parent/child/global fixtures that record field-access args**

```ts
// test/field-access-context/collections/Parents/index.ts (excerpt)
{
  name: 'accessCreateProbe',
  type: 'text',
  access: {
    create: ({ collectionSlug }) => {
      pushAccessLog({ collectionSlug, fieldName: 'accessCreateProbe', operation: 'create', source: 'field-access' })
      return true
    },
  },
}
```

```ts
// test/field-access-context/collections/Children/index.ts (excerpt)
{
  name: 'childReadProbe',
  type: 'text',
  access: {
    read: ({ collectionSlug }) => {
      pushAccessLog({ collectionSlug, fieldName: 'childReadProbe', operation: 'read', source: 'field-access' })
      return true
    },
  },
}
```

```ts
// test/field-access-context/globals/AccessContextGlobal.ts (excerpt)
{
  name: 'globalReadProbe',
  type: 'text',
  access: {
    read: ({ collectionSlug }) => {
      pushAccessLog({ collectionSlug, fieldName: 'globalReadProbe', operation: 'read', source: 'field-access' })
      return true
    },
  },
}
```

- [x] **Step 3: Write failing tests for local/REST/GraphQL and relationship-child context**

```ts
// test/field-access-context/int.spec.ts (key assertion shape)
expect(readAccessLog()).toContainEqual(
  expect.objectContaining({
    fieldName: 'accessReadProbe',
    operation: 'read',
    collectionSlug: parentsSlug,
  }),
)

expect(readAccessLog()).toContainEqual(
  expect.objectContaining({
    fieldName: 'childReadProbe',
    operation: 'read',
    collectionSlug: childrenSlug,
  }),
)
```

- [x] **Step 4: Add failing tests for create/update/findDistinct and globals**

```ts
// create/update checks
expect(readAccessLog()).toContainEqual(
  expect.objectContaining({
    fieldName: 'accessCreateProbe',
    operation: 'create',
    collectionSlug: parentsSlug,
  }),
)
expect(readAccessLog()).toContainEqual(
  expect.objectContaining({
    fieldName: 'accessUpdateProbe',
    operation: 'update',
    collectionSlug: parentsSlug,
  }),
)

// globals should remain undefined
expect(readAccessLog()).toContainEqual(
  expect.objectContaining({
    fieldName: 'globalReadProbe',
    operation: 'read',
    collectionSlug: undefined,
  }),
)
```

- [x] **Step 5: Run targeted tests to confirm red state**

Run: `pnpm run test:int field-access-context`
Expected: FAIL with assertions showing `collectionSlug` is `undefined` in one or more field access callbacks.

- [x] **Step 6: Commit failing tests**

```bash
git add test/field-access-context
git commit -m "test: add failing coverage for field access collection slug context"
```

### Task 2: Extend field access arg type surface

**Files:**

- Modify: `packages/payload/src/fields/config/types.ts`
- Test: `test/field-access-context/int.spec.ts`

**Interfaces:**

- Consumes: current `FieldAccessArgs<TData, TSiblingData>`.
- Produces: `FieldAccessArgs` with optional `collectionSlug?: string`.

- [x] **Step 1: Add optional `collectionSlug` to `FieldAccessArgs`**

```ts
export type FieldAccessArgs<
  TData extends TypeWithID = any,
  TSiblingData = any,
> = {
  // ...
  /**
   * Slug of the collection that owns the field being evaluated.
   * Undefined when the field belongs to a global.
   */
  collectionSlug?: string
  req: PayloadRequest
  // ...
}
```

- [x] **Step 2: Run the focused test suite to keep expected failures stable**

Run: `pnpm run test:int field-access-context`
Expected: FAIL (runtime threading not implemented yet), with no TypeScript compile/runtime errors caused by the new arg.

- [x] **Step 3: Commit type surface update**

```bash
git add packages/payload/src/fields/config/types.ts
git commit -m "feat(payload): add collectionSlug to FieldAccessArgs"
```

### Task 3: Thread collection slug through create/read/update field-access execution paths

**Files:**

- Modify: `packages/payload/src/fields/hooks/beforeValidate/promise.ts`
- Modify: `packages/payload/src/fields/hooks/afterRead/promise.ts`
- Modify: `packages/payload/src/collections/operations/findDistinct.ts`

**Interfaces:**

- Consumes: traversal `collection` config in hook promise functions; `collectionConfig.slug` in findDistinct.
- Produces: field access callback args containing `collectionSlug` for create/read/update checks.

- [x] **Step 1: Thread `collection?.slug` into beforeValidate field access (`create`/`update`)**

```ts
// beforeValidate/promise.ts
await field.access[operation]({
  id,
  blockData,
  collectionSlug: collection?.slug,
  data: data as Partial<T>,
  doc,
  req,
  siblingData,
})
```

- [x] **Step 2: Thread `collection?.slug` into afterRead field access (`read`)**

```ts
// afterRead/promise.ts
await field.access.read({
  id: doc.id as number | string,
  blockData,
  collectionSlug: collection?.slug,
  data: doc,
  doc,
  req,
  siblingData: siblingDoc,
})
```

- [x] **Step 3: Thread collection slug in direct field access path (`findDistinct`)**

```ts
// collections/operations/findDistinct.ts
const hasAccess = await fieldResult.field.access.read({
  collectionSlug: collectionConfig.slug,
  req,
})
```

- [x] **Step 4: Run targeted tests**

Run: `pnpm run test:int field-access-context`
Expected: PASS for create/update/read/findDistinct path assertions; any remaining failures should be permissions-path specific.

- [x] **Step 5: Commit runtime threading changes**

```bash
git add \
  packages/payload/src/fields/hooks/beforeValidate/promise.ts \
  packages/payload/src/fields/hooks/afterRead/promise.ts \
  packages/payload/src/collections/operations/findDistinct.ts
git commit -m "fix(payload): pass owning collection slug to field access callbacks"
```

### Task 4: Thread collection slug through permissions traversal (`populateFieldPermissions`)

**Files:**

- Modify: `packages/payload/src/utilities/getEntityPermissions/getEntityPermissions.ts`
- Modify: `packages/payload/src/utilities/getEntityPermissions/populateFieldPermissions.ts`
- Modify: `test/field-access-context/int.spec.ts`

**Interfaces:**

- Consumes: `entityType`, `entity.slug`, and existing recursive `populateFieldPermissions` traversal.
- Produces: `collectionSlug` passed to field access checks run during permissions computation.

- [x] **Step 1: Add optional `collectionSlug` param to populateFieldPermissions signature**

```ts
export const populateFieldPermissions = ({
  collectionSlug,
  id,
  blockReferencesPermissions,
  data,
  fields,
  operations,
  parentPermissionsObject,
  permissionsObject,
  promises,
  req,
}: {
  collectionSlug?: string
  // existing args...
}): void => {
```

- [x] **Step 2: Pass `collectionSlug` to all `field.access[operation]` calls and recursive invocations**

```ts
const accessResult = field.access[operation]({
  collectionSlug,
  id,
  data,
  doc: data,
  req,
})
```

```ts
populateFieldPermissions({
  collectionSlug,
  id,
  blockReferencesPermissions,
  data,
  fields: field.fields,
  operations,
  parentPermissionsObject: fieldPermissions,
  permissionsObject: fieldPermissions.fields,
  promises,
  req,
})
```

- [x] **Step 3: Pass root collection slug from getEntityPermissions**

```ts
populateFieldPermissions({
  blockReferencesPermissions,
  collectionSlug: entityType === 'collection' ? entity.slug : undefined,
  data,
  fields: entity.fields,
  operations,
  parentPermissionsObject: entityPermissions,
  permissionsObject: fieldsPermissions,
  promises,
  req,
})
```

- [x] **Step 4: Add/enable test coverage for permissions access path**

```ts
// test/field-access-context/int.spec.ts
await restClient.GET('/access')
expect(readAccessLog()).toContainEqual(
  expect.objectContaining({
    source: 'permissions',
    operation: 'read',
    collectionSlug: parentsSlug,
  }),
)
```

- [x] **Step 5: Run focused suite**

Run: `pnpm run test:int field-access-context`
Expected: PASS, including permissions-path assertions.

- [x] **Step 6: Commit permissions-path changes**

```bash
git add \
  packages/payload/src/utilities/getEntityPermissions/getEntityPermissions.ts \
  packages/payload/src/utilities/getEntityPermissions/populateFieldPermissions.ts \
  test/field-access-context/int.spec.ts
git commit -m "fix(payload): thread collection slug through field permissions access traversal"
```

### Task 5: Cross-path verification and cleanup

**Files:**

- Modify (if needed): `test/field-access-context/int.spec.ts`

**Interfaces:**

- Consumes: completed implementation from Tasks 2-4.
- Produces: confidence that local/REST/GraphQL parity and relationship context-switch behavior remain correct.

- [x] **Step 1: Run suite that directly covers GraphQL transport behavior**

Run: `pnpm run test:int graphql`
Expected: PASS

- [x] **Step 2: Run suite that heavily exercises field access behavior**

Run: `pnpm run test:int access-control`
Expected: PASS

- [x] **Step 3: Re-run feature suite as final guard**

Run: `pnpm run test:int field-access-context`
Expected: PASS

- [x] **Step 4: Commit any final test stabilization edits**

```bash
git add test/field-access-context/int.spec.ts
git commit -m "test: stabilize field access collection slug coverage"
```

- [x] **Step 5: Prepare branch for review**

```bash
git status --short
git log --oneline -n 8
```

Expected: clean working tree and commit history matching tasks above.
