/* eslint-disable @typescript-eslint/ban-ts-comment */
import fs from 'fs'
import path from 'path'

import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'
import ArrayFields, { arrayDoc } from './collections/Array'
import BlockFields, { blocksDoc } from './collections/Blocks'
import CodeFields, { codeDoc } from './collections/Code'
import CollapsibleFields, { collapsibleDoc } from './collections/Collapsible'
import ConditionalLogic, { conditionalLogicDoc } from './collections/ConditionalLogic'
import DateFields, { dateDoc } from './collections/Date'
import GroupFields, { groupDoc } from './collections/Group'
import IndexedFields from './collections/Indexed'
import JSONFields, { jsonDoc } from './collections/JSON'
import NumberFields, { numberDoc } from './collections/Number'
import PointFields, { pointDoc } from './collections/Point'
import RadioFields, { radiosDoc } from './collections/Radio'
import RelationshipFields from './collections/Relationship'
import RichTextFields, { richTextBulletsDoc, richTextDoc } from './collections/RichText'
import RowFields from './collections/Row'
import SelectFields, { selectsDoc } from './collections/Select'
import TabsFields, { tabsDoc } from './collections/Tabs'
import TextFields, { textDoc, textFieldsSlug } from './collections/Text'
import Uploads, { uploadsDoc } from './collections/Upload'
import Uploads2 from './collections/Upload2'
import Uploads3 from './collections/Uploads3'

export default buildConfigWithDefaults({
  admin: {
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config?.resolve?.alias,
          fs: path.resolve(__dirname, './mocks/emptyModule.js'),
        },
      },
    }),
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'email',
      },
      fields: [
        {
          name: 'canViewConditionalField',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
    ArrayFields,
    BlockFields,
    CodeFields,
    CollapsibleFields,
    ConditionalLogic,
    DateFields,
    RadioFields,
    GroupFields,
    RowFields,
    IndexedFields,
    JSONFields,
    NumberFields,
    PointFields,
    RelationshipFields,
    RichTextFields,
    SelectFields,
    TabsFields,
    TextFields,
    Uploads,
    Uploads2,
    Uploads3,
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    fallback: true,
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    const createdArrayDoc = await payload.create({ collection: 'array-fields', data: arrayDoc })
    await payload.create({ collection: 'collapsible-fields', data: collapsibleDoc })
    await payload.create({ collection: 'conditional-logic', data: conditionalLogicDoc })
    await payload.create({ collection: 'group-fields', data: groupDoc })
    await payload.create({ collection: 'select-fields', data: selectsDoc })
    await payload.create({ collection: 'radio-fields', data: radiosDoc })
    await payload.create({ collection: 'tabs-fields', data: tabsDoc })
    await payload.create({ collection: 'point-fields', data: pointDoc })
    await payload.create({ collection: 'date-fields', data: dateDoc })
    await payload.create({ collection: 'code-fields', data: codeDoc })
    await payload.create({ collection: 'json-fields', data: jsonDoc })

    const createdTextDoc = await payload.create({ collection: textFieldsSlug, data: textDoc })

    const uploadsDir = path.resolve(__dirname, './collections/Upload/uploads')

    if (fs.existsSync(uploadsDir))
      fs.readdirSync(uploadsDir).forEach((f) => fs.rmSync(`${uploadsDir}/${f}`))

    const pngPath = path.resolve(__dirname, './uploads/payload.png')
    const pngFile = await getFileByPath(pngPath)
    const createdPNGDoc = await payload.create({ collection: 'uploads', data: {}, file: pngFile })

    const jpgPath = path.resolve(__dirname, './collections/Upload/payload.jpg')
    const jpgFile = await getFileByPath(jpgPath)
    const createdJPGDoc = await payload.create({
      collection: 'uploads',
      data: {
        ...uploadsDoc,
        media: createdPNGDoc.id,
      },
      file: jpgFile,
    })

    const richTextDocWithRelId = JSON.parse(
      JSON.stringify(richTextDoc).replace(/\{\{ARRAY_DOC_ID\}\}/g, createdArrayDoc.id),
    )
    const richTextDocWithRelationship = { ...richTextDocWithRelId }

    const richTextRelationshipIndex = richTextDocWithRelationship.richText.findIndex(
      ({ type }) => type === 'relationship',
    )
    richTextDocWithRelationship.richText[richTextRelationshipIndex].value = {
      id: createdTextDoc.id,
    }
    richTextDocWithRelationship.richTextReadOnly[richTextRelationshipIndex].value = {
      id: createdTextDoc.id,
    }

    const richTextUploadIndex = richTextDocWithRelationship.richText.findIndex(
      ({ type }) => type === 'upload',
    )
    richTextDocWithRelationship.richText[richTextUploadIndex].value = { id: createdJPGDoc.id }
    richTextDocWithRelationship.richTextReadOnly[richTextUploadIndex].value = {
      id: createdJPGDoc.id,
    }

    await payload.create({ collection: 'rich-text-fields', data: richTextBulletsDoc })
    await payload.create({ collection: 'rich-text-fields', data: richTextDocWithRelationship })

    await payload.create({ collection: 'number-fields', data: { number: 2 } });
    await payload.create({ collection: 'number-fields', data: { number: 3 } });
    await payload.create({ collection: 'number-fields', data: numberDoc })

    const blocksDocWithRichText = { ...blocksDoc }

    // @ts-ignore
    blocksDocWithRichText.blocks[0].richText = richTextDocWithRelationship.richText
    // @ts-ignore
    blocksDocWithRichText.localizedBlocks[0].richText = richTextDocWithRelationship.richText

    await payload.create({ collection: 'block-fields', data: blocksDocWithRichText })
  },
})
