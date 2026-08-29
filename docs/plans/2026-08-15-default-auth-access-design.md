# Self-only default write access for auth-enabled collections

**Date:** 2026-08-15
**Status:** Design
**Branch:** `feat/default-user-access`

## Problem

`defaultAccess` (`packages/payload/src/auth/defaultAccess.ts:3`) returns `true` for any authenticated user whose `collection === admin.user`. Applied to `update`/`delete`/`unlock` on auth-enabled collections, this means:

- Any admin-user-collection user can update, delete, or unlock any other user in that collection — a privilege-escalation footgun.
- Any secondary auth collection (e.g. `customers`, when `admin.user === 'users'`) cannot even update its own users by default. The collection is unusable without hand-written access control.

Neither behavior is what most apps want. A more defensible default is: authenticated users can only mutate their own record.

## Change

Introduce a new default used only for `update`, `delete`, and `unlock` on auth-enabled collections:

```ts
// packages/payload/src/auth/defaultAuthAccess.ts
import type { Access } from '../config/types.js'

export const defaultAuthAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  return { id: { equals: user.id } }
}
```

Returning a `Where` (not a boolean) means bulk `update`/`delete` still work — Payload constrains the query to the caller's own row.

`read`, `create`, `readVersions`, and `admin` keep the existing `defaultAccess` behavior. Non-auth collections are unaffected.

## Wiring

Two options considered; (A) is chosen.

**A. Auth-aware defaults in `addDefaultsToCollectionConfig`** (`packages/payload/src/collections/config/defaults.ts:58`).
Branch on `collection.auth`; when truthy, use `defaultAuthAccess` for `update`/`delete`/`unlock` instead of `defaultAccess`. Keeps the `??` semantics — user-provided `access.update` still wins.

**B. Override in `sanitize.ts`** inside the `if (sanitized.auth)` block. Requires capturing `collection.access` before `addDefaultsToCollectionConfig` fills it, so we can distinguish "user didn't provide one" from "default already assigned." Uglier and duplicates logic already living in `defaults.ts`.

## Sub-decision: `unlock`

Under today's `defaultAccess`, `unlock` requires another authenticated admin user — self-unlock while locked out is already impossible. Under `defaultAuthAccess`:

- Anonymous locked-out users still cannot self-unlock (no `req.user`).
- Admins can no longer unlock others without explicit `access.unlock`.

Net effect: `unlock` is effectively disabled unless explicitly configured. That is arguably correct — unlock is a privileged action and configuring it explicitly forces the right threat model — but it is a documented breaking change.

**Chosen:** include `unlock` in the tightening.

## Breaking-change surface

- Existing apps that relied on "admins can edit other users out of the box" break silently on upgrade.
- Existing apps that relied on the built-in `unlock` endpoint working for admin-to-user unlocks break silently on upgrade.
- Migration note for both: restore the old behavior by setting explicit access on the auth collection, e.g. `access.update: ({ req }) => Boolean(req.user)`, or a role-aware equivalent.
- Target: next major (v4). The `@deprecated` note already on `defaults` (`packages/payload/src/collections/config/defaults.ts:8`) indicates a v4 rework is already planned.

## Tests

Cover in `test/auth/int.spec.ts` (or a new sibling file):

- Auth collection with no custom `access.update`: user A cannot update user B (query-constrained; returns 0 docs or 403 depending on endpoint).
- Auth collection with no custom `access.update`: user A can update their own doc.
- Auth collection with an explicit `access.update`: the custom function wins; `defaultAuthAccess` is not applied.
- Non-auth collection: `defaultAccess` still used (regression guard).
- Bulk update via `where`: constrained to the caller's id.
- `unlock` with no custom access: anonymous request denied; cross-user request denied.
- The `admin.user` collection: an admin cannot update another admin without explicit `access.update`.

## Files touched

- **new** `packages/payload/src/auth/defaultAuthAccess.ts`
- `packages/payload/src/collections/config/defaults.ts` — branch on `collection.auth` in `addDefaultsToCollectionConfig`.
- `packages/payload/src/index.ts` — export `defaultAuthAccess` (public API for users writing their own defaults).
- `test/auth/int.spec.ts` (or a new sibling) — cases above.
- `docs/access-control/collections.mdx` — document the new default and how to opt out.

## Non-goals

- Read/list access is unchanged. Restricting default read is a much larger breaking change (admin lists, relationship pickers) and is out of scope here.
- No role-based logic in the default. Apps that want "admins can edit anyone" must express that in their own `access.update`.
- No changes to non-auth collections.
