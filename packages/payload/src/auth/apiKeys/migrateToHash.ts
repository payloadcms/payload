import crypto from 'crypto'

import type { CollectionSlug, Payload } from '../../index.js'

import { deriveSecretKey } from '../crypto.js'
import { hashAPIKey } from './hash.js'

export type MigrateAPIKeysToHashArgs = {
  /**
   * Number of documents to process per batch.
   * @default 100
   */
  batchSize?: number
  /**
   * Limit the migration to these collection slugs. Defaults to every auth collection
   * configured with `useAPIKey`.
   */
  collections?: CollectionSlug[]
  /**
   * When true, classifies and reports every row without writing anything. Run this first
   * to see whether any key cannot be recovered.
   * @default false
   */
  dryRun?: boolean
  payload: Payload
  /**
   * Additional raw `PAYLOAD_SECRET` values to try, for keys encrypted under a secret that
   * is no longer in the keyring (neither `secret` nor `previousSecrets`).
   */
  secrets?: string[]
}

export type MigrateAPIKeysToHashResult = {
  /** Keys that could not be recovered under any secret. Left untouched. */
  failed: number
  /** Keys converted from encrypted storage to a one-way hash. */
  migrated: number
  /** Keys already stored as a hash (a safe re-run). */
  skipped: number
}

const storedHashPattern = /^[0-9a-f]{64}$/

const printableASCIIPattern = /^[\x20-\x7e]+$/

/**
 * Converts API keys written before they were stored as one-way hashes.
 *
 * Payload used to store an API key as reversible ciphertext plus an HMAC lookup index, both
 * derived from `PAYLOAD_SECRET`. Keys are now stored as `sha256(key)`, and nothing about
 * them depends on the secret. Until a row is converted its key cannot authenticate, so run
 * this once after upgrading - no key has to be reissued.
 *
 * Reads and writes at the database-adapter layer, so the field hooks that hash on write do
 * not interfere. Every recovered key is verified before anything is written, and a row that
 * cannot be verified is left exactly as it was and counted in `failed`: a wrong decryption
 * would hash random bytes and destroy that key for good.
 *
 * Safe to re-run - a row already holding a hash is counted in `skipped`.
 */
export const migrateAPIKeysToHash = async ({
  batchSize = 100,
  collections,
  dryRun = false,
  payload,
  secrets = [],
}: MigrateAPIKeysToHashArgs): Promise<MigrateAPIKeysToHashResult> => {
  const result: MigrateAPIKeysToHashResult = { failed: 0, migrated: 0, skipped: 0 }

  const candidateSecrets = [
    ...payload.encryptionKeyring.all.map(({ secret }) => secret),
    ...secrets,
  ]

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
        where: { apiKey: { exists: true } },
      })

      for (const doc of docs as Array<{ id: number | string } & Record<string, unknown>>) {
        const storedAPIKey = doc.apiKey as null | string | undefined

        if (!storedAPIKey) {
          continue
        }

        const storedIndex =
          typeof doc.apiKeyIndex === 'string' && doc.apiKeyIndex !== '' ? doc.apiKeyIndex : null

        // Already converted: 64 hex characters with no lookup index left beside it. A
        // pre-v1 ciphertext of a 16-character key has the same shape, but always still has
        // its index, so it is not caught here. Checked before attempting recovery, so a
        // hash can never be mistaken for ciphertext and re-hashed.
        if (!storedIndex && storedHashPattern.test(storedAPIKey)) {
          result.skipped++
          continue
        }

        const rawAPIKey = recoverAPIKey({
          candidateSecrets,
          payload,
          storedAPIKey,
          storedIndex,
        })

        if (!rawAPIKey) {
          payload.logger.warn(
            `migrateAPIKeysToHash: could not recover the API key for collection "${slug}" id "${String(doc.id)}" under any known secret. The document is unchanged, and that key has to be regenerated.`,
          )
          result.failed++
          continue
        }

        if (!dryRun) {
          await payload.db.updateOne({
            id: doc.id,
            collection: slug,
            data: {
              apiKey: hashAPIKey(rawAPIKey),
              apiKeyIndex: null,
            },
            returning: false,
          })
        }

        result.migrated++
      }

      hasNextPage = Boolean(nextPage)
      page++
    }
  }

  return result
}

/**
 * Recovers the raw key from a stored value, returning `undefined` when no candidate secret
 * produces something that verifies.
 *
 * A recovered value has to be checked, because a pre-v1 `aes-256-ctr` ciphertext decrypts
 * to random bytes under the wrong secret rather than throwing. `apiKeyIndex` is the exact
 * check wherever it is still present; without it, a plaintext key is at least required to
 * be printable, which random bytes are not.
 */
const recoverAPIKey = ({
  candidateSecrets,
  payload,
  storedAPIKey,
  storedIndex,
}: {
  candidateSecrets: string[]
  payload: Payload
  storedAPIKey: string
  storedIndex: null | string
}): string | undefined => {
  for (const secret of candidateSecrets) {
    let rawAPIKey: string

    try {
      rawAPIKey = payload.decrypt(storedAPIKey, { secret })
    } catch {
      // A v1 envelope throws under the wrong key, and on a value that is not ciphertext
      // at all - such as a hash written by an earlier run.
      continue
    }

    const isVerified = storedIndex
      ? hmacIndexFor({ rawAPIKey, secret }) === storedIndex
      : printableASCIIPattern.test(rawAPIKey)

    if (isVerified) {
      return rawAPIKey
    }
  }

  return undefined
}

const hmacIndexFor = ({ rawAPIKey, secret }: { rawAPIKey: string; secret: string }): string =>
  crypto.createHmac('sha256', deriveSecretKey(secret)).update(rawAPIKey).digest('hex')
