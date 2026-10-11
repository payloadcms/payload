import type {
  Collection,
  CreateIndexesOptions,
  Document,
  IndexDescriptionInfo,
  IndexDirection,
} from 'mongodb'
import type { Payload, PayloadRequest } from 'payload'

import { isDeepStrictEqual } from 'node:util'

import type { MongooseAdapter } from '../index.js'

import { getSession } from '../utilities/getSession.js'

/** Mongo error codes for an index that conflicts with an existing index. */
const INDEX_CONFLICT_CODES = new Set([85, 86])
/** Mongo error code for a collection that hasn't been created yet. */
const NAMESPACE_NOT_FOUND_CODE = 26
const GENERATED_VARIANT_METADATA_FIELDS = new Set([
  'filename',
  'filesize',
  'height',
  'mimeType',
  'url',
  'width',
])

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

  const targets: {
    collection: Collection
    expectedVariantNames: string[]
    fromPath: string
    toPath: string
  }[] = []

  for (const collection of payload.config.collections) {
    if (!collection.upload) {
      continue
    }

    const upload = typeof collection.upload === 'object' ? collection.upload : undefined
    const expectedVariantNames = (upload?.variants ?? []).map(({ name }) => name)

    targets.push({
      collection: adapter.collections[collection.slug]!.collection,
      expectedVariantNames,
      fromPath: from,
      toPath: to,
    })

    if (collection.versions && adapter.versions[collection.slug]) {
      targets.push({
        collection: adapter.versions[collection.slug]!.collection,
        expectedVariantNames,
        fromPath: `version.${from}`,
        toPath: `version.${to}`,
      })
    }
  }

  for (const { collection, expectedVariantNames, fromPath, toPath } of targets) {
    const [sourceData, directCollision] = await Promise.all([
      collection.findOne({ [fromPath]: { $exists: true } }, { projection: { _id: 1 } }),
      collection.findOne(
        { [fromPath]: { $exists: true }, [toPath]: { $exists: true } },
        { projection: { _id: 1 } },
      ),
    ])

    if (
      sourceData &&
      (directCollision ||
        (await findUnexpectedDestinationData({ collection, expectedVariantNames, toPath })))
    ) {
      throw new Error(
        `Cannot run the sizes-to-variants migration because collection "${collection.collectionName}" contains both "${fromPath}" and "${toPath}" data. Move or rename the existing destination data before running this migration.`,
      )
    }
  }

  // Index changes can't be part of a multi-document transaction, and one made after the
  // migration's transaction has written to a collection aborts it. A transaction's snapshot starts
  // at its first operation, so re-keying every index before any transactional write is safe.
  for (const target of targets) {
    await rekeyIndexes(target)
  }

  for (const { collection, fromPath, toPath } of targets) {
    const result = await collection.updateMany(
      { [fromPath]: { $exists: true }, [toPath]: { $exists: false } },
      { $rename: { [fromPath]: toPath } },
      { session },
    )

    payload.logger.info({
      msg: `sizes-to-variants (${direction}): renamed ${fromPath} on ${result.modifiedCount} document(s) in "${collection.collectionName}"`,
    })
  }
}

async function findUnexpectedDestinationData({
  collection,
  expectedVariantNames,
  toPath,
}: {
  collection: Collection
  expectedVariantNames: string[]
  toPath: string
}): Promise<Document | null> {
  const expectedVariantNameSet = new Set(expectedVariantNames)
  const cursor = collection.find(
    { [toPath]: { $exists: true } },
    { projection: { _id: 1, [toPath]: 1 } },
  )

  try {
    for await (const document of cursor) {
      const destinationData = getDocumentPath({ document, path: toPath })

      if (hasUnexpectedVariantData({ destinationData, expectedVariantNameSet })) {
        return document
      }
    }
  } finally {
    await cursor.close()
  }

  return null
}

function getDocumentPath({ document, path }: { document: Document; path: string }): unknown {
  return path.split('.').reduce<unknown>((value, pathSegment) => {
    if (!isRecord(value)) {
      return undefined
    }

    return value[pathSegment]
  }, document)
}

function hasUnexpectedVariantData({
  destinationData,
  expectedVariantNameSet,
}: {
  destinationData: unknown
  expectedVariantNameSet: Set<string>
}): boolean {
  if (!isRecord(destinationData)) {
    return destinationData !== null && destinationData !== undefined
  }

  for (const [variantName, variantData] of Object.entries(destinationData)) {
    if (!expectedVariantNameSet.has(variantName)) {
      return true
    }

    if (variantData === null || variantData === undefined) {
      continue
    }

    if (
      !isRecord(variantData) ||
      Object.keys(variantData).some(
        (metadataFieldName) => !GENERATED_VARIANT_METADATA_FIELDS.has(metadataFieldName),
      )
    ) {
      return true
    }
  }

  return false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
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
  let indexes: IndexDescriptionInfo[]

  try {
    indexes = await collection.indexes()
  } catch (err) {
    if ((err as { code?: number }).code === NAMESPACE_NOT_FOUND_CODE) {
      return
    }

    throw err
  }

  for (const index of indexes) {
    const sourceKeys = getIndexKeysForCreate({ fromPath, index, toPath: fromPath })

    if (!Object.keys(sourceKeys).some((key) => isPathAtOrBelow({ key, path: fromPath }))) {
      continue
    }

    const rekeyedKeys = getIndexKeysForCreate({ fromPath, index, toPath })
    const destinationOptions = getDestinationIndexOptions({ fromPath, index, toPath })

    if (index.weights && '_fts' in index.key && '_ftsx' in index.key) {
      await rekeyTextIndex({
        collection,
        destinationOptions,
        index,
        rekeyedKeys,
        sourceKeys,
      })
      continue
    }

    try {
      await collection.createIndex(rekeyedKeys, destinationOptions)
    } catch (err) {
      if (!INDEX_CONFLICT_CODES.has((err as { code?: number }).code ?? 0)) {
        throw err
      }

      const destinationIndex = (await collection.indexes()).find((candidate) =>
        isDeepStrictEqual(
          getIndexKeysForCreate({ fromPath: toPath, index: candidate, toPath }),
          rekeyedKeys,
        ),
      )
      const existingDestinationOptions = destinationIndex
        ? getDestinationIndexOptions({
            fromPath: toPath,
            index: destinationIndex,
            toPath,
          })
        : undefined

      if (!destinationIndex || !isDeepStrictEqual(existingDestinationOptions, destinationOptions)) {
        throw err
      }
    }

    await collection.dropIndex(index.name!)
  }
}

