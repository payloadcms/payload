# PRD — PAYLOAD_SECRET Rotation & Key Management

Date: 2026-08-05
Author: exploration session (Dan Ribbens + Claude)
Companion design doc: [`2026-08-05-payload-secret-rotation-design.md`](./2026-08-05-payload-secret-rotation-design.md)
Status: Requirements agreed; implementation not started.

---

## 1. Summary

Payload derives one symmetric key from `PAYLOAD_SECRET` and uses it to encrypt
sensitive data at rest (API keys), index API keys for lookup, and sign JWT sessions.
There is currently **no supported way to rotate `PAYLOAD_SECRET`** — a project that
leaks its secret, or wants a periodic rotation policy, has no path to re-key existing
data without hand-writing a migration that (as we found) silently corrupts data.

This document captures the problem, the exploration that shaped the solution, the
requirements we agreed on, and the alternatives we rejected and why.

## 2. Motivation

- **Incident response:** a leaked `PAYLOAD_SECRET` should be recoverable by rotating,
  not by abandoning the deployment.
- **Compliance/policy:** many orgs mandate periodic key rotation with bounded key
  crypto-periods (NIST SP 800-57).
- **Correctness/safety:** the "obvious" DIY rotation corrupts every API key with no
  error (see §4.2). Users need a supported, safe primitive.

## 3. How we got here (exploration narrative)

The session started from a single question on `packages/payload/src/auth/crypto.ts`:
_"If we have `payload.secret`, can we decrypt data encrypted under a previous secret
and rewrite it under the new one?"_ Working outward from that:

1. **Mapped what the secret actually touches.** Grepped every use of `payload.secret`.
   Result: reversible encryption (apiKey), an HMAC lookup index (apiKey), JWT signing,
   and — critically — **not** password hashing.
2. **Surfaced the "two rotations" insight.** The user asked how rotation affects
   username/password login. Answer: it doesn't — passwords are `pbkdf2(password, salt)`
   with a random per-user salt; the secret is never an input. This separated _secret
   rotation_ (re-key derived data) from _API-key-value rotation_ (change the raw key),
   which are orthogonal.
3. **Scoped down deliberately.** Decided to ship _only_ PAYLOAD_SECRET rotation now and
   defer multi-key API keys with expiry as independent future work.
4. **Found the corruption trap.** A hand-rolled Local-API migration silently destroys
   API keys because of the field's own `afterRead`/`beforeChange` hooks — which
   justified a canned, db-layer migration over "let users do it."
5. **Pressure-tested "keep multiple secrets forever."** Found it feasible for JWT and
   API-key lookup, but unsafe for generic encrypted data under the unauthenticated CTR
   cipher, and a security anti-pattern as a _permanent_ policy.
6. **Designed the enabler.** A versioned, authenticated (GCM) envelope with a key-id
   fingerprint makes multi-key-at-rest safe and unlocks _bounded_ zero-downtime
   rotation, while fixing a latent KDF entropy weakness.

## 4. Key findings

### 4.1 What `PAYLOAD_SECRET` touches

| Use                  | Mechanism                       | Rotation behavior            |
| -------------------- | ------------------------------- | ---------------------------- |
| Encrypted `apiKey`   | `aes-256-ctr` (reversible)      | Re-encryptable               |
| API key lookup index | `HMAC-SHA256(secret, rawKey)`   | Must be recomputed           |
| JWT sessions         | `jose` HS256                    | Invalidated → users re-login |
| Password login       | `pbkdf2(password, perUserSalt)` | **Unaffected**               |

### 4.2 The silent-corruption trap

The `apiKey` field has `afterRead: decryptKey` and `beforeChange: encryptKey`. A
`payload.find` → `payload.update` migration decrypts with the _new_ secret (CTR yields
garbage, **no error**) then re-encrypts the garbage. Correct rotation must bypass field
hooks via `payload.db.*` and move the coupled hidden `apiKeyIndex` in lockstep.

### 4.3 CTR is unauthenticated

`aes-256-ctr` has no auth tag, so wrong-key decryption returns plausible garbage
silently. This is the root reason multi-key-at-rest is unsafe today and why Phase 2
moves to `aes-256-gcm`.

## 5. Requirements

### 5.1 Functional — Phase 1 (one-time rotation)

- **FR-1** `encrypt`/`decrypt` accept an optional `{ secret }` override (raw secret,
  derived internally). Backwards compatible.
- **FR-2** New `payload.reencrypt(hash, { oldSecret })` = decrypt-old → encrypt-current.
- **FR-3** New exported `rotateSecret({ payload, oldSecret, collections?, batchSize?,
dryRun? })` that re-keys built-in `apiKey` + `apiKeyIndex` at the `db.*` layer.
- **FR-4** `rotateSecret` is **idempotent** (re-run skips migrated rows via the HMAC
  index cross-check) and **fail-closed** (each row is verified before it is written; a
  row matching neither secret aborts the run without writing that row).
