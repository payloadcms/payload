import type { CollectionSlug, Payload } from '../../index.js'
import type { Where } from '../../types/index.js'

import { computeAPIKeyIndex } from '../crypto.js'
import { getAPIKeyStorageMode } from '../getAPIKeyStorageMode.js'
import { payloadAPIKeysCollectionSlug } from './config.js'
import { hashAPIKeySecret } from './hash.js'

export type MigrateAPIKeysArgs = {
  /**
   * Number of legacy rows processed per batch, per collection.
   * @default 100
   */
  batchSize?: number
  /**
   * Limit the migration to these collection-mode auth collection slugs. Defaults to every
   * collection-mode auth collection.
   */
  collections?: CollectionSlug[]
  /**
   * When true, validates every row (preflight) and reports counts without writing.
   * @default false
   */
  dryRun?: boolean
  payload: Payload
}

export type MigrateAPIKeysResult = {
  /** Active legacy rows converted into `payload-api-keys` documents. */
  migrated: number
  /** Disabled legacy rows (ciphertext with no lookup index) scrubbed without migrating. */
  scrubbed: number
  /** Rows already migrated in an earlier, interrupted run - verified but not recreated. */
  skipped: number
}

type LegacyRow = {
  apiKey?: string
  apiKeyIndex?: string
  enableAPIKey?: boolean
  id: number | string
}

/**
 * Converts legacy `apiKey`/`apiKeyIndex`/`enableAPIKey` rows on collection-mode auth
 * collections into `payload-api-keys` documents.
 *
 * Preflight (this function's first pass over every targeted collection) validates every
 * row - decrypting and re-verifying each active row's HMAC index under every keyring
 * secret - before any write happens anywhere. A row that cannot be verified aborts the
 * entire run with no writes at all.
 *
 * Each row is then migrated as: create/verify the `payload-api-keys` document, verify it
 * via a raw read, and only then clear the legacy source fields - so an interruption
 * between those steps never clears a source without a verified target, and a rerun finds
 * the same deterministic target (keyed by `migratedFrom.collection`/`migratedFrom.documentID`)
 * instead of creating a duplicate.
 *
 * The decrypted plaintext is used only to compute the new document's one-way
 * `apiKeyHash` - it is never written anywhere, including to the migrated document itself
 * (which, like every `payload-api-keys` document, has no reversible representation of its
 * secret at all).
 */
export const migrateAPIKeys = async ({
  batchSize = 100,
  collections,
  dryRun = false,
  payload,
}: MigrateAPIKeysArgs): Promise<MigrateAPIKeysResult> => {
  const targetSlugs = (collections ?? Object.keys(payload.collections)).filter(
    (slug) => getAPIKeyStorageMode(payload.collections[slug]?.config.auth) === 'collection',
  )

  for (const slug of targetSlugs) {
    await preflightCollection({ slug, batchSize, payload })
  }

  const result: MigrateAPIKeysResult = { migrated: 0, scrubbed: 0, skipped: 0 }

  for (const slug of targetSlugs) {
    await migrateCollection({ slug, batchSize, dryRun, payload, result })
  }

  return result
}

const legacyMaterialWhere: Where = {
  or: [
    { apiKey: { exists: true } },
    { apiKeyIndex: { exists: true } },
    { enableAPIKey: { equals: true } },
  ],
}

/** Reads every legacy row in `slug`, verifying but not writing anything. */
const preflightCollection = async ({
  slug,
  batchSize,
  payload,
}: {
  batchSize: number
  payload: Payload
  slug: CollectionSlug
}): Promise<void> => {
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const { docs, hasNextPage: nextPage } = await payload.db.find({
      collection: slug,
      limit: batchSize,
      page,
      pagination: true,
      sort: 'id',
      where: legacyMaterialWhere,
    })

    for (const doc of docs as LegacyRow[]) {
      if (doc.apiKeyIndex) {
        verifyActiveRow({ slug, doc, payload })
      }
      // A disabled row (ciphertext, no index) or an enableAPIKey-only row needs no
      // verification - it is scrubbed as-is, never converted into a live key.
    }

    hasNextPage = Boolean(nextPage)
    page++
  }
}

/** Decrypts and re-verifies one active row under every keyring secret, or throws. */
const verifyActiveRow = ({
  slug,
  doc,
  payload,
}: {
  doc: LegacyRow
  payload: Payload
  slug: CollectionSlug
}): void => {
  if (!doc.apiKey) {
    throw new Error(
      `migrateAPIKeys: row "${slug}" id "${String(doc.id)}" has an apiKeyIndex but no apiKey ciphertext. Aborting; no writes have been made.`,
    )
  }

  for (const key of payload.encryptionKeyring.all) {
    try {
      const plaintext = payload.decrypt(doc.apiKey, { secret: key.secret })
      if (computeAPIKeyIndex(key.legacyKey, plaintext) === doc.apiKeyIndex) {
        return
      }
    } catch {
      continue
    }
  }

  throw new Error(
    `migrateAPIKeys: could not verify apiKey for collection "${slug}" id "${String(doc.id)}" against any configured secret. Add the secret that encrypted this row to previousSecrets, or run the secret-rotation procedure first. Aborting; no writes have been made.`,
  )
}

