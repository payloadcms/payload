import type { CollectionSlug, Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { getFileByPath } from 'payload'
import { extractID } from 'payload/shared'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser, regularUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { clearTestBucket, createTestBucket } from '../storage-s3/test-utils.js'
import { readCSV, readJSON } from './helpers.js'
import { richTextData } from './seed/richTextData.js'
import { postsWithS3Slug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let user: any
let restrictedUser: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-import-export', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
    user = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
    const userDocs = await payload.find({
      collection: 'users',
      where: {
        email: { equals: regularUser.email },
      },
    })

    if (userDocs.docs?.[0]) {
      restrictedUser = { ...userDocs.docs[0], collection: 'users' }
    }
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('graphql', () => {
    it('should not break graphql', async () => {
      const query = `query {
        __schema {
          queryType {
            name
          }
        }
      }`
      const response = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(response.error).toBeUndefined()
    })
  })

  describe('exports', () => {
    it('should create a file for collection csv from defined fields', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          name: 'pages.csv',
          sort: 'createdAt',
          fields: ['id', 'title', 'group.value', 'group.array.field1', 'createdAt', 'updatedAt'],
          format: 'csv',
          where: {
            title: { contains: 'Title ' },
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toContain('pages.csv')
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual('Title 0')
      expect(data[0].group_value).toStrictEqual('group value')
      expect(data[0].group_ignore).toBeUndefined()
      expect(data[0].group_array_0_field1).toStrictEqual('test')
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].updatedAt).toBeDefined()
    })

    it('should create a file for collection csv with all documents when limit 0', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 0,
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      const { totalDocs: totalNumberOfDocs } = await payload.count({
        collection: 'pages',
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data).toHaveLength(totalNumberOfDocs)
    })

    it('should create a file for collection csv with all documents when no limit', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      const { totalDocs: totalNumberOfDocs } = await payload.count({
        collection: 'pages',
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data).toHaveLength(totalNumberOfDocs)
    })

    it('should create a file for collection csv from limit and page 1', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 100,
          page: 1,
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      const pages = await payload.find({
        collection: 'pages',
        limit: 100,
        page: 1,
      })

      const firstDocOnPage1 = pages.docs?.[0]

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual(firstDocOnPage1?.title)
    })

    it('should create a file for collection csv from limit and page 2', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 100,
          page: 2,
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      const pages = await payload.find({
        collection: 'pages',
        limit: 100,
        page: 2,
      })

      const firstDocOnPage2 = pages.docs?.[0]

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual(firstDocOnPage2?.title)
    })

    it('should not create a file for collection csv when limit < 0', async () => {
      await expect(
        payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            format: 'csv',
            limit: -1,
          },
        }),
      ).rejects.toThrow(/Limit/)
    })

    it('should create a file for collection csv with any positive limit value', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 99,
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
    })

    it('should export results sorted ASC by title when sort="title"', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          sort: 'title',
          where: {
            or: [{ title: { contains: 'Title' } }, { title: { contains: 'Array' } }],
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual('Array 0')
    })

    it('should export results sorted DESC by title when sort="-title"', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          sort: '-title',
          where: {
            or: [{ title: { contains: 'Title' } }, { title: { contains: 'Array' } }],
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual('Title 4')
    })

    it('should create a file for collection csv with draft data', async () => {
      const draftPage = await payload.create({
        collection: 'pages',
        user,
        data: {
          title: 'Draft Page',
          _status: 'published',
        },
      })

      await payload.update({
        collection: 'pages',
        id: draftPage.id,
        data: {
          title: 'Draft Page Updated',
          _status: 'draft',
        },
      })

      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title', '_status'],
          locale: 'en',
          format: 'csv',
          where: {
            title: { contains: 'Draft ' },
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toStrictEqual('Draft Page Updated')
      expect(data[0]._status).toStrictEqual('draft')
    })

    it('should create a file for collection csv from one locale', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'localized'],
          locale: 'en',
          format: 'csv',
          where: {
            title: { contains: 'Localized ' },
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].localized).toStrictEqual('en test')
    })

    it('should create a file for collection csv from multiple locales', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'localized'],
          locale: 'all',
          format: 'csv',
          where: {
            title: { contains: 'Localized ' },
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].localized_en).toStrictEqual('en test')
      expect(data[0].localized_es).toStrictEqual('es test')
    })

    it('should create a file for collection csv from array', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'array'],
          format: 'csv',
          where: {
            title: { contains: 'Array ' },
          },
        },
      })

      await payload.jobs.run()

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

    it('should create a CSV file with columns matching the order of the fields array', async () => {
      const fields = ['id', 'group.value', 'group.array.field1', 'title', 'createdAt', 'updatedAt']
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields,
          format: 'csv',
          where: {
            title: { contains: 'Title ' },
          },
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const buffer = fs.readFileSync(expectedPath)
      const str = buffer.toString()

      expect(str.indexOf('id')).toBeLessThan(str.indexOf('title'))
      expect(str.indexOf('group_value')).toBeLessThan(str.indexOf('title'))
      expect(str.indexOf('group_value')).toBeLessThan(str.indexOf('group_array'))
      expect(str.indexOf('title')).toBeLessThan(str.indexOf('createdAt'))
      expect(str.indexOf('createdAt')).toBeLessThan(str.indexOf('updatedAt'))
    })

    it('should create a CSV file with virtual fields', async () => {
      const fields = ['id', 'virtual', 'virtualRelationship']
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields,
          format: 'csv',
          where: {
            title: { contains: 'Virtual ' },
          },
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].virtual).toStrictEqual('virtual value')
      expect(data[0].virtualRelationship).toStrictEqual('name value')
    })

    it('should create a file for collection csv from array.subfield', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'array.field1'],
          format: 'csv',
          where: {
            title: { contains: 'Array Subfield ' },
          },
        },
      })

      await payload.jobs.run()

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
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'hasManyNumber'],
          format: 'csv',
          where: {
            title: { contains: 'hasMany Number ' },
          },
        },
      })

      await payload.jobs.run()

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
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'blocks'],
          format: 'csv',
          where: {
            title: { contains: 'Blocks ' },
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].blocks_0_hero_blockType).toStrictEqual('hero')
      expect(data[0].blocks_1_content_blockType).toStrictEqual('content')
    })

    it('should create a csv of all fields when fields is empty', async () => {
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: [],
          format: 'csv',
          where: {
            title: { contains: 'Title ' },
          },
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toBeDefined()
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].createdAt).toBeDefined()
    })

    it('should run custom toCSV function on a field', async () => {
      const fields = [
        'id',
        'custom',
        'group.custom',
        'customRelationship',
        'tabToCSV',
        'namedTab.tabToCSV',
      ]
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields,
          format: 'csv',
          where: {
            title: { contains: 'Custom ' },
          },
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].custom).toStrictEqual('my custom csv transformer toCSV')
      expect(data[0].group_custom).toStrictEqual('my custom csv transformer toCSV')
      expect(data[0].tabToCSV).toStrictEqual('my custom csv transformer toCSV')
      expect(data[0].namedTab_tabToCSV).toStrictEqual('my custom csv transformer toCSV')
      expect(data[0].customRelationship_id).toBeDefined()
      expect(data[0].customRelationship_email).toBeDefined()
      expect(data[0].customRelationship_createdAt).toBeUndefined()
      expect(data[0].customRelationship === undefined || data[0].customRelationship === '').toBe(
        true,
      )
    })

    it('should create a JSON file for collection', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title'],
          format: 'json',
          sort: 'title',
          where: {
            title: { contains: 'JSON ' },
          },
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readJSON(expectedPath)

      expect(data[0].title).toStrictEqual('JSON 0')
    })

    it('should download an existing export JSON file', async () => {
      const response = await restClient.POST('/exports/download', {
        body: JSON.stringify({
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title'],
            format: 'json',
            sort: 'title',
            drafts: 'yes',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toMatch(/application\/json/)

      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(['string', 'number']).toContain(typeof data[0].id)
      expect(typeof data[0].title).toBe('string')
    })

    it('should create an export with every field when no fields are defined', async () => {
      let doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'json',
          sort: 'title',
        },
      })

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readJSON(expectedPath)

      expect(data[0].id).toBeDefined()
      expect(data[0].title).toBeDefined()
      expect(data[0].createdAt).toBeDefined()
      expect(data[0].updatedAt).toBeDefined()
    })

    it('should create jobs task for exports', async () => {
      const doc = await payload.create({
        collection: 'exports' as CollectionSlug,
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title'],
          format: 'csv',
          sort: 'title',
          where: {
            title: { contains: 'Jobs ' },
          },
        },
      })

      const {
        docs: [job],
      } = await payload.find({
        collection: 'payload-jobs',
        sort: '-createdAt',
      })

      expect(job).toBeDefined()

      const input = job?.input

      expect(input).toBeDefined()

      expect(input.id).toBeDefined()
      expect(input.name).toBeDefined()
      expect(input.format).toStrictEqual('csv')
      expect(input.locale).toStrictEqual('all')
      expect(input.fields).toStrictEqual(['id', 'title'])
      expect(input.collectionSlug).toStrictEqual('pages')
      expect(input.exportCollection).toStrictEqual('exports')
      expect(input.userID).toBeDefined()
      expect(input.userCollection).toBeDefined()

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports' as CollectionSlug,
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].title).toStrictEqual('Jobs 0')
    })

    it('should export a large dataset without any duplicates', async () => {
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'posts',
          fields: ['id', 'title'],
          format: 'csv',
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      const seenIds = new Set<string>()
      const duplicateIds: string[] = []
      for (const row of data) {
        if (seenIds.has(row.id)) {
          duplicateIds.push(row.id)
        } else {
          seenIds.add(row.id)
        }
      }
      expect(duplicateIds).toHaveLength(0)
    })

    it('should only include selected fields in CSV export, nothing else', async () => {
      const doc = await payload.create({
        collection: 'posts-export',
        user,
        data: {
          collectionSlug: 'posts',
          fields: ['title'],
          format: 'csv',
          limit: 5,
        },
      })

      const exportDoc = await payload.findByID({
        collection: 'posts-export',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data.length).toBeGreaterThan(0)

      const columns = Object.keys(data[0])
      expect(columns).toStrictEqual(['title'])
      expect(data[0].title).toBeDefined()
    })

    it('should preserve user-specified field order in CSV export', async () => {
      const doc = await payload.create({
        collection: 'posts-export',
        user,
        data: {
          collectionSlug: 'posts',
          fields: ['title', 'id', 'createdAt'],
          format: 'csv',
          limit: 1,
        },
      })

      const exportDoc = await payload.findByID({
        collection: 'posts-export',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data.length).toBeGreaterThan(0)

      const columns = Object.keys(data[0])
      expect(columns).toStrictEqual(['title', 'id', 'createdAt'])
    })

    it('should export polymorphic relationship fields to CSV', async () => {
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'hasOnePolymorphic', 'hasManyPolymorphic'],
          format: 'csv',
          where: {
            title: { contains: 'Polymorphic' },
          },
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].hasOnePolymorphic_id).toBeDefined()
      expect(data[0].hasOnePolymorphic_relationTo).toBe('posts')

      expect(data[0].hasManyPolymorphic_0_id).toBeDefined()
      expect(data[0].hasManyPolymorphic_0_relationTo).toBe('users')
      expect(data[0].hasManyPolymorphic_1_id).toBeDefined()
      expect(data[0].hasManyPolymorphic_1_relationTo).toBe('posts')
    })

    it('should export hasMany monomorphic relationship fields to CSV', async () => {
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'hasManyMonomorphic'],
          format: 'csv',
          where: {
            title: { contains: 'Monomorphic' },
          },
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].hasManyMonomorphic_0_id).toBeDefined()
      expect(data[0].hasManyMonomorphic_0_relationTo).toBeUndefined()
      expect(data[0].hasManyMonomorphic_0_title).toBeUndefined()
    })

    // disabled so we don't always run a massive test
    it.skip('should create a file from a large set of collection documents', async () => {
      const allPromises = []
      let promises = []
      for (let i = 0; i < 100000; i++) {
        promises.push(
          await payload.create({
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
        if (promises.length >= 500) {
          await Promise.all(promises)
          promises = []
        }
        if (i % 1000 === 0) {
          console.log('created', i)
        }
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

      await payload.jobs.run()

      doc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(doc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', doc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data[0].blocks_0_hero_blockType).toStrictEqual('hero')
      expect(data[0].blocks_1_content_blockType).toStrictEqual('content')
    })

    describe('schema-based column inference', () => {
      it('should generate columns from schema without scanning documents', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'localized', 'hasOnePolymorphic', 'array'],
            format: 'csv',
            where: {
              title: { equals: 'Title 0' },
            },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({
          collection: 'exports',
          id: doc.id,
        })

        expect(doc.filename).toBeDefined()
        const expectedPath = path.join(dirname, './uploads', doc.filename as string)
        const buffer = fs.readFileSync(expectedPath)
        const headerLine = buffer.toString().split('\n')[0]

        expect(headerLine).toContain('id')
        expect(headerLine).toContain('title')
        expect(headerLine).toContain('localized')
        expect(headerLine).toContain('hasOnePolymorphic_relationTo')
        expect(headerLine).toContain('hasOnePolymorphic_id')
        expect(headerLine).toContain('array_0_field1')
        expect(headerLine).toContain('array_0_field2')
      })

      it('should include all locale columns when locale is all', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'localized'],
            locale: 'all',
            format: 'csv',
            where: {
              title: { contains: 'Localized ' },
            },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({
          collection: 'exports',
          id: doc.id,
        })

        expect(doc.filename).toBeDefined()
        const expectedPath = path.join(dirname, './uploads', doc.filename as string)
        const buffer = fs.readFileSync(expectedPath)
        const headerLine = buffer.toString().split('\n')[0]

        expect(headerLine).toContain('localized_en')
        expect(headerLine).toContain('localized_es')
        expect(headerLine).toContain('localized_de')
      })

      it('should generate correct columns for empty export', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'excerpt'],
            format: 'csv',
            where: {
              title: { equals: 'nonexistent-title-xyz' },
            },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({
          collection: 'exports',
          id: doc.id,
        })

        expect(doc.filename).toBeDefined()
        const expectedPath = path.join(dirname, './uploads', doc.filename as string)
        const buffer = fs.readFileSync(expectedPath)
        const content = buffer.toString()

        expect(content).toContain('id')
        expect(content).toContain('title')
        expect(content).toContain('excerpt')
      })

      it('should include virtual fields in export columns (they have values)', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            format: 'csv',
            where: {
              title: { contains: 'Virtual ' },
            },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({
          collection: 'exports',
          id: doc.id,
        })

        expect(doc.filename).toBeDefined()
        const expectedPath = path.join(dirname, './uploads', doc.filename as string)
        const buffer = fs.readFileSync(expectedPath)
        const headerLine = buffer.toString().split('\n')[0]

        expect(headerLine).toContain('virtual')
        expect(headerLine).toContain('virtualRelationship')
      })
    })

    describe('toCSV derived columns positioning', () => {
      it('should position derived columns immediately after their base field', async () => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Derived Columns Test',
            customRelationship: user.user.id,
            excerpt: 'test excerpt',
            _status: 'published',
          },
        })

        const fields = ['id', 'title', 'customRelationship', 'excerpt']
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields,
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const data = await readCSV(csvPath)
        const columns = Object.keys(data[0])

        const customRelIdx = columns.indexOf('customRelationship')
        const idIdx = columns.indexOf('customRelationship_id')
        const emailIdx = columns.indexOf('customRelationship_email')
        const excerptIdx = columns.indexOf('excerpt')

        expect(customRelIdx).toBeGreaterThan(-1)
        expect(idIdx).toBe(customRelIdx + 1)
        expect(emailIdx).toBe(customRelIdx + 2)
        expect(excerptIdx).toBeGreaterThan(emailIdx)

        await payload.delete({ collection: 'pages', id: page.id })
      })
    })

    describe('date field export', () => {
      it('should export date fields as ISO strings', async () => {
        const dateValue = '2026-01-22T00:00:00.000Z'
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Date Export Test',
            date: dateValue,
            _status: 'published',
          },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'date'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const data = await readCSV(csvPath)

        expect(data[0].date).toBe('2026-01-22T00:00:00.000Z')

        await payload.delete({ collection: 'pages', id: page.id })
      })

      it('should handle null date values', async () => {
        const page = await payload.create({
          collection: 'pages',
          data: { title: 'Null Date Test', date: null, _status: 'published' },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'date'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const data = await readCSV(csvPath)

        expect(data[0].date).toBe('')

        await payload.delete({ collection: 'pages', id: page.id })
      })

      it('should not include timezone column when only date field is selected', async () => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Date With TZ Test',
            dateWithTimezone: '2026-01-25T12:00:00.000Z',
            dateWithTimezone_tz: 'Europe/London',
            _status: 'published',
          },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'dateWithTimezone'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const csvContent = fs.readFileSync(csvPath, 'utf-8')
        const headerLine = csvContent.split('\n')[0]

        expect(headerLine).toContain('dateWithTimezone')
        expect(headerLine).not.toContain('dateWithTimezone_tz')

        await payload.delete({ collection: 'pages', id: page.id })
      })

      it('should not create duplicate columns when selecting both date and timezone fields', async () => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Date With TZ Duplicate Test',
            dateWithTimezone: '2026-01-25T12:00:00.000Z',
            dateWithTimezone_tz: 'Europe/London',
            _status: 'published',
          },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'dateWithTimezone', 'dateWithTimezone_tz'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const csvContent = fs.readFileSync(csvPath, 'utf-8')
        const headerLine = csvContent.split('\n')[0]
        const columns = headerLine.split(',')

        const tzColumnCount = columns.filter((col) => col === 'dateWithTimezone_tz').length
        expect(tzColumnCount).toBe(1)

        const data = await readCSV(csvPath)
        expect(data[0].dateWithTimezone).toBe('2026-01-25T12:00:00.000Z')
        expect(data[0].dateWithTimezone_tz).toBe('Europe/London')

        await payload.delete({ collection: 'pages', id: page.id })
      })
    })

    describe('export collection config options', () => {
      it('should apply per-collection overrideCollection to create custom export collection', () => {
        const customExportCollection = payload.collections['posts-no-jobs-queue-export']
        expect(customExportCollection).toBeDefined()
        expect(customExportCollection.config.admin?.group).toBe('Posts No Jobs Queue')
      })

      it('should apply format and disableSave options to custom export collection', () => {
        const customExportCollection = payload.collections['posts-no-jobs-queue-export']
        expect(customExportCollection.config.admin?.custom?.format).toBe('csv')
        expect(customExportCollection.config.admin?.custom?.disableSave).toBe(true)
      })
    })

    describe('json and richText fields CSV serialization', () => {
      it('should serialize json and richText fields as JSON strings in single columns', async () => {
        const jsonData = {
          key: 'value',
          nested: {
            deep: 'data',
            array: [1, 2, 3],
          },
        }

        const testPage = await payload.create({
          collection: 'pages',
          data: {
            title: 'JSON Serialization Test',
            jsonField: jsonData,
            richTextField: richTextData,
            blocks: [
              {
                blockType: 'content',
                richText: richTextData,
              },
            ],
          },
        })

        let exportDoc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            format: 'csv',
            where: {
              id: { equals: testPage.id },
            },
          },
        })

        await payload.jobs.run()

        exportDoc = await payload.findByID({
          collection: 'exports',
          id: exportDoc.id,
        })

        const csvPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const csvData = await readCSV(csvPath)

        expect(csvData).toHaveLength(1)
        const row = csvData[0]

        expect(row.jsonField).toBeDefined()
        expect(typeof row.jsonField).toBe('string')
        const parsedJson = JSON.parse(row.jsonField)
        expect(parsedJson).toEqual(jsonData)

        expect(row.richTextField).toBeDefined()
        expect(typeof row.richTextField).toBe('string')
        const parsedRichText = JSON.parse(row.richTextField)
        expect(parsedRichText.root).toBeDefined()
        expect(parsedRichText.root.type).toBe('root')

        const blockRichTextColumn = Object.keys(row).find(
          (key) => key.includes('blocks') && key.includes('richText') && !key.includes('_root'),
        )
        expect(blockRichTextColumn).toBeDefined()
        expect(typeof row[blockRichTextColumn!]).toBe('string')
        const parsedBlockRichText = JSON.parse(row[blockRichTextColumn!])
        expect(parsedBlockRichText.root).toBeDefined()

        expect(row.jsonField_key).toBeUndefined()
        expect(row.jsonField_nested).toBeUndefined()
        expect(row.jsonField_nested_deep).toBeUndefined()
        expect(row.richTextField_root).toBeUndefined()
        expect(row.richTextField_root_children).toBeUndefined()

        const flattenedRichTextKeys = Object.keys(row).filter(
          (key) => key.includes('richText') && key.includes('_root'),
        )
        expect(flattenedRichTextKeys).toHaveLength(0)

        await payload.delete({
          collection: 'pages',
          id: testPage.id,
        })
      })

      it('should roundtrip json and richText fields through CSV export/import', async () => {
        const jsonData = {
          complex: {
            nested: {
              deeply: {
                value: 'test',
                numbers: [1, 2, 3, 4, 5],
              },
            },
          },
          array: [{ a: 1 }, { b: 2 }],
        }

        const testPage = await payload.create({
          collection: 'pages',
          data: {
            title: 'JSON Roundtrip CSV Test',
            jsonField: jsonData,
            richTextField: richTextData,
            blocks: [
              {
                blockType: 'content',
                richText: richTextData,
              },
            ],
          },
        })

        let exportDoc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            format: 'csv',
            where: {
              id: { equals: testPage.id },
            },
          },
        })

        await payload.jobs.run()

        exportDoc = await payload.findByID({
          collection: 'exports',
          id: exportDoc.id,
        })

        const csvPath = path.join(dirname, './uploads', exportDoc.filename as string)

        await payload.delete({
          collection: 'pages',
          id: testPage.id,
        })

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: fs.readFileSync(csvPath),
            mimetype: 'text/csv',
            name: 'json-roundtrip.csv',
            size: fs.statSync(csvPath).size,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(1)

        const importedPages = await payload.find({
          collection: 'pages',
          where: {
            title: { equals: 'JSON Roundtrip CSV Test' },
          },
        })

        expect(importedPages.docs).toHaveLength(1)
        const imported = importedPages.docs[0]

        expect(imported?.jsonField).toEqual(jsonData)

        expect(imported?.richTextField).toBeDefined()
        expect((imported?.richTextField as typeof richTextData)?.root?.type).toBe('root')
        expect(
          (imported?.richTextField as typeof richTextData)?.root?.children?.length,
        ).toBeGreaterThan(0)

        expect(imported?.blocks).toHaveLength(1)
        const block = imported?.blocks?.[0]
        expect(block?.blockType).toBe('content')
        const blockRichText = 'richText' in (block || {}) ? (block as any).richText : null
        expect(blockRichText?.root?.type).toBe('root')

        await payload.delete({
          collection: 'pages',
          where: {
            title: { equals: 'JSON Roundtrip CSV Test' },
          },
        })
      })

      it('should handle json fields in deeply nested array structures', async () => {
        const jsonData = { level: 'nested', data: [1, 2, 3] }

        const testPage = await payload.create({
          collection: 'pages',
          data: {
            title: 'Nested Array Test',
            jsonField: jsonData,
            array: [
              { field1: 'array-item-1-field1', field2: 'array-item-1-field2' },
              { field1: 'array-item-2-field1', field2: 'array-item-2-field2' },
              { field1: 'array-item-3-field1', field2: 'array-item-3-field2' },
            ],
            group: {
              value: 'group value',
              array: [
                { field1: 'nested-array-1', field2: 'nested-value-1' },
                { field1: 'nested-array-2', field2: 'nested-value-2' },
              ],
            },
          },
        })

        let exportDoc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            format: 'csv',
            where: {
              id: { equals: testPage.id },
            },
          },
        })

        await payload.jobs.run()

        exportDoc = await payload.findByID({
          collection: 'exports',
          id: exportDoc.id,
        })

        const csvPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const csvData = await readCSV(csvPath)

        expect(csvData).toHaveLength(1)
        const row = csvData[0]

        expect(row.jsonField).toBeDefined()
        expect(JSON.parse(row.jsonField)).toEqual(jsonData)

        expect(row.array_0_field1).toBe('array-item-1-field1')
        expect(row.array_0_field2).toBe('array-item-1-field2')
        expect(row.array_1_field1).toBe('array-item-2-field1')
        expect(row.array_2_field1).toBe('array-item-3-field1')

        expect(row.group_array_0_field1).toBe('nested-array-1')
        expect(row.group_array_1_field1).toBe('nested-array-2')

        await payload.delete({
          collection: 'pages',
          id: testPage.id,
        })

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: fs.readFileSync(csvPath),
            mimetype: 'text/csv',
            name: 'nested-array-test.csv',
            size: fs.statSync(csvPath).size,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')

        const importedPages = await payload.find({
          collection: 'pages',
          where: {
            title: { equals: 'Nested Array Test' },
          },
        })

        expect(importedPages.docs).toHaveLength(1)
        const imported = importedPages.docs[0]

        expect(imported?.jsonField).toEqual(jsonData)

        expect(imported?.array).toHaveLength(3)
        expect(imported?.array?.[0]?.field1).toBe('array-item-1-field1')
        expect(imported?.array?.[1]?.field1).toBe('array-item-2-field1')
        expect(imported?.array?.[2]?.field1).toBe('array-item-3-field1')

        expect(imported?.group?.array).toHaveLength(2)
        expect(imported?.group?.array?.[0]?.field1).toBe('nested-array-1')
        expect(imported?.group?.array?.[1]?.field1).toBe('nested-array-2')

        await payload.delete({
          collection: 'pages',
          where: {
            title: { equals: 'Nested Array Test' },
          },
        })
      })

      it('should update json and richText fields in update mode', async () => {
        const initialJson = { version: 1, data: 'initial' }
        const updatedJson = { version: 2, data: 'updated', extra: [1, 2, 3] }

        const existingPage = await payload.create({
          collection: 'pages',
          data: {
            title: 'JSON Update Mode Test',
            jsonField: initialJson,
            richTextField: richTextData,
          },
        })

        expect(existingPage.jsonField).toEqual(initialJson)

        const csvContent =
          `id,title,jsonField,richTextField\n` +
          `${existingPage.id},"JSON Update Mode Test","${JSON.stringify(updatedJson).replace(/"/g, '""')}","${JSON.stringify(richTextData).replace(/"/g, '""')}"`

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'update',
            matchField: 'id',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'json-update-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.updated).toBe(1)
        expect(importDoc.summary?.issues).toBe(0)

        const updatedPage = await payload.findByID({
          collection: 'pages',
          id: existingPage.id,
        })

        expect(updatedPage.jsonField).toEqual(updatedJson)
        expect((updatedPage.richTextField as typeof richTextData)?.root?.type).toBe('root')

        await payload.delete({
          collection: 'pages',
          id: existingPage.id,
        })
      })

      it('should handle json and richText fields in upsert mode', async () => {
        const timestamp = Date.now()
        const existingJson = { id: 'existing', value: 100 }
        const newJson = { id: 'new', value: 200, nested: { key: 'value' } }
        const updatedExistingJson = { id: 'existing', value: 150, modified: true }

        const existingPage = await payload.create({
          collection: 'pages',
          data: {
            title: `JSON Upsert Existing ${timestamp}`,
            jsonField: existingJson,
            richTextField: richTextData,
          },
        })

        const csvContent =
          `title,jsonField,richTextField\n` +
          `"JSON Upsert Existing ${timestamp}","${JSON.stringify(updatedExistingJson).replace(/"/g, '""')}","${JSON.stringify(richTextData).replace(/"/g, '""')}"\n` +
          `"JSON Upsert New ${timestamp}","${JSON.stringify(newJson).replace(/"/g, '""')}","${JSON.stringify(richTextData).replace(/"/g, '""')}"`

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'upsert',
            matchField: 'title',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'json-upsert-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.updated).toBe(1)
        expect(importDoc.summary?.imported).toBe(1)
        expect(importDoc.summary?.issues).toBe(0)

        const updatedPage = await payload.findByID({
          collection: 'pages',
          id: existingPage.id,
        })

        expect(updatedPage.jsonField).toEqual(updatedExistingJson)

        const newPages = await payload.find({
          collection: 'pages',
          where: {
            title: { equals: `JSON Upsert New ${timestamp}` },
          },
        })

        expect(newPages.docs).toHaveLength(1)
        expect(newPages.docs[0]?.jsonField).toEqual(newJson)
        expect((newPages.docs[0]?.richTextField as typeof richTextData)?.root?.type).toBe('root')

        await payload.delete({
          collection: 'pages',
          where: {
            or: [
              { title: { equals: `JSON Upsert Existing ${timestamp}` } },
              { title: { equals: `JSON Upsert New ${timestamp}` } },
            ],
          },
        })
      })

      it('should import json fields from manually created CSV', async () => {
        const manualJson = {
          settings: {
            theme: 'dark',
            notifications: true,
            preferences: ['email', 'sms'],
          },
        }

        const csvContent =
          `title,jsonField\n` +
          `"Manual CSV Import","${JSON.stringify(manualJson).replace(/"/g, '""')}"`

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'manual-json-csv.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(1)

        const importedPage = await payload.find({
          collection: 'pages',
          where: {
            title: { equals: 'Manual CSV Import' },
          },
        })

        expect(importedPage.docs).toHaveLength(1)
        expect(importedPage.docs[0]?.jsonField).toEqual(manualJson)

        await payload.delete({
          collection: 'pages',
          where: {
            title: { equals: 'Manual CSV Import' },
          },
        })
      })

      it('should handle multiple imports updating the same json fields', async () => {
        const jsonV1 = { version: 1, items: ['a'] }
        const jsonV2 = { version: 2, items: ['a', 'b'] }
        const jsonV3 = { version: 3, items: ['a', 'b', 'c'] }

        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Sequential Import Test',
            jsonField: jsonV1,
          },
        })

        let csvContent =
          `id,title,jsonField\n` +
          `${page.id},"Sequential Import Test","${JSON.stringify(jsonV2).replace(/"/g, '""')}"`

        let csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'update',
            matchField: 'id',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'sequential-1.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        let updatedPage = await payload.findByID({
          collection: 'pages',
          id: page.id,
        })
        expect(updatedPage.jsonField).toEqual(jsonV2)

        csvContent =
          `id,title,jsonField\n` +
          `${page.id},"Sequential Import Test","${JSON.stringify(jsonV3).replace(/"/g, '""')}"`

        csvBuffer = Buffer.from(csvContent)

        importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'update',
            matchField: 'id',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'sequential-2.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        updatedPage = await payload.findByID({
          collection: 'pages',
          id: page.id,
        })
        expect(updatedPage.jsonField).toEqual(jsonV3)

        await payload.delete({
          collection: 'pages',
          id: page.id,
        })
      })
    })

    describe('Excel compatibility', () => {
      it('should include UTF-8 BOM at the start of CSV files', async () => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'BOM Test',
            excerpt: 'Testing BOM presence',
            _status: 'published',
          },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const buffer = fs.readFileSync(csvPath)

        expect(buffer[0]).toBe(0xef)
        expect(buffer[1]).toBe(0xbb)
        expect(buffer[2]).toBe(0xbf)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      it('should correctly encode UTF-8 characters for Excel', async () => {
        const unicodeTitle = 'Ümlauts, émojis 🎉, 日本語, and spëcial çharacters'
        const unicodeExcerpt = 'Ñoño señor • bullet points • áéíóú'

        const page = await payload.create({
          collection: 'pages',
          data: {
            title: unicodeTitle,
            excerpt: unicodeExcerpt,
            _status: 'published',
          },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'excerpt'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)

        const rawContent = fs.readFileSync(csvPath, 'utf-8')

        expect(rawContent).toContain(unicodeTitle)
        expect(rawContent).toContain(unicodeExcerpt)

        const data = await readCSV(csvPath)

        expect(data[0].title).toBe(unicodeTitle)
        expect(data[0].excerpt).toBe(unicodeExcerpt)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      it('should handle special CSV characters that could break Excel parsing', async () => {
        const specialCharsTitle = 'Title with "quotes" and, commas'
        const specialCharsExcerpt = 'Line1\nLine2\nLine3 with\ttabs'

        const page = await payload.create({
          collection: 'pages',
          data: {
            title: specialCharsTitle,
            excerpt: specialCharsExcerpt,
            _status: 'published',
          },
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'excerpt'],
            format: 'csv',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const data = await readCSV(csvPath)

        expect(data[0].title).toBe(specialCharsTitle)
        expect(data[0].excerpt).toBe(specialCharsExcerpt)

        await payload.delete({ collection: 'pages', id: page.id })
      })
    })

    describe('fields', () => {
      it('should export checkbox field as true/false strings', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'checkbox'],
            format: 'csv',
            where: { title: { contains: 'Checkbox ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        const trueDoc = data.find((d) => d.title === 'Checkbox 0')
        const falseDoc = data.find((d) => d.title === 'Checkbox 1')

        expect(['true', '1']).toContain(trueDoc?.checkbox)
        expect(['false', '0', '']).toContain(falseDoc?.checkbox)
      })

      it('should export select field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'select'],
            format: 'csv',
            where: { title: { contains: 'Select ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        expect(data.find((d) => d.title === 'Select 0')?.select).toBe('option1')
        expect(data.find((d) => d.title === 'Select 1')?.select).toBe('option2')
        expect(data.find((d) => d.title === 'Select 2')?.select).toBe('option3')
      })

      it('should export select hasMany field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'selectHasMany'],
            format: 'csv',
            where: { title: { contains: 'SelectMany ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        const selectManyDoc = data.find((d) => d.title === 'SelectMany 0')
        expect(selectManyDoc).toBeDefined()
      })

      it('should export radio field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'radio'],
            format: 'csv',
            where: { title: { contains: 'Radio ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        expect(data.find((d) => d.title === 'Radio 0')?.radio).toBe('radio1')
        expect(data.find((d) => d.title === 'Radio 1')?.radio).toBe('radio2')
        expect(data.find((d) => d.title === 'Radio 2')?.radio).toBe('radio3')
      })

      it('should export email field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'email'],
            format: 'csv',
            where: { title: { contains: 'Email ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        expect(data.find((d) => d.title === 'Email 0')?.email).toBe('test0@example.com')
        expect(data.find((d) => d.title === 'Email 1')?.email).toBe('test1@example.com')
      })

      it('should export textarea field with multiline content', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'textarea'],
            format: 'csv',
            where: { title: { contains: 'Textarea ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        const textarea0 = data.find((d) => d.title === 'Textarea 0')
        expect(textarea0?.textarea).toContain('Line 1')
        expect(textarea0?.textarea).toContain('Line 2')
      })

      it('should export code field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'code'],
            format: 'csv',
            where: { title: { contains: 'Code ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        expect(data.find((d) => d.title === 'Code 0')?.code).toContain('function test0')
      })

      it('should export point field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'point'],
            format: 'csv',
            where: { title: { contains: 'Point ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        expect(data.find((d) => d.title === 'Point 0')).toBeDefined()
      })

      it('should export hasMany text field values', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'textHasMany'],
            format: 'csv',
            where: { title: { contains: 'TextMany ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        expect(data.find((d) => d.title === 'TextMany 0')).toBeDefined()
      })

      it('should export upload field values as IDs', async () => {
        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'upload'],
            format: 'csv',
            where: { title: { contains: 'Upload ' } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })
        const data = await readCSV(path.join(dirname, './uploads', doc.filename as string))

        expect(data).toHaveLength(3)
        const uploadDoc = data.find((d) => d.title === 'Upload 0')
        expect(uploadDoc).toBeDefined()
        expect(uploadDoc?.upload).toBeDefined()
        expect(uploadDoc?.upload).not.toBe('')
      })
    })
    describe('custom ID exports', () => {
      const createdCustomIdPages: string[] = []

      afterEach(async () => {
        for (const id of createdCustomIdPages) {
          try {
            await payload.delete({
              collection: 'custom-id-pages' as CollectionSlug,
              id,
            })
          } catch {
            // Ignore cleanup errors
          }
        }
        createdCustomIdPages.length = 0
      })

      it('should export documents with custom text IDs to CSV', async () => {
        await payload.create({
          collection: 'custom-id-pages' as CollectionSlug,
          data: {
            id: 'export-custom-1',
            title: 'Export Custom Page 1',
          },
        })

        await payload.create({
          collection: 'custom-id-pages' as CollectionSlug,
          data: {
            id: 'export-custom-2',
            title: 'Export Custom Page 2',
          },
        })

        createdCustomIdPages.push('export-custom-1', 'export-custom-2')

        let exportDoc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'custom-id-pages',
            format: 'csv',
            fields: ['id', 'title'],
            where: {
              id: { in: ['export-custom-1', 'export-custom-2'] },
            },
          },
        })

        await payload.jobs.run()

        exportDoc = await payload.findByID({
          collection: 'exports',
          id: exportDoc.id,
        })

        expect(exportDoc.filename).toContain('.csv')

        const csvPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const csvData = await readCSV(csvPath)

        expect(csvData).toHaveLength(2)
        expect(csvData.map((row: any) => row.id).sort()).toEqual([
          'export-custom-1',
          'export-custom-2',
        ])
        expect(csvData.find((row: any) => row.id === 'export-custom-1')?.title).toBe(
          'Export Custom Page 1',
        )
      })

      it('should export documents with custom text IDs to JSON', async () => {
        await payload.create({
          collection: 'custom-id-pages' as CollectionSlug,
          data: {
            id: 'export-json-1',
            title: 'Export JSON Page 1',
          },
        })

        await payload.create({
          collection: 'custom-id-pages' as CollectionSlug,
          data: {
            id: 'export-json-2',
            title: 'Export JSON Page 2',
          },
        })

        createdCustomIdPages.push('export-json-1', 'export-json-2')

        let exportDoc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'custom-id-pages',
            format: 'json',
            fields: ['id', 'title'],
            where: {
              id: { in: ['export-json-1', 'export-json-2'] },
            },
          },
        })

        await payload.jobs.run()

        exportDoc = await payload.findByID({
          collection: 'exports',
          id: exportDoc.id,
        })

        expect(exportDoc.filename).toContain('.json')

        const jsonPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const jsonData = await readJSON(jsonPath)

        expect(jsonData).toHaveLength(2)
        expect(jsonData.map((row: any) => row.id).sort()).toEqual([
          'export-json-1',
          'export-json-2',
        ])
        expect(jsonData.find((row: any) => row.id === 'export-json-1')?.title).toBe(
          'Export JSON Page 1',
        )
      })
    })
  })

  describe('imports', () => {
    beforeEach(async () => {
      await payload.delete({
        collection: 'pages',
        where: {
          id: { exists: true },
        },
      })

      await payload.delete({
        collection: 'imports',
        where: {
          id: { exists: true },
        },
      })
    })

    it('should import collection documents from CSV with defined fields', async () => {
      const createdPages = []
      for (let i = 0; i < 3; i++) {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: `Import Test ${i}`,
            group: {
              value: `group value ${i}`,
              array: [{ field1: `test ${i}` }],
            },
          },
        })
        createdPages.push(page)
      }

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title', 'group.value', 'group.array.field1'],
          format: 'csv',
          where: {
            title: { contains: 'Import Test ' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Import Test ' },
        },
      })

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: fs.readFileSync(csvPath),
          mimetype: 'text/csv',
          name: 'import-test.csv',
          size: fs.statSync(csvPath).size,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      if (importDoc.status !== 'completed') {
        console.log('Import did not complete (CSV test):', {
          status: importDoc.status,
          summary: importDoc.summary,
          issueDetails: importDoc.summary?.issueDetails,
        })
      }
      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(3)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Import Test ' },
        },
        sort: 'title',
      })

      expect(importedPages.docs).toHaveLength(3)
      expect(importedPages.docs[0]?.title).toBe('Import Test 0')
      expect(importedPages.docs[0]?.group?.value).toBe('group value 0')
      expect(importedPages.docs[0]?.group?.array?.[0]?.field1).toBe('test 0')
    })

    it('should import collection documents from JSON', async () => {
      const testData = [
        {
          title: 'JSON Import 1',
          group: {
            value: 'json group 1',
          },
        },
        {
          title: 'JSON Import 2',
          group: {
            value: 'json group 2',
          },
        },
      ]

      const jsonBuffer = Buffer.from(JSON.stringify(testData))

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: jsonBuffer,
          mimetype: 'application/json',
          name: 'import-test.json',
          size: jsonBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'JSON Import ' },
        },
        sort: 'title',
      })

      expect(importedPages.docs).toHaveLength(2)
      expect(importedPages.docs[0]?.title).toBe('JSON Import 1')
      expect(importedPages.docs[0]?.group?.value).toBe('json group 1')
    })

    it('should update existing documents in update mode', async () => {
      const page1 = await payload.create({
        collection: 'pages',
        data: {
          title: 'Update Test 1',
          group: {
            value: 'initial value 1',
          },
        },
      })

      const page2 = await payload.create({
        collection: 'pages',
        data: {
          title: 'Update Test 2',
          group: {
            value: 'initial value 2',
          },
        },
      })

      const updateData = [
        {
          id: page1.id,
          title: 'Updated Test 1',
          group_value: 'updated value 1',
        },
        {
          id: page2.id,
          title: 'Updated Test 2',
          group_value: 'updated value 2',
        },
      ]

      const csvContent =
        'id,title,group_value\n' +
        updateData.map((row) => `${row.id},"${row.title}","${row.group_value}"`).join('\n')

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'update',
          matchField: 'id',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'update-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.updated).toBe(2)
      expect(importDoc.summary?.imported).toBe(0)
      expect(importDoc.summary?.issues).toBe(0)

      const updatedPage1 = await payload.findByID({
        collection: 'pages',
        id: page1.id,
      })

      expect(updatedPage1.title).toBe('Updated Test 1')
      expect(updatedPage1.group?.value).toBe('updated value 1')
    })

    it('should handle upsert mode correctly', async () => {
      const timestamp = Date.now()
      const existingPage = await payload.create({
        collection: 'pages',
        draft: false,
        data: {
          title: `Upsert Test ${timestamp}`,
          excerpt: 'existing',
          _status: 'published',
        },
      })

      const upsertData = [
        {
          id: String(existingPage.id), // Ensure ID is a string
          title: `Upsert Test ${timestamp} Updated`,
          excerpt: 'updated',
        },
        {
          id: '999999', // Non-existent ID
          title: `Upsert Test ${timestamp} New`,
          excerpt: 'new',
        },
      ]

      const csvContent =
        'id,title,excerpt\n' +
        upsertData.map((row) => `${row.id},"${row.title}","${row.excerpt}"`).join('\n')

      const csvBuffer = Buffer.from(csvContent)

      const initialImportDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'upsert',
          matchField: 'id',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'upsert-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      const importDoc = await payload.findByID({
        collection: 'imports',
        id: initialImportDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.updated).toBe(1)
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const publishedPage = await payload.findByID({
        collection: 'pages',
        id: existingPage.id,
        depth: 0,
        draft: false, // Get published version
        overrideAccess: true,
      })

      const draftPage = await payload.findByID({
        collection: 'pages',
        id: existingPage.id,
        depth: 0,
        draft: true, // Get draft version
        overrideAccess: true,
      })

      expect(draftPage).toBeDefined()
      expect(draftPage.title).toBe(`Upsert Test ${timestamp} Updated`)
      expect(draftPage.excerpt).toBe('updated')

      const newPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: `Upsert Test ${timestamp} New` },
        },
      })
      expect(newPages.docs).toHaveLength(1)
      expect(newPages.docs[0]?.excerpt).toBe('new')
    })

    it('should import localized fields from CSV with single locale', async () => {
      const csvContent =
        'title,localized\n' +
        '"Localized Import 1","en single locale test 1"\n' +
        '"Localized Import 2","en single locale test 2"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'localized-single-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Localized Import ' },
        },
        locale: 'en',
        sort: 'title',
      })

      expect(importedPages.docs).toHaveLength(2)
      expect(importedPages.docs[0]?.localized).toBe('en single locale test 1')
    })

    it('should import localized fields from CSV with multiple locales', async () => {
      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Localized ' },
        },
      })

      const csvContent =
        'title,localized_en,localized_es\n' +
        '"Multi-locale Import 1","English text 1","Spanish text 1"\n' +
        '"Multi-locale Import 2","English text 2","Spanish text 2"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'localized-multi-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPagesEn = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Multi-locale Import ' },
        },
        locale: 'en',
        sort: 'title',
      })

      expect(importedPagesEn.docs).toHaveLength(2)
      expect(importedPagesEn.docs[0]?.localized).toBe('English text 1')

      const importedPagesEs = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Multi-locale Import ' },
        },
        locale: 'es',
        sort: 'title',
      })

      expect(importedPagesEs.docs).toHaveLength(2)
      expect(importedPagesEs.docs[0]?.localized).toBe('Spanish text 1')
    })

    it('should import array fields from CSV', async () => {
      const csvContent =
        'title,array_0_field1,array_0_field2,array_1_field1,array_1_field2\n' +
        '"Array Import 1","foo1","bar1","foo2","bar2"\n' +
        '"Array Import 2","test1","test2","test3","test4"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'array-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Array Import ' },
        },
        sort: 'title',
      })

      expect(importedPages.docs).toHaveLength(2)
      expect(importedPages.docs[0]?.array).toHaveLength(2)
      expect(importedPages.docs[0]?.array?.[0]?.field1).toBe('foo1')
      expect(importedPages.docs[0]?.array?.[0]?.field2).toBe('bar1')
      expect(importedPages.docs[0]?.array?.[1]?.field1).toBe('foo2')
      expect(importedPages.docs[0]?.array?.[1]?.field2).toBe('bar2')
    })

    it('should import blocks fields from CSV', async () => {
      const csvContent =
        'title,blocks_0_hero_blockType,blocks_0_hero_title,blocks_1_content_blockType,blocks_1_content_richText\n' +
        '"Blocks Import 1","hero","Hero Title 1","content","{""root"":{""children"":[{""children"":[{""text"":""Sample content""}],""type"":""paragraph""}],""type"":""root""}}"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'blocks-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Blocks Import 1' },
        },
      })

      expect(importedPages.docs).toHaveLength(1)
      const blocks = importedPages.docs[0]?.blocks
      expect(blocks).toHaveLength(2)
      expect(blocks?.[0]?.blockType).toBe('hero')
      const heroBlock = blocks?.[0]
      if (heroBlock?.blockType === 'hero') {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect((heroBlock as { blockType: 'hero'; title?: string })?.title).toBe('Hero Title 1')
      }
      expect(blocks?.[1]?.blockType).toBe('content')
    })

    it('should import hasMany number fields from CSV with various formats', async () => {
      const csvContent =
        'title,hasManyNumber\n' +
        '"HasMany Comma-Separated","1,2,3,5,8"\n' + // Comma-separated format
        '"HasMany Single Value","42"\n' + // Single value (should become array)
        '"HasMany Empty",""\n' + // Empty (should become empty array)
        '"HasMany With Spaces"," 10 , 20 , 30 "\n' + // Values with spaces
        '"HasMany Mixed Empty","1,,3,,5"' // Mixed with empty values

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
          debug: true, // Enable debug logging
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'hasmany-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      if (importDoc.status !== 'completed') {
        console.log('HasMany formats import failed:', {
          status: importDoc.status,
          summary: importDoc.summary,
        })
      }

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(5)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'HasMany ' },
        },
        sort: 'title',
      })

      expect(importedPages.docs).toHaveLength(5)

      const commaSeparated = importedPages.docs.find((d) => d?.title === 'HasMany Comma-Separated')
      expect(commaSeparated?.hasManyNumber).toEqual([1, 2, 3, 5, 8])

      const singleValue = importedPages.docs.find((d) => d?.title === 'HasMany Single Value')
      expect(singleValue?.hasManyNumber).toEqual([42])

      const empty = importedPages.docs.find((d) => d?.title === 'HasMany Empty')

      if (empty?.hasManyNumber) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(empty?.hasManyNumber).toEqual([])
      } else {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(empty?.hasManyNumber).not.toBeTruthy()
      }

      const withSpaces = importedPages.docs.find((d) => d?.title === 'HasMany With Spaces')
      expect(withSpaces?.hasManyNumber).toEqual([10, 20, 30])

      const mixedEmpty = importedPages.docs.find((d) => d?.title === 'HasMany Mixed Empty')
      expect(mixedEmpty?.hasManyNumber).toEqual([1, 3, 5])
    })

    it('should import relationship fields from CSV', async () => {
      const users = await payload.find({
        collection: 'users',
        limit: 3,
      })
      const userId1 = users.docs[0]?.id
      const userId2 = users.docs[1]?.id || userId1 // Fallback if only one user
      const userId3 = users.docs[2]?.id || userId1

      const csvContent =
        `title,relationship,author\n` +
        `"Relationship Import 1","${userId1}","${userId1}"\n` +
        `"Relationship Import 2","${userId2}","${userId2}"`

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'relationship-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Relationship Import ' },
        },
        depth: 1,
      })

      expect(importedPages.docs).toHaveLength(2)

      const page1 = importedPages.docs.find((d) => d?.title === 'Relationship Import 1')
      expect(extractID(page1?.relationship)).toBe(userId1)
      expect(extractID(page1?.author)).toBe(userId1)

      const page2 = importedPages.docs.find((d) => d?.title === 'Relationship Import 2')
      expect(extractID(page2?.relationship)).toBe(userId2)
      expect(extractID(page2?.author)).toBe(userId2)
    })

    it('should handle explicit null vs empty polymorphic relationships in import', async () => {
      const users = await payload.find({ collection: 'users', limit: 1 })
      const posts = await payload.find({ collection: 'posts', limit: 1 })
      const userId = users.docs[0]?.id
      const postId = posts.docs[0]?.id

      const existingPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'Original Title',
          excerpt: 'Original Excerpt',
          hasOnePolymorphic: {
            relationTo: 'users',
            value: userId!,
          },
          hasManyPolymorphic: [{ relationTo: 'posts', value: postId! }],
          group: {
            value: 'Original Group Value',
          },
        },
      })

      const csvUpdate = [
        'id,title,excerpt,hasOnePolymorphic_id,hasOnePolymorphic_relationTo',
        `${existingPage.id},"Updated Title","Updated Excerpt","",""`,
      ].join('\n')

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'update',
          matchField: 'id',
        },
        file: {
          data: Buffer.from(csvUpdate),
          mimetype: 'text/csv',
          name: 'update-polymorphic-test.csv',
          size: csvUpdate.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.issues).toBe(0)
      expect(importDoc.summary?.updated).toBe(1)

      const updatedPage = await payload.findByID({
        collection: 'pages',
        id: existingPage.id,
      })

      expect(updatedPage.title).toBe('Updated Title')
      expect(updatedPage.excerpt).toBe('Updated Excerpt')
      expect(updatedPage.group?.value).toBe('Original Group Value')
      expect(updatedPage.hasManyPolymorphic).toHaveLength(1)

      await payload.delete({
        collection: 'pages',
        id: existingPage.id,
      })
    })

    it('should import polymorphic relationship fields from CSV', async () => {
      const users = await payload.find({
        collection: 'users',
        limit: 1,
      })
      const posts = await payload.find({
        collection: 'posts',
        limit: 2,
      })
      const userId = users.docs[0]?.id
      const postId1 = posts.docs[0]?.id
      const postId2 = posts.docs[1]?.id

      const csvContent =
        `title,hasOnePolymorphic_id,hasOnePolymorphic_relationTo,hasManyPolymorphic_0_id,hasManyPolymorphic_0_relationTo,hasManyPolymorphic_1_id,hasManyPolymorphic_1_relationTo\n` +
        `"Polymorphic Import 1","${postId1}","posts","${userId}","users","${postId2}","posts"`

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'polymorphic-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Polymorphic Import 1' },
        },
        depth: 0,
      })

      expect(importedPages.docs).toHaveLength(1)
      const page = importedPages.docs[0]
      expect(page?.hasOnePolymorphic).toEqual({
        relationTo: 'posts',
        value: postId1,
      })
      expect(page?.hasManyPolymorphic).toHaveLength(2)
      expect(page?.hasManyPolymorphic?.[0]).toEqual({
        relationTo: 'users',
        value: userId,
      })
      expect(page?.hasManyPolymorphic?.[1]).toEqual({
        relationTo: 'posts',
        value: postId2,
      })
    })

    it('should skip virtual fields during import', async () => {
      const csvContent =
        'title,virtual,virtualRelationship\n' +
        '"Virtual Import Test","ignored value","ignored relationship"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'virtual-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Virtual Import Test' },
        },
      })

      expect(importedPages.docs).toHaveLength(1)
      expect(importedPages.docs[0]?.virtual).toBe('virtual value')
    })

    it('should correctly handle draft/published status when creating documents', async () => {
      const csvContent =
        'title,_status\n' +
        '"Draft Import 1","draft"\n' +
        '"Published Import 1","published"\n' +
        '"Draft Import 2","draft"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'status-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(3)
      expect(importDoc.summary?.issues).toBe(0)

      const draftPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Draft Import ' },
        },
        draft: true,
      })

      expect(draftPages.docs).toHaveLength(2)
      expect(draftPages.docs[0]?._status).toBe('draft')

      const publishedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Published Import ' },
        },
        draft: false, // Query for published documents only
      })

      expect(publishedPages.docs).toHaveLength(1)
    })

    it('should default to creating published documents when no _status specified', async () => {
      payload.config.debug = true

      const csvContent =
        'title,excerpt\n' +
        '"Default Status Test 1","excerpt1"\n' +
        '"Default Status Test 2","excerpt2"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'default-status-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(0)

      const pages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Default Status Test ' },
        },
        draft: false, // Query for published documents
      })

      expect(pages.docs).toHaveLength(2)

      payload.config.debug = false
    })

    it('should handle error scenarios gracefully', async () => {
      const missingFieldCsv = ''
      const missingFieldBuffer = Buffer.from(missingFieldCsv)

      let importDoc1 = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: missingFieldBuffer,
          mimetype: 'text/csv',
          name: 'missing-field-test.csv',
          size: missingFieldBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc1 = await payload.findByID({
        collection: 'imports',
        id: importDoc1.id,
      })

      expect(importDoc1.status).toBe('completed')
      expect(importDoc1.summary?.issues).toBe(0)
      expect(importDoc1.summary?.imported).toBe(0)

      const invalidTypeCsv = 'title,hasManyNumber_0\n"Invalid Type Test","not-a-number"'
      const invalidTypeBuffer = Buffer.from(invalidTypeCsv)

      let importDoc2 = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: invalidTypeBuffer,
          mimetype: 'text/csv',
          name: 'invalid-type-test.csv',
          size: invalidTypeBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc2 = await payload.findByID({
        collection: 'imports',
        id: importDoc2.id,
      })

      expect(importDoc2.status).toBe('completed')
      expect(importDoc2.summary?.issues).toBe(0)
      expect(importDoc2.summary?.imported).toBe(1)

      const nonExistentCsv = 'id,title\n"999999","Non-existent Update"'
      const nonExistentBuffer = Buffer.from(nonExistentCsv)

      let importDoc3 = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'update',
          matchField: 'id',
        },
        file: {
          data: nonExistentBuffer,
          mimetype: 'text/csv',
          name: 'non-existent-test.csv',
          size: nonExistentBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc3 = await payload.findByID({
        collection: 'imports',
        id: importDoc3.id,
      })

      expect(importDoc3.status).toBe('failed')
      expect(importDoc3.summary?.issues).toBe(1)
      expect(importDoc3.summary?.updated).toBe(0)
    })

    it('should handle partial import success correctly', async () => {
      const timestamp = Date.now()
      const mixedCsv =
        'title,hasManyNumber_0,_status\n' +
        `"Partial Valid ${timestamp}-1","123",published\n` +
        ',,published\n' + // Invalid - missing title
        `"Partial Valid ${timestamp}-2","456",published\n` +
        ',"789",published' // Invalid - empty title

      const mixedBuffer = Buffer.from(mixedCsv)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: mixedBuffer,
          mimetype: 'text/csv',
          name: 'mixed-import-test.csv',
          size: mixedBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('partial')
      expect(importDoc.summary?.imported).toBe(2)
      expect(importDoc.summary?.issues).toBe(2)
      expect(importDoc.summary?.total).toBe(4)

      await new Promise((resolve) => setTimeout(resolve, 500))

      const validPage1 = await payload.find({
        collection: 'pages',
        draft: true,
        overrideAccess: true,
        where: {
          title: { equals: `Partial Valid ${timestamp}-1` },
        },
      })
      const validPage2 = await payload.find({
        collection: 'pages',
        draft: true,
        overrideAccess: true,
        where: {
          title: { equals: `Partial Valid ${timestamp}-2` },
        },
      })

      if (validPage1.docs.length !== 1 || validPage2.docs.length !== 1) {
        console.log('DEBUG: Partial import test failed')
        console.log('  Import summary:', importDoc.summary)
        console.log('  Valid page 1 search results:', validPage1.docs.length)
        console.log('  Valid page 2 search results:', validPage2.docs.length)
        console.log('  Expected title 1:', `Partial Valid ${timestamp}-1`)
        console.log('  Expected title 2:', `Partial Valid ${timestamp}-2`)

        const allPages = await payload.find({
          collection: 'pages',
          draft: true,
          overrideAccess: true,
          limit: 100,
        })
        console.log('  Total pages in collection:', allPages.docs.length)
        const relevantPages = allPages.docs.filter(
          (p: any) => p.title && p.title.includes(`Partial Valid ${timestamp}`),
        )
        console.log('  Relevant pages found:', relevantPages.length)
        relevantPages.forEach((p: any) => {
          console.log(`    - ${p.title} (id: ${p.id}, status: ${p._status})`)
        })
      }

      expect(validPage1.docs).toHaveLength(1)
      expect(validPage2.docs).toHaveLength(1)
    })

    it('should import nested group fields correctly', async () => {
      const csvContent =
        'title,group_value,group_ignore,group_array_0_field1,group_array_0_field2\n' +
        '"Nested Group Import","nested value","ignore value","array field 1","array field 2"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'nested-group-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Nested Group Import' },
        },
      })

      expect(importedPages.docs).toHaveLength(1)
      const page = importedPages.docs[0]
      expect(page?.group?.value).toBe('nested value')
      expect(page?.group?.ignore).toBe('ignore value')
      expect(page?.group?.array).toHaveLength(1)
      expect(page?.group?.array?.[0]?.field1).toBe('array field 1')
      expect(page?.group?.array?.[0]?.field2).toBe('array field 2')
    })

    it('should handle tabs and collapsible fields during import', async () => {
      const csvContent =
        'title,tabToCSV,namedTab_tabToCSV,textFieldInCollapsible\n' +
        '"Tab Import Test","tab value 1","named tab value","collapsible value"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'tabs-collapsible-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Tab Import Test' },
        },
      })

      expect(importedPages.docs).toHaveLength(1)
      const page = importedPages.docs[0]
      expect(page?.tabToCSV).toBe('tab value 1')
      expect(page?.namedTab?.tabToCSV).toBe('named tab value')
      expect(page?.textFieldInCollapsible).toBe('collapsible value')
    })

    it('should skip disabled fields during import', async () => {
      const pagesCollection = payload.config.collections.find((c) => c.slug === 'pages')
      if (pagesCollection && pagesCollection.admin) {
        pagesCollection.admin.custom = {
          ...pagesCollection.admin.custom,
          'plugin-import-export': {
            disabledFields: ['group.ignore', 'textFieldInCollapsible'],
          },
        }
      }

      const csvContent =
        'title,group_value,group_ignore,textFieldInCollapsible\n' +
        '"Disabled Fields Test","allowed value","should be ignored","also ignored"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'disabled-fields-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Disabled Fields Test' },
        },
      })

      expect(importedPages.docs).toHaveLength(1)
      const page = importedPages.docs[0]
      expect(page?.group?.value).toBe('allowed value')

      expect(page?.group?.ignore).not.toBeTruthy()
      expect(page?.group?.ignore).not.toBeTruthy()
      expect(page?.textFieldInCollapsible).not.toBeTruthy()

      if (pagesCollection && pagesCollection.admin && pagesCollection.admin.custom) {
        delete pagesCollection.admin.custom['plugin-import-export']
      }
    })

    it('should create jobs task for imports', async () => {
      const csvContent =
        'title,excerpt\n' + '"Jobs Import 1","excerpt 1"\n' + '"Jobs Import 2","excerpt 2"'

      const csvBuffer = Buffer.from(csvContent)

      const doc = await payload.create({
        collection: 'imports' as CollectionSlug,
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'jobs-import-test.csv',
          size: csvBuffer.length,
        },
      })

      const { docs: jobs } = await payload.find({
        collection: 'payload-jobs' as CollectionSlug,
        where: {
          taskSlug: { equals: 'createCollectionImport' },
        },
      })

      expect(jobs.length).toBeGreaterThan(0)
      const job = jobs[0]
      expect(job).toBeDefined()

      interface JobWithInput {
        input: {
          importCollection?: string
          importId?: string
          userCollection?: string
          userID?: number | string
        }
      }
      const { input } = job as JobWithInput

      expect(input.importId).toBeDefined()
      expect(input.importCollection).toStrictEqual('imports')
      expect(input.userCollection).toBeDefined()

      await payload.jobs.run()

      const importDoc = await payload.findByID({
        collection: 'imports' as CollectionSlug,
        id: doc.id,
      })

      interface ImportDocWithStatus {
        status?: string
        summary?: {
          errors?: number
          imported?: number
        }
      }
      const typedImportDoc = importDoc as ImportDocWithStatus

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Jobs Import ' },
        },
        sort: 'title', // Sort by title to ensure consistent order
      })

      expect(importedPages.docs).toHaveLength(2)
      expect(importedPages.docs[0]?.title).toBe('Jobs Import 1')
      expect(importedPages.docs[0]?.excerpt).toBe('excerpt 1')
    })

    it('should successfully roundtrip export and import with toCSV/fromCSV functions', async () => {
      const createdPages = []
      for (let i = 0; i < 3; i++) {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: `Roundtrip Test ${i}`,
            custom: 'custom value',
            group: {
              custom: 'group custom value',
            },
            tabToCSV: 'tab custom value',
            namedTab: {
              tabToCSV: 'named tab custom value',
            },
            customRelationship: user.id,
          },
        })
        createdPages.push(page)
      }

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: [
            'id',
            'title',
            'custom',
            'group.custom',
            'customRelationship',
            'tabToCSV',
            'namedTab.tabToCSV',
          ],
          format: 'csv',
          where: {
            title: { contains: 'Roundtrip Test ' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const exportedData = await readCSV(csvPath)

      expect(exportedData[0].custom).toBe('custom value toCSV')
      expect(exportedData[0].group_custom).toBe('group custom value toCSV')

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Roundtrip Test ' },
        },
      })

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: fs.readFileSync(csvPath),
          mimetype: 'text/csv',
          name: 'roundtrip-test.csv',
          size: fs.statSync(csvPath).size,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(3)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Roundtrip Test ' },
        },
        sort: 'title',
        depth: 1,
      })

      expect(importedPages.docs).toHaveLength(3)

      expect(importedPages.docs[0]?.custom).toBe('custom value toCSV')
      expect(importedPages.docs[0]?.group?.custom).toBe('group custom value toCSV')
    })

    it('should handle all field types in export/import roundtrip', async () => {
      const testUser = await payload.find({
        collection: 'users',
        limit: 1,
      })
      const testPost = await payload.create({
        collection: 'posts',
        data: {
          title: 'Test Post for Roundtrip',
        },
      })

      const testPage = await payload.create({
        collection: 'pages',
        data: {
          title: 'Complete Roundtrip Test',
          excerpt: 'Test excerpt',
          localized: 'Localized content',
          hasManyNumber: [10, 20, 30, 40, 50],
          relationship: testUser.docs[0]?.id,
          author: testUser.docs[0]?.id,
          hasOnePolymorphic: {
            relationTo: 'posts',
            value: testPost.id,
          },
          hasManyPolymorphic: [
            {
              relationTo: 'users',
              value: testUser.docs[0]?.id,
            },
            {
              relationTo: 'posts',
              value: testPost.id,
            },
          ],
          array: [
            { field1: 'array1-field1', field2: 'array1-field2' },
            { field1: 'array2-field1', field2: 'array2-field2' },
          ],
          blocks: [
            {
              blockType: 'hero',
              title: 'Hero Block Title',
            },
            {
              blockType: 'content',
              richText: richTextData,
            },
          ],
          group: {
            value: 'Group value',
            ignore: 'Should be included',
            array: [{ field1: 'nested1', field2: 'nested2' }],
          },
          _status: 'published',
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: [],
          format: 'csv',
          locale: 'all',
          where: {
            id: { equals: testPage.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)

      await payload.delete({
        collection: 'pages',
        id: testPage.id,
      })

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: fs.readFileSync(csvPath),
          mimetype: 'text/csv',
          name: 'complete-roundtrip.csv',
          size: fs.statSync(csvPath).size,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)
      expect(importDoc.summary?.issues).toBe(0)

      const importedPages = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Complete Roundtrip Test' },
        },
        depth: 0,
      })

      expect(importedPages.docs).toHaveLength(1)
      const imported = importedPages.docs[0]

      expect(imported?.title).toBe('Complete Roundtrip Test')
      expect(imported?.excerpt).toBe('Test excerpt')
      expect(imported?.localized).toBeDefined()
      expect(imported?.hasManyNumber).toEqual([10, 20, 30, 40, 50])
      expect(extractID(imported?.relationship)).toBe(testUser.docs[0]?.id)
      expect(extractID(imported?.author)).toBe(testUser.docs[0]?.id)
      expect(imported?.hasOnePolymorphic).toEqual({
        relationTo: 'posts',
        value: testPost.id,
      })
      expect(imported?.hasManyPolymorphic).toHaveLength(2)
      expect(imported?.array).toHaveLength(2)
      expect(imported?.array?.[0]?.field1).toBe('array1-field1')
      expect(imported?.blocks).toHaveLength(2)
      expect(imported?.blocks?.[0]?.blockType).toBe('hero')
      expect(imported?.group?.value).toBe('Group value')
      expect(imported?.group?.array).toHaveLength(1)

      await payload.delete({
        collection: 'posts',
        id: testPost.id,
      })
    })

    describe('batch processing', () => {
      it('should process large imports in batches', async () => {
        const rows = ['title,excerpt']
        for (let i = 0; i < 250; i++) {
          rows.push(`"Batch Test ${i}","Excerpt ${i}"`)
        }
        const csvContent = rows.join('\n')
        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'batch-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(250)
        expect(importDoc.summary?.issues).toBe(0)

        const importedPages = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'Batch Test ' },
          },
          limit: 300,
        })

        expect(importedPages.totalDocs).toBe(250)

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Batch Test ' },
          },
        })
      })

      it('should handle errors in batch processing and continue', async () => {
        const csvContent = `title,excerpt,relationship
"Valid Doc 1","Excerpt 1",""
"Valid Doc 2","Excerpt 2","invalid-id"
"Valid Doc 3","Excerpt 3",""
"Valid Doc 4","Excerpt 4","another-invalid-id"
"Valid Doc 5","Excerpt 5",""`

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'batch-errors-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('partial')
        expect(importDoc.summary?.imported).toBe(3)
        expect(importDoc.summary?.issues).toBe(2)

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Valid Doc ' },
          },
        })
      })

      it('should report row numbers in errors correctly', async () => {
        const testUser = await payload.find({
          collection: 'users',
          limit: 1,
        })
        const userId = testUser.docs[0]?.id

        const csvContent = `title,excerpt
"Row 1","Valid"
"Row 2","Valid"
"","Missing required title"
"Row 4","Valid"`

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'row-numbers-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.summary?.imported).toBe(3)

        if (importDoc.summary?.issueDetails && Array.isArray(importDoc.summary.issueDetails)) {
          const issues = importDoc.summary.issueDetails as Array<{ error: string; row: number }>
          // eslint-disable-next-line vitest/no-conditional-expect
          expect(issues).toHaveLength(1)
          // eslint-disable-next-line vitest/no-conditional-expect
          expect(issues[0]?.row).toBe(3)
        }

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Row ' },
          },
        })
      })

      it('should handle batch processing with localized fields', async () => {
        const rows = ['title,localized_en,localized_es']
        for (let i = 0; i < 150; i++) {
          rows.push(`"Batch Localized ${i}","English ${i}","Spanish ${i}"`)
        }
        const csvContent = rows.join('\n')
        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'batch-localized-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(150)
        expect(importDoc.summary?.issues).toBe(0)

        const importedPagesEn = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'Batch Localized ' },
          },
          locale: 'en',
          limit: 200,
        })

        expect(importedPagesEn.totalDocs).toBe(150)
        expect(importedPagesEn.docs[0]?.localized).toContain('English')

        const importedPagesEs = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'Batch Localized ' },
          },
          locale: 'es',
          limit: 200,
        })

        expect(importedPagesEs.docs[0]?.localized).toContain('Spanish')

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Batch Localized ' },
          },
        })
      })

      it('should respect defaultVersionStatus configuration', async () => {
        const csvContent =
          'title,excerpt\n"Default Status Test 1","Test excerpt 1"\n"Default Status Test 2","Test excerpt 2"'
        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'default-status-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(2)
        expect(importDoc.summary?.issues).toBe(0)

        const publishedPages = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'Default Status Test ' },
          },
          draft: false,
        })

        expect(publishedPages.totalDocs).toBe(2)

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Default Status Test ' },
          },
        })
      })

      it('should handle manual CSV with localized fields without locale suffix', async () => {
        const csvContent =
          'title,localized\n"Manual Locale Test 1","Default locale content 1"\n"Manual Locale Test 2","Default locale content 2"'
        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'manual-locale-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(2)
        expect(importDoc.summary?.issues).toBe(0)

        const importedPages = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'Manual Locale Test ' },
          },
        })

        expect(importedPages.totalDocs).toBe(2)

        const sortedDocs = importedPages.docs.sort((a, b) =>
          (a?.title || '').localeCompare(b?.title || ''),
        )
        expect(sortedDocs[0]?.localized).toBe('Default locale content 1')
        expect(sortedDocs[1]?.localized).toBe('Default locale content 2')

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Manual Locale Test ' },
          },
        })
      })
    })

    describe('fields', () => {
      it('should import checkbox field from CSV', async () => {
        const csvContent =
          'title,checkbox\n' +
          '"Checkbox Import True","true"\n' +
          '"Checkbox Import False","false"\n' +
          '"Checkbox Import 1","1"\n' +
          '"Checkbox Import 0","0"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'checkbox-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(4)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'Checkbox Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(4)
        expect(importedPages.docs.find((d) => d.title === 'Checkbox Import True')?.checkbox).toBe(
          true,
        )
        expect(importedPages.docs.find((d) => d.title === 'Checkbox Import False')?.checkbox).toBe(
          false,
        )
        expect(importedPages.docs.find((d) => d.title === 'Checkbox Import 1')?.checkbox).toBe(true)
        expect(importedPages.docs.find((d) => d.title === 'Checkbox Import 0')?.checkbox).toBe(
          false,
        )

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'Checkbox Import ' } },
        })
      })

      it('should import select field from CSV', async () => {
        const csvContent =
          'title,select\n' +
          '"Select Import 1","option1"\n' +
          '"Select Import 2","option2"\n' +
          '"Select Import 3","option3"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'select-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(3)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'Select Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(3)
        expect(importedPages.docs.find((d) => d.title === 'Select Import 1')?.select).toBe(
          'option1',
        )
        expect(importedPages.docs.find((d) => d.title === 'Select Import 2')?.select).toBe(
          'option2',
        )
        expect(importedPages.docs.find((d) => d.title === 'Select Import 3')?.select).toBe(
          'option3',
        )

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'Select Import ' } },
        })
      })

      it('should import radio field from CSV', async () => {
        const csvContent =
          'title,radio\n' +
          '"Radio Import 1","radio1"\n' +
          '"Radio Import 2","radio2"\n' +
          '"Radio Import 3","radio3"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'radio-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(3)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'Radio Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(3)
        expect(importedPages.docs.find((d) => d.title === 'Radio Import 1')?.radio).toBe('radio1')
        expect(importedPages.docs.find((d) => d.title === 'Radio Import 2')?.radio).toBe('radio2')
        expect(importedPages.docs.find((d) => d.title === 'Radio Import 3')?.radio).toBe('radio3')

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'Radio Import ' } },
        })
      })

      it('should import email field from CSV', async () => {
        const csvContent =
          'title,email\n' +
          '"Email Import 1","user1@example.com"\n' +
          '"Email Import 2","user2@example.org"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'email-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(2)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'Email Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(2)
        expect(importedPages.docs.find((d) => d.title === 'Email Import 1')?.email).toBe(
          'user1@example.com',
        )
        expect(importedPages.docs.find((d) => d.title === 'Email Import 2')?.email).toBe(
          'user2@example.org',
        )

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'Email Import ' } },
        })
      })

      it('should import textarea field with multiline content from CSV', async () => {
        const csvContent = 'title,textarea\n' + '"Textarea Import 1","Line 1\nLine 2\nLine 3"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'textarea-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(1)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { equals: 'Textarea Import 1' } },
        })

        expect(importedPages.docs).toHaveLength(1)
        expect(importedPages.docs[0]?.textarea).toContain('Line 1')
        expect(importedPages.docs[0]?.textarea).toContain('Line 2')

        await payload.delete({
          collection: 'pages',
          where: { title: { equals: 'Textarea Import 1' } },
        })
      })

      it('should import code field from CSV', async () => {
        const csvContent = 'title,code\n' + '"Code Import 1","function hello() { return 42; }"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'code-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(1)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { equals: 'Code Import 1' } },
        })

        expect(importedPages.docs).toHaveLength(1)
        expect(importedPages.docs[0]?.code).toBe('function hello() { return 42; }')

        await payload.delete({
          collection: 'pages',
          where: { title: { equals: 'Code Import 1' } },
        })
      })

      it('should import point field from CSV', async () => {
        const csvContent =
          'title,point_0,point_1\n' +
          '"Point Import SF","-122.4194","37.7749"\n' +
          '"Point Import NYC","-74.006","40.7128"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'point-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(2)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'Point Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(2)
        expect(importedPages.docs.find((d) => d.title === 'Point Import NYC')?.point).toEqual([
          -74.006, 40.7128,
        ])
        expect(importedPages.docs.find((d) => d.title === 'Point Import SF')?.point).toEqual([
          -122.4194, 37.7749,
        ])

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'Point Import ' } },
        })
      })

      it('should import selectHasMany field from CSV with indexed format', async () => {
        const csvContent =
          'title,selectHasMany_0,selectHasMany_1,selectHasMany_2\n' +
          '"SelectHasMany Import 1","tagA","tagB",""\n' +
          '"SelectHasMany Import 2","tagC","",""\n' +
          '"SelectHasMany Import 3","tagA","tagB","tagC"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'select-hasmany-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(3)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'SelectHasMany Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(3)
        expect(
          importedPages.docs.find((d) => d.title === 'SelectHasMany Import 1')?.selectHasMany,
        ).toEqual(['tagA', 'tagB'])
        expect(
          importedPages.docs.find((d) => d.title === 'SelectHasMany Import 2')?.selectHasMany,
        ).toEqual(['tagC'])
        expect(
          importedPages.docs.find((d) => d.title === 'SelectHasMany Import 3')?.selectHasMany,
        ).toEqual(['tagA', 'tagB', 'tagC'])

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'SelectHasMany Import ' } },
        })
      })

      it('should import textHasMany field from CSV with indexed format', async () => {
        const csvContent =
          'title,textHasMany_0,textHasMany_1,textHasMany_2\n' +
          '"TextHasMany Import 1","value1","value2",""\n' +
          '"TextHasMany Import 2","single","",""\n' +
          '"TextHasMany Import 3","a","b","c"'

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'text-hasmany-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(3)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'TextHasMany Import ' } },
          sort: 'title',
        })

        expect(importedPages.docs).toHaveLength(3)
        expect(
          importedPages.docs.find((d) => d.title === 'TextHasMany Import 1')?.textHasMany,
        ).toEqual(['value1', 'value2'])
        expect(
          importedPages.docs.find((d) => d.title === 'TextHasMany Import 2')?.textHasMany,
        ).toEqual(['single'])
        expect(
          importedPages.docs.find((d) => d.title === 'TextHasMany Import 3')?.textHasMany,
        ).toEqual(['a', 'b', 'c'])

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'TextHasMany Import ' } },
        })
      })

      it('should import upload field from CSV with media ID', async () => {
        const imageFilePath = path.resolve(dirname, './image.png')
        const imageFile = await getFileByPath(imageFilePath)

        const media = await payload.create({
          collection: 'media',
          data: {
            alt: 'Import Test Media',
          },
          file: {
            ...imageFile,
            name: 'import-test-media.png',
          } as File,
        })

        const csvContent = `title,upload\n"Upload Import 1","${media.id}"\n"Upload Import 2","${media.id}"`

        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'upload-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(2)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { contains: 'Upload Import ' } },
          sort: 'title',
          depth: 0,
        })

        expect(importedPages.docs).toHaveLength(2)
        expect(importedPages.docs[0]?.upload).toBe(media.id)
        expect(importedPages.docs[1]?.upload).toBe(media.id)

        await payload.delete({
          collection: 'pages',
          where: { title: { contains: 'Upload Import ' } },
        })
        await payload.delete({
          collection: 'media',
          id: media.id,
        })
      })
    })
    describe('custom ID imports', () => {
      const createdCustomIdPages: string[] = []

      afterEach(async () => {
        for (const id of createdCustomIdPages) {
          try {
            await payload.delete({
              collection: 'custom-id-pages' as CollectionSlug,
              id,
            })
          } catch {
            // Ignore cleanup errors
          }
        }
        createdCustomIdPages.length = 0
      })

      it('should import documents with custom text IDs in create mode', async () => {
        const testData = [
          { id: 'custom-page-1', title: 'Custom ID Page 1' },
          { id: 'custom-page-2', title: 'Custom ID Page 2' },
          { id: 'custom-page-3', title: 'Custom ID Page 3' },
        ]

        const jsonBuffer = Buffer.from(JSON.stringify(testData))

        const importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'custom-id-pages',
            importMode: 'create',
          },
          file: {
            data: jsonBuffer,
            mimetype: 'application/json',
            name: 'custom-id-import.json',
            size: jsonBuffer.length,
          },
        })

        await payload.jobs.run()

        const completedImport = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(completedImport.status).toBe('completed')
        expect(completedImport.summary?.imported).toBe(3)
        expect(completedImport.summary?.issues).toBe(0)

        const importedPages = await payload.find({
          collection: 'custom-id-pages' as CollectionSlug,
          sort: 'id',
        })

        expect(importedPages.docs).toHaveLength(3)
        expect(importedPages.docs[0]?.id).toBe('custom-page-1')
        expect(importedPages.docs[0]?.title).toBe('Custom ID Page 1')
        expect(importedPages.docs[1]?.id).toBe('custom-page-2')
        expect(importedPages.docs[2]?.id).toBe('custom-page-3')

        createdCustomIdPages.push('custom-page-1', 'custom-page-2', 'custom-page-3')
      })

      it('should import documents with custom text IDs from CSV', async () => {
        const csvContent = `id,title\ncustom-csv-1,CSV Custom Page 1\ncustom-csv-2,CSV Custom Page 2`
        const csvBuffer = Buffer.from(csvContent)

        const importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'custom-id-pages',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'custom-id-import.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        const completedImport = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(completedImport.status).toBe('completed')
        expect(completedImport.summary?.imported).toBe(2)

        const importedPages = await payload.find({
          collection: 'custom-id-pages' as CollectionSlug,
          where: {
            id: { in: ['custom-csv-1', 'custom-csv-2'] },
          },
          sort: 'id',
        })

        expect(importedPages.docs).toHaveLength(2)
        expect(importedPages.docs[0]?.id).toBe('custom-csv-1')
        expect(importedPages.docs[1]?.id).toBe('custom-csv-2')

        createdCustomIdPages.push('custom-csv-1', 'custom-csv-2')
      })

      it('should preserve custom IDs in upsert mode when creating new documents', async () => {
        const testData = [
          { id: 'upsert-custom-1', title: 'Upsert Custom Page 1' },
          { id: 'upsert-custom-2', title: 'Upsert Custom Page 2' },
        ]

        const jsonBuffer = Buffer.from(JSON.stringify(testData))

        const importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'custom-id-pages',
            importMode: 'upsert',
            matchField: 'id',
          },
          file: {
            data: jsonBuffer,
            mimetype: 'application/json',
            name: 'upsert-custom-id.json',
            size: jsonBuffer.length,
          },
        })

        await payload.jobs.run()

        const completedImport = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(completedImport.status).toBe('completed')
        expect(completedImport.summary?.imported).toBe(2)

        const importedPages = await payload.find({
          collection: 'custom-id-pages' as CollectionSlug,
          where: {
            id: { in: ['upsert-custom-1', 'upsert-custom-2'] },
          },
          sort: 'id',
        })

        expect(importedPages.docs).toHaveLength(2)
        expect(importedPages.docs[0]?.id).toBe('upsert-custom-1')
        expect(importedPages.docs[1]?.id).toBe('upsert-custom-2')

        createdCustomIdPages.push('upsert-custom-1', 'upsert-custom-2')
      })

      it('should update existing documents with custom IDs in upsert mode', async () => {
        await payload.create({
          collection: 'custom-id-pages' as CollectionSlug,
          data: {
            id: 'existing-custom-1',
            title: 'Original Title',
          },
        })

        createdCustomIdPages.push('existing-custom-1')

        const testData = [{ id: 'existing-custom-1', title: 'Updated Title via Upsert' }]

        const jsonBuffer = Buffer.from(JSON.stringify(testData))

        const importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'custom-id-pages',
            importMode: 'upsert',
            matchField: 'id',
          },
          file: {
            data: jsonBuffer,
            mimetype: 'application/json',
            name: 'upsert-update-custom-id.json',
            size: jsonBuffer.length,
          },
        })

        await payload.jobs.run()

        const completedImport = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(completedImport.status).toBe('completed')
        expect(completedImport.summary?.updated).toBe(1)

        const updatedPage = await payload.findByID({
          collection: 'custom-id-pages' as CollectionSlug,
          id: 'existing-custom-1',
        })

        expect(updatedPage.title).toBe('Updated Title via Upsert')
      })
    })
  })

  describe('collection configuration', () => {
    it('should exclude collections with custom export collections from base exports', () => {
      const exportsConfig = payload.collections['exports'].config
      const validSlugs =
        exportsConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      // posts has custom export collection (posts-export), should NOT be in base exports
      expect(validSlugs).not.toContain('posts')

      // posts-no-jobs-queue has custom export (posts-no-jobs-queue-export), should NOT be in base
      expect(validSlugs).not.toContain('posts-no-jobs-queue')

      // posts-with-limits has custom export (posts-with-limits-export), should NOT be in base
      expect(validSlugs).not.toContain('posts-with-limits')

      // posts-with-s3 has custom export (posts-with-s3-export), should NOT be in base
      expect(validSlugs).not.toContain('posts-with-s3')

      // pages overrideCollection doesn't change slug, so it should be in base exports
      expect(validSlugs).toContain('pages')

      // posts-exports-only has no custom export collection, should be in base
      expect(validSlugs).toContain('posts-exports-only')

      // media has no custom export collection, should be in base
      expect(validSlugs).toContain('media')

      // custom-id-pages has no custom export collection, should be in base
      expect(validSlugs).toContain('custom-id-pages')
    })

    it('should exclude collections with custom import collections from base imports', () => {
      const importsConfig = payload.collections['imports'].config
      const validSlugs =
        importsConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      // posts has custom import collection (posts-import), should NOT be in base imports
      expect(validSlugs).not.toContain('posts')

      // posts-with-limits has custom import (posts-with-limits-import), should NOT be in base
      expect(validSlugs).not.toContain('posts-with-limits')

      // posts-with-s3 has custom import (posts-with-s3-import), should NOT be in base
      expect(validSlugs).not.toContain('posts-with-s3')

      // pages overrideCollection doesn't change slug, so it should be in base imports
      expect(validSlugs).toContain('pages')

      // posts-imports-only has no custom import collection, should be in base
      expect(validSlugs).toContain('posts-imports-only')

      // media has no custom import collection, should be in base
      expect(validSlugs).toContain('media')

      // custom-id-pages has no custom import collection, should be in base
      expect(validSlugs).toContain('custom-id-pages')
    })

    it('custom export collection should only have its target collection slug', () => {
      const postsExportConfig = payload.collections['posts-export'].config
      const validSlugs =
        postsExportConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      expect(validSlugs).toHaveLength(1)
      expect(validSlugs).toEqual(['posts'])
    })

    it('custom import collection should only have its target collection slug', () => {
      const postsImportConfig = payload.collections['posts-import'].config
      const validSlugs =
        postsImportConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      expect(validSlugs).toHaveLength(1)
      expect(validSlugs).toEqual(['posts'])
    })
  })

  describe('posts-exports-only and posts-imports-only collections', () => {
    describe('posts-exports-only', () => {
      it('should export from posts-exports-only collection (no jobs queue)', async () => {
        const doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'posts-exports-only',
            format: 'csv',
          },
        })

        await payload.jobs.run()

        const exportDoc = await payload.findByID({
          collection: 'exports',
          id: doc.id,
        })

        expect(exportDoc.filename).toBeDefined()
        expect(exportDoc.filename).toMatch(/\.csv$/)
        const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const data = await readCSV(expectedPath)

        expect(data.length).toBeGreaterThan(0)
        expect(data[0].title).toContain('Export Only Post')
      })

      it('should not allow restricted user to export from posts-exports-only (access control)', async () => {
        const doc = await payload.create({
          collection: 'exports',
          user: restrictedUser,
          data: {
            collectionSlug: 'posts-exports-only',
            format: 'csv',
          },
        })

        const {
          docs: [latestJob],
        } = await payload.find({
          collection: 'payload-jobs',
          sort: '-createdAt',
          limit: 1,
        })

        expect(latestJob).toBeDefined()

        await payload.jobs.run()

        const exportDoc = await payload.findByID({
          collection: 'exports',
          id: doc.id,
        })

        const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const data = await readCSV(expectedPath)

        expect(data).toHaveLength(0)
      })
    })

    describe('posts-imports-only', () => {
      it('should import to posts-imports-only collection (no jobs queue, synchronous)', async () => {
        const csvContent = 'title\n"Sync Import Test 1"\n"Sync Import Test 2"\n"Sync Import Test 3"'
        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: 'posts-imports-only',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'sync-import-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(3)
        expect(importDoc.summary?.issues).toBe(0)

        const importedDocs = await payload.find({
          collection: 'posts-imports-only',
          where: {
            title: { contains: 'Sync Import Test' },
          },
        })

        expect(importedDocs.totalDocs).toBe(3)

        await payload.delete({
          collection: 'posts-imports-only',
          where: {
            title: { contains: 'Sync Import Test' },
          },
        })
      })

      it('should not allow restricted user to import to posts-imports-only (access control)', async () => {
        const csvContent = 'title\n"Restricted Import Test 1"\n"Restricted Import Test 2"'
        const csvBuffer = Buffer.from(csvContent)

        let importDoc = await payload.create({
          collection: 'imports',
          user: restrictedUser,
          data: {
            collectionSlug: 'posts-imports-only',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'restricted-import-test.csv',
            size: csvBuffer.length,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({
          collection: 'imports',
          id: importDoc.id,
        })

        expect(importDoc.status).toBe('failed')
        expect(importDoc.summary?.imported).toBe(0)
        expect(importDoc.summary?.issues).toBeGreaterThan(0)

        const importedDocs = await payload.find({
          collection: 'posts-imports-only',
          where: {
            title: { contains: 'Restricted Import Test' },
          },
        })

        expect(importedDocs.totalDocs).toBe(0)
      })
    })
  })

  describe('access control with jobs queue', () => {
    it('should respect access control when export uses jobs queue', async () => {
      for (let i = 0; i < 3; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Access Control Export Test ${i}`,
          },
        })
      }

      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 100,
        },
      })

      await payload.jobs.run()

      const exportDoc = await payload.findByID({
        collection: 'exports',
        id: doc.id,
      })

      expect(exportDoc.filename).toBeDefined()
      const expectedPath = path.join(dirname, './uploads', exportDoc.filename as string)
      const data = await readCSV(expectedPath)

      expect(data.length).toBeGreaterThan(0)
    })

    it('should respect access control when import uses jobs queue', async () => {
      const csvContent = 'title\n"Jobs Queue Import 1"\n"Jobs Queue Import 2"'
      const csvBuffer = Buffer.from(csvContent)

      const importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'jobs-queue-import-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      const updatedImportDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(updatedImportDoc.status).toBe('completed')
      expect(updatedImportDoc.summary?.imported).toBe(2)

      const importedDocs = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Jobs Queue Import' },
        },
      })

      expect(importedDocs.totalDocs).toBe(2)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Jobs Queue Import' },
        },
      })
    })
  })

  describe('preview endpoints', () => {
    it('should return export preview data for CSV format', async () => {
      await payload.create({
        collection: 'pages',
        data: {
          title: 'Preview Export Test 1',
          excerpt: 'Excerpt for preview 1',
          _status: 'published',
        },
      })

      await payload.create({
        collection: 'pages',
        data: {
          title: 'Preview Export Test 2',
          excerpt: 'Excerpt for preview 2',
          _status: 'published',
        },
      })

      const response = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fields: ['id', 'title', 'excerpt'],
            format: 'csv',
            limit: 5,
            where: {
              title: { contains: 'Preview Export Test' },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toBeDefined()
      expect(response.docs.length).toBeLessThanOrEqual(5)
      expect(response.totalDocs).toBeGreaterThanOrEqual(2)
      expect(response.docs[0]).toHaveProperty('id')
      expect(response.docs[0]).toHaveProperty('title')

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Preview Export Test' },
        },
      })
    })

    it('should return export preview data for JSON format', async () => {
      await payload.create({
        collection: 'pages',
        data: {
          title: 'JSON Preview Export Test',
          excerpt: 'JSON excerpt',
          group: {
            value: 'nested group value',
          },
          _status: 'published',
        },
      })

      const response = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            format: 'json',
            limit: 5,
            where: {
              title: { equals: 'JSON Preview Export Test' },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toBeDefined()
      expect(response.totalDocs).toBe(1)
      expect(response.docs[0]?.group).toBeDefined()
      expect(response.docs[0]?.group?.value).toBe('nested group value')

      await payload.delete({
        collection: 'pages',
        where: {
          title: { equals: 'JSON Preview Export Test' },
        },
      })
    })

    it('should return import preview data for CSV', async () => {
      const csvContent =
        'title,excerpt\n"Import Preview Test 1","Excerpt 1"\n"Import Preview Test 2","Excerpt 2"'
      const base64Data = Buffer.from(csvContent).toString('base64')

      const response = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'csv',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toHaveLength(2)
      expect(response.docs[0]?.title).toBe('Import Preview Test 1')
      expect(response.docs[1]?.excerpt).toBe('Excerpt 2')
      expect(response.totalDocs).toBe(2)
    })

    it('should return import preview data for JSON', async () => {
      const jsonContent = JSON.stringify([
        { title: 'JSON Import Preview 1', excerpt: 'Excerpt 1' },
        { title: 'JSON Import Preview 2', excerpt: 'Excerpt 2' },
      ])
      const base64Data = Buffer.from(jsonContent).toString('base64')

      const response = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'json',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toHaveLength(2)
      expect(response.docs[0]?.title).toBe('JSON Import Preview 1')
      expect(response.totalDocs).toBe(2)
    })

    it('should handle invalid collection slug in export preview', async () => {
      const response = await restClient.POST('/exports/export-preview', {
        body: JSON.stringify({
          collectionSlug: 'nonexistent-collection',
          format: 'csv',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })

    it('should handle invalid collection slug in import preview', async () => {
      const csvContent = 'title\n"Test"'
      const base64Data = Buffer.from(csvContent).toString('base64')

      const response = await restClient.POST('/imports/preview-data', {
        body: JSON.stringify({
          collectionSlug: 'nonexistent-collection',
          fileData: base64Data,
          format: 'csv',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })

    it('should handle missing file data in import preview', async () => {
      const response = await restClient.POST('/imports/preview-data', {
        body: JSON.stringify({
          collectionSlug: 'pages',
          format: 'csv',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('No file data')
    })

    it('should paginate import preview data for CSV', async () => {
      const rows = ['title,excerpt']
      for (let i = 0; i < 15; i++) {
        rows.push(`"Import Pagination Test ${i}","Excerpt ${i}"`)
      }
      const csvContent = rows.join('\n')
      const base64Data = Buffer.from(csvContent).toString('base64')

      const responsePage1: {
        docs: unknown[]
        hasNextPage: boolean
        hasPrevPage: boolean
        page: number
        totalDocs: number
        totalPages: number
      } = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'csv',
            previewLimit: 10,
            previewPage: 1,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(responsePage1.docs).toHaveLength(10)
      expect(responsePage1.totalDocs).toBe(15)
      expect(responsePage1.page).toBe(1)
      expect(responsePage1.totalPages).toBe(2)
      expect(responsePage1.hasNextPage).toBe(true)
      expect(responsePage1.hasPrevPage).toBe(false)

      const responsePage2: {
        docs: unknown[]
        hasNextPage: boolean
        hasPrevPage: boolean
        page: number
        totalDocs: number
        totalPages: number
      } = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'csv',
            previewLimit: 10,
            previewPage: 2,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(responsePage2.docs).toHaveLength(5)
      expect(responsePage2.totalDocs).toBe(15)
      expect(responsePage2.page).toBe(2)
      expect(responsePage2.totalPages).toBe(2)
      expect(responsePage2.hasNextPage).toBe(false)
      expect(responsePage2.hasPrevPage).toBe(true)
    })

    it('should paginate import preview data for JSON', async () => {
      const items = []
      for (let i = 0; i < 11; i++) {
        items.push({ title: `JSON Import Test ${i}`, excerpt: `Excerpt ${i}` })
      }
      const jsonContent = JSON.stringify(items)
      const base64Data = Buffer.from(jsonContent).toString('base64')

      const responsePage1: {
        docs: unknown[]
        hasNextPage: boolean
        hasPrevPage: boolean
        page: number
        totalDocs: number
        totalPages: number
      } = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'json',
            previewLimit: 10,
            previewPage: 1,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(responsePage1.docs).toHaveLength(10)
      expect(responsePage1.totalDocs).toBe(11)
      expect(responsePage1.page).toBe(1)
      expect(responsePage1.totalPages).toBe(2)
      expect(responsePage1.hasNextPage).toBe(true)
      expect(responsePage1.hasPrevPage).toBe(false)

      const responsePage2: {
        docs: unknown[]
        hasNextPage: boolean
        hasPrevPage: boolean
        page: number
        totalDocs: number
        totalPages: number
      } = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'json',
            previewLimit: 10,
            previewPage: 2,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(responsePage2.docs).toHaveLength(1)
      expect(responsePage2.totalDocs).toBe(11)
      expect(responsePage2.page).toBe(2)
      expect(responsePage2.hasNextPage).toBe(false)
      expect(responsePage2.hasPrevPage).toBe(true)
    })

    it('should default to previewLimit 10 and previewPage 1 for import preview', async () => {
      const rows = ['title,excerpt']
      for (let i = 0; i < 25; i++) {
        rows.push(`"Default Pagination Test ${i}","Excerpt ${i}"`)
      }
      const csvContent = rows.join('\n')
      const base64Data = Buffer.from(csvContent).toString('base64')

      const response: {
        docs: unknown[]
        limit: number
        page: number
        totalDocs: number
        totalPages: number
      } = await restClient
        .POST('/imports/preview-data', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fileData: base64Data,
            format: 'csv',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toHaveLength(10) // Default limit
      expect(response.page).toBe(1) // Default page
      expect(response.limit).toBe(10)
      expect(response.totalDocs).toBe(25)
      expect(response.totalPages).toBe(3)
    })

    it('should respect preview limit (max 10)', async () => {
      for (let i = 0; i < 15; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Preview Limit Test ${i}`,
            _status: 'published',
          },
        })
      }

      const response = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            format: 'csv',
            limit: 100, // Request more than max
            where: {
              title: { contains: 'Preview Limit Test' },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs.length).toBeLessThanOrEqual(10)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Preview Limit Test' },
        },
      })
    })

    it('should respect export limit when paginating preview (limit 11, per page 10)', async () => {
      for (let i = 0; i < 15; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Preview Pagination Test ${i}`,
            _status: 'published',
          },
        })
      }

      const responsePage1: {
        docs: unknown[]
        exportTotalDocs: number
        hasNextPage: boolean
        hasPrevPage: boolean
        page: number
        totalPages: number
      } = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            format: 'csv',
            limit: 11, // Export limit
            previewLimit: 10, // Per page
            previewPage: 1,
            where: {
              title: { contains: 'Preview Pagination Test' },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(responsePage1.docs).toHaveLength(10)
      expect(responsePage1.exportTotalDocs).toBe(11)
      expect(responsePage1.page).toBe(1)
      expect(responsePage1.totalPages).toBe(2)
      expect(responsePage1.hasNextPage).toBe(true)
      expect(responsePage1.hasPrevPage).toBe(false)

      const responsePage2: {
        docs: unknown[]
        exportTotalDocs: number
        hasNextPage: boolean
        hasPrevPage: boolean
        page: number
        totalPages: number
      } = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            format: 'csv',
            limit: 11, // Export limit
            previewLimit: 10, // Per page
            previewPage: 2,
            where: {
              title: { contains: 'Preview Pagination Test' },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(responsePage2.docs).toHaveLength(1)
      expect(responsePage2.exportTotalDocs).toBe(11)
      expect(responsePage2.page).toBe(2)
      expect(responsePage2.totalPages).toBe(2)
      expect(responsePage2.hasNextPage).toBe(false)
      expect(responsePage2.hasPrevPage).toBe(true)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Preview Pagination Test' },
        },
      })
    })

    it('should return empty docs when preview page exceeds export limit boundary', async () => {
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: {
            title: `Preview Boundary Test ${i}`,
            _status: 'published',
          },
        })
      }

      const response: {
        docs: unknown[]
        exportTotalDocs: number
        hasNextPage: boolean
        page: number
        totalPages: number
      } = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            format: 'csv',
            limit: 5, // Export limit
            previewLimit: 10, // Per page
            previewPage: 2, // This page is beyond the export limit
            where: {
              title: { contains: 'Preview Boundary Test' },
            },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toHaveLength(0)
      expect(response.exportTotalDocs).toBe(5)
      expect(response.page).toBe(2)
      expect(response.totalPages).toBe(1)
      expect(response.hasNextPage).toBe(false)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Preview Boundary Test' },
        },
      })
    })

    it('should have matching column order between preview and export when no fields selected', async () => {
      const previewResponse: { columns: string[]; docs: unknown[] } = await restClient
        .POST('/posts-export/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'posts',
            format: 'csv',
            limit: 5,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(previewResponse.columns).toBeDefined()
      expect(previewResponse.columns.length).toBeGreaterThan(0)

      const exportDoc = await payload.create({
        collection: 'posts-export',
        user,
        data: {
          collectionSlug: 'posts',
          format: 'csv',
          limit: 5,
        },
      })

      const finalExportDoc = await payload.findByID({
        collection: 'posts-export',
        id: exportDoc.id,
      })

      expect(finalExportDoc.filename).toBeDefined()
      const exportPath = path.join(dirname, './uploads', finalExportDoc.filename as string)
      const exportData = await readCSV(exportPath)
      const exportColumns = Object.keys(exportData[0])

      expect(previewResponse.columns).toStrictEqual(exportColumns)
    })

    it('should have matching column order between preview and export with selected fields', async () => {
      const selectedFields = ['title', 'id', 'createdAt']

      const previewResponse: { columns: string[]; docs: unknown[] } = await restClient
        .POST('/posts-export/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'posts',
            fields: selectedFields,
            format: 'csv',
            limit: 5,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(previewResponse.columns).toBeDefined()
      expect(previewResponse.columns.length).toBeGreaterThan(0)

      const exportDoc = await payload.create({
        collection: 'posts-export',
        user,
        data: {
          collectionSlug: 'posts',
          fields: selectedFields,
          format: 'csv',
          limit: 5,
        },
      })

      const finalExportDoc = await payload.findByID({
        collection: 'posts-export',
        id: exportDoc.id,
      })

      expect(finalExportDoc.filename).toBeDefined()
      const exportPath = path.join(dirname, './uploads', finalExportDoc.filename as string)
      const exportData = await readCSV(exportPath)
      const exportColumns = Object.keys(exportData[0])

      expect(previewResponse.columns).toStrictEqual(exportColumns)
      expect(exportColumns).toStrictEqual(selectedFields)
    })
  })

  describe('rich text field handling', () => {
    it('should preserve Lexical numeric properties on JSON export/import', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Rich Text JSON Test',
          blocks: [
            {
              blockType: 'content',
              // @ts-expect-error - richTextData is the Lexical structure
              richText: richTextData,
            },
          ],
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'json',
          where: {
            id: { equals: page.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const jsonPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const exportedData = await readJSON(jsonPath)

      expect(exportedData[0].blocks[0].richText.root.version).toBe(1)
      expect(exportedData[0].blocks[0].richText.root.children[0].version).toBe(1)

      await payload.delete({
        collection: 'pages',
        where: {
          id: { equals: page.id },
        },
      })

      const jsonBuffer = Buffer.from(JSON.stringify(exportedData))
      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: jsonBuffer,
          mimetype: 'application/json',
          name: 'rich-text-test.json',
          size: jsonBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      const importedPage = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Rich Text JSON Test' },
        },
      })

      expect(importedPage.docs).toHaveLength(1)
      const block = importedPage.docs[0]?.blocks?.[0]
      const richText = block && 'richText' in block ? (block.richText as typeof richTextData) : null
      expect(typeof richText?.root?.version).toBe('number')
      expect(richText?.root?.version).toBe(1)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { equals: 'Rich Text JSON Test' },
        },
      })
    })

    it('should export rich text inside blocks to CSV and import back', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Rich Text CSV Block Test',
          blocks: [
            {
              blockType: 'content',
              // @ts-expect-error - richTextData is the Lexical structure
              richText: richTextData,
            },
          ],
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          where: {
            id: { equals: page.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)

      await payload.delete({
        collection: 'pages',
        where: {
          id: { equals: page.id },
        },
      })

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: fs.readFileSync(csvPath),
          mimetype: 'text/csv',
          name: 'rich-text-csv-test.csv',
          size: fs.statSync(csvPath).size,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      const importedPage = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Rich Text CSV Block Test' },
        },
      })

      expect(importedPage.docs).toHaveLength(1)
      const block = importedPage.docs[0]?.blocks?.[0]
      const richText = block && 'richText' in block ? (block.richText as typeof richTextData) : null
      expect(richText?.root?.type).toBe('root')
      expect(richText?.root?.children?.length).toBeGreaterThan(0)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { equals: 'Rich Text CSV Block Test' },
        },
      })
    })
  })

  describe('error recovery', () => {
    it('should continue processing after individual document errors', async () => {
      const csvContent =
        'title\n' +
        '"Error Recovery Test 1"\n' +
        '""' + // Empty title - will fail required validation
        '\n' +
        '"Error Recovery Test 3"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'error-recovery-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBeGreaterThanOrEqual(1)

      const importedDocs = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Error Recovery Test' },
        },
      })

      expect(importedDocs.totalDocs).toBeGreaterThanOrEqual(1)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Error Recovery Test' },
        },
      })
    })

    it('should report accurate error counts on partial failure', async () => {
      const csvContent =
        'title\n' +
        '"Partial Fail Test 1"\n' +
        '""\n' + // Will fail - empty title violates required
        '"Partial Fail Test 3"\n' +
        '""\n' + // Will fail - empty title violates required
        '"Partial Fail Test 5"'

      const csvBuffer = Buffer.from(csvContent)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'partial-fail-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBeGreaterThanOrEqual(1)
      expect(importDoc.summary?.total).toBeGreaterThanOrEqual(importDoc.summary?.imported || 0)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Partial Fail Test' },
        },
      })
    })

    it('should handle malformed CSV gracefully', async () => {
      const malformedCSV = 'title,excerpt\n"Unclosed quote,Value'
      const csvBuffer = Buffer.from(malformedCSV)

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 'malformed-csv-test.csv',
          size: csvBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(['failed', 'completed', 'pending']).toContain(importDoc.status)
    })
  })

  describe('custom field functions edge cases', () => {
    it('should handle toCSV function that returns undefined', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'ToCSV Undefined Test',
          custom: 'test value',
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title', 'custom'],
          format: 'csv',
          where: {
            id: { equals: page.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      expect(exportedDoc.filename).toBeDefined()
      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const data = await readCSV(csvPath)

      expect(data[0].custom).toBe('test value toCSV')

      await payload.delete({
        collection: 'pages',
        where: {
          id: { equals: page.id },
        },
      })
    })

    it('should apply fromCSV to reconstruct relationships', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'FromCSV Relationship Test',
          customRelationship: user.id,
          _status: 'published',
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title', 'customRelationship'],
          format: 'csv',
          where: {
            id: { equals: page.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const exportedData = await readCSV(csvPath)

      expect(exportedData).toHaveLength(1)
      expect(exportedData[0].title).toBe('FromCSV Relationship Test')

      await payload.delete({
        collection: 'pages',
        where: {
          id: { equals: page.id },
        },
      })

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: fs.readFileSync(csvPath),
          mimetype: 'text/csv',
          name: 'from-csv-test.csv',
          size: fs.statSync(csvPath).size,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      const importedPage = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'FromCSV Relationship Test' },
        },
      })

      expect(importedPage.docs).toHaveLength(1)
      expect(importedPage.docs[0]?.title).toBe('FromCSV Relationship Test')

      await payload.delete({
        collection: 'pages',
        where: {
          title: { equals: 'FromCSV Relationship Test' },
        },
      })
    })
  })

  describe('disabled fields in complex structures', () => {
    it('should exclude disabled fields from export', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Disabled Field Test',
          group: {
            value: 'include this',
            ignore: 'this field exists but is not disabled',
          },
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'title', 'group.value'],
          format: 'csv',
          where: {
            id: { equals: page.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const data = await readCSV(csvPath)

      expect(data[0].group_value).toBe('include this')
      expect(data[0].group_ignore).toBeUndefined()

      await payload.delete({
        collection: 'pages',
        where: {
          id: { equals: page.id },
        },
      })
    })
  })

  describe('JSON-specific tests', () => {
    it('should import deeply nested JSON objects', async () => {
      const nestedData = [
        {
          title: 'Deeply Nested Test',
          group: {
            value: 'nested value',
            array: [
              { field1: 'array item 1', field2: 'value 1' },
              { field1: 'array item 2', field2: 'value 2' },
            ],
          },
          blocks: [
            {
              blockType: 'hero',
              title: 'Hero Block Title',
            },
          ],
        },
      ]

      const jsonBuffer = Buffer.from(JSON.stringify(nestedData))

      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: jsonBuffer,
          mimetype: 'application/json',
          name: 'deeply-nested-test.json',
          size: jsonBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')
      expect(importDoc.summary?.imported).toBe(1)

      const importedPage = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'Deeply Nested Test' },
        },
      })

      expect(importedPage.docs).toHaveLength(1)
      const doc = importedPage.docs[0]
      expect(doc?.group?.value).toBe('nested value')
      expect(doc?.group?.array).toHaveLength(2)
      expect(doc?.group?.array?.[0]?.field1).toBe('array item 1')
      expect(doc?.blocks).toHaveLength(1)
      expect(doc?.blocks?.[0]?.blockType).toBe('hero')
      expect((doc?.blocks?.[0] as { title?: string })?.title).toBe('Hero Block Title')

      await payload.delete({
        collection: 'pages',
        where: {
          title: { equals: 'Deeply Nested Test' },
        },
      })
    })

    it('should handle JSON export and import roundtrip with all field types', async () => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'JSON Roundtrip Test',
          excerpt: 'Test excerpt',
          localized: 'localized value',
          hasManyNumber: [1, 2, 3, 4, 5],
          array: [
            { field1: 'a1', field2: 'a2' },
            { field1: 'b1', field2: 'b2' },
          ],
          group: {
            value: 'group value',
            array: [{ field1: 'ga1', field2: 'ga2' }],
          },
        },
        locale: 'en',
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'json',
          where: {
            id: { equals: page.id },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const jsonPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const exportedData = await readJSON(jsonPath)

      expect(exportedData).toHaveLength(1)
      expect(exportedData[0].title).toBe('JSON Roundtrip Test')
      expect(exportedData[0].hasManyNumber).toEqual([1, 2, 3, 4, 5])

      await payload.delete({
        collection: 'pages',
        where: {
          id: { equals: page.id },
        },
      })

      const jsonBuffer = Buffer.from(JSON.stringify(exportedData))
      let importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: jsonBuffer,
          mimetype: 'application/json',
          name: 'json-roundtrip-test.json',
          size: jsonBuffer.length,
        },
      })

      await payload.jobs.run()

      importDoc = await payload.findByID({
        collection: 'imports',
        id: importDoc.id,
      })

      expect(importDoc.status).toBe('completed')

      const importedPage = await payload.find({
        collection: 'pages',
        where: {
          title: { equals: 'JSON Roundtrip Test' },
        },
      })

      expect(importedPage.docs).toHaveLength(1)
      const imported = importedPage.docs[0]
      expect(imported?.excerpt).toBe('Test excerpt')
      expect(imported?.hasManyNumber).toEqual([1, 2, 3, 4, 5])
      expect(imported?.array).toHaveLength(2)
      expect(imported?.group?.value).toBe('group value')

      await payload.delete({
        collection: 'pages',
        where: {
          title: { equals: 'JSON Roundtrip Test' },
        },
      })
    })
  })

  describe('limit and pagination edge cases', () => {
    it('should handle page exceeding total pages', async () => {
      await payload.create({
        collection: 'pages',
        data: { title: 'Pagination Test 1', _status: 'published' },
      })
      await payload.create({
        collection: 'pages',
        data: { title: 'Pagination Test 2', _status: 'published' },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 1,
          page: 999,
          where: {
            title: { contains: 'Pagination Test' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      expect(exportedDoc.filename).toBeDefined()
      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const data = await readCSV(csvPath)

      expect(data.length).toBeLessThanOrEqual(2)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Pagination Test' },
        },
      })
    })

    it('should handle very large limit values', async () => {
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: { title: `Large Limit Test ${i}` },
        })
      }

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 100000,
          where: {
            title: { contains: 'Large Limit Test' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      expect(exportedDoc.filename).toBeDefined()
      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const data = await readCSV(csvPath)

      expect(data).toHaveLength(5)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Large Limit Test' },
        },
      })
    })

    it('should export correctly with limit=1', async () => {
      await payload.create({
        collection: 'pages',
        data: { title: 'Single Limit Test 1' },
      })
      await payload.create({
        collection: 'pages',
        data: { title: 'Single Limit Test 2' },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          limit: 1,
          where: {
            title: { contains: 'Single Limit Test' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const data = await readCSV(csvPath)

      expect(data).toHaveLength(1)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Single Limit Test' },
        },
      })
    })
  })

  describe('streaming export edge cases', () => {
    it('should stream large exports without memory issues', async () => {
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(
          payload.create({
            collection: 'pages',
            data: {
              title: `Stream Test ${i}`,
              excerpt: `Excerpt for stream test ${i}`,
              _status: 'published',
            },
          }),
        )
      }
      await Promise.all(promises)

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          where: {
            title: { contains: 'Stream Test' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      expect(exportedDoc.filename).toBeDefined()
      const csvPath = path.join(dirname, './uploads', exportedDoc.filename as string)
      const data = await readCSV(csvPath)

      expect(data).toHaveLength(100)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Stream Test' },
        },
      })
    })

    it('should handle empty result set in streaming export', async () => {
      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          where: {
            title: { equals: 'NonExistent Document XYZ123' },
          },
        },
      })

      await payload.jobs.run()

      const exportedDoc = await payload.findByID({
        collection: 'exports',
        id: exportDoc.id,
      })

      expect(exportedDoc).toBeDefined()
    })
  })

  describe('concurrent operations', () => {
    it('should handle multiple simultaneous imports', async () => {
      const timestamp = Date.now()

      const csv1 = `title\n"Concurrent Import A1 ${timestamp}"\n"Concurrent Import A2 ${timestamp}"`
      const csv2 = `title\n"Concurrent Import B1 ${timestamp}"\n"Concurrent Import B2 ${timestamp}"`

      const import1 = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: Buffer.from(csv1),
          mimetype: 'text/csv',
          name: `concurrent-import-1-${timestamp}.csv`,
          size: csv1.length,
        },
      })

      const import2 = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: Buffer.from(csv2),
          mimetype: 'text/csv',
          name: `concurrent-import-2-${timestamp}.csv`,
          size: csv2.length,
        },
      })

      await payload.jobs.run()

      const [finalImport1, finalImport2] = await Promise.all([
        payload.findByID({ collection: 'imports', id: import1.id }),
        payload.findByID({ collection: 'imports', id: import2.id }),
      ])

      expect(finalImport1.status).toBe('completed')
      expect(finalImport2.status).toBe('completed')
      expect(finalImport1.summary?.imported).toBe(2)
      expect(finalImport2.summary?.imported).toBe(2)

      const allDocs = await payload.find({
        collection: 'pages',
        where: {
          and: [
            { title: { contains: 'Concurrent Import' } },
            { title: { contains: String(timestamp) } },
          ],
        },
      })

      expect(allDocs.totalDocs).toBe(4)

      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: String(timestamp) },
        },
      })
    })

    it('should handle export during active import', async () => {
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: 'pages',
          data: { title: `Concurrent Export Source ${i}`, _status: 'published' },
        })
      }

      const csvData =
        'title\n"Concurrent Import During Export 1"\n"Concurrent Import During Export 2"'
      const importDoc = await payload.create({
        collection: 'imports',
        user,
        data: {
          collectionSlug: 'pages',
          importMode: 'create',
        },
        file: {
          data: Buffer.from(csvData),
          mimetype: 'text/csv',
          name: 'concurrent-test.csv',
          size: csvData.length,
        },
      })

      const exportDoc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          format: 'csv',
          where: {
            title: { contains: 'Concurrent Export Source' },
          },
        },
      })

      await payload.jobs.run()

      const [finalImport, finalExport] = await Promise.all([
        payload.findByID({ collection: 'imports', id: importDoc.id }),
        payload.findByID({ collection: 'exports', id: exportDoc.id }),
      ])

      expect(finalImport.status).toBe('completed')
      expect(finalExport).toBeDefined()

      if (finalExport.filename) {
        const csvPath = path.join(dirname, './uploads', finalExport.filename)
        const exportedData = await readCSV(csvPath)
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(exportedData).toHaveLength(5)
      }

      await payload.delete({
        collection: 'pages',
        where: {
          or: [
            { title: { contains: 'Concurrent Export Source' } },
            { title: { contains: 'Concurrent Import During Export' } },
          ],
        },
      })
    })
  })

  describe('max limit enforcement', () => {
    const createdPostIds: (number | string)[] = []

    beforeEach(async () => {
      for (let i = 0; i < 10; i++) {
        const doc = await payload.create({
          collection: 'posts-with-limits',
          data: { title: `Limit Test Post ${i}` },
        })
        createdPostIds.push(doc.id)
      }
    })

    afterAll(async () => {
      if (createdPostIds.length > 0) {
        for (const id of createdPostIds) {
          try {
            await payload.delete({
              collection: 'posts-with-limits',
              id,
            })
          } catch {
            // Ignore - document may have already been deleted
          }
        }
        createdPostIds.length = 0
      }
    })

    describe('export max limit', () => {
      it('should limit export to maxLimit when no user limit specified', async () => {
        const exportDoc = await payload.create({
          collection: 'posts-with-limits-export',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            format: 'csv',
          },
        })

        expect(exportDoc.filename).toBeDefined()

        const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const data = await readCSV(exportPath)

        expect(data).toHaveLength(5)
      })

      it('should clamp user limit to maxLimit when user limit exceeds maxLimit', async () => {
        const exportDoc = await payload.create({
          collection: 'posts-with-limits-export',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            limit: 100,
          },
        })

        expect(exportDoc.filename).toBeDefined()

        const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const data = await readCSV(exportPath)

        expect(data).toHaveLength(5)
      })

      it('should use user limit when it is below maxLimit', async () => {
        const exportDoc = await payload.create({
          collection: 'posts-with-limits-export',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            limit: 3,
          },
        })

        expect(exportDoc.filename).toBeDefined()

        const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const data = await readCSV(exportPath)

        expect(data).toHaveLength(3)
      })

      it('should include maxLimit in export preview response', async () => {
        const response = await restClient.POST(`/posts-with-limits-export/export-preview`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()

        expect(result.maxLimit).toBe(5)
        expect(result.totalDocs).toBe(5)
      })

      it('should have preview match exactly what is exported', async () => {
        const previewResponse = await restClient.POST(`/posts-with-limits-export/export-preview`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            previewLimit: 10,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const preview = await previewResponse.json()

        expect(preview.maxLimit).toBe(5)
        expect(preview.exportTotalDocs).toBe(5)
        expect(preview.totalDocs).toBe(5)
        expect(preview.docs).toHaveLength(5)

        const exportDoc = await payload.create({
          collection: 'posts-with-limits-export',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            format: 'csv',
          },
        })

        expect(exportDoc.filename).toBeDefined()

        const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const exportedData = await readCSV(exportPath)

        expect(exportedData).toHaveLength(preview.exportTotalDocs)
        expect(exportedData).toHaveLength(5)
      })

      it('should have preview pagination respect maxLimit', async () => {
        const page1Response = await restClient.POST(`/posts-with-limits-export/export-preview`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            previewLimit: 3,
            previewPage: 1,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const page1 = await page1Response.json()

        expect(page1.docs).toHaveLength(3)
        expect(page1.totalDocs).toBe(5)
        expect(page1.totalPages).toBe(2)
        expect(page1.hasNextPage).toBe(true)
        expect(page1.hasPrevPage).toBe(false)

        const page2Response = await restClient.POST(`/posts-with-limits-export/export-preview`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            previewLimit: 3,
            previewPage: 2,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const page2 = await page2Response.json()

        expect(page2.docs).toHaveLength(2)
        expect(page2.totalDocs).toBe(5)
        expect(page2.totalPages).toBe(2)
        expect(page2.hasNextPage).toBe(false)
        expect(page2.hasPrevPage).toBe(true)
        expect(page1.docs.length + page2.docs.length).toBe(5)
      })
    })

    describe('import max limit', () => {
      it('should reject import when document count exceeds maxLimit', async () => {
        const csvContent = Array.from({ length: 10 }, (_, i) => `"Exceed Limit Import ${i}"`).join(
          '\n',
        )
        const csv = `title\n${csvContent}`
        const csvBuffer = Buffer.from(csv)

        const importDoc = await payload.create({
          collection: 'posts-with-limits-import',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'exceed-limit-import.csv',
            size: csvBuffer.length,
          },
        })

        expect(importDoc.status).toBe('failed')
        expect(importDoc.summary?.imported).toBe(0)
        expect(importDoc.summary?.issues).toBeGreaterThan(0)

        const importedDocs = await payload.find({
          collection: 'posts-with-limits',
          where: {
            title: { contains: 'Exceed Limit Import' },
          },
        })

        expect(importedDocs.totalDocs).toBe(0)
      })

      it('should allow import when document count equals maxLimit', async () => {
        const csvContent = Array.from({ length: 5 }, (_, i) => `"Exact Limit Import ${i}"`).join(
          '\n',
        )
        const csv = `title\n${csvContent}`
        const csvBuffer = Buffer.from(csv)

        const importDoc = await payload.create({
          collection: 'posts-with-limits-import',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'exact-limit-import.csv',
            size: csvBuffer.length,
          },
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(5)
        expect(importDoc.summary?.issues).toBe(0)

        await payload.delete({
          collection: 'posts-with-limits',
          where: {
            title: { contains: 'Exact Limit Import' },
          },
        })
      })

      it('should allow import when document count is below maxLimit', async () => {
        const csvContent = Array.from({ length: 3 }, (_, i) => `"Below Limit Import ${i}"`).join(
          '\n',
        )
        const csv = `title\n${csvContent}`
        const csvBuffer = Buffer.from(csv)

        const importDoc = await payload.create({
          collection: 'posts-with-limits-import',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            importMode: 'create',
          },
          file: {
            data: csvBuffer,
            mimetype: 'text/csv',
            name: 'below-limit-import.csv',
            size: csvBuffer.length,
          },
        })

        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(3)
        expect(importDoc.summary?.issues).toBe(0)

        await payload.delete({
          collection: 'posts-with-limits',
          where: {
            title: { contains: 'Below Limit Import' },
          },
        })
      })

      it('should include maxLimit and limitExceeded in import preview response', async () => {
        const csvContent = Array.from({ length: 10 }, (_, i) => `"Preview Limit Test ${i}"`).join(
          '\n',
        )
        const csv = `title\n${csvContent}`
        const csvBuffer = Buffer.from(csv)

        const response = await restClient.POST(`/posts-with-limits-import/preview-data`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            fileData: csvBuffer.toString('base64'),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()

        expect(result.maxLimit).toBe(5)
        expect(result.limitExceeded).toBe(true)
        expect(result.totalDocs).toBe(10)
      })

      it('should have import preview accurately predict import outcome', async () => {
        const exceedsLimitCsv = `title\n${Array.from({ length: 10 }, (_, i) => `"Predict Fail ${i}"`).join('\n')}`
        const exceedsBuffer = Buffer.from(exceedsLimitCsv)

        const exceedsPreview = await restClient.POST(`/posts-with-limits-import/preview-data`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            fileData: exceedsBuffer.toString('base64'),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const exceedsResult = await exceedsPreview.json()

        expect(exceedsResult.limitExceeded).toBe(true)
        expect(exceedsResult.maxLimit).toBe(5)
        expect(exceedsResult.totalDocs).toBe(10)

        const failedImport = await payload.create({
          collection: 'posts-with-limits-import',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            importMode: 'create',
          },
          file: {
            data: exceedsBuffer,
            mimetype: 'text/csv',
            name: 'predict-fail.csv',
            size: exceedsBuffer.length,
          },
        })

        expect(failedImport.status).toBe('failed')

        const withinLimitCsv = `title\n${Array.from({ length: 5 }, (_, i) => `"Predict Success ${i}"`).join('\n')}`
        const withinBuffer = Buffer.from(withinLimitCsv)

        const withinPreview = await restClient.POST(`/posts-with-limits-import/preview-data`, {
          body: JSON.stringify({
            collectionSlug: 'posts-with-limits',
            format: 'csv',
            fileData: withinBuffer.toString('base64'),
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const withinResult = await withinPreview.json()

        expect(withinResult.limitExceeded).toBe(false)
        expect(withinResult.maxLimit).toBe(5)
        expect(withinResult.totalDocs).toBe(5)

        const successImport = await payload.create({
          collection: 'posts-with-limits-import',
          user,
          data: {
            collectionSlug: 'posts-with-limits',
            importMode: 'create',
          },
          file: {
            data: withinBuffer,
            mimetype: 'text/csv',
            name: 'predict-success.csv',
            size: withinBuffer.length,
          },
        })

        expect(successImport.status).toBe('completed')
        expect(successImport.summary?.imported).toBe(5)

        await payload.delete({
          collection: 'posts-with-limits',
          where: {
            title: { contains: 'Predict Success' },
          },
        })
      })
    })
  })

  // S3 storage integration tests are skipped here because they require an HTTP server.
  // The int test environment uses in-process route handlers, but getFileFromDoc uses
  // fetch() which requires a real HTTP server. See e2e.spec.ts for S3 tests that run
  // with a real server.
  describe.skip('S3 storage', () => {
    const createdPostIDs: (number | string)[] = []

    beforeAll(async () => {
      await createTestBucket()
      await clearTestBucket()
    })

    afterEach(async () => {
      for (const id of createdPostIDs) {
        try {
          await payload.delete({
            collection: postsWithS3Slug as CollectionSlug,
            id,
          })
        } catch {
          // Ignore cleanup errors
        }
      }
      createdPostIDs.length = 0
      await clearTestBucket()
    })

    it('should import CSV file stored in S3', async () => {
      const csvContent = `title\n"S3 Import Test 1"\n"S3 Import Test 2"\n"S3 Import Test 3"`
      const csvBuffer = Buffer.from(csvContent)

      const importDoc = await payload.create({
        collection: 'posts-with-s3-import' as CollectionSlug,
        user,
        data: {
          collectionSlug: postsWithS3Slug,
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 's3-import-test.csv',
          size: csvBuffer.length,
        },
      })

      expect((importDoc as any).status).toBe('completed')
      expect((importDoc as any).summary?.imported).toBe(3)
      expect((importDoc as any).summary?.issues).toBe(0)

      const posts = await payload.find({
        collection: postsWithS3Slug as CollectionSlug,
        where: {
          title: { contains: 'S3 Import Test' },
        },
      })

      expect(posts.totalDocs).toBe(3)
      posts.docs.forEach((post) => createdPostIDs.push(post.id))
    })

    it('should export to S3 and verify file is accessible', async () => {
      const testPosts = await Promise.all([
        payload.create({
          collection: postsWithS3Slug as CollectionSlug,
          data: { title: 'S3 Export Test 1' },
        }),
        payload.create({
          collection: postsWithS3Slug as CollectionSlug,
          data: { title: 'S3 Export Test 2' },
        }),
      ])

      testPosts.forEach((post) => createdPostIDs.push(post.id))

      const exportDoc = await payload.create({
        collection: 'posts-with-s3-export' as CollectionSlug,
        user,
        data: {
          collectionSlug: postsWithS3Slug,
          format: 'csv',
          where: {
            title: { contains: 'S3 Export Test' },
          },
        },
      })

      expect((exportDoc as any).status).toBe('completed')
      expect((exportDoc as any).filename).toBeDefined()
      expect((exportDoc as any).url).toBeDefined()

      const exportedFileResponse = await restClient.GET(
        `/posts-with-s3-export/file/${(exportDoc as any).filename}`,
      )

      expect(exportedFileResponse.status).toBe(200)

      const exportedCSV = await exportedFileResponse.text()

      expect(exportedCSV).toContain('S3 Export Test 1')
      expect(exportedCSV).toContain('S3 Export Test 2')
    })

    it('should handle import errors gracefully when file is in S3', async () => {
      const csvContent = `wrongfield\n"Some Value"`
      const csvBuffer = Buffer.from(csvContent)

      const importDoc = await payload.create({
        collection: 'posts-with-s3-import' as CollectionSlug,
        user,
        data: {
          collectionSlug: postsWithS3Slug,
          importMode: 'create',
        },
        file: {
          data: csvBuffer,
          mimetype: 'text/csv',
          name: 's3-import-error-test.csv',
          size: csvBuffer.length,
        },
      })

      expect((importDoc as any).status).toBe('failed')
      expect((importDoc as any).summary?.issues).toBeGreaterThan(0)
    })

    it('should import JSON file stored in S3', async () => {
      const jsonContent = JSON.stringify([
        { title: 'S3 JSON Import 1' },
        { title: 'S3 JSON Import 2' },
      ])
      const jsonBuffer = Buffer.from(jsonContent)

      const importDoc = await payload.create({
        collection: 'posts-with-s3-import' as CollectionSlug,
        user,
        data: {
          collectionSlug: postsWithS3Slug,
          importMode: 'create',
        },
        file: {
          data: jsonBuffer,
          mimetype: 'application/json',
          name: 's3-json-import-test.json',
          size: jsonBuffer.length,
        },
      })

      expect((importDoc as any).status).toBe('completed')
      expect((importDoc as any).summary?.imported).toBe(2)

      const posts = await payload.find({
        collection: postsWithS3Slug as CollectionSlug,
        where: {
          title: { contains: 'S3 JSON Import' },
        },
      })

      expect(posts.totalDocs).toBe(2)
      posts.docs.forEach((post) => createdPostIDs.push(post.id))
    })
  })
})
