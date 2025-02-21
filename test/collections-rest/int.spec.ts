import type { Payload, SanitizedCollectionConfig } from 'payload'

import { randomBytes, randomUUID } from 'crypto'
import path from 'path'
import { APIError, NotFound } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Relation } from './config.js'
import type { Post } from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let restClient: NextRESTClient
let payload: Payload

describe('collections-rest', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  beforeEach(async () => {
    await clearDocs()
  })

  describe('CRUD', () => {
    it('should create', async () => {
      const data = {
        title: 'title',
      }
      const doc = await createPost(data)

      expect(doc).toMatchObject(data)
    })

    it('should find', async () => {
      const post1 = await createPost()
      const post2 = await createPost()
      const response = await restClient.GET(`/${postsSlug}`)
      const result = await response.json()

      expect(response.status).toEqual(200)
      expect(result.totalDocs).toEqual(2)
      const expectedDocs = [post1, post2]
      expect(result.docs).toHaveLength(expectedDocs.length)
      expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
    })

    it('should count', async () => {
      await createPost()
      await createPost()
      const response = await restClient.GET(`/${postsSlug}/count`)
      const result = await response.json()

      expect(response.status).toEqual(200)
      expect(result).toEqual({ totalDocs: 2 })
    })

    it('should find where id', async () => {
      const post1 = await createPost()
      await createPost()
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

    it('should find with pagination false', async () => {
      const post1 = await createPost()
      const post2 = await createPost()

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

    it('should update existing', async () => {
      const { id, description } = await createPost({ description: 'desc' })
      const updatedTitle = 'updated-title'

      const response = await restClient.PATCH(`/${postsSlug}/${id}`, {
        body: JSON.stringify({ title: updatedTitle }),
      })
      const { doc } = await response.json()

      expect(response.status).toEqual(200)
      expect(doc.title).toEqual(updatedTitle)
      expect(doc.description).toEqual(description) // Check was not modified
    })

    describe('Bulk operations', () => {
      it('should bulk update', async () => {
        for (let i = 0; i < 11; i++) {
          await createPost({ description: `desc ${i}` })
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

      it('should bulk update with limit', async () => {
        const ids = []
        for (let i = 0; i < 3; i++) {
          const post = await createPost({ description: `to-update` })
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

      it('should not bulk update with a bad query', async () => {
        for (let i = 0; i < 2; i++) {
          await createPost({ description: `desc ${i}` })
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

      it('should not bulk update with a bad relationship query', async () => {
        for (let i = 0; i < 2; i++) {
          await createPost({ description: `desc ${i}` })
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

      it('should not bulk update with a read restricted field query', async () => {
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

      it('should return formatted errors for bulk updates', async () => {
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

      it('should bulk delete', async () => {
        const count = 11
        for (let i = 0; i < count; i++) {
          await createPost({ description: `desc ${i}` })
        }

        const response = await restClient.DELETE(`/${postsSlug}`, {
          query: { where: { title: { equals: 'title' } } },
        })
        const { docs } = await response.json()

        expect(response.status).toEqual(200)
        expect(docs[0].title).toEqual('title') // Check was not modified
        expect(docs).toHaveLength(count)
      })

      it('should return formatted errors for bulk deletes', async () => {
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

    describe('Custom ID', () => {
      describe('string', () => {
        it('should create', async () => {
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

        it('should find', async () => {
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

        it('should query - equals', async () => {
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

        it('should query - like', async () => {
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

        it('should update', async () => {
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

      describe('number', () => {
        it('should create', async () => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await restClient
            .POST(`/${customIdNumberSlug}`, {
              body: JSON.stringify({ id: customId, name: 'custom-id-number-name' }),
            })
            .then((res) => res.json())
          expect(doc.id).toEqual(customId)
        })

        it('should find', async () => {
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

        it('should update', async () => {
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

        it('should allow querying by in', async () => {
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

    it('should delete', async () => {
      const { id } = await createPost()

      const response = await restClient.DELETE(`/${postsSlug}/${id}`)
      const { doc } = await response.json()

      expect(response.status).toEqual(200)
      expect(doc.id).toEqual(id)
    })

    it('should include metadata', async () => {
      await createPosts(11)

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

  describe('Querying', () => {
    it.todo('should allow querying by a field within a group')
    describe('Relationships', () => {
      let post: Post
      let relation: Relation
      let relation2: Relation
      const nameToQuery = 'name'
      const nameToQuery2 = 'name2'

      beforeEach(async () => {
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

        post = await createPost({
          relationField: relation.id,
        })

        await createPost() // Extra post to allow asserting totalDoc count
      })

      describe('regular relationship', () => {
        it('query by property value', async () => {
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

        it('should count query by property value', async () => {
          const response = await restClient.GET(`/${postsSlug}/count`, {
            query: {
              where: { relationField: { equals: relation.id } },
            },
          })
          const result = await response.json()

          expect(response.status).toEqual(200)
          expect(result).toEqual({ totalDocs: 1 })
        })

        it('query by id', async () => {
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

        it('should query LIKE by ID', async () => {
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

      it('should query nested relationship - hasMany', async () => {
        const post1 = await createPost({
          relationHasManyField: [relation.id, relation2.id],
        })

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

      describe('relationTo multi', () => {
        it('nested by id', async () => {
          const post1 = await createPost({
            relationMultiRelationTo: { relationTo: relationSlug, value: relation.id },
          })
          await createPost()

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

      it('should query relationships by not_equals', async () => {
        const ogPost = await createPost({
          relationMultiRelationTo: { relationTo: relationSlug, value: relation.id },
        })
        await createPost()

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

      describe('relationTo multi hasMany', () => {
        it('nested by id', async () => {
          const post1 = await createPost({
            relationMultiRelationToHasMany: [
              { relationTo: relationSlug, value: relation.id },
              { relationTo: relationSlug, value: relation2.id },
            ],
          })
          await createPost()

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

        it.todo('nested by property value')
      })
    })

    describe('Edge cases', () => {
      it('should query a localized field without localization configured', async () => {
        const test = 'test'
        await createPost({ fakeLocalization: test })

        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            where: { fakeLocalization: { equals: test } },
          },
        })
        const result = await response.json()

        expect(response.status).toEqual(200)
        expect(result.docs).toHaveLength(1)
      })

      it('should not error when attempting to sort on a field that does not exist', async () => {
        const response = await restClient.GET(`/${postsSlug}`, {
          query: {
            sort: 'fake',
          },
        })

        expect(response.status).toStrictEqual(200)
      })
    })

    describe('Operators', () => {
      it('equals', async () => {
        const valueToQuery = 'valueToQuery'
        const post1 = await createPost({ title: valueToQuery })
        await createPost()
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

      it('not_equals', async () => {
        const post1 = await createPost({ title: 'not-equals' })
        const post2 = await createPost()
        const post3 = await createPost({ title: undefined })
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

      it('in', async () => {
        const post1 = await createPost({ title: 'my-title' })
        await createPost()
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

      it('not_in', async () => {
        const post1 = await createPost({ title: 'not-me' })
        const post2 = await createPost()
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

      it('not_in (relationships)', async () => {
        const relationship = await payload.create({
          collection: relationSlug,
          data: {},
        })

        await createPost({ relationField: relationship.id, title: 'not-me' })
        // await createPost({ relationMultiRelationTo: relationship.id, title: 'not-me' })
        const post2 = await createPost({ title: 'me' })
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

      it('in (relationships)', async () => {
        const relationship = await payload.create({
          collection: relationSlug,
          data: {},
        })

        const post1 = await createPost({ relationField: relationship.id, title: 'me' })
        // await createPost({ relationMultiRelationTo: relationship.id, title: 'not-me' })
        await createPost({ title: 'not-me' })
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

      it('like', async () => {
        const post1 = await createPost({ title: 'prefix-value' })

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

      describe('like - special characters', () => {
        const specialCharacters = '~!@#$%^&*()_+-+[]{}|;:"<>,.?/})'

        it.each(specialCharacters.split(''))(
          'like - special characters - %s',
          async (character) => {
            const post1 = await createPost({
              title: specialCharacters,
            })

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

      it('like - cyrillic characters', async () => {
        const post1 = await createPost({ title: 'Тест' })

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

      it('like - cyrillic characters in multiple words', async () => {
        const post1 = await createPost({ title: 'привет, это тест полезной нагрузки' })

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

      it('like - partial word match', async () => {
        const post = await createPost({ title: 'separate words should partially match' })
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

      it('like - id should not crash', async () => {
        const post = await createPost({ title: 'post' })

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

      it('exists - true', async () => {
        const postWithDesc = await createPost({ description: 'exists' })
        await createPost({ description: undefined })
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

      it('exists - false', async () => {
        const postWithoutDesc = await createPost({ description: undefined })
        await createPost({ description: 'exists' })
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

      describe('numbers', () => {
        let post1: Post
        let post2: Post
        beforeEach(async () => {
          post1 = await createPost({ number: 1 })
          post2 = await createPost({ number: 2 })
        })

        it('greater_than', async () => {
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

        it('greater_than_equal', async () => {
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

        it('less_than', async () => {
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

        it('less_than_equal', async () => {
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

      describe('near', () => {
        const point = [10, 20]
        const [lat, lng] = point
        it('should return a document near a point', async () => {
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

        it('should omit maxDistance and return a document from minDistance', async () => {
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

        it('should omit maxDistance and not return a document because exceeds minDistance', async () => {
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

        it('should not return a point far away', async () => {
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

        it('should sort find results by nearest distance', async () => {
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
                sort: 'point',
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

      describe('within', () => {
        type Point = [number, number]
        const polygon: Point[] = [
          [9.0, 19.0], // bottom-left
          [9.0, 21.0], // top-left
          [11.0, 21.0], // top-right
          [11.0, 19.0], // bottom-right
          [9.0, 19.0], // back to starting point to close the polygon
        ]
        it('should return a document with the point inside the polygon', async () => {
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

        it('should not return a document with the point outside a smaller polygon', async () => {
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

      describe('intersects', () => {
        type Point = [number, number]
        const polygon: Point[] = [
          [9.0, 19.0], // bottom-left
          [9.0, 21.0], // top-left
          [11.0, 21.0], // top-right
          [11.0, 19.0], // bottom-right
          [9.0, 19.0], // back to starting point to close the polygon
        ]

        it('should return a document with the point intersecting the polygon', async () => {
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

        it('should not return a document with the point not intersecting a smaller polygon', async () => {
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

      it('or', async () => {
        const post1 = await createPost({ title: 'post1' })
        const post2 = await createPost({ title: 'post2' })
        await createPost()

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

      it('or - 1 result', async () => {
        const post1 = await createPost({ title: 'post1' })
        await createPost()

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

      it('and', async () => {
        const description = 'description'
        const post1 = await createPost({ description, title: 'post1' })
        await createPost({ description, title: 'post2' }) // Diff title, same desc
        await createPost()

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

      describe('pagination', () => {
        let relatedDoc

        beforeEach(async () => {
          relatedDoc = await payload.create({
            collection: relationSlug,
            data: {
              name: 'test',
            },
          })
          for (let i = 0; i < 10; i++) {
            await createPost({
              number: i,
              relationField: relatedDoc.id,
              title: 'paginate-test',
            })
          }
        })

        it('should paginate with where query', async () => {
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

        it('should paginate with where query on relationships', async () => {
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

        describe('limit', () => {
          beforeEach(async () => {
            for (let i = 0; i < 50; i++) {
              await createPost({ number: i, title: 'limit-test' })
            }
          })

          it('should query a limited set of docs', async () => {
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

          it('should query all docs when limit=0', async () => {
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

      it('can query deeply nested fields within rows, tabs, collapsibles', async () => {
        const withDeeplyNestedField = await createPost({
          D1: { D2: { D3: { D4: 'nested message' } } },
        })

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

  describe('Error Handler', () => {
    it('should return the minimum allowed information about internal errors', async () => {
      const response = await restClient.GET('/internal-error-here')
      const result = await response.json()
      expect(response.status).toBe(500)
      expect(Array.isArray(result.errors)).toEqual(true)
      expect(result.errors[0].message).toStrictEqual('Something went wrong.')
    })

    it('should execute afterError hook on root level and modify result/status', async () => {
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

    it('should execute afterError hook on collection level and modify result', async () => {
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

      const post = await createPost({})

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

  describe('Local', () => {
    it('findByID should throw NotFound if the doc was not found, if disableErrors: true then return null', async () => {
      const post = await createPost()
      const id = typeof post.id === 'string' ? randomUUID() : 999
      await expect(payload.findByID({ collection: 'posts', id })).rejects.toBeInstanceOf(NotFound)
      await expect(
        payload.findByID({ collection: 'posts', id, disableErrors: true }),
      ).resolves.toBeNull()
    })
  })

  describe('Custom endpoints', () => {
    it('should execute custom root endpoints', async () => {
      for (const method of methods) {
        const response = await restClient[method.toUpperCase()](`/${method}-test`, {})
        await expect(response.text()).resolves.toBe(`${method} response`)
      }
    })

    it('should execute custom collection endpoints', async () => {
      for (const method of methods) {
        const response = await restClient[method.toUpperCase()](
          `/${endpointsSlug}/${method}-test`,
          {},
        )
        await expect(response.text()).resolves.toBe(`${method} response`)
      }
    })
  })

  it('should not mount auth endpoints for collection without auth', async () => {
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

  it('should not mount upload endpoints for collection without auth', async () => {
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
})

async function createPost(overrides?: Partial<Post>) {
  const { doc } = await restClient
    .POST(`/${postsSlug}`, {
      body: JSON.stringify({ title: 'title', ...overrides }),
    })
    .then((res) => res.json())
  return doc
}

async function createPosts(count: number) {
  for (let i = 0; i < count; i++) {
    await createPost()
  }
}

async function clearDocs(): Promise<void> {
  await payload.delete({
    collection: postsSlug,
    where: { id: { exists: true } },
  })
}
