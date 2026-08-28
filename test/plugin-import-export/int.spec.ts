import type { AuthenticatedUser, CollectionSlug } from 'payload'

import fs from 'fs'
import path from 'path'
import { getFileByPath } from 'payload'
import { extractID } from 'payload/shared'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser, regularUser } from '../credentials.js'
import { clearTestBucket, createTestBucket } from '../storage-s3/test-utils.js'
import testConfig from './config.js'
import { readCSV, readJSON } from './helpers.js'
import { richTextData } from './seed/richTextData.js'
import { customIdPagesSlug, postsWithS3Slug } from './shared.js'

let user: AuthenticatedUser
let restrictedUser: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.suite({ config: testConfig })('@payloadcms/plugin-import-export', () => {
  test.beforeEach(async ({ payload }) => {
    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user!
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

  test.describe('i18n scoping', () => {
    test('should only merge plugin translations for supportedLanguages', ({ payload }) => {
      const supportedLangKeys = Object.keys(payload.config.i18n.supportedLanguages)
      expect(supportedLangKeys.sort()).toEqual(['en', 'es', 'he'])

      // German is not in supportedLanguages — plugin-import-export must not contribute keys to test.
      const deTranslations = payload.config.i18n.translations.de as
        | Record<string, unknown>
        | undefined

      expect(deTranslations?.['plugin-import-export']).toBeUndefined()

      // It should be present for supportedLanguages.
      expect(payload.config.i18n.translations.en).toHaveProperty('plugin-import-export')
      expect(payload.config.i18n.translations.es).toHaveProperty('plugin-import-export')
      expect(payload.config.i18n.translations.he).toHaveProperty('plugin-import-export')
    })
  })

  test.describe('graphql', () => {
    test('should not break graphql', async ({ restClient }) => {
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

  test.describe('exports', () => {
    test('should create a file for collection csv from defined fields', async ({ payload }) => {
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

    test('should create a file for collection csv with all documents when limit 0', async ({
      payload,
    }) => {
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

    test('should create a file for collection csv with all documents when no limit', async ({
      payload,
    }) => {
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

    test('should create a file for collection csv from limit and page 1', async ({ payload }) => {
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

    test('should create a file for collection csv from limit and page 2', async ({ payload }) => {
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

    test('should not create a file for collection csv when limit < 0', async ({ payload }) => {
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

    test('should create a file for collection csv with any positive limit value', async ({
      payload,
    }) => {
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

    test('should export results sorted ASC by title when sort="title"', async ({ payload }) => {
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

    test('should export results sorted DESC by title when sort="-title"', async ({ payload }) => {
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

    test('should create a file for collection csv with draft data', async ({ payload }) => {
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

    test('should create a file for collection csv from one locale', async ({ payload }) => {
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

    test('should create a file for collection csv from multiple locales', async ({ payload }) => {
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

    test('should create a file for collection csv from array', async ({ payload }) => {
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

    test('should create a CSV file with columns matching the order of the fields array', async ({
      payload,
    }) => {
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

    test('should create a CSV file with virtual fields', async ({ payload }) => {
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

    test('should create a file for collection csv from array.subfield', async ({ payload }) => {
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

    test('should create a file for collection csv from hasMany field', async ({ payload }) => {
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

    test('should create a file for collection csv from blocks field', async ({ payload }) => {
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

    test('should create a csv of all fields when fields is empty', async ({ payload }) => {
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

    test('should run beforeExport hook on a field', async ({ payload }) => {
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
      expect(data[0].customRelationship).toBeUndefined()
    })

    test('should create a JSON file for collection', async ({ payload }) => {
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

    test('should download an existing export JSON file', async ({ restClient }) => {
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

      const contentDisposition = response.headers.get('content-disposition')
      expect(contentDisposition).toContain('-pages.json')

      const data = await response.json()

      expect(Array.isArray(data)).toBe(true)
      expect(['string', 'number']).toContain(typeof data[0].id)
      expect(typeof data[0].title).toBe('string')
    })

    test('should create an export with every field when no fields are defined', async ({
      payload,
    }) => {
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

    test('should create jobs task for exports', async ({ payload }) => {
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

    test('should export a large dataset without any duplicates', async ({ payload }) => {
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

    test('should only include selected fields in CSV export, nothing else', async ({ payload }) => {
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

    test('should preserve user-specified field order in CSV export', async ({ payload }) => {
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

    test('should export polymorphic relationship fields to CSV', async ({ payload }) => {
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

    test('should not produce duplicate columns for hasOne polymorphic relationship export', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'exports',
        user,
        data: {
          collectionSlug: 'pages',
          fields: ['id', 'hasOnePolymorphic'],
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
      const buffer = fs.readFileSync(expectedPath)
      const headerLine = buffer.toString().split('\n')[0] ?? ''
      const headers = headerLine.split(',').map((h) => h.replace(/^\ufeff/, '').trim())

      expect(headers).toContain('hasOnePolymorphic_id')
      expect(headers).toContain('hasOnePolymorphic_relationTo')

      const leakedColumns = headers.filter(
        (h) =>
          h.startsWith('hasOnePolymorphic_value') || h.startsWith('hasOnePolymorphic_relationTo_'),
      )
      expect(leakedColumns).toEqual([])
    })

    test('should export hasMany monomorphic relationship fields to CSV', async ({ payload }) => {
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
    test.skip('should create a file from a large set of collection documents', async ({
      payload,
    }) => {
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

    test.describe('schema-based column inference', () => {
      test('should generate columns from schema without scanning documents', async ({
        payload,
      }) => {
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

      test('should include all locale columns when locale is all', async ({ payload }) => {
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

      test('should generate correct columns for empty export', async ({ payload }) => {
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

      test('should include virtual fields in export columns (they have values)', async ({
        payload,
      }) => {
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

    test.describe('beforeExport derived columns positioning', () => {
      test('should position derived columns at the base field position and remove the original column', async ({
        payload,
      }) => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Derived Columns Test',
            customRelationship: user.id,
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

        // The original customRelationship column should NOT exist since beforeExport
        // returned undefined and wrote derived columns instead
        const customRelIdx = columns.indexOf('customRelationship')
        expect(customRelIdx).toBe(-1)

        // Derived columns should occupy the position where customRelationship was
        const titleIdx = columns.indexOf('title')
        const idIdx = columns.indexOf('customRelationship_id')
        const emailIdx = columns.indexOf('customRelationship_email')
        const excerptIdx = columns.indexOf('excerpt')

        expect(idIdx).toBe(titleIdx + 1)
        expect(emailIdx).toBe(titleIdx + 2)
        expect(excerptIdx).toBeGreaterThan(emailIdx)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      test('should remove original column when beforeExport hook writes _name and _email (no _id)', async ({
        payload,
      }) => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'NameEmail Derived Test',
            customRelNameEmail: user.id,
            excerpt: 'test excerpt',
            _status: 'published',
          },
        })

        const fields = ['id', 'title', 'customRelNameEmail', 'excerpt']
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

        // Original column should be removed
        expect(columns.indexOf('customRelNameEmail')).toBe(-1)

        // Derived columns should exist at the correct position
        const titleIdx = columns.indexOf('title')
        const nameIdx = columns.indexOf('customRelNameEmail_name')
        const emailIdx = columns.indexOf('customRelNameEmail_email')
        const excerptIdx = columns.indexOf('excerpt')

        expect(nameIdx).toBe(titleIdx + 1)
        expect(emailIdx).toBe(titleIdx + 2)
        expect(excerptIdx).toBeGreaterThan(emailIdx)

        // Verify the values are correct
        expect(data[0].customRelNameEmail_name).toBe('name value')
        expect(data[0].customRelNameEmail_email).toBe(user.email)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      test('should remove original column when beforeExport hook writes _id and _locationName', async ({
        payload,
      }) => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'IdLocationName Derived Test',
            customRelIdName: user.id,
            excerpt: 'test excerpt',
            _status: 'published',
          },
        })

        const fields = ['id', 'title', 'customRelIdName', 'excerpt']
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

        // Original column should be removed
        expect(columns.indexOf('customRelIdName')).toBe(-1)

        // Derived columns should exist at the correct position
        const titleIdx = columns.indexOf('title')
        const idIdx = columns.indexOf('customRelIdName_id')
        const locationNameIdx = columns.indexOf('customRelIdName_locationName')
        const excerptIdx = columns.indexOf('excerpt')

        expect(idIdx).toBe(titleIdx + 1)
        expect(locationNameIdx).toBe(titleIdx + 2)
        expect(excerptIdx).toBeGreaterThan(locationNameIdx)

        // Verify the values are correct
        expect(data[0].customRelIdName_id).toBe(String(user.id))
        expect(data[0].customRelIdName_locationName).toBe('name value')

        await payload.delete({ collection: 'pages', id: page.id })
      })

      test('should keep derived columns before trailing fields and match preview column order', async ({
        payload,
        restClient,
      }) => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Derived Position With Preview Test',
            customRelationship: user.id,
            excerpt: 'trailing field value',
            _status: 'published',
          },
        })

        const fields = ['id', 'title', 'customRelationship', 'excerpt']

        // Export
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
        const exportColumns = Object.keys(data[0])

        // Derived columns should appear before excerpt, not appended to the end
        const idIdx = exportColumns.indexOf('customRelationship_id')
        const emailIdx = exportColumns.indexOf('customRelationship_email')
        const excerptIdx = exportColumns.indexOf('excerpt')

        expect(idIdx).not.toBe(-1)
        expect(emailIdx).not.toBe(-1)
        expect(excerptIdx).toBeGreaterThan(emailIdx)
        expect(excerptIdx).toBe(exportColumns.length - 1)

        // Preview should produce the same column order
        const previewResponse = await restClient
          .POST('/exports/export-preview', {
            body: JSON.stringify({
              collectionSlug: 'pages',
              fields,
              format: 'csv',
              where: { id: { equals: page.id } },
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .then((res) => res.json())

        expect(previewResponse.columns).toStrictEqual(exportColumns)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      test('should respect custom field order with beforeExport field first and match preview column order', async ({
        payload,
        restClient,
      }) => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: 'Custom Order beforeExport First Test',
            customRelationship: user.id,
            excerpt: 'some excerpt',
            _status: 'published',
          },
        })

        // Put the beforeExport relationship field first
        const fields = ['customRelationship', 'id', 'title', 'excerpt']

        // Export
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
        const exportColumns = Object.keys(data[0])

        // Derived columns should be first since customRelationship was first in selection
        expect(exportColumns[0]).toBe('customRelationship_id')
        expect(exportColumns[1]).toBe('customRelationship_email')
        expect(exportColumns[2]).toBe('id')
        expect(exportColumns[3]).toBe('title')
        expect(exportColumns[4]).toBe('excerpt')

        // Verify data is present
        expect(data[0].customRelationship_id).toBeDefined()
        expect(data[0].customRelationship_email).toBeDefined()

        // Preview should produce the same column order
        const previewResponse = await restClient
          .POST('/exports/export-preview', {
            body: JSON.stringify({
              collectionSlug: 'pages',
              fields,
              format: 'csv',
              where: { id: { equals: page.id } },
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
          .then((res) => res.json())

        expect(previewResponse.columns).toStrictEqual(exportColumns)

        await payload.delete({ collection: 'pages', id: page.id })
      })
    })

    test.describe('date field export', () => {
      test('should export date fields as ISO strings', async ({ payload }) => {
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

      test('should handle null date values', async ({ payload }) => {
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

      test('should not include timezone column when only date field is selected', async ({
        payload,
      }) => {
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

      test('should not create duplicate columns when selecting both date and timezone fields', async ({
        payload,
      }) => {
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

    test.describe('export collection config options', () => {
      test('should apply per-collection overrideCollection to create custom export collection', ({
        payload,
      }) => {
        const customExportCollection = payload.collections['posts-no-jobs-queue-export']
        expect(customExportCollection).toBeDefined()
        expect(customExportCollection.config.admin?.group).toBe('Posts No Jobs Queue')
      })

      test('should apply format and disableSave options to custom export collection', ({
        payload,
      }) => {
        const customExportCollection = payload.collections['posts-no-jobs-queue-export']
        expect(customExportCollection.config.admin?.custom?.format).toBe('csv')
        expect(customExportCollection.config.admin?.custom?.disableSave).toBe(true)
      })

      test('should reject download request with mismatched format when format is forced', async ({
        restClient,
      }) => {
        const response = await restClient.POST('/posts-no-jobs-queue-export/download', {
          body: JSON.stringify({
            data: {
              collectionSlug: 'posts-no-jobs-queue',
              format: 'json',
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        })

        expect(response.status).toBe(400)

        const data = await response.json()

        expect(data.errors[0].message).toContain('not supported')
        expect(data.errors[0].message).toContain('csv')
      })
    })

    test.describe('json and richText fields CSV serialization', () => {
      test('should serialize json and richText fields as JSON strings in single columns', async ({
        payload,
      }) => {
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

      test('should roundtrip json and richText fields through CSV export/import', async ({
        payload,
      }) => {
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

      test('should roundtrip a block containing a nested array with richText through CSV export/import', async ({
        payload,
      }) => {
        const testPage = await payload.create({
          collection: 'pages',
          data: {
            title: 'FAQ Block Roundtrip Test',
            blocks: [
              {
                blockType: 'faqSection',
                faqs: [
                  { question: 'What is Payload?', answer: richTextData },
                  { question: 'Is it open source?', answer: richTextData },
                ],
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
            where: { id: { equals: testPage.id } },
          },
        })

        await payload.jobs.run()

        exportDoc = await payload.findByID({ collection: 'exports', id: exportDoc.id })

        const csvPath = path.join(dirname, './uploads', exportDoc.filename as string)

        await payload.delete({ collection: 'pages', id: testPage.id })

        let importDoc = await payload.create({
          collection: 'imports',
          user,
          data: { collectionSlug: 'pages', importMode: 'create' },
          file: {
            data: fs.readFileSync(csvPath),
            mimetype: 'text/csv',
            name: 'faq-roundtrip.csv',
            size: fs.statSync(csvPath).size,
          },
        })

        await payload.jobs.run()

        importDoc = await payload.findByID({ collection: 'imports', id: importDoc.id })
        expect(importDoc.status).toBe('completed')
        expect(importDoc.summary?.imported).toBe(1)

        const importedPages = await payload.find({
          collection: 'pages',
          where: { title: { equals: 'FAQ Block Roundtrip Test' } },
        })

        expect(importedPages.docs).toHaveLength(1)
        const imported = importedPages.docs[0]

        expect(imported?.blocks).toHaveLength(1)
        const faqBlock = imported?.blocks?.[0]
        expect(faqBlock?.blockType).toBe('faqSection')

        const faqs = (faqBlock as any)?.faqs
        expect(Array.isArray(faqs)).toBe(true)
        expect(faqs).toHaveLength(2)

        expect(faqs[0]?.question).toBe('What is Payload?')
        expect(typeof faqs[0]?.answer).not.toBe('string')
        expect(faqs[0]?.answer?.root?.type).toBe('root')

        expect(faqs[1]?.question).toBe('Is it open source?')
        expect(typeof faqs[1]?.answer).not.toBe('string')

        await payload.delete({
          collection: 'pages',
          where: { title: { equals: 'FAQ Block Roundtrip Test' } },
        })
      })

      test('should handle json fields in deeply nested array structures', async ({ payload }) => {
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

      test('should update json and richText fields in update mode', async ({ payload }) => {
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

      test('should handle json and richText fields in upsert mode', async ({ payload }) => {
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

      test('should import json fields from manually created CSV', async ({ payload }) => {
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

      test('should handle multiple imports updating the same json fields', async ({ payload }) => {
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

    test.describe('Excel compatibility', () => {
      test('should include UTF-8 BOM at the start of CSV files', async ({ payload }) => {
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

      test('should correctly encode UTF-8 characters for Excel', async ({ payload }) => {
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

      test('should handle special CSV characters that could break Excel parsing', async ({
        payload,
      }) => {
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

      test('should preserve Hebrew characters in CSV download via streaming endpoint', async ({
        payload,
        restClient,
      }) => {
        const hebrewTitle = 'Hebrew BOM Test'
        const hebrewLocalized = 'בדיקה עברית'

        const page = await payload.create({
          collection: 'pages',
          data: {
            title: hebrewTitle,
            localized: hebrewLocalized,
            _status: 'published',
          },
          locale: 'he',
        })

        const response = await restClient.POST('/exports/download', {
          body: JSON.stringify({
            data: {
              collectionSlug: 'pages',
              fields: ['id', 'title', 'localized'],
              format: 'csv',
              locale: 'he',
              where: { id: { equals: page.id } },
            },
          }),
          headers: { 'Content-Type': 'application/json' },
        })

        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toMatch(/text\/csv/)
        expect(response.headers.get('content-type')).toContain('charset=utf-8')

        const contentDisposition = response.headers.get('content-disposition')
        expect(contentDisposition).toContain('-pages.csv')

        const buffer = Buffer.from(await response.arrayBuffer())

        // Verify UTF-8 BOM is present
        expect(buffer[0]).toBe(0xef)
        expect(buffer[1]).toBe(0xbb)
        expect(buffer[2]).toBe(0xbf)

        // Verify Hebrew text is correctly encoded in the CSV body
        const content = buffer.toString('utf-8')
        expect(content).toContain(hebrewLocalized)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      test('should preserve Hebrew characters in job-created CSV export', async ({ payload }) => {
        const hebrewTitle = 'Hebrew Jobs Test'
        const hebrewLocalized = 'שלום עולם'

        const page = await payload.create({
          collection: 'pages',
          data: {
            title: hebrewTitle,
            localized: hebrewLocalized,
            _status: 'published',
          },
          locale: 'he',
        })

        let doc = await payload.create({
          collection: 'exports',
          user,
          data: {
            collectionSlug: 'pages',
            fields: ['id', 'title', 'localized'],
            format: 'csv',
            locale: 'he',
            where: { id: { equals: page.id } },
          },
        })

        await payload.jobs.run()

        doc = await payload.findByID({ collection: 'exports', id: doc.id })

        // Verify filename includes collection slug and csv extension
        expect(doc.filename).toContain('-pages')
        expect(doc.filename).toMatch(/\.csv$/)
        expect(doc.mimeType).toContain('charset=utf-8')

        const csvPath = path.join(dirname, './uploads', doc.filename as string)
        const buffer = fs.readFileSync(csvPath)

        // Verify UTF-8 BOM
        expect(buffer[0]).toBe(0xef)
        expect(buffer[1]).toBe(0xbb)
        expect(buffer[2]).toBe(0xbf)

        // Verify Hebrew text is readable
        const content = buffer.toString('utf-8')
        expect(content).toContain(hebrewLocalized)

        // Verify via CSV parse
        const data = await readCSV(csvPath)
        expect(data[0].localized).toBe(hebrewLocalized)

        await payload.delete({ collection: 'pages', id: page.id })
      })

      test('should preserve Hebrew characters in hook-created CSV export (no jobs queue)', async ({
        payload,
      }) => {
        const hebrewTitle = 'Hebrew Hooks Test'
        const hebrewContent = 'טקסט בעברית'

        const post = await payload.create({
          collection: 'posts',
          data: {
            title: hebrewTitle,
            content: richTextData,
            _status: 'published',
          },
        })

        const doc = await payload.create({
          collection: 'posts-export',
          user,
          data: {
            collectionSlug: 'posts',
            fields: ['id', 'title'],
            format: 'csv',
            where: { id: { equals: post.id } },
          },
        })

        const exportDoc = await payload.findByID({
          collection: 'posts-export',
          id: doc.id,
        })

        // Verify filename includes collection slug and csv extension
        expect(exportDoc.filename).toContain('-posts')
        expect(exportDoc.filename).toMatch(/\.csv$/)
        expect(exportDoc.mimeType).toContain('charset=utf-8')

        const csvPath = path.join(dirname, './uploads', exportDoc.filename as string)
        const buffer = fs.readFileSync(csvPath)

        // Verify UTF-8 BOM
        expect(buffer[0]).toBe(0xef)
        expect(buffer[1]).toBe(0xbb)
        expect(buffer[2]).toBe(0xbf)

        // Verify Hebrew title is correctly encoded
        const content = buffer.toString('utf-8')
        expect(content).toContain(hebrewTitle)

        // Verify via CSV parse
        const data = await readCSV(csvPath)
        expect(data[0].title).toBe(hebrewTitle)

        await payload.delete({ collection: 'posts', id: post.id })
      })
    })

    test.describe('fields', () => {
      test('should export checkbox field as true/false strings', async ({ payload }) => {
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

      test('should export select field values', async ({ payload }) => {
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

      test('should export select hasMany field values', async ({ payload }) => {
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

      test('should export radio field values', async ({ payload }) => {
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

      test('should export email field values', async ({ payload }) => {
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

      test('should export textarea field with multiline content', async ({ payload }) => {
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

      test('should export code field values', async ({ payload }) => {
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

      test('should export point field values', async ({ payload }) => {
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

      test('should export hasMany text field values', async ({ payload }) => {
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

      test('should export upload field values as IDs', async ({ payload }) => {
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

    test.describe('custom ID exports', () => {
      const createdCustomIdPages: string[] = []

      test.afterEach(async ({ payload }) => {
        for (const id of createdCustomIdPages) {
          try {
            await payload.delete({
              collection: customIdPagesSlug as CollectionSlug,
              id,
            })
          } catch {
            // Ignore cleanup errors
          }
        }
        createdCustomIdPages.length = 0
      })

      test('should export documents with custom text IDs to CSV', async ({ payload }) => {
        await payload.create({
          collection: customIdPagesSlug as CollectionSlug,
          data: {
            id: 'export-custom-1',
            title: 'Export Custom Page 1',
          },
        })

        await payload.create({
          collection: customIdPagesSlug as CollectionSlug,
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
            collectionSlug: customIdPagesSlug,
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

      test('should export documents with custom text IDs to JSON', async ({ payload }) => {
        await payload.create({
          collection: customIdPagesSlug as CollectionSlug,
          data: {
            id: 'export-json-1',
            title: 'Export JSON Page 1',
          },
        })

        await payload.create({
          collection: customIdPagesSlug as CollectionSlug,
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
            collectionSlug: customIdPagesSlug,
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

  test.describe('imports', () => {
    test.beforeEach(async ({ payload }) => {
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

    test('should import collection documents from CSV with defined fields', async ({ payload }) => {
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

    test('should import collection documents from JSON', async ({ payload }) => {
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

    test('should update existing documents in update mode', async ({ payload }) => {
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

    test('should handle upsert mode correctly', async ({ payload }) => {
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

    test('should import localized fields from CSV with single locale', async ({ payload }) => {
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

    test('should import localized fields from CSV with multiple locales', async ({ payload }) => {
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

    test('should import localized fields correctly regardless of CSV column order', async ({
      payload,
    }) => {
      // CSV columns intentionally put 'de' before 'en' (the defaultLocale)
      // to verify the import uses defaultLocale, not CSV column order
      const csvContent =
        'title,localized_de,localized_en,localized_es\n' +
        '"Locale Order Test 1","German text 1","English text 1","Spanish text 1"\n' +
        '"Locale Order Test 2","German text 2","English text 2","Spanish text 2"'

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
          name: 'locale-order-test.csv',
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

      // Verify English (defaultLocale) has the correct English values, not German
      const importedPagesEn = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Locale Order Test ' },
        },
        locale: 'en',
        sort: 'title',
      })

      expect(importedPagesEn.docs).toHaveLength(2)
      expect(importedPagesEn.docs[0]?.localized).toBe('English text 1')
      expect(importedPagesEn.docs[1]?.localized).toBe('English text 2')

      // Verify German has the correct German values, not missing
      const importedPagesDe = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Locale Order Test ' },
        },
        locale: 'de',
        sort: 'title',
      })

      expect(importedPagesDe.docs).toHaveLength(2)
      expect(importedPagesDe.docs[0]?.localized).toBe('German text 1')
      expect(importedPagesDe.docs[1]?.localized).toBe('German text 2')

      // Verify Spanish has the correct Spanish values
      const importedPagesEs = await payload.find({
        collection: 'pages',
        where: {
          title: { contains: 'Locale Order Test ' },
        },
        locale: 'es',
        sort: 'title',
      })

      expect(importedPagesEs.docs).toHaveLength(2)
      expect(importedPagesEs.docs[0]?.localized).toBe('Spanish text 1')
      expect(importedPagesEs.docs[1]?.localized).toBe('Spanish text 2')

      // Cleanup
      await payload.delete({
        collection: 'pages',
        where: {
          title: { contains: 'Locale Order Test ' },
        },
      })
    })

    test('should import array fields from CSV', async ({ payload }) => {
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

    test('should import blocks fields from CSV', async ({ payload }) => {
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
        expect((heroBlock as { blockType: 'hero'; title?: string })?.title).toBe('Hero Title 1')
      }
      expect(blocks?.[1]?.blockType).toBe('content')
    })

    test('should import hasMany number fields from CSV with various formats', async ({
      payload,
    }) => {
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
        expect(empty?.hasManyNumber).toEqual([])
      } else {
        expect(empty?.hasManyNumber).not.toBeTruthy()
      }

      const withSpaces = importedPages.docs.find((d) => d?.title === 'HasMany With Spaces')
      expect(withSpaces?.hasManyNumber).toEqual([10, 20, 30])

      const mixedEmpty = importedPages.docs.find((d) => d?.title === 'HasMany Mixed Empty')
      expect(mixedEmpty?.hasManyNumber).toEqual([1, 3, 5])
    })

    test('should import relationship fields from CSV', async ({ payload }) => {
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

    test('should handle explicit null vs empty polymorphic relationships in import', async ({
      payload,
    }) => {
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

    test('should import polymorphic relationship fields from CSV', async ({ payload }) => {
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

    test('should skip virtual fields during import', async ({ payload }) => {
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

    test('should correctly handle draft/published status when creating documents', async ({
      payload,
    }) => {
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

    test('should default to creating published documents when no _status specified', async ({
      payload,
    }) => {
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

    test('should handle error scenarios gracefully', async ({ payload }) => {
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

    test('should handle partial import success correctly', async ({ payload }) => {
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

    test('should import nested group fields correctly', async ({ payload }) => {
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

    test('should handle tabs and collapsible fields during import', async ({ payload }) => {
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

    test('should skip disabled fields during import', async ({ payload }) => {
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

    test('should create jobs task for imports', async ({ payload }) => {
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

    test('should successfully roundtrip export and import with beforeExport/beforeImport hooks', async ({
      payload,
    }) => {
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

    test('should handle all field types in export/import roundtrip', async ({ payload }) => {
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

    test.describe('batch processing', () => {
      test('should process large imports in batches', async ({ payload }) => {
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

      test('should handle errors in batch processing and continue', async ({ payload }) => {
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

      test('should report row numbers in errors correctly', async ({ payload }) => {
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

          expect(issues).toHaveLength(1)

          expect(issues[0]?.row).toBe(3)
        }

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Row ' },
          },
        })
      })

      test('should handle batch processing with localized fields', async ({ payload }) => {
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

      test('should respect defaultVersionStatus configuration and create published documents', async ({
        payload,
      }) => {
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
        publishedPages.docs.forEach((doc) => {
          expect(doc._status).toBe('published')
        })

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Default Status Test ' },
          },
        })
      })

      test('should create draft documents when explicit _status:draft is in CSV', async ({
        payload,
      }) => {
        const csvContent =
          'title,excerpt,_status\n"Explicit Draft Test 1","Test excerpt 1","draft"\n"Explicit Draft Test 2","Test excerpt 2","draft"'
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
            name: 'explicit-draft-test.csv',
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

        const draftPages = await payload.find({
          collection: 'pages',
          where: {
            title: { contains: 'Explicit Draft Test ' },
          },
          draft: true,
        })

        expect(draftPages.totalDocs).toBe(2)
        draftPages.docs.forEach((doc) => {
          expect(doc._status).toBe('draft')
        })

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Explicit Draft Test ' },
          },
        })
      })

      test('should create published documents in upsert mode when document does not exist', async ({
        payload,
      }) => {
        const csvContent =
          'title,excerpt\n"Upsert New Published Test 1","Test excerpt 1"\n"Upsert New Published Test 2","Test excerpt 2"'
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
            name: 'upsert-new-published-test.csv',
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
            title: { contains: 'Upsert New Published Test ' },
          },
          draft: false,
        })

        expect(publishedPages.totalDocs).toBe(2)
        publishedPages.docs.forEach((doc) => {
          expect(doc._status).toBe('published')
        })

        await payload.delete({
          collection: 'pages',
          where: {
            title: { contains: 'Upsert New Published Test ' },
          },
        })
      })

      test('should handle manual CSV with localized fields without locale suffix', async ({
        payload,
      }) => {
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

    test.describe('fields', () => {
      test('should import checkbox field from CSV', async ({ payload }) => {
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

      test('should import select field from CSV', async ({ payload }) => {
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

      test('should import radio field from CSV', async ({ payload }) => {
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

      test('should import email field from CSV', async ({ payload }) => {
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

      test('should import textarea field with multiline content from CSV', async ({ payload }) => {
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

      test('should import code field from CSV', async ({ payload }) => {
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

      test('should import point field from CSV', async ({ payload }) => {
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

      test('should import selectHasMany field from CSV with indexed format', async ({
        payload,
      }) => {
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

      test('should import textHasMany field from CSV with indexed format', async ({ payload }) => {
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

      test('should import upload field from CSV with media ID', async ({ payload }) => {
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

    test.describe('custom ID imports', () => {
      const createdCustomIdPages: string[] = []

      test.afterEach(async ({ payload }) => {
        for (const id of createdCustomIdPages) {
          try {
            await payload.delete({
              collection: customIdPagesSlug as CollectionSlug,
              id,
            })
          } catch {
            // Ignore cleanup errors
          }
        }
        createdCustomIdPages.length = 0
      })

      test('should import documents with custom text IDs in create mode', async ({ payload }) => {
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
            collectionSlug: customIdPagesSlug,
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
          collection: customIdPagesSlug as CollectionSlug,
          sort: 'id',
        })

        expect(importedPages.docs).toHaveLength(3)
        expect(importedPages.docs[0]?.id).toBe('custom-page-1')
        expect(importedPages.docs[0]?.title).toBe('Custom ID Page 1')
        expect(importedPages.docs[1]?.id).toBe('custom-page-2')
        expect(importedPages.docs[2]?.id).toBe('custom-page-3')

        createdCustomIdPages.push('custom-page-1', 'custom-page-2', 'custom-page-3')
      })

      test('should import documents with custom text IDs from CSV', async ({ payload }) => {
        const csvContent = `id,title\ncustom-csv-1,CSV Custom Page 1\ncustom-csv-2,CSV Custom Page 2`
        const csvBuffer = Buffer.from(csvContent)

        const importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: customIdPagesSlug,
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
          collection: customIdPagesSlug as CollectionSlug,
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

      test('should preserve custom IDs in upsert mode when creating new documents', async ({
        payload,
      }) => {
        const testData = [
          { id: 'upsert-custom-1', title: 'Upsert Custom Page 1' },
          { id: 'upsert-custom-2', title: 'Upsert Custom Page 2' },
        ]

        const jsonBuffer = Buffer.from(JSON.stringify(testData))

        const importDoc = await payload.create({
          collection: 'imports',
          user,
          data: {
            collectionSlug: customIdPagesSlug,
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
          collection: customIdPagesSlug as CollectionSlug,
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

      test('should update existing documents with custom IDs in upsert mode', async ({
        payload,
      }) => {
        await payload.create({
          collection: customIdPagesSlug,
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
            collectionSlug: customIdPagesSlug,
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
          collection: customIdPagesSlug as CollectionSlug,
          id: 'existing-custom-1',
        })

        expect(updatedPage.title).toBe('Updated Title via Upsert')
      })

      test('should update existing documents with custom IDs in update mode', async ({
        payload,
      }) => {
        await payload.create({
          collection: customIdPagesSlug as CollectionSlug,
          data: {
            id: 'update-mode-custom-1',
            title: 'Original Title for Update Mode',
          },
        })

        createdCustomIdPages.push('update-mode-custom-1')

        const testData = [{ id: 'update-mode-custom-1', title: 'Updated via Update Mode' }]

        const jsonBuffer = Buffer.from(JSON.stringify(testData))

        const importDoc = await payload.create({
          collection: 'imports',
          data: {
            collectionSlug: customIdPagesSlug,
            importMode: 'update',
            matchField: 'id',
          },
          file: {
            name: 'update-mode-custom-id.json',
            data: jsonBuffer,
            mimetype: 'application/json',
            size: jsonBuffer.length,
          },
          user,
        })

        await payload.jobs.run()

        const completedImport = await payload.findByID({
          id: importDoc.id,
          collection: 'imports',
        })

        expect(completedImport.status).toBe('completed')
        expect(completedImport.summary?.updated).toBe(1)

        const updatedPage = await payload.findByID({
          id: 'update-mode-custom-1',
          collection: customIdPagesSlug as CollectionSlug,
        })

        expect(updatedPage.title).toBe('Updated via Update Mode')
      })

      test('should report issue for non-existing documents in update mode with custom IDs', async ({
        payload,
      }) => {
        const testData = [{ id: 'non-existing-custom-id', title: 'This should fail' }]

        const jsonBuffer = Buffer.from(JSON.stringify(testData))

        const importDoc = await payload.create({
          collection: 'imports',
          data: {
            collectionSlug: customIdPagesSlug,
            importMode: 'update',
            matchField: 'id',
          },
          file: {
            name: 'update-mode-fail-custom-id.json',
            data: jsonBuffer,
            mimetype: 'application/json',
            size: jsonBuffer.length,
          },
          user,
        })

        await payload.jobs.run()

        const completedImport = await payload.findByID({
          id: importDoc.id,
          collection: 'imports',
        })

        expect(completedImport.status).toBe('failed')
        expect(completedImport.summary?.updated).toBe(0)
        expect(completedImport.summary?.issues).toBe(1)
      })
    })
  })

  test.describe('collection configuration', () => {
    test('should exclude collections with custom export collections from base exports', ({
      payload,
    }) => {
      const exportsConfig = payload.collections['exports'].config
      const validSlugs =
        exportsConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      expect(validSlugs).not.toContain('posts')
      expect(validSlugs).not.toContain('posts-no-jobs-queue')
      expect(validSlugs).not.toContain('posts-with-limits')
      expect(validSlugs).not.toContain('posts-with-s3')
      expect(validSlugs).toContain('pages')
      expect(validSlugs).toContain('posts-exports-only')
      expect(validSlugs).toContain('media')
      expect(validSlugs).toContain(customIdPagesSlug)
    })

    test('should exclude collections with custom import collections from base imports', ({
      payload,
    }) => {
      const importsConfig = payload.collections['imports'].config
      const validSlugs =
        importsConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      expect(validSlugs).not.toContain('posts')
      expect(validSlugs).not.toContain('posts-with-limits')
      expect(validSlugs).not.toContain('posts-with-s3')
      expect(validSlugs).toContain('pages')
      expect(validSlugs).toContain('posts-imports-only')
      expect(validSlugs).toContain('media')
      expect(validSlugs).toContain(customIdPagesSlug)
    })

    test('custom export collection should only have its target collection slug', ({ payload }) => {
      const postsExportConfig = payload.collections['posts-export'].config
      const validSlugs =
        postsExportConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      expect(validSlugs).toHaveLength(1)
      expect(validSlugs).toEqual(['posts'])
    })

    test('custom import collection should only have its target collection slug', ({ payload }) => {
      const postsImportConfig = payload.collections['posts-import'].config
      const validSlugs =
        postsImportConfig.admin?.custom?.['plugin-import-export']?.collectionSlugs || []

      expect(validSlugs).toHaveLength(1)
      expect(validSlugs).toEqual(['posts'])
    })
  })

  test.describe('posts-exports-only and posts-imports-only collections', () => {
    test.describe('posts-exports-only', () => {
      test('should export from posts-exports-only collection (no jobs queue)', async ({
        payload,
      }) => {
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

      test('should not allow restricted user to export from posts-exports-only (access control)', async ({
        payload,
      }) => {
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

    test.describe('posts-imports-only', () => {
      test('should import to posts-imports-only collection (no jobs queue, synchronous)', async ({
        payload,
      }) => {
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

      test('should not allow restricted user to import to posts-imports-only (access control)', async ({
        payload,
      }) => {
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
          overrideAccess: true,
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

      test('should create draft documents when defaultVersionStatus is draft in plugin config', async ({
        payload,
      }) => {
        const csvContent =
          'title,_status\n"Default Draft Config Test 1",""\n"Default Draft Config Test 2",""\n"Default Draft Config Override Test","published"'
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
            name: 'default-draft-config-test.csv',
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

        const draftDocs = await payload.find({
          collection: 'posts-imports-only',
          where: {
            title: { contains: 'Default Draft Config Test' },
          },
          draft: true,
        })

        expect(draftDocs.totalDocs).toBe(2)
        draftDocs.docs.forEach((doc) => {
          expect(doc._status).toBe('draft')
        })

        const publishedDocs = await payload.find({
          collection: 'posts-imports-only',
          where: {
            title: { equals: 'Default Draft Config Override Test' },
          },
          draft: false,
        })

        expect(publishedDocs.totalDocs).toBe(1)
        expect(publishedDocs.docs[0]?._status).toBe('published')

        await payload.delete({
          collection: 'posts-imports-only',
          where: {
            or: [
              { title: { contains: 'Default Draft Config Test' } },
              { title: { equals: 'Default Draft Config Override Test' } },
            ],
          },
        })
      })
    })
  })

  test.describe('access control with jobs queue', () => {
    test('should respect access control when export uses jobs queue', async ({ payload }) => {
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

    test('should respect access control when import uses jobs queue', async ({ payload }) => {
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

  test.describe('preview endpoints', () => {
    test('should return export preview data for CSV format', async ({ payload, restClient }) => {
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

    test('should return export preview data for JSON format', async ({ payload, restClient }) => {
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

    test('should return import preview data for CSV', async ({ restClient }) => {
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

    test('should return import preview data for JSON', async ({ restClient }) => {
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

    test('should handle invalid collection slug in export preview', async ({ restClient }) => {
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

    test('rejects an invalid preview field path and keeps collection access unchanged', async ({
      payload,
      restClient,
    }) => {
      const post = await payload.create({
        collection: 'posts-imports-only',
        data: {
          title: 'Preview field validation',
        },
      })
      const objectPrototypeBefore = Object.getOwnPropertyDescriptors(Object.prototype)

      try {
        const previewResponse = await restClient.POST('/exports/export-preview', {
          auth: false,
          body: JSON.stringify({
            collectionSlug: 'posts-imports-only',
            fields: ['__proto__.overrideAccess'],
            format: 'json',
          }),
        })
        const objectPrototypeAfterPreview = Object.getOwnPropertyDescriptors(Object.prototype)

        const updateResponse = await restClient.PATCH(`/posts-imports-only/${post.id}`, {
          auth: false,
          body: JSON.stringify({ title: 'Updated preview field validation' }),
        })
        const unchangedPost = await payload.findByID({
          collection: 'posts-imports-only',
          id: post.id,
        })

        expect(previewResponse.status).toBe(400)
        expect(objectPrototypeAfterPreview).toEqual(objectPrototypeBefore)
        expect(updateResponse.status).toBe(403)
        expect(unchangedPost.title).toBe('Preview field validation')
      } finally {
        delete (Object.prototype as Record<string, unknown>).overrideAccess
        await payload.delete({
          collection: 'posts-imports-only',
          id: post.id,
        })
      }
    })

    test('should apply beforeExport hook customizations in export preview and remove replaced columns', async ({
      payload,
      restClient,
    }) => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Preview beforeExport Test',
          customRelationship: user.id,
          customRelNameEmail: user.id,
          customRelIdName: user.id,
          excerpt: 'preview excerpt',
          _status: 'published',
        },
      })

      const response = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            fields: [
              'id',
              'title',
              'customRelationship',
              'customRelNameEmail',
              'customRelIdName',
              'excerpt',
            ],
            format: 'csv',
            where: { id: { equals: page.id } },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toHaveLength(1)
      const doc = response.docs[0]

      // Verify the columns array has derived columns and not originals
      const responseColumns: string[] = response.columns
      expect(responseColumns).toContain('customRelationship_id')
      expect(responseColumns).toContain('customRelationship_email')
      expect(responseColumns).not.toContain('customRelationship')
      expect(responseColumns).toContain('customRelNameEmail_name')
      expect(responseColumns).toContain('customRelNameEmail_email')
      expect(responseColumns).not.toContain('customRelNameEmail')
      expect(responseColumns).toContain('customRelIdName_id')
      expect(responseColumns).toContain('customRelIdName_locationName')
      expect(responseColumns).not.toContain('customRelIdName')

      // Verify derived column values in the doc data
      expect(doc.customRelationship_id).toBeDefined()
      expect(doc.customRelationship_email).toBeDefined()

      expect(doc.customRelNameEmail_name).toBe('name value')
      expect(doc.customRelNameEmail_email).toBe(user.email)

      expect(doc.customRelIdName_id).toBe(user.id)
      expect(doc.customRelIdName_locationName).toBe('name value')

      // excerpt should still be present
      expect(doc.excerpt).toBe('preview excerpt')

      await payload.delete({ collection: 'pages', id: page.id })
    })

    test('should remove replaced columns from preview when no fields are selected', async ({
      payload,
      restClient,
    }) => {
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: 'Preview No Fields beforeExport Test',
          customRelationship: user.id,
          customRelNameEmail: user.id,
          customRelIdName: user.id,
          _status: 'published',
        },
      })

      const response = await restClient
        .POST('/exports/export-preview', {
          body: JSON.stringify({
            collectionSlug: 'pages',
            format: 'csv',
            where: { id: { equals: page.id } },
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((res) => res.json())

      expect(response.docs).toHaveLength(1)

      // Original columns replaced by beforeExport hook should not appear in columns or doc data
      const responseColumns: string[] = response.columns
      const doc = response.docs[0]

      // customRelationship → replaced by _id and _email
      expect(responseColumns).toContain('customRelationship_id')
      expect(responseColumns).toContain('customRelationship_email')
      expect(responseColumns).not.toContain('customRelationship')
      expect(doc).not.toHaveProperty('customRelationship')

      // customRelNameEmail → replaced by _name and _email
      expect(responseColumns).toContain('customRelNameEmail_name')
      expect(responseColumns).toContain('customRelNameEmail_email')
      expect(responseColumns).not.toContain('customRelNameEmail')
      expect(doc).not.toHaveProperty('customRelNameEmail')

      // customRelIdName → replaced by _id and _locationName
      expect(responseColumns).toContain('customRelIdName_id')
      expect(responseColumns).toContain('customRelIdName_locationName')
      expect(responseColumns).not.toContain('customRelIdName')
      expect(doc).not.toHaveProperty('customRelIdName')

      await payload.delete({ collection: 'pages', id: page.id })
    })

    test('should handle invalid collection slug in import preview', async ({ restClient }) => {
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

    test('should handle missing file data in import preview', async ({ restClient }) => {
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

    test('should paginate import preview data for CSV', async ({ restClient }) => {
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

    test('should paginate import preview data for JSON', async ({ restClient }) => {
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

    test('should default to previewLimit 10 and previewPage 1 for import preview', async ({
      restClient,
    }) => {
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

    test('should respect preview limit (max 10)', async ({ payload, restClient }) => {
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

    test('should respect export limit when paginating preview (limit 11, per page 10)', async ({
      payload,
      restClient,
    }) => {
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

    test('should return empty docs when preview page exceeds export limit boundary', async ({
      payload,
      restClient,
    }) => {
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

    test('should have matching column order between preview and export when no fields selected', async ({
      payload,
      restClient,
    }) => {
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

    test('should have matching column order between preview and export with selected fields', async ({
      payload,
      restClient,
    }) => {
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

  test.describe('rich text field handling', () => {
    test('should preserve Lexical numeric properties on JSON export/import', async ({
      payload,
    }) => {
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

    test('should export rich text inside blocks to CSV and import back', async ({ payload }) => {
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

  test.describe('error recovery', () => {
    test('should continue processing after individual document errors', async ({ payload }) => {
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

    test('should report accurate error counts on partial failure', async ({ payload }) => {
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

    test('should handle malformed CSV gracefully', async ({ payload }) => {
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

  test.describe('custom field functions edge cases', () => {
    test('should handle beforeExport hook that returns undefined', async ({ payload }) => {
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

    test('should apply beforeImport hook to reconstruct relationships', async ({ payload }) => {
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

  test.describe('disabled fields in complex structures', () => {
    test('should exclude disabled fields from export', async ({ payload }) => {
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

  test.describe('JSON-specific tests', () => {
    test('should import deeply nested JSON objects', async ({ payload }) => {
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

    test('should handle JSON export and import roundtrip with all field types', async ({
      payload,
    }) => {
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

  test.describe('limit and pagination edge cases', () => {
    test('should handle page exceeding total pages', async ({ payload }) => {
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

    test('should handle very large limit values', async ({ payload }) => {
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

    test('should export correctly with limit=1', async ({ payload }) => {
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

  test.describe('streaming export edge cases', () => {
    test('should stream large exports without memory issues', async ({ payload }) => {
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

    test('should handle empty result set in streaming export', async ({ payload }) => {
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

  test.describe('concurrent operations', () => {
    test('should handle multiple simultaneous imports', async ({ payload }) => {
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

    test('should handle export during active import', async ({ payload }) => {
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

  test.describe('max limit enforcement', () => {
    const createdPostIds: (number | string)[] = []

    test.beforeEach(async ({ payload }) => {
      // Create 10 test documents (more than the limit of 5)
      for (let i = 0; i < 10; i++) {
        const doc = await payload.create({
          collection: 'posts-with-limits',
          data: { title: `Limit Test Post ${i}` },
        })
        createdPostIds.push(doc.id)
      }
    })

    test.afterAll(async ({ payloadInstance }) => {
      // Clean up all test documents
      if (createdPostIds.length > 0) {
        for (const id of createdPostIds) {
          try {
            await payloadInstance.delete({
              collection: 'posts-with-limits',
              id,
            })
          } catch {
            // Document may have already been deleted
          }
        }
        createdPostIds.length = 0
      }
    })

    test.describe('export max limit', () => {
      test('should limit export to maxLimit when no user limit specified', async ({ payload }) => {
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

      test('should clamp user limit to maxLimit when user limit exceeds maxLimit', async ({
        payload,
      }) => {
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

      test('should use user limit when it is below maxLimit', async ({ payload }) => {
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

      test('should include maxLimit in export preview response', async ({ restClient }) => {
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

      test('should have preview match exactly what is exported', async ({
        payload,
        restClient,
      }) => {
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

      test('should have preview pagination respect maxLimit', async ({ restClient }) => {
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

    test.describe('import max limit', () => {
      test('should reject import when document count exceeds maxLimit', async ({ payload }) => {
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

      test('should allow import when document count equals maxLimit', async ({ payload }) => {
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

      test('should allow import when document count is below maxLimit', async ({ payload }) => {
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

      test('should include maxLimit and limitExceeded in import preview response', async ({
        restClient,
      }) => {
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

      test('should have import preview accurately predict import outcome', async ({
        payload,
        restClient,
      }) => {
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
    test.describe('dynamic user-based export limits', () => {
      const createdPostIds: (number | string)[] = []
      let userWithDynamicLimit: any

      test.beforeEach(async ({ payload }) => {
        // Find the dev user and set their limit to 7
        const devUserDocs = await payload.find({
          collection: 'users',
          where: { email: { equals: devUser.email } },
        })

        const devUserId = devUserDocs.docs[0]?.id

        const updatedUserDoc = await payload.update({
          id: devUserId,
          collection: 'users',
          data: { limit: 7 },
        })

        // Use the user document directly (not login result) so req.user.limit is accessible
        userWithDynamicLimit = { ...updatedUserDoc, collection: 'users' }

        // Create 10 test documents (more than both the dynamic export limit of 7 and static import limit of 5)
        for (let i = 0; i < 10; i++) {
          const doc = await payload.create({
            collection: 'posts-with-limits',
            data: { title: `Dynamic Limit Post ${i}` },
          })

          createdPostIds.push(doc.id)
        }
      })

      test.afterAll(async ({ payloadInstance }) => {
        // Reset the dev user's limit
        const devUserDocs = await payloadInstance.find({
          collection: 'users',
          where: { email: { equals: devUser.email } },
        })

        const devUserId = devUserDocs.docs[0]?.id

        await payloadInstance.update({
          id: devUserId,
          collection: 'users',
          data: { limit: null as unknown as number },
        })

        // Restore the original user login state
        const loginResult = await payloadInstance.login({
          collection: 'users',
          data: {
            email: devUser.email,
            password: devUser.password,
          },
        })

        user = loginResult.user!

        // Clean up test documents
        for (const id of createdPostIds) {
          try {
            await payloadInstance.delete({
              id,
              collection: 'posts-with-limits',
            })
          } catch {
            // Document may have already been deleted
          }
        }
        createdPostIds.length = 0
      })

      test.describe('export with dynamic user limit of 7', () => {
        test('should export up to 7 documents when user limit is set to 7', async ({ payload }) => {
          const exportDoc = await payload.create({
            collection: 'posts-with-limits-export',
            data: {
              collectionSlug: 'posts-with-limits',
              format: 'csv',
            },
            user: userWithDynamicLimit,
          })

          expect(exportDoc.filename).toBeDefined()

          const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
          const data = await readCSV(exportPath)

          expect(data).toHaveLength(7)
        })

        test('should clamp request limit to dynamic maxLimit of 7', async ({ payload }) => {
          const exportDoc = await payload.create({
            collection: 'posts-with-limits-export',
            data: {
              collectionSlug: 'posts-with-limits',
              format: 'csv',
              limit: 100,
            },
            user: userWithDynamicLimit,
          })

          expect(exportDoc.filename).toBeDefined()

          const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
          const data = await readCSV(exportPath)

          expect(data).toHaveLength(7)
        })

        test('should allow export with limit below dynamic maxLimit of 7', async ({ payload }) => {
          const exportDoc = await payload.create({
            collection: 'posts-with-limits-export',
            data: {
              collectionSlug: 'posts-with-limits',
              format: 'csv',
              limit: 4,
            },
            user: userWithDynamicLimit,
          })

          expect(exportDoc.filename).toBeDefined()

          const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
          const data = await readCSV(exportPath)

          expect(data).toHaveLength(4)
        })

        test('should reflect dynamic maxLimit of 7 in export preview', async ({ restClient }) => {
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

          expect(result.maxLimit).toBe(7)
          expect(result.totalDocs).toBe(7)
        })

        test('should have preview match exactly what is exported with dynamic limit', async ({
          payload,
          restClient,
        }) => {
          const previewResponse = await restClient.POST(
            `/posts-with-limits-export/export-preview`,
            {
              body: JSON.stringify({
                collectionSlug: 'posts-with-limits',
                format: 'csv',
                previewLimit: 10,
              }),
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )

          const preview = await previewResponse.json()

          expect(preview.maxLimit).toBe(7)
          expect(preview.exportTotalDocs).toBe(7)

          const exportDoc = await payload.create({
            collection: 'posts-with-limits-export',
            data: {
              collectionSlug: 'posts-with-limits',
              format: 'csv',
            },
            user: userWithDynamicLimit,
          })

          expect(exportDoc.filename).toBeDefined()

          const exportPath = path.join(dirname, './uploads', exportDoc.filename as string)
          const exportedData = await readCSV(exportPath)

          expect(exportedData).toHaveLength(preview.exportTotalDocs)
          expect(exportedData).toHaveLength(7)
        })

        test('should have preview pagination respect dynamic maxLimit of 7', async ({
          restClient,
        }) => {
          const page1Response = await restClient.POST(`/posts-with-limits-export/export-preview`, {
            body: JSON.stringify({
              collectionSlug: 'posts-with-limits',
              format: 'csv',
              previewLimit: 4,
              previewPage: 1,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })

          const page1 = await page1Response.json()

          expect(page1.docs).toHaveLength(4)
          expect(page1.totalDocs).toBe(7)
          expect(page1.totalPages).toBe(2)
          expect(page1.hasNextPage).toBe(true)
          expect(page1.hasPrevPage).toBe(false)

          const page2Response = await restClient.POST(`/posts-with-limits-export/export-preview`, {
            body: JSON.stringify({
              collectionSlug: 'posts-with-limits',
              format: 'csv',
              previewLimit: 4,
              previewPage: 2,
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })

          const page2 = await page2Response.json()

          expect(page2.docs).toHaveLength(3)
          expect(page2.totalDocs).toBe(7)
          expect(page2.totalPages).toBe(2)
          expect(page2.hasNextPage).toBe(false)
          expect(page2.hasPrevPage).toBe(true)
          expect(page1.docs.length + page2.docs.length).toBe(7)
        })
      })

      test.describe('import limit remains static despite user limit change', () => {
        test('should reject import with 7 documents when static import limit is 5', async ({
          payload,
        }) => {
          const csvContent = Array.from(
            { length: 7 },
            (_, i) => `"Dynamic Import Exceed ${i}"`,
          ).join('\n')
          const csv = `title\n${csvContent}`
          const csvBuffer = Buffer.from(csv)

          const importDoc = await payload.create({
            collection: 'posts-with-limits-import',
            data: {
              collectionSlug: 'posts-with-limits',
              importMode: 'create',
            },
            file: {
              name: 'dynamic-exceed-import.csv',
              data: csvBuffer,
              mimetype: 'text/csv',
              size: csvBuffer.length,
            },
            user: userWithDynamicLimit,
          })

          expect(importDoc.status).toBe('failed')
          expect(importDoc.summary?.imported).toBe(0)

          await payload.delete({
            collection: 'posts-with-limits',
            where: {
              title: { contains: 'Dynamic Import Exceed' },
            },
          })
        })

        test('should allow import within static limit of 5 even with user limit of 7', async ({
          payload,
        }) => {
          const csvContent = Array.from(
            { length: 5 },
            (_, i) => `"Dynamic Import Within ${i}"`,
          ).join('\n')
          const csv = `title\n${csvContent}`
          const csvBuffer = Buffer.from(csv)

          const importDoc = await payload.create({
            collection: 'posts-with-limits-import',
            data: {
              collectionSlug: 'posts-with-limits',
              importMode: 'create',
            },
            file: {
              name: 'dynamic-within-import.csv',
              data: csvBuffer,
              mimetype: 'text/csv',
              size: csvBuffer.length,
            },
            user: userWithDynamicLimit,
          })

          expect(importDoc.status).toBe('completed')
          expect(importDoc.summary?.imported).toBe(5)

          await payload.delete({
            collection: 'posts-with-limits',
            where: {
              title: { contains: 'Dynamic Import Within' },
            },
          })
        })

        test('should show static maxLimit of 5 in import preview despite user limit of 7', async ({
          restClient,
        }) => {
          const csvContent = Array.from(
            { length: 10 },
            (_, i) => `"Dynamic Preview Import ${i}"`,
          ).join('\n')
          const csv = `title\n${csvContent}`
          const csvBuffer = Buffer.from(csv)

          const response = await restClient.POST(`/posts-with-limits-import/preview-data`, {
            body: JSON.stringify({
              collectionSlug: 'posts-with-limits',
              fileData: csvBuffer.toString('base64'),
              format: 'csv',
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
      })
    })
  })

  // S3 storage integration tests are skipped here because they require an HTTP server.
  // The int test environment uses in-process route handlers, but getFileFromDoc uses
  // fetch() which requires a real HTTP server. See e2e.spec.ts for S3 tests that run
  // with a real server.
  test.describe.skip('S3 storage', () => {
    const createdPostIDs: (number | string)[] = []

    test.beforeAll(async () => {
      await createTestBucket()
      await clearTestBucket()
    })

    test.afterEach(async ({ payload }) => {
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

    test('should import CSV file stored in S3', async ({ payload }) => {
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

    test('should export to S3 and verify file is accessible', async ({ payload, restClient }) => {
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

    test('should handle import errors gracefully when file is in S3', async ({ payload }) => {
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

    test('should import JSON file stored in S3', async ({ payload }) => {
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
