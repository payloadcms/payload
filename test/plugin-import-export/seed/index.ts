import type { Payload } from 'payload'

import { devUser, regularUser } from '../../credentials.js'
import { postsExportsOnlySlug, postsImportsOnlySlug, postsNoJobsQueueSlug } from '../shared.js'
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
    const restricted = await payload.create({
      collection: 'users',
      data: {
        email: regularUser.email,
        password: regularUser.password,
        name: 'restricted user',
      },
    })
    // Seed posts
    const posts = []
    // create an absurd amount of posts - we need to test large data exports
    for (let i = 0; i < 100; i++) {
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: `Post ${i}`,
          content: richTextData,
          _status: i % 2 === 0 ? 'published' : 'draft', // Evens published, odds draft
        },
      })

      if (i < 3) {
        posts.push(post)
      }
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
              // @ts-ignore
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

    // Seed pages with checkbox field
    for (let i = 0; i < 3; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Checkbox ${i}`,
          checkbox: i % 2 === 0,
        },
      })
    }

    // Seed pages with select field
    for (let i = 0; i < 3; i++) {
      const options = ['option1', 'option2', 'option3'] as const
      await payload.create({
        collection: 'pages',
        data: {
          title: `Select ${i}`,
          select: options[i % 3],
        },
      })
    }

    // Seed pages with select hasMany field
    for (let i = 0; i < 3; i++) {
      const tagSets: Array<Array<'tagA' | 'tagB' | 'tagC' | 'tagD'>> = [
        ['tagA'],
        ['tagA', 'tagB'],
        ['tagB', 'tagC', 'tagD'],
      ]
      await payload.create({
        collection: 'pages',
        data: {
          title: `SelectMany ${i}`,
          selectHasMany: tagSets[i],
        },
      })
    }

    // Seed pages with radio field
    for (let i = 0; i < 3; i++) {
      const radios = ['radio1', 'radio2', 'radio3'] as const
      await payload.create({
        collection: 'pages',
        data: {
          title: `Radio ${i}`,
          radio: radios[i % 3],
        },
      })
    }

    // Seed pages with email field
    for (let i = 0; i < 3; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Email ${i}`,
          email: `test${i}@example.com`,
        },
      })
    }

    // Seed pages with textarea field
    for (let i = 0; i < 3; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Textarea ${i}`,
          textarea: `Line 1 for textarea ${i}\nLine 2\nLine 3`,
        },
      })
    }

    // Seed pages with code field
    for (let i = 0; i < 3; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Code ${i}`,
          code: `function test${i}() {\n  return ${i};\n}`,
        },
      })
    }

    // Seed pages with point field
    for (let i = 0; i < 3; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Point ${i}`,
          point: [-122.4194 + i * 0.01, 37.7749 + i * 0.01],
        },
      })
    }

    // Seed pages with hasMany text field
    for (let i = 0; i < 3; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `TextMany ${i}`,
          textHasMany: [`tag${i}a`, `tag${i}b`, `tag${i}c`],
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

    // Seed posts-exports-only collection
    for (let i = 0; i < 25; i++) {
      await payload.create({
        collection: postsExportsOnlySlug,
        data: {
          title: `Export Only Post ${i}`,
        },
      })
    }

    // Seed posts-imports-only collection
    for (let i = 0; i < 25; i++) {
      await payload.create({
        collection: postsImportsOnlySlug,
        data: {
          title: `Import Only Post ${i}`,
        },
      })
    }

    for (let i = 0; i < 25; i++) {
      await payload.create({
        collection: postsNoJobsQueueSlug,
        data: {
          title: `Post with no jobs queue active ${i}`,
        },
      })
    }

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
