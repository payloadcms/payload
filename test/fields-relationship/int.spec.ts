import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type { Collection1 } from './payload-types.js'

import { beforeEach, describe, suite, test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { collection1Slug, versionedRelationshipFieldSlug } from './slugs.js'

const { email, password } = devUser

suite('Relationship Fields', { config: './config.ts' }, () => {
  beforeEach(async ({ restClient }) => {
    await restClient.login({
      slug: 'users',
      credentials: {
        email,
        password,
      },
    })
  })

  describe('Versioned Relationship Field', () => {
    let version2ID: string
    const relatedDocName = 'Related Doc'
    beforeEach(async ({ payload }) => {
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
