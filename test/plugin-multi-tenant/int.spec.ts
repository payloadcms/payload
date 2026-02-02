import type { DefaultDocumentIDType, PaginatedDocs, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/shared/NextRESTClient.js'
import type { Relationship } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/shared/initPayloadInt.js'
import { relationshipsSlug, tenantsSlug, usersSlug } from './shared.js'

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
})
