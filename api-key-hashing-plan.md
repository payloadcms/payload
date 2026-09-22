# Plan: store API keys as one-way hashes

Branch off latest `main`. Proposed PR title: `feat!: store API keys as one-way hashes`.

## Motivation

Today an API key lives on the auth document as two values derived from `PAYLOAD_SECRET`:

- `apiKey` — reversible ciphertext (`aes-256-gcm`, keyed by the secret), decrypted on every read so
  the Admin Panel can display it.
- `apiKeyIndex` — `HMAC-SHA256(derived secret, rawKey)`, the value the API key auth strategy matches
  on.

Both derivations depend on the secret, so changing `PAYLOAD_SECRET` stops every key from
authenticating until `rotateSecret` re-keys the rows. Storing recoverable ciphertext also means a
leaked database plus a leaked secret hands over usable credentials, even though authentication never
needs to recover the plaintext.

This change stores a one-way hash instead, the same property passwords already have. Rotating or
retiring `PAYLOAD_SECRET` then has no effect on API keys at all.

## Scope

In scope:

- One-way hash storage in the existing `apiKey` field on the auth document.
- API key auth matching the hash, with no dependency on the secret or the encryption keyring.
- Server-side key generation: on create when none is supplied, and through a new generate endpoint.
- Admin Panel changes for a value that can only be shown once.
- A migration script that converts existing keys in place, so nothing has to be reissued.
- Docs, translations, and tests.

