import type { DefaultDocumentIDType, PaginatedDocs, Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Relationship } from './payload-types.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { tenantsSlug } from './shared.js'

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
})
