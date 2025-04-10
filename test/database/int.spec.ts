import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type { Payload, PayloadRequest, TypeWithID } from 'payload'

import {
  migrateRelationshipsV2_V3,
  migrateVersionsV1_V2,
} from '@payloadcms/db-mongodb/migration-utils'
import { randomUUID } from 'crypto'
import { type Table } from 'drizzle-orm'
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

import type { Global2 } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { isMongoose } from '../helpers/isMongoose.js'
import removeFiles from '../helpers/removeFiles.js'
import { seed } from './seed.js'
import { errorOnUnnamedFieldsSlug, postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let user: Record<string, unknown> & TypeWithID
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

    user = loginResult.user
    token = loginResult.token
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
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
        collection: 'custom-ids',
        id: doc.id,
        data: {},
      })

      await payload.update({
        collection: 'custom-ids',
        id: doc.id,
        data: {},
      })

      const versionsQuery = await payload.db.findVersions({
        collection: 'custom-ids',
        req: {} as PayloadRequest,
        where: {
          'version.title': {
            equals: 'hey',
          },
          latest: {
            equals: true,
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
          title: 'test',
          arrayWithIDs: [
            {
              id: arrayRowID,
            },
          ],
          blocksWithIDs: [
            {
              blockType: 'block',
              id: blockID,
            },
          ],
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
          title: 'test',
          arrayWithIDs: [
            {
              id: arrayRowID,
            },
          ],
          blocksWithIDs: [
            {
              blockType: 'block',
              id: blockID,
            },
          ],
        },
      })

      const duplicate = await payload.duplicate({
        collection: postsSlug,
        id: doc.id,
      })

      expect(duplicate.arrayWithIDs[0].id).not.toStrictEqual(arrayRowID)
      expect(duplicate.blocksWithIDs[0].id).not.toStrictEqual(blockID)
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
    })

    it('updatedAt cannot be set in create', async () => {
      const updatedAt = new Date('2022-01-01T00:00:00.000Z').toISOString()
      const result = await payload.create({
        collection: postsSlug,
        data: {
          title: 'hello',
          updatedAt,
        },
      })

      expect(result.updatedAt).not.toStrictEqual(updatedAt)
    })
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
          password: 'some-password',
          'confirm-password': 'some-password',
          email: 'user2@payloadcms.com',
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

      expect(doc).toMatchObject({ title: 'created', id })
      expect(doc.id).toBe(id)
    })
  })

  describe('Compound Indexes', () => {
    beforeEach(async () => {
      await payload.delete({ collection: 'compound-indexes', where: {} })
    })

    it('top level: should throw a unique error', async () => {
      await payload.create({
        collection: 'compound-indexes',
        data: { three: randomUUID(), one: '1', two: '2' },
      })

      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { three: randomUUID(), one: '1', two: '3' },
      })
      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { three: randomUUID(), one: '-1', two: '2' },
      })

      // fails
      await expect(
        payload.create({
          collection: 'compound-indexes',
          data: { three: randomUUID(), one: '1', two: '2' },
        }),
      ).rejects.toBeTruthy()
    })

    it('combine group and top level: should throw a unique error', async () => {
      await payload.create({
        collection: 'compound-indexes',
        data: {
          one: randomUUID(),
          three: '3',
          group: { four: '4' },
        },
      })

      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { one: randomUUID(), three: '3', group: { four: '5' } },
      })
      // does not fail
      await payload.create({
        collection: 'compound-indexes',
        data: { one: randomUUID(), three: '4', group: { four: '4' } },
      })

      // fails
      await expect(
        payload.create({
          collection: 'compound-indexes',
          data: { one: randomUUID(), three: '3', group: { four: '4' } },
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
      let error
      try {
        await payload.db.migrate()
      } catch (e) {
        console.error(e)
        error = e
      }
      const { docs } = await payload.find({
        collection: 'payload-migrations',
      })
      const migration = docs[0]
      expect(error).toBeUndefined()
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

    it('should run migrate:down', async () => {
      // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
      // eslint-disable-next-line jest/no-conditional-in-test
      if (!isMongoose(payload)) {
        return
      }

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

    it('should run migrate:refresh', async () => {
      // known drizzle issue: https://github.com/payloadcms/payload/issues/4597
      // eslint-disable-next-line jest/no-conditional-in-test
      if (!isMongoose(payload)) {
        return
      }
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

  describe('predefined migrations', () => {
    it('mongoose - should execute migrateVersionsV1_V2', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
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
      // eslint-disable-next-line jest/no-conditional-in-test
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
          version: doc,
          parent: inserted[i]._id.toHexString(),
        })),
        {
          lean: true,
        },
      )

      expect(inserted.every((doc) => typeof doc.relationship === 'string')).toBeTruthy()

      await initTransaction(req)
      await migrateRelationshipsV2_V3({ req, batchSize: 66 }).catch(async (err) => {
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
              blockType: 'block',
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
      const res = await payload.findByID({ collection: 'aliases', id })
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

  describe('transactions', () => {
    describe('local api', () => {
      // sqlite cannot handle concurrent write transactions
      if (!['sqlite', 'sqlite-uuid'].includes(process.env.PAYLOAD_DATABASE)) {
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
      }

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
            collection,
            id: disabledTransactionPost.id,
            data: {
              title,
            },
            disableTransaction: true,
          })

          expect(result.hasTransaction).toBeFalsy()
        })
        it('should not use transaction calling delete() with disableTransaction', async () => {
          const result = await payload.delete({
            collection,
            id: disabledTransactionPost.id,
            data: {
              title,
            },
            disableTransaction: true,
          })

          expect(result.hasTransaction).toBeFalsy()
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
        where: {
          title: { equals: 'hello' },
        },
        limit: 5,
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
            title: 'not updated',
            number: i,
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
            title: 'not updated',
            number: i,
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
            title: 'not updated',
            number: i,
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
            title: 'not updated',
            number: i,
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
            title: 'Title',
            D1: {
              D2: {
                D3: {
                  // @ts-expect-error
                  D4: {},
                },
              },
            },
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
      expect(result.point).toStrictEqual({ coordinates: [10, 20], type: 'Point' })
    })
  })

  describe('Schema generation', () => {
    if (process.env.PAYLOAD_DATABASE.includes('postgres')) {
      it('should generate Drizzle Postgres schema', async () => {
        const generatedAdapterName = process.env.PAYLOAD_DATABASE

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
    }

    if (process.env.PAYLOAD_DATABASE.includes('sqlite')) {
      it('should generate Drizzle SQLite schema', async () => {
        const generatedAdapterName = process.env.PAYLOAD_DATABASE

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
    }
  })

  describe('drizzle: schema hooks', () => {
    beforeAll(() => {
      process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
    })

    it('should add tables with hooks', async () => {
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'mongoose') {
        return
      }

      let added_table_before: Table
      let added_table_after: Table

      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name.includes('postgres')) {
        added_table_before = drizzlePg.pgTable('added_table_before', {
          id: drizzlePg.serial('id').primaryKey(),
          text: drizzlePg.text('text'),
        })

        added_table_after = drizzlePg.pgTable('added_table_after', {
          id: drizzlePg.serial('id').primaryKey(),
          text: drizzlePg.text('text'),
        })
      }

      // eslint-disable-next-line jest/no-conditional-in-test
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
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'mongoose') {
        return
      }

      const isSQLite = payload.db.name === 'sqlite'

      payload.db.afterSchemaInit = [
        ({ schema, extendTable }) => {
          extendTable({
            table: schema.tables.places,
            columns: {
              // SQLite doesn't have DB length enforcement
              // eslint-disable-next-line jest/no-conditional-in-test
              ...(payload.db.name === 'postgres' && {
                city: drizzlePg.varchar('city', { length: 10 }),
              }),
              // eslint-disable-next-line jest/no-conditional-in-test
              extraColumn: isSQLite
                ? drizzleSqlite.integer('extra_column')
                : drizzlePg.integer('extra_column'),
            },
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

      // eslint-disable-next-line jest/no-conditional-in-test
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
      // eslint-disable-next-line jest/no-conditional-in-test
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
      // eslint-disable-next-line jest/no-conditional-in-test
      if (payload.db.name === 'mongoose') {
        return
      }

      const isSQLite = payload.db.name === 'sqlite'

      payload.db.afterSchemaInit = [
        ({ schema, extendTable }) => {
          extendTable({
            table: schema.tables.places,
            extraConfig: (t) => ({
              // eslint-disable-next-line jest/no-conditional-in-test
              uniqueOnCityAndCountry: (isSQLite ? drizzleSqlite : drizzlePg)
                .unique()
                .on(t.city, t.country),
            }),
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
        data: { text: 'asd', array: [], textHooked: 'asd' },
      })

      const resLocal = await payload.findByID({
        collection: 'fields-persistance',
        id: createRes.id,
      })

      const resDb = (await payload.db.findOne({
        collection: 'fields-persistance',
        where: { id: { equals: createRes.id } },
        req: {} as PayloadRequest,
      })) as Record<string, unknown>

      expect(resDb.text).toBeUndefined()
      expect(resDb.array).toBeUndefined()
      expect(resDb.textHooked).toBeUndefined()

      expect(resLocal.textHooked).toBe('hooked')
    })

    it('should not save a nested field to tabs/row/collapsible with virtual: true to the db', async () => {
      const res = await payload.create({
        data: {
          textWithinCollapsible: '1',
          textWithinRow: '2',
          textWithinTabs: '3',
        },
        collection: 'fields-persistance',
      })

      expect(res.textWithinCollapsible).toBeUndefined()
      expect(res.textWithinRow).toBeUndefined()
      expect(res.textWithinTabs).toBeUndefined()
    })
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

    try {
      invalidDoc = await payload.create({
        collection: 'relation-b',
        data: { title: 'invalid', relationship: 'not-real-id' },
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
      req: {},
      collection: postsSlug,
      data: {
        title: 'some-title-here',
      },
      where: {
        title: {
          equals: 'some-title-here',
        },
      },
    })

    expect(postShouldCreated).toBeTruthy()

    const postShouldUpdated = await payload.db.upsert({
      req: {},
      collection: postsSlug,
      data: {
        title: 'some-title-here',
      },
      where: {
        title: {
          equals: 'some-title-here',
        },
      },
    })

    // Should stay the same ID
    expect(postShouldCreated.id).toBe(postShouldUpdated.id)
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
          not_in: [],
          in: [doc2.id],
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
    // eslint-disable-next-line jest/no-conditional-in-test
    if (payload.db.name !== 'mongoose') {
      return
    }

    const arrItemID = randomUUID()
    const res = await payload.db.collections[postsSlug]?.collection.insertOne({
      SECRET_FIELD: 'secret data',
      arrayWithIDs: [
        {
          id: arrItemID,
          additionalKeyInArray: 'true',
          text: 'existing key',
        },
      ],
    })

    let payloadRes: any = await payload.findByID({
      collection: postsSlug,
      id: res!.insertedId.toHexString(),
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
      collection: postsSlug,
      id: res!.insertedId.toHexString(),
    })

    expect(payloadRes.id).toBe(res!.insertedId.toHexString())
    expect(payloadRes['SECRET_FIELD']).toBe('secret data')
    expect(payloadRes.arrayWithIDs[0].additionalKeyInArray).toBe('true')

    payload.db.allowAdditionalKeys = false
  })
})
