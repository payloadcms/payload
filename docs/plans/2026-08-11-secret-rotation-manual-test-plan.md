# PAYLOAD_SECRET Rotation — Manual Test Plan (3.x → 4.0)

**Goal:** Verify that data encrypted under Payload 3.x (legacy `aes-256-ctr`, API keys)
survives an upgrade to `4.0.0-internal.e38d3ac` and a full `PAYLOAD_SECRET` rotation.

**Design reference:** `docs/plans/2026-08-05-payload-secret-rotation-design.md`

**How to report:** Execute each numbered step in order. After every step output a line:
`STEP <n>: PASS | FAIL — <what you observed>`. Paste the actual value/counts/errors you
saw, not a paraphrase. Stop and report if a PASS-gated step fails.

---

## Fixtures (use these exact values)

- Old secret: `OLD-secret-aaaaaaaaaaaaaaaa`
- New secret: `NEW-secret-bbbbbbbbbbbbbbbb`
- Custom plaintext to encrypt: `hunter2-plaintext`
- API user: `apiuser@example.com` / password `test1234`

---

## Phase A — Set up a Payload 3.x project with data

1. Scaffold a fresh 3.x project (`npx create-payload-app@3`, MongoDB, blank template) with
   `PAYLOAD_SECRET=OLD-secret-aaaaaaaaaaaaaaaa`. Confirm `payload` in `package.json` is a
   3.x version. **Report the exact 3.x version installed.**

2. Add an **auth collection with API keys** — `Users` (or the default users collection) with
   `auth: { useAPIKey: true }`.

3. Add a **custom collection with an encrypted field** — `Secrets`, with a `text` field
   `value` whose hooks encrypt at rest using the built-in helpers:

   ```ts
   fields: [
     {
       name: 'value',
       type: 'text',
       hooks: {
         beforeChange: [
           ({ value, req }) => (value ? req.payload.encrypt(value) : value),
         ],
         afterRead: [
           ({ value, req }) => (value ? req.payload.decrypt(value) : value),
         ],
       },
     },
   ]
   ```

4. Boot the app (`pnpm dev` / `next dev`) and seed, **recording every value you get back**:

   - a. Create the API user; enable API key and **save the generated raw API key** (call it
     `RAW_KEY`).
   - b. `POST /api/secrets` with `{ "value": "hunter2-plaintext" }`. Read it back via the API
     and confirm `value` === `hunter2-plaintext`.
   - c. **Inspect the raw DB** (e.g. `mongosh`, the `users` + `secrets` collections). Record
     the raw stored `apiKey`, `apiKeyIndex`, and `secrets.value`. Confirm they are **plain
     hex with no `v1:` prefix** (legacy `aes-256-ctr` format). Report the first ~20 chars of each.

5. Confirm both auth paths work on 3.x:
   - a. Password login: `POST /api/users/login` → returns a token. **Save this token** (`OLD_JWT`).
   - b. API-key auth: `GET /api/users/me` with header
     `Authorization: users API-Key <RAW_KEY>` → returns the user (not 401).

**Gate:** Do not proceed unless 4b, 5a, 5b all pass and 4c shows legacy (non-`v1:`) format.

---

## Phase B — Upgrade to the pre-release (same secret, no rotation yet)

6. Stop the server. Upgrade **all `@payloadcms/*` packages and `payload`** to
   `4.0.0-internal.e38d3ac` (keep the DB adapter package on the matching version). Leave
   `PAYLOAD_SECRET` unchanged (`OLD-secret-…`). Reinstall, rebuild, reboot. Report any
   install/build/boot errors.

7. **Baseline read after upgrade (critical — proves back-compat):**
   - a. `GET /api/secrets/<id>` → `value` must still be `hunter2-plaintext` (4.0 decrypts the
     legacy `aes-256-ctr` value under the active key).
   - b. API-key auth (`Authorization: users API-Key <RAW_KEY>`) → still returns the user.
   - c. Password login still works.

**Gate:** All of step 7 must PASS. This is the "upgrade is non-breaking" guarantee.

---

## Phase C — Rotate the secret

8. Configure the keyring for rotation:

   - Set env `PAYLOAD_SECRET=NEW-secret-bbbbbbbbbbbbbbbb`.
   - Add the old secret to config so reads still work during the window:
     ```ts
     // payload.config.ts
     previousSecrets: [process.env.OLD_PAYLOAD_SECRET].filter(Boolean),
     ```
     and set env `OLD_PAYLOAD_SECRET=OLD-secret-aaaaaaaaaaaaaaaa`. Reboot.

