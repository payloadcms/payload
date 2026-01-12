import type { CollectionConfig, Field, GlobalConfig, Payload } from 'payload'

import { upgradeDocumentFieldsRecursively } from './upgradeDocumentFieldsRecursively.js'

/**
 * This goes through every single document in your payload app and re-saves it, if it has a lexical editor.
 * This way, the data is automatically converted to the new format, and that automatic conversion gets applied to every single document in your app.
 *
 * @param payload
 */
export async function upgradeLexicalData({ payload }: { payload: Payload }) {
  const collections = payload.config.collections

  const allLocales = payload.config.localization ? payload.config.localization.localeCodes : [null]

  const totalCollections = collections.length
  for (const locale of allLocales) {
    let curCollection = 0
    for (const collection of collections) {
      curCollection++
      await upgradeCollection({
        collection,
        cur: curCollection,
        locale,
        max: totalCollections,
        payload,
      })
    }
    for (const global of payload.config.globals) {
      await upgradeGlobal({
        global,
        locale,
        payload,
      })
    }
  }
}

async function upgradeGlobal({
  global,
  locale,
  payload,
}: {
  global: GlobalConfig
  locale: null | string
  payload: Payload
}) {
  console.log(`Lexical Upgrader: ${locale}: Upgrading global:`, global.slug)

  const document = await payload.findGlobal({
    slug: global.slug,
    depth: 0,
    locale: locale || undefined,
    overrideAccess: true,
  })

  const found = upgradeDocument({
    document,
    fields: global.fields,
    payload,
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

async function upgradeCollection({
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
    `Lexical Upgrade: ${locale}: Upgrading collection:`,
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
  let upgraded = 0

  while (upgraded < documentCount) {
    const documents = await payload.find({
      collection: collection.slug,
      depth: 0,
      locale: locale || undefined,
      overrideAccess: true,
      page,
      pagination: true,
    })

    for (const document of documents.docs) {
      upgraded++
      console.log(
        `Lexical Upgrade: ${locale}: Upgrading collection:`,
        collection.slug,
        '(' +
          cur +
          '/' +
          max +
          ') - Upgrading Document: ' +
          document.id +
          ' (' +
          upgraded +
          '/' +
          documentCount +
          ')',
      )
      const found = upgradeDocument({
        document,
        fields: collection.fields,
        payload,
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

function upgradeDocument({
  document,
  fields,
  payload,
}: {
  document: Record<string, unknown>
  fields: Field[]
  payload: Payload
}): boolean {
  return !!upgradeDocumentFieldsRecursively({
    data: document,
    fields,
    found: 0,
    payload,
  })
}