Explicitly **not** in scope (this is the de-scoped half of
[PR #17982](https://github.com/payloadcms/payload/pull/17982)):

- No `payload-api-keys` collection, no polymorphic `owner` relationship, no `apiKeys` join field.
- No multiple keys per user, no per-key labels, no independent revocation of one key among many.
- No `useAPIKey.access` object (`readOthers` / `manageOthers`), no `apiKeyPrefix`.
- No boot-time hard failure guard.
- No changes to the JWT/local strategies, sessions, or `previousSecrets` handling for tokens.

## Field layout

One field does the whole job. `apiKey` keeps its name and its column; only the format of the stored
value changes, from ciphertext to a hash.

| Field          | Change                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enableAPIKey` | Unchanged.                                                                                                                                                                                               |
| `apiKey`       | Stores `sha256(rawKey)`. Accepts a raw key on write; the `encryptKey`/`decryptKey` hooks are removed. Reads return the raw key only in the response that generated it, `''` when a key is set, and `null` when one is not. Gains `index: true`. |
| `apiKeyIndex`  | Kept, hidden and deprecated. Read only by `migrateAPIKeysToHash`, which needs it to verify a key recovered from pre-`v1` ciphertext. Removed in the next major.                                            |

No new column, so there is no schema migration for the hash itself — the value in `api_key` simply
changes shape. Postgres/SQLite projects get a generated migration that adds the index on `api_key`.

`apiKeyIndex` stays declared for this release rather than being dropped now: `aes-256-ctr`
ciphertext, which is what any project that has not re-encrypted since the `v1` envelope landed
still holds, decrypts to random bytes under a wrong secret instead of throwing, and the stored
index is the only exact way to tell a correct decryption from a wrong one. The migration falls back
to requiring printable ASCII where the index is absent, so dropping the field in the next major
costs only that exactness.

Hashing helper — new file `packages/payload/src/auth/apiKeys/hash.ts`:

```ts
export const hashAPIKey = (rawAPIKey: string): string =>
  crypto.createHash('sha256').update(rawAPIKey).digest('hex')
```

No per-record salt, matching the reasoning in PR #17982: a salt defends against precomputed
dictionary attacks on low-entropy human-chosen secrets, and it would make the hash
non-deterministic, which breaks the single-query lookup that API key auth depends on — no separate
identifier is sent alongside the key to look the row up by first. Because the hash is unsalted,
generated keys are 32 random bytes (`crypto.randomBytes(32).toString('base64url')`). A caller may
still supply a weak key of their own; the docs state the entropy expectation.

## Write rules

A key that is set reads back as an **empty string**, not as `null`. That distinction is what
makes writes safe without any client cooperation: a client that never held the key can only
send the mask back, which means "leave it alone", while `null` for a key that exists is an
explicit revoke. `null` also means "no key is set" on a read, so the two states are
distinguishable.

Rules, in the order they are evaluated:

1. `enableAPIKey` is `false` or `null` → clear the key. Revoked.
2. The incoming value is the mask (`''`) → keep the stored hash. This is what the Admin
   Panel submits on every save, and what a denied field-level `update` reverts to.
3. The incoming value is any other string → store `sha256(value)`, and reveal that value in
   this response (it is the caller's own value, so nothing new is disclosed).
4. The incoming value is `null` and a key is stored → clear it. Revoked.
5. No key is stored and API keys are enabled → generate one, store its hash, and reveal it
   in this response.
6. Otherwise → leave it alone.

Rule 5 is what makes `payload.create({ data: { enableAPIKey: true } })` return a working
key, and it applies on update too, so ticking "Enable API Key" on an existing user produces
one. It also gives the invariant **enabled implies a key exists**, which is what lets the
Admin Panel show a "key set, hidden" state without a second field telling it so.

### How this is implemented

Two hooks on the `apiKey` field, and nothing else:

- `beforeChange` resolves the rules above. It reads the currently stored hash from
  `siblingDocWithLocales` - the untouched database row - because `value` carries the masked
  form. Field-level access control runs at the end of `beforeValidate`, before this, so a
  denied write has already been reverted to the mask and is treated as no change.
- `afterRead` returns the raw key when this request produced it, and the mask otherwise. It
  returns an explicit value rather than `undefined`, since an undefined `afterRead` result
  is treated as "no change" and would return the stored hash.
- `beforeDuplicate` clears the key, so a duplicate is issued its own rather than inheriting
  one - a single credential for two users would let either act as the other. This was the
  behaviour before this change too, and it is now covered by a test.

Raw keys are held for the remainder of the request in `req.context`, keyed by their hash, so
`afterRead` reveals the right one per document even when a single request writes many.

### Read rules

`apiKey` reads back as the raw key only in the response of the request that set or generated
it. Every other read returns `''` when a key is set and `null` when one is not, for every
transport: REST, GraphQL, Local API, `/me`, `/refresh-token`, `login`. The hash is never
returned, and there is no hidden field holding it, so `showHiddenFields: true` cannot
surface it either.

## Auth strategy

`packages/payload/src/auth/strategies/apiKey.ts` — replace the keyring-derived candidate list with a
single indexed lookup:

```ts
where.apiKey = { equals: hashAPIKey(providedKey) }
```

Keep the existing `_verified` handling and `limit: 1`. The strategy no longer touches
`payload.encryptionKeyring` or `payload.secret`.

Optional, recommended: when a lookup finds nothing, check once per collection per process for rows
where `apiKey` still contains `v1:` and, if any exist, log a warning naming the migration script.
`contains` maps to a portable match on both adapters and a hash can never contain a colon, so there
are no false positives. It will not spot pre-`v1` `aes-256-ctr` ciphertext, which has no prefix.

## Generate endpoint

`POST /api/{collectionSlug}/{id}/api-key`, registered in
`packages/payload/src/collections/config/sanitize.ts` only when `auth.useAPIKey` is set (so no other
collection gains the route), handler in `packages/payload/src/auth/endpoints/generateAPIKey.ts`.

```ts
const rawAPIKey = generateAPIKey()

const doc = await updateByIDOperation({
  id,
  collection,
  data: { apiKey: rawAPIKey, enableAPIKey: true },
  overrideAccess: false,
  req,
})

return Response.json({ apiKey: rawAPIKey, doc, message })
```

Access control comes entirely from the existing operation: collection `update` access on that
document, plus field-level `update` access on `apiKey` and `enableAPIKey`. Notes:

- The handler confirms the write landed and responds `403` if field-level access stripped it, rather
  than returning a key that does not work.
- Generating implies enabling, so the request sets `enableAPIKey: true`.
- A request authenticated _with_ an API key can rotate its own key if the collection's `update`
  access allows it. Same as PR #17982; called out in the docs.
- The raw key appears in this response only. It is never returned again.

Known nuance to document: rule 4 (generate when enabled with no key) is gated by access control on
`enableAPIKey`, not on `apiKey`, because a field hook cannot see the outcome of another field's
access check. A project that must prevent key issuance should deny `update` on `enableAPIKey`. The
endpoint has no such gap — it writes `apiKey` explicitly.

## Generating and displaying a key

A one-time value can only be shown if it arrives in a response the current screen actually keeps.
Two facts from `packages/ui/src/views/Edit/index.tsx` decide the flows below:

- `onSave` calls `setData(document)` (which is `updateSavedDocumentData`) with the **whole save
  response** for every save, so a revealed key is immediately readable from
  `useDocumentInfo().savedDocumentData` — the same source PR #17982's field component read.
- On create only, the view then does `router.push` to the new document's edit URL. That route renders
  fresh on the server, where `apiKey` reads back as `null`, so anything revealed by the create
  response is gone by the time the user sees the page.

The redirect is the only obstacle, and it is a client-side navigation inside the admin's single
catch-all route (`admin/[[...segments]]/page.tsx`), so the layout and the loaded modules persist —
only a hard refresh tears them down. A **read-once handoff** therefore carries the value across it:

- A module-scoped `Map<string, string>` in the ui package, keyed `${collectionSlug}:${id}`.
- The API key field writes to it whenever it sees a value (from `savedDocumentData.apiKey` or from an
  endpoint response), and **deletes the entry as it reads it**, holding it in component state from
  then on.
- Nothing is written to `sessionStorage` or `localStorage`, so no live credential is left where any
  script on the origin can read it. A refresh or a return visit to the document shows the hidden
  state, which is the correct behaviour for a value that is shown once.

Considered and rejected: `window.sessionStorage`, which is how the post-create success toast already
travels (`PENDING_SUCCESS_TOAST_KEY` in the same file) — same result, but it puts a working
credential in readable storage. A provider in `RootProvider` would also work; the map is smaller and
needs no root changes. Say the word if you prefer either.

With that in place every flow reveals the key inline, once, as the direct result of the action taken:

- **New user, tick "Enable API Key" before the first save** — the server generates (rule 4), the
  field captures the value from the create response, and it is still displayed after the redirect to
  the new document.
- **Existing user without keys, tick and save** — generated on save, revealed in place. No
  navigation happens at all.
- **Existing user with a key, press "Generate new"** — the endpoint returns the value and it is
  revealed in place, with no save and no navigation.
- **Any transport other than the Admin Panel** — the value is in the create/update response, or in
  the endpoint response.

The ordering assumption for the create flow — that the field renders once with the save response
before the route transition completes — holds because `startRouteTransition` keeps the current UI
mounted while the new route loads, and it is covered directly by the first e2e flow below.

### Component work

- The Admin Panel submits `apiKey` on every save, as it does every other field - form state
  cannot reliably be made to leave it out, and it does not need to be: the value it holds is the
  mask, which means "leave the key alone". An e2e test asserts that saving an unrelated field
  leaves the key working.
- `packages/ui/src/views/Edit/Auth/APIKey.tsx` — the client no longer generates anything, so the
  `uuid` dependency and the auto-fill-on-enable effect go away. Three states:
  1. **Value revealed** (from an endpoint response, `savedDocumentData.apiKey`, or the read-once
     handoff): show it with copy and show/hide controls, plus a new "copy this now, it will not be
     shown again" note.
  2. **`enableAPIKey` checked with no revealed value**: a masked, non-revealable indicator plus the
     generate button. No extra field is needed to detect this, because of the
     enabled-implies-a-key invariant from rule 5.
  3. **`enableAPIKey` unchecked**: renders nothing, as today.

  Keep selectors unambiguous for the e2e assertions: the `#apiKey` input exists **only** in state 1.
  State 2 renders a different element rather than a placeholder value in the same input, so
  `inputValue()` can never read a mask and mistake it for a key.
- Generate: confirmation modal (existing `GenerateConfirmation` copy) → `POST` the endpoint → reveal
  the returned value → `updateSavedDocumentData(doc)` so the form is not marked modified → success
  toast. Reuse the shape of PR #17982's `RegenerateAPIKeyButton`. The button is hidden before the
  first save, since there is no document to call it against, and hidden when the viewer cannot update
  the field.
- On the create view, before the first save, state 2 is replaced by a short description saying the
  key is created on save, so nothing implies a value is already there.
- `packages/ui/src/elements/APIKeyInput/index.tsx` gains a masked/"hidden" variant. The `plugin-mcp`
  API keys collection also uses this component — check its usage still renders.

## Migration script

New `packages/payload/src/auth/apiKeys/migrateToHash.ts`, exported from
`packages/payload/src/index.ts`, plus a thin CLI wrapper `payload migrate:api-keys`
(`packages/payload/src/cli/commands/migrate/apiKeys.ts`, cribbed from PR #17982).

```ts
migrateAPIKeysToHash({
  payload,
  batchSize = 100,
  collections, // defaults to every useAPIKey collection
  dryRun = false,
  secrets, // extra raw secrets to try, for a secret not in the keyring
}): Promise<{ failed: number; migrated: number; skipped: number }>
```

Behaviour:

- Operates at the database-adapter layer, so the field hooks do not interfere, and processes rows in
  batches per collection.
- Classifies each non-null `apiKey` value:
  - starts with `v1:` → ciphertext. Decrypt with the keyring (the auth tag makes a wrong key throw,
    so this is self-verifying), then write back `hashAPIKey(raw)`.
  - 64 hex characters and not decryptable → already a hash. Skip, which makes re-runs safe.
  - otherwise → pre-`v1` `aes-256-ctr` ciphertext. A wrong key returns garbage instead of throwing,
    so accept a decryption only when the result is printable ASCII of plausible length; try every
    keyring secret plus any explicitly passed `secrets`.
  - nothing verifies → leave the row untouched and count it in `failed`, reporting the collection and
    id. Fail-closed: a wrong decryption would hash garbage and destroy the key for good.
- `dryRun` classifies and reports without writing.
- `apiKeyIndex` is left alone: the field is gone from the config, so it is dropped by the generated
  schema migration on Postgres/SQLite, and is a harmless leftover property on MongoDB.

Documented as a migration, the same way `rotateSecret` is:

```ts
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const { failed, migrated, skipped } = await migrateAPIKeysToHash({ payload })
  payload.logger.info(`API keys: migrated ${migrated}, skipped ${skipped}, failed ${failed}`)
}
```

Until it runs, existing keys do not authenticate — the auth path matches hashes only. Deploy, migrate,
done; nothing has to be reissued.

`rotateSecret` (`packages/payload/src/auth/rotateSecret.ts`) is reworked: its API key branch
delegates to `migrateAPIKeysToHash` instead of re-keying ciphertext and HMAC indexes under the new
secret, which after this change would leave a row still unable to authenticate. `oldSecret` becomes
optional — only needed when the old secret is not in the keyring. The `{ migrated, skipped }` result
shape is kept.

## Behaviour and breaking changes

| Change                                                                                          | Impact                                                      |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Existing keys do not authenticate until `migrateAPIKeysToHash` has run.                         | Breaking, but a one-step migration. No key needs reissuing. |
| Reads no longer return `apiKey`, except in the response that created or generated it.           | Breaking for anything that reads a key back later.          |
| The Admin Panel cannot display an existing key; the options are copy-on-generate or regenerate. | Expected consequence of one-way storage.                    |
| `enableAPIKey: true` with no key now generates one.                                             | New behaviour; previously it saved with no key.             |
| `apiKeyIndex` removed; `api_key` is now indexed.                                                | Postgres/SQLite projects need a generated schema migration. |
| `rotateSecret` converts API keys to hashes instead of re-keying them.                           | Rotation has nothing left to do for keys already hashed.    |
| Rotating `PAYLOAD_SECRET` no longer affects API keys.                                           | The point of the change.                                    |

Unaffected: the `Authorization: {slug} API-Key {key}` header format, `enableAPIKey`,
`disableLocalStrategy`, access control behaviour, password logins, JWT sessions.

## Implementation order

Tests first in each phase, run and confirmed failing before the code change lands.

### Phase 1 — hashing, write rules, auth

1. `packages/payload/src/auth/apiKeys/hash.spec.ts`: deterministic; independent of `payload.secret`;
   64 hex characters; distinct inputs give distinct hashes.
2. Int tests in `test/auth/int.spec.ts` (new `describe`), against the existing `api-keys` collections:
   - creating with a supplied key stores `sha256(key)` in the raw row (via `payload.db.findOne`) and
     that key authenticates.
   - creating with `enableAPIKey: true` and no key returns a generated key that authenticates.
   - a row seeded at the database layer with only a hash authenticates — proving no secret is involved.
   - `apiKey` reads back as `null` from `findByID`, `find`, REST `GET` and `/me`; the create response
     is the only place the value appears.
   - saving an unrelated field keeps the key working (rule 5).
   - `apiKey: null` revokes (rule 3); `enableAPIKey: false` revokes (rule 1).
   - a bulk `update` that enables keys on several documents gives each its own key, and each
     document's response carries its own value.
   - field-level `update` access denial on `apiKey` leaves the stored hash unchanged.
   - a row seeded in the pre-hash format does not authenticate.
3. Code: `hash.ts`, `generateAPIKey()`, rewritten `baseFields/apiKey.ts`, `strategies/apiKey.ts`, the
   optional failed-auth warning, and the `apiKey`/`apiKeyIndex` JSDoc on the typed user fields in
   `packages/payload/src/index.ts` (~L307-317).
4. Regenerate types for affected suites (`pnpm run dev:generate-types auth`, plus `fields`,
   `plugin-mcp`, `plugin-stripe`, `types`, `v4` — whichever declare `apiKeyIndex`).

### Phase 2 — generate endpoint

1. Int tests: returns a new key once and the old key stops working; the new key authenticates; `403`
   without collection `update` access; `403` when field-level `update` access denies `apiKey`; `404`
   for an unknown id; route absent for a collection without `useAPIKey`; `403` unauthenticated; sets
   `enableAPIKey` when it was off.
2. Code: `auth/endpoints/generateAPIKey.ts`, registration in `auth/endpoints/index.ts` and
   `collections/config/sanitize.ts`.

### Phase 3 — Admin Panel

1. e2e flows in `test/auth/e2e.spec.ts` — see "End-to-end coverage" below for the full matrix and
   the collection it runs against.
2. Code: `views/Edit/Auth/APIKey.tsx`, `views/Edit/Auth/index.tsx`, `elements/APIKeyInput`, the
   read-once handoff map, a new generate button element, `elements/GenerateConfirmation`, client
   exports for anything new.
3. Translations: new keys for the copy-once warning and the masked state, added to
   `packages/translations/src/languages/en.ts` first, then `pnpm run translateNewKeys`.

#### End-to-end coverage

Every assertion that a key "works" goes through one collection built so that **only** API key
authentication can reach it — a browser session, auto-login, or a broad read rule must not be able to
produce a passing result by accident. New in `test/auth/config.ts`, slug `api-key-only`:

```ts
{
  slug: apiKeyOnlySlug,
  access: {
    // A 200 here can only mean the API key authenticated: no password login exists on this
    // collection, and the rule refuses any other strategy, including the admin session.
    read: ({ req: { user } }) =>
      user?.collection === apiKeyOnlySlug && user?._strategy === 'api-key'
        ? { id: { equals: user.id } }
        : false,
  },
  auth: { disableLocalStrategy: true, useAPIKey: true },
  fields: [{ name: 'label', type: 'text' }], // an unrelated field, for the "save something else" flow
}
```

Requests are made with `fetch` from the test process, which carries no browser cookies, sending only
`Authorization: {slug} API-Key {key}`. A shared helper asserts a key both works and does not, so
every flow below gets the same rigour: `expectAPIKeyWorks(key)` (200, and the returned document id is
the expected user) and `expectAPIKeyRejected(key)` (no user / 403).

Flows, each starting from a fresh document:

1. **Enabled during create, before the first save.** Go to the create view, tick "Enable API Key",
   save. The revealed value is visible after the redirect to the new document; it authenticates; the
   document id it returns is the newly created user. This is the flow that proves the read-once
   handoff survives `router.push`.
2. **Enabled on an existing user that had no key.** Create the user through the Local API with no
   key, open it, confirm nothing is revealed and no key authenticates yet, tick the box, save. The
   revealed value authenticates.
3. **Regenerated on an existing user that already has a key.** Starting from the key revealed in
   flow 2, press "Generate new API key" and confirm. The new value is revealed, differs from the
   previous one, authenticates, and the previous one is now rejected. The form is not left in a
   modified state, so no save is required to keep it.
4. **Unchecking revokes.** Untick the box, save. The previously working key is rejected, and the
   value area is no longer rendered.
5. **Rechecking after a revoke issues a different key.** Continuing from flow 4, tick the box again
   and save. A value is revealed, it differs from the revoked one, it authenticates, and the revoked
   one is still rejected.
6. **Unchecking and rechecking without saving in between.** With a working key, untick, tick again,
   then save. The original key still authenticates — the round trip is a no-op (rule 5), not a
   rotation and not a revoke.
7. **Saving an unrelated field.** Change `label` and save. The key still authenticates. This is the
   regression test for the Admin Panel never submitting `apiKey`.
8. **Nothing is revealed on a later visit.** After any reveal, reload the document. The `#apiKey`
   input is absent, the masked indicator is shown, and the key still authenticates.
9. **Negative controls**, so a pass in the flows above cannot come from ambient access: a request
   with no `Authorization` header is rejected; a request with a made-up key is rejected; and a
   request that forwards the Playwright browser context's cookies but no API key is also rejected.
10. **Field-level access.** The existing `api-keys-with-field-read-access` expectations still hold,
    and the generate button is absent for a viewer without update access to the field.

Flows 2 to 8 run against the same document in sequence where that is cheaper, but each asserts its
own preconditions so a failure points at one behaviour.

### Phase 4 — migration script

1. Int tests: converts a `v1` row so the original key authenticates again; converts a pre-`v1`
   `aes-256-ctr` row; converts a row encrypted under a `previousSecrets` entry; converts one whose
   secret is passed only via `secrets`; idempotent on a re-run; `dryRun` writes nothing; a row that
   verifies under no secret is left untouched and counted in `failed`.
2. Rewrite the existing `rotateSecret` int tests (`test/auth/int.spec.ts` ~L2233 onwards) — they
   currently assert re-keying and will now assert conversion.
3. Code: `auth/apiKeys/migrateToHash.ts`, CLI wrapper, reworked `auth/rotateSecret.ts`, exports in
   `packages/payload/src/index.ts` and `exports/cliBuiltin.ts`.

### Phase 5 — docs

- `docs/authentication/api-keys.mdx`: replace the "encrypted within the database" section and the
  "if you change your `PAYLOAD_SECRET` you must regenerate" warning. Document one-way storage,
  copy-once, generation on create, the generate endpoint, the entropy expectation for supplied keys,
  and that reads no longer return the key.
- `docs/authentication/rotating-secret.mdx`: API keys are no longer affected by rotation; rewrite the
  `rotateSecret` section.
- New section (or page) for the migration: the recipe above, plus the CLI command.
- Check `docs/rest-api/overview.mdx` for the auth endpoint table and add the generate route.
- Upgrade notes for the PR description: run the migration, reads no longer return the key,
  `apiKeyIndex` removed, `rotateSecret` semantics.

## Verification

- `pnpm test:int auth` (MongoDB), then `pnpm test:int:postgres auth` and `pnpm test:int:sqlite auth`
  for the dropped column and the new index.
- `pnpm test:int fields plugin-mcp` — the mcp fixtures create API keys with supplied values.
- `pnpm test:e2e auth`, including the ten flows above.
- `pnpm test:types`, `pnpm lint`.
- `pnpm prepare-run-test-against-prod` then `pnpm dev:prod auth` if any new client component is added.

## Risks

- **Pre-`v1` ciphertext cannot be authenticated cryptographically**, so the migration verifies a
  recovered key against the stored `apiKeyIndex` where it is present, and otherwise requires the
  plaintext to be printable ASCII. A row that satisfies neither is left untouched and reported,
  never hashed on a guess.
- **`''` is a working value for "hidden"**, so a project that treated `apiKey: ''` as a revoke now
  gets a no-op. `null` still revokes, and that is what the docs point at.
- **Unsalted hash.** Fine for a 256-bit generated key; a caller who supplies a weak key gets weak
  protection if the database leaks. Documented, and both generation paths are high-entropy.
- **Rule 5 is gated by `enableAPIKey` access, not `apiKey` access** — a field hook cannot see the
  outcome of another field's access check. A project that must prevent key issuance should deny
  `update` on `enableAPIKey`. The generate endpoint has no such gap, since it writes `apiKey`
  explicitly and verifies the write landed.
