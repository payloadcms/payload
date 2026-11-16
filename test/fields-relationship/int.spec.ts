import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Collection1 } from './payload-types.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { devUser } from '../credentials.js'
import {
  collection1Slug,
  relationRestrictedSlug,
  slug,
  versionedRelationshipFieldSlug,
} from './slugs.js'

let payload: Payload
let restClient: NextRESTClient

const { email, password } = devUser

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const constrainedFilterValue = 'constrained-read'
const constrainedRelationName = 'Constrained relation'

describe('Relationship Fields', () => {
  beforeAll(async () => {
    const initialized = await initPayloadInt(dirname)
    ;({ payload, restClient } = initialized)

    await restClient.login({
      slug: 'users',
      credentials: {
        email,
        password,
      },
    })
  })

  afterAll(async () => {
    await payload.destroy()
  })

  afterEach(async () => {
    const relationshipDocs = await payload.find({
      collection: slug,
      pagination: false,
      overrideAccess: true,
      where: {
        filter: {
          equals: constrainedFilterValue,
        },
      },
    })

    for (const doc of relationshipDocs.docs) {
      await payload.delete({
        collection: slug,
        id: doc.id,
        overrideAccess: true,
      })
    }

    const relationDocs = await payload.find({
      collection: relationRestrictedSlug,
      pagination: false,
      overrideAccess: true,
      where: {
        name: {
          equals: constrainedRelationName,
        },
      },
    })

    for (const doc of relationDocs.docs) {
      await payload.delete({
        collection: relationRestrictedSlug,
        id: doc.id,
        overrideAccess: true,
      })
    }
  })

  it('should allow elevated callers to set constrained relationship values', async () => {
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
    })

    expect(doc.relationshipRestrictedFiltered).toBe(relationDoc.id)
  })

  it('should validate constrained relationship values with read access', async () => {
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

  describe('Versioned Relationship Field', () => {
    let version2ID: string
    const relatedDocName = 'Related Doc'
    beforeAll(async () => {
      const relatedDoc = await payload.create({
        collection: collection1Slug,
        data: {
          name: relatedDocName,
        },
      })

      const version1 = await payload.create({
        collection: versionedRelationshipFieldSlug,
        data: {
          title: 'Version 1 Title',
          relationshipField: {
            value: relatedDoc.id,
            relationTo: collection1Slug,
          },
        },
      })

      const version2 = await payload.update({
        collection: versionedRelationshipFieldSlug,
        id: version1.id,
        data: {
          title: 'Version 2 Title',
        },
      })

      const versions = await payload.findVersions({
        collection: versionedRelationshipFieldSlug,
        where: {
          parent: {
            equals: version2.id,
          },
        },
        sort: '-updatedAt',
        limit: 1,
      })

      version2ID = versions.docs[0].id
    })
    it('should return the correct versioned relationship field via REST', async () => {
      const version2Data = await restClient
        .GET(`/${versionedRelationshipFieldSlug}/versions/${version2ID}?locale=all`)
        .then((res) => res.json())

      expect(version2Data.version.title).toEqual('Version 2 Title')
      expect(version2Data.version.relationshipField[0].value.name).toEqual(relatedDocName)
    })

    it('should return the correct versioned relationship field via LocalAPI', async () => {
      const version2Data = await payload.findVersionByID({
        collection: versionedRelationshipFieldSlug,
        id: version2ID,
        locale: 'all',
      })

      expect(version2Data.version.title).toEqual('Version 2 Title')
      expect((version2Data.version.relationshipField[0].value as Collection1).name).toEqual(
        relatedDocName,
      )
    })
  })
})
