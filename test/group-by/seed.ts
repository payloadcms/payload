import type { Payload } from 'payload'

import { devUser } from '../credentials.js'
import { executePromises } from '../helpers/executePromises.js'
import { seedDB } from '../helpers/seed.js'
import { categoriesSlug } from './collections/Categories/index.js'
import { postsSlug } from './collections/Posts/index.js'
import { relationshipsSlug } from './collections/Relationships/index.js'

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

        // Get the first post for polymorphic relationships
        const firstPost = await _payload.find({
          collection: postsSlug,
          limit: 1,
        })

        // Create relationship test documents
        await Promise.all([
          // Document with PolyHasOneRelationship to category
          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'Poly HasOne (Category)',
              PolyHasOneRelationship: {
                relationTo: categoriesSlug,
                value: category1.id,
              },
            },
          }),

          // Document with PolyHasOneRelationship to post
          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'Poly HasOne (Post)',
              PolyHasOneRelationship: {
                relationTo: postsSlug,
                value: firstPost.docs[0]?.id ?? '',
              },
            },
          }),

          // Document with PolyHasManyRelationship to both categories and posts
          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'Poly HasMany (Mixed)',
              PolyHasManyRelationship: [
                {
                  relationTo: categoriesSlug,
                  value: category1.id,
                },
                {
                  relationTo: postsSlug,
                  value: firstPost.docs[0]?.id ?? '',
                },
                {
                  relationTo: categoriesSlug,
                  value: category2.id,
                },
              ],
            },
          }),

          // Document with MonoHasOneRelationship
          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'Mono HasOne',
              MonoHasOneRelationship: category1.id,
            },
          }),

          // Document with MonoHasManyRelationship
          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'Mono HasMany',
              MonoHasManyRelationship: [category1.id, category2.id],
            },
          }),

          // Documents with no relationships (for "No Value" testing)
          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'No Relationships 1',
            },
          }),

          _payload.create({
            collection: relationshipsSlug,
            data: {
              title: 'No Relationships 2',
            },
          }),
        ])
      },
    ],
    false,
  )
}

export async function clearAndSeedEverything(_payload: Payload) {
  return await seedDB({
    _payload,
    collectionSlugs: [postsSlug, categoriesSlug, relationshipsSlug, 'users', 'media'],
    seedFunction: seed,
    snapshotKey: 'groupByTests',
    // uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
  })
}
