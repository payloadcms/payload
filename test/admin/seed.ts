import type { Payload } from '../../packages/payload/src'

import { devUser } from '../credentials'
import { seedDB } from '../helpers/seed'
import {
  collectionSlugs,
  customViews1CollectionSlug,
  customViews2CollectionSlug,
  geoCollectionSlug,
  noApiViewCollectionSlug,
  postsCollectionSlug,
  usersCollectionSlug,
  customIdCollectionSlug,
  customIdCollectionId,
} from './slugs'

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    snapshotKey: 'adminTest',
    shouldResetDB: true,
    collectionSlugs,
    _payload,
    seedFunction: async (_payload) => {
      await Promise.all([
        _payload.create({
          collection: usersCollectionSlug,
          data: {
            email: devUser.email,
            password: devUser.password,
          },
        }),
        ...[...Array(11)].map(() => {
          _payload.create({
            collection: postsCollectionSlug,
            data: {
              title: 'Title',
              description: 'Description',
            },
          })
        }),
        _payload.create({
          collection: customViews1CollectionSlug,
          data: {
            title: 'Custom View',
          },
        }),
        _payload.create({
          collection: customViews2CollectionSlug,
          data: {
            title: 'Custom View',
          },
        }),
        _payload.create({
          collection: geoCollectionSlug,
          data: {
            point: [7, -7],
          },
        }),
        _payload.create({
          collection: geoCollectionSlug,
          data: {
            point: [5, -5],
          },
        }),
        _payload.create({
          collection: noApiViewCollectionSlug,
          data: {},
        }),
        _payload.create({
          collection: 'customIdTab',
          data: {
            id: customIdCollectionId,
            title: 'Hello world title',
          },
        }),
        _payload.create({
          collection: 'customIdRow',
          data: {
            id: customIdCollectionId,
            title: 'Hello world title',
          },
        }),
      ])
    },
  })
}