const migrateCollection = async ({
  slug,
  batchSize,
  dryRun,
  payload,
  result,
}: {
  batchSize: number
  dryRun: boolean
  payload: Payload
  result: MigrateAPIKeysResult
  slug: CollectionSlug
}): Promise<void> => {
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const { docs, hasNextPage: nextPage } = await payload.db.find({
      collection: slug,
      limit: batchSize,
      page,
      pagination: true,
      sort: 'id',
      where: legacyMaterialWhere,
    })

    for (const doc of docs as LegacyRow[]) {
      await migrateRow({ slug, doc, dryRun, payload, result })
    }

    hasNextPage = Boolean(nextPage)
    page++
  }
}

const migrateRow = async ({
  slug,
  doc,
  dryRun,
  payload,
  result,
}: {
  doc: LegacyRow
  dryRun: boolean
  payload: Payload
  result: MigrateAPIKeysResult
  slug: CollectionSlug
}): Promise<void> => {
  if (!doc.apiKeyIndex) {
    // Disabled: ciphertext (or a stray enableAPIKey flag) with no lookup index. Never
    // used for auth, so it is scrubbed rather than migrated.
    if (!dryRun) {
      await payload.db.updateOne({
        id: doc.id,
        collection: slug,
        data: { apiKey: null, apiKeyIndex: null, enableAPIKey: false },
        returning: false,
      })
    }
    result.scrubbed++
    return
  }

  const existingTarget = await payload.db.find({
    collection: payloadAPIKeysCollectionSlug,
    limit: 1,
    pagination: false,
    where: {
      and: [
        { 'migratedFrom.collection': { equals: slug } },
        { 'migratedFrom.documentID': { equals: String(doc.id) } },
      ],
    },
  })

  if (existingTarget.docs.length > 0) {
    const target = existingTarget.docs[0] as { owner?: { relationTo?: string; value?: unknown } }

    if (target.owner?.relationTo !== slug || String(target.owner.value) !== String(doc.id)) {
      throw new Error(
        `migrateAPIKeys: an existing payload-api-keys record claims migratedFrom "${slug}"/"${String(
          doc.id,
        )}" but belongs to a different owner. Aborting; no further writes have been made.`,
      )
    }

    // An earlier, interrupted run already created and verified this target - clear the
    // source without recreating it.
    if (!dryRun) {
      await payload.db.updateOne({
        id: doc.id,
        collection: slug,
        data: { apiKey: null, apiKeyIndex: null, enableAPIKey: false },
        returning: false,
      })
    }
    result.skipped++
    return
  }

  let plaintext: string | undefined

  for (const key of payload.encryptionKeyring.all) {
    try {
      const candidate = payload.decrypt(doc.apiKey!, { secret: key.secret })
      if (computeAPIKeyIndex(key.legacyKey, candidate) === doc.apiKeyIndex) {
        plaintext = candidate
        break
      }
    } catch {
      continue
    }
  }

  if (plaintext === undefined) {
    throw new Error(
      `migrateAPIKeys: could not verify apiKey for collection "${slug}" id "${String(doc.id)}" during migration. Aborting; no further writes have been made.`,
    )
  }

  if (dryRun) {
    result.migrated++
    return
  }

  const migratedFrom = { collection: slug, documentID: String(doc.id) }
  const created = await payload.db.create({
    collection: payloadAPIKeysCollectionSlug,
    data: {
      name: 'Migrated API key',
      apiKeyHash: hashAPIKeySecret(plaintext),
      migratedFrom,
      owner: { relationTo: slug, value: doc.id },
    },
  })

  const verified = await payload.db.findOne<{
    apiKeyHash?: string
    id: number | string
    owner?: { relationTo?: string; value?: unknown }
  }>({
    collection: payloadAPIKeysCollectionSlug,
    where: { id: { equals: created.id } },
  })

  if (
    !verified?.apiKeyHash ||
    verified.owner?.relationTo !== slug ||
    String(verified.owner.value) !== String(doc.id)
  ) {
    throw new Error(
      `migrateAPIKeys: failed to verify the migrated payload-api-keys record for collection "${slug}" id "${String(
        doc.id,
      )}". The legacy source has not been cleared.`,
    )
  }

  await payload.db.updateOne({
    id: doc.id,
    collection: slug,
    data: { apiKey: null, apiKeyIndex: null, enableAPIKey: false },
    returning: false,
  })

  result.migrated++
}
