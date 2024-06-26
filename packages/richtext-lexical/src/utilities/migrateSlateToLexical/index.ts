import type { CollectionConfig, Payload, TypeWithID } from 'payload'

import { migrateDocumentFields } from './recurse.js'

/**
 * This goes through every single collection and field in the payload config, and migrates its data from Slate to Lexical. This does not support sub-fields within slate.
 *
 * It will only translate fields fulfilling all these requirements:
 * - field schema uses lexical editor
 * - lexical editor has SlateToLexicalFeature added
 * - saved field data is in Slate format
 *
 * @param payload
 */
export async function migrateSlateToLexical({ payload }: { payload: Payload }) {
  const collections = payload.config.collections

  const totalCollections = collections.length
  let curCollection = 0
  for (const collection of collections) {
    curCollection++
    await migrateCollection({
      collection,
      cur: curCollection,
      max: totalCollections,
      payload,
    })
  }
}

async function migrateCollection({
  collection,
  cur,
  max,
  payload,
}: {
  collection: CollectionConfig
  cur: number
  max: number
  payload: Payload
}) {
  console.log('SlateToLexical: Migrating collection:', collection.slug, '(' + cur + '/' + max + ')')

  const documentCount = (
    await payload.count({
      collection: collection.slug,
      depth: 0,
    })
  ).totalDocs

  let page = 1
  let migrated = 0

  while (migrated < documentCount) {
    const documents = await payload.find({
      collection: collection.slug,
      depth: 0,
      overrideAccess: true,
      page,
      pagination: true,
    })

    for (const document of documents.docs) {
      migrated++
      console.log(
        'SlateToLexical: Migrating collection:',
        collection.slug,
        '(' +
          cur +
          '/' +
          max +
          ') - Migrating Document: ' +
          document.id +
          ' (' +
          migrated +
          '/' +
          documentCount +
          ')',
      )
      const found = migrateDocument({
        collection,
        document,
      })

      if (found) {
        await payload.update({
          id: document.id,
          collection: collection.slug,
          data: document,
        })
      }
    }
    page++
  }
}

function migrateDocument({
  collection,
  document,
}: {
  collection: CollectionConfig
  document: TypeWithID & Record<string, unknown>
}): boolean {
  return !!migrateDocumentFields({
    data: document,
    fields: collection.fields,
    found: 0,
  })
}
