import type { Payload } from 'payload'

import { devUser } from '@test-utils/credentials.js'
import { seedDB } from '../helpers/seed.js'
import { categoriesSlug, collectionSlugs, postsSlug } from './shared.js'

export const seed = async (_payload) => {
  await _payload.create({
    collection: 'users',
    data: {
      email: devUser.email,
      password: devUser.password,
    },
  })

  const category = await _payload.create({
    collection: categoriesSlug,
    data: {
      name: 'example',
      group: {},
    },
  })

  await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 1',
    },
  })

  await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 2',
    },
  })

  await _payload.create({
    collection: postsSlug,
    data: {
      category: category.id,
      group: {
        category: category.id,
      },
      title: 'Test Post 3',
    },
  })
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs,
    seedFunction: seed,
    snapshotKey: 'adminTest',
  })
}
