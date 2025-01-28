import type { Payload } from 'payload'
import fs from 'fs'
import { parse } from 'csv-parse'

import path from 'path'
import { fileURLToPath } from 'url'

import type { Page } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let page: Page

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-import-export', () => {
  let pageData = {
    title: 'Test',
    group: {
      value: 'Group Value',
      ignore: 'Ignore',
    },
  }

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

    page = await payload.create({
      collection: 'pages',
      data: pageData,
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
          },
        })
      }

      let doc = await payload.create({
        collection: 'exports',
        data: {
          collections: [
            {
              slug: 'pages',
              fields: ['id', 'title', 'group.value', 'createdAt', 'updatedAt'],
            },
          ],
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

      expect(data[0].group_value).toStrictEqual('group value')
    })

    it('should create a file for collection csv from defined fields', async () => {
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
        data: {
          collections: [
            {
              slug: 'pages',
              fields: ['id', 'array'],
            },
          ],
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
