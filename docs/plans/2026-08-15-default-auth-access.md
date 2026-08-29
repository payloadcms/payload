# Default self-only access for auth-enabled collections — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change the default `update`, `delete`, and `unlock` access on auth-enabled collections from "any authenticated admin-collection user" to "only the caller's own record."

**Architecture:** Introduce `defaultAuthAccess` that returns `{ id: { equals: user.id } }` when a user is present, `false` otherwise. Branch on `collection.auth` inside `addDefaultsToCollectionConfig` to use it for `update`/`delete`/`unlock` only. `read`, `create`, `readVersions`, and `admin` continue to use `defaultAccess`. Non-auth collections are untouched.

**Tech Stack:** TypeScript, Vitest (integration tests), pnpm.

**Design doc:** `docs/plans/2026-08-15-default-auth-access-design.md`

**Testing note:** Integration tests run against MongoDB in-memory by default. Run each test as it is added; do not batch. Commit after each green step.

---

## Task 1: Failing test — cross-user update denied by default

**Files:**

- Modify: `test/auth/int.spec.ts` — add a new `describe('Default access', () => { ... })` block near the end of the top-level `describe('Auth', ...)`.

**Step 1: Write the failing test**

Add near the end of the top-level `describe('Auth', ...)` in `test/auth/int.spec.ts`:

```ts
describe('Default access (auth collection)', () => {
  const createdUserIDs: (number | string)[] = []

  afterEach(async () => {
    for (const id of createdUserIDs) {
      await payload
        .delete({ collection: slug, id, overrideAccess: true })
        .catch(() => {})
    }
    createdUserIDs.length = 0
  })

  it('denies updating another user by default', async () => {
    const userA = await payload.create({
      collection: slug,
      data: {
        email: `a-${uuid()}@test.com`,
        password: 'test1234',
        roles: ['user'],
      },
      overrideAccess: true,
    })
    const userB = await payload.create({
      collection: slug,
      data: {
        email: `b-${uuid()}@test.com`,
        password: 'test1234',
        roles: ['user'],
      },
      overrideAccess: true,
    })
    createdUserIDs.push(userA.id, userB.id)

    const req = await createLocalReq({ user: userA }, payload)

    const result = await payload
      .update({
        collection: slug,
        id: userB.id,
        data: { custom: 'should not persist' },
        overrideAccess: false,
        req,
      })
      .catch((err) => err)

    expect(result).toBeInstanceOf(Error)
    // Payload throws NotFound (query-constrained) or Forbidden depending on op path.
    expect(['NotFound', 'Forbidden']).toContain((result as Error).name)

    const stillUserB = await payload.findByID({
      collection: slug,
      id: userB.id,
      overrideAccess: true,
    })
    expect(stillUserB.custom).not.toBe('should not persist')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm run test:int auth -t "denies updating another user by default"`
Expected: FAIL — under current default, user A can update user B, so the update resolves and `result` is not an Error.

**Step 3: Commit the failing test**

```bash
git add test/auth/int.spec.ts
git commit -m "test(auth): default access should deny cross-user update"
```

---

## Task 2: Implement `defaultAuthAccess`

**Files:**

- Create: `packages/payload/src/auth/defaultAuthAccess.ts`

**Step 1: Write the file**

```ts
import type { Access } from '../config/types.js'

export const defaultAuthAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }
  return { id: { equals: user.id } }
}
```

**Step 2: Type check**

Run: `pnpm run build:core`
Expected: PASS.

**Step 3: Commit**

```bash
git add packages/payload/src/auth/defaultAuthAccess.ts
git commit -m "feat(payload): add defaultAuthAccess for self-only auth defaults"
```

---

## Task 3: Wire `defaultAuthAccess` into collection defaults

**Files:**

- Modify: `packages/payload/src/collections/config/defaults.ts:58-121`

**Step 1: Update `addDefaultsToCollectionConfig`**

