import type { DefaultDocumentIDType, PaginatedDocs } from 'payload'

import { ValidationError } from 'payload'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Relationship } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  autosaveGlobalSlug,
  menuSlug,
  multiTenantPostsSlug,
  relationshipsSlug,
  tenantsSlug,
  usersSlug,
} from './shared.js'

let token: string

const suiteOptions = {
  config: './config.ts',
  resetBetweenTests: false,
}

test.suite('@payloadcms/plugin-multi-tenant', suiteOptions, () => {
  test.beforeAll(async ({ restClientInstance: restClient }) => {
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

  test.describe('tenants', () => {
    test('should create a tenant', async ({ payload }) => {
      const tenant1 = await payload.create({
        collection: tenantsSlug,
        data: {
          name: 'tenant1',
          domain: 'tenant1.com',
        },
      })

      expect(tenant1).toHaveProperty('id')
    })

    test.describe('relationships', () => {
      let anchorBarRelationships: PaginatedDocs<Relationship>
      let blueDogRelationships: PaginatedDocs<Relationship>
      let anchorBarTenantID: DefaultDocumentIDType
      let blueDogTenantID: DefaultDocumentIDType

      test.beforeEach(async ({ payload }) => {
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

      test('ensure relationship document with relationship within same tenant can be created', async ({
        payload,
      }) => {
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

      test('ensure relationship document with relationship to different tenant cannot be created if tenant header passed', async ({
        payload,
      }) => {
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

      test('ensure relationship document with relationship to different tenant cannot be created even if no tenant header passed', async ({
        payload,
      }) => {
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

  test.describe('access control for users with no tenant memberships', () => {
    test('should return Forbidden error (not 500) for user with no tenants', async ({
      payload,
    }) => {
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

    test('should allow user with no tenants to access their own user document', async ({
      payload,
    }) => {
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

    test('should allow admin with empty tenants array to access all documents', async ({
      payload,
    }) => {
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

  test.describe('access control with user object passed directly', () => {
    test('should enforce tenant access when user object is fetched from database', async ({
      payload,
    }) => {
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

  test.describe('tenant membership enforcement on writes', () => {
    let tenantA: { id: DefaultDocumentIDType }
    let tenantB: { id: DefaultDocumentIDType }
    let tenantMemberUser: { id: DefaultDocumentIDType }
    const createdRelationshipIDs: DefaultDocumentIDType[] = []
    const createdAutosaveIDs: DefaultDocumentIDType[] = []

    test.beforeEach(async ({ payload }) => {
      tenantA = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Membership Tenant A', domain: 'membership-a.test' },
      })
      tenantB = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Membership Tenant B', domain: 'membership-b.test' },
      })
      // @ts-expect-error The generated user type contains more fields than this test needs.
      tenantMemberUser = await payload.create({
        collection: usersSlug,
        data: {
          email: 'tenant-member@test.com',
          password: 'test',
          tenants: [{ tenant: tenantA.id }],
        },
      })
    })

    test.afterEach(async ({ payload }) => {
      for (const id of createdRelationshipIDs) {
        await payload.delete({ id, collection: relationshipsSlug })
      }
      createdRelationshipIDs.length = 0

      for (const id of createdAutosaveIDs) {
        await payload.delete({ id, collection: autosaveGlobalSlug })
      }
      createdAutosaveIDs.length = 0

      await payload.delete({ id: tenantMemberUser.id, collection: usersSlug })
      await payload.delete({ id: tenantA.id, collection: tenantsSlug })
      await payload.delete({ id: tenantB.id, collection: tenantsSlug })
    })

    const loginAsTenantMember = async (restClient: NextRESTClient): Promise<string> => {
      const result = await restClient
        .POST('/users/login', {
          auth: false,
          body: JSON.stringify({ email: 'tenant-member@test.com', password: 'test' }),
        })
        .then((response) => response.json())

      return result.token
    }

    test('should reject creating a document with an unassigned tenant', async ({ payload }) => {
      await expect(
        payload.create({
          collection: relationshipsSlug,
          data: { tenant: tenantB.id, title: 'Tenant B document' },
          overrideAccess: false,
          user: tenantMemberUser,
        }),
      ).rejects.toThrow(ValidationError)
    })

    test('should reject moving a document to an unassigned tenant', async ({ payload }) => {
      const ownDocument = await payload.create({
        collection: relationshipsSlug,
        data: { tenant: tenantA.id, title: 'Tenant A document' },
        overrideAccess: false,
        user: tenantMemberUser,
      })

      createdRelationshipIDs.push(ownDocument.id)

      await expect(
        payload.update({
          id: ownDocument.id,
          collection: relationshipsSlug,
          data: { tenant: tenantB.id },
          overrideAccess: false,
          user: tenantMemberUser,
        }),
      ).rejects.toThrow(ValidationError)
    })

    test('should reject a REST create with an unassigned tenant', async ({
      payload,
      restClientInstance: restClient,
    }) => {
      const tenantMemberToken = await loginAsTenantMember(restClient)

      const response = await restClient.POST('/relationships', {
        auth: false,
        body: JSON.stringify({ tenant: tenantB.id, title: 'Tenant B REST document' }),
        headers: { Authorization: `JWT ${tenantMemberToken}` },
      })

      expect(response.status).toBe(400)

      const written = await payload.find({
        collection: relationshipsSlug,
        where: { title: { equals: 'Tenant B REST document' } },
      })

      expect(written.docs).toHaveLength(0)
    })

    test('should reject a REST update that moves a document to an unassigned tenant', async ({
      payload,
      restClientInstance: restClient,
    }) => {
      const tenantMemberToken = await loginAsTenantMember(restClient)
      const ownDocument = await payload.create({
        collection: relationshipsSlug,
        data: { tenant: tenantA.id, title: 'Tenant A document' },
        overrideAccess: false,
        user: tenantMemberUser,
      })

      createdRelationshipIDs.push(ownDocument.id)

      const response = await restClient.PATCH(`/relationships/${ownDocument.id}`, {
        auth: false,
        body: JSON.stringify({ tenant: tenantB.id }),
        headers: { Authorization: `JWT ${tenantMemberToken}` },
      })

      expect(response.status).toBe(400)

      const unchangedDocument = await payload.findByID({
        id: ownDocument.id,
        collection: relationshipsSlug,
        depth: 0,
      })

      expect(unchangedDocument.tenant).toBe(tenantA.id)
    })

    test('should reject a REST draft create with an unassigned tenant', async ({
      payload,
      restClientInstance: restClient,
    }) => {
      const tenantMemberToken = await loginAsTenantMember(restClient)

      const response = await restClient.POST('/autosave-global?draft=true', {
        auth: false,
        body: JSON.stringify({ tenant: tenantB.id, title: 'Tenant B REST draft' }),
        headers: { Authorization: `JWT ${tenantMemberToken}` },
      })

      expect(response.status).toBe(400)

      const written = await payload.find({
        collection: autosaveGlobalSlug,
        where: { title: { equals: 'Tenant B REST draft' } },
      })

      expect(written.docs).toHaveLength(0)
    })

    test('should reject creating a draft with an unassigned tenant', async ({ payload }) => {
      await expect(
        payload.create({
          collection: autosaveGlobalSlug,
          data: { tenant: tenantB.id, title: 'Tenant B draft' },
          draft: true,
          overrideAccess: false,
          user: tenantMemberUser,
        }),
      ).rejects.toThrow(ValidationError)
    })

    test('should reject moving a draft to an unassigned tenant', async ({ payload }) => {
      const ownDocument = await payload.create({
        collection: autosaveGlobalSlug,
        data: { tenant: tenantA.id, title: 'Tenant A draft' },
        overrideAccess: false,
        user: tenantMemberUser,
      })

      createdAutosaveIDs.push(ownDocument.id)

      await expect(
        payload.update({
          id: ownDocument.id,
          collection: autosaveGlobalSlug,
          data: { tenant: tenantB.id },
          draft: true,
          overrideAccess: false,
          user: tenantMemberUser,
        }),
      ).rejects.toThrow(ValidationError)
    })

    test('should allow a draft write in an assigned tenant', async ({ payload }) => {
      const ownDraft = await payload.create({
        collection: autosaveGlobalSlug,
        data: { tenant: tenantA.id, title: 'Tenant A draft' },
        draft: true,
        overrideAccess: false,
        user: tenantMemberUser,
      })

      createdAutosaveIDs.push(ownDraft.id)

      const updatedDocument = await payload.update({
        id: ownDraft.id,
        collection: autosaveGlobalSlug,
        data: { title: 'Updated Tenant A draft' },
        draft: true,
        overrideAccess: false,
        user: tenantMemberUser,
      })

      expect(updatedDocument.title).toBe('Updated Tenant A draft')
    })

    test('should preserve the tenant when a partial update omits it', async ({ payload }) => {
      const ownDocument = await payload.create({
        collection: relationshipsSlug,
        data: { tenant: tenantA.id, title: 'Tenant A document' },
        overrideAccess: false,
        user: tenantMemberUser,
      })

      createdRelationshipIDs.push(ownDocument.id)

      const updatedDocument = await payload.update({
        id: ownDocument.id,
        collection: relationshipsSlug,
        data: { title: 'Updated Tenant A document' },
        depth: 0,
        overrideAccess: false,
        user: tenantMemberUser,
      })

      expect(updatedDocument.title).toBe('Updated Tenant A document')
      expect(updatedDocument.tenant).toBe(tenantA.id)
    })

    test('should reject clearing the tenant during a draft update', async ({ payload }) => {
      const ownDraft = await payload.create({
        collection: autosaveGlobalSlug,
        data: { tenant: tenantA.id, title: 'Tenant A draft' },
        overrideAccess: false,
        user: tenantMemberUser,
      })

      createdAutosaveIDs.push(ownDraft.id)

      await expect(
        payload.update({
          id: ownDraft.id,
          collection: autosaveGlobalSlug,
          data: { tenant: null },
          draft: true,
          overrideAccess: false,
          user: tenantMemberUser,
        }),
      ).rejects.toThrow(ValidationError)
    })
  })

  test.describe('tenant cleanup on delete', () => {
    test('should delete a tenant that has a global collection document without hanging', async ({
      payload,
    }) => {
      const tenant = await payload.create({
        collection: tenantsSlug,
        data: { name: 'Cleanup Tenant', domain: 'cleanup-tenant.test' },
      })

      await payload.create({
        collection: menuSlug,
        data: { tenant: tenant.id, title: 'Cleanup Menu' },
      })

      const deletedTenant = await payload.delete({ id: tenant.id, collection: tenantsSlug })

      expect(deletedTenant.id).toBe(tenant.id)

      const remainingTenants = await payload.find({
        collection: tenantsSlug,
        where: { id: { equals: tenant.id } },
      })

      expect(remainingTenants.docs).toHaveLength(0)
    }, 20000)
  })

  test.describe('hasMany tenant field filtering', () => {
    test('should not double-wrap tenant arrays in filterOptions', async ({ payload }) => {
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
