/* eslint-disable vitest/no-conditional-expect */
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { Table } from 'drizzle-orm'
import type {
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  TypedUser,
  TypeWithID,
  ValidationError,
} from 'payload'

import {
  migrateRelationshipsV2_V3,
  migrateVersionsV1_V2,
} from '@payloadcms/db-mongodb/migration-utils'
import { randomUUID } from 'crypto'
import * as drizzlePg from 'drizzle-orm/pg-core'
import * as drizzleSqlite from 'drizzle-orm/sqlite-core'
import fs from 'fs'
import mongoose, { Types } from 'mongoose'
import path from 'path'
import {
  commitTransaction,
  initTransaction,
  isolateObjectProperty,
  killTransaction,
  QueryError,
} from 'payload'
import { assert } from 'ts-essentials'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, beforeEach, expect, vitest } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Global2, Post } from './payload-types.js'

import { sanitizeQueryValue } from '../../packages/db-mongodb/src/queries/sanitizeQueryValue.js'
import { describe, hasTransactions, it } from '../__helpers/int/vitest.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { removeFiles } from '../__helpers/shared/removeFiles.js'
import { devUser } from '../credentials.js'
import { seed } from './seed.js'
import {
  defaultValuesSlug,
  errorOnUnnamedFieldsSlug,
  fieldsPersistanceSlug,
  postsSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let user: TypedUser
let token: string
let restClient: NextRESTClient
const collection = postsSlug
const title = 'title'
process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

describe('database', () => {
  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, restClient } = await initPayloadInt(dirname))
    payload.db.migrationDir = path.join(dirname, './migrations')

    await seed(payload)

    await restClient.login({
      slug: 'users',
      credentials: devUser,
    })

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user!
    token = loginResult.token!
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('id type', () => {
    it('should sanitize incoming IDs if ID type is number', async () => {
      const created = await restClient
        .POST(`/posts`, {
          body: JSON.stringify({
            title: 'post to test that ID comes in as proper type',
          }),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => res.json())

      const { doc: updated } = await restClient
        .PATCH(`/posts/${created.doc.id}`, {
          body: JSON.stringify({
            title: 'hello',
          }),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => res.json())

      expect(updated.id).toStrictEqual(created.doc.id)
    })

    it('should create with generated ID text from hook', async () => {
      const doc = await payload.create({
        collection: 'custom-ids',
        data: {},
      })

      expect(doc.id).toBeDefined()
    })

    it('should not create duplicate versions with custom id type', async () => {
      const doc = await payload.create({
        collection: 'custom-ids',
        data: {
          title: 'hey',
        },
      })

      await payload.update({
        id: doc.id,
        collection: 'custom-ids',
        data: {},
      })

      await payload.update({
        id: doc.id,
        collection: 'custom-ids',
        data: {},
      })

      const versionsQuery = await payload.db.findVersions({
        collection: 'custom-ids',
        req: {} as PayloadRequest,
        where: {
          latest: {
            equals: true,
          },
          'version.title': {
            equals: 'hey',
          },
        },
      })

      expect(versionsQuery.totalDocs).toStrictEqual(1)
    })

    it('should not accidentally treat nested id fields as custom id', () => {
      expect(payload.collections['fake-custom-ids'].customIDType).toBeUndefined()
    })

    it('should not overwrite supplied block and array row IDs on create', async () => {
      const arrayRowID = '67648ed5c72f13be6eacf24e'
      const blockID = '6764de9af79a863575c5f58c'

      const doc = await payload.create({
        collection: postsSlug,
        data: {
          arrayWithIDs: [
            {
              id: arrayRowID,
            },
          ],
          blocksWithIDs: [
            {
              id: blockID,
              blockType: 'block-first',
            },
          ],
          title: 'test',
        },
      })

      expect(doc.arrayWithIDs[0].id).toStrictEqual(arrayRowID)
      expect(doc.blocksWithIDs[0].id).toStrictEqual(blockID)
    })

    it('should overwrite supplied block and array row IDs on duplicate', async () => {
      const arrayRowID = '6764deb5201e9e36aeba3b6c'
      const blockID = '6764dec58c68f337a758180c'

      const doc = await payload.create({
        collection: postsSlug,
        data: {
          arrayWithIDs: [
            {
              id: arrayRowID,
            },
          ],
          blocksWithIDs: [
            {
              id: blockID,
              blockType: 'block-first',
            },
          ],
          title: 'test',
        },
      })

      const duplicate = await payload.duplicate({
        id: doc.id,
        collection: postsSlug,
      })

      expect(duplicate.arrayWithIDs[0].id).not.toStrictEqual(arrayRowID)
      expect(duplicate.blocksWithIDs[0].id).not.toStrictEqual(blockID)
    })

    it('should properly give the result with hasMany relationships with custom numeric IDs', async () => {
      await payload.create({ collection: 'categories-custom-id', data: { id: 9999 } })
      const res = await payload.create({
        collection: 'posts',
        data: { categoriesCustomID: [9999], title: 'post' },
        depth: 0,
      })
      expect(res.categoriesCustomID[0]).toBe(9999)
      const resFind = await payload.findByID({ id: res.id, collection: 'posts', depth: 0 })
      expect(resFind.categoriesCustomID[0]).toBe(9999)
    })
  })

  describe('timestamps', () => {
    it('should have createdAt and updatedAt timestamps to the millisecond', async () => {
      const result = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
        },
      })

      const createdAtDate = new Date(result.createdAt)

      expect(createdAtDate.getMilliseconds()).toBeDefined()

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })

    it('should allow createdAt to be set in create', async () => {
      const createdAt = new Date('2021-01-01T00:00:00.000Z').toISOString()
      const result = await payload.create({
        collection: postsSlug,
        data: {
          createdAt,
          title: 'hello',
        },
      })

      const doc = await payload.findByID({
        id: result.id,
        collection: postsSlug,
      })

      expect(result.createdAt).toStrictEqual(createdAt)
      expect(doc.createdAt).toStrictEqual(createdAt)

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })

    it('should allow updatedAt to be set in create', async () => {
      const updatedAt = new Date('2022-01-01T00:00:00.000Z').toISOString()
      const result = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
          updatedAt,
        },
      })

      expect(result.updatedAt).toStrictEqual(updatedAt)

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })
    it('should allow createdAt to be set in update', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
        },
      })
      const createdAt = new Date('2021-01-01T00:00:00.000Z').toISOString()

      const result: any = await payload.db.updateOne({
        id: post.id,
        collection: postsSlug,
        data: {
          createdAt,
        },
      })

      const doc = await payload.findByID({
        id: result.id,
        collection: postsSlug,
      })

      expect(doc.createdAt).toStrictEqual(createdAt)

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })

    it('should allow updatedAt to be set in update', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
        },
      })
      const updatedAt = new Date('2021-01-01T00:00:00.000Z').toISOString()

      const result: any = await payload.db.updateOne({
        id: post.id,
        collection: postsSlug,
        data: {
          updatedAt,
        },
      })

      const doc = await payload.findByID({
        id: result.id,
        collection: postsSlug,
      })

      expect(doc.updatedAt).toStrictEqual(updatedAt)

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })

    it('ensure updatedAt is automatically set when using db.updateOne', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
        },
      })

      const result: any = await payload.db.updateOne({
        id: post.id,
        collection: postsSlug,
        data: {
          title: 'hello2',
        },
      })

      expect(result.updatedAt).not.toStrictEqual(post.updatedAt)

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })

    it('ensure updatedAt is not automatically set when using db.updateOne if it is explicitly set to `null`', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
        },
      })

      const result: any = await payload.db.updateOne({
        id: post.id,
        collection: postsSlug,
        data: {
          title: 'hello2',
          updatedAt: null,
        },
      })

      expect(result.updatedAt).toStrictEqual(post.updatedAt)

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {},
      })
    })

    it('should allow createdAt to be set in updateVersion', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: {
          title: 'hello',
        },
      })
      await payload.update({
        id: category.id,
        collection: 'categories',
        data: {
          title: 'hello2',
        },
      })
      const versions = await payload.findVersions({
        collection: 'categories',
        depth: 0,
        sort: '-createdAt',
      })
      const createdAt = new Date('2021-01-01T00:00:00.000Z').toISOString()

      for (const version of versions.docs) {
        await payload.db.updateVersion({
          id: version.id,
          collection: 'categories',
          versionData: {
            ...version.version,
            createdAt,
          },
        })
      }

      const updatedVersions = await payload.findVersions({
        collection: 'categories',
        depth: 0,
        sort: '-createdAt',
      })
      expect(updatedVersions.docs).toHaveLength(2)
      for (const version of updatedVersions.docs) {
        expect(version.createdAt).toStrictEqual(createdAt)
      }

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: 'categories',
        where: {},
      })
      await payload.db.deleteVersions({
        collection: 'categories',
        where: {},
      })
    })

    it('should allow updatedAt to be set in updateVersion', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: {
          title: 'hello',
        },
      })
      await payload.update({
        id: category.id,
        collection: 'categories',
        data: {
          title: 'hello2',
        },
      })
      const versions = await payload.findVersions({
        collection: 'categories',
        depth: 0,
        sort: '-createdAt',
      })
      const updatedAt = new Date('2021-01-01T00:00:00.000Z').toISOString()

      for (const version of versions.docs) {
        await payload.db.updateVersion({
          id: version.id,
          collection: 'categories',
          versionData: {
            ...version.version,
            updatedAt,
          },
        })
      }

      const updatedVersions = await payload.findVersions({
        collection: 'categories',
        depth: 0,
        sort: '-updatedAt',
      })
      expect(updatedVersions.docs).toHaveLength(2)
      for (const version of updatedVersions.docs) {
        expect(version.updatedAt).toStrictEqual(updatedAt)
      }

      // Cleanup, as this test suite does not use clearAndSeedEverything
      await payload.db.deleteMany({
        collection: 'categories',
        where: {},
      })
      await payload.db.deleteVersions({
        collection: 'categories',
        where: {},
      })
    })

    async function noTimestampsTestLocalAPI() {
      const createdDoc: any = await payload.create({
        collection: 'noTimeStamps',
        data: {
          title: 'hello',
        },
      })
      expect(createdDoc.createdAt).toBeUndefined()
      expect(createdDoc.updatedAt).toBeUndefined()

      const updated: any = await payload.update({
        id: createdDoc.id,
        collection: 'noTimeStamps',
        data: {
          title: 'updated',
        },
      })
      expect(updated.createdAt).toBeUndefined()
      expect(updated.updatedAt).toBeUndefined()

      const date = new Date('2021-01-01T00:00:00.000Z').toISOString()
      const createdDocWithTimestamps: any = await payload.create({
        collection: 'noTimeStamps',
        data: {
          createdAt: date,
          title: 'hello',
          updatedAt: date,
        },
      })
      expect(createdDocWithTimestamps.createdAt).toBeUndefined()
      expect(createdDocWithTimestamps.updatedAt).toBeUndefined()

      const updatedDocWithTimestamps: any = await payload.update({
        id: createdDocWithTimestamps.id,
        collection: 'noTimeStamps',
        data: {
          createdAt: date,
          title: 'updated',
          updatedAt: date,
        },
      })
      expect(updatedDocWithTimestamps.createdAt).toBeUndefined()
      expect(updatedDocWithTimestamps.updatedAt).toBeUndefined()
    }

    async function noTimestampsTestDB(aa) {
      const createdDoc: any = await payload.db.create({
        collection: 'noTimeStamps',
        data: {
          title: 'hello',
        },
      })
      expect(createdDoc.createdAt).toBeUndefined()
      expect(createdDoc.updatedAt).toBeUndefined()

      const updated: any = await payload.db.updateOne({
        id: createdDoc.id,
        collection: 'noTimeStamps',
        data: {
          title: 'updated',
        },
      })
      expect(updated.createdAt).toBeUndefined()
      expect(updated.updatedAt).toBeUndefined()

      const date = new Date('2021-01-01T00:00:00.000Z').toISOString()
      const createdDocWithTimestamps: any = await payload.db.create({
        collection: 'noTimeStamps',
        data: {
          createdAt: date,
          title: 'hello',
          updatedAt: date,
        },
      })
      expect(createdDocWithTimestamps.createdAt).toBeUndefined()
      expect(createdDocWithTimestamps.updatedAt).toBeUndefined()

      const updatedDocWithTimestamps: any = await payload.db.updateOne({
        id: createdDocWithTimestamps.id,
        collection: 'noTimeStamps',
        data: {
          createdAt: date,
          title: 'updated',
          updatedAt: date,
        },
      })
      expect(updatedDocWithTimestamps.createdAt).toBeUndefined()
      expect(updatedDocWithTimestamps.updatedAt).toBeUndefined()
    }

    // eslint-disable-next-line vitest/expect-expect
    it('ensure timestamps are not created in update or create when timestamps are disabled', async () => {
      await noTimestampsTestLocalAPI()
    })

    // eslint-disable-next-line vitest/expect-expect
    it('ensure timestamps are not created in db adapter update or create when timestamps are disabled', async () => {
      await noTimestampsTestDB(true)
    })

    // eslint-disable-next-line vitest/expect-expect
    it(
      'ensure timestamps are not created in update or create when timestamps are disabled even with allowAdditionalKeys true',
      { db: 'mongo' },
      async () => {
        const originalAllowAdditionalKeys = payload.db.allowAdditionalKeys
        payload.db.allowAdditionalKeys = true
        await noTimestampsTestLocalAPI()
        payload.db.allowAdditionalKeys = originalAllowAdditionalKeys
      },
    )

    // eslint-disable-next-line vitest/expect-expect
    it(
      'ensure timestamps are not created in db adapter update or create when timestamps are disabled even with allowAdditionalKeys true',
      { db: 'mongo' },
      async () => {
        const originalAllowAdditionalKeys = payload.db.allowAdditionalKeys
        payload.db.allowAdditionalKeys = true
        await noTimestampsTestDB()

        payload.db.allowAdditionalKeys = originalAllowAdditionalKeys
      },
    )
  })

  describe('Data strictness', () => {
    it('should not save and leak password, confirm-password from Local API', async () => {
      const createdUser = await payload.create({
        collection: 'users',
        data: {
          password: 'some-password',
          // @ts-expect-error
          'confirm-password': 'some-password',
          email: 'user1@payloadcms.com',
        },
      })

      let keys = Object.keys(createdUser)

      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')

      const foundUser = await payload.findByID({ id: createdUser.id, collection: 'users' })

      keys = Object.keys(foundUser)

      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')
    })

    it('should not save and leak password, confirm-password from payload.db', async () => {
      const createdUser = await payload.db.create({
        collection: 'users',
        data: {
          'confirm-password': 'some-password',
          email: 'user2@payloadcms.com',
          password: 'some-password',
        },
      })

      let keys = Object.keys(createdUser)

      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')

      const foundUser = await payload.db.findOne({
        collection: 'users',
        where: { id: createdUser.id },
      })

      keys = Object.keys(foundUser)
      expect(keys).not.toContain('password')
      expect(keys).not.toContain('confirm-password')
    })
  })

  describe('allow ID on create', () => {
    beforeAll(() => {
      payload.db.allowIDOnCreate = true
      payload.config.db.allowIDOnCreate = true
    })

    afterAll(() => {
      payload.db.allowIDOnCreate = false
      payload.config.db.allowIDOnCreate = false
    })

    it('local API - accepts ID on create', async () => {
      let id: any = null
      if (payload.db.name === 'mongoose') {
        id = new mongoose.Types.ObjectId().toHexString()
      } else if (payload.db.idType === 'uuid') {
        id = randomUUID()
      } else {
        id = 9999
      }

      const post = await payload.create({ collection: 'posts', data: { id, title: 'created' } })

      expect(post.id).toBe(id)
    })

    it('rEST API - accepts ID on create', async () => {
      let id: any = null
      if (payload.db.name === 'mongoose') {
        id = new mongoose.Types.ObjectId().toHexString()
      } else if (payload.db.idType === 'uuid') {
        id = randomUUID()
      } else {
        id = 99999
      }

      const response = await restClient.POST(`/posts`, {
        body: JSON.stringify({
          id,
          title: 'created',
        }),
      })

      const post = await response.json()

      expect(post.doc.id).toBe(id)
    })

    it('graphQL - accepts ID on create', async () => {
      let id: any = null
      if (payload.db.name === 'mongoose') {
        id = new mongoose.Types.ObjectId().toHexString()
      } else if (payload.db.idType === 'uuid') {
        id = randomUUID()
      } else {
        id = 999999
      }

      const query = `mutation {
                createPost(data: {title: "created", id: ${typeof id === 'string' ? `"${id}"` : id}}) {
                id
                title
              }
            }`
      const res = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      const doc = res.data.createPost

      expect(doc).toMatchObject({ id, title: 'created' })
      expect(doc.id).toBe(id)
    })
  })

  it('should find distinct field values of the collection', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    const titles = [
      'title-1',
      'title-2',
      'title-3',
      'title-4',
      'title-5',
      'title-6',
      'title-7',
      'title-8',
      'title-9',
    ].map((title) => ({ title }))

    for (const { title } of titles) {
      const docsCount = Math.random() > 0.5 ? 3 : Math.random() > 0.5 ? 2 : 1
      for (let i = 0; i < docsCount; i++) {
        await payload.create({ collection: 'posts', data: { title } })
      }
    }

    const res = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
    })

    expect(res.values).toStrictEqual(titles)

    const resLimit = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
      limit: 3,
    })

    expect(resLimit.values).toStrictEqual(
      ['title-1', 'title-2', 'title-3'].map((title) => ({ title })),
    )
    // count is still 9
    expect(resLimit.totalDocs).toBe(9)

    const resDesc = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
      sort: '-title',
    })

    expect(resDesc.values).toStrictEqual(titles.toReversed())

    const resAscDefault = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
    })

    expect(resAscDefault.values).toStrictEqual(titles)
  })

  it('should sort find on a different field with findDistinct', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    const titles: {
      title: string
    }[] = [
      'title-1',
      'title-2',
      'title-3',
      'title-4',
      'title-5',
      'title-6',
      'title-7',
      'title-8',
      'title-9',
    ].map((title) => ({ title }))

    const numbers = [42, 7, 3, 19, 73, 8, 100, 1, 56]

    const titlesSortedByNumber = titles.toSorted(
      (a, b) => numbers[titles.indexOf(a)]! - numbers[titles.indexOf(b)]!,
    )

    for (const entry of titles) {
      const docsCount = Math.random() > 0.5 ? 3 : Math.random() > 0.5 ? 2 : 1
      for (let i = 0; i < docsCount; i++) {
        await payload.create({
          collection: 'posts',
          data: {
            number: numbers[titles.indexOf(entry)]! + Math.random(),
            title: entry.title,
          },
        })
      }
    }

    const resDesc = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
      sort: '-number',
    })

    const resAsc = await payload.findDistinct({
      collection: 'posts',
      field: 'title',
      sort: 'number',
    })

    const reversed = titlesSortedByNumber.toReversed()

    expect(resAsc.values).toStrictEqual(titlesSortedByNumber)
    expect(resDesc.values).toStrictEqual(reversed)
  })

  it('should populate distinct relationships when depth>0', async () => {
    await payload.delete({ collection: 'posts', where: {} })

    const categories = ['category-1', 'category-2', 'category-3', 'category-4'].map((title) => ({
      title,
    }))

    const categoriesIDS: { category: string }[] = []

    for (const { title } of categories) {
      const doc = await payload.create({ collection: 'categories', data: { title } })
      categoriesIDS.push({ category: doc.id })
    }

    for (const { category } of categoriesIDS) {
      const docsCount = Math.random() > 0.5 ? 3 : Math.random() > 0.5 ? 2 : 1
      for (let i = 0; i < docsCount; i++) {
        await payload.create({ collection: 'posts', data: { category, title: randomUUID() } })
      }
    }

    const resultDepth0 = await payload.findDistinct({
      collection: 'posts',
      field: 'category',
      sort: 'category.title',
    })
    expect(resultDepth0.values).toStrictEqual(categoriesIDS)
    const resultDepth1 = await payload.findDistinct({
      collection: 'posts',
      depth: 1,
      field: 'category',
      sort: 'category.title',
    })

    for (let i = 0; i < resultDepth1.values.length; i++) {
      const fromRes = resultDepth1.values[i] as any
      const id = categoriesIDS[i].category as any
      const title = categories[i]?.title
      expect(fromRes.category.title).toBe(title)
      expect(fromRes.category.id).toBe(id)
    }
  })

  it('should populate distinct relationships of hasMany: true when depth>0', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })

    const categories = ['category-1', 'category-2', 'category-3', 'category-4'].map((title) => ({
      title,
    }))

    const categoriesIDS: { categories: string }[] = []

    for (const { title } of categories) {
      const doc = await payload.create({ collection: 'categories', data: { title } })
      categoriesIDS.push({ categories: doc.id })
    }

    await payload.create({
      collection: 'posts',
      data: {
        categories: [categoriesIDS[0]?.categories, categoriesIDS[1]?.categories],
        title: '1',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        categories: [
          categoriesIDS[0]?.categories,
          categoriesIDS[2]?.categories,
          categoriesIDS[3]?.categories,
        ],
        title: '2',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        categories: [
          categoriesIDS[0]?.categories,
          categoriesIDS[3]?.categories,
          categoriesIDS[1]?.categories,
        ],
        title: '3',
      },
    })

    const resultDepth0 = await payload.findDistinct({
      collection: 'posts',
      field: 'categories',
      sort: 'categories.title',
    })
    expect(resultDepth0.values).toStrictEqual(categoriesIDS)
    const resultDepth1 = await payload.findDistinct({
      collection: 'posts',
      depth: 1,
      field: 'categories',
      sort: 'categories.title',
    })

    for (let i = 0; i < resultDepth1.values.length; i++) {
      const fromRes = resultDepth1.values[i] as any
      const id = categoriesIDS[i].categories as any
      const title = categories[i]?.title
      expect(fromRes.categories.title).toBe(title)
      expect(fromRes.categories.id).toBe(id)
    }

    // Non-consistent sorting by ID
    if (process.env.PAYLOAD_DATABASE?.includes('uuid')) {
      return
    }

    const resultDepth1NoSort = await payload.findDistinct({
      collection: 'posts',
      depth: 1,
      field: 'categories',
    })

    for (let i = 0; i < resultDepth1NoSort.values.length; i++) {
      const fromRes = resultDepth1NoSort.values[i] as any
      const id = categoriesIDS[i].categories as any
      const title = categories[i]?.title
      expect(fromRes.categories.title).toBe(title)
      expect(fromRes.categories.id).toBe(id)
    }
  })

  it('should populate distinct relationships of polymorphic when depth>0', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })

    const category_1 = await payload.create({
      collection: 'categories',
      data: { title: 'category_1' },
    })
    const category_2 = await payload.create({
      collection: 'categories',
      data: { title: 'category_2' },
    })
    const category_3 = await payload.create({
      collection: 'categories',
      data: { title: 'category_3' },
    })

    const post_1 = await payload.create({
      collection: 'posts',
      data: { categoryPoly: { relationTo: 'categories', value: category_1.id }, title: 'post_1' },
    })
    const post_2 = await payload.create({
      collection: 'posts',
      data: { categoryPoly: { relationTo: 'categories', value: category_1.id }, title: 'post_2' },
    })
    const post_3 = await payload.create({
      collection: 'posts',
      data: { categoryPoly: { relationTo: 'categories', value: category_2.id }, title: 'post_3' },
    })
    const post_4 = await payload.create({
      collection: 'posts',
      data: { categoryPoly: { relationTo: 'categories', value: category_3.id }, title: 'post_4' },
    })
    const post_5 = await payload.create({
      collection: 'posts',
      data: { categoryPoly: { relationTo: 'categories', value: category_3.id }, title: 'post_5' },
    })

    const result = await payload.findDistinct({
      collection: 'posts',
      depth: 0,
      field: 'categoryPoly',
    })

    expect(result.values).toHaveLength(3)
    expect(
      result.values.some(
        (v) =>
          v.categoryPoly?.relationTo === 'categories' && v.categoryPoly.value === category_1.id,
      ),
    ).toBe(true)
    expect(
      result.values.some(
        (v) =>
          v.categoryPoly?.relationTo === 'categories' && v.categoryPoly.value === category_2.id,
      ),
    ).toBe(true)
    expect(
      result.values.some(
        (v) =>
          v.categoryPoly?.relationTo === 'categories' && v.categoryPoly.value === category_3.id,
      ),
    ).toBe(true)
  })

  it('should populate distinct relationships of hasMany polymorphic when depth>0', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })

    const category_1 = await payload.create({
      collection: 'categories',
      data: { title: 'category_1' },
    })
    const category_2 = await payload.create({
      collection: 'categories',
      data: { title: 'category_2' },
    })
    const category_3 = await payload.create({
      collection: 'categories',
      data: { title: 'category_3' },
    })

    const post_1 = await payload.create({
      collection: 'posts',
      data: {
        categoryPolyMany: [{ relationTo: 'categories', value: category_1.id }],
        title: 'post_1',
      },
    })
    const post_2 = await payload.create({
      collection: 'posts',
      data: {
        categoryPolyMany: [{ relationTo: 'categories', value: category_1.id }],
        title: 'post_2',
      },
    })
    const post_3 = await payload.create({
      collection: 'posts',
      data: {
        categoryPolyMany: [{ relationTo: 'categories', value: category_2.id }],
        title: 'post_3',
      },
    })
    const post_4 = await payload.create({
      collection: 'posts',
      data: {
        categoryPolyMany: [{ relationTo: 'categories', value: category_3.id }],
        title: 'post_4',
      },
    })
    const post_5 = await payload.create({
      collection: 'posts',
      data: {
        categoryPolyMany: [{ relationTo: 'categories', value: category_3.id }],
        title: 'post_5',
      },
    })

    const post_6 = await payload.create({
      collection: 'posts',
      data: {
        categoryPolyMany: null,
        title: 'post_6',
      },
    })

    const result = await payload.findDistinct({
      collection: 'posts',
      depth: 0,
      field: 'categoryPolyMany',
    })

    expect(result.values).toHaveLength(4)
    expect(
      result.values.some(
        (v) =>
          v.categoryPolyMany?.relationTo === 'categories' &&
          v.categoryPolyMany.value === category_1.id,
      ),
    ).toBe(true)
    expect(
      result.values.some(
        (v) =>
          v.categoryPolyMany?.relationTo === 'categories' &&
          v.categoryPolyMany.value === category_2.id,
      ),
    ).toBe(true)
    expect(
      result.values.some(
        (v) =>
          v.categoryPolyMany?.relationTo === 'categories' &&
          v.categoryPolyMany.value === category_3.id,
      ),
    ).toBe(true)
    expect(result.values.some((v) => v.categoryPolyMany === null)).toBe(true)
  })

  it('should find distinct values with field nested to a relationship', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })

    const category_1 = await payload.create({
      collection: 'categories',
      data: { title: 'category_1' },
    })
    const category_2 = await payload.create({
      collection: 'categories',
      data: { title: 'category_2' },
    })
    const category_3 = await payload.create({
      collection: 'categories',
      data: { title: 'category_3' },
    })

    await payload.create({ collection: 'posts', data: { category: category_1, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })

    const res = await payload.findDistinct({
      collection: 'posts',
      field: 'category.title',
    })

    expect(res.values).toEqual([
      {
        'category.title': 'category_1',
      },
      {
        'category.title': 'category_2',
      },
      {
        'category.title': 'category_3',
      },
    ])
  })

  it('should find distinct values with virtual field linked to a relationship', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })

    const category_1 = await payload.create({
      collection: 'categories',
      data: { title: 'category_1' },
    })
    const category_2 = await payload.create({
      collection: 'categories',
      data: { title: 'category_2' },
    })
    const category_3 = await payload.create({
      collection: 'categories',
      data: { title: 'category_3' },
    })

    await payload.create({ collection: 'posts', data: { category: category_1, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })

    const res = await payload.findDistinct({
      collection: 'posts',
      field: 'categoryTitle',
    })

    expect(res.values).toEqual([
      {
        categoryTitle: 'category_1',
      },
      {
        categoryTitle: 'category_2',
      },
      {
        categoryTitle: 'category_3',
      },
    ])
  })

  it('should find distinct values with field nested to a 2x relationship', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })
    await payload.delete({ collection: 'simple', where: {} })

    const simple_1 = await payload.create({ collection: 'simple', data: { text: 'simple_1' } })
    const simple_2 = await payload.create({ collection: 'simple', data: { text: 'simple_2' } })
    const simple_3 = await payload.create({ collection: 'simple', data: { text: 'simple_3' } })

    const category_1 = await payload.create({
      collection: 'categories',
      data: { simple: simple_1, title: 'category_1' },
    })
    const category_2 = await payload.create({
      collection: 'categories',
      data: { simple: simple_2, title: 'category_2' },
    })
    const category_3 = await payload.create({
      collection: 'categories',
      data: { simple: simple_3, title: 'category_3' },
    })
    const category_4 = await payload.create({
      collection: 'categories',
      data: { simple: simple_3, title: 'category_4' },
    })

    await payload.create({ collection: 'posts', data: { category: category_1, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_4, title: 'post' } })

    const res = await payload.findDistinct({
      collection: 'posts',
      field: 'category.simple.text',
    })

    expect(res.values).toEqual([
      {
        'category.simple.text': 'simple_1',
      },
      {
        'category.simple.text': 'simple_2',
      },
      {
        'category.simple.text': 'simple_3',
      },
    ])
  })

  it('should find distinct values with virtual field linked to a 2x relationship', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })
    await payload.delete({ collection: 'simple', where: {} })

    const simple_1 = await payload.create({ collection: 'simple', data: { text: 'simple_1' } })
    const simple_2 = await payload.create({ collection: 'simple', data: { text: 'simple_2' } })
    const simple_3 = await payload.create({ collection: 'simple', data: { text: 'simple_3' } })

    const category_1 = await payload.create({
      collection: 'categories',
      data: { simple: simple_1, title: 'category_1' },
    })
    const category_2 = await payload.create({
      collection: 'categories',
      data: { simple: simple_2, title: 'category_2' },
    })
    const category_3 = await payload.create({
      collection: 'categories',
      data: { simple: simple_3, title: 'category_3' },
    })
    const category_4 = await payload.create({
      collection: 'categories',
      data: { simple: simple_3, title: 'category_4' },
    })

    await payload.create({ collection: 'posts', data: { category: category_1, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_2, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_3, title: 'post' } })
    await payload.create({ collection: 'posts', data: { category: category_4, title: 'post' } })

    const res = await payload.findDistinct({
      collection: 'posts',
      field: 'categorySimpleText',
    })

    expect(res.values).toEqual([
      {
        categorySimpleText: 'simple_1',
      },
      {
        categorySimpleText: 'simple_2',
      },
      {
        categorySimpleText: 'simple_3',
      },
    ])
  })

  it('should find distinct values when the virtual field is linked to ID', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'category' },
    })
    await payload.create({ collection: 'posts', data: { category, title: 'post' } })
    const distinct = await payload.findDistinct({ collection: 'posts', field: 'categoryID' })
    expect(distinct.values).toStrictEqual([{ categoryID: category.id }])
  })

  it('should find distinct values by the explicit ID field path', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    await payload.delete({ collection: 'categories', where: {} })
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'category' },
    })
    await payload.create({ collection: 'posts', data: { category, title: 'post' } })
    const distinct = await payload.findDistinct({ collection: 'posts', field: 'category.id' })
    expect(distinct.values).toStrictEqual([{ 'category.id': category.id }])
  })

  describe('relationship field pagination', () => {
    let createdCategoryIds: string[] = []
    let createdPostIds: string[] = []

    beforeEach(async () => {
      // Create 15 unique categories
      const categoryPromises = Array.from({ length: 15 }).map(async (_, i) => {
        const cat = await payload.create({
          collection: 'categories',
          data: { title: `DistinctTest-Cat-${i + 1}-${Date.now()}` },
        })
        return cat.id
      })
      createdCategoryIds = await Promise.all(categoryPromises)

      // Create 15 posts, each with a unique category
      const postPromises = createdCategoryIds.map(async (categoryId, i) => {
        const post = await payload.create({
          collection: 'posts',
          data: {
            category: categoryId,
            title: `DistinctTest-Post-${i + 1}-${Date.now()}`,
          },
        })
        return post.id
      })
      createdPostIds = await Promise.all(postPromises)
    })

    afterAll(async () => {
      // Clean up in order: posts first, then categories
      await Promise.all(
        createdPostIds.map((id) => payload.delete({ id, collection: 'posts' }).catch(() => {})),
      )
      await Promise.all(
        createdCategoryIds.map((id) =>
          payload.delete({ id, collection: 'categories' }).catch(() => {}),
        ),
      )
    })

    it('should paginate distinct results for relationship field paths', async () => {
      // Test findDistinct with pagination on category.title path
      const page1 = await payload.findDistinct({
        collection: 'posts',
        field: 'category.title',
        limit: 10,
        page: 1,
        where: {
          title: {
            contains: 'DistinctTest-Post',
          },
        },
      })

      expect(page1.totalDocs).toBe(15)
      expect(page1.totalPages).toBe(2)
      expect(page1.limit).toBe(10)
      expect(page1.page).toBe(1)
      expect(page1.hasNextPage).toBe(true)
      expect(page1.hasPrevPage).toBe(false)
      expect(page1.values).toHaveLength(10)

      const page2 = await payload.findDistinct({
        collection: 'posts',
        field: 'category.title',
        limit: 10,
        page: 2,
        where: {
          title: {
            contains: 'DistinctTest-Post',
          },
        },
      })

      expect(page2.totalDocs).toBe(15)
      expect(page2.totalPages).toBe(2)
      expect(page2.page).toBe(2)
      expect(page2.hasNextPage).toBe(false)
      expect(page2.hasPrevPage).toBe(true)
      expect(page2.values).toHaveLength(5)

      // Verify no duplicate values between pages
      const page1Values = page1.values.map((v: any) => v['category.title'])
      const page2Values = page2.values.map((v: any) => v['category.title'])
      const intersection = page1Values.filter((v) => page2Values.includes(v))
      expect(intersection).toHaveLength(0)
    })
  })

  describe('Compound Indexes', () => {
    beforeEach(async () => {
      await payload.delete({ collection: 'compound-indexes', where: {} })
    })

    it('top level: should throw a unique error', async () => {
      await payload.create({
        collection: 'compound-indexes',
        data: { one: '1', three: randomUUID(), two: '2' },
      })

      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { one: '1', three: randomUUID(), two: '3' },
      })
      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { one: '-1', three: randomUUID(), two: '2' },
      })

      // fails
      await expect(
        payload.create({
          collection: 'compound-indexes',
          data: { one: '1', three: randomUUID(), two: '2' },
        }),
      ).rejects.toBeTruthy()
    })

    it('combine group and top level: should throw a unique error', async () => {
      await payload.create({
        collection: 'compound-indexes',
        data: {
          group: { four: '4' },
          one: randomUUID(),
          three: '3',
        },
      })

      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { group: { four: '5' }, one: randomUUID(), three: '3' },
      })
      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { group: { four: '4' }, one: randomUUID(), three: '4' },
      })

      // fails
      await expect(
        payload.create({
          collection: 'compound-indexes',
          data: { group: { four: '4' }, one: randomUUID(), three: '3' },
        }),
      ).rejects.toBeTruthy()
    })
  })

  describe('migrations', () => {
    let ranFreshTest = false

    beforeEach(async () => {
      if (
        process.env.PAYLOAD_DROP_DATABASE === 'true' &&
        'drizzle' in payload.db &&
        !ranFreshTest
      ) {
        const db = payload.db as unknown as PostgresAdapter
        await db.dropDatabase({ adapter: db })
      }
      removeFiles(path.join(dirname, './migrations'))

      await payload.db.createMigration({
        forceAcceptWarning: true,
        migrationName: 'test',
        payload,
      })
    })

    it('should run migrate:create', () => {
      // read files names in migrationsDir
      const migrationFile = path.normalize(fs.readdirSync(payload.db.migrationDir)[0])
      expect(migrationFile).toContain('_test')
    })

    it('should create index.ts file in the migrations directory with file imports', () => {
      const indexFile = path.join(payload.db.migrationDir, 'index.ts')
      const indexFileContent = fs.readFileSync(indexFile, 'utf8')
      expect(indexFileContent).toContain("_test from './")
    })

    it('should run migrate', async () => {
      await payload.db.migrate()
      const { docs } = await payload.find({
        collection: 'payload-migrations',
      })
      const migration = docs[0]
      expect(migration?.name).toContain('_test')
      expect(migration?.batch).toStrictEqual(1)
    })

    it('should run migrate:status', async () => {
      let error
      try {
        await payload.db.migrateStatus()
      } catch (e) {
        error = e
      }
      expect(error).toBeUndefined()
    })

    it('should run migrate:fresh', async () => {
      await payload.db.migrateFresh({ forceAcceptWarning: true })
      const { docs } = await payload.find({
        collection: 'payload-migrations',
      })
      const migration = docs[0]
      expect(migration.name).toContain('_test')
      expect(migration.batch).toStrictEqual(1)
      ranFreshTest = true
    })

    // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
    it('should run migrate:down', { db: 'mongo' }, async () => {
      // migrate existing if there any
      await payload.db.migrate()

      await payload.db.createMigration({
        forceAcceptWarning: true,
        migrationName: 'migration_to_down',
        payload,
      })

      // migrate current to test
      await payload.db.migrate()

      const { docs } = await payload.find({ collection: 'payload-migrations' })
      expect(docs.some((doc) => doc.name.includes('migration_to_down'))).toBeTruthy()

      let error
      try {
        await payload.db.migrateDown()
      } catch (e) {
        error = e
      }

      const migrations = await payload.find({
        collection: 'payload-migrations',
      })

      expect(error).toBeUndefined()
      expect(migrations.docs.some((doc) => doc.name.includes('migration_to_down'))).toBeFalsy()

      await payload.delete({ collection: 'payload-migrations', where: {} })
    })

    // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
    it('should run migrate:refresh', { db: 'mongo' }, async () => {
      let error
      try {
        await payload.db.migrateRefresh()
      } catch (e) {
        error = e
      }

      const migrations = await payload.find({
        collection: 'payload-migrations',
      })

      expect(error).toBeUndefined()
      expect(migrations.docs).toHaveLength(1)
    })
  })

  // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
  it('should run migrate:reset', { db: 'mongo' }, async () => {
    let error
    try {
      await payload.db.migrateReset()
    } catch (e) {
      error = e
    }

    const migrations = await payload.find({
      collection: 'payload-migrations',
    })

    expect(error).toBeUndefined()
    expect(migrations.docs).toHaveLength(0)
  })

  describe('predefined migrations', () => {
    it('mongoose - should execute migrateVersionsV1_V2', async () => {
      if (payload.db.name !== 'mongoose') {
        return
      }

      const req = { payload } as PayloadRequest

      let hasErr = false

      await initTransaction(req)
      await migrateVersionsV1_V2({ req }).catch(async (err) => {
        payload.logger.error(err)
        hasErr = true
        await killTransaction(req)
      })
      await commitTransaction(req)

      expect(hasErr).toBeFalsy()
    })

    it('mongoose - should execute migrateRelationshipsV2_V3', async () => {
      if (payload.db.name !== 'mongoose') {
        return
      }

      const req = { payload } as PayloadRequest

      let hasErr = false

      const docs_before = Array.from({ length: 174 }, () => ({
        relationship: new Types.ObjectId().toHexString(),
        relationship_2: {
          relationTo: 'default-values',
          value: new Types.ObjectId().toHexString(),
        },
      }))

      const inserted = await payload.db.collections['relationships-migration'].insertMany(
        docs_before,
        {
          lean: true,
        },
      )

      const versions_before = await payload.db.versions['relationships-migration'].insertMany(
        docs_before.map((doc, i) => ({
          parent: inserted[i]._id.toHexString(),
          version: doc,
        })),
        {
          lean: true,
        },
      )

      expect(inserted.every((doc) => typeof doc.relationship === 'string')).toBeTruthy()

      await initTransaction(req)
      await migrateRelationshipsV2_V3({ batchSize: 66, req }).catch(async (err) => {
        await killTransaction(req)
        payload.logger.error(err)
        hasErr = true
      })
      await commitTransaction(req)

      expect(hasErr).toBeFalsy()

      const docs = await payload.db.collections['relationships-migration'].find(
        {},
        {},
        { lean: true },
      )

      docs.forEach((doc, i) => {
        expect(doc.relationship).toBeInstanceOf(Types.ObjectId)
        expect(doc.relationship.toHexString()).toBe(docs_before[i].relationship)

        expect(doc.relationship_2.value).toBeInstanceOf(Types.ObjectId)
        expect(doc.relationship_2.value.toHexString()).toBe(docs_before[i].relationship_2.value)
      })

      const versions = await payload.db.versions['relationships-migration'].find(
        {},
        {},
        { lean: true },
      )

      versions.forEach((doc, i) => {
        expect(doc.parent).toBeInstanceOf(Types.ObjectId)
        expect(doc.parent.toHexString()).toBe(versions_before[i].parent)

        expect(doc.version.relationship).toBeInstanceOf(Types.ObjectId)
        expect(doc.version.relationship.toHexString()).toBe(versions_before[i].version.relationship)

        expect(doc.version.relationship_2.value).toBeInstanceOf(Types.ObjectId)
        expect(doc.version.relationship_2.value.toHexString()).toBe(
          versions_before[i].version.relationship_2.value,
        )
      })

      await payload.db.collections['relationships-migration'].deleteMany({})
      await payload.db.versions['relationships-migration'].deleteMany({})
    })
  })

  describe('schema', () => {
    it('should use custom dbNames', () => {
      expect(payload.db).toBeDefined()

      if (payload.db.name === 'mongoose') {
        // @ts-expect-error
        const db: MongooseAdapter = payload.db

        expect(db.collections['custom-schema'].modelName).toStrictEqual('customs')
        expect(db.versions['custom-schema'].modelName).toStrictEqual('_customs_versions')
        expect(db.versions.global.modelName).toStrictEqual('_customGlobal_versions')
      } else {
        // @ts-expect-error
        const db: PostgresAdapter = payload.db

        // collection
        expect(db.tables.customs).toBeDefined()

        // collection versions
        expect(db.tables._customs_v).toBeDefined()

        // collection relationships
        expect(db.tables.customs_rels).toBeDefined()

        // collection localized
        expect(db.tables.customs_locales).toBeDefined()

        // global
        expect(db.tables.customGlobal).toBeDefined()
        expect(db.tables._customGlobal_v).toBeDefined()

        // select
        expect(db.tables.customs_customSelect).toBeDefined()

        // array
        expect(db.tables.customArrays).toBeDefined()

        // array localized
        expect(db.tables.customArrays_locales).toBeDefined()

        // blocks
        expect(db.tables.customBlocks).toBeDefined()

        // localized blocks
        expect(db.tables.customBlocks_locales).toBeDefined()

        // enum names
        if (db.enums) {
          expect(db.enums.selectEnum).toBeDefined()
          expect(db.enums.radioEnum).toBeDefined()
        }
      }
    })

    it('should create and read doc with custom db names', async () => {
      const relationA = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const { id } = await payload.create({
        collection: 'custom-schema',
        data: {
          array: [
            {
              localizedText: 'goodbye',
              text: 'hello',
            },
          ],
          blocks: [
            {
              blockType: 'block-second',
              localizedText: 'goodbye',
              text: 'hello',
            },
          ],
          localizedText: 'hello',
          radio: 'a',
          relationship: [relationA.id],
          select: ['a', 'b'],
          text: 'test',
        },
      })

      const doc = await payload.findByID({
        id,
        collection: 'custom-schema',
      })

      expect(doc.relationship[0].title).toStrictEqual(relationA.title)
      expect(doc.text).toStrictEqual('test')
      expect(doc.localizedText).toStrictEqual('hello')
      expect(doc.select).toHaveLength(2)
      expect(doc.radio).toStrictEqual('a')
      expect(doc.array[0].text).toStrictEqual('hello')
      expect(doc.array[0].localizedText).toStrictEqual('goodbye')
      expect(doc.blocks[0].text).toStrictEqual('hello')
      expect(doc.blocks[0].localizedText).toStrictEqual('goodbye')
    })

    it('arrays should work with both long field names and dbName', async () => {
      const { id } = await payload.create({
        collection: 'aliases',
        data: {
          thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName: [
            {
              nestedArray: [{ text: 'some-text' }],
            },
          ],
        },
      })
      const res = await payload.findByID({ id, collection: 'aliases' })
      expect(
        res.thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName,
      ).toHaveLength(1)
      const item =
        res.thisIsALongFieldNameThatCanCauseAPostgresErrorEvenThoughWeSetAShorterDBName?.[0]
      assert(item)
      expect(item.nestedArray).toHaveLength(1)
      expect(item.nestedArray?.[0]?.text).toBe('some-text')
    })
  })

  describe('transactions', { db: 'transactionsEnabled' }, () => {
    describe('local api', () => {
      it('should commit multiple operations in isolation', async () => {
        const req = {
          payload,
          user,
        } as unknown as PayloadRequest

        await initTransaction(req)

        const first = await payload.create({
          collection,
          data: {
            title,
          },
          req,
        })

        await expect(() =>
          payload.findByID({
            id: first.id,
            collection,
            // omitting req for isolation
          }),
        ).rejects.toThrow('Not Found')

        const second = await payload.create({
          collection,
          data: {
            title,
          },
          req,
        })

        await commitTransaction(req)
        expect(req.transactionID).toBeUndefined()

        const firstResult = await payload.findByID({
          id: first.id,
          collection,
          req,
        })
        const secondResult = await payload.findByID({
          id: second.id,
          collection,
          req,
        })

        expect(firstResult.id).toStrictEqual(first.id)
        expect(secondResult.id).toStrictEqual(second.id)
      })

      it('should commit multiple operations async', async () => {
        const req = {
          payload,
          user,
        } as unknown as PayloadRequest

        let first
        let second

        const firstReq = payload
          .create({
            collection,
            data: {
              title,
            },
            req: isolateObjectProperty(req, 'transactionID'),
          })
          .then((res) => {
            first = res
          })

        const secondReq = payload
          .create({
            collection,
            data: {
              title,
            },
            req: isolateObjectProperty(req, 'transactionID'),
          })
          .then((res) => {
            second = res
          })

        await Promise.all([firstReq, secondReq])

        expect(req.transactionID).toBeUndefined()

        const firstResult = await payload.findByID({
          id: first.id,
          collection,
        })
        const secondResult = await payload.findByID({
          id: second.id,
          collection,
        })

        expect(firstResult.id).toStrictEqual(first.id)
        expect(secondResult.id).toStrictEqual(second.id)
      })

      it('should rollback operations on failure', async () => {
        const req = {
          payload,
          user,
        } as unknown as PayloadRequest

        await initTransaction(req)

        const first = await payload.create({
          collection,
          data: {
            title,
          },
          req,
        })

        try {
          await payload.create({
            collection,
            data: {
              throwAfterChange: true,
              title,
            },
            req,
          })
        } catch (error: unknown) {
          // catch error and carry on
        }

        expect(req.transactionID).toBeFalsy()

        // this should not do anything but is needed to be certain about the next assertion
        await commitTransaction(req)

        await expect(() =>
          payload.findByID({
            id: first.id,
            collection,
            req,
          }),
        ).rejects.toThrow('Not Found')
      })

      describe('disableTransaction', () => {
        let disabledTransactionPost
        beforeAll(async () => {
          disabledTransactionPost = await payload.create({
            collection,
            data: {
              title,
            },
            depth: 0,
            disableTransaction: true,
          })
        })
        it('should not use transaction calling create() with disableTransaction', () => {
          expect(disabledTransactionPost.hasTransaction).toBeFalsy()
        })
        it('should not use transaction calling update() with disableTransaction', async () => {
          const result = await payload.update({
            id: disabledTransactionPost.id,
            collection,
            data: {
              title,
            },
            disableTransaction: true,
          })

          expect(result.hasTransaction).toBeFalsy()
        })
        it('should not use transaction calling delete() with disableTransaction', async () => {
          const result = await payload.delete({
            id: disabledTransactionPost.id,
            collection,
            data: {
              title,
            },
            disableTransaction: true,
          })

          expect(result.hasTransaction).toBeFalsy()
        })

        it('should respect disableTransaction with bulkOperationsSingleTransaction on update', async () => {
          const originalValue = payload.db.bulkOperationsSingleTransaction

          payload.db.bulkOperationsSingleTransaction = true

          try {
            const posts = await Promise.all([
              payload.create({ collection, data: { title: 'disableTx1' } }),
              payload.create({ collection, data: { title: 'disableTx2' } }),
            ])

            const result = await payload.update({
              collection,
              where: { id: { in: posts.map((p) => p.id) } },
              data: { title: 'updated' },
              disableTransaction: true,
            })

            expect(result.docs).toHaveLength(2)
            // Each doc should NOT have a transaction
            for (const doc of result.docs) {
              expect(doc.hasTransaction).toBeFalsy()
            }
          } finally {
            payload.db.bulkOperationsSingleTransaction = originalValue
          }
        })

        it('should respect disableTransaction with bulkOperationsSingleTransaction on delete', async () => {
          const originalValue = payload.db.bulkOperationsSingleTransaction

          payload.db.bulkOperationsSingleTransaction = true

          try {
            // Create docs with disableTransaction so hasTransaction is false from creation
            // (delete doesn't run beforeChange hooks, so hasTransaction reflects creation state)
            const posts = await Promise.all([
              payload.create({
                collection,
                data: { title: 'disableDelTx1' },
                disableTransaction: true,
              }),
              payload.create({
                collection,
                data: { title: 'disableDelTx2' },
                disableTransaction: true,
              }),
            ])

            // Verify docs were created without transaction
            expect(posts[0].hasTransaction).toBeFalsy()
            expect(posts[1].hasTransaction).toBeFalsy()

            const result = await payload.delete({
              collection,
              where: { id: { in: posts.map((p) => p.id) } },
              disableTransaction: true,
            })

            // Verify delete succeeded (if transaction was incorrectly started and rolled back, this would fail)
            expect(result.docs).toHaveLength(2)
            expect(result.errors).toHaveLength(0)
          } finally {
            payload.db.bulkOperationsSingleTransaction = originalValue
          }
        })
      })
    })
  })

  describe('local API', () => {
    it('should support `limit` arg in bulk updates', async () => {
      for (let i = 0; i < 10; i++) {
        await payload.create({
          collection,
          data: {
            title: 'hello',
          },
        })
      }

      const updateResult = await payload.update({
        collection,
        data: {
          title: 'world',
        },
        limit: 5,
        where: {
          title: { equals: 'hello' },
        },
      })

      const findResult = await payload.find({
        collection,
        where: {
          title: { exists: true },
        },
      })

      const helloDocs = findResult.docs.filter((doc) => doc.title === 'hello')
      const worldDocs = findResult.docs.filter((doc) => doc.title === 'world')

      expect(updateResult.docs).toHaveLength(5)
      expect(updateResult.docs[0].title).toStrictEqual('world')
      expect(helloDocs).toHaveLength(5)
      expect(worldDocs).toHaveLength(5)
    })

    it('should bulk update with bulkOperationsSingleTransaction: true', async () => {
      const originalValue = payload.db.bulkOperationsSingleTransaction
      payload.db.bulkOperationsSingleTransaction = true

      try {
        const posts = await Promise.all([
          payload.create({ collection, data: { title: 'test1' } }),
          payload.create({ collection, data: { title: 'test2' } }),
          payload.create({ collection, data: { title: 'test3' } }),
        ])

        const result = await payload.update({
          collection,
          data: { title: 'updated' },
          where: { id: { in: posts.map((p) => p.id) } },
        })

        expect(result.docs).toHaveLength(3)
        expect(result.errors).toHaveLength(0)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalValue
      }
    })

    it('should bulk delete with bulkOperationsSingleTransaction: true', async () => {
      const originalValue = payload.db.bulkOperationsSingleTransaction
      payload.db.bulkOperationsSingleTransaction = true

      try {
        const posts = await Promise.all([
          payload.create({ collection, data: { title: 'toDelete1' } }),
          payload.create({ collection, data: { title: 'toDelete2' } }),
        ])

        const result = await payload.delete({
          collection,
          where: { id: { in: posts.map((p) => p.id) } },
        })

        expect(result.docs).toHaveLength(2)
        expect(result.errors).toHaveLength(0)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalValue
      }
    })

    describe('Bulk operation error handling', () => {
      afterEach(async () => {
        await payload.db.deleteMany({
          collection: 'bulk-error-test',
          where: {},
        })
      })

      it('should report honest results when one update fails', async () => {
        // Create 3 docs sequentially to avoid MongoDB transaction conflicts
        const docs = [
          await payload.create({ collection: 'bulk-error-test', data: { title: 'doc1' } }),
          await payload.create({ collection: 'bulk-error-test', data: { title: 'doc2' } }),
          await payload.create({ collection: 'bulk-error-test', data: { title: 'doc3' } }),
        ]

        // Try to update all, but set shouldFailOnUpdate which will throw
        const result = await payload.update({
          collection: 'bulk-error-test',
          data: { shouldFailOnUpdate: true },
          where: { id: { in: docs.map((d) => d.id) } },
        })

        if (hasTransactions) {
          // With transactions: all fail because transaction is rolled back
          expect(result.docs).toHaveLength(0)
          expect(result.errors).toHaveLength(3)
        } else {
          // Without transactions: all fail because all threw errors
          // (update with shouldFailOnUpdate=true throws for each doc)
          expect(result.errors.length).toBeGreaterThan(0)
        }
      })

      it('should report honest results when one delete fails', async () => {
        // Create 3 docs sequentially, one marked to fail on delete
        const docs = [
          await payload.create({ collection: 'bulk-error-test', data: { title: 'doc1' } }),
          await payload.create({
            collection: 'bulk-error-test',
            data: { shouldFailOnDelete: true, title: 'doc2' },
          }),
          await payload.create({ collection: 'bulk-error-test', data: { title: 'doc3' } }),
        ]

        // Try to delete all
        const result = await payload.delete({
          collection: 'bulk-error-test',
          where: { id: { in: docs.map((d) => d.id) } },
        })

        // Verify results honestly reflect what happened
        const remaining = await payload.find({
          collection: 'bulk-error-test',
          where: { id: { in: docs.map((d) => d.id) } },
        })

        if (hasTransactions) {
          // With transactions: all fail, all docs remain
          expect(result.docs).toHaveLength(0)
          expect(result.errors).toHaveLength(3)
          expect(remaining.docs).toHaveLength(3)
        } else {
          // Without transactions: some succeed, some fail
          // 2 docs deleted, 1 failed (doc2 with shouldFailOnDelete)
          expect(result.docs).toHaveLength(2)
          expect(result.errors).toHaveLength(1)
          expect(remaining.docs).toHaveLength(1)
          expect(remaining.docs[0]?.title).toBe('doc2')
        }
      })

      it('should report honest results when one update fails with separate transactions', async () => {
        const originalValue = payload.db.bulkOperationsSingleTransaction
        payload.db.bulkOperationsSingleTransaction = true

        try {
          // Create 3 docs sequentially to avoid MongoDB transaction conflicts
          const docs = [
            await payload.create({ collection: 'bulk-error-test', data: { title: 'doc1' } }),
            await payload.create({ collection: 'bulk-error-test', data: { title: 'doc2' } }),
            await payload.create({ collection: 'bulk-error-test', data: { title: 'doc3' } }),
          ]

          // Try to update all, but set shouldFailOnUpdate which will throw
          const result = await payload.update({
            collection: 'bulk-error-test',
            data: { shouldFailOnUpdate: true },
            where: { id: { in: docs.map((d) => d.id) } },
          })

          if (hasTransactions) {
            // With transactions: all fail because all transactions are rolled back
            expect(result.docs).toHaveLength(0)
            expect(result.errors).toHaveLength(3)
          } else {
            // Without transactions: all fail because all threw errors
            expect(result.errors.length).toBeGreaterThan(0)
          }
        } finally {
          payload.db.bulkOperationsSingleTransaction = originalValue
        }
      })

      it('should report honest results when one delete fails with separate transactions', async () => {
        const originalValue = payload.db.bulkOperationsSingleTransaction
        payload.db.bulkOperationsSingleTransaction = true

        try {
          // Create 3 docs sequentially, one marked to fail on delete
          const docs = [
            await payload.create({ collection: 'bulk-error-test', data: { title: 'doc1' } }),
            await payload.create({
              collection: 'bulk-error-test',
              data: { shouldFailOnDelete: true, title: 'doc2' },
            }),
            await payload.create({ collection: 'bulk-error-test', data: { title: 'doc3' } }),
          ]

          // Try to delete all
          const result = await payload.delete({
            collection: 'bulk-error-test',
            where: { id: { in: docs.map((d) => d.id) } },
          })

          // Verify results honestly reflect what happened
          const remaining = await payload.find({
            collection: 'bulk-error-test',
            where: { id: { in: docs.map((d) => d.id) } },
          })

          if (hasTransactions) {
            // With transactions: all fail, all docs remain
            expect(result.docs).toHaveLength(0)
            expect(result.errors).toHaveLength(3)
            expect(remaining.docs).toHaveLength(3)
          } else {
            // Without transactions: some succeed, some fail
            expect(result.docs).toHaveLength(2)
            expect(result.errors).toHaveLength(1)
            expect(remaining.docs).toHaveLength(1)
          }
        } finally {
          payload.db.bulkOperationsSingleTransaction = originalValue
        }
      })

      it('should log errors when bulk operations fail', async () => {
        // Create a doc that will fail on delete
        const doc = await payload.create({
          collection: 'bulk-error-test',
          data: { shouldFailOnDelete: true, title: 'will-fail' },
        })

        // Spy on the logger
        const errorSpy = vitest.spyOn(payload.logger, 'error')

        try {
          await payload.delete({
            collection: 'bulk-error-test',
            where: { id: { equals: doc.id } },
          })

          // Should have logged the error
          expect(errorSpy).toHaveBeenCalled()
          const logCall = errorSpy.mock.calls.find((call) =>
            (call[0] as { msg?: string })?.msg?.includes('Error deleting document'),
          )
          expect(logCall).toBeDefined()
        } finally {
          errorSpy.mockRestore()
        }
      })
    })

    it('should CRUD point field', async () => {
      const result = await payload.create({
        collection: 'default-values',
        data: {
          point: [5, 10],
        },
      })

      expect(result.point).toEqual([5, 10])
    })

    it('ensure updateMany updates all docs and respects where query', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      await payload.create({
        collection: postsSlug,
        data: {
          title: 'notupdated',
        },
      })

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: `v1 ${i}`,
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        where: {
          title: {
            not_equals: 'notupdated',
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')

      const { docs: notUpdatedDocs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            not_equals: 'updated',
          },
        },
      })

      expect(notUpdatedDocs).toHaveLength(1)
      expect(notUpdatedDocs?.[0]?.title).toBe('notupdated')
    })

    it('ensure updateMany respects limit', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      // Create 11 posts
      for (let i = 0; i < 11; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')

      const { docs: notUpdatedDocs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'not updated',
          },
        },
      })

      expect(notUpdatedDocs).toHaveLength(6)
      expect(notUpdatedDocs?.[0]?.title).toBe('not updated')
      expect(notUpdatedDocs?.[5]?.title).toBe('not updated')
    })

    it('ensure updateMany respects limit and sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            number: i,
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: 'number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)

      for (let i = 0; i < 5; i++) {
        expect(result?.[i]?.number).toBe(i)
        expect(result?.[i]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: 'number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 0; i < 5; i++) {
        expect(docs?.[i]?.number).toBe(i)
        expect(docs?.[i]?.title).toBe('updated')
      }
    })

    it('ensure payload.update operation respects limit and sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            number: i,
            title: 'not updated',
          },
        })
      }

      const result = await payload.update({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: 'number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.docs.length).toBe(5)

      for (let i = 0; i < 5; i++) {
        expect(result?.docs?.[i]?.number).toBe(i)
        expect(result?.docs?.[i]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: 'number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 0; i < 5; i++) {
        expect(docs?.[i]?.number).toBe(i)
        expect(docs?.[i]?.title).toBe('updated')
      }
    })

    it('ensure updateMany respects limit and negative sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            number: i,
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: '-number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)

      for (let i = 10; i > 5; i--) {
        expect(result?.[-i + 10]?.number).toBe(i)
        expect(result?.[-i + 10]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: '-number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 10; i > 5; i--) {
        expect(docs?.[-i + 10]?.number).toBe(i)
        expect(docs?.[-i + 10]?.title).toBe('updated')
      }
    })

    it('ensure payload.update operation respects limit and negative sort', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      const numbers = Array.from({ length: 11 }, (_, i) => i)

      // shuffle the numbers
      numbers.sort(() => Math.random() - 0.5)

      // create 11 documents numbered 0-10, but in random order
      for (const i of numbers) {
        await payload.create({
          collection: postsSlug,
          data: {
            number: i,
            title: 'not updated',
          },
        })
      }

      const result = await payload.update({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 5,
        sort: '-number',
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.docs?.length).toBe(5)

      for (let i = 10; i > 5; i--) {
        expect(result?.docs?.[-i + 10]?.number).toBe(i)
        expect(result?.docs?.[-i + 10]?.title).toBe('updated')
      }

      // Ensure all posts minus the one we don't want updated are updated
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        sort: '-number',
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      for (let i = 10; i > 5; i--) {
        expect(docs?.[-i + 10]?.number).toBe(i)
        expect(docs?.[-i + 10]?.title).toBe('updated')
      }
    })

    it('ensure updateMany correctly handles 0 limit', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: 0,
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts are updated. limit: 0 should mean unlimited
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')
    })

    it('ensure updateMany correctly handles -1 limit', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      // Create 5 posts
      for (let i = 0; i < 5; i++) {
        await payload.create({
          collection: postsSlug,
          data: {
            title: 'not updated',
          },
        })
      }

      const result = await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        limit: -1,
        where: {
          id: {
            exists: true,
          },
        },
      })

      expect(result?.length).toBe(5)
      expect(result?.[0]?.title).toBe('updated')
      expect(result?.[4]?.title).toBe('updated')

      // Ensure all posts are updated. limit: -1 should mean unlimited
      const { docs } = await payload.find({
        collection: postsSlug,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'updated',
          },
        },
      })

      expect(docs).toHaveLength(5)
      expect(docs?.[0]?.title).toBe('updated')
      expect(docs?.[4]?.title).toBe('updated')
    })

    it('ensure updateOne does not create new document if `where` query has no results', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      await payload.db.updateOne({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        where: {
          title: {
            equals: 'does not exist',
          },
        },
      })

      const allPosts = await payload.db.find({
        collection: postsSlug,
        pagination: false,
      })

      expect(allPosts.docs).toHaveLength(0)
    })

    it('ensure updateMany does not create new document if `where` query has no results', async () => {
      await payload.db.deleteMany({
        collection: postsSlug,
        where: {
          id: {
            exists: true,
          },
        },
      })

      await payload.db.updateMany({
        collection: postsSlug,
        data: {
          title: 'updated',
        },
        where: {
          title: {
            equals: 'does not exist',
          },
        },
      })

      const allPosts = await payload.db.find({
        collection: postsSlug,
        pagination: false,
      })

      expect(allPosts.docs).toHaveLength(0)
    })
  })

  describe('Error Handler', () => {
    it('should return proper top-level field validation errors', async () => {
      let errorMessage: string = ''

      try {
        await payload.create({
          collection: postsSlug,
          data: {
            // @ts-expect-error
            title: undefined,
          },
        })
      } catch (e: any) {
        errorMessage = e.message
      }

      expect(errorMessage).toBe('The following field is invalid: Title')
    })

    it('should return validation errors in response', async () => {
      try {
        await payload.create({
          collection: postsSlug,
          data: {
            D1: {
              D2: {
                D3: {
                  // @ts-expect-error
                  D4: {},
                },
              },
            },
            title: 'Title',
          },
        })
      } catch (e: any) {
        expect(e.message).toMatch(
          payload.db.name === 'mongoose'
            ? 'posts validation failed: D1.D2.D3.D4: Cast to string failed for value "{}" (type Object) at path "D4"'
            : payload.db.name === 'sqlite'
              ? 'SQLite3 can only bind numbers, strings, bigints, buffers, and null'
              : '',
        )
      }
    })

    it('should return validation errors with proper field paths for unnamed fields', async () => {
      try {
        await payload.create({
          collection: errorOnUnnamedFieldsSlug,
          data: {
            groupWithinUnnamedTab: {
              // @ts-expect-error
              text: undefined,
            },
          },
        })
      } catch (e: any) {
        expect(e.data?.errors?.[0]?.path).toBe('groupWithinUnnamedTab.text')
      }
    })
  })

  describe('defaultValue', () => {
    it('should set default value from db.create', async () => {
      // call the db adapter create directly to bypass Payload's default value assignment
      const result = await payload.db.create({
        collection: 'default-values',
        data: {
          // for drizzle DBs, we need to pass an array of objects to test subfields
          array: [{ id: 1 }],
          title: 'hello',
        },
        req: undefined,
      })

      expect(result.defaultValue).toStrictEqual('default value from database')
      expect(result.array[0].defaultValue).toStrictEqual('default value from database')
      expect(result.group.defaultValue).toStrictEqual('default value from database')
      expect(result.select).toStrictEqual('default')
      expect(result.point).toStrictEqual({ type: 'Point', coordinates: [10, 20] })
      expect(result.escape).toStrictEqual("Thanks, we're excited for you to join us.")
    })
  })

  describe('Schema generation', { db: 'drizzle' }, () => {
    it('should generate Drizzle Postgres schema', async () => {
      const generatedAdapterName = process.env.PAYLOAD_DATABASE
      if (!generatedAdapterName?.includes('postgres') && generatedAdapterName !== 'supabase') {
        return
      }

      const outputFile = path.resolve(dirname, `${generatedAdapterName}.generated-schema.ts`)

      await payload.db.generateSchema({
        outputFile,
      })

      const module = await import(outputFile)

      // Confirm that the generated module exports every relation
      for (const relation in payload.db.relations) {
        expect(module).toHaveProperty(relation)
      }

      // Confirm that module exports every table
      for (const table in payload.db.tables) {
        expect(module).toHaveProperty(table)
      }

      // Confirm that module exports every enum
      for (const enumName in payload.db.enums) {
        expect(module).toHaveProperty(enumName)
      }
    })

    it('should generate Drizzle SQLite schema', async () => {
      const generatedAdapterName = process.env.PAYLOAD_DATABASE
      if (!generatedAdapterName?.includes('sqlite')) {
        return
      }

      const outputFile = path.resolve(dirname, `${generatedAdapterName}.generated-schema.ts`)

      await payload.db.generateSchema({
        outputFile,
      })

      const module = await import(outputFile)

      // Confirm that the generated module exports every relation
      for (const relation in payload.db.relations) {
        expect(module).toHaveProperty(relation)
      }

      // Confirm that module exports every table
      for (const table in payload.db.tables) {
        expect(module).toHaveProperty(table)
      }
    })
  })

  describe('drizzle: schema hooks', () => {
    beforeAll(() => {
      process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
    })

    // TODO: this test is currently not working, come back to fix in a separate PR, issue: 12907
    it.skip('should add tables with hooks', async () => {
      if (payload.db.name === 'mongoose') {
        return
      }

      let added_table_before: Table
      let added_table_after: Table

      if (payload.db.name.includes('postgres')) {
        const t = (payload.db.pgSchema?.table ?? drizzlePg.pgTable) as typeof drizzlePg.pgTable
        added_table_before = t('added_table_before', {
          id: drizzlePg.serial('id').primaryKey(),
          text: drizzlePg.text('text'),
        })

        added_table_after = t('added_table_after', {
          id: drizzlePg.serial('id').primaryKey(),
          text: drizzlePg.text('text'),
        })
      }

      if (payload.db.name.includes('sqlite')) {
        added_table_before = drizzleSqlite.sqliteTable('added_table_before', {
          id: drizzleSqlite.integer('id').primaryKey(),
          text: drizzleSqlite.text('text'),
        })

        added_table_after = drizzleSqlite.sqliteTable('added_table_after', {
          id: drizzleSqlite.integer('id').primaryKey(),
          text: drizzleSqlite.text('text'),
        })
      }

      payload.db.beforeSchemaInit = [
        ({ schema }) => ({
          ...schema,
          tables: {
            ...schema.tables,
            added_table_before,
          },
        }),
      ]

      payload.db.afterSchemaInit = [
        ({ schema }) => {
          return {
            ...schema,
            tables: {
              ...schema.tables,
              added_table_after,
            },
          }
        },
      ]

      delete payload.db.pool
      await payload.db.init()

      expect(payload.db.tables.added_table_before).toBeDefined()

      await payload.db.connect()

      await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `INSERT into added_table_before (text) VALUES ('some-text')`,
      })

      const res_before = await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: 'SELECT * from added_table_before',
      })
      expect(res_before.rows[0].text).toBe('some-text')

      await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `INSERT into added_table_after (text) VALUES ('some-text')`,
      })

      const res_after = await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `SELECT * from added_table_after`,
      })

      expect(res_after.rows[0].text).toBe('some-text')
    })

    it('should extend the existing table with extra column and modify the existing column with enforcing DB level length', async () => {
      if (payload.db.name === 'mongoose') {
        return
      }

      const isSQLite = payload.db.name === 'sqlite'

      payload.db.afterSchemaInit = [
        ({ extendTable, schema }) => {
          extendTable({
            columns: {
              // SQLite doesn't have DB length enforcement
              ...(payload.db.name === 'postgres' && {
                city: drizzlePg.varchar('city', { length: 10 }),
              }),
              extraColumn: isSQLite
                ? drizzleSqlite.integer('extra_column')
                : drizzlePg.integer('extra_column'),
            },
            table: schema.tables.places,
          })

          return schema
        },
      ]

      delete payload.db.pool
      await payload.db.init()
      await payload.db.connect()

      expect(payload.db.tables.places.extraColumn).toBeDefined()

      await payload.create({
        collection: 'places',
        data: {
          city: 'Berlin',
          country: 'Germany',
        },
      })

      const tableName = payload.db.schemaName ? `"${payload.db.schemaName}"."places"` : 'places'

      await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `UPDATE ${tableName} SET extra_column = 10`,
      })

      const res_with_extra_col = await payload.db.execute({
        drizzle: payload.db.drizzle,
        raw: `SELECT * from ${tableName}`,
      })

      expect(res_with_extra_col.rows[0].extra_column).toBe(10)

      // SQLite doesn't have DB length enforcement
      if (payload.db.name === 'postgres') {
        await expect(
          payload.db.execute({
            drizzle: payload.db.drizzle,
            raw: `UPDATE ${tableName} SET city = 'MoreThan10Chars'`,
          }),
        ).rejects.toBeTruthy()
      }
    })

    it('should extend the existing table with composite unique and throw ValidationError on it', async () => {
      if (payload.db.name === 'mongoose') {
        return
      }

      const isSQLite = payload.db.name === 'sqlite'

      payload.db.afterSchemaInit = [
        ({ extendTable, schema }) => {
          extendTable({
            extraConfig: (t) => ({
              uniqueOnCityAndCountry: (isSQLite ? drizzleSqlite : drizzlePg)
                .unique()
                .on(t.city, t.country),
            }),
            table: schema.tables.places,
          })

          return schema
        },
      ]

      delete payload.db.pool
      await payload.db.init()
      await payload.db.connect()

      await payload.create({
        collection: 'places',
        data: {
          city: 'A',
          country: 'B',
        },
      })

      await expect(
        payload.create({
          collection: 'places',
          data: {
            city: 'C',
            country: 'B',
          },
        }),
      ).resolves.toBeTruthy()

      await expect(
        payload.create({
          collection: 'places',
          data: {
            city: 'A',
            country: 'D',
          },
        }),
      ).resolves.toBeTruthy()

      await expect(
        payload.create({
          collection: 'places',
          data: {
            city: 'A',
            country: 'B',
          },
        }),
      ).rejects.toBeTruthy()
    })
  })

  describe('virtual fields', () => {
    it('should not save a field with `virtual: true` to the db', async () => {
      const createRes = await payload.create({
        collection: 'fields-persistance',
        data: { array: [], text: 'asd', textHooked: 'asd' },
      })

      const resLocal = await payload.findByID({
        id: createRes.id,
        collection: 'fields-persistance',
      })

      const resDb = (await payload.db.findOne({
        collection: 'fields-persistance',
        req: {} as PayloadRequest,
        where: { id: { equals: createRes.id } },
      })) as Record<string, unknown>

      expect(resDb.text).toBeUndefined()
      expect(resDb.array).toBeUndefined()
      expect(resDb.textHooked).toBeUndefined()

      expect(resLocal.textHooked).toBe('hooked')
    })

    it('should not save a nested field to tabs/row/collapsible with virtual: true to the db', async () => {
      const res = await payload.create({
        collection: 'fields-persistance',
        data: {
          textWithinCollapsible: '1',
          textWithinRow: '2',
          textWithinTabs: '3',
        },
      })

      expect(res.textWithinCollapsible).toBeUndefined()
      expect(res.textWithinRow).toBeUndefined()
      expect(res.textWithinTabs).toBeUndefined()
    })

    it('should allow virtual field with reference', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { post: post.id },
        depth: 0,
      })

      const doc = await payload.findByID({ id, collection: 'virtual-relations', depth: 0 })
      expect(doc.postTitle).toBe('my-title')
      const draft = await payload.find({
        collection: 'virtual-relations',
        depth: 0,
        where: { id: { equals: id } },
      })
      expect(draft.docs[0]?.postTitle).toBe('my-title')
    })

    it('should not break when using select', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title-10' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { post: post.id },
        depth: 0,
      })

      const doc = await payload.findByID({
        id,
        collection: 'virtual-relations',
        depth: 0,
        select: { postTitle: true },
      })
      expect(doc.postTitle).toBe('my-title-10')
    })

    it('should respect hidden: true for virtual fields with reference', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title-3' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { post: post.id },
        depth: 0,
      })

      const doc = await payload.findByID({ id, collection: 'virtual-relations', depth: 0 })
      expect(doc.postTitleHidden).toBeUndefined()

      const doc_show = await payload.findByID({
        id,
        collection: 'virtual-relations',
        depth: 0,
        showHiddenFields: true,
      })
      expect(doc_show.postTitleHidden).toBe('my-title-3')
    })

    it('should allow virtual field as reference to ID', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'my-title' } })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { post: post.id },
        depth: 0,
      })

      const docDepth2 = await payload.findByID({ id, collection: 'virtual-relations' })
      expect(docDepth2.postID).toBe(post.id)
      const docDepth0 = await payload.findByID({ id, collection: 'virtual-relations', depth: 0 })
      expect(docDepth0.postID).toBe(post.id)
    })

    it('should allow virtual field as reference to custom ID', async () => {
      const customID = await payload.create({ collection: 'custom-ids', data: {} })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { customID: customID.id },
        depth: 0,
      })

      const docDepth2 = await payload.findByID({ id, collection: 'virtual-relations' })
      expect(docDepth2.customIDValue).toBe(customID.id)
      const docDepth0 = await payload.findByID({
        id,
        collection: 'virtual-relations',
        depth: 0,
      })
      expect(docDepth0.customIDValue).toBe(customID.id)
    })

    it('should allow deep virtual field as reference to ID', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: 'category-3' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { category: category.id, title: 'my-title-3' },
      })
      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { post: post.id },
        depth: 0,
      })

      const docDepth2 = await payload.findByID({ id, collection: 'virtual-relations' })
      expect(docDepth2.postCategoryID).toBe(category.id)
      const docDepth0 = await payload.findByID({ id, collection: 'virtual-relations', depth: 0 })
      expect(docDepth0.postCategoryID).toBe(category.id)
    })

    it('should allow virtual field with reference localized', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: { localized: 'localized en', title: 'my-title' },
      })

      await payload.update({
        id: post.id,
        collection: 'posts',
        data: { localized: 'localized es' },
        locale: 'es',
      })

      const { id } = await payload.create({
        collection: 'virtual-relations',
        data: { post: post.id },
        depth: 0,
      })

      let doc = await payload.findByID({ id, collection: 'virtual-relations', depth: 0 })
      expect(doc.postLocalized).toBe('localized en')

      doc = await payload.findByID({ id, collection: 'virtual-relations', depth: 0, locale: 'es' })
      expect(doc.postLocalized).toBe('localized es')
    })

    it('should allow to query by a virtual field with reference', async () => {
      await payload.delete({ collection: 'posts', where: {} })
      await payload.delete({ collection: 'virtual-relations', where: {} })
      const post_1 = await payload.create({ collection: 'posts', data: { title: 'Dan' } })
      const post_2 = await payload.create({ collection: 'posts', data: { title: 'Mr.Dan' } })

      const doc_1 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_1.id },
        depth: 0,
      })
      const doc_2 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_2.id },
        depth: 0,
      })

      const { docs: ascDocs } = await payload.find({
        collection: 'virtual-relations',
        depth: 0,
        sort: 'postTitle',
      })

      expect(ascDocs[0]?.id).toBe(doc_1.id)

      expect(ascDocs[1]?.id).toBe(doc_2.id)

      const { docs: descDocs } = await payload.find({
        collection: 'virtual-relations',
        depth: 0,
        sort: '-postTitle',
      })

      expect(descDocs[1]?.id).toBe(doc_1.id)

      expect(descDocs[0]?.id).toBe(doc_2.id)
    })

    it('should allow virtual field 2x deep', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: '1-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { category: category.id, title: '1-post' },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })
      expect(doc.postCategoryTitle).toBe('1-category')
    })

    it('should not break when using select 2x deep', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: '3-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { category: category.id, title: '3-post' },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })

      const docWithSelect = await payload.findByID({
        id: doc.id,
        collection: 'virtual-relations',
        depth: 0,
        select: { postCategoryTitle: true },
      })
      expect(docWithSelect.postCategoryTitle).toBe('3-category')
    })

    it('should allow to query by virtual field 2x deep', async () => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: '2-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { category: category.id, title: '2-post' },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })
      const found = await payload.find({
        collection: 'virtual-relations',
        where: { postCategoryTitle: { equals: '2-category' } },
      })
      expect(found.docs).toHaveLength(1)
      expect(found.docs[0].id).toBe(doc.id)
    })

    it('should allow to query by virtual field 2x deep with draft:true', async () => {
      await payload.delete({ collection: 'virtual-relations', where: {} })
      const category = await payload.create({
        collection: 'categories',
        data: { title: '3-category' },
      })
      const post = await payload.create({
        collection: 'posts',
        data: { category: category.id, title: '3-post' },
      })
      const doc = await payload.create({ collection: 'virtual-relations', data: { post: post.id } })
      const found = await payload.find({
        collection: 'virtual-relations',
        draft: true,
        where: { postCategoryTitle: { equals: '3-category' } },
      })
      expect(found.docs).toHaveLength(1)
      expect(found.docs[0].id).toBe(doc.id)
    })

    it('should allow referenced virtual field in globals', async () => {
      const post = await payload.create({ collection: 'posts', data: { title: 'post' } })
      const globalData = await payload.updateGlobal({
        slug: 'virtual-relation-global',
        data: { post: post.id },
        depth: 0,
      })
      expect(globalData.postTitle).toBe('post')
    })

    it('should allow to sort by a virtual field with a reference to an ID', async () => {
      await payload.delete({ collection: 'virtual-relations', where: {} })
      const category_1 = await payload.create({
        collection: 'categories-custom-id',
        data: { id: 1 },
      })
      const category_2 = await payload.create({
        collection: 'categories-custom-id',
        data: { id: 2 },
      })
      const post_1 = await payload.create({
        collection: 'posts',
        data: { categoryCustomID: category_1.id, title: 'p-1' },
      })
      const post_2 = await payload.create({
        collection: 'posts',
        data: { categoryCustomID: category_2.id, title: 'p-2' },
      })
      const virtual_1 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_1.id },
      })
      const virtual_2 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_2.id },
      })

      const res = (
        await payload.find({
          collection: 'virtual-relations',
          sort: 'postCategoryCustomID',
        })
      ).docs
      expect(res[0].id).toBe(virtual_1.id)
      expect(res[1].id).toBe(virtual_2.id)

      const res2 = (
        await payload.find({
          collection: 'virtual-relations',
          sort: '-postCategoryCustomID',
        })
      ).docs
      expect(res2[1].id).toBe(virtual_1.id)
      expect(res2[0].id).toBe(virtual_2.id)
    })

    it('should allow to sort by a virtual field with a refence, Local / GraphQL', async () => {
      const post_1 = await payload.create({ collection: 'posts', data: { title: 'A' } })
      const post_2 = await payload.create({ collection: 'posts', data: { title: 'B' } })
      const doc_1 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_1 },
      })
      const doc_2 = await payload.create({
        collection: 'virtual-relations',
        data: { post: post_2 },
      })

      const queryDesc = `query {
        VirtualRelations(
          where: {OR: [{ id: { equals: ${JSON.stringify(doc_1.id)} } }, { id: { equals: ${JSON.stringify(doc_2.id)} } }],
        }, sort: "-postTitle") {
          docs {
            id
          }
        }
      }`

      const {
        data: {
          VirtualRelations: { docs: graphqlDesc },
        },
      } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryDesc }) })
        .then((res) => res.json())

      const { docs: localDesc } = await payload.find({
        collection: 'virtual-relations',
        sort: '-postTitle',
        where: { id: { in: [doc_1.id, doc_2.id] } },
      })

      expect(graphqlDesc[0].id).toBe(doc_2.id)
      expect(graphqlDesc[1].id).toBe(doc_1.id)
      expect(localDesc[0].id).toBe(doc_2.id)
      expect(localDesc[1].id).toBe(doc_1.id)

      const queryAsc = `query {
        VirtualRelations(
          where: {OR: [{ id: { equals: ${JSON.stringify(doc_1.id)} } }, { id: { equals: ${JSON.stringify(doc_2.id)} } }],
        }, sort: "postTitle") {
          docs {
            id
          }
        }
      }`

      const {
        data: {
          VirtualRelations: { docs: graphqlAsc },
        },
      } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query: queryAsc }) })
        .then((res) => res.json())

      const { docs: localAsc } = await payload.find({
        collection: 'virtual-relations',
        sort: 'postTitle',
        where: { id: { in: [doc_1.id, doc_2.id] } },
      })

      expect(graphqlAsc[1].id).toBe(doc_2.id)
      expect(graphqlAsc[0].id).toBe(doc_1.id)
      expect(localAsc[1].id).toBe(doc_2.id)
      expect(localAsc[0].id).toBe(doc_1.id)
    })

    it('should allow to sort by a virtual field without error', async () => {
      await payload.delete({ collection: fieldsPersistanceSlug, where: {} })
      await payload.create({
        collection: fieldsPersistanceSlug,
        data: {},
      })
      const { docs } = await payload.find({
        collection: fieldsPersistanceSlug,
        sort: '-textHooked',
      })
      expect(docs).toHaveLength(1)
    })

    it('should automatically add hasMany: true to a virtual field that references a hasMany relationship', () => {
      const field = payload.collections['virtual-relations'].config.fields.find(
        (each) => 'name' in each && each.name === 'postsTitles',
      )!

      expect('hasMany' in field && field.hasMany).toBe(true)
    })

    it('should the value populate with hasMany: true relationship field', async () => {
      await payload.delete({ collection: 'categories', where: {} })
      await payload.delete({ collection: 'posts', where: {} })
      await payload.delete({ collection: 'virtual-relations', where: {} })

      const post1 = await payload.create({ collection: 'posts', data: { title: 'post 1' } })
      const post2 = await payload.create({ collection: 'posts', data: { title: 'post 2' } })

      const res = await payload.create({
        collection: 'virtual-relations',
        data: { posts: [post1.id, post2.id] },
        depth: 0,
      })
      expect(res.postsTitles).toEqual(['post 1', 'post 2'])
    })

    it('should the value populate with nested hasMany: true relationship field', async () => {
      await payload.delete({ collection: 'categories', where: {} })
      await payload.delete({ collection: 'posts', where: {} })
      await payload.delete({ collection: 'virtual-relations', where: {} })

      const category_1 = await payload.create({
        collection: 'categories',
        data: { title: 'category 1' },
      })
      const category_2 = await payload.create({
        collection: 'categories',
        data: { title: 'category 2' },
      })
      const post1 = await payload.create({
        collection: 'posts',
        data: { categories: [category_1.id, category_2.id], title: 'post 1' },
      })

      const res = await payload.create({
        collection: 'virtual-relations',
        data: { post: post1.id },
        depth: 0,
      })
      expect(res.postCategoriesTitles).toEqual(['category 1', 'category 2'])
    })
  })

  it('should convert numbers to text', async () => {
    const result = await payload.create({
      collection: postsSlug,
      data: {
        title: 'testing',
        // @ts-expect-error hardcoding a number and expecting that it will convert to string
        text: 1,
      },
    })

    expect(result.text).toStrictEqual('1')
  })

  it('should convert strings to numbers in hasMany number fields', async () => {
    const result = await payload.create({
      collection: postsSlug,
      data: {
        title: 'testing-numbers-hasMany',
        // @ts-expect-error passing strings when numbers are expected
        numbersHasMany: ['10', '20', '30'],
      },
    })

    expect(result.numbersHasMany).toEqual([10, 20, 30])
  })

  it('should store and retrieve date fields as ISO strings', async () => {
    const testDate = new Date('2024-01-15T10:30:00.000Z')

    const result = await payload.create({
      collection: postsSlug,
      data: {
        publishDate: testDate,
        title: 'testing-date-field',
      },
    })

    // Dates should be stored as ISO strings
    expect(typeof result.publishDate).toBe('string')
    expect(result.publishDate).toBe('2024-01-15T10:30:00.000Z')

    // Reading back should also return ISO string
    const retrieved = await payload.findByID({
      id: result.id,
      collection: postsSlug,
    })

    expect(typeof retrieved.publishDate).toBe('string')
    expect(retrieved.publishDate).toBe('2024-01-15T10:30:00.000Z')
  })

  it('should convert Unix timestamps to ISO strings for date fields', async () => {
    // Unix timestamp for 2024-01-15T10:30:00.000Z
    const unixTimestamp = 1705314600000

    // Using payload.db.create to bypass Payload's validation and test adapter coercion
    const result = await payload.db.create({
      collection: postsSlug,
      data: {
        publishDate: unixTimestamp,
        title: 'testing-date-coercion',
      },
      req: {} as any,
    })

    // Should be converted to ISO string
    expect(typeof result.publishDate).toBe('string')
    expect(result.publishDate).toBe('2024-01-15T10:30:00.000Z')
  })

  it('should not allow to query by a field with `virtual: true`', async () => {
    await expect(
      payload.find({
        collection: 'fields-persistance',
        where: { text: { equals: 'asd' } },
      }),
    ).rejects.toThrow(QueryError)
  })

  it('should not allow document creation with relationship data to an invalid document ID', async () => {
    let invalidDoc

    // mongo requires ObjectId, postgres UUID and content-api number (wrong type for text ID)
    const invalidId = payload.db.name === 'content_api' ? 1 : 'not-real-id'

    try {
      invalidDoc = await payload.create({
        collection: 'relation-b',
        data: { relationship: invalidId, title: 'invalid' },
      })
    } catch (error) {
      // instanceof checks don't work with libsql
      expect(error).toBeTruthy()
    }

    expect(invalidDoc).toBeUndefined()

    const relationBDocs = await payload.find({
      collection: 'relation-b',
    })

    expect(relationBDocs.docs).toHaveLength(0)
  })

  it('should upsert', async () => {
    const postShouldCreated = await payload.db.upsert({
      collection: postsSlug,
      data: {
        title: 'some-title-here',
      },
      req: {},
      where: {
        title: {
          equals: 'some-title-here',
        },
      },
    })

    expect(postShouldCreated).toBeTruthy()

    const postShouldUpdated = await payload.db.upsert({
      collection: postsSlug,
      data: {
        title: 'some-title-here',
      },
      req: {},
      where: {
        title: {
          equals: 'some-title-here',
        },
      },
    })

    // Should stay the same ID
    expect(postShouldCreated.id).toBe(postShouldUpdated.id)
  })

  it('should apply default values on upsert insert but not on update', async () => {
    // TODO: remove this as soon as It's fixed in the other database adapters
    if (payload.db.name !== 'mongoose') {
      return
    }
    // First upsert (INSERT): should apply defaults
    const inserted = await payload.db.upsert({
      collection: defaultValuesSlug,
      data: {
        title: 'upsert-test',
        // Don't pass defaultValue field - should be auto-applied
      },
      req: {},
      where: {
        title: {
          equals: 'upsert-test',
        },
      },
    })

    // Defaults should be applied on insert
    expect(inserted.defaultValue).toBe('default value from database')
    expect(inserted.select).toBe('default')
    expect(inserted.point).toStrictEqual({ type: 'Point', coordinates: [10, 20] })

    // Second upsert (UPDATE): should NOT overwrite existing values with defaults
    const updated = await payload.db.upsert({
      collection: defaultValuesSlug,
      data: {
        defaultValue: 'custom value', // Explicitly set a different value
        select: 'option0', // Change from default
        title: 'upsert-test',
      },
      req: {},
      where: {
        title: {
          equals: 'upsert-test',
        },
      },
    })

    // Should stay the same ID
    expect(inserted.id).toBe(updated.id)

    // Custom values should be preserved, not overwritten with defaults
    expect(updated.defaultValue).toBe('custom value')
    expect(updated.select).toBe('option0')
    expect(updated.point).toStrictEqual({ type: 'Point', coordinates: [10, 20] })

    // Third upsert (UPDATE) with partial data: should NOT apply defaults to missing fields
    const partialUpdate = await payload.db.upsert({
      collection: defaultValuesSlug,
      data: {
        title: 'upsert-test-updated',
        // Don't pass defaultValue or select - should NOT reset to defaults
      },
      req: {},
      where: {
        title: {
          equals: 'upsert-test',
        },
      },
    })

    // Should stay the same ID
    expect(inserted.id).toBe(partialUpdate.id)

    // Previous values should be preserved (not reset to defaults)
    expect(partialUpdate.defaultValue).toBe('custom value')
    expect(partialUpdate.select).toBe('option0')
    expect(partialUpdate.title).toBe('upsert-test-updated')
  })

  it('should enforce unique ids on db level even after delete', async () => {
    const { id } = await payload.create({ collection: postsSlug, data: { title: 'ASD' } })
    await payload.delete({ id, collection: postsSlug })
    const { id: id_2 } = await payload.create({ collection: postsSlug, data: { title: 'ASD' } })
    expect(id_2).not.toBe(id)
  })

  it('payload.db.createGlobal should have globalType, updatedAt, createdAt fields', async () => {
    const timestamp = Date.now()
    let result = (await payload.db.createGlobal({
      slug: 'global-2',
      data: { text: 'this is global-2' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-2')
    expect(result.globalType).toBe('global-2')
    expect(timestamp).toBeLessThanOrEqual(new Date(result.createdAt as string).getTime())
    expect(timestamp).toBeLessThanOrEqual(new Date(result.updatedAt as string).getTime())

    const createdAt = new Date(result.createdAt as string).getTime()

    result = (await payload.db.updateGlobal({
      slug: 'global-2',
      data: { text: 'this is global-2 but updated' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-2 but updated')
    expect(result.globalType).toBe('global-2')
    expect(createdAt).toEqual(new Date(result.createdAt as string).getTime())
    expect(createdAt).toBeLessThan(new Date(result.updatedAt as string).getTime())
  })

  it('payload.updateGlobal should have globalType, updatedAt, createdAt fields', async () => {
    const timestamp = Date.now()
    let result = (await payload.updateGlobal({
      slug: 'global-3',
      data: { text: 'this is global-3' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-3')
    expect(result.globalType).toBe('global-3')
    expect(timestamp).toBeLessThanOrEqual(new Date(result.createdAt as string).getTime())
    expect(timestamp).toBeLessThanOrEqual(new Date(result.updatedAt as string).getTime())

    const createdAt = new Date(result.createdAt as string).getTime()

    result = (await payload.updateGlobal({
      slug: 'global-3',
      data: { text: 'this is global-3 but updated' },
    })) as { globalType: string } & Global2

    expect(result.text).toBe('this is global-3 but updated')
    expect(result.globalType).toBe('global-3')
    expect(createdAt).toEqual(new Date(result.createdAt as string).getTime())
    expect(createdAt).toBeLessThan(new Date(result.updatedAt as string).getTime())
  })

  it('should group where conditions with AND', async () => {
    // create 2 docs
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'post 1',
      },
    })

    const doc2 = await payload.create({
      collection: postsSlug,
      data: {
        title: 'post 2',
      },
    })

    const query1 = await payload.find({
      collection: postsSlug,
      where: {
        id: {
          // where order, `in` last
          in: [doc2.id],
          not_in: [],
        },
      },
    })

    const query2 = await payload.find({
      collection: postsSlug,
      where: {
        id: {
          // where order, `in` first
          in: [doc2.id],
          not_in: [],
        },
      },
    })

    const query3 = await payload.find({
      collection: postsSlug,
      where: {
        and: [
          {
            id: {
              in: [doc2.id],
              not_in: [],
            },
          },
        ],
      },
    })

    expect(query1.totalDocs).toEqual(1)
    expect(query2.totalDocs).toEqual(1)
    expect(query3.totalDocs).toEqual(1)
  })

  it('db.deleteOne should not fail if query does not resolve to any document', async () => {
    await expect(
      payload.db.deleteOne({
        collection: 'posts',
        returning: false,
        where: { title: { equals: 'some random title' } },
      }),
    ).resolves.toBeNull()
  })

  it('mongodb additional keys stripping', async () => {
    if (payload.db.name !== 'mongoose') {
      return
    }

    const arrItemID = randomUUID()
    const res = await payload.db.collections[postsSlug]?.collection.insertOne({
      arrayWithIDs: [
        {
          id: arrItemID,
          additionalKeyInArray: 'true',
          text: 'existing key',
        },
      ],
      SECRET_FIELD: 'secret data',
    })

    let payloadRes: any = await payload.findByID({
      id: res!.insertedId.toHexString(),
      collection: postsSlug,
    })

    expect(payloadRes.id).toBe(res!.insertedId.toHexString())
    expect(payloadRes['SECRET_FIELD']).toBeUndefined()
    expect(payloadRes.arrayWithIDs).toBeDefined()
    expect(payloadRes.arrayWithIDs[0].id).toBe(arrItemID)
    expect(payloadRes.arrayWithIDs[0].text).toBe('existing key')
    expect(payloadRes.arrayWithIDs[0].additionalKeyInArray).toBeUndefined()

    // But allows when allowAdditionaKeys is true
    payload.db.allowAdditionalKeys = true

    payloadRes = await payload.findByID({
      id: res!.insertedId.toHexString(),
      collection: postsSlug,
    })

    expect(payloadRes.id).toBe(res!.insertedId.toHexString())
    expect(payloadRes['SECRET_FIELD']).toBe('secret data')
    expect(payloadRes.arrayWithIDs[0].additionalKeyInArray).toBe('true')

    payload.db.allowAdditionalKeys = false
  })

  it('should not crash when the version field is not selected', async () => {
    const customID = await payload.create({ collection: 'custom-ids', data: {} })
    const res = await payload.db.queryDrafts({
      collection: 'custom-ids',
      select: { parent: true },
      where: { parent: { equals: customID.id } },
    })

    expect(res.docs[0].id).toBe(customID.id)
  })

  it('deep nested arrays', async () => {
    await payload.updateGlobal({
      slug: 'header',
      data: { itemsLvl1: [{ itemsLvl2: [{ itemsLvl3: [{ itemsLvl4: [{ label: 'label' }] }] }] }] },
    })

    const header = await payload.findGlobal({ slug: 'header' })

    expect(header.itemsLvl1[0]?.itemsLvl2[0]?.itemsLvl3[0]?.itemsLvl4[0]?.label).toBe('label')
  })

  it('should count with a query that contains subqueries', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'new-category' },
    })
    const post = await payload.create({
      collection: 'posts',
      data: { category: category.id, title: 'new-post' },
    })

    const result_1 = await payload.count({
      collection: 'posts',
      where: {
        'category.title': {
          equals: 'new-category',
        },
      },
    })

    expect(result_1.totalDocs).toBe(1)

    const result_2 = await payload.count({
      collection: 'posts',
      where: {
        'category.title': {
          equals: 'non-existing-category',
        },
      },
    })

    expect(result_2.totalDocs).toBe(0)
  })

  it('can have localized and non localized blocks', async () => {
    const res = await payload.create({
      collection: 'blocks-docs',
      data: {
        testBlocks: [{ blockType: 'cta', text: 'text' }],
        testBlocksLocalized: [{ blockType: 'cta', text: 'text-localized' }],
      },
    })

    expect(res.testBlocks[0]?.text).toBe('text')
    expect(res.testBlocksLocalized[0]?.text).toBe('text-localized')
  })

  it('should support in with null', async () => {
    await payload.delete({ collection: 'posts', where: {} })
    const post_1 = await payload.create({
      collection: 'posts',
      data: { text: 'text-1', title: 'a' },
    })
    const post_2 = await payload.create({
      collection: 'posts',
      data: { text: 'text-2', title: 'a' },
    })
    const post_3 = await payload.create({
      collection: 'posts',
      data: { text: 'text-3', title: 'a' },
    })
    const post_null = await payload.create({
      collection: 'posts',
      data: { text: null, title: 'a' },
    })

    const { docs } = await payload.find({
      collection: 'posts',
      where: { text: { in: ['text-1', 'text-3', null] } },
    })
    expect(docs).toHaveLength(3)
    expect(docs[0].id).toBe(post_null.id)
    expect(docs[1].id).toBe(post_3.id)
    expect(docs[2].id).toBe(post_1.id)
  })

  it('should throw specific unique contraint errors', async () => {
    await payload.create({
      collection: 'unique-fields',
      data: {
        slugField: 'unique-text',
      },
    })

    try {
      await payload.create({
        collection: 'unique-fields',
        data: {
          slugField: 'unique-text',
        },
      })
    } catch (e) {
      const error = e as ValidationError
      expect(error.message).toEqual('The following field is invalid: slugField')
      expect(error.data.collection).toEqual('unique-fields')
    }
  })

  it('should throw unique constraint errors in optimized update path', async () => {
    await payload.create({
      collection: 'unique-fields',
      data: {
        slugField: 'optimized-unique-1',
      },
    })

    const doc2 = await payload.create({
      collection: 'unique-fields',
      data: {
        slugField: 'optimized-unique-2',
      },
    })

    // This update goes through the optimized path (shouldUseOptimizedUpsertRow) in db-drizzle
    // because it's a simple field update with an existing ID
    try {
      await payload.update({
        id: doc2.id,
        collection: 'unique-fields',
        data: {
          slugField: 'optimized-unique-1', // Try to set to doc1's unique value
        },
      })
    } catch (e) {
      const error = e as ValidationError
      expect(error.message).toEqual('The following field is invalid: slugField')
      expect(error.data.collection).toEqual('unique-fields')
    }
  })

  it('should use optimized updateOne', async () => {
    const post = await payload.create({
      collection: 'posts',
      data: {
        arrayWithIDs: [{ text: 'some text' }],
        group: { text: 'in group' },
        tab: { text: 'in tab' },
        text: 'other text (should not be nuked)',
        title: 'hello',
      },
    })
    const res = (await payload.db.updateOne({
      collection: 'posts',
      data: {
        group: { text: 'in group updated' },
        tab: { text: 'in tab updated' },
        title: 'hello updated',
      },
      where: { id: { equals: post.id } },
    })) as unknown as DataFromCollectionSlug<'posts'>

    expect(res.title).toBe('hello updated')
    expect(res.text).toBe('other text (should not be nuked)')
    expect(res.group?.text).toBe('in group updated')
    expect(res.tab?.text).toBe('in tab updated')
    expect(res.arrayWithIDs).toHaveLength(1)
    expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
  })

  it('should use optimized updateMany', async () => {
    const post1 = await payload.create({
      collection: 'posts',
      data: {
        arrayWithIDs: [{ text: 'some text' }],
        group: { text: 'in group' },
        tab: { text: 'in tab' },
        text: 'other text (should not be nuked)',
        title: 'hello',
      },
    })
    const post2 = await payload.create({
      collection: 'posts',
      data: {
        arrayWithIDs: [{ text: 'some text' }],
        group: { text: 'in group' },
        tab: { text: 'in tab' },
        text: 'other text 2 (should not be nuked)',
        title: 'hello',
      },
    })

    const res = (await payload.db.updateMany({
      collection: 'posts',
      data: {
        group: { text: 'in group updated' },
        tab: { text: 'in tab updated' },
        title: 'hello updated',
      },
      where: { id: { in: [post1.id, post2.id] } },
    })) as unknown as Array<DataFromCollectionSlug<'posts'>>

    expect(res).toHaveLength(2)
    const resPost1 = res?.find((r) => r.id === post1.id)
    const resPost2 = res?.find((r) => r.id === post2.id)
    expect(resPost1?.text).toBe('other text (should not be nuked)')
    expect(resPost2?.text).toBe('other text 2 (should not be nuked)')

    for (const post of res) {
      expect(post.title).toBe('hello updated')
      expect(post.group?.text).toBe('in group updated')
      expect(post.tab?.text).toBe('in tab updated')
      expect(post.arrayWithIDs).toHaveLength(1)
      expect(post.arrayWithIDs?.[0]?.text).toBe('some text')
    }
  })

  it('should allow creating docs with payload.db.create with custom ID', async () => {
    if (payload.db.name === 'mongoose') {
      const customId = new mongoose.Types.ObjectId().toHexString()
      const res = await payload.db.create({
        collection: 'simple',
        customID: customId,
        data: {
          text: 'Test with custom ID',
        },
      })

      expect(res.id).toBe(customId)
    } else {
      const id = payload.db.defaultIDType === 'text' ? randomUUID() : 95231
      const res = await payload.db.create({
        collection: 'simple',
        customID: id,
        data: {
          text: 'Test with custom ID',
        },
      })

      expect(res.id).toBe(id)
    }
  })

  it('should allow to query like by ID with draft: true', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { title: 'category123' },
    })
    const res = await payload.find({
      collection: 'categories',
      draft: true,
      where: { id: { like: typeof category.id === 'number' ? `${category.id}` : category.id } },
    })
    expect(res.docs).toHaveLength(1)
    expect(res.docs[0].id).toBe(category.id)
  })

  it('should allow incremental number update', async () => {
    const post = await payload.create({ collection: 'posts', data: { number: 1, title: 'post' } })

    const res = (await payload.db.updateOne({
      collection: 'posts',
      data: {
        number: {
          $inc: 10,
        },
      },
      where: { id: { equals: post.id } },
    })) as unknown as Post

    expect(res.number).toBe(11)

    const res2 = (await payload.db.updateOne({
      collection: 'posts',
      data: {
        number: {
          $inc: -3,
        },
      },
      where: { id: { equals: post.id } },
    })) as unknown as Post

    expect(res2.number).toBe(8)
  })

  describe('array $push', () => {
    it('should allow atomic array updates and $inc', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDs: [
            {
              text: 'some text',
            },
          ],
          number: 10,
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          arrayWithIDs: {
            $push: {
              id: new mongoose.Types.ObjectId().toHexString(),
              text: 'some text 2',
            },
          },
          number: {
            $inc: 5,
          },
        },
      })) as unknown as Post

      expect(res.arrayWithIDs).toHaveLength(2)
      expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDs?.[1]?.text).toBe('some text 2')
      expect(res.number).toBe(15)
    })

    it('should allow atomic array updates using $push with single value, unlocalized', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDs: [
            {
              text: 'some text',
            },
          ],
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          arrayWithIDs: {
            $push: {
              id: new mongoose.Types.ObjectId().toHexString(),
              text: 'some text 2',
            },
          },
        },
      })) as unknown as Post

      expect(res.arrayWithIDs).toHaveLength(2)
      expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDs?.[1]?.text).toBe('some text 2')
    })
    it('should allow atomic array updates using $push with single value, localized field within array', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDs: [
            {
              text: 'some text',
              textLocalized: 'Some text localized',
            },
          ],
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          // Locales used => no optimized row update => need to pass full data, incuding title
          arrayWithIDs: {
            $push: {
              id: new mongoose.Types.ObjectId().toHexString(),
              text: 'some text 2',
              textLocalized: {
                en: 'Some text 2 localized',
                es: 'Algun texto 2 localizado',
              },
            },
          },
          title: 'post',
        },
      })) as unknown as Post

      expect(res.arrayWithIDs).toHaveLength(2)
      expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDs?.[0]?.textLocalized).toEqual({
        en: 'Some text localized',
      })
      expect(res.arrayWithIDs?.[1]?.text).toBe('some text 2')
      expect(res.arrayWithIDs?.[1]?.textLocalized).toEqual({
        en: 'Some text 2 localized',
        es: 'Algun texto 2 localizado',
      })
    })

    it('should allow atomic array updates using $push with single value, localized array', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDsLocalized: [
            {
              text: 'some text',
            },
          ],
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          // Locales used => no optimized row update => need to pass full data, incuding title
          arrayWithIDsLocalized: {
            en: {
              $push: {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 2',
              },
            },
            es: {
              $push: {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 2 es',
              },
            },
          },
          title: 'post',
        },
      })) as unknown as Post

      expect(res.arrayWithIDsLocalized?.en).toHaveLength(2)
      expect(res.arrayWithIDsLocalized?.en?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDsLocalized?.en?.[1]?.text).toBe('some text 2')

      expect(res.arrayWithIDsLocalized?.es).toHaveLength(1)
      expect(res.arrayWithIDsLocalized?.es?.[0]?.text).toBe('some text 2 es')
    })

    it('should allow atomic array updates using $push with multiple values, unlocalized', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDs: [
            {
              text: 'some text',
            },
          ],
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          arrayWithIDs: {
            $push: [
              {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 2',
              },
              {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 3',
              },
            ],
          },
        },
      })) as unknown as Post

      expect(res.arrayWithIDs).toHaveLength(3)
      expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDs?.[1]?.text).toBe('some text 2')
      expect(res.arrayWithIDs?.[2]?.text).toBe('some text 3')
    })

    it('should allow atomic array updates using $push with multiple values, localized field within array', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDs: [
            {
              text: 'some text',
              textLocalized: 'Some text localized',
            },
          ],
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          // Locales used => no optimized row update => need to pass full data, incuding title
          arrayWithIDs: {
            $push: [
              {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 2',
                textLocalized: {
                  en: 'Some text 2 localized',
                  es: 'Algun texto 2 localizado',
                },
              },
              {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 3',
                textLocalized: {
                  en: 'Some text 3 localized',
                  es: 'Algun texto 3 localizado',
                },
              },
            ],
          },
          title: 'post',
        },
      })) as unknown as Post

      expect(res.arrayWithIDs).toHaveLength(3)
      expect(res.arrayWithIDs?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDs?.[1]?.text).toBe('some text 2')
      expect(res.arrayWithIDs?.[2]?.text).toBe('some text 3')

      expect(res.arrayWithIDs?.[0]?.textLocalized).toEqual({
        en: 'Some text localized',
      })
      expect(res.arrayWithIDs?.[1]?.textLocalized).toEqual({
        en: 'Some text 2 localized',
        es: 'Algun texto 2 localizado',
      })
      expect(res.arrayWithIDs?.[2]?.textLocalized).toEqual({
        en: 'Some text 3 localized',
        es: 'Algun texto 3 localizado',
      })
    })

    it('should allow atomic array updates using $push with multiple values, localized array', async () => {
      const post = await payload.create({
        collection: 'posts',
        data: {
          arrayWithIDsLocalized: [
            {
              text: 'some text',
            },
          ],
          title: 'post',
        },
      })

      const res = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          // Locales used => no optimized row update => need to pass full data, incuding title
          arrayWithIDsLocalized: {
            en: {
              $push: {
                id: new mongoose.Types.ObjectId().toHexString(),
                text: 'some text 2',
              },
            },
            es: {
              $push: [
                {
                  id: new mongoose.Types.ObjectId().toHexString(),
                  text: 'some text 2 es',
                },
                {
                  id: new mongoose.Types.ObjectId().toHexString(),
                  text: 'some text 3 es',
                },
              ],
            },
          },
          title: 'post',
        },
      })) as unknown as any

      expect(res.arrayWithIDsLocalized?.en).toHaveLength(2)
      expect(res.arrayWithIDsLocalized?.en?.[0]?.text).toBe('some text')
      expect(res.arrayWithIDsLocalized?.en?.[1]?.text).toBe('some text 2')

      expect(res.arrayWithIDsLocalized?.es).toHaveLength(2)
      expect(res.arrayWithIDsLocalized?.es?.[0]?.text).toBe('some text 2 es')
      expect(res.arrayWithIDsLocalized?.es?.[1]?.text).toBe('some text 3 es')
    })
  })

  describe('relationship $push', () => {
    it('should allow appending relationships using $push with single value', async () => {
      // First create some category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      // Create a post with initial relationship
      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id],
          title: 'Test Post',
        },
        depth: 0,
      })

      expect(post.categories).toHaveLength(1)
      expect(post.categories?.[0]).toBe(cat1.id)

      // Append another relationship using $push
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          categories: {
            $push: cat2.id,
          },
        },
      })) as unknown as Post

      expect(result.categories).toHaveLength(2)
      // Handle both populated and non-populated relationships
      const resultIds = result.categories?.map((cat) => cat as string)
      expect(resultIds).toContain(cat1.id)
      expect(resultIds).toContain(cat2.id)
    })

    it('should allow appending relationships using $push with array', async () => {
      // Create category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })
      const cat3 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 3' },
      })

      // Create post with initial relationship
      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id],
          title: 'Test Post',
        },
      })

      // Append multiple relationships using $push
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          categories: {
            $push: [cat2.id, cat3.id],
          },
        },
      })) as unknown as Post

      expect(result.categories).toHaveLength(3)
      // Handle both populated and non-populated relationships
      const resultIds = result.categories?.map((cat) => cat as string)
      expect(resultIds).toContain(cat1.id)
      expect(resultIds).toContain(cat2.id)
      expect(resultIds).toContain(cat3.id)
    })

    it('should prevent duplicates when using $push', async () => {
      // Create category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      // Create post with initial relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id, cat2.id],
          title: 'Test Post',
        },
      })

      // Try to append existing relationship - should not create duplicates
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          categories: {
            $push: [cat1.id, cat2.id], // Appending existing items
          },
        },
      })) as unknown as Post

      expect(result.categories).toHaveLength(2) // Should still be 2, no duplicates
      // Handle both populated and non-populated relationships
      const resultIds = result.categories?.map((cat) => cat as string)
      expect(resultIds).toContain(cat1.id)
      expect(resultIds).toContain(cat2.id)
    })

    it('should work with updateMany for bulk append operations', async () => {
      // Create category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      // Create multiple posts with initial relationships
      const post1 = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id],
          title: 'Post 1',
        },
      })
      const post2 = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id],
          title: 'Post 2',
        },
      })

      // Append cat2 to all posts using updateMany
      const result = (await payload.db.updateMany({
        collection: 'posts',
        data: {
          categories: {
            $push: cat2.id,
          },
        },
        where: {
          id: { in: [post1.id, post2.id] },
        },
      })) as unknown as Post[]

      expect(result).toHaveLength(2)
      result.forEach((post) => {
        expect(post.categories).toHaveLength(2)
        const categoryIds = post.categories?.map((cat) => cat as string)
        expect(categoryIds).toContain(cat1.id)
        expect(categoryIds).toContain(cat2.id)
      })
    })

    it('should append polymorphic relationships using $push', async () => {
      // Create a category and simple document for the polymorphic relationship
      const category = await payload.create({
        collection: 'categories',
        data: { title: 'Test Category' },
      })
      const simple = await payload.create({
        collection: 'simple',
        data: { text: 'Test Simple' },
      })

      // Create post with initial polymorphic relationship
      const post = await payload.create({
        collection: 'posts',
        data: {
          polymorphicRelations: [
            {
              relationTo: 'categories',
              value: category.id,
            },
          ],
          title: 'Test Post',
        },
        depth: 0, // Don't populate relationships
      })

      expect(post.polymorphicRelations).toHaveLength(1)
      expect(post.polymorphicRelations?.[0]).toEqual({
        relationTo: 'categories',
        value: category.id,
      })

      // Append another polymorphic relationship using $push
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          polymorphicRelations: {
            $push: [
              {
                relationTo: 'simple',
                value: simple.id,
              },
            ],
          },
        },
      })) as unknown as Post

      expect(result.polymorphicRelations).toHaveLength(2)
      expect(result.polymorphicRelations).toContainEqual({
        relationTo: 'categories',
        value: category.id,
      })
      expect(result.polymorphicRelations).toContainEqual({
        relationTo: 'simple',
        value: simple.id,
      })
    })

    it('should prevent duplicates in polymorphic relationships with $push', async () => {
      // Create a category
      const category = await payload.create({
        collection: 'categories',
        data: { title: 'Test Category' },
      })

      // Create post with polymorphic relationship
      const post = await payload.create({
        collection: 'posts',
        data: {
          polymorphicRelations: [
            {
              relationTo: 'categories',
              value: category.id,
            },
          ],
          title: 'Test Post',
        },
        depth: 0,
      })

      // Try to append the same relationship - should not create duplicates
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          polymorphicRelations: {
            $push: [
              {
                relationTo: 'categories',
                value: category.id, // Same relationship
              },
            ],
          },
        },
      })) as unknown as Post

      expect(result.polymorphicRelations).toHaveLength(1) // Should still be 1, no duplicates
      expect(result.polymorphicRelations?.[0]).toEqual({
        relationTo: 'categories',
        value: category.id,
      })
    })

    it('should handle localized polymorphic relationships with $push', async () => {
      // Create documents for testing
      const category1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const category2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      // Create post with localized polymorphic relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          localizedPolymorphicRelations: [
            {
              relationTo: 'categories',
              value: category1.id,
            },
          ],
          title: 'Test Post',
        },
        depth: 0,
        locale: 'en',
      })

      // Append relationship using $push with correct localized structure
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          localizedPolymorphicRelations: {
            en: {
              $push: [
                {
                  relationTo: 'categories',
                  value: category2.id,
                },
              ],
            },
          },
        },
      })) as unknown as Post

      expect(result.localizedPolymorphicRelations?.en).toHaveLength(2)
      expect(result.localizedPolymorphicRelations?.en).toContainEqual({
        relationTo: 'categories',
        value: category1.id,
      })
      expect(result.localizedPolymorphicRelations?.en).toContainEqual({
        relationTo: 'categories',
        value: category2.id,
      })
    })

    it('should handle nested localized polymorphic relationships with $push', async () => {
      // Create documents for the polymorphic relationship
      const category1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })

      const category2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      // Create a post with nested localized polymorphic relationship
      const post = await payload.create({
        collection: 'posts',
        data: {
          testNestedGroup: {
            nestedLocalizedPolymorphicRelation: [
              {
                relationTo: 'categories',
                value: category1.id,
              },
            ],
          },
          title: 'Test Nested $push',
        },
        locale: 'en',
      })

      // Use low-level API to push new items
      await payload.db.updateOne({
        collection: 'posts',
        data: {
          'testNestedGroup.nestedLocalizedPolymorphicRelation': {
            en: {
              $push: [
                {
                  relationTo: 'categories',
                  value: category2.id,
                },
              ],
            },
          },
        },
        where: { id: { equals: post.id } },
      })

      // Verify the operation worked
      const result = await payload.findByID({
        id: post.id,
        collection: 'posts',
        depth: 0,
        locale: 'en',
      })

      expect(result.testNestedGroup?.nestedLocalizedPolymorphicRelation).toHaveLength(2)
      expect(result.testNestedGroup?.nestedLocalizedPolymorphicRelation).toContainEqual({
        relationTo: 'categories',
        value: category1.id,
      })
      expect(result.testNestedGroup?.nestedLocalizedPolymorphicRelation).toContainEqual({
        relationTo: 'categories',
        value: category2.id,
      })
    })
  })

  describe('relationship $remove', () => {
    it('should allow removing relationships using $remove with single value', async () => {
      // Create category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      // Create post with relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id, cat2.id],
          title: 'Test Post',
        },
      })

      expect(post.categories).toHaveLength(2)

      // Remove one relationship using $remove
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          categories: {
            $remove: cat1.id,
          },
        },
      })) as unknown as Post

      expect(result.categories).toHaveLength(1)
      expect(result.categories?.[0]).toBe(cat2.id)
    })

    it('should allow removing relationships using $remove with array', async () => {
      // Create category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })
      const cat3 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 3' },
      })

      // Create post with relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id, cat2.id, cat3.id],
          title: 'Test Post',
        },
      })

      expect(post.categories).toHaveLength(3)

      // Remove multiple relationships using $remove
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          categories: {
            $remove: [cat1.id, cat3.id],
          },
        },
      })) as unknown as Post

      expect(result.categories).toHaveLength(1)
      expect(result.categories?.[0]).toBe(cat2.id)
    })

    it('should work with updateMany for bulk remove operations', async () => {
      // Create category documents
      const cat1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const cat2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })
      const cat3 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 3' },
      })

      // Create multiple posts with relationships
      const post1 = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id, cat2.id, cat3.id],
          title: 'Post 1',
        },
      })
      const post2 = await payload.create({
        collection: 'posts',
        data: {
          categories: [cat1.id, cat2.id, cat3.id],
          title: 'Post 2',
        },
      })

      // Remove cat1 and cat3 from all posts using updateMany
      const result = (await payload.db.updateMany({
        collection: 'posts',
        data: {
          categories: {
            $remove: [cat1.id, cat3.id],
          },
        },
        where: {
          id: { in: [post1.id, post2.id] },
        },
      })) as unknown as Post[]

      expect(result).toHaveLength(2)
      result.forEach((post) => {
        expect(post.categories).toHaveLength(1)
        const categoryIds = post.categories?.map((cat) => cat as string)
        expect(categoryIds).toContain(cat2.id)
        expect(categoryIds).not.toContain(cat1.id)
        expect(categoryIds).not.toContain(cat3.id)
      })
    })

    it('should remove polymorphic relationships using $remove', async () => {
      // Create documents
      const category1 = await payload.create({
        collection: 'categories',
        data: { title: 'Test Category 1' },
      })
      const category2 = await payload.create({
        collection: 'categories',
        data: { title: 'Test Category 2' },
      })

      // Create post with multiple polymorphic relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          polymorphicRelations: [
            {
              relationTo: 'categories',
              value: category1.id,
            },
            {
              relationTo: 'categories',
              value: category2.id,
            },
          ],
          title: 'Test Post',
        },
        depth: 0,
      })

      expect(post.polymorphicRelations).toHaveLength(2)

      // Remove one polymorphic relationship using $remove
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          polymorphicRelations: {
            $remove: [
              {
                relationTo: 'categories',
                value: category1.id,
              },
            ],
          },
        },
      })) as unknown as Post

      expect(result.polymorphicRelations).toHaveLength(1)
      expect(result.polymorphicRelations?.[0]).toEqual({
        relationTo: 'categories',
        value: category2.id,
      })
    })

    it('should remove multiple polymorphic relationships using $remove', async () => {
      // Create documents
      const category1 = await payload.create({
        collection: 'categories',
        data: { title: 'Test Category 1' },
      })
      const category2 = await payload.create({
        collection: 'categories',
        data: { title: 'Test Category 2' },
      })
      const simple = await payload.create({
        collection: 'simple',
        data: { text: 'Test Simple' },
      })

      // Create post with multiple polymorphic relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          polymorphicRelations: [
            { relationTo: 'categories', value: category1.id },
            { relationTo: 'categories', value: category2.id },
            { relationTo: 'simple', value: simple.id },
          ],
          title: 'Test Post',
        },
        depth: 0,
      })

      expect(post.polymorphicRelations).toHaveLength(3)

      // Remove multiple polymorphic relationships using $remove
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          polymorphicRelations: {
            $remove: [
              { relationTo: 'categories', value: category1.id },
              { relationTo: 'simple', value: simple.id },
            ],
          },
        },
      })) as unknown as Post

      expect(result.polymorphicRelations).toHaveLength(1)
      expect(result.polymorphicRelations?.[0]).toEqual({
        relationTo: 'categories',
        value: category2.id,
      })
    })

    it('should handle localized polymorphic relationships with $remove', async () => {
      // Create documents for testing
      const category1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })
      const category2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })
      const category3 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 3' },
      })

      // Create post with multiple localized polymorphic relationships
      const post = await payload.create({
        collection: 'posts',
        data: {
          localizedPolymorphicRelations: [
            { relationTo: 'categories', value: category1.id },
            { relationTo: 'categories', value: category2.id },
            { relationTo: 'categories', value: category3.id },
          ],
          title: 'Test Post',
        },
        depth: 0,
        locale: 'en',
      })

      // Remove relationships using $remove with correct localized structure
      const result = (await payload.db.updateOne({
        id: post.id,
        collection: 'posts',
        data: {
          localizedPolymorphicRelations: {
            en: {
              $remove: [
                { relationTo: 'categories', value: category1.id },
                { relationTo: 'categories', value: category3.id },
              ],
            },
          },
        },
      })) as unknown as Post

      expect(result.localizedPolymorphicRelations?.en).toHaveLength(1)
      expect(result.localizedPolymorphicRelations?.en).toContainEqual({
        relationTo: 'categories',
        value: category2.id,
      })
      expect(result.localizedPolymorphicRelations?.en).not.toContainEqual({
        relationTo: 'categories',
        value: category1.id,
      })
      expect(result.localizedPolymorphicRelations?.en).not.toContainEqual({
        relationTo: 'categories',
        value: category3.id,
      })
    })

    it('should handle nested localized polymorphic relationships with $remove', async () => {
      // Create documents for the polymorphic relationship
      const category1 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 1' },
      })

      const category2 = await payload.create({
        collection: 'categories',
        data: { title: 'Category 2' },
      })

      const simple1 = await payload.create({
        collection: 'simple',
        data: { text: 'Simple 1' },
      })

      // Create a post with multiple items in nested localized polymorphic relationship
      const post = await payload.create({
        collection: 'posts',
        data: {
          testNestedGroup: {
            nestedLocalizedPolymorphicRelation: [
              {
                relationTo: 'categories',
                value: category1.id,
              },
              {
                relationTo: 'categories',
                value: category2.id,
              },
              {
                relationTo: 'simple',
                value: simple1.id,
              },
            ],
          },
          title: 'Test Nested $remove',
        },
        locale: 'en',
      })

      // Use low-level API to remove items
      await payload.db.updateOne({
        collection: 'posts',
        data: {
          'testNestedGroup.nestedLocalizedPolymorphicRelation': {
            en: {
              $remove: [
                { relationTo: 'categories', value: category1.id },
                { relationTo: 'simple', value: simple1.id },
              ],
            },
          },
        },
        where: { id: { equals: post.id } },
      })

      // Verify the operation worked
      const result = await payload.findByID({
        id: post.id,
        collection: 'posts',
        depth: 0,
        locale: 'en',
      })

      expect(result.testNestedGroup?.nestedLocalizedPolymorphicRelation).toHaveLength(1)
      expect(result.testNestedGroup?.nestedLocalizedPolymorphicRelation?.[0]).toEqual({
        relationTo: 'categories',
        value: category2.id,
      })
    })
  })

  it('should support x3 nesting blocks', async () => {
    const res = await payload.create({
      collection: 'posts',
      data: {
        blocks: [
          {
            blockType: 'block-third',
            nested: [
              {
                blockType: 'block-fourth',
                nested: [],
              },
            ],
          },
        ],
        title: 'title',
      },
    })

    expect(res.blocks).toHaveLength(1)
    expect(res.blocks[0]?.nested).toHaveLength(1)
    expect(res.blocks[0]?.nested[0]?.nested).toHaveLength(0)
  })

  it('should ignore blocks that exist in the db but not in the config', async () => {
    // not possible w/ SQL anyway
    if (payload.db.name !== 'mongoose') {
      return
    }

    const res = await payload.db.collections['blocks-docs']?.collection.insertOne({
      testBlocks: [
        {
          id: '1',
          blockType: 'cta',
          text: 'valid block',
        },
        {
          id: '2',
          blockType: 'cta_2',
          text: 'non-valid block',
        },
      ],
      testBlocksLocalized: {
        en: [
          {
            id: '1',
            blockType: 'cta',
            text: 'valid block',
          },
          {
            id: '2',
            blockType: 'cta_2',
            text: 'non-valid block',
          },
        ],
      },
    })

    const doc = await payload.findByID({
      id: res?.insertedId?.toHexString() as string,
      collection: 'blocks-docs',
      locale: 'en',
    })
    expect(doc.testBlocks).toHaveLength(1)
    expect(doc.testBlocks[0].id).toBe('1')
    expect(doc.testBlocksLocalized).toHaveLength(1)
    expect(doc.testBlocksLocalized[0].id).toBe('1')
  })

  it('should CRUD with blocks as JSON in SQL adapters', async () => {
    if (!('drizzle' in payload.db)) {
      return
    }

    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
    payload.db.blocksAsJSON = true
    delete payload.db.pool
    await payload.db.init()
    await payload.db.connect()
    expect(payload.db.tables.blocks_docs.testBlocks).toBeDefined()
    expect(payload.db.tables.blocks_docs_locales.testBlocksLocalized).toBeDefined()
    const res = await payload.create({
      collection: 'blocks-docs',
      data: {
        testBlocks: [{ blockType: 'cta', text: 'text' }],
        testBlocksLocalized: [{ blockType: 'cta', text: 'text-localized' }],
      },
    })
    expect(res.testBlocks[0]?.text).toBe('text')
    expect(res.testBlocksLocalized[0]?.text).toBe('text-localized')
    const res_es = await payload.update({
      id: res.id,
      collection: 'blocks-docs',
      data: {
        testBlocks: [{ blockType: 'cta', text: 'text_updated' }],
        testBlocksLocalized: [{ blockType: 'cta', text: 'text-localized-es' }],
      },
      locale: 'es',
    })
    expect(res_es.testBlocks[0]?.text).toBe('text_updated')
    expect(res_es.testBlocksLocalized[0]?.text).toBe('text-localized-es')
    const res_all = await payload.findByID({
      id: res.id,
      collection: 'blocks-docs',
      locale: 'all',
    })
    expect(res_all.testBlocks[0]?.text).toBe('text_updated')
    expect(res_all.testBlocksLocalized.es[0]?.text).toBe('text-localized-es')
    expect(res_all.testBlocksLocalized.en[0]?.text).toBe('text-localized')
    payload.db.blocksAsJSON = false
    process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'false'
    delete payload.db.pool
    await payload.db.init()
    await payload.db.connect()
  })

  it('ensure mongodb query sanitization does not duplicate IDs', { db: 'mongo' }, () => {
    const res: any = sanitizeQueryValue({
      field: {
        name: '_id',
        type: 'text',
      },
      hasCustomID: false,
      operator: 'in',
      parentIsLocalized: false,
      path: '_id',
      payload,
      val: ['68378b649ca45274fb10126f'],
    })

    expect(res?.val).toHaveLength(1)
    expect(typeof res?.val?.[0]).toBe('object')
    expect(JSON.parse(JSON.stringify(res)).val[0]).toEqual('68378b649ca45274fb10126f')
  })

  it(
    'ensure mongodb respects collation when using collection in the config',
    { db: 'mongo' },
    async () => {
      // Clear any existing documents
      await payload.delete({ collection: 'simple', where: {} })

      const expectedUnsortedItems = ['Євген', 'Віктор', 'Роман']
      const expectedSortedItems = ['Віктор', 'Євген', 'Роман']

      const simple_1 = await payload.create({
        collection: 'simple',
        data: { text: 'Роман' },
        locale: 'uk',
      })
      const simple_2 = await payload.create({
        collection: 'simple',
        data: { text: 'Віктор' },
        locale: 'uk',
      })
      const simple_3 = await payload.create({
        collection: 'simple',
        data: { text: 'Євген' },
        locale: 'uk',
      })

      const results = await payload.find({
        collection: 'simple',
        locale: 'uk',
        sort: 'text',
      })

      const initialMappedResults = results.docs.map((doc) => doc.text)

      expect(initialMappedResults).toEqual(expectedUnsortedItems)

      payload.db.collation = { strength: 1 }

      const resultsWithCollation = await payload.find({
        collection: 'simple',
        locale: 'uk',
        sort: 'text',
      })

      const collatedMappedResults = resultsWithCollation.docs.map((doc) => doc.text)

      console.log({ docs: JSON.stringify(collatedMappedResults) })

      expect(collatedMappedResults).toEqual(expectedSortedItems)
    },
  )
})
