import path from 'path'

import { type Payload } from '../../packages/payload/src'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { devUser } from '../credentials'
import { seedDB } from '../helpers/seed'
import { anotherArrayDoc, arrayDoc } from './collections/Array/shared'
import { blocksDoc } from './collections/Blocks/shared'
import { codeDoc } from './collections/Code/shared'
import { collapsibleDoc } from './collections/Collapsible/shared'
import { conditionalLogicDoc } from './collections/ConditionalLogic/shared'
import { dateDoc } from './collections/Date/shared'
import { groupDoc } from './collections/Group/shared'
import { jsonDoc } from './collections/JSON/shared'
import { lexicalDocData } from './collections/Lexical/data'
import { lexicalMigrateDocData } from './collections/LexicalMigrate/data'
import { numberDoc } from './collections/Number/shared'
import { pointDoc } from './collections/Point/shared'
import { radiosDoc } from './collections/Radio/shared'
import { richTextBulletsDocData, richTextDocData } from './collections/RichText/data'
import { selectsDoc } from './collections/Select/shared'
import { tabsDoc } from './collections/Tabs/shared'
import { anotherTextDoc, textDoc } from './collections/Text/shared'
import { uploadsDoc } from './collections/Upload/shared'
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
} from './slugs'

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs,
    seedFunction: async (_payload) => {
      const jpgPath = path.resolve(__dirname, './collections/Upload/payload.jpg')
      const pngPath = path.resolve(__dirname, './uploads/payload.png')

      // Get both files in parallel
      const [jpgFile, pngFile] = await Promise.all([getFileByPath(jpgPath), getFileByPath(pngPath)])

      const [
        createdArrayDoc,
        createdAnotherArrayDoc,
        createdTextDoc,
        createdAnotherTextDoc,
        createdPNGDoc,
      ] = await Promise.all([
        _payload.create({ collection: arrayFieldsSlug, data: arrayDoc }),
        _payload.create({ collection: arrayFieldsSlug, data: anotherArrayDoc }),
        _payload.create({ collection: textFieldsSlug, data: textDoc }),
        _payload.create({ collection: textFieldsSlug, data: anotherTextDoc }),
        _payload.create({ collection: uploadsSlug, data: {}, file: pngFile }),
      ])

      const createdJPGDoc = await _payload.create({
        collection: uploadsSlug,
        data: {
          ...uploadsDoc,
          media: createdPNGDoc.id,
        },
        file: jpgFile,
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

      await _payload.create({ collection: richTextFieldsSlug, data: richTextBulletsDocWithRelId })

      const createdRichTextDoc = await _payload.create({
        collection: richTextFieldsSlug,
        data: richTextDocWithRelationship,
      })

      const formattedRichTextDocID =
        _payload.db.defaultIDType === 'number'
          ? createdRichTextDoc.id
          : `"${createdRichTextDoc.id}"`

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

      await Promise.all([
        _payload.create({
          collection: usersSlug,
          data: {
            email: devUser.email,
            password: devUser.password,
          },
        }),
        _payload.create({ collection: collapsibleFieldsSlug, data: collapsibleDoc }),
        _payload.create({ collection: conditionalLogicSlug, data: conditionalLogicDoc }),
        _payload.create({ collection: groupFieldsSlug, data: groupDoc }),
        _payload.create({ collection: selectFieldsSlug, data: selectsDoc }),
        _payload.create({ collection: radioFieldsSlug, data: radiosDoc }),
        _payload.create({ collection: tabsFieldsSlug, data: tabsDoc }),
        _payload.create({ collection: pointFieldsSlug, data: pointDoc }),
        _payload.create({ collection: dateFieldsSlug, data: dateDoc }),
        _payload.create({ collection: codeFieldsSlug, data: codeDoc }),
        _payload.create({ collection: jsonFieldsSlug, data: jsonDoc }),

        _payload.create({ collection: blockFieldsSlug, data: blocksDocWithRichText }),

        _payload.create({ collection: lexicalFieldsSlug, data: lexicalDocWithRelId }),
        _payload.create({
          collection: lexicalMigrateFieldsSlug,
          data: lexicalMigrateDocWithRelId,
        }),

        _payload.create({ collection: numberFieldsSlug, data: { number: 2 } }),
        _payload.create({ collection: numberFieldsSlug, data: { number: 3 } }),
        _payload.create({ collection: numberFieldsSlug, data: numberDoc }),
      ])
    },
    shouldResetDB: true,
    snapshotKey: 'fieldsTest',
    uploadsDir: path.resolve(__dirname, './collections/Upload/uploads'),
  })
}
