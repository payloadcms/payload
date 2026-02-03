import type { CollectionSlug, GlobalSlug, Payload } from 'payload'

import { toSnakeCase } from 'drizzle-orm/casing'

import type { DraftPost } from './payload-types.js'

import { isMongoose } from '@tools/test-utils/int'

/**
 * Creates multiple versions of a document by updating it sequentially
 *
 * @example
 * const doc = await createVersions({
 *   payload,
 *   collection: 'draft-posts',
 *   data: { title: 'Test' },
 *   total: 10
 * })
 */

/**
 * Creates a draft document with standard blocksField structure
 *
 * @example
 * const draft = await createDraftDocument({
 *   payload,
 *   collection: 'draft-posts',
 *   title: 'My Draft',
 *   description: 'Test description'
 * })
 */
export async function createDraftDocument({
  additionalData = {},
  blocksField,
  collection,
  description = 'Description',
  payload,
  title,
}: {
  additionalData?: Record<string, any>
  blocksField?: DraftPost['blocksField']
  collection: string
  description?: string
  payload: Payload
  title: string
}) {
  const defaultBlocksField: DraftPost['blocksField'] = [
    {
      blockType: 'block',
      localized: null,
      text: 'Hello World',
    },
  ]

  return await payload.create({
    collection,
    data: {
      blocksField: blocksField || defaultBlocksField,
      description,
      radio: 'test',
      title,
      ...additionalData,
    },
    depth: 0,
    draft: true,
    overrideAccess: true,
  })
}

/**
 * Creates a document with many versions by incrementally updating a field
 *
 * @example
 * const { id, versions } = await createDocumentWithManyVersions({
 *   payload,
 *   collection: 'draft-posts',
 *   initialData: { title: 'Initial Title' },
 *   versionCount: 10,
 *   updateField: 'title',
 *   updateValue: (i) => `Title Version ${i}`
 * })
 */
export async function createDocumentWithManyVersions({
  collection,
  draft = false,
  initialData,
  payload,
  updateField,
  updateValue,
  versionCount = 10,
}: {
  collection: string
  draft?: boolean
  initialData: Record<string, any>
  payload: Payload
  updateField: string
  updateValue: (index: number) => any
  versionCount?: number
}) {
  const doc = await payload.create({
    collection,
    data: initialData,
    depth: 0,
    draft,
    overrideAccess: true,
  })

  const versions = [doc]

  for (let i = 1; i < versionCount; i++) {
    const updated = await payload.update({
      id: doc.id,
      collection,
      data: {
        [updateField]: updateValue(i),
      },
      depth: 0,
      overrideAccess: true,
    })
    versions.push(updated)
  }

  return { id: doc.id, versions }
}

export async function cleanupDocuments({
  payload,
  collectionSlugs,
}: {
  collectionSlugs: CollectionSlug[]
  payload: Payload
}) {
  for (const collectionSlug of collectionSlugs) {
    await payload.delete({
      collection: collectionSlug,
      where: {
        id: {
          exists: true,
        },
      },
      overrideAccess: true,
    })
  }
}

export async function cleanupGlobal({
  payload,
  globalSlug,
}: {
  globalSlug: GlobalSlug
  payload: Payload
}) {
  if (isMongoose(payload)) {
    await payload.db.updateGlobal({
      slug: globalSlug,
      data: {
        title: {},
        content: {},
      },
    })
  } else {
    await payload.db.drizzle.delete(payload.db.tables[toSnakeCase(globalSlug)])
  }

  await payload.db.deleteVersions({
    globalSlug,
    where: {},
  })
}