- **FR-5** `dryRun: true` verifies every row without writing. (No wrapping DB
  transaction — see design doc "Implementation note"; idempotency provides safe re-run
  instead, which also scales past Mongo's transaction size/time limits.)
- **FR-6** Documentation page covering when/why, what's affected (esp. "passwords keep
  working"), the migration-file procedure, custom-field DIY, and API reference.

### 5.2 Functional — Phase 2 (versioned envelope + bounded keyring)

- **FR-7** New writes use a `v1:keyId:iv:authTag:ciphertext` envelope with `aes-256-gcm`.
- **FR-8** `keyId` is a derived, non-secret fingerprint (`sha256(keyV1).slice(0,16)`).
- **FR-9** v1 keys use a fixed HKDF-based 32-byte derivation; legacy KDF retained for
  reading pre-v1 values.
- **FR-10** `decrypt` dispatches legacy (CTR) vs v1 (GCM) by format; `encrypt` always
  writes v1. Re-encrypt upgrades legacy → v1 lazily.
- **FR-11** `secret` may be `string | string[]`; index 0 is the active writer, the rest
  are accepted readers (JWT verify + API-key lookup iterate the keyring).

### 5.3 Non-functional

- **NFR-1 Safety:** no code path may silently corrupt data; wrong-key operations must be
  detectable (Phase 2 via GCM tag; Phase 1 via HMAC-index verification).
- **NFR-2 Backwards compatibility:** existing legacy-format values remain readable; the
  Phase-1 API additions are optional and non-breaking.
- **NFR-3 Security posture:** keyring supports only a **bounded overlap window**, paired
  with migration to retire old keys. Not documented as indefinite.
- **NFR-4 Release note:** v1 data is not readable by older Payload versions — a forward
  format bump; downgrade-after-write is breaking.

## 6. Scope

**In scope (now):** Phase 1 one-time rotation.
**In scope (sequenced next):** Phase 2 versioned envelope + bounded keyring.
**Out of scope:** multi-key API keys with per-key expiry (raw-key rotation); a generic
field-walker that auto-discovers every custom encrypted field (docs + primitives instead);
a `payload rotate-secret` CLI command (util-in-migration-file chosen instead).

## 7. Alternatives considered & rejected

| Alternative                                            | Why rejected                                                                                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Let users write their own rotation                     | Silent corruption via field hooks + coupled hidden index; too easy to get catastrophically wrong.                                                  |
| Transparent config-based rotation as the _only_ option | Bigger surface; users needed an unblock-now primitive first. Deferred into Phase 2 keyring.                                                        |
| Indefinite multi-secret keyring                        | Security anti-pattern — old keys stay live forever, forfeiting rotation's containment; also self-defeating (retiring a key still needs migration). |
| Keep `aes-256-ctr`, add HMAC (encrypt-then-MAC)        | Same guarantee as GCM but more moving parts; GCM is the modern default.                                                                            |
| Positional or user-labeled key IDs                     | Positional breaks on reorder; labels add config surface and a reuse footgun. Derived fingerprint is stable and zero-config.                        |
| Defer the KDF entropy fix                              | v1 is the natural, isolated place to correct ~128→256-bit effective key strength; version-gated so it's safe.                                      |
| CLI command for rotation                               | Heaviest surface for a one-time op; exported util in a migration file is tracked and transaction-aware.                                            |

## 8. Success criteria

- A project can rotate `PAYLOAD_SECRET` with a documented, single procedure and **zero
  data loss**; API key auth works before and after; password logins never break.
- Re-running the migration is safe (idempotent); a wrong old secret aborts cleanly.
- Phase 2: a bounded overlap window allows rotation with **no forced mass logout**, and
  old key material can be fully retired afterward.

## 9. Open questions / risks

- Migration wall-clock on very large auth collections (batch size, transaction limits
  per adapter) — validate against Postgres/Mongo/SQLite.
- Exact HKDF `salt`/`info` values and whether to expose them (default fixed labels).
- Whether Phase 2 should ship the keyring and the envelope together or envelope-first.

## 10. Decision log

- Password auth is out of the rotation blast radius (pbkdf2 + per-user salt). ✅
- Ship one-time rotation first; multi-key API keys decoupled. ✅
- `rotateSecret` scoped to built-in apiKey fields; custom fields via docs + primitives. ✅
- `oldSecret` as a param; abort-on-mismatch; util run inside a migration file. ✅
- Phase 2 cipher **aes-256-gcm**; **derived-fingerprint** keyId; **fixed HKDF KDF**. ✅
- Keyring is a **bounded overlap**, never indefinite. ✅
- Keyring config shape: **`previousSecrets: string[]`** (active `secret` unchanged). ✅
- v1 envelope **default-on** for new writes; legacy CTR stays readable. ✅
- GCM is **fail-loud**: decrypt of a wrong-key / unknown-keyId / tampered value now throws
  instead of returning garbage. Consequence: the old secret must stay in `previousSecrets`
  until `rotateSecret` re-keys stored data (this is the zero-downtime flow); `rotateSecret`
  catches decrypt throws and classifies rows via the HMAC index. Implemented & tested. ✅
