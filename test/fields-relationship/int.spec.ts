import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { Collection1 } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  collection1Slug,
  relationRestrictedSlug,
  slug,
  versionedRelationshipFieldSlug,
} from './slugs.js'

const { email, password } = devUser
const constrainedFilterValue = 'constrained-read'
const constrainedRelationName = 'Constrained relation'

test.suite('Relationship Fields', { config: './config.ts' }, () => {
  test.beforeEach(async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email,
        password,
      },
    })
  })

  test.afterEach(async ({ payload }) => {
    const relationshipDocs = await payload.find({
      collection: slug,
      overrideAccess: true,
      pagination: false,
      where: {
        filter: {
          equals: constrainedFilterValue,
        },
      },
    })

    for (const doc of relationshipDocs.docs) {
      await payload.delete({
        id: doc.id,
        collection: slug,
        overrideAccess: true,
      })
    }

    const relationDocs = await payload.find({
      collection: relationRestrictedSlug,
      overrideAccess: true,
      pagination: false,
      where: {
        name: {
          equals: constrainedRelationName,
        },
      },
    })

    for (const doc of relationDocs.docs) {
      await payload.delete({
        id: doc.id,
        collection: relationRestrictedSlug,
        overrideAccess: true,
      })
    }
  })

  test('should allow elevated callers to set constrained relationship values', async ({
    payload,
  }) => {
    const relationDoc = await payload.create({
      collection: relationRestrictedSlug,
      data: {
        name: constrainedRelationName,
      },
      overrideAccess: true,
    })

    const doc = await payload.create({
      collection: slug,
      data: {
        filter: constrainedFilterValue,
        relationshipRestrictedFiltered: relationDoc.id,
      },
      depth: 0,
      overrideAccess: true,
    })

    expect(doc.relationshipRestrictedFiltered).toBe(relationDoc.id)
  })

  test('should validate constrained relationship values with read access', async ({
    payload,
    restClient,
  }) => {
    const relationDoc = await payload.create({
      collection: relationRestrictedSlug,
      data: {
        name: constrainedRelationName,
      },
      overrideAccess: true,
    })

    const response = await restClient.POST(`/${slug}`, {
      body: JSON.stringify({
        filter: constrainedFilterValue,
        relationshipRestrictedFiltered: relationDoc.id,
      }),
    })
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.errors?.[0]).toMatchObject({
      name: 'ValidationError',
      data: {
        errors: [
          expect.objectContaining({
            path: 'relationshipRestrictedFiltered',
          }),
        ],
      },
    })
  })

  test.describe('Versioned Relationship Field', () => {
    let version2ID: string
    const relatedDocName = 'Related Doc'
    test.beforeEach(async ({ payload }) => {
      const relatedDoc = await payload.create({
        collection: collection1Slug,
        data: {
          name: relatedDocName,
        },
        overrideAccess: true,
      })

      const version1 = await payload.create({
        collection: versionedRelationshipFieldSlug,
        data: {
          relationshipField: {
            relationTo: collection1Slug,
            value: relatedDoc.id,
          },
          title: 'Version 1 Title',
        },
        overrideAccess: true,
      })

      const version2 = await payload.update({
        id: version1.id,
        collection: versionedRelationshipFieldSlug,
        data: {
          title: 'Version 2 Title',
        },
        overrideAccess: true,
      })

      const versions = await payload.findVersions({
        collection: versionedRelationshipFieldSlug,
        limit: 1,
        overrideAccess: true,
        sort: '-updatedAt',
        where: {
          parent: {
            equals: version2.id,
          },
        },
      })

      version2ID = versions.docs[0].id
    })
    test('should return the correct versioned relationship field via REST', async ({
      restClient,
    }) => {
      const version2Data = await restClient
        .GET(`/${versionedRelationshipFieldSlug}/versions/${version2ID}?locale=all`)
        .then((res) => res.json())

      expect(version2Data.version.title).toEqual('Version 2 Title')
      expect(version2Data.version.relationshipField[0].value.name).toEqual(relatedDocName)
    })

    test('should return the correct versioned relationship field via LocalAPI', async ({
      payload,
    }) => {
      const version2Data = await payload.findVersionByID({
        id: version2ID,
        collection: versionedRelationshipFieldSlug,
        locale: 'all',
        overrideAccess: true,
      })

      expect(version2Data.version.title).toEqual('Version 2 Title')
      expect((version2Data.version.relationshipField[0].value as Collection1).name).toEqual(
        relatedDocName,
      )
    })
  })
})
