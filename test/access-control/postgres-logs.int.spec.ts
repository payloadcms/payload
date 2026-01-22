import type { CollectionPermission, Payload, PayloadRequest } from 'payload'

import assert from 'assert'
import path from 'path'
import { createLocalReq } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it, vitest } from 'vitest'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { whereCacheSameSlug, whereCacheUniqueSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const describePostgres = process.env.PAYLOAD_DATABASE?.startsWith('postgres')
  ? describe
  : describe.skip

let payload: Payload
let req: PayloadRequest

describePostgres('Access Control - postgres logs', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(
      dirname,
      undefined,
      undefined,
      'config.postgreslogs.ts',
    )
    assert(initialized.payload)
    assert(initialized.restClient)
    ;({ payload } = initialized)

    req = await createLocalReq(
      {
        user: {
          id: 123 as any,
          collection: 'users',
          roles: ['admin'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          email: 'test@test.com',
        },
      },
      payload,
    )
  })

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }
  })

  describe('Tests', () => {
    describe('where query cache - same where queries', () => {
      it('should cache identical where queries across operations, without passing data (2 DB calls total)', async () => {
        const doc = await payload.create({
          collection: whereCacheSameSlug,
          data: {
            title: 'Test Document',
            userRole: 'admin',
          },
        })

        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        // Get permissions - all operations return same where query
        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheSameSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: true,
          req,
        })

        // 1 db call across all operations due to cache, + 1 for the document fetch
        expect(consoleCount).toHaveBeenCalledTimes(2)

        consoleCount.mockRestore()

        expect(permissions).toEqual({
          fields: {
            title: { read: { permission: true }, update: { permission: true } },
            userRole: { read: { permission: true }, update: { permission: true } },
            updatedAt: { read: { permission: true }, update: { permission: true } },
            createdAt: { read: { permission: true }, update: { permission: true } },
          },
          read: { permission: true, where: { userRole: { equals: 'admin' } } },
          update: { permission: true, where: { userRole: { equals: 'admin' } } },
          delete: { permission: true, where: { userRole: { equals: 'admin' } } },
        } satisfies CollectionPermission)
      })

      it('should cache identical where queries across operations, with passing data (1 DB call total)', async () => {
        const doc = await payload.create({
          collection: whereCacheSameSlug,
          data: {
            title: 'Test Document',
            userRole: 'noAccess',
          },
        })

        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        // Get permissions - all operations return same where query
        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheSameSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: true,
          req,
          data: doc,
        })

        // 1 doc fetch + 1 where query (cached across all operations)
        expect(consoleCount).toHaveBeenCalledTimes(2)

        consoleCount.mockRestore()

        expect(permissions).toEqual({
          fields: {
            title: { read: { permission: false }, update: { permission: false } },
            userRole: { read: { permission: false }, update: { permission: false } },
            updatedAt: { read: { permission: false }, update: { permission: false } },
            createdAt: { read: { permission: false }, update: { permission: false } },
          },
          read: { permission: false, where: { userRole: { equals: 'admin' } } },
          update: { permission: false, where: { userRole: { equals: 'admin' } } },
          delete: { permission: false, where: { userRole: { equals: 'admin' } } },
        } satisfies CollectionPermission)
      })
    })

    describe('where query cache - unique where queries', () => {
      it('should handle unique where queries per operation (1 DB call per operation)', async () => {
        const doc = await payload.create({
          collection: whereCacheUniqueSlug,
          data: {
            title: 'Test Document',
            readRole: 'admin',
            updateRole: 'noAccess',
            deleteRole: 'admin',
          },
        })

        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        // Get permissions - each operation returns unique where query
        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheUniqueSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: true,
          req,
        })

        // 1 doc fetch + 3 unique where queries (one per operation)
        expect(consoleCount).toHaveBeenCalledTimes(4)
        consoleCount.mockRestore()

        expect(permissions).toEqual({
          fields: {
            title: { read: { permission: true }, update: { permission: false } },
            readRole: { read: { permission: true }, update: { permission: false } },
            updateRole: { read: { permission: true }, update: { permission: false } },
            deleteRole: { read: { permission: true }, update: { permission: false } },
            updatedAt: { read: { permission: true }, update: { permission: false } },
            createdAt: { read: { permission: true }, update: { permission: false } },
          },
          read: { permission: true, where: { readRole: { equals: 'admin' } } },
          update: { permission: false, where: { updateRole: { equals: 'admin' } } },
          delete: { permission: true, where: { deleteRole: { equals: 'admin' } } },
        } satisfies CollectionPermission)
      })

      it('should handle unique where queries per operation (1 DB call per operation), no data fetch when passing data', async () => {
        const doc = await payload.create({
          collection: whereCacheUniqueSlug,
          data: {
            title: 'Test Document',
            readRole: 'admin',
            updateRole: 'noAccess',
            deleteRole: 'admin',
          },
        })

        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        // Get permissions - each operation returns unique where query
        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheUniqueSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: true,
          req,
          data: doc,
        })

        // 1 doc fetch + 3 unique where queries (one per operation)
        expect(consoleCount).toHaveBeenCalledTimes(4)
        consoleCount.mockRestore()

        expect(permissions).toEqual({
          fields: {
            title: { read: { permission: true }, update: { permission: false } },
            readRole: { read: { permission: true }, update: { permission: false } },
            updateRole: { read: { permission: true }, update: { permission: false } },
            deleteRole: { read: { permission: true }, update: { permission: false } },
            updatedAt: { read: { permission: true }, update: { permission: false } },
            createdAt: { read: { permission: true }, update: { permission: false } },
          },
          read: { permission: true, where: { readRole: { equals: 'admin' } } },
          update: { permission: false, where: { updateRole: { equals: 'admin' } } },
          delete: { permission: true, where: { deleteRole: { equals: 'admin' } } },
        } satisfies CollectionPermission)
      })

      it('should return correct permissions with mixed results', async () => {
        const doc = await payload.create({
          collection: whereCacheUniqueSlug,
          data: {
            title: 'Test Document 2',
            readRole: 'noAccess',
            updateRole: 'admin',
            deleteRole: 'noAccess',
          },
        })

        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheUniqueSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: true,
          req,
        })

        expect(permissions).toEqual({
          fields: {
            title: { read: { permission: false }, update: { permission: true } },
            readRole: { read: { permission: false }, update: { permission: true } },
            updateRole: { read: { permission: false }, update: { permission: true } },
            deleteRole: { read: { permission: false }, update: { permission: true } },
            updatedAt: { read: { permission: false }, update: { permission: true } },
            createdAt: { read: { permission: false }, update: { permission: true } },
          },
          read: { permission: false, where: { readRole: { equals: 'admin' } } },
          delete: { permission: false, where: { deleteRole: { equals: 'admin' } } },
          update: { permission: true, where: { updateRole: { equals: 'admin' } } },
        } satisfies CollectionPermission)
      })

      it('ensure no db calls when fetchData is false', async () => {
        const _doc = await payload.create({
          collection: whereCacheUniqueSlug,
          data: {
            title: 'Test Document',
            readRole: 'admin',
            updateRole: 'noAccess',
            deleteRole: 'admin',
          },
        })

        const consoleCount = vitest.spyOn(console, 'log').mockImplementation(() => {})

        // Get permissions - each operation returns unique where query
        const permissions = await getEntityPermissions({
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheUniqueSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: false,
          req,
        })

        expect(consoleCount).toHaveBeenCalledTimes(0)
        consoleCount.mockRestore()

        expect(permissions).toEqual({
          // TODO: Permissions currently default to true when fetchData is false, this should be changed to false in 4.0.
          fields: {
            title: { read: { permission: true }, update: { permission: true } },
            readRole: { read: { permission: true }, update: { permission: true } },
            updateRole: { read: { permission: true }, update: { permission: true } },
            deleteRole: { read: { permission: true }, update: { permission: true } },
            updatedAt: { read: { permission: true }, update: { permission: true } },
            createdAt: { read: { permission: true }, update: { permission: true } },
          },
          read: { permission: true, where: { readRole: { equals: 'admin' } } },
          update: { permission: true, where: { updateRole: { equals: 'admin' } } },
          delete: { permission: true, where: { deleteRole: { equals: 'admin' } } },
        } satisfies CollectionPermission)
      })
    })
  })
})