Add the import at the top of the file (alongside the existing `defaultAccess` import):

```ts
import { defaultAuthAccess } from '../../auth/defaultAuthAccess.js'
```

Replace the `collection.access = { ... }` block inside `addDefaultsToCollectionConfig` with:

```ts
const authDefault = collection.auth ? defaultAuthAccess : defaultAccess

collection.access = {
  ...access,
  create: access?.create ?? defaultAccess,
  delete: access?.delete ?? authDefault,
  read: access?.read ?? defaultAccess,
  unlock: access?.unlock ?? authDefault,
  update: access?.update ?? authDefault,
} satisfies SanitizedCollectionConfig['access']
```

Also update the `defaults` object (`packages/payload/src/collections/config/defaults.ts:9`) to reflect intent for readers, even though it is `@deprecated` — leave `defaults.access` referencing `defaultAccess` for all keys (it is not consulted at runtime; changing it would be a needless bit of noise).

**Step 2: Run the failing test**

Run: `pnpm run test:int auth -t "denies updating another user by default"`
Expected: PASS — cross-user update is now denied.

**Step 3: Commit**

```bash
git add packages/payload/src/collections/config/defaults.ts
git commit -m "feat(payload)!: self-only default update/delete/unlock for auth collections"
```

---

## Task 4: Positive test — self-update still works

**Files:**

- Modify: `test/auth/int.spec.ts` — inside the same `describe('Default access (auth collection)', ...)`.

**Step 1: Add the test**

```ts
it('allows a user to update their own record by default', async () => {
  const user = await payload.create({
    collection: slug,
    data: {
      email: `self-${uuid()}@test.com`,
      password: 'test1234',
      roles: ['user'],
    },
    overrideAccess: true,
  })
  createdUserIDs.push(user.id)

  const req = await createLocalReq({ user }, payload)

  const updated = await payload.update({
    collection: slug,
    id: user.id,
    data: { custom: 'self-updated' },
    overrideAccess: false,
    req,
  })

  expect(updated.custom).toBe('self-updated')
})
```

**Step 2: Run it**

Run: `pnpm run test:int auth -t "allows a user to update their own record by default"`
Expected: PASS.

**Step 3: Commit**

```bash
git add test/auth/int.spec.ts
git commit -m "test(auth): user can self-update under default access"
```

---

## Task 5: Test — user-provided `access.update` wins

**Files:**

- Modify: `test/auth/config.ts` — add a new auth collection whose `access.update` always returns `true`, so we can prove the custom function overrides the new default.
- Modify: `test/auth/shared.ts` — export the new slug.
- Modify: `test/auth/int.spec.ts` — add the test.

**Step 1: Add slug constant**

In `test/auth/shared.ts`, add:

```ts
export const openUpdateAuthSlug = 'open-update-auth'
```

**Step 2: Add collection to `test/auth/config.ts`**

Import the new slug alongside the existing ones, then add this collection to the `collections` array (near the other secondary auth collections):

```ts
{
  slug: openUpdateAuthSlug,
  access: {
    update: () => true,
  },
  auth: true,
  fields: [{ name: 'note', type: 'text' }],
  versions: false,
},
```

**Step 3: Add the test**

In the `describe('Default access (auth collection)', ...)` block:

```ts
it('respects a user-provided access.update over the auth default', async () => {
  const userA = await payload.create({
    collection: openUpdateAuthSlug,
    data: { email: `oa-${uuid()}@test.com`, password: 'test1234' },
    overrideAccess: true,
  })
  const userB = await payload.create({
    collection: openUpdateAuthSlug,
    data: { email: `ob-${uuid()}@test.com`, password: 'test1234' },
    overrideAccess: true,
  })

  const req = await createLocalReq({ user: userA }, payload)

  const updated = await payload.update({
    collection: openUpdateAuthSlug,
    id: userB.id,
    data: { note: 'overridden default lets this through' },
    overrideAccess: false,
    req,
  })

  expect(updated.note).toBe('overridden default lets this through')

  await payload.delete({
    collection: openUpdateAuthSlug,
    id: userA.id,
    overrideAccess: true,
  })
  await payload.delete({
    collection: openUpdateAuthSlug,
    id: userB.id,
    overrideAccess: true,
  })
})
```

