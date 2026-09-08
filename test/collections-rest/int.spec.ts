import type { Payload, SanitizedCollectionConfig } from 'payload'

import { randomBytes, randomUUID } from 'crypto'
import { serialize } from 'object-to-formdata'
import { APIError, NotFound } from 'payload'
import { fileURLToPath } from 'url'
import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Relation } from './config.js'
import type { Post } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { getFormDataSize } from '../__helpers/shared/getFormDataSize.js'
import { largeDocumentsCollectionSlug } from './collections/LargeDocuments.js'
import {
  customIdNumberSlug,
  customIdSlug,
  endpointsSlug,
  errorOnHookSlug,
  methods,
  pointSlug,
  postsSlug,
  relationSlug,
} from './config.js'

test.suite({ config: './config.ts' })('collections-rest', () => {
  test.beforeEach(async ({ payload }) => {
    await clearDocs({ payload })
  })

  test.describe('CRUD', () => {
    test('should create', async ({ restClient }) => {
      const data = {
        title: 'title',
      }
      const doc = await createPost({ restClient }, data)

      expect(doc).toMatchObject(data)
    })

    test('should return 400 when request body contains malformed JSON', async ({ restClient }) => {
      const response = await restClient.POST(`/${postsSlug}`, {
        body: '{ invalid json',
      })

      expect(response.status).toEqual(400)
      const result: any = await response.json()

      expect(result.errors).toBeDefined()
      expect(result.errors[0].message).toEqual('Invalid JSON')
    })

    test('should find', async ({ restClient }) => {
      const post1 = await createPost({ restClient })
      const post2 = await createPost({ restClient })
      const response = await restClient.GET(`/${postsSlug}`)
      const result = await response.json()

      expect(response.status).toEqual(200)
      expect(result.totalDocs).toEqual(2)
      const expectedDocs = [post1, post2]
      expect(result.docs).toHaveLength(expectedDocs.length)
      expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
    })

    test('should count', async ({ restClient }) => {
      await createPost({ restClient })
      await createPost({ restClient })
      const response = await restClient.GET(`/${postsSlug}/count`)
      const result = await response.json()

      expect(response.status).toEqual(200)
      expect(result).toEqual({ totalDocs: 2 })
    })

    test('should find where id', async ({ restClient }) => {
      const post1 = await createPost({ restClient })
      await createPost({ restClient })
      const response = await restClient.GET(`/${postsSlug}`, {
        query: {
          where: { id: { equals: post1.id } },
        },
      })
      const result = await response.json()

      expect(response.status).toEqual(200)
      expect(result.totalDocs).toEqual(1)
      expect(result.docs[0].id).toEqual(post1.id)
    })

    test('should find with pagination false', async ({ payload, restClient }) => {
      const post1 = await createPost({ restClient })
      const post2 = await createPost({ restClient })

      const { docs, totalDocs } = await payload.find({
        collection: postsSlug,
        overrideAccess: false,
        pagination: false,
      })

      const expectedDocs = [post1, post2]
      expect(docs).toHaveLength(expectedDocs.length)
      expect(docs).toEqual(expect.arrayContaining(expectedDocs))

      expect(totalDocs).toEqual(2)
    })

    test('should update existing', async ({ restClient }) => {
      const { id, description } = await createPost({ restClient }, { description: 'desc' })
      const updatedTitle = 'updated-title'

      const response = await restClient.PATCH(`/${postsSlug}/${id}`, {
        body: JSON.stringify({ title: updatedTitle }),
      })
      const { doc } = await response.json()

      expect(response.status).toEqual(200)
      expect(doc.title).toEqual(updatedTitle)
      expect(doc.description).toEqual(description) // Check was not modified
    })

    test('can handle REST API requests with over 1mb of multipart/form-data', async ({
      payload,
      restClient,
    }) => {
      const doc = await payload.create({
        collection: largeDocumentsCollectionSlug,
        data: {},
      })

      const arrayData = new Array(500).fill({ text: randomUUID().repeat(100) })

      // Now use the REST API and attempt to PATCH the document with a payload over 1mb
      const dataToSerialize: Record<string, unknown> = {
        _payload: JSON.stringify({
          title: 'Hello, world!',
          // fill with long, random string of text to exceed 1mb
          array: arrayData,
        }),
      }

      const formData: FormData = serialize(dataToSerialize, {
        indices: true,
        nullsAsUndefineds: false,
      })

      // Ensure the form data we are about to send is greater than the default limit (1mb)
      // But less than the increased limit that we've set in the root config (2mb)
      const docSize = getFormDataSize(formData)
      expect(docSize).toBeGreaterThan(1 * 1024 * 1024)
      expect(docSize).toBeLessThan(2 * 1024 * 1024)

      // This request should not fail with error: "Unterminated string in JSON at position..."
      // This is because we set `bodyParser.limits.fieldSize` to 2mb in the root config
      const res = await restClient
        .PATCH(`/${largeDocumentsCollectionSlug}/${doc.id}?limit=1`, {
          body: formData,
        })
        .then((res) => res.json())

      expect(res).not.toHaveProperty('errors')
      expect(res.doc.id).toEqual(doc.id)
      expect(res.doc.array[0].text).toEqual(arrayData[0].text)
    })

    test.describe('Bulk operations', () => {
      test('should bulk update', async ({ restClient }) => {
        for (let i = 0; i < 11; i++) {
          await createPost({ restClient }, { description: `desc ${i}` })
        }

        const description = 'updated'
        const response = await restClient.PATCH(`/${postsSlug}`, {
          body: JSON.stringify({
            description,
          }),
          query: { where: { title: { equals: 'title' } } },
        })
        const { docs, errors } = await response.json()

        expect(errors).toHaveLength(0)
        expect(response.status).toEqual(200)
        expect(docs[0].title).toEqual('title') // Check was not modified
        expect(docs[0].description).toEqual(description)
        expect(docs.pop().description).toEqual(description)
      })

      test('should bulk update with limit', async ({ payload, restClient }) => {
        const ids = []
        for (let i = 0; i < 3; i++) {
          const post = await createPost({ restClient }, { description: `to-update` })
          ids.push(post.id)
        }

        const description = 'updated-description'
        const response = await restClient.PATCH(`/${postsSlug}`, {
          body: JSON.stringify({
            description,
          }),
          query: { limit: 2, where: { id: { in: ids } } },
        })
        const { docs, errors } = await response.json()

        expect(errors).toHaveLength(0)
        expect(response.status).toEqual(200)
        expect(docs).toHaveLength(2)
        expect(docs[0].description).toEqual(description)
        expect(docs.pop().description).toEqual(description)

        const { docs: resDocs } = await payload.find({
          limit: 10,
          collection: postsSlug,
          where: { id: { in: ids } },
        })
        expect(resDocs.at(-1).description).toEqual('to-update')
      })

      test('should not bulk update with a bad query', async ({ payload, restClient }) => {
        for (let i = 0; i < 2; i++) {
          await createPost({ restClient }, { description: `desc ${i}` })
        }

        const description = 'updated'

        const response = await restClient.PATCH(`/${postsSlug}`, {
          body: JSON.stringify({
            description,
          }),
          query: { where: { missing: { equals: 'title' } } },
        })
        const { docs: noDocs, errors } = await response.json()

        expect(response.status).toEqual(400)
        expect(noDocs).toBeUndefined()
        expect(errors).toHaveLength(1)

        const { docs } = await payload.find({
          collection: postsSlug,
        })

        expect(docs[0].description).not.toEqual(description)
        expect(docs.pop().description).not.toEqual(description)
      })

      test('should not bulk update with a bad relationship query', async ({
        payload,
        restClient,
      }) => {
        for (let i = 0; i < 2; i++) {
          await createPost({ restClient }, { description: `desc ${i}` })
        }

        const description = 'updated'
        const relationFieldResponse = await restClient.PATCH(`/${postsSlug}`, {
          body: JSON.stringify({
            description,
          }),
          query: { where: { 'relationField.missing': { equals: 'title' } } },
        })
        expect(relationFieldResponse.status).toEqual(400)

        const relationMultiRelationToResponse = await restClient.PATCH(`/${postsSlug}`, {
          body: JSON.stringify({
            description,
          }),
          query: { where: { 'relationMultiRelationTo.missing': { equals: 'title' } } },
        })
        expect(relationMultiRelationToResponse.status).toEqual(400)

        const { docs } = await payload.find({
          collection: postsSlug,
        })

        expect(docs[0].description).not.toEqual(description)
        expect(docs.pop().description).not.toEqual(description)
      })

      test('should not bulk update with a read restricted field query', async ({
        payload,
        restClient,
      }) => {
        const { id } = await payload.create({
          collection: postsSlug,
          data: {
            restrictedField: 'restricted',
          },
        })

        const description = 'description'
        const response = await restClient.PATCH(`/${postsSlug}`, {
          body: JSON.stringify({
            description,
          }),
          query: { where: { restrictedField: { equals: 'restricted' } } },
        })
        const result = await response.json()

        const doc = await payload.findByID({
          id,
          collection: postsSlug,
        })

        expect(response.status).toEqual(400)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].message).toEqual(
          'The following path cannot be queried: restrictedField',
        )
        expect(doc.description).toBeFalsy()
      })

      test('should return formatted errors for bulk updates', async ({ payload, restClient }) => {
        const text = 'bulk-update-test-errors'
        const errorDoc = await payload.create({
          collection: errorOnHookSlug,
          data: {
            errorBeforeChange: true,
            text,
          },
        })
        const successDoc = await payload.create({
          collection: errorOnHookSlug,
          data: {
            errorBeforeChange: false,
            text,
          },
        })

        const update = 'update'
        const response = await restClient.PATCH(`/${errorOnHookSlug}`, {
          body: JSON.stringify({
            text: update,
          }),
          query: { where: { text: { equals: text } } },
        })
        const result = await response.json()

        expect(response.status).toEqual(400)
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0].id).toEqual(successDoc.id)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].message).toBeDefined()
        expect(result.errors[0].id).toEqual(errorDoc.id)
        expect(result.docs[0].text).toEqual(update)
      })

      test('should bulk delete', async ({ restClient }) => {
        const count = 11
        for (let i = 0; i < count; i++) {
          await createPost({ restClient }, { description: `desc ${i}` })
        }

        const response = await restClient.DELETE(`/${postsSlug}`, {
          query: { where: { title: { equals: 'title' } } },
        })
        const { docs } = await response.json()

        expect(response.status).toEqual(200)
        expect(docs[0].title).toEqual('title') // Check was not modified
        expect(docs).toHaveLength(count)
      })

      test('should use the configured bulk delete strategy', async ({ payload, restClient }) => {
        const deleteOneSpy = vi.spyOn(payload.db, 'deleteOne')
        const deleteManySpy = vi.spyOn(payload.db, 'deleteMany')

        const countDeleteCalls = async (count: number) => {
          await createPosts({ restClient }, count)

          deleteOneSpy.mockClear()
          deleteManySpy.mockClear()

          const { docs, errors } = await payload.delete({
            collection: postsSlug,
            where: { title: { equals: 'title' } },
          })

          expect(errors).toHaveLength(0)
          expect(docs).toHaveLength(count)

          return {
            deleteMany: deleteManySpy.mock.calls.length,
            deleteOne: deleteOneSpy.mock.calls.length,
          }
        }

        const few = await countDeleteCalls(2)
        const many = await countDeleteCalls(20)

        deleteOneSpy.mockRestore()
        deleteManySpy.mockRestore()

        const isPerDocument = payload.db.bulkOperationsSingleTransaction

        expect(few.deleteOne).toBe(isPerDocument ? 2 : 0)
        expect(many.deleteOne).toBe(isPerDocument ? 20 : 0)
        // When batched writes are enabled, deleting ten times as many documents must not cost ten
        // times as many deleteMany calls.
        expect(isPerDocument || many.deleteMany === few.deleteMany).toBe(true)
      })

      test('should return formatted errors for bulk deletes', async ({ payload, restClient }) => {
        await payload.create({
          collection: errorOnHookSlug,
          data: {
            errorAfterDelete: true,
            text: 'test',
          },
        })
        await payload.create({
          collection: errorOnHookSlug,
          data: {
            errorAfterDelete: false,
            text: 'test',
          },
        })

        const response = await restClient.DELETE(`/${errorOnHookSlug}`, {
          query: { where: { text: { equals: 'test' } } },
        })
        const result = await response.json()

        expect(response.status).toEqual(400)
        expect(result.docs).toHaveLength(1)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].message).toBeDefined()
        expect(result.errors[0].id).toBeDefined()
      })
    })

    test.describe('Custom ID', () => {
      test.describe('string', () => {
        test('should create', async ({ restClient }) => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const customIdName = 'custom-id-name'
          const { doc } = await restClient
            .POST(`/${customIdSlug}`, {
              body: JSON.stringify({ id: customId, name: customIdName }),
            })
            .then((res) => res.json())
          expect(doc.id).toEqual(customId)
          expect(doc.name).toEqual(customIdName)
        })

        test('should find', async ({ restClient }) => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await restClient
            .POST(`/${customIdSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-name' }),
            })
            .then((res) => res.json())
          const { id } = await restClient
            .GET(`/${customIdSlug}/${customId}`)
            .then((res) => res.json())

          expect(id).toEqual(doc.id)
        })

        test('should query - equals', async ({ restClient }) => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await restClient
            .POST(`/${customIdSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-name' }),
            })
            .then((res) => res.json())
          const { docs } = await restClient
            .GET(`/${customIdSlug}`, {
              query: {
                where: { id: { equals: customId } },
              },
            })
            .then((res) => res.json())

          expect(docs.map(({ id }) => id)).toContain(doc.id)
        })

        test('should query - like', async ({ restClient }) => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await restClient
            .POST(`/${customIdSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-name' }),
            })
            .then((res) => res.json())
          const { docs } = await restClient
            .GET(`/${customIdSlug}`, {
              query: {
                where: { id: { like: 'custom' } },
              },
            })
            .then((res) => res.json())

          expect(docs.map(({ id }) => id)).toContain(doc.id)
        })

        test('should update', async ({ restClient }) => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await restClient
            .POST(`/${customIdSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-name' }),
            })
            .then((res) => res.json())
          const { doc: updatedDoc } = await restClient
            .PATCH(`/${customIdSlug}/${doc.id}`, {
              body: JSON.stringify({ name: 'updated' }),
            })
            .then((res) => res.json())

          expect(updatedDoc.name).toEqual('updated')
        })
      })

      test.describe('number', () => {
        test('should create', async ({ restClient }) => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await restClient
            .POST(`/${customIdNumberSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-number-name' }),
            })
            .then((res) => res.json())
          expect(doc.id).toEqual(customId)
        })

        test('should find', async ({ restClient }) => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await restClient
            .POST(`/${customIdNumberSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-number-name' }),
            })
            .then((res) => res.json())
          const { id } = await restClient
            .GET(`/${customIdNumberSlug}/${customId}`)
            .then((res) => res.json())
          expect(id).toEqual(doc.id)
        })

        test('should update', async ({ restClient }) => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await restClient
            .POST(`/${customIdNumberSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-number-name' }),
            })
            .then((res) => res.json())
          const { doc: updatedDoc } = await restClient
            .PATCH(`/${customIdNumberSlug}/${doc.id}`, {
              body: JSON.stringify({ name: 'updated' }),
            })
            .then((res) => res.json())
          expect(updatedDoc.name).toEqual('updated')
        })

        test('should allow querying by in', async ({ restClient }) => {
          const id = 98234698237
          await restClient.POST(`/${customIdNumberSlug}`, {
            body: JSON.stringify({ id, name: 'query using in operator' }),
          })
          const { docs } = await restClient
            .GET(`/${customIdNumberSlug}`, {
              query: {
                where: { id: { in: `${id}, ${2349856723948764}` } },
              },
            })
            .then((res) => res.json())

          expect(docs).toHaveLength(1)
        })
      })
    })

    test('should delete', async ({ restClient }) => {
      const { id } = await createPost({ restClient })

      const response = await restClient.DELETE(`/${postsSlug}/${id}`)
      const { doc } = await response.json()

      expect(response.status).toEqual(200)
      expect(doc.id).toEqual(id)
    })

    test('should include metadata', async ({ restClient }) => {
      await createPosts({ restClient }, 11)

      const result = await restClient.GET(`/${postsSlug}`).then((res) => res.json())

      expect(result.totalDocs).toBeGreaterThan(0)
      expect(result.limit).toBe(10)
      expect(result.page).toBe(1)
      expect(result.pagingCounter).toBe(1)
      expect(result.hasPrevPage).toBe(false)
      expect(result.hasNextPage).toBe(true)
      expect(result.prevPage).toBeNull()
      expect(result.nextPage).toBe(2)
    })
  })

  test.describe('Querying', () => {
    test.todo('should allow querying by a field within a group')
    test.describe('Relationships', () => {
      let post: Post
      let relation: Relation
      let relation2: Relation
      const nameToQuery = 'name'
      const nameToQuery2 = 'name2'

      test.beforeEach(async ({ restClient }) => {
        ;({ doc: relation } = await restClient
          .POST(`/${relationSlug}`, {
            body: JSON.stringify({ name: nameToQuery }),
          })
          .then((res) => res.json()))
        ;({ doc: relation2 } = await restClient
          .POST(`/${relationSlug}`, {
            body: JSON.stringify({ name: nameToQuery2 }),
          })
          .then((res) => res.json()))

        post = await createPost(
          { restClient },
          {
            relationField: relation.id,
          },
        )

        await createPost({ restClient }) // Extra post to allow asserting totalDoc count
      })

      test.describe('regular relationship', () => {
        test('query by property value', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: { relationField: { equals: relation.id } },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toEqual([post])
          expect(result.totalDocs).toEqual(1)
        })

        test('should count query by property value', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}/count`, {
            query: {
              where: { relationField: { equals: relation.id } },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result).toEqual({ totalDocs: 1 })
        })

        test('query by id', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: { relationField: { equals: relation.id } },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toEqual([post])
          expect(result.totalDocs).toEqual(1)
        })

        test('should query LIKE by ID', async ({ payload, restClient }) => {
          const post = await payload.create({
            collection: postsSlug,
            data: {
              title: 'find me buddy',
            },
          })

          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: {
                id: {
                  like: post.id,
                },
              },
            },
          })

          const result = await response.json()
          expect(response.status).toStrictEqual(200)
          expect(result.totalDocs).toStrictEqual(1)
        })
      })

      test('should query nested relationship - hasMany', async ({ restClient }) => {
        const post1 = await createPost(
          { restClient },
          {
            relationHasManyField: [relation.id, relation2.id],
          },
        )

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { 'relationHasManyField.name': { equals: relation.name } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)

        // Query second relationship
        const response2 = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { 'relationHasManyField.name': { equals: relation2.name } },
          },
        })
        const result2 = await response2.json()

        expect(response2.status).toEqual(200)
        expect(result2.docs).toEqual([post1])
        expect(result2.totalDocs).toEqual(1)
      })

      test.describe('relationTo multi', () => {
        test('nested by id', async ({ restClient }) => {
          const post1 = await createPost(
            { restClient },
            {
              relationMultiRelationTo: { relationTo: relationSlug, value: relation.id },
            },
          )
          await createPost({ restClient })

          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: { 'relationMultiRelationTo.value': { equals: relation.id } },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toEqual([post1])
          expect(result.totalDocs).toEqual(1)
        })
      })

      test('should query relationships by not_equals', async ({ restClient }) => {
        const ogPost = await createPost(
          { restClient },
          {
            relationMultiRelationTo: { relationTo: relationSlug, value: relation.id },
          },
        )
        await createPost({ restClient })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              and: [
                {
                  'relationMultiRelationTo.value': { not_equals: relation.id },
                },
              ],
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        const foundExcludedDoc = result.docs.some((doc) => ogPost.id === doc.id)
        expect(foundExcludedDoc).toBe(false)
      })

      test.describe('relationTo multi hasMany', () => {
        test('nested by id', async ({ restClient }) => {
          const post1 = await createPost(
            { restClient },
            {
              relationMultiRelationToHasMany: [
                { relationTo: relationSlug, value: relation.id },
                { relationTo: relationSlug, value: relation2.id },
              ],
            },
          )
          await createPost({ restClient })

          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: { 'relationMultiRelationToHasMany.value': { equals: relation.id } },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toEqual([post1])
          expect(result.totalDocs).toEqual(1)

          // Query second relation
          const response2 = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: { 'relationMultiRelationToHasMany.value': { equals: relation.id } },
            },
          })
          const result2 = await response2.json()

          expect(response2.status).toEqual(200)
          expect(result2.docs).toEqual([post1])
          expect(result2.totalDocs).toEqual(1)
        })

        test.todo('nested by property value')
      })
    })

    test.describe('Edge cases', () => {
      test('should query a localized field without localization configured', async ({
        restClient,
      }) => {
        const test = 'test'
        await createPost({ restClient }, { fakeLocalization: test })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { fakeLocalization: { equals: test } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toHaveLength(1)
      })

      test('should not error when attempting to sort on a field that does not exist', async ({
        restClient,
      }) => {
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            sort: 'fake',
          },
        })

        expect(response.status).toStrictEqual(200)
      })
    })

    test.describe('Operators', () => {
      test('equals', async ({ restClient }) => {
        const valueToQuery = 'valueToQuery'
        const post1 = await createPost({ restClient }, { title: valueToQuery })
        await createPost({ restClient })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { title: { equals: valueToQuery } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([post1])
      })

      test('not_equals', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'not-equals' })
        const post2 = await createPost({ restClient })
        const post3 = await createPost({ restClient }, { title: undefined })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { title: { not_equals: post1.title } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.totalDocs).toEqual(2)
        expect(result.docs).toEqual([post3, post2])
      })

      test('in', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'my-title' })
        await createPost({ restClient })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { title: { in: [post1.title] } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      test('not_in', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'not-me' })
        const post2 = await createPost({ restClient })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { title: { not_in: [post1.title] } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post2])
        expect(result.totalDocs).toEqual(1)
      })

      test('not_in (relationships)', async ({ payload, restClient }) => {
        const relationship = await payload.create({
          collection: relationSlug,
          data: {},
        })

        await createPost({ restClient }, { relationField: relationship.id, title: 'not-me' })
        // await createPost({ relationMultiRelationTo: relationship.id, title: 'not-me' })
        const post2 = await createPost({ restClient }, { title: 'me' })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { relationField: { not_in: [relationship.id] } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post2])
        expect(result.totalDocs).toEqual(1)

        // do not want to error for empty arrays
        const emptyNotInResponse = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { relationField: { not_in: [] } },
          },
        })

        expect(emptyNotInResponse.status).toEqual(200)
      })

      test('in (relationships)', async ({ payload, restClient }) => {
        const relationship = await payload.create({
          collection: relationSlug,
          data: {},
        })

        const post1 = await createPost(
          { restClient },
          { relationField: relationship.id, title: 'me' },
        )
        // await createPost({ relationMultiRelationTo: relationship.id, title: 'not-me' })
        await createPost({ restClient }, { title: 'not-me' })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { relationField: { in: [relationship.id] } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)

        // do not want to error for empty arrays
        const emptyNotInResponse = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { relationField: { in: [] } },
          },
        })

        expect(emptyNotInResponse.status).toEqual(200)
      })

      test('like', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'prefix-value' })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { title: { like: 'prefix' } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      test.describe('like - special characters', () => {
        const specialCharacters = '~!@#$%^&*()_+-+[]{}|;:"<>,.?/})'

        test.for(specialCharacters.split(''))(
          'like - special characters - %s',
          async (character, { restClient }) => {
            const post1 = await createPost(
              { restClient },
              {
                title: specialCharacters,
              },
            )

            const response = await restClient.GET(`/${postsSlug}`, {
              query: {
                where: {
                  title: {
                    like: character,
                  },
                },
              },
            })
            const result = await response.json()

            expect(response.status).toEqual(200)
            expect(result.docs).toEqual([post1])
            expect(result.totalDocs).toEqual(1)
          },
        )
      })

      test('like - cyrillic characters', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'Тест' })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              title: {
                like: 'Тест',
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      test('like - cyrillic characters in multiple words', async ({ restClient }) => {
        const post1 = await createPost(
          { restClient },
          { title: 'привет, это тест полезной нагрузки' },
        )

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              title: {
                like: 'привет нагрузки',
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      test('like - partial word match', async ({ restClient }) => {
        const post = await createPost(
          { restClient },
          { title: 'separate words should partially match' },
        )
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              title: {
                like: 'words partial',
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toEqual([post])
        expect(result.totalDocs).toEqual(1)
      })

      test('like - id should not crash', async ({ restClient }) => {
        const post = await createPost({ restClient }, { title: 'post' })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              id: {
                like: 'words partial',
              },
            },
          },
        })

        expect(response.status).toEqual(200)
      })

      test('exists - true', async ({ restClient }) => {
        const postWithDesc = await createPost({ restClient }, { description: 'exists' })
        await createPost({ restClient }, { description: undefined })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              description: {
                exists: true,
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([postWithDesc])
      })

      test('exists - false', async ({ restClient }) => {
        const postWithoutDesc = await createPost({ restClient }, { description: undefined })
        await createPost({ restClient }, { description: 'exists' })
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              description: {
                exists: false,
              },
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([postWithoutDesc])
      })

      test.describe('numbers', () => {
        let post1: Post
        let post2: Post
        test.beforeEach(async ({ restClient }) => {
          post1 = await createPost({ restClient }, { number: 1 })
          post2 = await createPost({ restClient }, { number: 2 })
        })

        test('greater_than', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: {
                number: {
                  greater_than: 1,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.totalDocs).toEqual(1)
          expect(result.docs).toEqual([post2])
        })

        test('greater_than_equal', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: {
                number: {
                  greater_than_equal: 1,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.totalDocs).toEqual(2)
          const expectedDocs = [post1, post2]
          expect(result.docs).toHaveLength(expectedDocs.length)
          expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
        })

        test('less_than', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: {
                number: {
                  less_than: 2,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.totalDocs).toEqual(1)
          expect(result.docs).toEqual([post1])
        })

        test('less_than_equal', async ({ restClient }) => {
          const response = await restClient.GET(`/${postsSlug}`, {
            query: {
              where: {
                number: {
                  less_than_equal: 2,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.totalDocs).toEqual(2)
          const expectedDocs = [post1, post2]
          expect(result.docs).toHaveLength(expectedDocs.length)
          expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
        })
      })

      test.describe('near', () => {
        const point = [10, 20]
        const [lat, lng] = point
        test('should return a document near a point', async ({ payload, restClient }) => {
          if (payload.db.name === 'sqlite') {
            return
          }

          const near = `${lat + 0.01}, ${lng + 0.01}, 10000`
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  near,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(1)

          const responseCount = await restClient.GET(`/${pointSlug}/count`, {
            query: {
              where: {
                point: {
                  near,
                },
              },
            },
          })
          const resultCount = await responseCount.json()

          expect(responseCount.status).toEqual(200)
          expect(resultCount.totalDocs).toBe(1)
        })

        test('should omit maxDistance and return a document from minDistance', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }

          const near = `${lat + 0.01}, ${lng + 0.01}, null, 1500`
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  near,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(1)
        })

        test('should omit maxDistance and not return a document because exceeds minDistance', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }

          const near = `${lat + 0.01}, ${lng + 0.01}, null, 1700`
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  near,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(0)
        })

        // https://github.com/payloadcms/payload/issues/14471 - ensure geospatial queries use true geodetic meters, not the distorted meters of EPSG:3857
        test('should use true geodetic meters at high latitudes', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }

          // A point ~10 km north of NYC: lat += 10000/111320 ≈ 0.0898°
          const queryLng = -74.0059
          const queryLat = 40.7128
          const pointLat = queryLat + 0.0898 // ~10 km north
          let createdId: number | string | undefined

          try {
            const created = await payload.create({
              collection: pointSlug,
              data: { point: [queryLng, pointLat] },
            })

            createdId = created.id

            // Query with 12 km radius — the point at ~10 km should be within range.
            // With the old EPSG:3857 approach, the effective radius at this latitude was
            // only ~9 km, causing the point to be missed.
            const response = await restClient.GET(`/${pointSlug}`, {
              query: {
                where: {
                  point: {
                    near: `${queryLng}, ${queryLat}, 12000`,
                  },
                },
              },
            })
            const result: any = await response.json()

            expect(response.status).toEqual(200)
            expect(result.docs.map((d: { id: number | string }) => d.id)).toContain(createdId)
          } finally {
            if (createdId !== undefined) {
              await payload.delete({ collection: pointSlug, id: createdId })
            }
          }
        })

        test('should not return a point far away', async ({ payload, restClient }) => {
          if (payload.db.name === 'sqlite') {
            return
          }

          const near = `${lng + 1}, ${lat + 1}, 5000`
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  near,
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(0)
        })

        test('should sort find results by nearest distance', async ({ payload, restClient }) => {
          if (payload.db.name === 'sqlite') {
            return
          }

          // creating twice as many records as we are querying to get a random sample
          const promises = []
          for (let i = 0; i < 11; i++) {
            // setTimeout used to randomize the creation timestamp
            setTimeout(() => {
              promises.push(
                payload.create({
                  collection: pointSlug,
                  data: {
                    // only randomize longitude to make distance comparison easy
                    point: [Math.random(), 0],
                  },
                }),
              )
            }, Math.random())
          }
          await Promise.all(promises)

          const { docs } = await restClient
            .GET(`/${pointSlug}`, {
              query: {
                limit: 5,
                where: {
                  point: {
                    // querying large enough range to include all docs
                    near: '0, 0, 100000, 0',
                  },
                },
              },
            })
            .then((res) => res.json())

          let previous = 0
          docs.forEach(({ point: coordinates }) => {
            // the next document point should always be greater than the one before
            expect(previous).toBeLessThanOrEqual(coordinates[0])
            ;[previous] = coordinates
          })
        })
      })

      test.describe('within', () => {
        type Point = [number, number]
        const polygon: Point[] = [
          [9.0, 19.0], // bottom-left
          [9.0, 21.0], // top-left
          [11.0, 21.0], // top-right
          [11.0, 19.0], // bottom-right
          [9.0, 19.0], // back to starting point to close the polygon
        ]
        test('should return a document with the point inside the polygon', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }
          // There should be 1 total points document populated by default with the point [10, 20]
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  within: {
                    type: 'Polygon',
                    coordinates: [polygon],
                  },
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(1)
        })

        test('should not return a document with the point outside a smaller polygon', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  within: {
                    type: 'Polygon',
                    coordinates: [polygon.map((vertex) => vertex.map((coord) => coord * 0.1))], // Reduce polygon to 10% of its size
                  },
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(0)
        })
      })

      test.describe('intersects', () => {
        type Point = [number, number]
        const polygon: Point[] = [
          [9.0, 19.0], // bottom-left
          [9.0, 21.0], // top-left
          [11.0, 21.0], // top-right
          [11.0, 19.0], // bottom-right
          [9.0, 19.0], // back to starting point to close the polygon
        ]

        test('should return a document with the point intersecting the polygon', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }
          // There should be 1 total points document populated by default with the point [10, 20]
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  intersects: {
                    type: 'Polygon',
                    coordinates: [polygon],
                  },
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(1)
        })

        test('should not return a document with the point not intersecting a smaller polygon', async ({
          payload,
          restClient,
        }) => {
          if (payload.db.name === 'sqlite') {
            return
          }
          const response = await restClient.GET(`/${pointSlug}`, {
            query: {
              where: {
                point: {
                  intersects: {
                    type: 'Polygon',
                    coordinates: [polygon.map((vertex) => vertex.map((coord) => coord * 0.1))], // Reduce polygon to 10% of its size
                  },
                },
              },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result.docs).toHaveLength(0)
        })
      })

      test('or', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'post1' })
        const post2 = await createPost({ restClient }, { title: 'post2' })
        await createPost({ restClient })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              or: [
                {
                  title: {
                    equals: post1.title,
                  },
                },
                {
                  title: {
                    equals: post2.title,
                  },
                },
              ],
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        const expectedDocs = [post1, post2]
        expect(result.totalDocs).toEqual(expectedDocs.length)
        expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
      })

      test('or - 1 result', async ({ restClient }) => {
        const post1 = await createPost({ restClient }, { title: 'post1' })
        await createPost({ restClient })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              or: [
                {
                  title: {
                    equals: post1.title,
                  },
                },
                {
                  title: {
                    equals: 'non-existent',
                  },
                },
              ],
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        const expectedDocs = [post1]
        expect(result.totalDocs).toEqual(expectedDocs.length)
        expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
      })

      test('and', async ({ restClient }) => {
        const description = 'description'
        const post1 = await createPost({ restClient }, { description, title: 'post1' })
        await createPost({ restClient }, { description, title: 'post2' }) // Diff title, same desc
        await createPost({ restClient })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: {
              and: [
                {
                  title: {
                    equals: post1.title,
                  },
                },
                {
                  description: {
                    equals: description,
                  },
                },
              ],
            },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([post1])
      })

      test.describe('pagination', () => {
        let relatedDoc

        test.beforeEach(async ({ payload, restClient }) => {
          relatedDoc = await payload.create({
            collection: relationSlug,
            data: {
              name: 'test',
            },
          })
          for (let i = 0; i < 10; i++) {
            await createPost(
              { restClient },
              {
                number: i,
                relationField: relatedDoc.id,
                title: 'paginate-test',
              },
            )
          }
        })

        test('should paginate with where query', async ({ restClient }) => {
          const query = {
            limit: 4,
            where: {
              title: {
                equals: 'paginate-test',
              },
            },
          }
          let response = await restClient.GET(`/${postsSlug}`, { query })
          const page1 = await response.json()

          response = await restClient.GET(`/${postsSlug}`, { query: { ...query, page: 2 } })
          const page2 = await response.json()

          response = await restClient.GET(`/${postsSlug}`, { query: { ...query, page: 3 } })
          const page3 = await response.json()

          expect(page1.hasNextPage).toStrictEqual(true)
          expect(page1.hasPrevPage).toStrictEqual(false)
          expect(page1.limit).toStrictEqual(4)
          expect(page1.nextPage).toStrictEqual(2)
          expect(page1.page).toStrictEqual(1)
          expect(page1.pagingCounter).toStrictEqual(1)
          expect(page1.prevPage).toStrictEqual(null)
          expect(page1.totalDocs).toStrictEqual(10)
          expect(page1.totalPages).toStrictEqual(3)

          expect(page2.hasNextPage).toStrictEqual(true)
          expect(page2.hasPrevPage).toStrictEqual(true)
          expect(page2.limit).toStrictEqual(4)
          expect(page2.nextPage).toStrictEqual(3)
          expect(page2.page).toStrictEqual(2)
          expect(page2.pagingCounter).toStrictEqual(5)
          expect(page2.prevPage).toStrictEqual(1)
          expect(page2.totalDocs).toStrictEqual(10)
          expect(page2.totalPages).toStrictEqual(3)

          expect(page3.hasNextPage).toStrictEqual(false)
          expect(page3.hasPrevPage).toStrictEqual(true)
          expect(page3.limit).toStrictEqual(4)
          expect(page3.nextPage).toStrictEqual(null)
          expect(page3.page).toStrictEqual(3)
          expect(page3.pagingCounter).toStrictEqual(9)
          expect(page3.prevPage).toStrictEqual(2)
          expect(page3.totalDocs).toStrictEqual(10)
          expect(page3.totalPages).toStrictEqual(3)
        })

        test('should paginate with where query on relationships', async ({ restClient }) => {
          const query = {
            limit: 4,
            where: {
              relationField: {
                equals: relatedDoc.id,
              },
            },
          }
          let response = await restClient.GET(`/${postsSlug}`, { query })
          const page1 = await response.json()

          response = await restClient.GET(`/${postsSlug}`, { query: { ...query, page: 2 } })
          const page2 = await response.json()

          response = await restClient.GET(`/${postsSlug}`, { query: { ...query, page: 3 } })
          const page3 = await response.json()

          expect(page1.hasNextPage).toStrictEqual(true)
          expect(page1.hasPrevPage).toStrictEqual(false)
          expect(page1.limit).toStrictEqual(4)
          expect(page1.nextPage).toStrictEqual(2)
          expect(page1.page).toStrictEqual(1)
          expect(page1.pagingCounter).toStrictEqual(1)
          expect(page1.prevPage).toStrictEqual(null)
          expect(page1.totalDocs).toStrictEqual(10)
          expect(page1.totalPages).toStrictEqual(3)

          expect(page2.hasNextPage).toStrictEqual(true)
          expect(page2.hasPrevPage).toStrictEqual(true)
          expect(page2.limit).toStrictEqual(4)
          expect(page2.nextPage).toStrictEqual(3)
          expect(page2.page).toStrictEqual(2)
          expect(page2.pagingCounter).toStrictEqual(5)
          expect(page2.prevPage).toStrictEqual(1)
          expect(page2.totalDocs).toStrictEqual(10)
          expect(page2.totalPages).toStrictEqual(3)

          expect(page3.hasNextPage).toStrictEqual(false)
          expect(page3.hasPrevPage).toStrictEqual(true)
          expect(page3.limit).toStrictEqual(4)
          expect(page3.nextPage).toStrictEqual(null)
          expect(page3.page).toStrictEqual(3)
          expect(page3.pagingCounter).toStrictEqual(9)
          expect(page3.prevPage).toStrictEqual(2)
          expect(page3.totalDocs).toStrictEqual(10)
          expect(page3.totalPages).toStrictEqual(3)
        })

        test.describe('limit', () => {
          test.beforeEach(async ({ restClient }) => {
            for (let i = 0; i < 50; i++) {
              await createPost({ restClient }, { number: i, title: 'limit-test' })
            }
          })

          test('should query a limited set of docs', async ({ restClient }) => {
            const response = await restClient.GET(`/${postsSlug}`, {
              query: {
                limit: 15,
                where: {
                  title: {
                    equals: 'limit-test',
                  },
                },
              },
            })
            const result = await response.json()

            expect(response.status).toEqual(200)
            expect(result.docs).toHaveLength(15)
          })

          test('should query all docs when limit=0', async ({ restClient }) => {
            const response = await restClient.GET(`/${postsSlug}`, {
              query: {
                limit: 0,
                where: {
                  title: {
                    equals: 'limit-test',
                  },
                },
              },
            })
            const result = await response.json()

            expect(response.status).toEqual(200)
            expect(result.docs).toHaveLength(50)
            expect(result.totalPages).toEqual(1)
          })
        })
      })

      test('can query deeply nested fields within rows, tabs, collapsibles', async ({
        restClient,
      }) => {
        const withDeeplyNestedField = await createPost(
          { restClient },
          {
            D1: { D2: { D3: { D4: 'nested message' } } },
          },
        )

        const result = await restClient
          .GET(`/${postsSlug}`, {
            query: {
              where: {
                'D1.D2.D3.D4': {
                  equals: 'nested message',
                },
              },
            },
          })
          .then((res) => res.json())

        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([withDeeplyNestedField])
      })
    })
  })

  test.describe('Error Handler', () => {
    test('should return the minimum allowed information about internal errors', async ({
      restClient,
    }) => {
      const response = await restClient.GET('/internal-error-here')
      const result = await response.json()
      expect(response.status).toBe(500)
      expect(Array.isArray(result.errors)).toEqual(true)
      expect(result.errors[0].message).toStrictEqual('Something went wrong.')
    })

    test('should execute afterError hook on root level and modify result/status', async ({
      payload,
      restClient,
    }) => {
      let err: unknown
      let errResult: any

      payload.config.hooks.afterError = [
        ({ error, result }) => {
          err = error
          errResult = result

          return { status: 400, response: { modified: true } }
        },
      ]

      const response = await restClient.GET(`/api-error-here`)
      expect(response.status).toBe(400)

      expect(err).toBeInstanceOf(APIError)
      expect(errResult).toStrictEqual({
        errors: [
          {
            message: 'Something went wrong.',
          },
        ],
      })
      const result = await response.json()

      expect(result.modified).toBe(true)

      payload.config.hooks.afterError = []
    })

    test('should execute afterError hook on collection level and modify result', async ({
      payload,
      restClient,
    }) => {
      let err: unknown
      let errResult: any
      let collection: SanitizedCollectionConfig

      payload.collections.posts.config.hooks.afterError = [
        ({ error, result, collection: incomingCollection }) => {
          err = error
          errResult = result
          collection = incomingCollection

          return { response: { modified: true } }
        },
      ]

      const post = await createPost({ restClient }, {})

      const response = await restClient.GET(
        `/${postsSlug}/${typeof post.id === 'number' ? 1000 : randomUUID()}`,
      )
      expect(response.status).toBe(404)

      expect(collection.slug).toBe(postsSlug)
      expect(err).toBeInstanceOf(NotFound)
      expect(errResult).toStrictEqual({
        errors: [
          {
            message: 'Not Found',
          },
        ],
      })
      const result = await response.json()

      expect(result.modified).toBe(true)

      payload.collections.posts.config.hooks.afterError = []
    })
  })

  test.describe('Local', () => {
    test('findByID should throw NotFound if the doc was not found, if disableErrors: true then return null', async ({
      payload,
      restClient,
    }) => {
      const post = await createPost({ restClient })
      const id = typeof post.id === 'string' ? randomUUID() : 999
      await expect(payload.findByID({ collection: 'posts', id })).rejects.toBeInstanceOf(NotFound)
      await expect(
        payload.findByID({ collection: 'posts', id, disableErrors: true }),
      ).resolves.toBeNull()
    })
  })

  test.describe('Custom endpoints', () => {
    test('should execute custom root endpoints', async ({ restClient }) => {
      for (const method of methods) {
        const response = await restClient[method.toUpperCase()](`/${method}-test`, {})
        await expect(response.text()).resolves.toBe(`${method} response`)
      }
    })

    test('should execute custom collection endpoints', async ({ restClient }) => {
      for (const method of methods) {
        const response = await restClient[method.toUpperCase()](
          `/${endpointsSlug}/${method}-test`,
          {},
        )
        await expect(response.text()).resolves.toBe(`${method} response`)
      }
    })
  })

  test('should not mount auth endpoints for collection without auth', async ({ restClient }) => {
    const authEndpoints = [
      {
        method: 'post',
        path: '/forgot-password',
      },
      {
        method: 'post',
        path: '/login',
      },
      {
        method: 'post',
        path: '/logout',
      },
      {
        method: 'post',
        path: '/refresh-token',
      },
      {
        method: 'post',
        path: '/first-register',
      },
      {
        method: 'post',
        path: '/reset-password',
      },
      {
        method: 'post',
        path: '/unlock',
      },
    ]

    for (const endpoint of authEndpoints) {
      const result = await restClient[endpoint.method.toUpperCase()](
        `/${endpointsSlug}${endpoint.path}`,
      )

      expect(result.status).toBe(404)
      const json = await result.json()

      expect(json.message.startsWith('Route not found')).toBeTruthy()
    }
  })

  test('should not mount upload endpoints for collection without auth', async ({ restClient }) => {
    const uploadEndpoints = [
      {
        method: 'get',
        path: '/paste-url/some-id',
      },
      {
        method: 'get',
        path: '/file/some-filename.png',
      },
    ]

    for (const endpoint of uploadEndpoints) {
      const result = await restClient[endpoint.method.toUpperCase()](
        `/${endpointsSlug}${endpoint.path}`,
      )

      expect(result.status).toBe(404)

      expect((await result.json()).message.startsWith('Route not found')).toBeTruthy()
    }
  })

  test('should disable bulk edit for the collection with disableBulkEdit: true', async ({
    payload,
    restClient,
  }) => {
    const res = await restClient.PATCH('/disabled-bulk-edit-docs?where[id][equals]=0', {})
    expect(res.status).toBe(403)

    await expect(
      payload.update({
        collection: 'disabled-bulk-edit-docs',
        where: {},
        data: {},
        overrideAccess: false,
      }),
    ).rejects.toBeInstanceOf(APIError)

    await expect(
      payload.update({
        collection: 'disabled-bulk-edit-docs',
        where: {},
        data: {},
      }),
    ).resolves.toBeTruthy()
  })

  test('should disable bulk delete for the collection with disableBulkDelete: true', async ({
    payload,
    restClient,
  }) => {
    const res = await restClient.DELETE('/disabled-bulk-delete-docs?where[id][equals]=0')
    expect(res.status).toBe(403)

    await expect(
      payload.delete({
        collection: 'disabled-bulk-delete-docs',
        where: {},
        overrideAccess: false,
      }),
    ).rejects.toBeInstanceOf(APIError)

    const doc = await payload.create({
      collection: 'disabled-bulk-delete-docs',
      data: { text: 'should be deletable by id' },
    })

    await expect(
      payload.delete({
        collection: 'disabled-bulk-delete-docs',
        id: doc.id,
      }),
    ).resolves.toBeTruthy()

    await expect(
      payload.delete({
        collection: 'disabled-bulk-delete-docs',
        where: {},
      }),
    ).resolves.toBeTruthy()
  })
})

async function createPost(
  { restClient }: { restClient: NextRESTClient },
  overrides?: Partial<Post>,
) {
  const { doc } = await restClient
    .POST(`/${postsSlug}`, {
      body: JSON.stringify({ title: 'title', ...overrides }),
    })
    .then((res) => res.json())
  return doc
}

async function createPosts({ restClient }: { restClient: NextRESTClient }, count: number) {
  for (let i = 0; i < count; i++) {
    await createPost({ restClient })
  }
}

async function clearDocs({ payload }: { payload: Payload }): Promise<void> {
  await payload.delete({
    collection: postsSlug,
    where: { id: { exists: true } },
  })
}
