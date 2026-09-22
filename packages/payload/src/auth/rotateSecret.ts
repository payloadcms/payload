import type { CollectionSlug, Payload } from '../index.js'

import { migrateAPIKeysToHash } from './apiKeys/migrateToHash.js'

export type RotateSecretArgs = {
  /**
   * Number of documents to process per batch.
   * @default 100
   */
  batchSize?: number
  /**
   * Limit the run to these collection slugs. Defaults to every auth collection
   * configured with `useAPIKey`.
   */
  collections?: CollectionSlug[]
  /**
   * When true, verifies every row without writing. Run this first to confirm every key
   * can be recovered.
   * @default false
   */
  dryRun?: boolean
  /**
   * The previous raw `PAYLOAD_SECRET` that existing data was encrypted under. Only needed
   * when it is not in the keyring (`secret` or `previousSecrets`).
   */
  oldSecret: string
  payload: Payload
}

export type RotateSecretResult = {
  /** Documents converted to a one-way hash. */
  migrated: number
  /** Documents already stored as a hash (a safe re-run). */
  skipped: number
}

/**
 * @deprecated Prefer {@link migrateAPIKeysToHash}, which this now delegates to.
 *
 * API keys are stored as one-way hashes and no longer derive anything from
 * `PAYLOAD_SECRET`, so rotating the secret does not affect them and there is nothing to
 * re-key. What is left to do is convert keys still held in the old encrypted format, which
 * is exactly what `migrateAPIKeysToHash` does - after which a rotation touches API keys not
 * at all.
 *
 * Kept so an existing rotation migration keeps working. Fail-closed, as before: if any key
 * cannot be recovered this throws, and every row it could not verify is left untouched.
 */
export const rotateSecret = async ({
  batchSize = 100,
  collections,
  dryRun = false,
  oldSecret,
  payload,
}: RotateSecretArgs): Promise<RotateSecretResult> => {
  const { failed, migrated, skipped } = await migrateAPIKeysToHash({
    batchSize,
    collections,
    dryRun,
    payload,
    secrets: oldSecret ? [oldSecret] : [],
  })

  if (failed > 0) {
    throw new Error(
      `rotateSecret: ${failed} API key(s) could not be verified against the provided oldSecret or any secret in the keyring. Those documents are unchanged; fix the secret and re-run, or regenerate those keys. Keys converted in this run are safe to keep.`,
    )
  }

  return { migrated, skipped }
}