**Step 4: Run it**

Run: `pnpm run test:int auth -t "respects a user-provided access.update"`
Expected: PASS.

**Step 5: Commit**

```bash
git add test/auth/config.ts test/auth/shared.ts test/auth/int.spec.ts
git commit -m "test(auth): custom access.update overrides self-only default"
```

---

## Task 6: Test — non-auth collections unaffected

**Files:**

- Modify: `test/auth/int.spec.ts`. Reuse an existing non-auth collection from the auth test config if one exists; otherwise add a minimal one to `test/auth/config.ts`.

**Step 1: Check for a non-auth collection in `test/auth/config.ts`**

Run: `grep -n "auth: " test/auth/config.ts` — every collection currently sets `auth`. Add a minimal one:

```ts
{
  slug: 'default-access-fixture',
  fields: [{ name: 'title', type: 'text' }],
  versions: false,
},
```

Add the slug constant to `test/auth/shared.ts`:

```ts
export const defaultAccessFixtureSlug = 'default-access-fixture'
```

**Step 2: Add the test**

```ts
it('does not apply the auth default to non-auth collections', async () => {
  const authUser = await payload.create({
    collection: slug,
    data: {
      email: `nonauth-${uuid()}@test.com`,
      password: 'test1234',
      roles: ['user'],
    },
    overrideAccess: true,
  })
  createdUserIDs.push(authUser.id)

  const doc = await payload.create({
    collection: defaultAccessFixtureSlug,
    data: { title: 'original' },
    overrideAccess: true,
  })

  const req = await createLocalReq({ user: authUser }, payload)

  const updated = await payload.update({
    collection: defaultAccessFixtureSlug,
    id: doc.id,
    data: { title: 'edited by another user' },
    overrideAccess: false,
    req,
  })

  expect(updated.title).toBe('edited by another user')

  await payload.delete({
    collection: defaultAccessFixtureSlug,
    id: doc.id,
    overrideAccess: true,
  })
})
```

Note: this asserts that `defaultAccess` still lets any admin-collection user update non-auth docs. If `authUser.collection !== payload.config.admin.user`, the update would fail for the wrong reason; `slug` is `admin.user` in this config, so we are safe.

**Step 3: Run it**

Run: `pnpm run test:int auth -t "does not apply the auth default to non-auth collections"`
Expected: PASS.

**Step 4: Commit**

```bash
git add test/auth/config.ts test/auth/shared.ts test/auth/int.spec.ts
git commit -m "test(auth): non-auth collections keep defaultAccess"
```

---

## Task 7: Tests — `unlock` default behavior change

**Files:**

- Modify: `test/auth/int.spec.ts` — add tests inside the same describe block.

**Step 1: Add anonymous-denied test**

```ts
it('denies unlock to anonymous callers by default', async () => {
  const user = await payload.create({
    collection: slug,
    data: {
      email: `unlock-a-${uuid()}@test.com`,
      password: 'test1234',
      roles: ['user'],
    },
    overrideAccess: true,
  })
  createdUserIDs.push(user.id)

  const req = await createLocalReq({}, payload)

  const result = await payload
    .unlock({
      collection: slug,
      data: { email: user.email },
      overrideAccess: false,
      req,
    })
    .catch((err) => err)

  expect(result).toBeInstanceOf(Error)
  expect((result as Error).name).toBe('Forbidden')
})
```

**Step 2: Add cross-user-denied test**

