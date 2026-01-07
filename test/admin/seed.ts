import type { Payload } from '../../packages/payload/src'

import { devUser } from '../credentials'
import { seedDB } from '../helpers/seed'
import {
  collectionSlugs,
  customIdCollectionId,
  customIdCollectionSlug,
  customViews1CollectionSlug,
  customViews2CollectionSlug,
  geoCollectionSlug,
  noApiViewCollectionSlug,
  postsCollectionSlug,
  usersCollectionSlug,
} from './slugs'

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    snapshotKey: 'adminTest',
    shouldResetDB: true,
    collectionSlugs,
    _payload,
    seedFunction: async (_payload) => {
      await _payload.create({
        collection: usersCollectionSlug,
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })

      for (let i = 0; i < 11; i++) {
        await _payload.create({
          collection: postsCollectionSlug,
          data: {
            title: 'Title',
            description: 'Description',
          },
        })
      }

      await _payload.create({
        collection: customViews1CollectionSlug,
        data: {
          title: 'Custom View',
        },
      })

      await _payload.create({
        collection: customViews2CollectionSlug,
        data: {
          title: 'Custom View',
        },
      })

      await _payload.create({
        collection: geoCollectionSlug,
        data: {
          point: [7, -7],
        },
      })

      await _payload.create({
        collection: geoCollectionSlug,
        data: {
          point: [5, -5],
        },
      })

      await _payload.create({
        collection: noApiViewCollectionSlug,
        data: {},
      })

      await _payload.create({
        collection: 'customIdTab',
        data: {
          id: customIdCollectionId,
          title: 'Hello world title',
        },
      })

      await _payload.create({
        collection: 'customIdRow',
        data: {
          id: customIdCollectionId,
          title: 'Hello world title',
        },
      })
    },
  })
}
