import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import path from 'path'
import { Forbidden } from 'payload'
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
  localizedGlobalSlug,
  localizedSlug,
  relyOnRequestHeadersSlug,
  restrictedVersionsSlug,
  secondArrayText,
  siblingDataSlug,
  slug,
} from './shared.js'

let payload: Payload
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
describe('Access Control', () => {
  let post1: Post
  let restricted: FullyRestricted

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
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

  describe('Collections', () => {
    describe('restricted collection', () => {
      it('field without read access should not show', async () => {
        const { id } = await createDoc({ restrictedField: 'restricted' })

        const retrievedDoc = await payload.findByID({ id, collection: slug, overrideAccess: false })

        expect(retrievedDoc.restrictedField).toBeUndefined()
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
  })

  describe('Locale Access', () => {
    it('collection - should respect locale create access', async () => {
      expect(() =>
        payload.create({
          collection: localizedSlug,
          data: {
            title: 'hello',
          },
          locale: 'en',
        }),
      ).toBeTruthy()

      await expect(() =>
        payload.create({
          collection: localizedSlug,
          data: {
            title: 'bonjour',
          },
          locale: 'fr',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })
    it('collection - should respect locale read access', async () => {
      const { id } = await payload.create({
        collection: localizedSlug,
        data: {
          title: 'hello',
        },
      })

      await payload.update({
        id,
        collection: localizedSlug,
        data: {
          title: 'bonjour',
        },
        locale: 'fr',
      })

      expect(() =>
        payload.findByID({
          id,
          collection: localizedSlug,
          locale: 'en',
        }),
      ).toBeTruthy()

      await expect(() =>
        payload.findByID({
          id,
          collection: localizedSlug,
          locale: 'fr',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })
    it('collection - should respect locale update access', async () => {
      const { id } = await payload.create({
        collection: localizedSlug,
        data: {
          title: 'hello',
        },
        locale: 'en',
      })

      await payload.update({
        id,
        collection: localizedSlug,
        data: {
          title: 'updated EN',
        },
        locale: 'en',
        overrideAccess: false,
      })

      await expect(() =>
        payload.update({
          id,
          collection: localizedSlug,
          data: {
            title: 'hola',
          },
          locale: 'es',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })

    it('collection - should respect locale delete access', async () => {
      const { id } = await payload.create({
        collection: localizedSlug,
        data: {
          title: 'hola',
        },
        locale: 'es',
      })

      await expect(() =>
        payload.delete({
          id,
          collection: localizedSlug,
          locale: 'es',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })

    it('global - should respect locale read access', async () => {
      await payload.updateGlobal({
        slug: localizedGlobalSlug,
        data: {
          title: 'hello',
        },
        locale: 'en',
      })

      await payload.updateGlobal({
        slug: localizedGlobalSlug,
        data: {
          title: 'bonjour',
        },
        locale: 'fr',
      })

      expect(() =>
        payload.findGlobal({
          slug: localizedGlobalSlug,
          locale: 'en',
        }),
      ).toBeTruthy()

      await expect(() =>
        payload.findGlobal({
          slug: localizedGlobalSlug,
          locale: 'fr',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
    })
    it('global - should respect locale update access', async () => {
      expect(() =>
        payload.updateGlobal({
          slug: localizedGlobalSlug,
          data: {
            title: 'hello',
          },
          locale: 'en',
        }),
      ).toBeTruthy()

      await expect(() =>
        payload.updateGlobal({
          slug: localizedGlobalSlug,
          data: {
            title: 'hola',
          },
          locale: 'es',
          overrideAccess: false,
        }),
      ).rejects.toThrow(Forbidden)
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
