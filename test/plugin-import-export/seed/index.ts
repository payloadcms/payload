import type { Payload } from 'payload'

import { devUser } from '../../credentials.js'
import { richTextData } from './richTextData.js'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  try {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
        name: 'name value',
      },
    })
    // Seed posts
    const posts = []
    for (let i = 0; i < 2; i++) {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: `Post ${i}`,
        },
      })
      posts.push(post)
    }
    // create pages
    for (let i = 0; i < 195; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Doc ${i}`,
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Title ${i}`,
          group: {
            array: [{ field1: 'test' }],
          },
        },
      })
    }
    for (let i = 0; i < 5; i++) {
      const doc = await payload.create({
        collection: 'pages',
        data: {
          title: `Localized ${i}`,
          localized: 'en test',
        },
        locale: 'en',
      })
      await payload.update({
        collection: 'pages',
        id: doc.id,
        data: {
          localized: 'es test',
        },
        locale: 'es',
      })
    }
    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Array ${i}`,
          array: [
            {
              field1: 'foo',
              field2: 'bar',
            },
            {
              field1: 'foo',
              field2: 'baz',
            },
          ],
        },
      })
    }
    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Array Subfield ${i}`,
          array: [
            {
              field1: 'foo',
              field2: 'bar',
            },
            {
              field1: 'foo',
              field2: 'baz',
            },
          ],
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          author: user.id,
          title: `Virtual ${i}`,
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          customRelationship: user.id,
          title: `Custom ${i}`,
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `hasMany Number ${i}`,
          hasManyNumber: [0, 1, 1, 2, 3, 5, 8, 13, 21],
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Blocks ${i}`,
          blocks: [
            {
              blockType: 'hero',
              title: 'test',
            },
            {
              blockType: 'content',
              richText: richTextData,
            },
          ],
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `JSON ${i}`,
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Jobs ${i}`,
        },
      })
    }

    for (let i = 0; i < 2; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Monomorphic ${i}`,
          hasManyMonomorphic: [posts[1]?.id ?? ''],
        },
      })
    }

    for (let i = 0; i < 5; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Polymorphic ${i}`,
          hasOnePolymorphic: {
            relationTo: 'posts',
            value: posts[0]?.id ?? '',
          },
          hasManyPolymorphic: [
            {
              relationTo: 'users',
              value: user.id,
            },
            {
              relationTo: 'posts',
              value: posts[1]?.id ?? '',
            },
          ],
        },
      })
    }

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
