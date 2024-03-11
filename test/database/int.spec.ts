import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PostgresAdapter } from '../../packages/db-postgres/src/types.js'
import type { TypeWithID } from '../../packages/payload/src/collections/config/types.js'
import type { Payload } from '../../packages/payload/src/index.js'
import type { PayloadRequest } from '../../packages/payload/src/types/index.js'

import { getPayload } from '../../packages/payload/src/index.js'
import { commitTransaction } from '../../packages/payload/src/utilities/commitTransaction.js'
import { initTransaction } from '../../packages/payload/src/utilities/initTransaction.js'
import { devUser } from '../credentials.js'
import removeFiles from '../helpers/removeFiles.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload
let user: TypeWithID & Record<string, unknown>
const collection = 'posts'
const title = 'title'
process.env.PAYLOAD_CONFIG_PATH = path.join(dirname, 'config.ts')

describe('database', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
    payload.db.migrationDir = path.join(dirname, './migrations')

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    user = loginResult.user
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

  describe('transactions', () => {
    describe('local api', () => {
      it('should commit multiple operations in isolation', async () => {
        const req = {
          payload,
          user,
        } as PayloadRequest

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
        } as PayloadRequest

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
        } as PayloadRequest

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
})
