import type { CollectionConfig, Field, GlobalConfig, Payload } from 'payload'

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

  const allLocales = payload.config.localization ? payload.config.localization.localeCodes : [null]

  const totalCollections = collections.length
  for (const locale of allLocales) {
    let curCollection = 0
    for (const collection of collections) {
      curCollection++
      await migrateCollection({
        collection,
        cur: curCollection,
        locale,
        max: totalCollections,
        payload,
      })
    }
    for (const global of payload.config.globals) {
      await migrateGlobal({
        global,
        locale,
        payload,
      })
    }
  }
}

async function migrateGlobal({
  global,
  locale,
  payload,
}: {
  global: GlobalConfig
  locale: null | string
  payload: Payload
}) {
  console.log(`SlateToLexical: ${locale}: Migrating global:`, global.slug)

  const document = await payload.findGlobal({
    slug: global.slug,
    depth: 0,
    locale: locale || undefined,
    overrideAccess: true,
  })

  const found = migrateDocument({
    document,
    fields: global.fields,
  })

  if (found) {
    await payload.updateGlobal({
      slug: global.slug,
      data: document,
      depth: 0,
      locale: locale || undefined,
    })
  }
}

async function migrateCollection({
  collection,
  cur,
  locale,
  max,
  payload,
}: {
  collection: CollectionConfig
  cur: number
  locale: null | string
  max: number
  payload: Payload
}) {
  console.log(
    `SlateToLexical: ${locale}: Migrating collection:`,
    collection.slug,
    '(' + cur + '/' + max + ')',
  )

  const documentCount = (
    await payload.count({
      collection: collection.slug,
      depth: 0,
      locale: locale || undefined,
    })
  ).totalDocs

  let page = 1
  let migrated = 0

  while (migrated < documentCount) {
    const documents = await payload.find({
      collection: collection.slug,
      depth: 0,
      locale: locale || undefined,
      overrideAccess: true,
      page,
      pagination: true,
    })

    for (const document of documents.docs) {
      migrated++
      console.log(
        `SlateToLexical: ${locale}: Migrating collection:`,
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
        document,
        fields: collection.fields,
      })

      if (found) {
        await payload.update({
          id: document.id,
          collection: collection.slug,
          data: document,
          depth: 0,
          locale: locale || undefined,
        })
      }
    }
    page++
  }
}

function migrateDocument({
  document,
  fields,
}: {
  document: Record<string, unknown>
  fields: Field[]
}): boolean {
  return !!migrateDocumentFields({
    data: document,
    fields,
    found: 0,
  })
}
