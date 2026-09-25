import crypto from 'crypto'

import type { CollectionSlug, Payload } from '../index.js'

import { deriveSecretKey } from './crypto.js'

export type RotateSecretArgs = {
  /**
   * Number of documents to process per batch.
   * @default 100
   */
  batchSize?: number
  /**
   * Limit rotation to these collection slugs. Defaults to every auth collection
   * configured with `useAPIKey`.
   */
  collections?: CollectionSlug[]
  /**
   * When true, verifies every row against the old and current secrets without
   * writing. Run this first to confirm `oldSecret` is correct.
   * @default false
   */
  dryRun?: boolean
  /**
   * The previous raw `PAYLOAD_SECRET` that existing data was encrypted under.
   */
  oldSecret: string
  payload: Payload
}

export type RotateSecretResult = {
  /** Documents re-keyed from the old secret to the current secret. */
  migrated: number
  /** Documents already encrypted under the current secret (safe re-run). */
  skipped: number
}

/**
 * Re-keys the built-in `apiKey`/`apiKeyIndex` fields from a previous
 * `PAYLOAD_SECRET` to the current one, for every auth collection using API keys.
 *
 * Operates at the database-adapter layer to bypass the `apiKey` field's
 * encrypt/decrypt hooks (which would otherwise corrupt data mid-rotation).
 *
 * Each document is verified against the old and current secrets before it is
 * written, so the run is:
 * - **idempotent** — a re-run skips already-migrated rows (matched via the HMAC
 *   index), so it is safe to run repeatedly;
 * - **fail-closed** — a row that matches neither the old nor the current secret
 *   throws and aborts the run before that row is written. Rows already migrated
 *   earlier in the same run remain migrated and are safe to keep: fix the secret
 *   and re-run.
 *
 * Password logins are unaffected by a secret rotation, and active JWT sessions
 * are invalidated by design. See the "Rotating your PAYLOAD_SECRET" docs.
 */
export const rotateSecret = async ({
  batchSize = 100,
  collections,
  dryRun = false,
  oldSecret,
  payload,
}: RotateSecretArgs): Promise<RotateSecretResult> => {
  const oldDerivedKey = deriveSecretKey(oldSecret)
  const newDerivedKey = payload.secret

  const result: RotateSecretResult = { migrated: 0, skipped: 0 }

  if (oldDerivedKey === newDerivedKey) {
    payload.logger.warn(
      'rotateSecret: oldSecret matches the current secret - nothing to rotate. Did you forget to set the new PAYLOAD_SECRET?',
    )
    return result
  }

  const targetSlugs = (collections ?? Object.keys(payload.collections)).filter(
    (slug) => payload.collections[slug]?.config.auth?.useAPIKey,
  )

  for (const slug of targetSlugs) {
    let page = 1
    let hasNextPage = true

    while (hasNextPage) {
      const { docs, hasNextPage: nextPage } = await payload.db.find({
        collection: slug,
        limit: batchSize,
        page,
        pagination: true,
        sort: 'id',
        // Only rows with a lookup index need re-keying. A row can have `apiKey`
        // ciphertext but a null `apiKeyIndex` (e.g. after unchecking "Enable API
        // Key"); those are never used for auth, so skip them.
        where: {
          and: [{ apiKey: { exists: true } }, { apiKeyIndex: { exists: true } }],
        },
      })

      for (const doc of docs as Array<{ id: number | string } & Record<string, unknown>>) {
        const storedApiKey = doc.apiKey as string | undefined
        const storedIndex = doc.apiKeyIndex as string | undefined

        if (!storedApiKey || !storedIndex) {
          continue
        }

        // The v1 (aes-256-gcm) envelope throws on a wrong key; legacy aes-256-ctr
        // returns garbage. Either way the HMAC-index check is the source of truth,
        // so treat a decrypt failure as "does not match this secret".
        const rawFromOld = tryDecrypt({ hash: storedApiKey, payload, secret: oldSecret })

        if (
          rawFromOld !== undefined &&
          apiKeyIndexHmac({ derivedKey: oldDerivedKey, rawApiKey: rawFromOld }) === storedIndex
        ) {
          if (!dryRun) {
            await payload.db.updateOne({
              id: doc.id,
              collection: slug,
              data: {
                apiKey: payload.encrypt(rawFromOld),
                apiKeyIndex: apiKeyIndexHmac({ derivedKey: newDerivedKey, rawApiKey: rawFromOld }),
              },
              returning: false,
            })
          }
          result.migrated++
          continue
        }

        // Confirm the row is already on the current secret (safe re-run).
        const rawFromNew = tryDecrypt({ hash: storedApiKey, payload })

        if (
          rawFromNew !== undefined &&
          apiKeyIndexHmac({ derivedKey: newDerivedKey, rawApiKey: rawFromNew }) === storedIndex
        ) {
          result.skipped++
          continue
        }

        throw new Error(
          `rotateSecret: could not verify apiKey for collection "${slug}" id "${String(
            doc.id,
          )}" against the provided oldSecret or the current secret. Aborting; rows already migrated in this run are safe to keep - fix the secret and re-run.`,
        )
      }

      hasNextPage = Boolean(nextPage)
      page++
    }
  }

  return result
}

const apiKeyIndexHmac = ({
  derivedKey,
  rawApiKey,
}: {
  derivedKey: string
  rawApiKey: string
}): string => crypto.createHmac('sha256', derivedKey).update(rawApiKey).digest('hex')

/**
 * Decrypts with the given secret (or the active secret), returning `undefined`
 * instead of throwing when the value cannot be decrypted (wrong-key v1 values
 * throw; the caller relies on the HMAC index to decide correctness).
 */
const tryDecrypt = ({
  hash,
  payload,
  secret,
}: {
  hash: string
  payload: Payload
  secret?: string
}): string | undefined => {
  try {
    return secret ? payload.decrypt(hash, { secret }) : payload.decrypt(hash)
  } catch {
    return undefined
  }
}
