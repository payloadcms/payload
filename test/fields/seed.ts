import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload/uploads'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { seedDB } from '../helpers/seed.js'
import { anotherArrayDoc, arrayDoc } from './collections/Array/shared.js'
import { blocksDoc } from './collections/Blocks/shared.js'
import { codeDoc } from './collections/Code/shared.js'
import { collapsibleDoc } from './collections/Collapsible/shared.js'
import { conditionalLogicDoc } from './collections/ConditionalLogic/shared.js'
import { dateDoc } from './collections/Date/shared.js'
import { groupDoc } from './collections/Group/shared.js'
import { jsonDoc } from './collections/JSON/shared.js'
import { lexicalDocData } from './collections/Lexical/data.js'
import { textToLexicalJSON } from './collections/LexicalLocalized/textToLexicalJSON.js'
import { lexicalMigrateDocData } from './collections/LexicalMigrate/data.js'
import { numberDoc } from './collections/Number/shared.js'
import { pointDoc } from './collections/Point/shared.js'
import { radiosDoc } from './collections/Radio/shared.js'
import { richTextBulletsDocData, richTextDocData } from './collections/RichText/data.js'
import { selectsDoc } from './collections/Select/shared.js'
import { tabsDoc } from './collections/Tabs/shared.js'
import { anotherTextDoc, textDoc } from './collections/Text/shared.js'
import { uploadsDoc } from './collections/Upload/shared.js'
import {
  arrayFieldsSlug,
  blockFieldsSlug,
  codeFieldsSlug,
  collapsibleFieldsSlug,
  collectionSlugs,
  conditionalLogicSlug,
  dateFieldsSlug,
  groupFieldsSlug,
  jsonFieldsSlug,
  lexicalFieldsSlug,
  lexicalLocalizedFieldsSlug,
  lexicalMigrateFieldsSlug,
  numberFieldsSlug,
  pointFieldsSlug,
  radioFieldsSlug,
  richTextFieldsSlug,
  selectFieldsSlug,
  tabsFieldsSlug,
  textFieldsSlug,
  uploadsSlug,
  usersSlug,
} from './slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (_payload: Payload) => {
  if (_payload.db.name === 'mongoose') {
    await Promise.all(
      _payload.config.collections.map(async (coll) => {
        await new Promise((resolve, reject) => {
          _payload.db?.collections[coll.slug]?.ensureIndexes(function (err) {
            if (err) reject(err)
            resolve(true)
          })
        })
      }),
    )
  }

  const jpgPath = path.resolve(dirname, './collections/Upload/payload.jpg')
  const pngPath = path.resolve(dirname, './uploads/payload.png')

  // Get both files in parallel
  const [jpgFile, pngFile] = await Promise.all([getFileByPath(jpgPath), getFileByPath(pngPath)])

  const createdArrayDoc = await _payload.create({
    collection: arrayFieldsSlug,
    data: arrayDoc,
    depth: 0,
    overrideAccess: true,
  })

  const createdAnotherArrayDoc = await _payload.create({
    collection: arrayFieldsSlug,
    data: anotherArrayDoc,
    depth: 0,
    overrideAccess: true,
  })

  const createdTextDoc = await _payload.create({
    collection: textFieldsSlug,
    data: textDoc,
    depth: 0,
    overrideAccess: true,
  })

  const createdAnotherTextDoc = await _payload.create({
    collection: textFieldsSlug,
    data: anotherTextDoc,
    depth: 0,
    overrideAccess: true,
  })

  const createdPNGDoc = await _payload.create({
    collection: uploadsSlug,
    data: {},
    file: pngFile,
    depth: 0,
    overrideAccess: true,
  })

  const createdJPGDoc = await _payload.create({
    collection: uploadsSlug,
    data: {
      ...uploadsDoc,
      media: createdPNGDoc.id,
    },
    file: jpgFile,
    depth: 0,
    overrideAccess: true,
  })

  const formattedID =
    _payload.db.defaultIDType === 'number' ? createdArrayDoc.id : `"${createdArrayDoc.id}"`

  const formattedJPGID =
    _payload.db.defaultIDType === 'number' ? createdJPGDoc.id : `"${createdJPGDoc.id}"`

  const formattedTextID =
    _payload.db.defaultIDType === 'number' ? createdTextDoc.id : `"${createdTextDoc.id}"`

  const richTextDocWithRelId = JSON.parse(
    JSON.stringify(richTextDocData)
      .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
      .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
      .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`),
  )
  const richTextBulletsDocWithRelId = JSON.parse(
    JSON.stringify(richTextBulletsDocData)
      .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
      .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
      .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`),
  )

  const richTextDocWithRelationship = { ...richTextDocWithRelId }

  const blocksDocWithRichText = {
    ...(blocksDoc as any),
  }

  blocksDocWithRichText.blocks[0].richText = richTextDocWithRelationship.richText
  blocksDocWithRichText.localizedBlocks[0].richText = richTextDocWithRelationship.richText

  await _payload.create({
    collection: richTextFieldsSlug,
    data: richTextBulletsDocWithRelId,
    depth: 0,
    overrideAccess: true,
  })

  const createdRichTextDoc = await _payload.create({
    collection: richTextFieldsSlug,
    data: richTextDocWithRelationship,
    depth: 0,
    overrideAccess: true,
  })

  const formattedRichTextDocID =
    _payload.db.defaultIDType === 'number' ? createdRichTextDoc.id : `"${createdRichTextDoc.id}"`

  const lexicalDocWithRelId = JSON.parse(
    JSON.stringify(lexicalDocData)
      .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
      .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
      .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`)
      .replace(/"\{\{RICH_TEXT_DOC_ID\}\}"/g, `${formattedRichTextDocID}`),
  )

  const lexicalMigrateDocWithRelId = JSON.parse(
    JSON.stringify(lexicalMigrateDocData)
      .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
      .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
      .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`)
      .replace(/"\{\{RICH_TEXT_DOC_ID\}\}"/g, `${formattedRichTextDocID}`),
  )

  await _payload.create({
    collection: usersSlug,
    depth: 0,
    data: {
      email: devUser.email,
      password: devUser.password,
    },
    overrideAccess: true,
  })

  await _payload.create({
    collection: collapsibleFieldsSlug,
    data: collapsibleDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: conditionalLogicSlug,
    data: conditionalLogicDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: groupFieldsSlug,
    data: groupDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: selectFieldsSlug,
    data: selectsDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: radioFieldsSlug,
    data: radiosDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: tabsFieldsSlug,
    data: tabsDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: pointFieldsSlug,
    data: pointDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: dateFieldsSlug,
    data: dateDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: codeFieldsSlug,
    data: codeDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: jsonFieldsSlug,
    data: jsonDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: blockFieldsSlug,
    data: blocksDocWithRichText,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: lexicalFieldsSlug,
    data: lexicalDocWithRelId,
    depth: 0,
    overrideAccess: true,
  })

  const lexicalLocalizedDoc1 = await _payload.create({
    collection: lexicalLocalizedFieldsSlug,
    data: {
      title: 'Localized Lexical en',
      lexicalSimple: textToLexicalJSON({ text: 'English text' }),
      lexicalBlocksLocalized: textToLexicalJSON({ text: 'English text' }),
      lexicalBlocksSubLocalized: textToLexicalJSON({ text: 'English text' }),
    },
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })

  await _payload.update({
    collection: lexicalLocalizedFieldsSlug,
    id: lexicalLocalizedDoc1.id,
    data: {
      title: 'Localized Lexical es',
      lexicalSimple: textToLexicalJSON({ text: 'Spanish text' }),
      lexicalBlocksLocalized: textToLexicalJSON({ text: 'Spanish text' }),
      lexicalBlocksSubLocalized: textToLexicalJSON({ text: 'Spanish text' }),
    },
    locale: 'es',
    depth: 0,
    overrideAccess: true,
  })

  const lexicalLocalizedDoc2 = await _payload.create({
    collection: lexicalLocalizedFieldsSlug,
    data: {
      title: 'Localized Lexical en 2',
      lexicalSimple: textToLexicalJSON({
        text: 'English text 2',
        lexicalLocalizedRelID: lexicalLocalizedDoc1.id,
      }),
      lexicalBlocksLocalized: textToLexicalJSON({
        text: 'English text 2',
        lexicalLocalizedRelID: lexicalLocalizedDoc1.id,
      }),
      lexicalBlocksSubLocalized: textToLexicalJSON({
        text: 'English text 2',
        lexicalLocalizedRelID: lexicalLocalizedDoc1.id,
      }),
    },
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })

  await _payload.update({
    collection: lexicalLocalizedFieldsSlug,
    id: lexicalLocalizedDoc2.id,
    data: {
      title: 'Localized Lexical es 2',
      lexicalSimple: textToLexicalJSON({
        text: 'Spanish text 2',
        lexicalLocalizedRelID: lexicalLocalizedDoc1.id,
      }),
      lexicalBlocksLocalized: textToLexicalJSON({
        text: 'Spanish text 2',
        lexicalLocalizedRelID: lexicalLocalizedDoc1.id,
      }),
    },
    locale: 'es',
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: lexicalMigrateFieldsSlug,
    data: lexicalMigrateDocWithRelId,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: numberFieldsSlug,
    data: { number: 2 },
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: numberFieldsSlug,
    data: { number: 3 },
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: numberFieldsSlug,
    data: numberDoc,
    depth: 0,
    overrideAccess: true,
  })
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs,
    seedFunction: seed,
    snapshotKey: 'fieldsTest',
    uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
  })
}
