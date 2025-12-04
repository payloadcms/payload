import type { Payload } from 'payload'

import path from 'path'
import { getFileByPath } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { seedDB } from '../helpers/seed.js'
// TODO: decouple blocks from both test suites
import { richTextDocData } from '../lexical/collections/RichText/data.js'
import { arrayDoc } from './collections/Array/shared.js'
import { blocksDoc } from './collections/Blocks/shared.js'
import { codeDoc } from './collections/Code/shared.js'
import { collapsibleDoc } from './collections/Collapsible/shared.js'
import { conditionalLogicDoc } from './collections/ConditionalLogic/shared.js'
import { customRowID, customTabID, nonStandardID } from './collections/CustomID/shared.js'
import { dateDoc } from './collections/Date/shared.js'
import { anotherEmailDoc, emailDoc } from './collections/Email/shared.js'
import { namedGroupDoc } from './collections/Group/shared.js'
import { jsonDoc } from './collections/JSON/shared.js'
import { numberDoc } from './collections/Number/shared.js'
import { pointDoc } from './collections/Point/shared.js'
import { radiosDoc } from './collections/Radio/shared.js'
import { selectsDoc } from './collections/Select/shared.js'
import { slugFieldDoc } from './collections/SlugField/shared.js'
import { tabsDoc } from './collections/Tabs/shared.js'
import { anotherTextDoc, textDoc } from './collections/Text/shared.js'
import { anotherTextareaDoc, textareaDoc } from './collections/Textarea/shared.js'
import { uploadsDoc } from './collections/Upload/shared.js'
import {
  arrayFieldsSlug,
  blockFieldsSlug,
  checkboxFieldsSlug,
  codeFieldsSlug,
  collapsibleFieldsSlug,
  collectionSlugs,
  conditionalLogicSlug,
  customIDSlug,
  customRowIDSlug,
  customTabIDSlug,
  dateFieldsSlug,
  emailFieldsSlug,
  groupFieldsSlug,
  jsonFieldsSlug,
  numberFieldsSlug,
  pointFieldsSlug,
  radioFieldsSlug,
  relationshipFieldsSlug,
  selectFieldsSlug,
  slugFieldsSlug,
  tabsFieldsSlug,
  textareaFieldsSlug,
  textFieldsSlug,
  uiSlug,
  uploadsMulti,
  uploadsPoly,
  uploadsSlug,
  usersSlug,
} from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (_payload: Payload) => {
  const jpgPath = path.resolve(dirname, './collections/Upload/payload.jpg')
  const jpg480x320Path = path.resolve(dirname, './collections/Upload/payload480x320.jpg')
  const pngPath = path.resolve(dirname, './uploads/payload.png')

  // Get both files in parallel
  const [jpgFile, jpg480x320File, pngFile] = await Promise.all([
    getFileByPath(jpgPath),
    getFileByPath(jpg480x320Path),
    getFileByPath(pngPath),
  ])

  const createdArrayDoc = await _payload.create({
    collection: arrayFieldsSlug,
    data: arrayDoc,
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

  const createdTextareaDoc = await _payload.create({
    collection: textareaFieldsSlug,
    data: textareaDoc,
    depth: 0,
    overrideAccess: true,
  })

  const createdAnotherTextareaDoc = await _payload.create({
    collection: textareaFieldsSlug,
    data: anotherTextareaDoc,
    depth: 0,
    overrideAccess: true,
  })

  const createdSlugDoc = await _payload.create({
    collection: slugFieldsSlug,
    data: slugFieldDoc,
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

  await _payload.create({
    collection: uploadsSlug,
    data: {},
    file: jpg480x320File,
    depth: 0,
    overrideAccess: true,
  })

  // const createdJPGDocSlug2 = await _payload.create({
  //   collection: uploads2Slug,
  //   data: {
  //     ...uploadsDoc,
  //   },
  //   file: jpgFile,
  //   depth: 0,
  //   overrideAccess: true,
  // })

  // Create hasMany upload
  await _payload.create({
    collection: uploadsMulti,
    data: {
      media: [createdPNGDoc.id],
    },
  })

  // Create hasMany poly upload
  // await _payload.create({
  //   collection: uploadsMultiPoly,
  //   data: {
  //     media: [
  //       { value: createdJPGDocSlug2.id, relationTo: uploads2Slug },
  //       { value: createdJPGDoc.id, relationTo: uploadsSlug },
  //     ],
  //   },
  // })

  // Create poly upload
  await _payload.create({
    collection: uploadsPoly,
    data: {
      media: { value: createdJPGDoc.id, relationTo: uploadsSlug },
    },
  })
  // Create poly upload
  // await _payload.create({
  //   collection: uploadsPoly,
  //   data: {
  //     media: { value: createdJPGDocSlug2.id, relationTo: uploads2Slug },
  //   },
  // })
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
  const blocksDocWithRichText = {
    ...(blocksDoc as any),
  }
  const richTextDocWithRelationship = { ...richTextDocWithRelId }

  blocksDocWithRichText.blocks[0].richText = richTextDocWithRelationship.richText
  blocksDocWithRichText.localizedBlocks[0].richText = richTextDocWithRelationship.richText

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
    data: namedGroupDoc,
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
