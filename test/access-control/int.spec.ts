import type {
  CollectionPermission,
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { AuthenticationError, createLocalReq, Forbidden } from 'payload'
import { getEntityPermissions } from 'payload/internal'
import { expect, vitest } from 'vitest'

import type { FullyRestricted, Post } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import {
  requestHeaders,
  setInheritedReadVersionsAllowedID,
  setInheritedReadVersionsAllowedVersionID,
} from './getConfig.js'
import {
  accessRelationChildSlug,
  accessRelationParentSlug,
  asyncParentSlug,
  authSlug,
  createNotUpdateCollectionSlug,
  docLevelAccessSlug,
  firstArrayText,
  fullyRestrictedSlug,
  hiddenAccessCountSlug,
  hiddenAccessSlug,
  hiddenFieldsSlug,
  hooksSlug,
  inheritedReadVersionsGlobalSlug,
  inheritedReadVersionsSlug,
  inheritedReadVersionsVirtualGlobalSlug,
  inheritedReadVersionsVirtualRelatedSlug,
  inheritedReadVersionsVirtualSlug,
  postReferencesSlug,
  publicUserEmail,
  publicUsersSlug,
  relyOnRequestHeadersSlug,
  restrictedVersionsSlug,
  secondArrayText,
  selfReferentialSlug,
  siblingDataSlug,
  slug,
  unrestrictedSlug,
  userRestrictedCollectionSlug,
  usersSlug,
} from './shared.js'
test.suite({ config: './config.ts', resetBetweenTests: false })('Access Control', () => {
  let post1: Post
  let restricted: FullyRestricted
  let payload!: Payload

  test.beforeAll(async ({ payloadInstance }) => {
    payload = payloadInstance
  })

  test.beforeEach(async ({ payloadInstance }) => {
    payload = payloadInstance
    setInheritedReadVersionsAllowedID(undefined)
    setInheritedReadVersionsAllowedVersionID(undefined)

    post1 = await payload.create({
      collection: slug,
      data: {},
      overrideAccess: true,
    })

    restricted = await payload.create({
      collection: fullyRestrictedSlug,
      data: { name: 'restricted' },
      overrideAccess: true,
    })
  })

  test.describe('Fields', () => {
    test('should not affect hidden fields when patching data', async ({ payload }) => {
      const doc = await payload.create({
        collection: hiddenFieldsSlug,
        data: {
          partiallyHiddenArray: [
            {
              name: 'public_name',
              value: 'private_value',
            },
          ],
          partiallyHiddenGroup: {
            name: 'public_name',
            value: 'private_value',
          },
        },
        overrideAccess: true,
      })

      await payload.update({
        id: doc.id,
        collection: hiddenFieldsSlug,
        data: {
          title: 'Doc Title',
        },
        overrideAccess: true,
      })

      const updatedDoc = await payload.findByID({
        id: doc.id,
        collection: hiddenFieldsSlug,
        overrideAccess: true,
        showHiddenFields: true,
      })

      expect(updatedDoc.partiallyHiddenGroup.value).toStrictEqual('private_value')
      expect(updatedDoc.partiallyHiddenArray[0].value).toStrictEqual('private_value')
    })

    test('should not affect hidden fields when patching data - update many', async ({
      payload,
    }) => {
      const docsMany = await payload.create({
        collection: hiddenFieldsSlug,
        data: {
          partiallyHiddenArray: [
            {
              name: 'public_name',
              value: 'private_value',
            },
          ],
          partiallyHiddenGroup: {
            name: 'public_name',
            value: 'private_value',
          },
        },
        overrideAccess: true,
      })

      await payload.update({
        collection: hiddenFieldsSlug,
        data: {
          title: 'Doc Title',
        },
        overrideAccess: true,
        where: {
          id: { equals: docsMany.id },
        },
      })

      const updatedMany = await payload.findByID({
        id: docsMany.id,
        collection: hiddenFieldsSlug,
        overrideAccess: true,
        showHiddenFields: true,
      })

      expect(updatedMany.partiallyHiddenGroup.value).toStrictEqual('private_value')
      expect(updatedMany.partiallyHiddenArray[0].value).toStrictEqual('private_value')
    })

    test('should be able to restrict access based upon siblingData', async ({ payload }) => {
      const { id } = await payload.create({
        collection: siblingDataSlug,
        data: {
          array: [
            {
              allowPublicReadability: true,
              text: firstArrayText,
            },
            {
              allowPublicReadability: false,
              text: secondArrayText,
            },
          ],
        },
        overrideAccess: true,
      })

      const doc = await payload.findByID({
        id,
        collection: siblingDataSlug,
        overrideAccess: false,
      })

      expect(doc.array?.[0].text).toBe(firstArrayText)
      // Should respect PublicReadabilityAccess function and not be sent
      expect(doc.array?.[1].text).toBeUndefined()

      const docOverride = await payload.findByID({
        id,
        collection: siblingDataSlug,
        overrideAccess: true,
      })

      expect(docOverride.array?.[0].text).toBe(firstArrayText)
      expect(docOverride.array?.[1].text).toBe(secondArrayText)
    })

    test('should use fallback value when trying to update a field without permission', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: hooksSlug,
        data: {
          cannotMutateRequired: 'original',
        },
        overrideAccess: true,
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        data: {
          canMutate: 'canMutate',
          cannotMutateRequired: 'new',
        },
        overrideAccess: false,
      })

      expect(updatedDoc.cannotMutateRequired).toBe('original')
    })

    test('should use fallback value when required data is missing', async ({ payload }) => {
      const doc = await payload.create({
        collection: hooksSlug,
        data: {
          cannotMutateRequired: 'original',
        },
        overrideAccess: true,
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        data: {
          canMutate: 'canMutate',
        },
        overrideAccess: false,
      })

      // should fallback to original data and not throw validation error
      expect(updatedDoc.cannotMutateRequired).toBe('original')
    })

    test('should pass fallback value through to beforeChange hook when access returns false', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: hooksSlug,
        data: {
          cannotMutateNotRequired: 'cannotMutateNotRequired',
          cannotMutateRequired: 'cannotMutateRequired',
        },
        overrideAccess: true,
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        data: {
          cannotMutateNotRequired: 'updated',
        },
        overrideAccess: false,
      })

      // should fallback to original data and not throw validation error
      expect(updatedDoc.cannotMutateRequired).toBe('cannotMutateRequired')
      expect(updatedDoc.cannotMutateNotRequired).toBe('cannotMutateNotRequired')
    })

    test.describe('Password update access', () => {
      const createdAdminUserIDs: string[] = []
      const createdAuthIDs: string[] = []

      test.afterEach(async ({ payload }) => {
        for (const id of createdAdminUserIDs) {
          await payload.delete({ id, collection: usersSlug, overrideAccess: true })
        }
        for (const id of createdAuthIDs) {
          await payload.delete({ id, collection: authSlug, overrideAccess: true })
        }
        createdAdminUserIDs.length = 0
        createdAuthIDs.length = 0
      })

      test('should preserve credentials when password update access is denied', async ({
        payload,
      }) => {
        const originalPassword = 'OriginalPassword123!'
        const replacementPassword = 'ReplacementPassword123!'

        const caller = await payload.create({
          collection: usersSlug,
          data: {
            email: 'credential-editor@example.com',
            password: 'CallerPassword123!',
            roles: ['user'],
          },
          overrideAccess: true,
        })

        createdAdminUserIDs.push(caller.id)

        const account = await payload.create({
          collection: authSlug,
          data: {
            _verified: true,
            email: 'credential-owner@example.com',
            password: originalPassword,
            roles: ['user'],
          },
          overrideAccess: true,
        })

        createdAuthIDs.push(account.id)

        const credentialsBefore = await payload.findByID({
          id: account.id,
          collection: authSlug,
          overrideAccess: true,
          showHiddenFields: true,
        })

        await payload.update({
          id: account.id,
          collection: authSlug,
          data: {
            password: replacementPassword,
          },
          overrideAccess: false,
          user: { ...caller, collection: usersSlug },
        })

        const credentialsAfter = await payload.findByID({
          id: account.id,
          collection: authSlug,
          overrideAccess: true,
          showHiddenFields: true,
        })

        expect({ hash: credentialsAfter.hash, salt: credentialsAfter.salt }).toStrictEqual({
          hash: credentialsBefore.hash,
          salt: credentialsBefore.salt,
        })

        const authenticated = await payload.login({
          collection: authSlug,
          data: {
            email: account.email,
            password: originalPassword,
          },
          overrideAccess: true,
        })

        expect(authenticated.user.id).toBe(account.id)
        await expect(
          payload.login({
            collection: authSlug,
            data: {
              email: account.email,
              password: replacementPassword,
            },
            overrideAccess: true,
          }),
        ).rejects.toThrow(AuthenticationError)
      })
    })

    test('should not return default values for hidden fields with values', async ({ payload }) => {
      const doc = await payload.create({
        collection: hiddenFieldsSlug,
        data: {
          title: 'Test Title',
        },
        overrideAccess: true,
        showHiddenFields: true,
      })

      expect(doc.hiddenWithDefault).toBe('default value')

      const findDoc2 = await payload.findByID({
        id: doc.id,
        collection: hiddenFieldsSlug,
        overrideAccess: false,
      })

      expect(findDoc2.hiddenWithDefault).toBeUndefined()
    })
  })

  test.describe('Duplication', () => {
    const createdAuthCollectionIDs: string[] = []
    const createdPublicUserIDs: string[] = []

    test.afterEach(async ({ payload }) => {
      for (const id of createdAuthCollectionIDs) {
        await payload.delete({ id, collection: authSlug, overrideAccess: true })
      }
      createdAuthCollectionIDs.length = 0

      for (const id of createdPublicUserIDs) {
        await payload.delete({ id, collection: publicUsersSlug, overrideAccess: true })
      }
      createdPublicUserIDs.length = 0
    })

    test('should reject REST duplication when disableDuplicate is true', async ({
      payload,
      restClient,
    }) => {
      const hasDuplicateEndpoint = payload.collections[publicUsersSlug].config.endpoints.some(
        ({ method, path }) => method === 'post' && path === '/:id/duplicate',
      )

      expect.soft(hasDuplicateEndpoint).toBe(false)

      const sourceResult = await payload.find({
        collection: publicUsersSlug,
        limit: 1,
        overrideAccess: true,
        where: {
          email: {
            equals: publicUserEmail,
          },
        },
      })
      const duplicateEmail = 'duplicate-disabled@payloadcms.com'

      const response = await restClient.POST(
        `/${publicUsersSlug}/${sourceResult.docs[0]!.id}/duplicate`,
        {
          auth: false,
          body: JSON.stringify({
            email: duplicateEmail,
            password: 'test-password',
          }),
        },
      )
      const duplicateResult = await payload.find({
        collection: publicUsersSlug,
        overrideAccess: true,
        where: {
          email: {
            equals: duplicateEmail,
          },
        },
      })

      createdPublicUserIDs.push(...duplicateResult.docs.map(({ id }) => id))

      expect.soft(response.status).toBeGreaterThanOrEqual(400)
      expect(duplicateResult.totalDocs).toBe(0)
    })

    test('should reject create with duplicateFromID when disableDuplicate is true', async ({
      payload,
    }) => {
      const sourceResult = await payload.find({
        collection: publicUsersSlug,
        limit: 1,
        overrideAccess: true,
        where: {
          email: {
            equals: publicUserEmail,
          },
        },
      })
      const duplicateEmail = 'duplicate-direct-disabled@payloadcms.com'

      await expect(
        payload.create({
          collection: publicUsersSlug,
          data: {
            email: duplicateEmail,
            password: 'test-password',
          },
          duplicateFromID: sourceResult.docs[0]!.id,
          overrideAccess: false,
        }),
      ).rejects.toThrow(`The collection with slug ${publicUsersSlug} cannot be duplicated.`)

      const duplicateResult = await payload.find({
        collection: publicUsersSlug,
        overrideAccess: true,
        where: {
          email: {
            equals: duplicateEmail,
          },
        },
      })

      createdPublicUserIDs.push(...duplicateResult.docs.map(({ id }) => id))

      expect(duplicateResult.totalDocs).toBe(0)
    })

    test('should not copy fields denied by create access when duplicating', async ({
      payload,
      restClient,
    }) => {
      const source = await payload.create({
        collection: authSlug,
        data: {
          _verified: true,
          email: 'duplicate-source@payloadcms.com',
          password: 'test-password',
          roles: ['admin'],
        },
        overrideAccess: true,
      })
      const duplicateEmail = 'duplicate-request@payloadcms.com'

      createdAuthCollectionIDs.push(source.id)

      const sourceResponse = await restClient.GET(`/${authSlug}/${source.id}`, {
        auth: false,
      })
      const publicSource = (await sourceResponse.json()) as { roles?: string[] }

      expect.soft(sourceResponse.status).toBe(200)
      expect.soft(publicSource.roles).toBeUndefined()

      const response = await restClient.POST(`/${authSlug}/${source.id}/duplicate`, {
        auth: false,
        body: JSON.stringify({
          email: duplicateEmail,
          password: 'test-password',
        }),
      })
      const { doc } = (await response.json()) as { doc: { id: string } }

      createdAuthCollectionIDs.push(doc.id)

      const duplicated = await payload.findByID({
        id: doc.id,
        collection: authSlug,
        overrideAccess: true,
        showHiddenFields: true,
      })

      expect.soft(response.status).toBe(200)
      expect.soft(duplicated.roles).toEqual(['user'])
      expect.soft(duplicated._verified).toBe(false)

      const loginResponse = await restClient.POST(`/${authSlug}/login`, {
        auth: false,
        body: JSON.stringify({
          email: duplicateEmail,
          password: 'test-password',
        }),
      })

      expect(loginResponse.status).not.toBe(200)
    })
  })

  test.describe('Collections', () => {
    test.describe('document-level delete access', () => {
      const createdDocumentIDs: Array<number | string> = []

      test.afterEach(async ({ payload }) => {
        await payload.delete({
          collection: docLevelAccessSlug,
          overrideAccess: true,
          where: {
            id: {
              in: createdDocumentIDs,
            },
          },
        })
        createdDocumentIDs.length = 0
      })

      test('should not run beforeDelete hooks for documents outside delete access', async ({
        payload,
      }) => {
        const beforeDeleteCalls: Array<number | string> = []
        const doc = await payload.create({
          collection: docLevelAccessSlug,
          data: {
            approvedForRemoval: false,
          },
          overrideAccess: true,
        })

        createdDocumentIDs.push(doc.id)

        await expect(
          payload.delete({
            id: doc.id,
            collection: docLevelAccessSlug,
            context: { beforeDeleteCalls },
            overrideAccess: false,
          }),
        ).rejects.toThrow(Forbidden)
        expect(beforeDeleteCalls).toHaveLength(0)
      })

      test('should run beforeDelete hooks for documents within delete access', async ({
        payload,
      }) => {
        const beforeDeleteCalls: Array<number | string> = []
        const doc = await payload.create({
          collection: docLevelAccessSlug,
          data: {
            approvedForRemoval: true,
          },
          overrideAccess: true,
        })

        createdDocumentIDs.push(doc.id)

        const deletedDoc = await payload.delete({
          id: doc.id,
          collection: docLevelAccessSlug,
          context: { beforeDeleteCalls },
          overrideAccess: false,
        })

        expect(deletedDoc.id).toBe(doc.id)
        expect(beforeDeleteCalls).toEqual([doc.id])
      })
    })

    test.describe('relationship queries', () => {
      const createdPostIDs: (number | string)[] = []
      const createdPostReferenceIDs: (number | string)[] = []

      test.afterEach(async ({ payload }) => {
        for (const id of createdPostReferenceIDs) {
          await payload.delete({ id, collection: postReferencesSlug, overrideAccess: true })
        }
        createdPostReferenceIDs.length = 0

        for (const id of createdPostIDs) {
          await payload.delete({ id, collection: slug, overrideAccess: true })
        }
        createdPostIDs.length = 0
      })

      test('should apply related collection access constraints to relationship queries', async ({
        payload,
        restClient,
      }) => {
        const postWithHiddenField = await payload.create({
          collection: slug,
          data: {
            title: 'archived',
          },
          overrideAccess: true,
        })

        const postWithVisibleField = await payload.create({
          collection: slug,
          data: {
            title: 'public',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(postWithHiddenField.id, postWithVisibleField.id)

        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {
            post: [postWithHiddenField.id, postWithVisibleField.id],
          },
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const response = await restClient.GET(`/${postReferencesSlug}`, {
          query: {
            where: {
              'post.title': {
                equals: 'archived',
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.docs).toHaveLength(0)
      })

      test('should apply related collection access constraints when querying another related field', async ({
        payload,
        restClient,
      }) => {
        const postWithHiddenField = await payload.create({
          collection: slug,
          data: {
            title: 'archived',
            title2: 'archived test',
          },
          overrideAccess: true,
        })

        const postWithVisibleField = await payload.create({
          collection: slug,
          data: {
            title: 'public',
            title2: 'public test',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(postWithHiddenField.id, postWithVisibleField.id)

        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {
            post: [postWithHiddenField.id, postWithVisibleField.id],
          },
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const response = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'post.title2': {
                equals: 'archived test',
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toBe(200)
        expect(result.docs).toHaveLength(0)
      })

      test('should apply related collection access constraints to non-hasMany relationship queries', async ({
        payload,
        restClient,
      }) => {
        const archivedPost = await payload.create({
          collection: slug,
          data: {
            title: 'archived',
          },
          overrideAccess: true,
        })

        const publicPost = await payload.create({
          collection: slug,
          data: {
            title: 'public',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(archivedPost.id, publicPost.id)

        const archivedReference = await payload.create({
          collection: postReferencesSlug,
          data: {
            singlePost: archivedPost.id,
          },
          overrideAccess: true,
        })

        const publicReference = await payload.create({
          collection: postReferencesSlug,
          data: {
            singlePost: publicPost.id,
          },
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(archivedReference.id, publicReference.id)

        const hiddenResponse = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'singlePost.title': {
                equals: 'archived',
              },
            },
          },
        })
        const hiddenResult = await hiddenResponse.json()

        expect(hiddenResponse.status).toBe(200)
        expect(hiddenResult.docs).toHaveLength(0)

        const visibleResponse = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'singlePost.title': {
                equals: 'public',
              },
            },
          },
        })
        const visibleResult = await visibleResponse.json()

        expect(visibleResponse.status).toBe(200)
        expect(visibleResult.docs).toHaveLength(1)
        expect(visibleResult.docs[0].id).toBe(publicReference.id)
      })

      test('should apply related collection access constraints to join field queries', async ({
        payload,
        restClient,
      }) => {
        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {},
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const archivedPost = await payload.create({
          collection: slug,
          data: {
            reference: postReference.id,
            title: 'archived',
          },
          overrideAccess: true,
        })

        const publicPost = await payload.create({
          collection: slug,
          data: {
            reference: postReference.id,
            title: 'public',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(archivedPost.id, publicPost.id)

        const hiddenResponse = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'joinedPosts.title': {
                equals: 'archived',
              },
            },
          },
        })
        const hiddenResult = await hiddenResponse.json()

        expect(hiddenResponse.status).toBe(200)
        expect(hiddenResult.docs).toHaveLength(0)

        const visibleResponse = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'joinedPosts.title': {
                equals: 'public',
              },
            },
          },
        })
        const visibleResult = await visibleResponse.json()

        expect(visibleResponse.status).toBe(200)
        expect(visibleResult.docs).toHaveLength(1)
        expect(visibleResult.docs[0].id).toBe(postReference.id)
      })

      test('should apply related collection access constraints to hasMany join field queries', async ({
        payload,
        restClient,
      }) => {
        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {},
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const archivedPost = await payload.create({
          collection: slug,
          data: {
            references: [postReference.id],
            title: 'archived',
          },
          overrideAccess: true,
        })

        const publicPost = await payload.create({
          collection: slug,
          data: {
            references: [postReference.id],
            title: 'public',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(archivedPost.id, publicPost.id)

        const hiddenResponse = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'joinedPostsMany.title': {
                equals: 'archived',
              },
            },
          },
        })
        const hiddenResult = await hiddenResponse.json()

        expect(hiddenResponse.status).toBe(200)
        expect(hiddenResult.docs).toHaveLength(0)

        const visibleResponse = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              'joinedPostsMany.title': {
                equals: 'public',
              },
            },
          },
        })
        const visibleResult = await visibleResponse.json()

        expect(visibleResponse.status).toBe(200)
        expect(visibleResult.docs).toHaveLength(1)
        expect(visibleResult.docs[0].id).toBe(postReference.id)
      })

      test('should apply related collection access constraints to a user-supplied join contains query', async ({
        payload,
        restClient,
      }) => {
        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {},
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const archivedPost = await payload.create({
          collection: slug,
          data: {
            reference: postReference.id,
            title: 'archived',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(archivedPost.id)

        const response = await restClient.GET(`/${postReferencesSlug}`, {
          auth: false,
          query: {
            where: {
              joinedPosts: {
                contains: {
                  title: {
                    equals: 'archived',
                  },
                },
              },
            },
          },
        })
        const result = await response.json()

        expect(result.docs ?? []).toHaveLength(0)
      })

      test('should reject nested queries against a polymorphic join field', async ({ payload }) => {
        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {},
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const archivedPost = await payload.create({
          collection: slug,
          data: {
            reference: postReference.id,
            title: 'archived',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(archivedPost.id)

        await expect(
          payload.find({
            collection: postReferencesSlug,
            overrideAccess: false,
            where: {
              'polymorphicJoinedPosts.title': {
                equals: 'archived',
              },
            },
          }),
        ).rejects.toThrow('Not supported')
      })

      test('should reject nested queries against a join with a polymorphic on relationship', async ({
        payload,
      }) => {
        const postReference = await payload.create({
          collection: postReferencesSlug,
          data: {},
          overrideAccess: true,
        })

        createdPostReferenceIDs.push(postReference.id)

        const archivedPost = await payload.create({
          collection: slug,
          data: {
            polymorphicReference: { relationTo: postReferencesSlug, value: postReference.id },
            title: 'archived',
          },
          overrideAccess: true,
        })

        createdPostIDs.push(archivedPost.id)

        const where = {
          'joinedPostsPolymorphicOn.title': {
            equals: 'archived',
          },
        }

        await expect(
          payload.find({ collection: postReferencesSlug, overrideAccess: false, where }),
        ).rejects.toThrow('Not supported')

        await expect(
          payload.find({ collection: postReferencesSlug, overrideAccess: true, where }),
        ).rejects.toThrow('Not supported')
      })

      test('should not apply parent query constraints to a related collections nested query', async ({
        payload,
      }) => {
        const child = await payload.create({
          collection: accessRelationChildSlug,
          data: { name: 'child', nested: { isActive: true } },
        })

        const parent = await payload.create({
          collection: accessRelationParentSlug,
          data: { title: 'parent', status: 'published', child: child.id },
        })

        const result = await payload.find({
          collection: accessRelationParentSlug,
          overrideAccess: false,
          where: {
            'child.nested.isActive': { equals: true },
          },
        })

        await payload.delete({ collection: accessRelationParentSlug, id: parent.id })
        await payload.delete({ collection: accessRelationChildSlug, id: child.id })

        expect(result.docs).toHaveLength(1)
        expect(result.docs[0]!.id).toBe(parent.id)
      })

      test('should apply the related collection constraint through a self-referential relationship', async ({
        payload,
      }) => {
        const parentA = await payload.create({
          collection: selfReferentialSlug,
          data: { label: 'target', isPublic: false },
        })
        const parentB = await payload.create({
          collection: selfReferentialSlug,
          data: { label: 'target', isPublic: true },
        })
        const childA = await payload.create({
          collection: selfReferentialSlug,
          data: { label: 'child-a', isPublic: true, parent: parentA.id },
        })
        const childB = await payload.create({
          collection: selfReferentialSlug,
          data: { label: 'child-b', isPublic: true, parent: parentB.id },
        })

        // `parent` points back to the same collection, whose access control returns a where
        // constraint that must also apply to the related document.
        const result = await payload.find({
          collection: selfReferentialSlug,
          overrideAccess: false,
          where: {
            'parent.label': { equals: 'target' },
          },
        })

        const ids = [parentA.id, parentB.id, childA.id, childB.id]
        for (const id of ids) {
          await payload.delete({ collection: selfReferentialSlug, id })
        }

        expect(result.docs).toHaveLength(1)
        expect(result.docs[0]!.id).toBe(childB.id)
      })
    })

    test.describe('restricted collection', () => {
      test('field without read access should not show', async ({ payload }) => {
        const { id } = await createDoc({ payload }, { restrictedField: 'restricted' })

        const retrievedDoc = await payload.findByID({ id, collection: slug, overrideAccess: false })

        expect(retrievedDoc.restrictedField).toBeUndefined()
      })

      test.for(['AND', 'OR', 'AnD', 'oR'])(
        'validates field read access inside case-insensitive %s conditions',
        async (logicalOperator, { payload }) => {
          const { id } = await createDoc({ payload }, { restrictedField: 'example' })

          await expect(
            payload.find({
              collection: slug,
              overrideAccess: false,
              where: {
                [logicalOperator]: [
                  {
                    id: { equals: id },
                  },
                  {
                    restrictedField: {
                      equals: 'example',
                    },
                  },
                ],
              },
            }),
          ).rejects.toThrow('The following path cannot be queried: restrictedField')
        },
      )

      test('rejects array-valued field conditions', async ({ payload }) => {
        await expect(
          payload.find({
            collection: slug,
            overrideAccess: false,
            where: {
              restrictedField: [{ equals: 'example' }],
            } as any,
          }),
        ).rejects.toThrow('The following path cannot be queried: restrictedField')
      })

      test('should respect access control for join request where queries of relationship properties', async ({
        payload,
      }) => {
        const post = await createDoc({ payload }, {})
        await createDoc({ payload }, { name: 'test', post: post.id }, 'relation-restricted')
        await expect(
          payload.find({
            collection: 'relation-restricted',
            overrideAccess: false,
            where: {
              'post.restrictedField': {
                equals: 'restricted',
              },
            },
          }),
        ).rejects.toThrow('The following path cannot be queried: restrictedField')
      })

      test('should reject constrained sort paths', async ({ payload }) => {
        const requests = [
          payload.find({
            collection: slug,
            overrideAccess: false,
            sort: 'restrictedField',
          }),
          payload.find({
            collection: 'relation-restricted',
            overrideAccess: false,
            sort: 'post.restrictedField',
          }),
          payload.find({
            collection: 'relation-restricted',
            overrideAccess: false,
            sort: 'postLabel',
          }),
          payload.find({
            collection: 'sort-default-restricted',
            overrideAccess: false,
          }),
          payload.find({
            collection: slug,
            joins: {
              relatedItems: {
                sort: 'rank',
              },
            },
            overrideAccess: false,
          }),
          payload.findDistinct({
            collection: 'relation-restricted',
            field: 'name',
            overrideAccess: false,
            sort: 'rank',
          }),
          payload.update({
            collection: 'relation-restricted',
            data: {
              name: 'updated',
            },
            limit: 1,
            overrideAccess: false,
            sort: 'rank',
            where: {},
          }),
          payload.find({
            collection: 'fields-and-top-access',
            draft: true,
            overrideAccess: false,
            sort: 'secret',
          }),
          payload.findVersions({
            collection: 'fields-and-top-access',
            overrideAccess: false,
            sort: 'version.secret',
          }),
          payload.findGlobalVersions({
            slug: 'settings',
            overrideAccess: false,
            sort: 'version.secret',
          }),
        ]

        await Promise.all(
          requests.map((request) =>
            expect(request).rejects.toThrow('The following path cannot be queried'),
          ),
        )
      })

      test('should show a field without read access when overrideAccess is true', async ({
        payload,
      }) => {
        const { id, restrictedField } = await createDoc(
          { payload },
          { restrictedField: 'restricted' },
        )

        const retrievedDoc = await payload.findByID({ id, collection: slug, overrideAccess: true })

        expect(retrievedDoc.restrictedField).toStrictEqual(restrictedField)
      })

      test('should hide a field without read access when overrideAccess defaults to false', async ({
        payload,
      }) => {
        const { id } = await createDoc({ payload }, { restrictedField: 'restricted' })

        const retrievedDoc = await payload.findByID({ id, collection: slug })

        expect(retrievedDoc.restrictedField).toBeUndefined()
      })
    })
    test.describe('non-enumerated request properties passed to access control', () => {
      test('access control ok when passing request headers', async ({ payload }) => {
        const req = {
          headers: requestHeaders,
        } as PayloadRequest
        const name = 'name'
        const overrideAccess = false

        const { id } = await createDoc({ payload }, { name }, relyOnRequestHeadersSlug, {
          overrideAccess,
          req,
        })
        const docById = await payload.findByID({
          id,
          collection: relyOnRequestHeadersSlug,
          overrideAccess,
          req,
        })
        const { docs: docsByName } = await payload.find({
          collection: relyOnRequestHeadersSlug,
          overrideAccess,
          req,
          where: {
            name: {
              equals: name,
            },
          },
        })

        expect(docById).not.toBeUndefined()
        expect(docsByName.length).toBeGreaterThan(0)
      })

      test('access control fails when omitting request headers', async ({ payload }) => {
        const name = 'name'
        const overrideAccess = false

        await expect(() =>
          createDoc({ payload }, { name }, relyOnRequestHeadersSlug, {
            overrideAccess,
          }),
        ).rejects.toThrow(Forbidden)
        const { id } = await createDoc({ payload }, { name }, relyOnRequestHeadersSlug)

        await expect(() =>
          payload.findByID({ id, collection: relyOnRequestHeadersSlug, overrideAccess }),
        ).rejects.toThrow(Forbidden)

        await expect(() =>
          payload.find({
            collection: relyOnRequestHeadersSlug,
            overrideAccess,
            where: {
              name: {
                equals: name,
              },
            },
          }),
        ).rejects.toThrow(Forbidden)
      })
    })
  })

  test.describe('Override Access', () => {
    test.describe('Fields', () => {
      test('should reject field update with overrideAccess: false', async ({ payload }) => {
        const req = async () =>
          await payload.update({
            id: post1.id,
            collection: slug,
            data: { restrictedField: restricted.id },
            overrideAccess: false, // this should respect access control
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      test('should allow field update with overrideAccess: true', async ({ payload }) => {
        const doc = await payload.update({
          id: post1.id,
          collection: slug,
          data: { restrictedField: restricted.id },
          overrideAccess: true, // this should override access control
        })

        expect(doc).toMatchObject({ id: post1.id })
      })

      test('should respect field access control by default', async ({ payload }) => {
        const req = async () =>
          await payload.update({
            id: post1.id,
            collection: slug,
            data: { restrictedField: restricted.id },
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      test('should reject field update many with overrideAccess: false', async ({ payload }) => {
        const req = async () =>
          await payload.update({
            collection: slug,
            data: { restrictedField: restricted.id },
            overrideAccess: false, // this should respect access control
            where: {
              id: { equals: post1.id },
            },
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      test('should allow field update many with overrideAccess: true', async ({ payload }) => {
        const doc = await payload.update({
          collection: slug,
          data: { restrictedField: restricted.id },
          overrideAccess: true, // this should override access control
          where: {
            id: { equals: post1.id },
          },
        })

        expect(doc.docs[0]).toMatchObject({ id: post1.id })
      })

      test('should respect field access control by default - update many', async ({ payload }) => {
        const req = async () =>
          await payload.update({
            collection: slug,
            data: { restrictedField: restricted.id },
            where: {
              id: { equals: post1.id },
            },
          })

        await expect(req).rejects.toThrow(Forbidden)
      })
    })

    test.describe('Collections', () => {
      const updatedName = 'updated'

      test('should reject collection update with overrideAccess: false', async ({ payload }) => {
        const req = async () =>
          await payload.update({
            id: restricted.id,
            collection: fullyRestrictedSlug,
            data: { name: updatedName },
            overrideAccess: false, // this should respect access control
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      test('should allow collection update with overrideAccess: true', async ({ payload }) => {
        const doc = await payload.update({
          id: restricted.id,
          collection: fullyRestrictedSlug,
          data: { name: updatedName },
          overrideAccess: true, // this should override access control
        })

        expect(doc).toMatchObject({ id: restricted.id, name: updatedName })
      })

      test('should respect collection access control by default', async ({ payload }) => {
        const req = async () =>
          await payload.update({
            id: restricted.id,
            collection: fullyRestrictedSlug,
            data: { name: updatedName },
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      test('should reject collection update many with overrideAccess: false', async ({
        payload,
      }) => {
        const req = async () =>
          await payload.update({
            collection: fullyRestrictedSlug,
            data: { name: updatedName },
            overrideAccess: false, // this should respect access control
            where: {
              id: { equals: restricted.id },
            },
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      test('should allow collection update many with overrideAccess: true', async ({ payload }) => {
        const doc = await payload.update({
          collection: fullyRestrictedSlug,
          data: { name: updatedName },
          overrideAccess: true, // this should override access control
          where: {
            id: { equals: restricted.id },
          },
        })

        expect(doc.docs[0]).toMatchObject({ id: restricted.id, name: updatedName })
      })

      test('should respect collection access control by default - update many', async ({
        payload,
      }) => {
        const req = async () =>
          await payload.update({
            collection: fullyRestrictedSlug,
            data: { name: updatedName },
            where: {
              id: { equals: restricted.id },
            },
          })

        await expect(req).rejects.toThrow(Forbidden)
      })
    })
  })

  test.describe('Querying', () => {
    test.describe('findDistinct', () => {
      const createNotUpdateDocumentIDs: (number | string)[] = []
      const parentDocumentIDs: (number | string)[] = []
      const userRestrictedDocumentIDs: (number | string)[] = []

      test.afterEach(async ({ payload }) => {
        await Promise.all(
          parentDocumentIDs.map((id) =>
            payload.delete({ id, collection: unrestrictedSlug, overrideAccess: true }),
          ),
        )
        await Promise.all(
          createNotUpdateDocumentIDs.map((id) =>
            payload.delete({ id, collection: createNotUpdateCollectionSlug, overrideAccess: true }),
          ),
        )
        await Promise.all(
          userRestrictedDocumentIDs.map((id) =>
            payload.delete({ id, collection: userRestrictedCollectionSlug, overrideAccess: true }),
          ),
        )

        createNotUpdateDocumentIDs.length = 0
        parentDocumentIDs.length = 0
        userRestrictedDocumentIDs.length = 0
      })

      test('should constrain distinct paths by related collection read access', async ({
        payload,
      }) => {
        const availableDocument = await payload.create({
          collection: userRestrictedCollectionSlug,
          data: { name: 'available' },
          overrideAccess: true,
        })
        const archivedDocument = await payload.create({
          collection: userRestrictedCollectionSlug,
          data: { name: 'archived' },
          overrideAccess: true,
        })
        userRestrictedDocumentIDs.push(availableDocument.id, archivedDocument.id)
        const parentDocument = await payload.create({
          collection: unrestrictedSlug,
          data: { userRestrictedDocs: [availableDocument.id, archivedDocument.id] },
          overrideAccess: true,
        })
        parentDocumentIDs.push(parentDocument.id)

        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          field: 'userRestrictedDocs.name' as any,
          limit: 1,
          overrideAccess: false,
        })

        expect(result).toMatchObject({
          totalDocs: 1,
          values: [{ 'userRestrictedDocs.name': 'available' }],
        })
      })

      test('should reject distinct paths through collections with denied read access', async ({
        payload,
      }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            field: 'fullyRestrictedDocs.name' as any,
            overrideAccess: false,
          }),
        ).rejects.toThrow('The following path cannot be queried: fullyRestrictedDocs.name')
      })

      test('should return no distinct values for denied related access when errors are disabled', async ({
        payload,
      }) => {
        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          disableErrors: true,
          field: 'fullyRestrictedDocs.name' as any,
          overrideAccess: false,
        })

        expect(result).toMatchObject({ totalDocs: 0, values: [] })
      })

      test('should validate related access for terminal IDs reached through joins', async ({
        payload,
      }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            field: 'restrictedRelatedItems.id' as any,
            overrideAccess: false,
          }),
        ).rejects.toThrow(
          'Field restrictedRelatedItems.id was not found in the collection unrestricted',
        )
      })

      test('should reject distinct paths through unreadable relationship fields', async ({
        payload,
      }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            field: 'restrictedUserDocs.name' as any,
            overrideAccess: false,
          }),
        ).rejects.toThrow('The following path cannot be queried')
      })

      test('should find distinct values through readable relationships', async ({ payload }) => {
        const relatedDocument = await payload.create({
          collection: createNotUpdateCollectionSlug,
          data: { name: 'available' },
          overrideAccess: true,
        })
        createNotUpdateDocumentIDs.push(relatedDocument.id)
        const parentDocument = await payload.create({
          collection: unrestrictedSlug,
          data: { createNotUpdateDocs: [relatedDocument.id] },
          overrideAccess: true,
        })
        parentDocumentIDs.push(parentDocument.id)

        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          field: 'createNotUpdateDocs.name' as any,
          overrideAccess: false,
        })

        expect(result.values).toStrictEqual([{ 'createNotUpdateDocs.name': 'available' }])
      })

      test('should find distinct relationship IDs without reading the related collection', async ({
        payload,
      }) => {
        const relatedDocument = await payload.create({
          collection: userRestrictedCollectionSlug,
          data: { name: 'archived' },
          overrideAccess: true,
        })
        userRestrictedDocumentIDs.push(relatedDocument.id)
        const parentDocument = await payload.create({
          collection: unrestrictedSlug,
          data: { userRestrictedDoc: relatedDocument.id },
          overrideAccess: true,
        })
        parentDocumentIDs.push(parentDocument.id)

        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          field: 'userRestrictedDoc.id' as any,
          overrideAccess: false,
        })

        expect(result.values).toStrictEqual([{ 'userRestrictedDoc.id': relatedDocument.id }])
      })

      test('should allow distinct paths through constrained relationships when overriding access', async ({
        payload,
      }) => {
        const relatedDocument = await payload.create({
          collection: userRestrictedCollectionSlug,
          data: { name: 'archived' },
          overrideAccess: true,
        })
        userRestrictedDocumentIDs.push(relatedDocument.id)
        const parentDocument = await payload.create({
          collection: unrestrictedSlug,
          data: { userRestrictedDocs: [relatedDocument.id] },
          overrideAccess: true,
        })
        parentDocumentIDs.push(parentDocument.id)

        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          field: 'userRestrictedDocs.name' as any,
          overrideAccess: true,
        })

        expect(result.values).toStrictEqual([{ 'userRestrictedDocs.name': 'archived' }])
      })

      test('should find distinct hidden values when hidden fields are explicitly shown', async ({
        payload,
      }) => {
        const parentDocument = await payload.create({
          collection: unrestrictedSlug,
          data: { hiddenName: 'visible by request' } as any,
          overrideAccess: true,
        })
        parentDocumentIDs.push(parentDocument.id)

        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          field: 'hiddenName' as any,
          overrideAccess: false,
          showHiddenFields: true,
        })

        expect(result.values).toStrictEqual([{ hiddenName: 'visible by request' }])
      })

      test('should find distinct nested hidden values when hidden fields are explicitly shown', async ({
        payload,
      }) => {
        const relatedDocument = await payload.create({
          collection: createNotUpdateCollectionSlug,
          data: { name: 'available', hiddenName: 'visible by request' } as any,
          overrideAccess: true,
        })
        createNotUpdateDocumentIDs.push(relatedDocument.id)
        const parentDocument = await payload.create({
          collection: unrestrictedSlug,
          data: { createNotUpdateDocs: [relatedDocument.id] },
          overrideAccess: true,
        })
        parentDocumentIDs.push(parentDocument.id)

        const result = await payload.findDistinct({
          collection: unrestrictedSlug,
          field: 'createNotUpdateDocs.hiddenName' as any,
          overrideAccess: false,
          showHiddenFields: true,
        })

        expect(result.values).toStrictEqual([
          { 'createNotUpdateDocs.hiddenName': 'visible by request' },
        ])
      })

      test('should preserve forbidden errors for hidden distinct fields', async ({ payload }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            field: 'hiddenName' as any,
            overrideAccess: false,
          }),
        ).rejects.toMatchObject({ status: 403 })
      })

      test('should preserve forbidden errors for unreadable distinct fields', async ({
        payload,
      }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            field: 'restrictedName' as any,
            overrideAccess: false,
          }),
        ).rejects.toMatchObject({ status: 403 })
      })

      test('should preserve forbidden errors for nested hidden distinct fields', async ({
        payload,
      }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            field: 'fullyRestrictedDocs.hiddenName' as any,
            overrideAccess: false,
          }),
        ).rejects.toMatchObject({ status: 403 })
      })

      test('should preserve forbidden errors for nested unreadable fields when errors are disabled', async ({
        payload,
      }) => {
        await expect(
          payload.findDistinct({
            collection: unrestrictedSlug,
            disableErrors: true,
            field: 'fullyRestrictedDocs.restrictedName' as any,
            overrideAccess: false,
          }),
        ).rejects.toMatchObject({ status: 403 })
      })
    })

    test('should respect query constraint using hidden field', async ({ payload }) => {
      await payload.create({
        collection: hiddenAccessSlug,
        data: {
          title: 'hello',
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: hiddenAccessSlug,
        data: {
          hidden: true,
          title: 'hello',
        },
        overrideAccess: true,
      })

      const { docs } = await payload.find({
        collection: hiddenAccessSlug,
        overrideAccess: false,
      })

      expect(docs).toHaveLength(1)
    })

    test('should respect query constraint using hidden field on count', async ({ payload }) => {
      await payload.create({
        collection: hiddenAccessCountSlug,
        data: {
          title: 'hello',
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: hiddenAccessCountSlug,
        data: {
          hidden: true,
          title: 'hello',
        },
        overrideAccess: true,
      })

      const { totalDocs } = await payload.count({
        collection: hiddenAccessCountSlug,
        overrideAccess: false,
      })

      expect(totalDocs).toBe(1)
    })

    test('should respect query constraint using hidden field on versions', async ({ payload }) => {
      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'match',
          hidden: true,
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'match',
          hidden: false,
        },
        overrideAccess: true,
      })

      const { docs } = await payload.findVersions({
        collection: restrictedVersionsSlug,
        overrideAccess: false,
        where: {
          'version.name': { equals: 'match' },
        },
      })

      expect(docs).toHaveLength(1)
    })

    test('should ignore false access on query constraint added by top collection level access control', async ({
      payload,
    }) => {
      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
        overrideAccess: true,
      })
      const { id: hitID } = await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-success-access-read' },
        overrideAccess: true,
      })
      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
        overrideAccess: true,
      })

      // assert find, only will-success should be in the result
      const resFind = await payload.find({
        collection: 'fields-and-top-access',
        overrideAccess: false,
      })
      expect(resFind.docs[0].id).toBe(hitID)
      expect(resFind.docs).toHaveLength(1)

      // assert find draft: true
      const resFindDraft = await payload.find({
        collection: 'fields-and-top-access',
        draft: true,
        overrideAccess: false,
      })

      expect(resFindDraft.docs).toHaveLength(1)
      expect(resFind.docs[0].id).toBe(hitID)

      // assert findByID
      const res = await payload.findByID({
        id: hitID,
        collection: 'fields-and-top-access',
        overrideAccess: false,
      })

      expect(res).toBeTruthy()
    })

    test('should ignore false access in versions on query constraint added by top collection level access control', async ({
      payload,
    }) => {
      // clean up
      await payload.delete({ collection: 'fields-and-top-access', overrideAccess: true, where: {} })

      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
        overrideAccess: true,
      })
      const { id: hitID } = await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-success-access-read' },
        overrideAccess: true,
      })
      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
        overrideAccess: true,
      })

      // Assert findVersions only will-success should be in the result
      const resFind = await payload.findVersions({
        collection: 'fields-and-top-access',
        overrideAccess: false,
      })
      expect(resFind.docs).toHaveLength(1)

      const version = resFind.docs[0]
      expect(version.parent).toBe(hitID)

      // Assert findVersionByID
      const res = await payload.findVersionByID({
        id: version.id,
        collection: 'fields-and-top-access',
        overrideAccess: false,
      })

      expect(res).toBeTruthy()
    })

    test('should use the query fallback from id-based read access for version lists', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'denied' },
        overrideAccess: true,
      })
      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      setInheritedReadVersionsAllowedID(allowedID)

      const allowedVersions = await payload.findVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: false,
      })

      expect(allowedVersions.docs).toHaveLength(1)
      expect(allowedVersions.docs[0].parent).toBe(allowedID)

      const allowedVersionsCount = await payload.countVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: false,
      })

      expect(allowedVersionsCount.totalDocs).toBe(1)

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should preserve the document id when checking inherited version permissions', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'denied' },
        overrideAccess: true,
      })
      const deniedDoc = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      setInheritedReadVersionsAllowedID(allowedID)

      const permissions = await getEntityPermissions({
        id: deniedDoc.id,
        blockReferencesPermissions: {},
        entity: payload.collections[inheritedReadVersionsSlug].config,
        entityType: 'collection',
        fetchData: true,
        operations: ['read', 'readVersions'],
        req: await createLocalReq({}, payload),
      })

      expect(permissions.read?.permission).toBe(false)
      expect(permissions.readVersions?.permission).toBe(false)

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should pass the parent document id to inherited read access for findVersionByID', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: deniedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'denied' },
        overrideAccess: true,
      })
      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      setInheritedReadVersionsAllowedID(allowedID)

      const versions = await payload.findVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
      })
      const allowedVersion = versions.docs.find(({ parent }) => parent === allowedID)!
      const deniedVersion = versions.docs.find(({ parent }) => parent === deniedID)!

      await expect(
        payload.findVersionByID({
          id: allowedVersion.id,
          collection: inheritedReadVersionsSlug,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({ parent: allowedID })

      await expect(
        payload.findVersionByID({
          id: deniedVersion.id,
          collection: inheritedReadVersionsSlug,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toBeNull()

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should pass the version id to base readVersions access for findVersionByID', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: allowedParentID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      await payload.update({
        id: allowedParentID,
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })

      const { docs } = await payload.findVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {
          parent: {
            equals: allowedParentID,
          },
        },
      })
      const [allowedVersion, deniedVersion] = docs

      setInheritedReadVersionsAllowedID(allowedParentID)
      setInheritedReadVersionsAllowedVersionID(allowedVersion!.id)

      await expect(
        payload.findVersionByID({
          id: allowedVersion!.id,
          collection: inheritedReadVersionsSlug,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({ id: allowedVersion!.id, parent: allowedParentID })

      await expect(
        payload.findVersionByID({
          id: deniedVersion!.id,
          collection: inheritedReadVersionsSlug,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toBeNull()

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should reuse the version lookup when inherited read access returns a boolean', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      setInheritedReadVersionsAllowedID(allowedID)

      const { docs } = await payload.findVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
      })
      const findVersions = vitest.spyOn(payload.db, 'findVersions')

      try {
        await expect(
          payload.findVersionByID({
            id: docs[0].id,
            collection: inheritedReadVersionsSlug,
            overrideAccess: false,
          }),
        ).resolves.toMatchObject({ parent: allowedID })

        expect(findVersions).toHaveBeenCalledTimes(1)
      } finally {
        findVersions.mockRestore()
      }

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should omit the parent field from findVersionByID when it is not selected', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      setInheritedReadVersionsAllowedID(allowedID)

      const { docs } = await payload.findVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
      })

      const res = await payload.findVersionByID({
        id: docs[0].id,
        collection: inheritedReadVersionsSlug,
        overrideAccess: false,
        select: { secret: true },
      })

      expect(res.parent).toBeUndefined()

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should include the parent field on findVersionByID when it is selected', async () => {
      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsSlug,
        data: { secret: 'allowed' },
        overrideAccess: true,
      })
      setInheritedReadVersionsAllowedID(allowedID)

      const { docs } = await payload.findVersions({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
      })

      const res = await payload.findVersionByID({
        id: docs[0].id,
        collection: inheritedReadVersionsSlug,
        overrideAccess: false,
        select: { parent: true, secret: true },
      })

      expect(res.parent).toBe(allowedID)

      await payload.delete({
        collection: inheritedReadVersionsSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should inherit global read access for version operations', async () => {
      await payload.updateGlobal({
        slug: inheritedReadVersionsGlobalSlug,
        data: { visible: false },
        overrideAccess: true,
      })
      await payload.updateGlobal({
        slug: inheritedReadVersionsGlobalSlug,
        data: { visible: true },
        overrideAccess: true,
      })

      const allVersions = await payload.findGlobalVersions({
        slug: inheritedReadVersionsGlobalSlug,
        overrideAccess: true,
        pagination: false,
      })
      const allowedVersion = allVersions.docs.find(({ version }) => version.visible === true)!
      const deniedVersion = allVersions.docs.find(({ version }) => version.visible === false)!

      const allowedVersions = await payload.findGlobalVersions({
        slug: inheritedReadVersionsGlobalSlug,
        overrideAccess: false,
        pagination: false,
      })

      expect(allowedVersions.docs.length).toBeGreaterThan(0)
      expect(allowedVersions.docs.every(({ version }) => version.visible === true)).toBe(true)

      const allowedVersionsCount = await payload.countGlobalVersions({
        global: inheritedReadVersionsGlobalSlug,
        overrideAccess: false,
      })

      expect(allowedVersionsCount.totalDocs).toBe(allowedVersions.totalDocs)

      await expect(
        payload.findGlobalVersionByID({
          id: allowedVersion.id,
          slug: inheritedReadVersionsGlobalSlug,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({ id: allowedVersion.id })

      await expect(
        payload.findGlobalVersionByID({
          id: deniedVersion.id,
          slug: inheritedReadVersionsGlobalSlug,
          disableErrors: true,
          overrideAccess: false,
        }),
      ).resolves.toBeNull()
    })

    test('should evaluate inherited global read version permissions against versions', async () => {
      const req = await createLocalReq({}, payload)

      await payload.db.deleteVersions({
        globalSlug: inheritedReadVersionsGlobalSlug,
        req,
        where: {},
      })

      try {
        await payload.updateGlobal({
          slug: inheritedReadVersionsGlobalSlug,
          data: { visible: false },
          overrideAccess: true,
        })

        const permissions = await getEntityPermissions({
          id: undefined,
          blockReferencesPermissions: {},
          entity: payload.globals.config.find(
            ({ slug }) => slug === inheritedReadVersionsGlobalSlug,
          )!,
          entityType: 'global',
          fetchData: true,
          operations: ['readVersions'],
          req,
        })

        expect(permissions.readVersions?.permission).toBe(false)
      } finally {
        await payload.updateGlobal({
          slug: inheritedReadVersionsGlobalSlug,
          data: { visible: true },
          overrideAccess: true,
        })
        await payload.db.deleteVersions({
          globalSlug: inheritedReadVersionsGlobalSlug,
          req,
          where: {},
        })
      }
    })

    test('should resolve virtual-field constraints from inherited read access on findVersionByID', async () => {
      await payload.delete({
        collection: inheritedReadVersionsVirtualSlug,
        overrideAccess: true,
        where: {},
      })
      await payload.delete({
        collection: inheritedReadVersionsVirtualRelatedSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: relatedID } = await payload.create({
        collection: inheritedReadVersionsVirtualRelatedSlug,
        data: { label: 'allowed' },
        overrideAccess: true,
      })
      const parent = await payload.create({
        collection: inheritedReadVersionsVirtualSlug,
        data: { related: relatedID },
        overrideAccess: true,
      })

      const versions = await payload.findVersions({
        collection: inheritedReadVersionsVirtualSlug,
        overrideAccess: true,
      })
      const version = versions.docs.find(({ parent: parentID }) => parentID === parent.id)!

      await expect(
        payload.findVersionByID({
          id: version.id,
          collection: inheritedReadVersionsVirtualSlug,
          overrideAccess: false,
        }),
      ).resolves.toMatchObject({ parent: parent.id })

      await payload.delete({
        collection: inheritedReadVersionsVirtualSlug,
        overrideAccess: true,
        where: {},
      })
      await payload.delete({
        collection: inheritedReadVersionsVirtualRelatedSlug,
        overrideAccess: true,
        where: {},
      })
    })

    test('should sanitize virtual-field constraints from inherited global read access', async () => {
      const req = await createLocalReq({}, payload)

      await payload.db.deleteVersions({
        globalSlug: inheritedReadVersionsVirtualGlobalSlug,
        req,
        where: {},
      })
      await payload.delete({
        collection: inheritedReadVersionsVirtualRelatedSlug,
        overrideAccess: true,
        where: {},
      })

      const { id: allowedID } = await payload.create({
        collection: inheritedReadVersionsVirtualRelatedSlug,
        data: { label: 'allowed' },
        overrideAccess: true,
      })
      const { id: deniedID } = await payload.create({
        collection: inheritedReadVersionsVirtualRelatedSlug,
        data: { label: 'denied' },
        overrideAccess: true,
      })

      try {
        await payload.updateGlobal({
          slug: inheritedReadVersionsVirtualGlobalSlug,
          data: { related: deniedID },
          overrideAccess: true,
        })
        await payload.updateGlobal({
          slug: inheritedReadVersionsVirtualGlobalSlug,
          data: { related: allowedID },
          overrideAccess: true,
        })

        const allVersions = await payload.findGlobalVersions({
          slug: inheritedReadVersionsVirtualGlobalSlug,
          overrideAccess: true,
          pagination: false,
        })

        const allowedVersions = await payload.findGlobalVersions({
          slug: inheritedReadVersionsVirtualGlobalSlug,
          overrideAccess: false,
          pagination: false,
        })

        expect(allowedVersions.docs).toHaveLength(1)
        const allowedVersion = allowedVersions.docs[0]
        expect(allVersions.docs).toContainEqual(allowedVersion)

        const allowedVersionsCount = await payload.countGlobalVersions({
          global: inheritedReadVersionsVirtualGlobalSlug,
          overrideAccess: false,
        })
        expect(allowedVersionsCount.totalDocs).toBe(1)

        const permissions = await getEntityPermissions({
          id: undefined,
          blockReferencesPermissions: {},
          entity: payload.globals.config.find(
            ({ slug }) => slug === inheritedReadVersionsVirtualGlobalSlug,
          )!,
          entityType: 'global',
          fetchData: true,
          operations: ['readVersions'],
          req,
        })
        expect(permissions.readVersions?.permission).toBe(true)

        await expect(
          payload.restoreGlobalVersion({
            id: allowedVersion.id,
            slug: inheritedReadVersionsVirtualGlobalSlug,
            overrideAccess: false,
          }),
        ).resolves.toMatchObject({ version: { related: allowedID } })
      } finally {
        await payload.db.deleteVersions({
          globalSlug: inheritedReadVersionsVirtualGlobalSlug,
          req,
          where: {},
        })
        await payload.delete({
          collection: inheritedReadVersionsVirtualRelatedSlug,
          overrideAccess: true,
          where: {},
        })
      }
    })
  })

  test.describe('Auth - Local API', () => {
    test('should not allow reset password if forgotPassword expiration token is expired', async ({
      payload,
    }) => {
      // Mock Date.now() to simulate the forgotPassword call happening 1 hour ago (default is 1 hour)
      const originalDateNow = Date.now
      const mockDateNow = vitest.spyOn(Date, 'now').mockImplementation(() => {
        // Move the current time back by 1 hour
        return originalDateNow() - 60 * 60 * 1000
      })

      let forgot
      try {
        // Call forgotPassword while the mocked Date.now() is active
        forgot = await payload.forgotPassword({
          collection: 'users',
          data: {
            email: 'dev@payloadcms.com',
          },
          overrideAccess: true,
        })
      } finally {
        // Restore the original Date.now() after the forgotPassword call
        mockDateNow.mockRestore()
      }

      // Attempt to reset password, which should fail because the token is expired
      await expect(
        payload.resetPassword({
          collection: 'users',
          data: {
            password: 'test',
            token: forgot,
          },
          overrideAccess: true,
        }),
      ).rejects.toThrow('Token is either invalid or has expired.')
    })
  })

  test.describe('async parent permission inheritance', () => {
    test('should inherit async parent field permissions to nested children', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: asyncParentSlug,
        data: {
          title: 'Test Document',
        },
        overrideAccess: true,
      })

      const req = await createLocalReq(
        {
          user: {
            id: 123 as any,
            collection: 'users',
            createdAt: new Date().toISOString(),
            email: 'test@test.com',
            roles: ['admin'],
            updatedAt: new Date().toISOString(),
          },
        },
        payload,
      )

      // Get permissions with admin user (should have access)
      const permissions = await getEntityPermissions({
        id: doc.id,
        blockReferencesPermissions: {} as any,
        entity: payload.collections[asyncParentSlug].config,
        entityType: 'collection',
        fetchData: true,
        operations: ['read', 'update'],
        req,
      })

      expect(permissions).toEqual({
        fields: {
          createdAt: { read: { permission: true }, update: { permission: true } },
          parentField: {
            fields: {
              childField1: { read: { permission: true }, update: { permission: true } },
              childField2: { read: { permission: true }, update: { permission: true } },
              nestedGroup: {
                fields: {
                  deepChild1: {
                    read: { permission: true },
                    update: { permission: true },
                  },
                  deepChild2: {
                    read: { permission: true },
                    update: { permission: true },
                  },
                },
                read: { permission: true },
                update: { permission: true },
              },
            },
            read: { permission: true },
            update: { permission: true },
          },
          title: { read: { permission: true }, update: { permission: true } },
          updatedAt: { read: { permission: true }, update: { permission: true } },
        },
        read: { permission: true },
        update: { permission: true },
      } satisfies CollectionPermission)
    })

    test('should correctly deny access when async parent denies (non-admin user)', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: asyncParentSlug,
        data: {
          title: 'Test Document 2',
        },
        overrideAccess: true,
      })

      // Create non-admin user request
      const nonAdminReq = await createLocalReq(
        {
          user: {
            id: 456 as any,
            collection: 'users',
            createdAt: new Date().toISOString(),
            email: 'user@test.com',
            roles: ['user'], // Not admin
            updatedAt: new Date().toISOString(),
          },
        },
        payload,
      )

      const permissions = await getEntityPermissions({
        id: doc.id,
        blockReferencesPermissions: {} as any,
        entity: payload.collections[asyncParentSlug].config,
        entityType: 'collection',
        fetchData: true,
        operations: ['read', 'update'],
        req: nonAdminReq,
      })

      expect(permissions).toEqual({
        fields: {
          createdAt: { read: { permission: true }, update: { permission: true } },
          parentField: {
            fields: {
              childField1: { read: { permission: false }, update: { permission: false } },
              childField2: { read: { permission: false }, update: { permission: false } },
              nestedGroup: {
                fields: {
                  deepChild1: {
                    read: { permission: false },
                    update: { permission: false },
                  },
                  deepChild2: {
                    read: { permission: false },
                    update: { permission: false },
                  },
                },
                read: { permission: false },
                update: { permission: false },
              },
            },
            read: { permission: false },
            update: { permission: false },
          },
          title: { read: { permission: true }, update: { permission: true } },
          updatedAt: { read: { permission: true }, update: { permission: true } },
        },
        read: { permission: true },
        update: { permission: true },
      } satisfies CollectionPermission)
    })
  })

  test.describe('Default access - admin auth collection scoping', () => {
    let adminUser: Record<string, unknown>
    let publicUser: Record<string, unknown>

    test.beforeAll(async ({ payloadInstance: payload }) => {
      const { docs: adminDocs } = await payload.find({
        collection: 'users',
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: 'dev@payloadcms.com' } },
      })
      adminUser = { ...adminDocs[0], collection: 'users' }

      const { docs: publicDocs } = await payload.find({
        collection: publicUsersSlug,
        limit: 1,
        overrideAccess: true,
        where: { email: { equals: publicUserEmail } },
      })
      publicUser = { ...publicDocs[0], collection: publicUsersSlug }
    })

    test('should grant default access to a user from the admin auth collection', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: unrestrictedSlug,
        data: { name: 'created by admin user' },
        overrideAccess: false,
        user: adminUser as any,
      })

      expect(doc.id).toBeDefined()
    })

    test('should deny default access to a user from a non-admin auth collection', async ({
      payload,
    }) => {
      await expect(
        payload.create({
          collection: unrestrictedSlug,
          data: { name: 'created by public user' },
          overrideAccess: false,
          user: publicUser as any,
        }),
      ).rejects.toThrow(Forbidden)
    })
  })
})

async function createDoc<TSlug extends CollectionSlug = 'posts'>(
  { payload }: { payload: Payload },
  data: RequiredDataFromCollectionSlug<TSlug>,
  overrideSlug?: TSlug,
  options?: Partial<Parameters<Payload['create']>[0]>,
): Promise<DataFromCollectionSlug<TSlug>> {
  // @ts-expect-error
  return await payload.create({
    ...options,
    collection: overrideSlug ?? slug,
    // @ts-expect-error
    data: data ?? {},
    overrideAccess: options?.overrideAccess ?? true,
  })
}
