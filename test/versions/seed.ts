import { buildEditorState, type DefaultNodeTypes } from '@payloadcms/richtext-lexical'
import path from 'path'
import { getFileByPath, type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { DraftPost } from './payload-types.js'

import { devUser } from '../credentials.js'
import { executePromises } from '../__helpers/shared/executePromises.js'
import { generateLexicalData } from './collections/Diff/generateLexicalData.js'
import {
  autosaveWithDraftValidateSlug,
  diffCollectionSlug,
  draftCollectionSlug,
  media2CollectionSlug,
  mediaCollectionSlug,
} from './slugs.js'

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

  const { id: uploadedImageMedia2 } = await _payload.create({
    collection: media2CollectionSlug,
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

  const { id: uploadedImage2Media2 } = await _payload.create({
    collection: media2CollectionSlug,
    data: {},
    file: imageFile2,
  })

  const { id: devUserID } = await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
    depth: 0,
    overrideAccess: true,
  })

  await executePromises(
    [
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

  const draft3 = await _payload.create({
    collection: draftCollectionSlug,
    data: {
      _status: 'published',
      blocksField,
      description: 'Description2',
      radio: 'test',
      title: 'Another Published Title',
    },
    depth: 0,
    overrideAccess: true,
    draft: false,
  })

  await _payload.create({
    collection: autosaveWithDraftValidateSlug,
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

  const diffDocDraft = await _payload.create({
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      _status: 'draft',
      text: 'Draft 1',
    },
    depth: 0,
  })

  await _payload.update({
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      _status: 'draft',
      text: 'Draft 2',
    },
    depth: 0,
    id: diffDocDraft.id,
  })

  await _payload.update({
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      _status: 'draft',
      text: 'Draft 3',
    },
    depth: 0,
    id: diffDocDraft.id,
  })
  await _payload.update({
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      _status: 'draft',
      text: 'Draft 4',
    },
    depth: 0,
    id: diffDocDraft.id,
  })

  const diffDoc = await _payload.update({
    collection: diffCollectionSlug,
    locale: 'en',
    id: diffDocDraft.id,
    data: {
      _status: 'published',
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
          textInRowInUnnamedTab2InBlock: 'textInRowInUnnamedTab2InBlock',
          textInUnnamedTab2InBlockAccessFalse: 'textInUnnamedTab2InBlockAccessFalse',
        },
      ],
      checkbox: true,
      code: 'code',
      date: '2021-04-01T00:00:00.000Z',
      email: 'email@email.com',
      textInUnnamedGroup: 'textInUnnamedGroup',
      textInUnnamedLabeledGroup: 'textInUnnamedLabeledGroup',
      group: {
        textInGroup: 'textInGroup',
      },
      namedTab1: {
        textInNamedTab1: 'textInNamedTab1',
        textInNamedTab1ReadFalse: 'textInNamedTab1ReadFalse',
        textInNamedTab1UpdateFalse: 'textInNamedTab1UpdateFalse',
      },
      number: 1,
      point: [1, 2],
      json: {
        text: 'json',
        number: 1,
        boolean: true,
        array: [
          {
            textInArrayInJson: 'textInArrayInJson',
          },
        ],
      },
      radio: 'option1',
      relationship: manyDraftsID,
      relationshipHasMany: [manyDraftsID],
      richtext: generateLexicalData({
        mediaID: uploadedImage,
        textID: doc1ID,
        updated: false,
      }) as any,
      richtextWithCustomDiff: buildEditorState<DefaultNodeTypes>({
        text: 'richtextWithCustomDiff',
      }),
      select: 'option1',
      text: 'text',
      textArea: 'textArea',
      textInCollapsible: 'textInCollapsible',
      textInRow: 'textInRow',
      textInUnnamedTab2: 'textInUnnamedTab2',
      textInRowInUnnamedTab: 'textInRowInUnnamedTab',
      textInRowInUnnamedTabUpdateFalse: 'textInRowInUnnamedTabUpdateFalse',

      textCannotRead: 'textCannotRead',
      relationshipPolymorphic: {
        relationTo: 'text',
        value: doc1ID,
      },
      relationshipHasManyPolymorphic: [
        {
          relationTo: 'text',
          value: doc1ID,
        },
      ],
      relationshipHasManyPolymorphic2: [
        {
          relationTo: 'text',
          value: doc1ID,
        },
        {
          relationTo: draftCollectionSlug,
          value: draft2.id,
        },
      ],
      upload: uploadedImage,
      uploadHasMany: [uploadedImage],
    },
    depth: 0,
  })

  const pointGeoJSON: any = {
    type: 'Point',
    coordinates: [1, 3],
  }

  await _payload.db.updateOne({
    collection: diffCollectionSlug,
    id: diffDoc.id,
    returning: false,
    data: {
      point: pointGeoJSON,
      createdAt: new Date(new Date(diffDoc.createdAt).getTime() - 2 * 60 * 10000).toISOString(),
      updatedAt: new Date(new Date(diffDoc.updatedAt).getTime() - 2 * 60 * 10000).toISOString(),
    },
  })

  const versions = await _payload.findVersions({
    collection: diffCollectionSlug,
    depth: 0,
    limit: 50,
    sort: '-createdAt',
  })

  let i = 0
  for (const version of versions.docs) {
    i += 1
    const date = new Date(new Date(version.createdAt).getTime() - 2 * 60 * 10000 * i).toISOString()
    await _payload.db.updateVersion({
      id: version.id,
      collection: diffCollectionSlug,
      returning: false,
      versionData: {
        createdAt: date,
        updatedAt: date,
      } as any,
    })
  }

  const updatedDiffDoc = await _payload.update({
    id: diffDoc.id,
    collection: diffCollectionSlug,
    locale: 'en',
    data: {
      _status: 'published',
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
          textInRowInUnnamedTab2InBlock: 'textInRowInUnnamedTab2InBlock2',
          textInUnnamedTab2InBlockAccessFalse: 'textInUnnamedTab2InBlockAccessFalse2',
        },
      ],
      checkbox: false,
      code: 'code2',
      date: '2023-04-01T00:00:00.000Z',
      email: 'email2@email.com',
      textInUnnamedGroup: 'textInUnnamedGroup2',
      textInUnnamedLabeledGroup: 'textInUnnamedLabeledGroup2',
      group: {
        textInGroup: 'textInGroup2',
      },
      namedTab1: {
        textInNamedTab1: 'textInNamedTab12',
        textInNamedTab1ReadFalse: 'textInNamedTab1ReadFalse2',
        textInNamedTab1UpdateFalse: 'textInNamedTab1UpdateFalse2',
      },
      number: 2,
      json: {
        text: 'json2',
        number: 2,
        boolean: true,
        array: [
          {
            textInArrayInJson: 'textInArrayInJson2',
          },
        ],
      },
      point: pointGeoJSON,
      radio: 'option2',
      relationship: draft2.id,
      relationshipHasMany: [manyDraftsID, draft2.id],
      relationshipPolymorphic: {
        relationTo: draftCollectionSlug,
        value: draft2.id,
      },
      relationshipHasManyPolymorphic: [
        {
          relationTo: 'text',
          value: doc1ID,
        },
        {
          relationTo: draftCollectionSlug,
          value: draft2.id,
        },
      ],
      relationshipHasManyPolymorphic2: [
        {
          relationTo: 'text',
          value: doc1ID,
        },
        {
          relationTo: draftCollectionSlug,
          value: draft3.id,
        },
      ],
      richtext: generateLexicalData({
        mediaID: uploadedImage2,
        textID: doc2ID,
        updated: true,
      }) as any,
      richtextWithCustomDiff: buildEditorState<DefaultNodeTypes>({
        text: 'richtextWithCustomDiff2',
      }),
      select: 'option2',
      text: 'text2',
      textArea: 'textArea2',
      textInCollapsible: 'textInCollapsible2',
      textInRow: 'textInRow2',
      textCannotRead: 'textCannotRead2',
      textInUnnamedTab2: 'textInUnnamedTab22',
      textInRowInUnnamedTab: 'textInRowInUnnamedTab2',
      textInRowInUnnamedTabUpdateFalse: 'textInRowInUnnamedTabUpdateFalse2',

      upload: uploadedImage2,
      uploadHasMany: [uploadedImage, uploadedImage2],
      zeroDepthRelationship: devUserID,
    },
    depth: 0,
  })
}
