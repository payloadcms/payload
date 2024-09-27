import { type Payload } from 'payload'

import type { DraftPost } from './payload-types.js'

import { devUser } from '@test-utils/credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { titleToDelete } from './shared.js'
import { draftCollectionSlug } from './slugs.js'

export async function seed(_payload: Payload, parallel: boolean = false) {
  const blocksField: DraftPost['blocksField'] = [
    {
      blockType: 'block',
      localized: null,
      text: 'Hello World',
    },
  ]

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

  await _payload.create({
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
}
