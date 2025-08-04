import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import { categoriesSlug } from './collections/Categories/index.js'
import { postsSlug } from './collections/Posts/index.js'

export const seed = async (_payload: Payload) => {
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
      async () => {
        const [category1, category2] = await Promise.all([
          _payload.create({
            collection: categoriesSlug,
            data: {
              title: 'Category 1',
            },
          }),
          _payload.create({
            collection: categoriesSlug,
            data: {
              title: 'Category 2',
            },
          }),
        ])

        await Promise.all(
          Array.from({ length: 30 }).map(async (_, index) =>
            _payload.create({
              collection: postsSlug,
              data: {
                title: `Post ${index + 1}`,
                category: index < 15 ? category1.id : category2.id,
              },
            }),
          ),
        )

        await _payload.create({
          collection: 'posts',
          data: {
            title: 'Find me',
            category: category1.id,
          },
        })

        await _payload.create({
          collection: 'posts',
          data: {
            title: 'Find me',
            category: category2.id,
          },
        })
      },
    ],
    false,
  )
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs: [postsSlug, categoriesSlug, 'users', 'media'],
    seedFunction: seed,
    snapshotKey: 'groupByTests',
    // uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
  })
}
