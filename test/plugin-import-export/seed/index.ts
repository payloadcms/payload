import type { Payload } from 'payload'

import { devUser } from '../../credentials.js'
import { richTextData } from './richTextData.js'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  try {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    // create pages
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

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
