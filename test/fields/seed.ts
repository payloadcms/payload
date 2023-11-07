import path from 'path'

import { type Payload } from '../../packages/payload/src'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { devUser } from '../credentials'
import { seedDB } from '../helpers/seed'
import { arrayDoc } from './collections/Array'
import { blocksDoc } from './collections/Blocks'
import { codeDoc } from './collections/Code'
import { collapsibleDoc } from './collections/Collapsible'
import { conditionalLogicDoc } from './collections/ConditionalLogic'
import { dateDoc } from './collections/Date'
import { groupDoc } from './collections/Group'
import { jsonDoc } from './collections/JSON'
import { lexicalRichTextDoc } from './collections/Lexical/data'
import { numberDoc } from './collections/Number'
import { pointDoc } from './collections/Point'
import { radiosDoc } from './collections/Radio'
import { richTextBulletsDoc, richTextDoc } from './collections/RichText/data'
import { selectsDoc } from './collections/Select'
import { tabsDoc } from './collections/Tabs'
import { textDoc } from './collections/Text'
import { uploadsDoc } from './collections/Upload'
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
    snapshotKey: 'fieldsTest',
    shouldResetDB: true,
    collectionSlugs,
    _payload,
    uploadsDir: path.resolve(__dirname, './collections/Upload/uploads'),
    seedFunction: async (_payload) => {
      const jpgPath = path.resolve(__dirname, './collections/Upload/payload.jpg')
      const pngPath = path.resolve(__dirname, './uploads/payload.png')

      // Get both files in parallel
      const [jpgFile, pngFile] = await Promise.all([getFileByPath(jpgPath), getFileByPath(pngPath)])

      const [createdArrayDoc, createdTextDoc, createdPNGDoc] = await Promise.all([
        _payload.create({ collection: arrayFieldsSlug, data: arrayDoc }),
        _payload.create({ collection: textFieldsSlug, data: textDoc }),
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
        JSON.stringify(richTextDoc)
          .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
          .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
          .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`),
      )
      const richTextBulletsDocWithRelId = JSON.parse(
        JSON.stringify(richTextBulletsDoc)
          .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
          .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
          .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`),
      )

      const richTextDocWithRelationship = { ...richTextDocWithRelId }

      const blocksDocWithRichText = { ...blocksDoc }

      blocksDocWithRichText.blocks[0].richText = richTextDocWithRelationship.richText
      blocksDocWithRichText.localizedBlocks[0].richText = richTextDocWithRelationship.richText

      const lexicalRichTextDocWithRelId = JSON.parse(
        JSON.stringify(lexicalRichTextDoc)
          .replace(/"\{\{ARRAY_DOC_ID\}\}"/g, `${formattedID}`)
          .replace(/"\{\{UPLOAD_DOC_ID\}\}"/g, `${formattedJPGID}`)
          .replace(/"\{\{TEXT_DOC_ID\}\}"/g, `${formattedTextID}`),
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

        _payload.create({ collection: lexicalFieldsSlug, data: lexicalRichTextDocWithRelId }),
        _payload.create({
          collection: lexicalMigrateFieldsSlug,
          data: lexicalRichTextDocWithRelId,
        }),

        _payload.create({ collection: richTextFieldsSlug, data: richTextBulletsDocWithRelId }),
        _payload.create({ collection: richTextFieldsSlug, data: richTextDocWithRelationship }),

        _payload.create({ collection: numberFieldsSlug, data: { number: 2 } }),
        _payload.create({ collection: numberFieldsSlug, data: { number: 3 } }),
        _payload.create({ collection: numberFieldsSlug, data: numberDoc }),
      ])
    },
  })
}
