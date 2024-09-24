import type { Payload } from 'payload'

import { devUser } from '@test-utils/credentials.js'
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
  if (_payload.db.name === 'mongoose') {
    await Promise.all(
      _payload.config.collections.map(async (coll) => {
        await new Promise((resolve, reject) => {
          _payload.db?.collections[coll.slug]?.ensureIndexes(function (err) {
            if (err) {
              // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
              reject(err)
            }
            resolve(true)
          })
        })
      }),
    )
  }

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
    snapshotKey: 'adminTest',
  })
}
