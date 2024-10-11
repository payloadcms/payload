import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { Table } from 'drizzle-orm'
import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type { Payload, PayloadRequest, TypeWithID } from 'payload'

import * as drizzlePg from 'drizzle-orm/pg-core'
import * as drizzleSqlite from 'drizzle-orm/sqlite-core'
import fs from 'fs'
import path from 'path'
import { commitTransaction, initTransaction, QueryError } from 'payload'
import { fileURLToPath } from 'url'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import removeFiles from '../helpers/removeFiles.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
  describe('drizzle: schema hooks', () => {
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
      expect(error).toBeInstanceOf(Error)
    }

    expect(invalidDoc).toBeUndefined()

    const relationBDocs = await payload.find({
      collection: 'relation-b',
    })

    expect(relationBDocs.docs).toHaveLength(0)
  })
})