```ts
it('denies unlocking another user by default', async () => {
  const caller = await payload.create({
    collection: slug,
    data: {
      email: `unlock-c-${uuid()}@test.com`,
      password: 'test1234',
      roles: ['user'],
    },
    overrideAccess: true,
  })
  const target = await payload.create({
    collection: slug,
    data: {
      email: `unlock-t-${uuid()}@test.com`,
      password: 'test1234',
      roles: ['user'],
    },
    overrideAccess: true,
  })
  createdUserIDs.push(caller.id, target.id)

  const req = await createLocalReq({ user: caller }, payload)

  const result = await payload.unlock({
    collection: slug,
    data: { email: target.email },
    overrideAccess: false,
    req,
  })

  // unlock returns boolean; the where-constraint (id === caller.id) mismatches target.email, so nothing unlocks.
  expect(result).toBe(false)
})
```

**Step 3: Run both**

Run: `pnpm run test:int auth -t "denies unlock to anonymous callers by default"`
Run: `pnpm run test:int auth -t "denies unlocking another user by default"`
Expected: PASS for both.

**Step 4: Commit**

```bash
git add test/auth/int.spec.ts
git commit -m "test(auth): default unlock denies anonymous and cross-user calls"
```

---

## Task 8: Full auth suite regression run

**Step 1: Run the full auth int suite**

Run: `pnpm run test:int auth`
Expected: PASS overall. Fix any pre-existing tests that assumed the old default (e.g. a test that logs in as user A and updates user B without setting `access.update`). Fix by either (a) marking that collection's `access.update` explicitly in the test config, or (b) updating the test to use `overrideAccess: true` if the intent was administrative.

**Step 2: Commit any regression fixes separately**

```bash
git add <files>
git commit -m "test(auth): update assumptions that relied on the old default"
```

---

## Task 9: Update docs

**Files:**

- Modify: `docs/access-control/collections.mdx` — the `update`, `delete`, and `unlock` sections should note the new default.

**Step 1: Add a callout after each affected operation's intro paragraph**

Under the `update` section (around `docs/access-control/collections.mdx:164`):

```mdx
<Banner type="info">
  **Default behavior:** on auth-enabled collections, the default `update` access constrains the
  operation to `{ id: { equals: req.user.id } }` — a user can only update their own record. To
  allow admins to update other users, provide an explicit `access.update` function on the
  collection.
</Banner>
```

Under `delete`: same wording with `delete`. Under `unlock`: same wording, and note that anonymous unlock is denied by default; explicit `access.unlock` is required for admin-to-user unlock flows.

**Step 2: Commit**

```bash
git add docs/access-control/collections.mdx
git commit -m "docs(access-control): document self-only default for auth collections"
```

---

## Task 10: Manual verification via the dev server

**Step 1: Start the auth test config**

Run: `pnpm run dev auth`

**Step 2: Log in as one user, attempt to update another via the admin UI**

- Log in as `dev@payloadcms.com` / `test`.
- Create a second user via the admin panel.
- Attempt to update the second user's record.
- Expected: 403 / not-found; the row is not modifiable.
- Update your own user record. Expected: succeeds.

**Step 3: Stop the dev server**

No commit needed.

---

## Non-goals (reminder)

- Do not change `read` or `create` defaults.
- Do not change non-auth collection defaults.
- Do not add role-based branching to the default.
- Do not export `defaultAuthAccess` from the public API in this change; keep it internal like `defaultAccess`.

---

## Rollout notes

- This is a breaking change. The PR should be titled `feat(payload)!: self-only default write access for auth collections` and include a BREAKING CHANGE footer describing the migration:
  > **BREAKING CHANGE:** on auth-enabled collections, the default `update`, `delete`, and `unlock` access is now `{ id: { equals: req.user.id } }`. Apps that relied on any authenticated admin-collection user being able to modify other users must add an explicit `access.update` (and/or `delete`, `unlock`) function to restore prior behavior.
- Target v4.
