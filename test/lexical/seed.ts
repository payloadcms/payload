import type { Payload } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { lexicalDocData } from './collections/Lexical/data.js'
import { generateLexicalLocalizedRichText } from './collections/LexicalLocalized/generateLexicalRichText.js'
import { textToLexicalJSON } from './collections/LexicalLocalized/textToLexicalJSON.js'
import { lexicalMigrateDocData } from './collections/LexicalMigrate/data.js'
import { richTextBulletsDocData, richTextDocData } from './collections/RichText/data.js'
import {
  lexicalFieldsSlug,
  lexicalLocalizedFieldsSlug,
  lexicalMigrateFieldsSlug,
  lexicalRelationshipFieldsSlug,
  richTextFieldsSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (_payload: Payload) => {
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

  await _payload.create({
    collection: emailFieldsSlug,
    data: emailDoc,
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: emailFieldsSlug,
    data: anotherEmailDoc,
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
    collection: checkboxFieldsSlug,
    data: {
      checkbox: true,
    },
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: checkboxFieldsSlug,
    data: {
      checkbox: false,
    },
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

  const relationshipField1 = await _payload.create({
    collection: relationshipFieldsSlug,
    data: {
      text: 'Relationship 1',
      relationship: {
        relationTo: textFieldsSlug,
        value: createdTextDoc.id,
      },
    },
    depth: 0,
    overrideAccess: true,
  })

  try {
    await _payload.create({
      collection: relationshipFieldsSlug,
      data: {
        text: 'Relationship 2',
        relationToSelf: relationshipField1.id,
        relationship: {
          relationTo: textFieldsSlug,
          value: createdAnotherTextDoc.id,
        },
      },
      depth: 0,
      overrideAccess: true,
    })
  } catch (e) {
    console.error(e)
  }

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
      lexicalBlocksLocalized: textToLexicalJSON({ text: 'English text' }),
      lexicalBlocksSubLocalized: generateLexicalLocalizedRichText(
        'Shared text',
        'English text in block',
      ) as any,
    },
    locale: 'en',
    depth: 0,
    overrideAccess: true,
  })

  await _payload.create({
    collection: lexicalRelationshipFieldsSlug,
    data: {
      richText: textToLexicalJSON({ text: 'English text' }),
    },
    depth: 0,
    overrideAccess: true,
  })

  await _payload.update({
    collection: lexicalLocalizedFieldsSlug,
    id: lexicalLocalizedDoc1.id,
    data: {
      title: 'Localized Lexical es',
      lexicalBlocksLocalized: textToLexicalJSON({ text: 'Spanish text' }),
      lexicalBlocksSubLocalized: generateLexicalLocalizedRichText(
        'Shared text',
        'Spanish text in block',
        (lexicalLocalizedDoc1.lexicalBlocksSubLocalized.root.children[1].fields as any).id,
      ) as any,
    },
    locale: 'es',
    depth: 0,
    overrideAccess: true,
  })

  const lexicalLocalizedDoc2 = await _payload.create({
    collection: lexicalLocalizedFieldsSlug,
    data: {
      title: 'Localized Lexical en 2',

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

  await _payload.create({
    collection: uiSlug,
    data: {
      text: 'text',
    },
    depth: 0,
  })

  const getInlineBlock = () => ({
    type: 'inlineBlock',
    fields: {
      id: Math.random().toString(36).substring(2, 15),
      text: 'text',
      blockType: 'inlineBlockInLexical',
    },
    version: 1,
  })

  await _payload.create({
    collection: 'LexicalInBlock',
    depth: 0,
    data: {
      content: {
        root: {
          children: [
            {
              format: '',
              type: 'block',
              version: 2,
              fields: {
                id: '6773773284be8978db7a498d',
                lexicalInBlock: textToLexicalJSON({ text: 'text' }),
                blockName: '',
                blockType: 'blockInLexical',
              },
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      blocks: [
        {
          blockType: 'lexicalInBlock2',
          blockName: '1',
          lexical: textToLexicalJSON({ text: '1' }),
        },
        {
          blockType: 'lexicalInBlock2',
          blockName: '2',
          lexical: textToLexicalJSON({ text: '2' }),
        },
        {
          blockType: 'lexicalInBlock2',
          lexical: {
            root: {
              children: [
                {
                  children: [...Array.from({ length: 20 }, () => getInlineBlock())],
                  direction: null,
                  format: '',
                  indent: 0,
                  type: 'paragraph',
                  version: 1,
                  textFormat: 0,
                  textStyle: '',
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          },
          id: '67e1af0b78de3228e23ef1d5',
          blockName: '1',
        },
      ],
    },
  })

  await _payload.create({
    collection: 'lexical-access-control',
    data: {
      richText: {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'text ',
                  type: 'text',
                  version: 1,
                },
                {
                  children: [
                    {
                      detail: 0,
                      format: 0,
                      mode: 'normal',
                      style: '',
                      text: 'link',
                      type: 'text',
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'link',
                  version: 3,
                  fields: {
                    url: 'https://',
                    newTab: false,
                    linkType: 'custom',
                    blocks: [
                      {
                        id: '67e45673cbd5181ca8cbeef7',
                        blockType: 'block',
                      },
                    ],
                  },
                  id: '67e4566fcbd5181ca8cbeef5',
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
              textFormat: 0,
              textStyle: '',
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      title: 'title',
    },
    depth: 0,
  })

  await Promise.all([
    _payload.create({
      collection: customIDSlug,
      data: {
        id: nonStandardID,
      },
      depth: 0,
    }),
    _payload.create({
      collection: customTabIDSlug,
      data: {
        id: customTabID,
      },
      depth: 0,
    }),
    _payload.create({
      collection: customRowIDSlug,
      data: {
        id: customRowID,
      },
      depth: 0,
    }),
  ])
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
