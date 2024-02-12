import { type Payload } from '../../packages/payload/src'
import { devUser } from '../credentials'
import { seedDB } from '../helpers/seed'
import { titleToDelete } from './shared'
import { collectionSlugs, draftCollectionSlug } from './slugs'

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    snapshotKey: 'versionsTest',
    shouldResetDB: true,
    collectionSlugs,
    _payload,
    seedFunction: async (_payload) => {
      const blocksField = [
        {
          blockType: 'block',
          localized: 'text',
          text: 'text',
        },
      ]

      await Promise.all([
        _payload.create({
          collection: 'users',
          data: {
            email: devUser.email,
            password: devUser.password,
          },
        }),
        _payload.create({
          collection: draftCollectionSlug,
          data: {
            blocksField,
            description: 'Description',
            radio: 'test',
            title: 'Draft Title',
          },
          draft: true,
        }),
      ])

      const { id: manyDraftsID } = await _payload.create({
        collection: draftCollectionSlug,
        data: {
          blocksField,
          description: 'Description',
          radio: 'test',
          title: 'Title With Many Versions',
        },
        draft: true,
      })

      for (let i = 0; i < 10; i++) {
        await _payload.update({
          id: manyDraftsID,
          collection: draftCollectionSlug,
          data: {
            title: `Title With Many Versions ${i + 2}`,
          },
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
        draft: false,
      })

      await _payload.create({
        collection: draftCollectionSlug,
        data: {
          blocksField,
          description: 'Description',
          title: titleToDelete,
        },
        draft: true,
      })
    },
  })
}
