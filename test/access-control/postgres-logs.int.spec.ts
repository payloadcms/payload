import type { CollectionPermission, Payload, PayloadRequest } from 'payload'

/* eslint-disable jest/require-top-level-describe */
import assert from 'assert'
import path from 'path'
import {
  createLocalReq,
  getEntityPermissions,
  getEntityPolicies,
  sanitizePermissions,
} from 'payload'
import { fileURLToPath } from 'url'

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

        const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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

        const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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

        // 1 db call across all operations due to cache
        expect(consoleCount).toHaveBeenCalledTimes(1)

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

        const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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

        // 3 access control operations with unique where + 1 for the document fetch, since we're not passing data.
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

        const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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

        // 3 access control operations with unique where, no data fetch since we're passing data
        expect(consoleCount).toHaveBeenCalledTimes(3)
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

        const consoleCount = jest.spyOn(console, 'log').mockImplementation(() => {})

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

        const permissions1 = await getEntityPermissions({
          blockReferencesPermissions: {} as any,
          entity: payload.collections[whereCacheUniqueSlug].config,
          entityType: 'collection',
          operations: ['read', 'update', 'delete'],
          fetchData: false,
          req,
        })
        const sanitized1 = sanitizePermissions({
          collections: {
            [whereCacheUniqueSlug]: permissions1,
          },
        } as any)

        const permissions2 = await getEntityPolicies({
          blockPolicies: {} as any,
          entity: payload.collections[whereCacheUniqueSlug].config,
          type: 'collection',
          operations: ['read', 'update', 'delete'],
          req: {
            ...req,
            data: undefined,
          },
        })

        const sanitized2 = sanitizePermissions({
          collections: {
            [whereCacheUniqueSlug]: permissions2,
          },
        } as any)

        console.dir(sanitized1, { depth: 1000 })
        console.dir(sanitized2, { depth: 1000 })
      })
    })

    describe('async parent permission inheritance', () => {
      it('should correctly inherit permissions from async parent field access', async () => {
        // This test verifies that when a parent field has async access control that returns a promise,
        // child fields can properly chain onto that promise and inherit the resolved permission.
        // Previously, this would fail because children couldn't detect/chain onto parent promises.

        const doc = await payload.create({
          collection: 'complex-content',
          data: {
            title: 'Async Test Doc',
            status: 'published',
            isPublic: true,
            author: '123',
            metadata: {
              keywords: 'test',
              internalNotes: 'admin only',
            },
          },
        })

        // Get permissions - the 'metadata.keywords' field has ASYNC read access
        // The parent 'metadata' group doesn't have access, so children inherit from collection
        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections['complex-content'].config,
          entityType: 'collection',
          operations: ['read', 'update'],
          fetchData: true,
          req,
        })

        // Verify the async field access resolved correctly
        expect(permissions.fields?.metadata).toBeDefined()
        expect(permissions.fields?.metadata?.fields?.keywords).toBeDefined()
        expect(permissions.fields?.metadata?.fields?.keywords?.read?.permission).toBe(true)

        // The async access should have resolved (not be a promise)
        expect(typeof permissions.fields?.metadata?.fields?.keywords?.read?.permission).toBe(
          'boolean',
        )

        // internalNotes has sync access (admin only)
        expect(permissions.fields?.metadata?.fields?.internalNotes?.read?.permission).toBe(true)
        expect(permissions.fields?.metadata?.fields?.internalNotes?.update?.permission).toBe(true)
      })

      it('should handle nested async access with block references', async () => {
        // Test that block permissions correctly inherit from async parent field permissions
        const doc = await payload.create({
          collection: 'complex-content',
          data: {
            title: 'Block Test Doc',
            status: 'published',
            isPublic: true,
            author: '123',
          },
        })

        // The 'hero' field has async UPDATE access, read is sync
        // Blocks within hero should inherit these permissions
        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections['complex-content'].config,
          entityType: 'collection',
          operations: ['read', 'update'],
          fetchData: true,
          req,
        })

        // Verify hero field permissions
        expect(permissions.fields?.hero).toBeDefined()
        expect(permissions.fields?.hero?.read?.permission).toBe(true)
        expect(permissions.fields?.hero?.update?.permission).toBe(true)

        // Verify blocks within hero inherited permissions correctly
        expect(permissions.fields?.hero?.blocks).toBeDefined()
        if (
          permissions.fields?.hero?.blocks &&
          typeof permissions.fields.hero.blocks === 'object'
        ) {
          // Check that blocks are present and have correct permissions
          const blockKeys = Object.keys(permissions.fields.hero.blocks)
          expect(blockKeys.length).toBeGreaterThan(0)

          // All blocks should inherit read=true, update=true from parent
          blockKeys.forEach((blockSlug) => {
            const block = (permissions.fields?.hero?.blocks as any)[blockSlug]
            expect(block.read?.permission).toBe(true)
            expect(block.update?.permission).toBe(true)
          })
        }
      })

      it('should resolve all async permissions before returning', async () => {
        // Verify that no promises leak into the final permissions object
        const doc = await payload.create({
          collection: 'complex-content',
          data: {
            title: 'Promise Test Doc',
            status: 'published',
            isPublic: true,
            author: '123',
            sections: [
              {
                sectionTitle: 'Section 1',
                sectionMetadata: {
                  visibility: 'public',
                },
              },
            ],
          },
        })

        const permissions = await getEntityPermissions({
          id: doc.id,
          blockReferencesPermissions: {} as any,
          entity: payload.collections['complex-content'].config,
          entityType: 'collection',
          operations: ['read', 'update'],
          fetchData: true,
          req,
        })

        // Recursively check that no Promise objects exist in the permissions
        const checkForPromises = (obj: any, path = ''): void => {
          if (!obj || typeof obj !== 'object') {
            return
          }

          for (const key in obj) {
            const value = obj[key]
            if (value && typeof value === 'object') {
              // Check if it's a promise
              if (typeof value.then === 'function') {
                throw new Error(`Found unresolved promise at ${path}.${key}`)
              }
              // Check if permission property is a promise
              if ('permission' in value && typeof value.permission?.then === 'function') {
                throw new Error(`Found unresolved promise in permission at ${path}.${key}`)
              }
              checkForPromises(value, `${path}.${key}`)
            }
          }
        }

        // This should not throw - all promises should be resolved
        expect(() => checkForPromises(permissions, 'permissions')).not.toThrow()

        // Verify specific async fields are resolved
        expect(permissions.fields?.metadata?.fields?.keywords?.read?.permission).toBe(true)
        expect(typeof permissions.fields?.metadata?.fields?.keywords?.read?.permission).toBe(
          'boolean',
        )
      })
    })
  })
})