async function rekeyTextIndex({
  collection,
  destinationOptions,
  index,
  rekeyedKeys,
  sourceKeys,
}: {
  collection: Collection
  destinationOptions: CreateIndexesOptions
  index: IndexDescriptionInfo
  rekeyedKeys: Record<string, IndexDirection>
  sourceKeys: Record<string, IndexDirection>
}): Promise<void> {
  if (!index.name) {
    throw new Error('Cannot re-key an unnamed MongoDB text index.')
  }

  const sourceOptions: CreateIndexesOptions = {
    ...getDestinationIndexOptions({ fromPath: '', index, toPath: '' }),
    name: index.name,
  }

  await collection.dropIndex(index.name)

  try {
    await collection.createIndex(rekeyedKeys, destinationOptions)
  } catch (err) {
    try {
      await collection.createIndex(sourceKeys, sourceOptions)
    } catch (restoreErr) {
      throw new AggregateError(
        [err, restoreErr],
        `Failed to create the replacement for MongoDB text index "${index.name}" and failed to restore the source index.`,
      )
    }

    throw err
  }
}

function getIndexKeysForCreate({
  fromPath,
  index,
  toPath,
}: {
  fromPath: string
  index: IndexDescriptionInfo
  toPath: string
}): Record<string, IndexDirection> {
  const keys: [string, IndexDirection][] = []
  const hasInternalTextKeys = '_fts' in index.key && '_ftsx' in index.key

  for (const [key, value] of Object.entries(index.key)) {
    if (hasInternalTextKeys && key === '_fts') {
      for (const textPath of Object.keys(index.weights ?? {})) {
        keys.push([rekeyPath({ fromPath, path: textPath, toPath }), 'text'])
      }
      continue
    }

    if (hasInternalTextKeys && key === '_ftsx') {
      continue
    }

    keys.push([rekeyPath({ fromPath, path: key, toPath }), value])
  }

  return Object.fromEntries(keys)
}

function getDestinationIndexOptions({
  fromPath,
  index,
  toPath,
}: {
  fromPath: string
  index: IndexDescriptionInfo
  toPath: string
}): CreateIndexesOptions {
  const options: CreateIndexesOptions = {
    '2dsphereIndexVersion': index['2dsphereIndexVersion'],
    background: index.background,
    bits: index.bits,
    bucketSize: index.bucketSize,
    collation: index.collation,
    default_language: index.default_language,
    expireAfterSeconds: index.expireAfterSeconds,
    hidden: index.hidden,
    language_override: index.language_override,
    max: index.max,
    min: index.min,
    partialFilterExpression: index.partialFilterExpression
      ? rekeyDocumentPaths({ document: index.partialFilterExpression, fromPath, toPath })
      : undefined,
    sparse: index.sparse,
    storageEngine: index.storageEngine,
    textIndexVersion: index.textIndexVersion,
    unique: index.unique,
    weights: index.weights
      ? rekeyDocumentPaths({ document: index.weights, fromPath, toPath })
      : undefined,
    wildcardProjection: index.wildcardProjection
      ? rekeyDocumentPaths({ document: index.wildcardProjection, fromPath, toPath })
      : undefined,
  }

  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as CreateIndexesOptions
}

function rekeyDocumentPaths({
  document,
  fromPath,
  toPath,
}: {
  document: Document
  fromPath: string
  toPath: string
}): Document {
  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => [
      rekeyPath({ fromPath, path: key, toPath }),
      rekeyDocumentValue({ fromPath, toPath, value }),
    ]),
  )
}

function isPathAtOrBelow({ key, path }: { key: string; path: string }): boolean {
  return key === path || key.startsWith(`${path}.`)
}

function rekeyPath({
  fromPath,
  path,
  toPath,
}: {
  fromPath: string
  path: string
  toPath: string
}): string {
  return isPathAtOrBelow({ key: path, path: fromPath })
    ? `${toPath}${path.slice(fromPath.length)}`
    : path
}

function rekeyDocumentValue({
  fromPath,
  toPath,
  value,
}: {
  fromPath: string
  toPath: string
  value: unknown
}): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => rekeyDocumentValue({ fromPath, toPath, value: item }))
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  ) {
    return rekeyDocumentPaths({ document: value as Document, fromPath, toPath })
  }

  return value
}
