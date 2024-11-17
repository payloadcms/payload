import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import {
  collectionSlugs,
  customIdCollectionId,
  customViews1CollectionSlug,
  customViews2CollectionSlug,
  geoCollectionSlug,
  noApiViewCollectionSlug,
  postsCollectionSlug,
  usersCollectionSlug,
} from './slugs.js'

export const seed = async (_payload) => {
  await executePromises(
    [
      () =>
        _payload.create({
          collection: usersCollectionSlug,
          data: {
            email: devUser.email,
            password: devUser.password,
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'base-list-filters',
          data: {
            title: 'show me',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'base-list-filters',
          data: {
            title: 'hide me',
          },
          depth: 0,
          overrideAccess: true,
        }),
      ...[...Array(11)].map((_, i) => async () => {
        const postDoc = await _payload.create({
          collection: postsCollectionSlug,
          data: {
            description: 'Description',
            title: `Post ${i + 1}`,
          },
          depth: 0,
          overrideAccess: true,
        })

        return await _payload.update({
          collection: postsCollectionSlug,
          where: {
            id: {
              equals: postDoc.id,
            },
          },
          data: {
            relationship: postDoc.id,
          },
          depth: 0,
          overrideAccess: true,
        })
      }),
      () =>
        _payload.create({
          collection: customViews1CollectionSlug,
          data: {
            title: 'Custom View',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: customViews2CollectionSlug,
          data: {
            title: 'Custom View',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: geoCollectionSlug,
          data: {
            point: [7, -7],
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: geoCollectionSlug,
          data: {
            point: [5, -5],
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: noApiViewCollectionSlug,
          data: {},
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'customIdTab',
          data: {
            id: customIdCollectionId,
            title: 'Hello world title',
          },
          depth: 0,
          overrideAccess: true,
        }),
      () =>
        _payload.create({
          collection: 'customIdRow',
          data: {
            id: customIdCollectionId,
            title: 'Hello world title',
          },
          depth: 0,
          overrideAccess: true,
        }),
    ],
    false,
  )
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs,
    seedFunction: seed,
    snapshotKey: 'adminTests',
  })
}
