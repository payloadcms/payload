import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { TrashEnabled, TrashEnabledWithAccessControl } from './payload-types.js'

import { regularUser } from '../credentials.js'
import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { trashEnabledSlug } from './collections/TrashEnabled/index.js'
import { trashEnabledWithAccessControlSlug } from './collections/TrashEnabledWithAccessControl/index.js'
import { usersSlug } from './collections/Users/index.js'

let restClient: NextRESTClient
let payload: Payload
let user: any

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('soft-delete', () => {
  beforeAll(async () => {
    const initResult = await initPayloadInt(dirname)

    payload = initResult.payload as Payload
    restClient = initResult.restClient as NextRESTClient
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  let trashEnabledWithACDoc: TrashEnabledWithAccessControl
  let trashEnabledDocOne: TrashEnabled
  let trashEnabledDocTwo: TrashEnabled

  beforeEach(async () => {
    await restClient.login({
      slug: usersSlug,
      credentials: regularUser,
    })

    user = await payload.login({
      collection: usersSlug,
      data: {
        email: regularUser.email,
        password: regularUser.password,
      },
    })

    trashEnabledWithACDoc = await payload.create({
      collection: trashEnabledWithAccessControlSlug,
      data: {
        title: 'With Access Control one',
      },
    })

    trashEnabledDocOne = await payload.create({
      collection: trashEnabledSlug,
      data: {
        title: 'Doc one',
      },
    })

    trashEnabledDocTwo = await payload.create({
      collection: trashEnabledSlug,
      data: {
        title: 'Doc two',
        deletedAt: new Date().toISOString(),
      },
    })
  })

  afterEach(async () => {
    await payload.delete({
      collection: trashEnabledSlug,
      trash: true,
      where: {
        title: {
          exists: true,
        },
      },
    })
  })

  // Access control tests use the Pages collection because it has delete access control enabled.
  // The TrashEnabled collection does not have any access restrictions and is used for general CRUD tests.
  describe('Access control', () => {
    it('should not allow bulk soft-deleting documents when restricted by delete access', async () => {
      await expect(
        payload.update({
          collection: trashEnabledWithAccessControlSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          user, // Regular user does not have delete access
          where: {
            // Using where to target multiple documents
            title: {
              equals: trashEnabledWithACDoc.title,
            },
          },
          overrideAccess: false, // Override access to false to test access control
        }),
      ).rejects.toMatchObject({
        status: 403,
        name: 'Forbidden',
        message: expect.stringContaining('You are not allowed'),
      })
    })

    it('should not allow soft-deleting a document when restricted by delete access', async () => {
      await expect(
        payload.update({
          collection: trashEnabledWithAccessControlSlug,
          data: {
            deletedAt: new Date().toISOString(),
          },
          id: trashEnabledWithACDoc.id, // Using ID to target specific document
          user, // Regular user does not have delete access
          overrideAccess: false, // Override access to false to test access control
        }),
      ).rejects.toMatchObject({
        status: 403,
        name: 'Forbidden',
        message: expect.stringContaining('You are not allowed'),
      })
    })
  })

  describe('LOCAL API', () => {
    describe('find', () => {
      it('should return all docs including soft-deleted docs in find with trash: true', async () => {
        const allDocs = await payload.find({
          collection: trashEnabledSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(2)
      })

      it('should return only soft-deleted docs in find with trash: true', async () => {
        const trashedDocs = await payload.find({
          collection: trashEnabledSlug,
          where: {
            deletedAt: {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedDocs.totalDocs).toEqual(1)
        expect(trashedDocs.docs[0]?.id).toEqual(trashEnabledDocTwo.id)
      })

      it('should return only non-soft-deleted docs in find with trash: false', async () => {
        const normalDocs = await payload.find({
          collection: trashEnabledSlug,
          trash: false,
        })

        expect(normalDocs.totalDocs).toEqual(1)
        expect(normalDocs.docs[0]?.id).toEqual(trashEnabledDocOne.id)
      })

      it('should find restored documents after setting deletedAt to null', async () => {
        await payload.update({
          collection: trashEnabledSlug,
          id: trashEnabledDocTwo.id,
          data: {
            deletedAt: null,
          },
          trash: true,
        })

        const result = await payload.find({
          collection: trashEnabledSlug,
          trash: false, // Normal query should return it now
        })

        const restored = result.docs.find((doc) => doc.id === trashEnabledDocTwo.id)

        expect(restored).toBeDefined()
        expect(restored?.deletedAt).toBeNull()
      })
    })

    describe('findByID operation', () => {
      it('should return a soft-deleted document when trash: true', async () => {
        const trashedDoc: TrashEnabled = await payload.findByID({
          collection: trashEnabledSlug,
          id: trashEnabledDocTwo.id,
          trash: true,
        })

        expect(trashedDoc).toBeDefined()
        expect(trashedDoc?.id).toEqual(trashEnabledDocTwo.id)
        expect(trashedDoc?.deletedAt).toBeDefined()
        expect(trashedDoc?.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted document w/o trash: true', async () => {
        await expect(
          payload.findByID({
            collection: trashEnabledSlug,
            id: trashEnabledDocTwo.id,
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.findByID({
            collection: trashEnabledSlug,
            id: trashEnabledDocTwo.id,
            trash: false,
          }),
        ).rejects.toThrow('Not Found')
      })
    })

    describe('findVersions operation', () => {
      beforeAll(async () => {
        await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })
      it('should return all versions including soft-deleted docs in findVersions with trash: true', async () => {
        const allVersions = await payload.findVersions({
          collection: trashEnabledSlug,
          trash: true,
        })

        expect(allVersions.totalDocs).toEqual(2)
        expect(allVersions.docs[0]?.parent).toEqual(trashEnabledDocTwo.id)
        expect(allVersions.docs[1]?.parent).toEqual(trashEnabledDocOne.id)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const trashedVersions = await payload.findVersions({
          collection: trashEnabledSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedVersions.totalDocs).toEqual(1)
        expect(trashedVersions.docs[0]?.parent).toEqual(trashEnabledDocTwo.id)
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const normalVersions = await payload.findVersions({
          collection: trashEnabledSlug,
          trash: false,
        })

        expect(normalVersions.totalDocs).toEqual(1)
        expect(normalVersions.docs[0]?.parent).toEqual(trashEnabledDocOne.id)
      })

      it('should find versions where version.deletedAt is null after restore', async () => {
        await payload.update({
          collection: trashEnabledSlug,
          id: trashEnabledDocTwo.id,
          data: {
            deletedAt: null,
          },
          trash: true,
        })

        const versions = await payload.findVersions({
          collection: trashEnabledSlug,
          trash: true,
          where: {
            'version.deletedAt': {
              equals: null,
            },
          },
        })

        expect(versions.docs.some((v) => v.parent === trashEnabledDocTwo.id)).toBe(true)
      })
    })

    describe('findVersionByID operation', () => {
      beforeAll(async () => {
        await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })

      it('should return a soft-deleted version document when trash: true', async () => {
        const trashedVersions = await payload.findVersions({
          collection: trashEnabledSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedVersions.docs).toHaveLength(1)

        const version = trashedVersions.docs[0]

        const trashedVersionDoc = await payload.findVersionByID({
          collection: trashEnabledSlug,
          id: version!.id,
          trash: true,
        })

        expect(trashedVersionDoc).toBeDefined()
        expect(trashedVersionDoc?.parent).toEqual(trashEnabledDocTwo.id)
        expect(trashedVersionDoc?.version?.deletedAt).toBeDefined()
        expect(trashedVersionDoc?.version?.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        const trashedVersions = await payload.findVersions({
          collection: trashEnabledSlug,
          where: {
            'version.deletedAt': {
              exists: true,
            },
          },
          trash: true,
        })

        expect(trashedVersions.docs).toHaveLength(1)

        const version = trashedVersions.docs[0]

        await expect(
          payload.findVersionByID({
            collection: trashEnabledSlug,
            id: version!.id,
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.findVersionByID({
            collection: trashEnabledSlug,
            id: version!.id,
            trash: false,
          }),
        ).rejects.toThrow('Not Found')
      })
    })

    describe('updateByID operation', () => {
      it('should update a single soft-deleted document when trash: true', async () => {
        const updatedDoc: TrashEnabled = await payload.update({
          collection: trashEnabledSlug,
          id: trashEnabledDocTwo.id,
          data: {
            title: 'Updated Doc Two',
          },
          trash: true,
        })

        expect(updatedDoc).toBeDefined()
        expect(updatedDoc.id).toEqual(trashEnabledDocTwo.id)
        expect(updatedDoc.title).toEqual('Updated Doc Two')
        expect(updatedDoc.deletedAt).toBeDefined()
        expect(updatedDoc.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        await expect(
          payload.update({
            collection: trashEnabledSlug,
            id: trashEnabledDocTwo.id,
            data: {
              title: 'Updated Doc Two',
            },
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.update({
            collection: trashEnabledSlug,
            id: trashEnabledDocTwo.id,
            data: {
              title: 'Updated Doc Two',
            },
            trash: false,
          }),
        ).rejects.toThrow('Not Found')
      })

      it('should update a single normal document when trash: false', async () => {
        const updatedDoc: TrashEnabled = await payload.update({
          collection: trashEnabledSlug,
          id: trashEnabledDocOne.id,
          data: {
            title: 'Updated Doc One',
          },
        })

        expect(updatedDoc).toBeDefined()
        expect(updatedDoc.id).toEqual(trashEnabledDocOne.id)
        expect(updatedDoc.title).toEqual('Updated Doc One')
        expect(updatedDoc.deletedAt).toBeFalsy()
      })

      it('should restore a soft-deleted document by setting deletedAt to null', async () => {
        const restored = await payload.update({
          collection: trashEnabledSlug,
          id: trashEnabledDocTwo.id,
          data: {
            deletedAt: null,
          },
          trash: true,
        })

        expect(restored.deletedAt).toBeNull()

        // Should now show up in trash: false queries
        const result = await payload.find({
          collection: trashEnabledSlug,
          trash: false,
        })

        const found = result.docs.find((doc) => doc.id === trashEnabledDocTwo.id)
        expect(found).toBeDefined()
        expect(found?.deletedAt).toBeNull()
      })
    })

    describe('update operation', () => {
      it('should update only normal document when trash: false', async () => {
        const result = await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Updated Doc',
          },
          trash: false,
          where: {
            title: {
              exists: true,
            },
          },
        })

        expect(result.docs).toBeDefined()
        expect(result.docs.length).toBeGreaterThan(0)

        const updatedDoc = result.docs[0]

        expect(updatedDoc?.id).toEqual(trashEnabledDocOne.id)
        expect(updatedDoc?.title).toEqual('Updated Doc')
        expect(updatedDoc?.deletedAt).toBeFalsy()
      })

      it('should update all documents including soft-deleted documents when trash: true', async () => {
        const result = await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'A New Updated Doc',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })

        expect(result.docs).toBeDefined()
        expect(result.docs.length).toBeGreaterThan(0)

        const updatedtrashEnabledDocOne = result.docs.find(
          (doc) => doc.id === trashEnabledDocOne.id,
        )
        const updatedtrashEnabledDocTwo = result.docs.find(
          (doc) => doc.id === trashEnabledDocTwo.id,
        )

        expect(updatedtrashEnabledDocOne?.title).toEqual('A New Updated Doc')
        expect(updatedtrashEnabledDocOne?.deletedAt).toBeFalsy()

        expect(updatedtrashEnabledDocTwo?.title).toEqual('A New Updated Doc')
        expect(updatedtrashEnabledDocTwo?.deletedAt).toBeDefined()
      })

      it('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async () => {
        const docThree = await payload.create({
          collection: trashEnabledSlug,
          data: {
            title: 'Doc three',
            deletedAt: new Date().toISOString(),
          },
        })

        const result = await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Updated Soft Deleted Doc',
          },
          trash: true,
          where: {
            deletedAt: {
              exists: true,
            },
          },
        })
        expect(result.docs).toBeDefined()
        expect(result.docs[0]?.id).toEqual(docThree.id)
        expect(result.docs[0]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[0]?.deletedAt).toEqual(docThree.deletedAt)
        expect(result.docs[1]?.id).toEqual(trashEnabledDocTwo.id)
        expect(result.docs[1]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[1]?.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)

        // Clean up
        await payload.delete({
          collection: trashEnabledSlug,
          id: docThree.id,
          trash: true,
        })
      })
    })

    describe('delete operation', () => {
      it('should perma delete all docs including soft-deleted documents when trash: true', async () => {
        await payload.delete({
          collection: trashEnabledSlug,
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })

        const allDocs = await payload.find({
          collection: trashEnabledSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(0)
      })

      it('should only perma delete normal docs when trash: false', async () => {
        await payload.delete({
          collection: trashEnabledSlug,
          trash: false,
          where: {
            title: {
              exists: true,
            },
          },
        })

        const allDocs = await payload.find({
          collection: trashEnabledSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(1)
        expect(allDocs.docs[0]?.id).toEqual(trashEnabledDocTwo.id)
      })
    })

    describe('deleteByID operation', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        await expect(
          payload.delete({
            collection: trashEnabledSlug,
            id: trashEnabledDocTwo.id,
          }),
        ).rejects.toThrow('Not Found')

        await expect(
          payload.delete({
            collection: trashEnabledSlug,
            id: trashEnabledDocTwo.id,
            trash: false,
          }),
        ).rejects.toThrow('Not Found')
      })

      it('should delete a soft-deleted document when softtrashDeletes: true', async () => {
        await payload.delete({
          collection: trashEnabledSlug,
          id: trashEnabledDocTwo.id,
          trash: true,
        })

        const allDocs = await payload.find({
          collection: trashEnabledSlug,
          trash: true,
        })

        expect(allDocs.totalDocs).toEqual(1)
        expect(allDocs.docs[0]?.id).toEqual(trashEnabledDocOne.id)
      })
    })
  })

  describe('REST API', () => {
    describe('find endpoint', () => {
      it('should return all docs including soft-deleted docs in find with trash=true', async () => {
        const res = await restClient.GET(`/${trashEnabledSlug}?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs with trash=true and where[deletedAt][exists]=true', async () => {
        const res = await restClient.GET(
          `/${trashEnabledSlug}?trash=true&where[deletedAt][exists]=true`,
        )
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(trashEnabledDocTwo.id)
      })

      it('should return only normal docs when trash=false', async () => {
        const res = await restClient.GET(`/${trashEnabledSlug}?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.id).toEqual(trashEnabledDocOne.id)
      })

      it('should find restored documents after setting deletedAt to null', async () => {
        await restClient.PATCH(`/${trashEnabledSlug}/${trashEnabledDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            deletedAt: null,
          }),
        })

        const res = await restClient.GET(`/${trashEnabledSlug}?trash=false`)
        const data = await res.json()

        const restored = data.docs.find((doc: TrashEnabled) => doc.id === trashEnabledDocTwo.id)

        expect(restored).toBeDefined()
        expect(restored.deletedAt).toBeNull()
      })
    })

    describe('findByID endpoint', () => {
      it('should return a soft-deleted doc by ID with trash=true', async () => {
        const res = await restClient.GET(`/${trashEnabledSlug}/${trashEnabledDocTwo.id}?trash=true`)
        const data = await res.json()
        expect(data?.id).toEqual(trashEnabledDocTwo.id)
        expect(data?.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)
      })

      it('should 404 when trying to get a soft-deleted doc without trash=true', async () => {
        const res = await restClient.GET(`/${trashEnabledSlug}/${trashEnabledDocTwo.id}`)
        expect(res.status).toBe(404)
      })
    })

    describe('find versions endpoint', () => {
      beforeAll(async () => {
        await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })
      it('should return all versions including soft-deleted docs in findVersions with trash: true', async () => {
        const res = await restClient.GET(`/${trashEnabledSlug}/versions?trash=true`)
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const res = await restClient.GET(
          `/${trashEnabledSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(trashEnabledDocTwo.id)
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const res = await restClient.GET(`/${trashEnabledSlug}/versions?trash=false`)
        const data = await res.json()
        expect(data.docs).toHaveLength(1)
        expect(data.docs[0]?.parent).toEqual(trashEnabledDocOne.id)
      })

      it('should find versions where version.deletedAt is null after restore via REST', async () => {
        await restClient.PATCH(`/${trashEnabledSlug}/${trashEnabledDocTwo.id}?trash=true`, {
          body: JSON.stringify({
            deletedAt: null,
          }),
        })

        const res = await restClient.GET(
          `/${trashEnabledSlug}/versions?trash=true&where[version.deletedAt][equals]=null`,
        )
        const data = await res.json()

        const version = data.docs.find((v: any) => v.parent === trashEnabledDocTwo.id)
        expect(version).toBeDefined()
        expect(version.version.deletedAt).toBeNull()
      })
    })

    describe('findVersionByID endpoint', () => {
      beforeAll(async () => {
        await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })

      it('should return a soft-deleted version document when trash: true', async () => {
        const trashedVersions = await restClient.GET(
          `/${trashEnabledSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )

        const trashedVersionsData = await trashedVersions.json()
        expect(trashedVersionsData.docs).toHaveLength(1)

        const version = trashedVersionsData.docs[0]

        const versionDoc = await restClient.GET(
          `/${trashEnabledSlug}/versions/${version!.id}?trash=true`,
        )
        const trashedVersionDoc = await versionDoc.json()

        expect(trashedVersionDoc).toBeDefined()
        expect(trashedVersionDoc?.parent).toEqual(trashEnabledDocTwo.id)
        expect(trashedVersionDoc?.version?.deletedAt).toBeDefined()
        expect(trashedVersionDoc?.version?.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        const trashedVersions = await restClient.GET(
          `/${trashEnabledSlug}/versions?trash=true&where[version.deletedAt][exists]=true`,
        )

        const trashedVersionsData = await trashedVersions.json()
        expect(trashedVersionsData.docs).toHaveLength(1)

        const version = trashedVersionsData.docs[0]

        const withoutTrash = await restClient.GET(`/${trashEnabledSlug}/versions/${version!.id}`)
        expect(withoutTrash.status).toBe(404)

        const withTrashFalse = await restClient.GET(
          `/${trashEnabledSlug}/versions/${version!.id}?trash=false`,
        )
        expect(withTrashFalse.status).toBe(404)
      })
    })

    describe('updateByID endpoint', () => {
      it('should update a single soft-deleted doc when trash=true', async () => {
        const res = await restClient.PATCH(
          `/${trashEnabledSlug}/${trashEnabledDocTwo.id}?trash=true`,
          {
            body: JSON.stringify({
              title: 'Updated via REST',
            }),
          },
        )

        const result = await res.json()
        expect(result.doc.title).toBe('Updated via REST')
        expect(result.doc.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        const res = await restClient.PATCH(`/${trashEnabledSlug}/${trashEnabledDocTwo.id}`, {
          body: JSON.stringify({ title: 'Fail Update' }),
        })
        expect(res.status).toBe(404)
      })

      it('should update a single normal document when trash: false', async () => {
        const res = await restClient.PATCH(
          `/${trashEnabledSlug}/${trashEnabledDocOne.id}?trash=false`,
          {
            body: JSON.stringify({ title: 'Updated Normal via REST' }),
          },
        )
        const result = await res.json()
        expect(result.doc.title).toBe('Updated Normal via REST')
        expect(result.doc.deletedAt).toBeFalsy()
      })

      it('should restore a soft-deleted document by setting deletedAt to null', async () => {
        const res = await restClient.PATCH(
          `/${trashEnabledSlug}/${trashEnabledDocTwo.id}?trash=true`,
          {
            body: JSON.stringify({
              deletedAt: null,
            }),
          },
        )

        const result = await res.json()
        expect(result.doc.deletedAt).toBeNull()

        const check = await restClient.GET(`/${trashEnabledSlug}?trash=false`)
        const data = await check.json()
        const restored = data.docs.find((doc: TrashEnabled) => doc.id === trashEnabledDocTwo.id)

        expect(restored).toBeDefined()
        expect(restored.deletedAt).toBeNull()
      })
    })

    describe('update endpoint', () => {
      it('should update only normal document when trash: false', async () => {
        const query = `?trash=false&where[id][equals]=${trashEnabledDocOne.id}`

        const res = await restClient.PATCH(`/${trashEnabledSlug}${query}`, {
          body: JSON.stringify({ title: 'Updated Normal via REST' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0].id).toBe(trashEnabledDocOne.id)
        expect(result.docs[0].title).toBe('Updated Normal via REST')
        expect(result.docs[0].deletedAt).toBeFalsy()
      })

      it('should update all documents including soft-deleted documents when trash: true', async () => {
        const query = `?trash=true&where[title][exists]=true`

        const res = await restClient.PATCH(`/${trashEnabledSlug}${query}`, {
          body: JSON.stringify({ title: 'Bulk Updated All' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(2)
        expect(result.docs.every((doc: TrashEnabled) => doc.title === 'Bulk Updated All')).toBe(
          true,
        )
      })

      it('should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true', async () => {
        const query = `?trash=true&where[deletedAt][exists]=true`

        const docThree = await payload.create({
          collection: trashEnabledSlug,
          data: {
            title: 'Doc three',
            deletedAt: new Date().toISOString(),
          },
        })

        const res = await restClient.PATCH(`/${trashEnabledSlug}${query}`, {
          body: JSON.stringify({ title: 'Updated Soft Deleted Doc' }),
        })

        const result = await res.json()
        expect(result.docs).toHaveLength(2)

        expect(result.docs).toBeDefined()
        expect(result.docs[0]?.id).toEqual(docThree.id)
        expect(result.docs[0]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[0]?.deletedAt).toEqual(docThree.deletedAt)
        expect(result.docs[1]?.id).toEqual(trashEnabledDocTwo.id)
        expect(result.docs[1]?.title).toEqual('Updated Soft Deleted Doc')
        expect(result.docs[1]?.deletedAt).toEqual(trashEnabledDocTwo.deletedAt)

        // Clean up
        await payload.delete({
          collection: trashEnabledSlug,
          id: docThree.id,
          trash: true,
        })
      })
    })

    describe('delete endpoint', () => {
      it('should perma delete all docs including soft-deleted documents when trash: true', async () => {
        const query = `?trash=true&where[title][exists]=true`

        const res = await restClient.DELETE(`/${trashEnabledSlug}${query}`)
        expect(res.status).toBe(200)

        const result = await res.json()
        expect(result.docs).toHaveLength(2)

        const check = await restClient.GET(`/${trashEnabledSlug}?trash=true`)
        const checkData = await check.json()
        expect(checkData.docs).toHaveLength(0)
      })

      it('should only perma delete normal docs when trash: false', async () => {
        const query = `?trash=false&where[title][exists]=true`

        const res = await restClient.DELETE(`/${trashEnabledSlug}${query}`)
        expect(res.status).toBe(200)

        const result = await res.json()
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0]?.id).toBe(trashEnabledDocOne.id)

        const check = await restClient.GET(`/${trashEnabledSlug}?trash=true`)
        const checkData = await check.json()

        // Make sure trashEnabledDocTwo (soft-deleted) is still there
        expect(checkData.docs.some((doc: TrashEnabled) => doc.id === trashEnabledDocTwo.id)).toBe(
          true,
        )
      })
    })

    describe('deleteByID endpoint', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        const res = await restClient.DELETE(`/${trashEnabledSlug}/${trashEnabledDocTwo.id}`)
        expect(res.status).toBe(404)
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        const res = await restClient.DELETE(
          `/${trashEnabledSlug}/${trashEnabledDocTwo.id}?trash=true`,
        )
        expect(res.status).toBe(200)
        const result = await res.json()
        expect(result.doc.id).toBe(trashEnabledDocTwo.id)
      })
    })
  })

  describe('GRAPHQL API', () => {
    describe('find query', () => {
      it('should return all docs including soft-deleted docs in find with trash=true', async () => {
        const query = `
          query {
            TrashEnableds(trash: true) {
              docs {
                id
                title
                deletedAt
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.TrashEnableds.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs with trash=true and where[deletedAt][exists]=true', async () => {
        const query = `
          query {
            TrashEnableds(
              trash: true
              where: { deletedAt: { exists: true } }
            ) {
              docs {
                id
                deletedAt
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.TrashEnableds.docs).toHaveLength(1)
        expect(res.data.TrashEnableds.docs[0].id).toEqual(trashEnabledDocTwo.id)
      })

      it('should return only normal docs when trash=false', async () => {
        const query = `
          query {
            TrashEnableds(trash: false) {
              docs {
                id
                deletedAt
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.TrashEnableds.docs).toHaveLength(1)
        expect(res.data.TrashEnableds.docs[0].id).toEqual(trashEnabledDocOne.id)
        expect(res.data.TrashEnableds.docs[0].deletedAt).toBeNull()
      })

      it('should find restored documents after setting deletedAt to null', async () => {
        const mutation = `
          mutation {
            updateTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, trash: true, data: {
              deletedAt: null
            }) {
              id
            }
          }
        `
        await restClient.GRAPHQL_POST({ body: JSON.stringify({ query: mutation }) })

        const query = `
          query {
            TrashEnableds(trash: false) {
              docs {
                id
                deletedAt
              }
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const restored = res.data.TrashEnableds.docs.find(
          (doc: TrashEnabled) => doc.id === trashEnabledDocTwo.id,
        )
        expect(restored).toBeDefined()
        expect(restored.deletedAt).toBeNull()
      })
    })

    describe('findByID query', () => {
      it('should return a soft-deleted doc by ID with trash=true', async () => {
        const query = `
          query {
            TrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, trash: true) {
              id
              deletedAt
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.TrashEnabled.id).toBe(trashEnabledDocTwo.id)
        expect(res.data.TrashEnabled.deletedAt).toBe(trashEnabledDocTwo.deletedAt)
      })

      it('should 404 when trying to get a soft-deleted doc without trash=true', async () => {
        const query = `
          query {
            TrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}) {
              id
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })
    })

    describe('find versions query', () => {
      beforeAll(async () => {
        await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })
      it('should return all versions including soft-deleted docs in findVersions with trash: true', async () => {
        const query = `
          query {
            versionsTrashEnableds(trash: true) {
              docs {
                id
                version {
                  title
                  deletedAt
                }
              }
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.versionsTrashEnableds.docs).toHaveLength(2)
      })

      it('should return only soft-deleted docs in findVersions with trash: true', async () => {
        const query = `
          query {
            versionsTrashEnableds(
              trash: true,
              where: {
                version__deletedAt: {
                  exists: true
                }
              }
            ) {
              docs {
                id
                version {
                  title
                  deletedAt
                }
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const { docs } = res.data.versionsTrashEnableds

        // Should only include soft-deleted versions
        expect(docs).toHaveLength(1)

        for (const doc of docs) {
          expect(doc.version.deletedAt).toBeDefined()
        }
      })

      it('should return only non-soft-deleted docs in findVersions with trash: false', async () => {
        const query = `
          query {
            versionsTrashEnableds(trash: false) {
              docs {
                id
                version {
                  title
                  deletedAt
                }
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const { docs } = res.data.versionsTrashEnableds

        // All versions returned should NOT have deletedAt set
        for (const doc of docs) {
          expect(doc.version.deletedAt).toBeNull()
        }
      })

      it('should find versions where version.deletedAt is null after restore', async () => {
        const mutation = `
          mutation {
            updateTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, trash: true, data: { deletedAt: null }) {
              id
              title
              deletedAt
            }
          }
        `
        await restClient.GRAPHQL_POST({ body: JSON.stringify({ query: mutation }) })

        const query = `
          query {
            versionsTrashEnableds(
              trash: true,
              where: {
                version__deletedAt: {
                  equals: null
                }
              }
            ) {
              docs {
                id
                parent {
                  id
                }
                version {
                  deletedAt
                }
              }
            }
          }
        `

        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const version = res.data.versionsTrashEnableds.docs.find(
          (v: any) => String(v.parent.id) === String(trashEnabledDocTwo.id),
        )
        expect(version).toBeDefined()
        expect(version.version.deletedAt).toBeNull()
      })
    })

    describe('findVersionByID endpoint', () => {
      beforeAll(async () => {
        await payload.update({
          collection: trashEnabledSlug,
          data: {
            title: 'Some updated title',
          },
          trash: true,
          where: {
            title: {
              exists: true,
            },
          },
        })
      })

      it('should return a soft-deleted document when trash: true', async () => {
        // First, get the version ID of the soft-deleted trash enabled doc
        const listQuery = `
          query {
            versionsTrashEnableds(
              trash: true,
              where: {
                version__deletedAt: {
                  exists: true
                }
              }
            ) {
              docs {
                id
                version {
                  deletedAt
                }
              }
            }
          }
        `
        const listRes = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: listQuery }) })
          .then((r) => r.json())

        const trashedVersion = listRes.data.versionsTrashEnableds.docs[0]

        const detailQuery = `
          query {
            versionTrashEnabled(id: ${idToString(trashedVersion.id, payload)}, trash: true) {
              id
              version {
                deletedAt
              }
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: detailQuery }) })
          .then((r) => r.json())

        expect(res.data.versionTrashEnabled.id).toBe(trashedVersion.id)
        expect(res.data.versionTrashEnabled.version.deletedAt).toBe(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to find a soft-deleted version document w/o trash: true', async () => {
        // First, get the version ID of the soft-deleted trash enabled doc
        const listQuery = `
          query {
            versionsTrashEnableds(
              trash: true,
              where: {
                version__deletedAt: {
                  exists: true
                }
              }
            ) {
              docs {
                id
              }
            }
          }
        `
        const listRes = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: listQuery }) })
          .then((r) => r.json())

        const trashedVersion = listRes.data.versionsTrashEnableds.docs[0]

        const detailQuery = `
          query {
            versionTrashEnabled(id: ${idToString(trashedVersion.id, payload)}) {
              id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: detailQuery }) })
          .then((r) => r.json())

        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })
    })

    describe('updateByID query', () => {
      it('should update a single soft-deleted doc when trash=true', async () => {
        const query = `
          mutation {
            updateTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, trash: true, data: { title: "Updated Soft Deleted via GQL" }) {
              id
              title
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.updateTrashEnabled.id).toBe(trashEnabledDocTwo.id)
        expect(res.data.updateTrashEnabled.title).toBe('Updated Soft Deleted via GQL')
        expect(res.data.updateTrashEnabled.deletedAt).toBe(trashEnabledDocTwo.deletedAt)
      })

      it('should throw NotFound error when trying to update a soft-deleted document w/o trash: true', async () => {
        const query = `
          mutation {
            updateTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, data: { title: "Should Fail" }) {
              id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })

      it('should update a single normal document when trash: false', async () => {
        const query = `
          mutation {
            updateTrashEnabled(id: ${idToString(trashEnabledDocOne.id, payload)}, trash: false, data: { title: "Updated Normal via GQL" }) {
              id
              title
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        expect(res.data.updateTrashEnabled.id).toBe(trashEnabledDocOne.id)
        expect(res.data.updateTrashEnabled.title).toBe('Updated Normal via GQL')
        expect(res.data.updateTrashEnabled.deletedAt).toBeNull()
      })

      it('should restore a soft-deleted document by setting deletedAt to null', async () => {
        const mutation = `
          mutation {
            updateTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, trash: true, data: {
              deletedAt: null
            }) {
              id
              deletedAt
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query: mutation }) })
          .then((r) => r.json())

        expect(res.data.updateTrashEnabled.deletedAt).toBeNull()

        const query = `
          query {
            TrashEnableds(trash: false) {
              docs {
                id
                deletedAt
              }
            }
          }
        `
        const restored = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        const match = restored.data.TrashEnableds.docs.find(
          (doc: TrashEnabled) => doc.id === trashEnabledDocTwo.id,
        )
        expect(match).toBeDefined()
        expect(match.deletedAt).toBeNull()
      })
    })

    // describe('update endpoint', () => {
    //   it.todo('should update only normal document when trash: false')

    //   it.todo('should update all documents including soft-deleted documents when trash: true')

    //   it.todo(
    //     'should only update soft-deleted documents when trash: true and where[deletedAt][exists]=true',
    //   )
    // })

    // describe('delete endpoint', () => {
    //   it.todo('should perma delete all docs including soft-deleted documents when trash: true')

    //   it.todo('should only perma delete normal docs when trash: false')
    // })

    describe('deleteByID query', () => {
      it('should throw NotFound error when trying to delete a soft-deleted document w/o trash: true', async () => {
        const query = `
          mutation {
            deleteTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}) {
                id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())

        console.log(res)
        expect(res.errors?.[0]?.message).toMatch(/not found/i)
      })

      it('should delete a soft-deleted document when trash: true', async () => {
        const query = `
          mutation {
            deleteTrashEnabled(id: ${idToString(trashEnabledDocTwo.id, payload)}, trash: true) {
                id
            }
          }
        `
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((r) => r.json())
        expect(res.data.deleteTrashEnabled.id).toBe(trashEnabledDocTwo.id)
      })
    })
  })
})
