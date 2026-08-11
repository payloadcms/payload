# PAYLOAD_SECRET Rotation — Design

Date: 2026-08-05
Status: Design (pre-implementation). Delivered in two phases — Phase 1 (one-time
rotation, below) and Phase 2 (versioned envelope + bounded keyring, [Appendix A](#appendix-a--phase-2-versioned-envelope--bounded-keyring)).

## Problem

Projects need a supported way to rotate `PAYLOAD_SECRET` — read data that was
encrypted/derived under a previous secret and rewrite it under the new one —
without silently corrupting data or breaking authentication.

## What `PAYLOAD_SECRET` actually touches

`payload.secret` is derived once at init: `sha256(config.secret).hex.slice(0, 32)`
(`packages/payload/src/index.ts:922`). It is used in exactly these places:

| Use                            | Mechanism                       | Location                                                                     | Rotation behavior                             |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| Encrypted `apiKey` storage     | `aes-256-ctr` (reversible)      | `auth/crypto.ts`, `auth/baseFields/apiKey.ts:6,8`                            | Re-encryptable (decrypt old → encrypt new)    |
| API key lookup index           | `HMAC-SHA256(secret, rawKey)`   | `auth/strategies/apiKey.ts:16`, `auth/baseFields/apiKey.ts:84`               | Deterministic index — must be recomputed      |
| JWT sessions                   | `jose` HS256 signed with secret | `auth/jwt.ts:15`, `auth/strategies/jwt.ts:94`                                | Old tokens fail verification → users re-login |
| Password login (localStrategy) | `pbkdf2(password, perUserSalt)` | `auth/strategies/local/generatePasswordSaltHash.ts:54`, `authenticate.ts:19` | **Unaffected — secret is never an input**     |

Key takeaways that shape the design:

- **Password logins survive rotation untouched.** The hash is `pbkdf2(password, salt)`
  with a random 32-byte per-user salt stored on the doc. The secret is not an input.
- **Active JWT sessions are invalidated** on rotation (everyone re-logs-in). Expected.
- An API key is **two** secret-derived artifacts — the reversible `apiKey` ciphertext
  and the `HMAC` `apiKeyIndex` — that must be rotated together. The raw key is
  recoverable via `decrypt(oldSecret, apiKey)`, which lets us recompute both.

## Scope

In scope: one-time PAYLOAD_SECRET rotation.
Explicitly out of scope (decoupled, future work): multi-key API keys with expiry
(rotating the raw key value, independent of the secret).

## Part 1 — Utility surface

Extend the existing bound methods with an optional secret override, plus a
`reencrypt` convenience. Backwards compatible; `options` is optional.

```ts
// auth/crypto.ts — extract the derivation currently inlined at index.ts:922
const deriveKey = (secret: string) =>
  crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32)

export function encrypt(text: string, options?: { secret?: string }): string {
  const key = options?.secret ? deriveKey(options.secret) : this.secret
  // ...unchanged aes-256-ctr, random iv prepended as hex
}

export function decrypt(hash: string, options?: { secret?: string }): string {
  const key = options?.secret ? deriveKey(options.secret) : this.secret
  // ...unchanged
}

// convenience: decrypt-with-old → encrypt-with-current
export function reencrypt(
  hash: string,
  options: { oldSecret: string },
): string {
  return encrypt.call(
    this,
    decrypt.call(this, hash, { secret: options.oldSecret }),
  )
}
```

Decisions:

- `options.secret` is the **raw** `PAYLOAD_SECRET` string (same as env), derived internally.
- Exposing `decrypt(hash, { secret })` — not just `reencrypt` — is required because the
  apiKey migration needs the raw plaintext to recompute the HMAC index.
- Wire `payload.reencrypt` onto the instance the same way `encrypt`/`decrypt` are
  (`index.ts:139`). Opportunity to remove the `@ts-expect-error this.secret` lines.

## Part 2 — Canned migration: `rotateSecret`

Scoped narrowly to the **built-in `apiKey` fields**. This is the one place a
hand-rolled migration silently corrupts data, because:

1. **Hook trap.** `payload.find`/`payload.update` triggers `afterRead: decryptKey`
   (decrypts with the _new_ secret → CTR garbage, **no error**) and
   `beforeChange: encryptKey` (re-encrypts the garbage). Must use `payload.db.*` to
   bypass field hooks.
2. **Coupled hidden index.** `apiKeyIndex` is `hidden: true, admin.disabled`
   (`baseFields/apiKey.ts:66-70`); easy to re-encrypt `apiKey` and forget it.
3. **Internal derivation** (`createHmac('sha256', secret)`, sha256/slice) should not
   be reverse-engineered by users.
4. **Idempotency + verification via the index** (below) — non-obvious.

Custom project-owned encrypted fields are _not_ handled by the canned migration —
they are covered by docs + the Part-1 primitives (`reencrypt`).

### Signature

```ts
import { rotateSecret } from 'payload'

const { migrated, skipped } = await rotateSecret({
  payload,
  oldSecret: process.env.OLD_PAYLOAD_SECRET, // new secret is already payload.config.secret
  collections, // optional: default = all auth collections with useAPIKey
  batchSize = 100,
  dryRun = false,
})
```

### Per-document algorithm (all at the `payload.db.*` layer)

```
for each auth collection where auth.useAPIKey:
  page through payload.db.find({ where: { apiKey: { exists: true } } })  // raw ciphertext
  for each doc with a stored apiKey:
    raw = decrypt(doc.apiKey, { secret: oldSecret })

    if HMAC(oldSecret, raw) === doc.apiKeyIndex:          // confirmed old-secret row
       newApiKey = encrypt(raw)                            // current secret
       newIndex  = HMAC(newSecret, raw)
       if !dryRun: payload.db.updateOne({ data: { apiKey: newApiKey, apiKeyIndex: newIndex } })
       migrated++
    else if HMAC(newSecret, decrypt(doc.apiKey, {secret:newSecret})) === doc.apiKeyIndex:
       skipped++                                           // already migrated — safe re-run
    else
       throw   // wrong oldSecret or external corruption — ABORT, never write
```

### Properties

- **Bypasses hooks** (`db.find`/`db.updateOne`) → no silent corruption.
- **Idempotent** — index cross-check makes a re-run skip already-migrated rows.
- **Fail-closed, abort-on-mismatch** — each row is verified against the old and current
  secrets _before_ it is written; a row matching neither throws and stops the run, so a
  wrong `OLD_PAYLOAD_SECRET` is caught immediately and is never written.
- **No wrapping DB transaction** (implementation deviation — see below). `dryRun: true`
  is the verify-only pass to run first.

### Implementation note: no wrapping transaction

The original design wrapped the whole run in a DB transaction for clean rollback. During
implementation this proved to be the wrong tool: a single long-lived transaction around a
multi-page cursor with interleaved writes triggered Mongo session/txn-number races, and
Mongo's ~60s / size transaction limits would fail on exactly the large auth collections
rotation targets. It was dropped in favor of the safety the migration already has:

- Per-row verification means a bad row is never written even without a transaction.
- Idempotency means a run aborted midway (or by a crash) is safe to re-run — migrated
  rows are skipped. Rows migrated before an abort remain migrated and correct.

Net: the fail-closed guarantee is preserved; only "atomic rollback of earlier rows" is
replaced by "safe, idempotent re-run." This is also more scalable for large collections.

### Decisions

- `oldSecret` passed as a **param** (works from scripts and migration files).
- Mismatch → **abort (throw)** before writing that row; earlier migrations are safe to
  keep and a re-run resumes idempotently.
- Delivered as an **exported `rotateSecret` util**, documented as run inside a
  Payload migration file's `up()` (`payload migrate:create rotate-secret`).

## Part 3 — Documentation

New "Rotating your PAYLOAD_SECRET" page (Authentication / Security):

1. **When & why** — leak response, periodic rotation policy. One-time, deliberate op.
2. **What rotation affects** — the map above: password logins keep working (✅),
   JWT sessions invalidated (⚠️ expected), encrypted `apiKey`/`apiKeyIndex` migrated (🔧).
3. **Procedure** — keep old secret as `OLD_PAYLOAD_SECRET`, set new as `PAYLOAD_SECRET`;
   `payload migrate:create rotate-secret` calling `rotateSecret` in `up()`; run with
   `dryRun: true` first; `payload migrate`; then remove `OLD_PAYLOAD_SECRET`.
4. **Custom encrypted fields** — DIY with `reencrypt(value, { oldSecret })` inside a
   `db.*` loop, with the "bypass your own hooks" warning.
5. **API reference** — `encrypt(text, options?)`, `decrypt(hash, options?)`,
   `reencrypt(hash, { oldSecret })`, `rotateSecret(args)`.

## Implementation checklist

- [ ] Extract `deriveKey`; add `options?` to `encrypt`/`decrypt`; add `reencrypt`; drop `@ts-expect-error`.
- [ ] Wire `payload.reencrypt` onto the instance; update types.
- [ ] Implement `rotateSecret` util (db-layer, transactional, idempotent, abort-on-mismatch).
- [ ] Export `rotateSecret` from `payload`.
- [ ] Integration tests: rotation happy path, re-run idempotency, wrong-old-secret abort,
      dryRun counts, API key auth works post-rotation, password login unaffected.
- [ ] Docs page.

## Appendix A — Phase 2: versioned envelope + bounded keyring

### Keyring feasibility & security findings

A keyring (`secret: string | string[]`, `[0]` signs/writes, the rest are accepted)
is feasible but with one hard technical wall and one policy boundary.

- **JWT verify** — try each key, sign with active. O(N), safe.
- **API key lookup** — compute `HMAC(sᵢ, raw)` under every secret, query
  `apiKeyIndex: { in: [...] }`. Safe (index is exact-match).
- **Generic `encrypt` at rest** — **unsafe with the legacy CTR format**: CTR is
  unauthenticated, so trial-decrypt under the wrong key returns _silent garbage_.
  This is what the versioned envelope fixes.
- **Self-defeating "indefinite"** — new data is always written under the active key;
  old data is never rewritten. Retiring any key still requires the re-encrypt
  migration. The keyring defers migration; it does not remove it.

**Security posture:** an _indefinite_ keyring is an anti-pattern — every key is a live
credential; keeping old keys valid forever forfeits rotation's blast-radius control
(NIST SP 800-57: keys should have a bounded crypto-period and be retired). A **bounded
overlap window** (accept `[new, old]` during a rotation, then drop `old`) is best
practice and delivers zero-downtime rotation (no forced mass logout; migrate lazily).
Design the mechanism for overlap, never market it as permanent.

### Versioned envelope format (v1)

Replaces the raw-hex CTR format for all newly-written values:

```
v1:<keyId>:<ivHex>:<authTagHex>:<ciphertextHex>
```

| Part         | Bytes | Hex | Purpose                                                                 |
| ------------ | ----- | --- | ----------------------------------------------------------------------- |
| `v1`         | —     | —   | Scheme discriminator (implies cipher + KDF)                             |
| `keyId`      | 8     | 16  | `sha256(keyV1).slice(0,16)` — one-way, non-secret, position-independent |
| `iv`         | 12    | 24  | GCM 96-bit nonce, random per encryption                                 |
| `authTag`    | 16    | 32  | GCM tag; `final()` throws on wrong key / tamper                         |
| `ciphertext` | var   | var | —                                                                       |

Decisions: **aes-256-gcm** (AEAD — makes multi-key trial-decrypt safe);
**derived-fingerprint keyId** (zero config, order-independent); **fixed KDF** — v1
derives a true 32-byte key via HKDF, correcting the legacy ~128-bit effective entropy
(`sha256(secret).hex.slice(0,32)`). Delimited hex (not packed base64) to match the
existing convention and stay debuggable.

```ts
const deriveKeyV1 = (secret: string): Buffer =>
  Buffer.from(crypto.hkdfSync('sha256', secret, '', 'payload-secret-v1', 32))
const keyId = (keyV1: Buffer): string =>
  crypto.createHash('sha256').update(keyV1).digest('hex').slice(0, 16)
const deriveKeyLegacy = (
  secret: string,
): string => // unchanged, legacy reads only
  crypto.createHash('sha256').update(secret).digest('hex').slice(0, 32)
```

### Dispatch & backwards compatibility

`decrypt` detects the format for free: legacy values are pure hex (no `:`), v1 starts
with `v1:`. `encrypt` always writes v1. Legacy values upgrade to v1 lazily on any
re-encrypt — so `rotateSecret` / the DIY `reencrypt` loop double as a **format upgrade**.

- v1: parse envelope → `byId[keyId]` selects key O(1) → GCM verifies.
- legacy CTR under a keyring: unsafe to trial-decrypt generically. For the **apiKey**
  field, `apiKeyIndex` HMAC disambiguates. For **generic fields**, upgrade legacy→v1
  before relying on multi-key.

### Rollout concerns

- **Format bump** — a Payload version that writes v1 produces data an _older_ Payload
  cannot read. Downgrade-after-write is a breaking change; call out in release notes.
- Phase 2 changes `encrypt`/`decrypt` themselves; sequence after Phase 1 so the simple
  one-time rotation ships first and unblocks users.
- Legacy KDF and v1 KDF coexist, version-gated — a single secret has two derived keys.

### Phase 2 decisions

- Cipher: **aes-256-gcm** · Key id: **derived fingerprint** · KDF: **fixed (HKDF, 32 bytes) in v1**
- Keyring: **bounded overlap only** (active writer + accepted readers), paired with
  `rotateSecret` to retire old keys — never documented as indefinite.
- Config shape: **`previousSecrets: string[]`** (active `secret` unchanged); v1 envelope
  **default-on** for new writes.

### Phase 2 implementation notes

- **Keyring** (`buildEncryptionKeyring` in `auth/crypto.ts`) is built at init from
  `[config.secret, ...config.previousSecrets]` and attached as `payload.encryptionKeyring`
  (`{ active, all, byId }`). `payload.secret` stays the active _legacy_ derived key for
  backwards compatibility (plugins that `createHmac(..., payload.secret)`).
- **Keyring reads** wired into two call sites: JWT verify tries each key
  (`verifyWithKeyring` in `strategies/jwt.ts`); API-key lookup queries
  `apiKeyIndex: { in: [HMAC(key, apiKey) for each keyring key] }` (`strategies/apiKey.ts`).
  Writes (JWT sign, index write) still use the active secret only.
- **GCM fail-loud is a real behavior change from legacy CTR.** A v1 value whose `keyId`
  is not in the keyring, or a wrong-key/ tampered value, now **throws** on decrypt instead
  of returning garbage. Consequences:
  - The `apiKey` field's `afterRead` decrypt throws if the value was encrypted under a
    secret no longer in the keyring — so during a rotation the previous secret must be in
    `previousSecrets` until `rotateSecret` has re-keyed the data (this is the intended,
    zero-downtime flow).
  - `rotateSecret` no longer relies on CTR's garbage-return to classify rows; it wraps
    decrypt attempts (`tryDecrypt`) and treats a throw as "does not match this secret,"
    falling through to the HMAC-index check. Correctness still rests on the HMAC index.

### Phase 2 checklist

- [x] `deriveKeyV1` (HKDF), `keyIdFor`, `buildEncryptionKey`/`buildEncryptionKeyring`, key types.
- [x] `encrypt` writes `v1:keyId:iv:authTag:ciphertext` (aes-256-gcm); `decrypt` dispatches v1/legacy.
- [x] `payload.encryptionKeyring` built at init; `previousSecrets` on the config type.
- [x] Keyring in JWT verify + API-key lookup.
- [x] Tests: v1 round-trip, legacy CTR back-compat, GCM tamper, unknown-keyId throw, keyring
      API-key auth, reencrypt upgrades key id. 94/94 on Mongo + Postgres.
- [x] Docs: zero-downtime `previousSecrets` flow + v1 format note (`docs/authentication/rotating-secret.mdx`).

### Phase 2 review fixes (applied)

- **apiKey `afterRead` masks instead of crashing** (`baseFields/apiKey.ts`): decrypt failures
  (unknown keyId after a `previousSecret` was removed) are caught and the field returns
  `null` (not `undefined`, which afterRead treats as "no change" and would leak ciphertext),
  so one un-rekeyed row no longer 500s an entire collection read.
- **Legacy CTR branch documented** (`crypto.ts`): comment explains it is intentionally
  active-key-only (CTR can't verify a key), so a legacy value under a previous secret reads
  as garbage until `rotateSecret` upgrades it to authenticated v1. API-key auth is unaffected.
- **Malformed v1 envelope** now throws a clear error (segment-count check) rather than a
  generic `TypeError`.
- **Coverage added**: JWT signed under a `previousSecret` verifies (and an unknown secret is
  rejected); `rotateSecret` re-keys a real legacy aes-256-ctr row and upgrades it to v1; an
  undecryptable apiKey is masked (not thrown) through a real `findByID`.
- **Docs**: noted that a hand-written `reencrypt` loop is not automatically idempotent
  (unlike `rotateSecret`), plus an "Encryption format" section.
- Deferred by design (low impact, noted in review): legacy garbage-on-read for un-migrated
  rows during the window (documented, not code-fixable without the HMAC index); other
  `payload.secret` consumers (staged-upload token, telemetry) stay active-key-only.
