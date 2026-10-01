import type { Collection, IndexDescription } from 'mongodb'
import type { Payload, PayloadRequest } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getSession } from '../utilities/getSession.js'

/** Mongo error codes for an index that already exists with the same key but different options. */
const INDEX_CONFLICT_CODES = new Set([85, 86])
/** Mongo error code for a collection that hasn't been created yet. */
const NAMESPACE_NOT_FOUND_CODE = 26

/**
 * Moves every upload collection's stored image sizes between the legacy `sizes` field and
 * `variants`, on each collection and its versions collection (`version.sizes`). Uses `$rename`,
 * so no document is rewritten beyond the renamed key, and re-keys the indexes on those fields.
 * Documents that are already renamed are left as they are, so it's safe to re-run.
 */
export async function migrateSizesToVariants({
  direction = 'up',
  payload,
  req,
}: {
  direction?: 'down' | 'up'
  payload: Payload
  req?: Partial<PayloadRequest>
}): Promise<void> {
  const adapter = payload.db as unknown as MongooseAdapter
  const session = await getSession(adapter, req)
  const [from, to] = direction === 'up' ? ['sizes', 'variants'] : ['variants', 'sizes']

  for (const collection of payload.config.collections) {
    if (!collection.upload) {
      continue
    }

    const targets: { collection: Collection; path: string }[] = [
      { collection: adapter.collections[collection.slug]!.collection, path: '' },
    ]

    if (collection.versions && adapter.versions[collection.slug]) {
      targets.push({ collection: adapter.versions[collection.slug]!.collection, path: 'version.' })
    }

    for (const target of targets) {
      const fromPath = `${target.path}${from}`
      const toPath = `${target.path}${to}`

      const result = await target.collection.updateMany(
        { [fromPath]: { $exists: true }, [toPath]: { $exists: false } },
        { $rename: { [fromPath]: toPath } },
        { session },
      )

      // Index builds can't run inside a multi-document transaction, so they skip the session.
      await rekeyIndexes({ collection: target.collection, fromPath, toPath })

      payload.logger.info({
        msg: `sizes-to-variants (${direction}): renamed ${fromPath} on ${result.modifiedCount} document(s) in "${target.collection.collectionName}"`,
      })
    }
  }
}

async function rekeyIndexes({
  collection,
  fromPath,
  toPath,
}: {
  collection: Collection
  fromPath: string
  toPath: string
}): Promise<void> {
  let indexes: IndexDescription[]

  try {
    indexes = await collection.indexes()
  } catch (err) {
    if ((err as { code?: number }).code === NAMESPACE_NOT_FOUND_CODE) {
      return
    }

    throw err
  }

  for (const index of indexes) {
    const keys = Object.keys(index.key)

    if (!keys.some((key) => key.startsWith(`${fromPath}.`))) {
      continue
    }

    const rekeyed = Object.fromEntries(
      Object.entries(index.key).map(([key, value]) => [
        key.startsWith(`${fromPath}.`) ? `${toPath}${key.slice(fromPath.length)}` : key,
        value,
      ]),
    )

    try {
      await collection.createIndex(rekeyed, {
        ...(index.partialFilterExpression
          ? { partialFilterExpression: index.partialFilterExpression }
          : {}),
        ...(index.sparse ? { sparse: true } : {}),
        ...(index.unique ? { unique: true } : {}),
      })
    } catch (err) {
      // The current schema already created this index (e.g. at connect) with its own options.
      if (!INDEX_CONFLICT_CODES.has((err as { code?: number }).code ?? 0)) {
        throw err
      }
    }

    await collection.dropIndex(index.name!)
  }
}
