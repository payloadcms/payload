import fs from 'fs'
import path from 'path'

import { type Payload } from '../../packages/payload/src'
import getFileByPath from '../../packages/payload/src/uploads/getFileByPath'
import { devUser } from '../credentials'
import {
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
} from './collectionSlugs'
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

let dbSnapshot = {}

async function createSnapshot(collectionsObj) {
  console.log('Creating snapshot')
  const snapshot = {}

  // Assuming `collectionsObj` is an object where keys are names and values are collection references
  for (const collectionName of Object.keys(collectionsObj)) {
    const collection = collectionsObj[collectionName]
    const documents = await collection.find({}).toArray() // Get all documents
    snapshot[collectionName] = documents
  }

  dbSnapshot = snapshot // Save the snapshot in memory
}

async function restoreFromSnapshot(collectionsObj) {
  if (!dbSnapshot) {
    throw new Error('No snapshot found to restore from.')
  }

  // Assuming `collectionsObj` is an object where keys are names and values are collection references
  for (const [name, documents] of Object.entries(dbSnapshot)) {
    const collection = collectionsObj[name]
    // You would typically clear the collection here, but as per your requirement, you do it manually
    if ((documents as any[]).length > 0) {
      await collection.insertMany(documents)
    }
  }
}

export async function clearAndSeedEverything(_payload: Payload) {
  // Reset DB
  const uploadsDir = path.resolve(__dirname, './collections/Upload/uploads')
  // Prepare the filesystem operation as a promise
  const clearUploadsDirPromise = fs.promises
    .access(uploadsDir)
    .then(() => fs.promises.readdir(uploadsDir))
    .then((files) => Promise.all(files.map((file) => fs.promises.rm(path.join(uploadsDir, file)))))
    .catch((error) => {
      if (error.code !== 'ENOENT') {
        // If the error is not because the directory doesn't exist
        console.error('Error clearing the uploads directory:', error)
        throw error
      }
      // If the directory does not exist, resolve the promise (nothing to clear)
      return
    })

  //const dbName = _payload.db.collections[collectionSlugs[0]].db.collections['']

  await Promise.all([
    _payload.db.collections[collectionSlugs[0]].db.dropDatabase(),

    clearUploadsDirPromise,
  ])

  let restored = false
  if (dbSnapshot && Object.keys(dbSnapshot).length) {
    //console.log('Restoring')
    const mongooseCollections = _payload.db.collections[collectionSlugs[0]].db.collections
    await restoreFromSnapshot(mongooseCollections)
    //console.log('Snapshot restored')
    restored = true
  }

  // .db.dropDatabase() breaks indexes, so we need to recreate them
  await Promise.all([
    ...collectionSlugs.map(async (collectionSlug) => {
      await _payload.db.collections[collectionSlug].createIndexes()
    }),
  ])

  if (restored) {
    return
  }

  // SEED
  const jpgPath = path.resolve(__dirname, './collections/Upload/payload.jpg')
  const pngPath = path.resolve(__dirname, './uploads/payload.png')

  // Get both files in parallel
  const [jpgFile, pngFile] = await Promise.all([getFileByPath(jpgPath), getFileByPath(pngPath)])

  const [createdArrayDoc, createdTextDoc, createdPNGDoc] = await Promise.all([
    _payload.create({ collection: 'array-fields', data: arrayDoc }),
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

  // @ts-ignore
  blocksDocWithRichText.blocks[0].richText = richTextDocWithRelationship.richText
  // @ts-ignore
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

  const mongooseCollections2 = _payload.db.collections[collectionSlugs[0]].db.collections

  await createSnapshot(mongooseCollections2)
  //console.log('snapshot created')
}
