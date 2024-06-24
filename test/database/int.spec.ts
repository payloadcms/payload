import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type { Payload, PayloadRequestWithData, TypeWithID } from 'payload'

import { migratePostgresV2toV3 } from '@payloadcms/db-postgres/migration-utils'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { commitTransaction, initTransaction } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import removeFiles from '../helpers/removeFiles.js'
import configPromise from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let user: TypeWithID & Record<string, unknown>
let token: string
let restClient: NextRESTClient
const collection = 'posts'
const title = 'title'
process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

describe('database', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(configPromise))
    payload.db.migrationDir = path.join(dirname, './migrations')

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
  })

  describe('migrations', () => {
    beforeAll(async () => {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true' && 'drizzle' in payload.db) {
        const db = payload.db as unknown as PostgresAdapter
        const drizzle = db.drizzle
        const schemaName = db.schemaName || 'public'

        await drizzle.execute(
          sql.raw(`drop schema ${schemaName} cascade;
        create schema ${schemaName};`),
        )
      }
    })

    afterAll(() => {
      removeFiles(path.join(dirname, './migrations'))
    })

    it('should run migrate:create', async () => {
      await payload.db.createMigration({
        forceAcceptWarning: true,
        migrationName: 'test',
        payload,
      })

      // read files names in migrationsDir
      const migrationFile = path.normalize(fs.readdirSync(payload.db.migrationDir)[0])
      expect(migrationFile).toContain('_test')
    })

    it('should run migrate', async () => {
      try {
        await payload.db.migrate()
      } catch (e) {
        console.error(e)
      }
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
    })

    // known issue: https://github.com/payloadcms/payload/issues/4597
    it.skip('should run migrate:down', async () => {
      let error
      try {
        await payload.db.migrateDown()
      } catch (e) {
        error = e
      }
      expect(error).toBeUndefined()
    })

    // known issue: https://github.com/payloadcms/payload/issues/4597
    it.skip('should run migrate:refresh', async () => {
      let error
      try {
        await payload.db.migrateRefresh()
      } catch (e) {
        error = e
      }
      expect(error).toBeUndefined()
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
        expect(db.enums.selectEnum).toBeDefined()
        expect(db.enums.radioEnum).toBeDefined()
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
  })

  describe('transactions', () => {
    describe('local api', () => {
      it('should commit multiple operations in isolation', async () => {
        const req = {
          payload,
          user,
        } as PayloadRequestWithData

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
        } as PayloadRequestWithData

        let first
        let second

        const firstReq = payload
          .create({
            collection,
            data: {
              title,
            },
            req,
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
            req,
          })
          .then((res) => {
            second = res
          })

        await Promise.all([firstReq, secondReq])

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

      it('should rollback operations on failure', async () => {
        const req = {
          payload,
          user,
        } as PayloadRequestWithData

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
    })
  })

  describe('postgres v2 - v3 migration', () => {
    it.skip('should collect relations to migrate', async () => {
      expect(payload.db).toBeDefined()

      if (payload.db.name === 'postgres') {
        const relationA1 = await payload.create({
          collection: 'relation-a',
          data: {
            title: 'hello A 1',
          },
        })

        const relationB1 = await payload.create({
          collection: 'relation-b',
          data: {
            title: 'hello B 1',
          },
        })

        const relationA2 = await payload.create({
          collection: 'relation-a',
          data: {
            title: 'hello A 2',
          },
        })

        const relationB2 = await payload.create({
          collection: 'relation-b',
          data: {
            title: 'hello B 2',
          },
        })

        const enDoc = {
          myArray: [
            {
              mySubArray: [
                {
                  relation3: relationB1.id,
                },
                {
                  relation3: relationB2.id,
                },
              ],
              relation2: relationB1.id,
            },
            {
              mySubArray: [
                {
                  relation3: relationB2.id,
                },
                {
                  relation3: relationB1.id,
                },
              ],
              relation2: relationB2.id,
            },
          ],
          myBlocks: [
            {
              blockType: 'myBlock',
              relation5: relationA1.id,
              relation6: relationB1.id,
            },
            {
              blockType: 'myBlock',
              relation5: relationA2.id,
              relation6: relationB2.id,
            },
          ],
          myGroup: {
            relation4: relationB1.id,
          },
          relation1: relationA1.id,
        }

        const migrationDoc = await payload.create({
          collection: 'pg-migrations',
          data: enDoc,
          locale: 'en',
        })

        const esDoc = {
          myArray: [
            {
              id: migrationDoc.myArray[0].id,
              mySubArray: [
                {
                  id: migrationDoc.myArray[0].mySubArray[0].id,
                  relation3: relationB2.id,
                },
                {
                  id: migrationDoc.myArray[0].mySubArray[1].id,
                  relation3: relationB1.id,
                },
              ],
              relation2: relationB2.id,
            },
            {
              id: migrationDoc.myArray[1].id,
              mySubArray: [
                {
                  id: migrationDoc.myArray[1].mySubArray[0].id,
                  relation3: relationB1.id,
                },
                {
                  id: migrationDoc.myArray[1].mySubArray[1].id,
                  relation3: relationB2.id,
                },
              ],
              relation2: relationB1.id,
            },
          ],
          myBlocks: [
            {
              id: migrationDoc.myBlocks[0].id,
              blockType: 'myBlock',
              relation5: relationA2.id,
              relation6: relationB2.id,
            },
            {
              id: migrationDoc.myBlocks[1].id,
              blockType: 'myBlock',
              relation5: relationA1.id,
              relation6: relationB1.id,
            },
          ],
          myGroup: {
            relation4: relationB2.id,
          },
          relation1: relationA2.id,
        }

        const updated = await payload.update({
          id: migrationDoc.id,
          collection: 'pg-migrations',
          data: esDoc,
          fallbackLocale: null,
          locale: 'es',
        })

        const req: PayloadRequestWithData = {} as PayloadRequestWithData
        await initTransaction(req)

        await migratePostgresV2toV3({
          debug: true,
          payload,
          req,
        })
      }
    })
  })
})
