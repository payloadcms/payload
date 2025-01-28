import path from 'path'
import { getFileByPath, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { DraftPost } from './payload-types.js'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { titleToDelete } from './shared.js'
import { diffCollectionSlug, draftCollectionSlug, mediaCollectionSlug } from './slugs.js'
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
    collection: draftCollectionSlug,
    data: {
      blocksField,
      description: 'Description',
      title: titleToDelete,
    },
    depth: 0,
    overrideAccess: true,
    draft: true,
  })

  const diffDoc = await _payload.create({
    collection: diffCollectionSlug,
    data: {
      array: [
        {
          textInArray: 'textInArray',
        },
      ],
      blocks: [
        {
          blockType: 'TextBlock',
          textInBlock: 'textInBlock',
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
      richtext: textToLexicalJSON({ text: 'richtext' }),
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
    data: {
      array: [
        {
          textInArray: 'textInArray2',
        },
      ],
      blocks: [
        {
          blockType: 'TextBlock',
          textInBlock: 'textInBlock2',
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
      richtext: textToLexicalJSON({ text: 'richtext2' }),
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
