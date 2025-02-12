import type { CollectionSlug, Payload, User } from 'payload'
import fs from 'fs'
import { parse } from 'csv-parse'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Page } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { richTextData } from './seed/richTextData.js'
import { devUser } from '../credentials.js'

let payload: Payload
let page: Page
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-import-export', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
    user = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('exports', () => {
    it('should create a file for collection csv from defined fields', async () => {
      // large data set
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Page ${i}`,
            group: {
              array: [{ field1: 'test' }],
            },
          },
        })
      }

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          sort: 'createdAt',
          fields: ['id', 'title', 'group.value', 'group.array.field1', 'createdAt', 'updatedAt'],
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toContain('pages.csv')
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual('Page 0')
      expect(data[0].group_value).toStrictEqual('group value')
      expect(data[0].group_ignore).toBeUndefined()
      expect(data[0].group_array_0_field1).toStrictEqual('test')
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].updatedAt).toBeDefined()
    })

    it('should create a file for collection csv from array', async () => {
      // large data set
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

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'array'],
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].array_0_field1).toStrictEqual('foo')
      expect(data[0].array_0_field2).toStrictEqual('bar')
      expect(data[0].array_1_field1).toStrictEqual('foo')
      expect(data[0].array_1_field2).toStrictEqual('baz')
    })

    it('should create a file for collection csv from array.subfield', async () => {
      // large data set
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

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'array.field1'],
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].array_0_field1).toStrictEqual('foo')
      expect(data[0].array_0_field2).toBeUndefined()
      expect(data[0].array_1_field1).toStrictEqual('foo')
      expect(data[0].array_1_field2).toBeUndefined()
    })

    it('should create a file for collection csv from hasMany field', async () => {
      // large data set
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Array ${i}`,
            hasManyNumber: [0, 1, 1, 2, 3, 5, 8, 13, 21],
          },
        })
      }

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'hasManyNumber'],
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].hasManyNumber_0).toStrictEqual('0')
      expect(data[0].hasManyNumber_1).toStrictEqual('1')
      expect(data[0].hasManyNumber_2).toStrictEqual('1')
      expect(data[0].hasManyNumber_3).toStrictEqual('2')
      expect(data[0].hasManyNumber_4).toStrictEqual('3')
    })

    it('should create a file for collection csv from blocks field', async () => {
      // large data set
      const allPromises = []
      let promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(
          payload.create({
            collection: 'pages',
            data: {
              title: `Array ${i}`,
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
          }),
        )
      }
      await Promise.all(promises)

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'blocks'],
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].blocks_0_blockType).toStrictEqual('hero')
      expect(data[0].blocks_1_blockType).toStrictEqual('content')
    })

    it('should create a file for collection csv using a where filter', async () => {
      // data set
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Array ${i}`,
          },
        })
      }

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title'],
          where: {
            title: { equals: 'Array 2' },
          },
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].title).toStrictEqual('Array 2')
    })

    it('should create a JSON file for collection', async () => {
      // data set
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Array ${i}`,
          },
        })
      }

      let doc = await payload.create({
        collection: 'exports' as CollectionSlug,
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title'],
          format: 'json',
          sort: 'title',
        },
      })

      doc = await payload.findByID({
        collection: 'exports' as CollectionSlug,
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readJSON(expectedPath)

      expect(data[0].title).toStrictEqual('Array 0')
    })

    it('should create jobs task for exports', async () => {
      // data set
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Array ${i}`,
          },
        })
      }

      let doc = await payload.create({
        collection: 'exports-tasks' as CollectionSlug,
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title'],
          format: 'csv',
          sort: 'title',
        },
      })

      const { docs } = await payload.find({
        collection: 'payload-jobs' as CollectionSlug,
      })
      const job = docs[0]

      expect(job).toBeDefined()

      // @ts-expect-error
      const { input } = job

      expect(input.id).toBeDefined()
      expect(input.name).toBeDefined()
      expect(input.format).toStrictEqual('csv')
      expect(input.locale).toStrictEqual('all')
      expect(input.fields).toStrictEqual(['id', 'title'])
      expect(input.collectionSlug).toStrictEqual('pages')
      expect(input.exportsCollection).toStrictEqual('exports-tasks')
      expect(input.user).toBeDefined()
      expect(input.userCollection).toBeDefined()

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports-tasks' as CollectionSlug,
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].title).toStrictEqual('Array 0')
    })

    // disabled so we don't always run a massive test
    it.skip('should create a file from a large set of collection documents', async () => {
      const allPromises = []
      let promises = []
      for (let i = 0; i < 100000; i++) {
        promises.push(
          payload.create({
            collectionSlug: 'pages',
            data: {
              title: `Array ${i}`,
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
          }),
        )
        if (promises.length >= 500) {
          await Promise.all(promises)
          promises = []
        }
        if (i % 1000 === 0) {
          console.log('created', i)
        }
      }
      await Promise.all(promises)

      console.log('seeded')

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'blocks'],
          format: 'csv',
        },
      })

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].blocks_0_blockType).toStrictEqual('hero')
      expect(data[0].blocks_1_blockType).toStrictEqual('content')
    })
  })
})

export const readCSV = async (path: string): Promise<any[]> => {
  const buffer = fs.readFileSync(path)
  const data: any[] = []
  const promise = new Promise<void>((resolve) => {
    const parser = parse({ bom: true, columns: true })

    // Collect data from the CSV
    parser.on('readable', () => {
      let record
      while ((record = parser.read())) {
        data.push(record)
      }
    })

    // Resolve the promise on 'end'
    parser.on('end', () => {
      resolve()
    })

    // Handle errors (optional, but good practice)
    parser.on('error', (error) => {
      console.error('Error parsing CSV:', error)
      resolve() // Ensures promise doesn't hang on error
    })

    // Pipe the buffer into the parser
    parser.write(buffer)
    parser.end()
  })

  // Await the promise
  await promise

  return data
}

export const readJSON = async (path: string): Promise<any[]> => {
  const buffer = fs.readFileSync(path)
  const str = buffer.toString()

  try {
    const json = JSON.parse(str)
    return json
  } catch (error) {
    console.error('Error reading JSON file:', error)
    throw error
  }
}
