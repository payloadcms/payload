import type { NextRESTClient } from 'helpers/NextRESTClient.js'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import path from 'path'
import { Forbidden, ValidationError } from 'payload'
import { fileURLToPath } from 'url'

import type { FullyRestricted, Post } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { requestHeaders } from './config.js'
import {
  firstArrayText,
  fullyRestrictedSlug,
  hiddenAccessCountSlug,
  hiddenAccessSlug,
  hiddenFieldsSlug,
  hooksSlug,
  relyOnRequestHeadersSlug,
  restrictedVersionsSlug,
  secondArrayText,
  siblingDataSlug,
  slug,
} from './shared.js'

let payload: Payload
let restClient: NextRESTClient
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
describe('Access Control', () => {
  let post1: Post
  let restricted: FullyRestricted

  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  beforeEach(async () => {
    post1 = await payload.create({
      collection: slug,
      data: {},
    })

    restricted = await payload.create({
      collection: fullyRestrictedSlug,
      data: { name: 'restricted' },
    })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Fields', () => {
    it('should not affect hidden fields when patching data', async () => {
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
      })

      await payload.update({
        id: doc.id,
        collection: hiddenFieldsSlug,
        data: {
          title: 'Doc Title',
        },
      })

      const updatedDoc = await payload.findByID({
        id: doc.id,
        collection: hiddenFieldsSlug,
        showHiddenFields: true,
      })

      expect(updatedDoc.partiallyHiddenGroup.value).toStrictEqual('private_value')
      expect(updatedDoc.partiallyHiddenArray[0].value).toStrictEqual('private_value')
    })

    it('should not affect hidden fields when patching data - update many', async () => {
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
      })

      await payload.update({
        collection: hiddenFieldsSlug,
        data: {
          title: 'Doc Title',
        },
        where: {
          id: { equals: docsMany.id },
        },
      })

      const updatedMany = await payload.findByID({
        id: docsMany.id,
        collection: hiddenFieldsSlug,
        showHiddenFields: true,
      })

      expect(updatedMany.partiallyHiddenGroup.value).toStrictEqual('private_value')
      expect(updatedMany.partiallyHiddenArray[0].value).toStrictEqual('private_value')
    })

    it('should be able to restrict access based upon siblingData', async () => {
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
      })

      const doc = await payload.findByID({
        id,
        collection: siblingDataSlug,
        overrideAccess: false,
      })

      expect(doc.array?.[0].text).toBe(firstArrayText)
      // Should respect PublicReadabilityAccess function and not be sent
      expect(doc.array?.[1].text).toBeUndefined()

      // Retrieve with default of overriding access
      const docOverride = await payload.findByID({
        id,
        collection: siblingDataSlug,
      })

      expect(docOverride.array?.[0].text).toBe(firstArrayText)
      expect(docOverride.array?.[1].text).toBe(secondArrayText)
    })

    it('should use fallback value when trying to update a field without permission', async () => {
      const doc = await payload.create({
        collection: hooksSlug,
        data: {
          cannotMutateRequired: 'original',
        },
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        overrideAccess: false,
        data: {
          cannotMutateRequired: 'new',
          canMutate: 'canMutate',
        },
      })

      expect(updatedDoc.cannotMutateRequired).toBe('original')
    })

    it('should use fallback value when required data is missing', async () => {
      const doc = await payload.create({
        collection: hooksSlug,
        data: {
          cannotMutateRequired: 'original',
        },
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        overrideAccess: false,
        data: {
          canMutate: 'canMutate',
        },
      })

      // should fallback to original data and not throw validation error
      expect(updatedDoc.cannotMutateRequired).toBe('original')
    })

    it('should pass fallback value through to beforeChange hook when access returns false', async () => {
      const doc = await payload.create({
        collection: hooksSlug,
        data: {
          cannotMutateRequired: 'cannotMutateRequired',
          cannotMutateNotRequired: 'cannotMutateNotRequired',
        },
      })

      const updatedDoc = await payload.update({
        id: doc.id,
        collection: hooksSlug,
        overrideAccess: false,
        data: {
          cannotMutateNotRequired: 'updated',
        },
      })

      // should fallback to original data and not throw validation error
      expect(updatedDoc.cannotMutateRequired).toBe('cannotMutateRequired')
      expect(updatedDoc.cannotMutateNotRequired).toBe('cannotMutateNotRequired')
    })
  })
  describe('Collections', () => {
    describe('restricted collection', () => {
      it('field without read access should not show', async () => {
        const { id } = await createDoc({ restrictedField: 'restricted' })

        const retrievedDoc = await payload.findByID({ id, collection: slug, overrideAccess: false })

        expect(retrievedDoc.restrictedField).toBeUndefined()
      })

      it('should error when querying field without read access', async () => {
        const { id } = await createDoc({ restrictedField: 'restricted' })

        await expect(
          async () =>
            await payload.find({
              collection: slug,
              overrideAccess: false,
              where: {
                and: [
                  {
                    id: { equals: id },
                  },
                  {
                    restrictedField: {
                      equals: 'restricted',
                    },
                  },
                ],
              },
            }),
        ).rejects.toThrow('The following path cannot be queried: restrictedField')
      })

      it('should respect access control for join request where queries of relationship properties', async () => {
        const post = await createDoc({})
        await createDoc({ post: post.id, name: 'test' }, 'relation-restricted')
        await expect(
          async () =>
            await payload.find({
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

      it('field without read access should not show when overrideAccess: true', async () => {
        const { id, restrictedField } = await createDoc({ restrictedField: 'restricted' })

        const retrievedDoc = await payload.findByID({ id, collection: slug, overrideAccess: true })

        expect(retrievedDoc.restrictedField).toStrictEqual(restrictedField)
      })

      it('field without read access should not show when overrideAccess default', async () => {
        const { id, restrictedField } = await createDoc({ restrictedField: 'restricted' })

        const retrievedDoc = await payload.findByID({ id, collection: slug })

        expect(retrievedDoc.restrictedField).toStrictEqual(restrictedField)
      })
    })
    describe('non-enumerated request properties passed to access control', () => {
      it('access control ok when passing request headers', async () => {
        const req = {
          headers: requestHeaders,
        } as PayloadRequest
        const name = 'name'
        const overrideAccess = false

        const { id } = await createDoc({ name }, relyOnRequestHeadersSlug, {
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

      it('access control fails when omitting request headers', async () => {
        const name = 'name'
        const overrideAccess = false

        await expect(() =>
          createDoc({ name }, relyOnRequestHeadersSlug, {
            overrideAccess,
          }),
        ).rejects.toThrow(Forbidden)
        const { id } = await createDoc({ name }, relyOnRequestHeadersSlug)

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

  describe('Override Access', () => {
    describe('Fields', () => {
      it('should allow overrideAccess: false', async () => {
        const req = async () =>
          await payload.update({
            id: post1.id,
            collection: slug,
            data: { restrictedField: restricted.id },
            overrideAccess: false, // this should respect access control
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      it('should allow overrideAccess: true', async () => {
        const doc = await payload.update({
          id: post1.id,
          collection: slug,
          data: { restrictedField: restricted.id },
          overrideAccess: true, // this should override access control
        })

        expect(doc).toMatchObject({ id: post1.id })
      })

      it('should allow overrideAccess by default', async () => {
        const doc = await payload.update({
          id: post1.id,
          collection: slug,
          data: { restrictedField: restricted.id },
        })

        expect(doc).toMatchObject({ id: post1.id })
      })

      it('should allow overrideAccess: false - update many', async () => {
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

      it('should allow overrideAccess: true - update many', async () => {
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

      it('should allow overrideAccess by default - update many', async () => {
        const doc = await payload.update({
          collection: slug,
          data: { restrictedField: restricted.id },
          where: {
            id: { equals: post1.id },
          },
        })

        expect(doc.docs[0]).toMatchObject({ id: post1.id })
      })
    })

    describe('Collections', () => {
      const updatedName = 'updated'

      it('should allow overrideAccess: false', async () => {
        const req = async () =>
          await payload.update({
            id: restricted.id,
            collection: fullyRestrictedSlug,
            data: { name: updatedName },
            overrideAccess: false, // this should respect access control
          })

        await expect(req).rejects.toThrow(Forbidden)
      })

      it('should allow overrideAccess: true', async () => {
        const doc = await payload.update({
          id: restricted.id,
          collection: fullyRestrictedSlug,
          data: { name: updatedName },
          overrideAccess: true, // this should override access control
        })

        expect(doc).toMatchObject({ id: restricted.id, name: updatedName })
      })

      it('should allow overrideAccess by default', async () => {
        const doc = await payload.update({
          id: restricted.id,
          collection: fullyRestrictedSlug,
          data: { name: updatedName },
        })

        expect(doc).toMatchObject({ id: restricted.id, name: updatedName })
      })

      it('should allow overrideAccess: false - update many', async () => {
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

      it('should allow overrideAccess: true - update many', async () => {
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

      it('should allow overrideAccess by default - update many', async () => {
        const doc = await payload.update({
          collection: fullyRestrictedSlug,
          data: { name: updatedName },
          where: {
            id: { equals: restricted.id },
          },
        })

        expect(doc.docs[0]).toMatchObject({ id: restricted.id, name: updatedName })
      })
    })
  })

  describe('Querying', () => {
    it('should respect query constraint using hidden field', async () => {
      await payload.create({
        collection: hiddenAccessSlug,
        data: {
          title: 'hello',
        },
      })

      await payload.create({
        collection: hiddenAccessSlug,
        data: {
          hidden: true,
          title: 'hello',
        },
      })

      const { docs } = await payload.find({
        collection: hiddenAccessSlug,
        overrideAccess: false,
      })

      expect(docs).toHaveLength(1)
    })

    it('should respect query constraint using hidden field on count', async () => {
      await payload.create({
        collection: hiddenAccessCountSlug,
        data: {
          title: 'hello',
        },
      })

      await payload.create({
        collection: hiddenAccessCountSlug,
        data: {
          hidden: true,
          title: 'hello',
        },
      })

      const { totalDocs } = await payload.count({
        collection: hiddenAccessCountSlug,
        overrideAccess: false,
      })

      expect(totalDocs).toBe(1)
    })

    it('should respect query constraint using hidden field on versions', async () => {
      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'match',
          hidden: true,
        },
      })

      await payload.create({
        collection: restrictedVersionsSlug,
        data: {
          name: 'match',
          hidden: false,
        },
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

    it('should ignore false access on query constraint added by top collection level access control', async () => {
      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
      })
      const { id: hitID } = await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-success-access-read' },
      })
      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
      })

      // assert find, only will-success should be in the result
      const resFind = await payload.find({
        overrideAccess: false,
        collection: 'fields-and-top-access',
      })
      expect(resFind.docs[0].id).toBe(hitID)
      expect(resFind.docs).toHaveLength(1)

      // assert find draft: true
      const resFindDraft = await payload.find({
        draft: true,
        overrideAccess: false,
        collection: 'fields-and-top-access',
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

    it('should ignore false access in versions on query constraint added by top collection level access control', async () => {
      // clean up
      await payload.delete({ collection: 'fields-and-top-access', where: {} })

      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
      })
      const { id: hitID } = await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-success-access-read' },
      })
      await payload.create({
        collection: 'fields-and-top-access',
        data: { secret: 'will-fail-access-read' },
      })

      // Assert findVersions only will-success should be in the result
      const resFind = await payload.findVersions({
        overrideAccess: false,
        collection: 'fields-and-top-access',
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
  })

  describe('Auth - Local API', () => {
    it('should not allow reset password if forgotPassword expiration token is expired', async () => {
      // Mock Date.now() to simulate the forgotPassword call happening 1 hour ago (default is 1 hour)
      const originalDateNow = Date.now
      const mockDateNow = jest.spyOn(Date, 'now').mockImplementation(() => {
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
})

async function createDoc<TSlug extends CollectionSlug = 'posts'>(
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
  })
}
