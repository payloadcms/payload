import path from 'path'
import { getFileByPath, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { DraftPost } from './payload-types.js'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { generateLexicalData } from './collections/Diff/generateLexicalData.js'
import {
  autosaveWithValidateCollectionSlug,
  diffCollectionSlug,
  draftCollectionSlug,
  mediaCollectionSlug,
} from './slugs.js'
import { textToLexicalJSON } from './textToLexicalJSON.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export async function seed(_payload: Payload, parallel: boolean = false) {
  const blocksField: DraftPost['blocksField'] = [
    {
      blockType: 'block',
      localized: null,
      text: 'Hello World',
    },
  ]

  const imageFilePath = path.resolve(dirname, './image.jpg')
  const imageFile = await getFileByPath(imageFilePath)

  const { id: uploadedImage } = await _payload.create({
    collection: mediaCollectionSlug,
    data: {},
    file: imageFile,
  })

  const imageFilePath2 = path.resolve(dirname, './image.png')
  const imageFile2 = await getFileByPath(imageFilePath2)

  const { id: uploadedImage2 } = await _payload.create({
    collection: mediaCollectionSlug,
    data: {},
    file: imageFile2,
  })

  await executePromises(
    [
      () =>
        _payload.create({
          collection: 'users',
          data: {
            email: devUser.email,
            password: devUser.password,
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: draftCollectionSlug,
          data: {
            blocksField,
            description: 'Description',
            radio: 'test',
            title: 'Draft Title',
          },
          depth: 0,
          overrideAccess: true,
          draft: true,
        }),
    ],
    parallel,
  )

  const { id: manyDraftsID } = await _payload.create({
    collection: draftCollectionSlug,
    data: {
      blocksField,
      description: 'Description',
      radio: 'test',
      title: 'Title With Many Versions',
    },
    depth: 0,
    overrideAccess: true,
    draft: true,
  })

  for (let i = 0; i < 10; i++) {
    await _payload.update({
      id: manyDraftsID,
      collection: draftCollectionSlug,
      data: {
        title: `Title With Many Versions ${i + 2}`,
      },
      depth: 0,
      overrideAccess: true,
    })
  }

  const draft2 = await _payload.create({
    collection: draftCollectionSlug,
    data: {
      _status: 'published',
      blocksField,
      description: 'Description',
      radio: 'test',
      title: 'Published Title',
    },
    depth: 0,
    overrideAccess: true,
    draft: false,
  })

  await _payload.create({
    collection: autosaveWithValidateCollectionSlug,
    data: {
      title: 'Initial seeded title',
    },
  })

  const { id: doc1ID } = await _payload.create({
    collection: 'text',
    data: {
      text: 'Document 1',
    },
  })

  const { id: doc2ID } = await _payload.create({
    collection: 'text',
    data: {
      text: 'Document 2',
    },
  })

  const diffDoc = await _payload.create({
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      array: [
        {
          textInArray: 'textInArray',
        },
      ],
      arrayLocalized: [
        {
          textInArrayLocalized: 'textInArrayLocalized',
        },
      ],
      blocks: [
        {
          blockType: 'TextBlock',
          textInBlock: 'textInBlock',
        },
        {
          blockType: 'CollapsibleBlock',
          textInCollapsibleInCollapsibleBlock: 'textInCollapsibleInCollapsibleBlock',
          textInRowInCollapsibleBlock: 'textInRowInCollapsibleBlock',
        },
        {
          blockType: 'TabsBlock',
          namedTab1InBlock: {
            textInNamedTab1InBlock: 'textInNamedTab1InBlock',
          },
          textInUnnamedTab2InBlock: 'textInUnnamedTab2InBlock',
        },
      ],
      checkbox: true,
      code: 'code',
      date: '2021-01-01T00:00:00.000Z',
      email: 'email@email.com',
      group: {
        textInGroup: 'textInGroup',
      },
      namedTab1: {
        textInNamedTab1: 'textInNamedTab1',
      },
      number: 1,
      point: [1, 2],
      radio: 'option1',
      relationship: manyDraftsID,
      richtext: generateLexicalData({
        mediaID: uploadedImage,
        textID: doc1ID,
        updated: false,
      }) as any,
      richtextWithCustomDiff: textToLexicalJSON({ text: 'richtextWithCustomDiff' }),
      select: 'option1',
      text: 'text',
      textArea: 'textArea',
      textInCollapsible: 'textInCollapsible',
      textInRow: 'textInRow',
      textInUnnamedTab2: 'textInUnnamedTab2',
      upload: uploadedImage,
    },
    depth: 0,
  })

  const updatedDiffDoc = await _payload.update({
    id: diffDoc.id,
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      array: [
        {
          textInArray: 'textInArray2',
        },
      ],
      arrayLocalized: [
        {
          textInArrayLocalized: 'textInArrayLocalized2',
        },
      ],
      blocks: [
        {
          blockType: 'TextBlock',
          textInBlock: 'textInBlock2',
        },
        {
          blockType: 'CollapsibleBlock',
          textInCollapsibleInCollapsibleBlock: 'textInCollapsibleInCollapsibleBlock2',
          textInRowInCollapsibleBlock: 'textInRowInCollapsibleBlock2',
        },
        {
          blockType: 'TabsBlock',
          namedTab1InBlock: {
            textInNamedTab1InBlock: 'textInNamedTab1InBlock2',
          },
          textInUnnamedTab2InBlock: 'textInUnnamedTab2InBlock2',
        },
      ],
      checkbox: false,
      code: 'code2',
      date: '2023-01-01T00:00:00.000Z',
      email: 'email2@email.com',
      group: {
        textInGroup: 'textInGroup2',
      },
      namedTab1: {
        textInNamedTab1: 'textInNamedTab12',
      },
      number: 2,
      point: [1, 3],
      radio: 'option2',
      relationship: draft2.id,
      richtext: generateLexicalData({
        mediaID: uploadedImage2,
        textID: doc2ID,
        updated: true,
      }) as any,
      richtextWithCustomDiff: textToLexicalJSON({ text: 'richtextWithCustomDiff2' }),
      select: 'option2',
      text: 'text2',
      textArea: 'textArea2',
      textInCollapsible: 'textInCollapsible2',
      textInRow: 'textInRow2',
      textInUnnamedTab2: 'textInUnnamedTab22',
      upload: uploadedImage2,
    },
    depth: 0,
  })
}
