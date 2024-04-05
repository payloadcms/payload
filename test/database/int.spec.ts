import { sql } from 'drizzle-orm'
import fs from 'fs'
import { GraphQLClient } from 'graphql-request'
import path from 'path'

import type { PostgresAdapter } from '../../packages/db-postgres/src/types'
import type { PostgresAdapter } from '../../packages/db-postgres/src/types'
import type { TypeWithID } from '../../packages/payload/src/collections/config/types'
import type { PayloadRequest } from '../../packages/payload/src/express/types'

import payload from '../../packages/payload/src'
import { migrate } from '../../packages/payload/src/bin/migrate'
import { commitTransaction } from '../../packages/payload/src/utilities/commitTransaction'
import { initTransaction } from '../../packages/payload/src/utilities/initTransaction'
import { devUser } from '../credentials'
import { initPayloadTest } from '../helpers/configHelpers'
import removeFiles from '../helpers/removeFiles'
import { MongooseAdapter } from '../../packages/db-mongodb/src'

describe('database', () => {
  let serverURL
  let client: GraphQLClient
  let token: string
  const collection = 'posts'
  const title = 'title'
  let user: TypeWithID & Record<string, unknown>

  beforeAll(async () => {
    const init = await initPayloadTest({ __dirname, init: { local: false } })
    serverURL = init.serverURL
    const url = `${serverURL}/api/graphql`
    client = new GraphQLClient(url)

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    if (loginResult.token) token = loginResult.token
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
      removeFiles(path.normalize(payload.db.migrationDir))
    })

    it('should run migrate:create', async () => {
      const args = {
        _: ['migrate:create', 'test'],
        forceAcceptWarning: true,
      }
      await migrate(args)

      // read files names in migrationsDir
      const migrationFile = path.normalize(fs.readdirSync(payload.db.migrationDir)[0])
      expect(migrationFile).toContain('_test')
    })

    it('should run migrate', async () => {
      const args = {
        _: ['migrate'],
      }
      await migrate(args)
      const { docs } = await payload.find({
        collection: 'payload-migrations',
      })
      const migration = docs[0]
      expect(migration.name).toContain('_test')
      expect(migration.batch).toStrictEqual(1)
    })

    it('should run migrate:status', async () => {
      let error
      const args = {
        _: ['migrate:status'],
      }
      try {
        await migrate(args)
      } catch (e) {
        error = e
      }
      expect(error).toBeUndefined()
    })

    it('should run migrate:fresh', async () => {
      const args = {
        _: ['migrate:fresh'],
        forceAcceptWarning: true,
      }
      await migrate(args)
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
      const args = {
        _: ['migrate:down'],
      }
      try {
        await migrate(args)
      } catch (e) {
        error = e
      }
      expect(error).toBeUndefined()
    })

    // known issue: https://github.com/payloadcms/payload/issues/4597
    it.skip('should run migrate:refresh', async () => {
      let error
      const args = {
        _: ['migrate:refresh'],
      }
      try {
        await migrate(args)
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
        ).rejects.toThrow('The requested resource was not found.')

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
        ).rejects.toThrow('The requested resource was not found.')
      })
    })
  })
})
