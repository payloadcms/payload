import type { DefaultDocumentIDType, PaginatedDocs, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Relationship } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import { multiTenantPostsSlug, relationshipsSlug, tenantsSlug, usersSlug } from './shared.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-multi-tenant', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const data = await restClient
      .POST('/users/login', {
        body: JSON.stringify({
          email: devUser.email,
          password: devUser.password,
        }),
      })
      .then((res) => res.json())

    token = data.token
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('tenants', () => {
    it('should create a tenant', async () => {
      const tenant1 = await payload.create({
        collection: tenantsSlug,
        data: {
          name: 'tenant1',
          domain: 'tenant1.com',
        },
      })

      expect(tenant1).toHaveProperty('id')
    })

    describe('relationships', () => {
      let anchorBarRelationships: PaginatedDocs<Relationship>
      let blueDogRelationships: PaginatedDocs<Relationship>
      let anchorBarTenantID: DefaultDocumentIDType
      let blueDogTenantID: DefaultDocumentIDType

      beforeEach(async () => {
        anchorBarRelationships = await payload.find({
          collection: 'relationships',
          where: {
            'tenant.name': {
              equals: 'Anchor Bar',
            },
          },
        })

        blueDogRelationships = await payload.find({
          collection: 'relationships',
          where: {
            'tenant.name': {
              equals: 'Blue Dog',
            },
          },
        })

        // @ts-expect-error unsafe access okay in test

        anchorBarTenantID = anchorBarRelationships.docs[0].tenant.id
        // @ts-expect-error unsafe access okay in test
        blueDogTenantID = blueDogRelationships.docs[0].tenant.id
      })

      it('ensure relationship document with relationship within same tenant can be created', async () => {
        const newRelationship = await payload.create({
          collection: 'relationships',
          data: {
            title: 'Relationship to Anchor Bar',
            // @ts-expect-error unsafe access okay in test
            relationship: anchorBarRelationships.docs[0].id,
            tenant: anchorBarTenantID,
          },
          req: {
            headers: new Headers([['cookie', `payload-tenant=${anchorBarTenantID}`]]),
          },
        })

        // @ts-expect-error unsafe access okay in test
        expect(newRelationship.relationship?.title).toBe('Owned by bar with no ac')
      })

      it('ensure relationship document with relationship to different tenant cannot be created if tenant header passed', async () => {
        await expect(
          payload.create({
            collection: 'relationships',
            data: {
              title: 'Relationship to Blue Dog',
              // @ts-expect-error unsafe access okay in test
              relationship: blueDogRelationships.docs[0].id,
              tenant: anchorBarTenantID,
            },
            req: {
              headers: new Headers([['cookie', `payload-tenant=${anchorBarTenantID}`]]),
            },
          }),
        ).rejects.toThrow('The following field is invalid: Relationship')
      })

      it('ensure relationship document with relationship to different tenant cannot be created even if no tenant header passed', async () => {
        // Should filter based on data.tenant instead of tenant cookie
        await expect(
          payload.create({
            collection: 'relationships',
            data: {
              title: 'Relationship to Blue Dog',
              // @ts-expect-error unsafe access okay in test
              relationship: blueDogRelationships.docs[0].id,
              tenant: anchorBarTenantID,
            },
            req: {},
          }),
        ).rejects.toThrow('The following field is invalid: Relationship')
      })
    })
  })

  describe('access control for users with no tenant memberships', () => {
    it('should return Forbidden error (not 500) for user with no tenants', async () => {
      // Create a user with no tenant memberships
      const noTenantUser = await payload.create({
        collection: usersSlug,
        data: {
          email: 'no-tenants@test.com',
          password: 'test',
          tenants: [],
        },
      })

      // Create a tenant and document for testing
      const tenant = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Test Tenant', domain: 'test-tenant.test' },
      })
      const doc = await payload.create({
        collection: relationshipsSlug,
        data: { tenant: tenant.id, title: 'Test Doc' },
      })

      // User with no tenants should get a Forbidden error (clean rejection)
      // not a 500 server error (which happens with { $in: [] } on CosmosDB)
      await expect(
        payload.find({
          collection: relationshipsSlug,
          overrideAccess: false,
          user: noTenantUser,
          where: { id: { equals: doc.id } },
        }),
      ).rejects.toThrow('You are not allowed to perform this action.')

      // Cleanup
      await payload.delete({ id: doc.id, collection: relationshipsSlug })
      await payload.delete({ id: tenant.id, collection: tenantsSlug })
      await payload.delete({ id: noTenantUser.id, collection: usersSlug })
    })

    it('should allow user with no tenants to access their own user document', async () => {
      // Create a user with no tenant memberships
      const noTenantUser = await payload.create({
        collection: usersSlug,
        data: {
          email: 'no-tenants-self@test.com',
          password: 'test',
          tenants: [],
        },
      })

      // User should be able to find themselves
      const result = await payload.find({
        collection: usersSlug,
        overrideAccess: false,
        user: noTenantUser,
        where: { id: { equals: noTenantUser.id } },
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0]?.id).toBe(noTenantUser.id)

      // Cleanup
      await payload.delete({ id: noTenantUser.id, collection: usersSlug })
    })

    it('should allow admin with empty tenants array to access all documents', async () => {
      // Create an admin user with empty tenants array
      const adminUser = await payload.create({
        collection: usersSlug,
        data: {
          email: 'admin-empty-tenants@test.com',
          password: 'test',
          tenants: [],
          roles: ['admin'],
        },
      })

      // Create a tenant and document
      const tenant = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Admin Test Tenant', domain: 'admin-test.test' },
      })
      const doc = await payload.create({
        collection: relationshipsSlug,
        data: { tenant: tenant.id, title: 'Admin Test Doc' },
      })

      // Admin should have access (userHasAccessToAllTenants returns true for super-admin)
      const result = await payload.find({
        collection: relationshipsSlug,
        overrideAccess: false,
        user: adminUser,
        where: { id: { equals: doc.id } },
      })

      expect(result.docs).toHaveLength(1)

      // Cleanup
      await payload.delete({ id: doc.id, collection: relationshipsSlug })
      await payload.delete({ id: tenant.id, collection: tenantsSlug })
      await payload.delete({ id: adminUser.id, collection: usersSlug })
    })
  })

  describe('access control with user object passed directly', () => {
    it('should enforce tenant access when user object is fetched from database', async () => {
      // Create two tenants
      const tenantA = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Tenant A', domain: 'tenant-a.test' },
      })
      const tenantB = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Tenant B', domain: 'tenant-b.test' },
      })

      // Create a user assigned ONLY to Tenant A
      const user = await payload.create({
        collection: usersSlug,
        data: {
          email: 'user-tenant-a@test.com',
          password: 'test',
          tenants: [{ tenant: tenantA.id }],
        },
      })

      // Create a document in Tenant B (user should NOT have access)
      const doc = await payload.create({
        collection: relationshipsSlug,
        data: { tenant: tenantB.id, title: 'Tenant B Doc' },
      })

      // Fetch user from database - this returns a user WITHOUT .collection property
      // Bug: when user.collection is undefined, tenant access check is bypassed
      const fetchedUser = await payload.findByID({
        id: user.id,
        collection: usersSlug,
      })

      // User from Tenant A should NOT be able to access Tenant B's document
      const result = await payload.find({
        collection: relationshipsSlug,
        overrideAccess: false,
        user: fetchedUser,
        where: { id: { equals: doc.id } },
      })

      expect(result.docs).toHaveLength(0)

      // Cleanup
      await payload.delete({ id: doc.id, collection: relationshipsSlug })
      await payload.delete({ id: user.id, collection: usersSlug })
      await payload.delete({ id: tenantA.id, collection: tenantsSlug })
      await payload.delete({ id: tenantB.id, collection: tenantsSlug })
    })
  })

  describe('hasMany tenant field filtering', () => {
    it('should not double-wrap tenant arrays in filterOptions', async () => {
      const tenant1 = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Tenant 1', domain: 'tenant1.test' },
      })
      const tenant2 = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Tenant 2', domain: 'tenant2.test' },
      })

      // Create a post with multiple tenants (hasMany: true)
      const post = await payload.create({
        collection: multiTenantPostsSlug,
        data: {
          title: 'Multi-tenant post',
          tenant: [tenant1.id, tenant2.id],
        },
      })

      // Get the parent relationship field
      const parentField = payload.collections[multiTenantPostsSlug].config.fields.find(
        (f) => 'name' in f && f.name === 'parent',
      ) as any

      // Call filterOptions - this internally calls filterDocumentsByTenants with the array
      const filter = await parentField.filterOptions({
        data: post,
        relationTo: multiTenantPostsSlug,
        req: { payload } as any,
      })

      // Array should not be double-wrapped
      expect(Array.isArray(filter.tenant.in[0])).toBe(false)
      expect(Array.isArray(filter.tenant.in[1])).toBe(false)

      // Cleanup
      await payload.delete({ id: post.id, collection: multiTenantPostsSlug })
      await payload.delete({ id: tenant1.id, collection: tenantsSlug })
      await payload.delete({ id: tenant2.id, collection: tenantsSlug })
    })
  })
})
