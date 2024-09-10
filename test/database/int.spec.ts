import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type { Payload, PayloadRequest, TypeWithID } from 'payload'

import ObjectIdImport from 'bson-objectid'
import fs from 'fs'
import path from 'path'
import { commitTransaction, initTransaction } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import removeFiles from '../helpers/removeFiles.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const ObjectId = (ObjectIdImport.default ||
  ObjectIdImport) as unknown as typeof ObjectIdImport.default

let payload: Payload
let user: Record<string, unknown> & TypeWithID
let token: string
let restClient: NextRESTClient
const collection = 'posts'
const title = 'title'
process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

describe('database', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
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

    it('should allow array of IDs for relationships', async () => {
      const relation1 = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const relation2 = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const relation3 = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const created = await payload.create({
        collection: 'relation-c',
        data: {
          title: 'hello',
          relationship: [relation1.id, relation2.id, relation3.id],
        },
      })

      expect(created.id).toBeTruthy()
      expect(created.relationship).toHaveLength(3)
    })
  })

  describe('id type casting', () => {
    it('— mongoose — should convert IDs to ObjectID automatically in relationships', async () => {
      const relation1 = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const created = await payload.create({
        collection: 'relation-c',
        data: {
          title: 'hello',
          // @ts-ignore - ignore type here as its just used for casting
          relationship: [String(relation1.id)],
        },
      })

      if (['mongoose'].includes(payload.db.name)) {
        // @ts-ignore
        expect(ObjectId.isValid(created.id)).toStrictEqual(true)
        expect(created.relationship).toHaveLength(1)
      }
    })

    it('— sql serial — should convert IDs to ObjectID automatically in relationships', async () => {
      const relation1 = await payload.create({
        collection: 'relation-a',
        data: {
          title: 'hello',
        },
      })

      const created = await payload.create({
        collection: 'relation-c',
        data: {
          title: 'hello',
          // @ts-ignore - ignore type here as its just used for casting
          relationship: [String(relation1.id)],
        },
      })

      if (
        ['postgres', 'sqlite'].includes(payload.db.name) &&
        payload.db.defaultIDType === 'number'
      ) {
        // @ts-ignore
        expect(typeof created.id).toStrictEqual('number')
        // @ts-ignore
        expect(typeof created.relationship[0].id).toStrictEqual('number')
      }
    })
  })

  describe('timestamps', () => {
    it('should have createdAt and updatedAt timetstamps to the millisecond', async () => {
      const result = await payload.create({
        collection: 'posts',
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
        collection: 'posts',
        data: {
          createdAt,
          title: 'hello',
        },
      })

      const doc = await payload.findByID({
        id: result.id,
        collection: 'posts',
      })

      expect(result.createdAt).toStrictEqual(createdAt)
      expect(doc.createdAt).toStrictEqual(createdAt)
    })

    it('updatedAt cannot be set in create', async () => {
      const updatedAt = new Date('2022-01-01T00:00:00.000Z').toISOString()
      const result = await payload.create({
        collection: 'posts',
        data: {
          title: 'hello',
          updatedAt,
        },
      })

      expect(result.updatedAt).not.toStrictEqual(updatedAt)
    })
  })

  describe('migrations', () => {
    beforeEach(async () => {
      if (process.env.PAYLOAD_DROP_DATABASE === 'true' && 'drizzle' in payload.db) {
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
  })

  describe('transactions', () => {
    describe('local api', () => {
      // sqlite cannot handle concurrent write transactions
      if (!['sqlite'].includes(process.env.PAYLOAD_DATABASE)) {
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
    })
  })
})