9. **Reads during the overlap window, before running any migration:**

   - a. API-key auth (`RAW_KEY`) → **still returns the user** (the HMAC index lookup is
     keyring-aware and tries every secret). Report PASS/FAIL.
   - b. `GET /api/secrets/<id>` → `value` is now **garbage** (not `hunter2-plaintext`).
     This is the **documented, expected** limitation: legacy `aes-256-ctr` is decrypted with
     the active key only, so an old-secret value reads as garbage until re-encrypted.
     Report the garbage value you got. (PASS = you observed garbage, not the plaintext.)

10. **Rotate the built-in API keys with `rotateSecret` — dry run first.** Create and run a
    Payload migration (or a one-off script with a booted `payload`):

    ```ts
    import { rotateSecret } from 'payload'
    const res = await rotateSecret({
      payload,
      oldSecret: process.env.OLD_PAYLOAD_SECRET,
      dryRun: true,
    })
    console.log(res)
    ```

    Expect `{ migrated: 1, skipped: 0 }` (the one API user). Confirm the raw DB `apiKey` is
    **unchanged** (dry run writes nothing). Report the counts.

11. **Rotate for real** (`dryRun: false`). Expect `{ migrated: 1, skipped: 0 }`. Then inspect
    the raw DB: `users.apiKey` now starts with `v1:` and `apiKeyIndex` changed. Report both.

12. **API-key auth still works after rotation:** `Authorization: users API-Key <RAW_KEY>` →
    returns the user. (The raw key is unchanged; only its at-rest encryption + index rotated.)

13. **Idempotent re-run:** run `rotateSecret` (real) again → expect `{ migrated: 0, skipped: 1 }`.
    Report counts.

14. **Fail-closed on wrong old secret:** run `rotateSecret({ ..., oldSecret: 'WRONG-secret-xxxx' })`.
    Expect it to **throw and abort** (a row matches neither old nor current secret). Report the
    error. Confirm the DB row was **not** corrupted (step 12 still passes afterward).

15. **Migrate the custom encrypted field (DIY loop — not covered by `rotateSecret`).** Run a
    db-layer loop that bypasses the field hooks and re-encrypts with `reencrypt`:

    ```ts
    const { docs } = await payload.db.find({
      collection: 'secrets',
      limit: 1000,
      pagination: false,
    })
    for (const doc of docs) {
      if (!doc.value) continue
      const value = payload.reencrypt(doc.value, {
        oldSecret: process.env.OLD_PAYLOAD_SECRET,
      })
      await payload.db.updateOne({
        collection: 'secrets',
        id: doc.id,
        data: { value },
      })
    }
    ```

    Then `GET /api/secrets/<id>` → `value` === `hunter2-plaintext` again. Inspect raw DB:
    `secrets.value` now starts with `v1:`. Report both.

16. **Retire the old secret.** Remove `previousSecrets` (empty it) and unset `OLD_PAYLOAD_SECRET`.
    Reboot. Verify:

    - a. `GET /api/secrets/<id>` → still `hunter2-plaintext` (re-keyed in step 15).
    - b. API-key auth (`RAW_KEY`) → still returns the user.

17. **Session invalidation (expected behavior).** Call `GET /api/users/me` with the old
    `Authorization: JWT <OLD_JWT>` from step 5a → expect **401 / rejected** (signed under the
    old secret). Then log in again with password → new token works. Report both.

**Gate:** 16a, 16b PASS and 17 shows old JWT rejected + fresh login works.

---

## Summary to report

Fill this table at the end:

| Property                                           | Expected                                    | Result |
| -------------------------------------------------- | ------------------------------------------- | ------ |
| 3.x data is legacy format                          | no `v1:` prefix                             |        |
| Upgrade is non-breaking (same secret)              | reads + both auth paths work                |        |
| API-key auth survives overlap window pre-migration | works via keyring                           |        |
| Legacy custom field reads garbage in window        | garbage (documented)                        |        |
| `rotateSecret` dryRun                              | `{migrated:1, skipped:0}`, no DB write      |        |
| `rotateSecret` real                                | `{migrated:1, skipped:0}`, `apiKey` → `v1:` |        |
| API-key auth after rotation                        | works                                       |        |
| `rotateSecret` idempotent re-run                   | `{migrated:0, skipped:1}`                   |        |
| Wrong old secret                                   | throws, aborts, no corruption               |        |
| `reencrypt` custom field                           | plaintext restored, value → `v1:`           |        |
| After retiring old secret                          | all reads still work                        |        |
| Old JWT after rotation                             | 401, re-login works                         |        |

Note anything surprising, any stack traces, and the exact package version string resolved
for `payload` in both phases.
