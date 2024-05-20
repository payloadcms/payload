import { randomBytes } from 'crypto'

import type { Relation } from './config'
import type { ErrorOnHook, Post } from './payload-types'

import payload from '../../packages/payload/src'
import { mapAsync } from '../../packages/payload/src/utilities/mapAsync'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import config, {
  customIdNumberSlug,
  customIdSlug,
  errorOnHookSlug,
  pointSlug,
  relationSlug,
  slug,
} from './config'

let client: RESTClient

describe('collections-rest', () => {
  beforeAll(async () => {
    const { serverURL } = await initPayloadTest({ __dirname, init: { local: false } })
    client = new RESTClient(await config, { defaultSlug: slug, serverURL })

    // Wait for indexes to be created,
    // as we need them to query by point
    if (payload.db.name === 'mongoose') {
      await new Promise((resolve, reject) => {
        payload.db.collections[pointSlug].ensureIndexes(function (err) {
          if (err) reject(err)
          resolve(true)
        })
      })
    }
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
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
      const { result, status } = await client.find<Post>()

      expect(status).toEqual(200)
      expect(result.totalDocs).toEqual(2)
      const expectedDocs = [post1, post2]
      expect(result.docs).toHaveLength(expectedDocs.length)
      expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
    })

    it('should count', async () => {
      await createPost()
      await createPost()
      const { result, status } = await client.count()

      expect(status).toEqual(200)
      expect(result).toEqual({ totalDocs: 2 })
    })

    it('should find where id', async () => {
      const post1 = await createPost()
      await createPost()
      const { result, status } = await client.find<Post>({
        query: {
          id: { equals: post1.id },
        },
      })

      expect(status).toEqual(200)
      expect(result.totalDocs).toEqual(1)
      expect(result.docs[0].id).toEqual(post1.id)
    })

    it('should find with pagination false', async () => {
      const post1 = await createPost()
      const post2 = await createPost()

      const { docs, totalDocs } = await payload.find({
        collection: slug,
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

      const { doc: updated, status } = await client.update<Post>({
        id,
        data: { title: updatedTitle },
      })

      expect(status).toEqual(200)
      expect(updated.title).toEqual(updatedTitle)
      expect(updated.description).toEqual(description) // Check was not modified
    })

    describe('Bulk operations', () => {
      it('should bulk update', async () => {
        await mapAsync([...Array(11)], async (_, i) => {
          await createPost({ description: `desc ${i}` })
        })

        const description = 'updated'
        const { docs, errors, status } = await client.updateMany({
          data: { description },
          where: { title: { equals: 'title' } },
        })

        expect(errors).toHaveLength(0)
        expect(status).toEqual(200)
        expect(docs[0].title).toEqual('title') // Check was not modified
        expect(docs[0].description).toEqual(description)
        expect(docs.pop().description).toEqual(description)
      })

      it('should not bulk update with a bad query', async () => {
        await mapAsync([...Array(2)], async (_, i) => {
          await createPost({ description: `desc ${i}` })
        })

        const description = 'updated'

        const {
          docs: noDocs,
          errors,
          status,
        } = await client.updateMany<Post>({
          data: { description },
          where: { missing: { equals: 'title' } },
        })

        expect(status).toEqual(400)
        expect(noDocs).toBeUndefined()
        expect(errors).toHaveLength(1)

        const { docs } = await payload.find({
          collection: slug,
        })

        expect(docs[0].description).not.toEqual(description)
        expect(docs.pop().description).not.toEqual(description)
      })

      it('should not bulk update with a bad relationship query', async () => {
        await mapAsync([...Array(2)], async (_, i) => {
          await createPost({ description: `desc ${i}` })
        })

        const description = 'updated'
        const {
          docs: relationFieldDocs,
          errors: relationFieldErrors,
          status: relationFieldStatus,
        } = await client.updateMany<Post>({
          data: { description },
          where: { 'relationField.missing': { equals: 'title' } },
        })

        const { status: relationMultiRelationToStatus } = await client.updateMany<Post>({
          data: { description },
          where: { 'relationMultiRelationTo.missing': { equals: 'title' } },
        })

        const { docs } = await payload.find({
          collection: slug,
        })

        expect(relationFieldStatus).toEqual(400)
        expect(relationMultiRelationToStatus).toEqual(400)
        expect(docs[0].description).not.toEqual(description)
        expect(docs.pop().description).not.toEqual(description)
      })

      it('should not bulk update with a read restricted field query', async () => {
        const { id } = await payload.create({
          collection: slug,
          data: {
            restrictedField: 'restricted',
          },
        })

        const description = 'description'
        const result = await client.updateMany({
          data: { description },
          where: { restrictedField: { equals: 'restricted' } },
        })

        const doc = await payload.findByID({
          id,
          collection: slug,
        })

        expect(result.status).toEqual(400)
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

        const result = await client.updateMany<ErrorOnHook>({
          data: { text: update },
          slug: errorOnHookSlug,
          where: { text: { equals: text } },
        })

        expect(result.status).toEqual(400)
        expect(result.docs).toHaveLength(1)
        expect(result.docs[0].id).toEqual(successDoc.id)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].message).toBeDefined()
        expect(result.errors[0].id).toEqual(errorDoc.id)
        expect(result.docs[0].text).toEqual(update)
      })

      it('should bulk delete', async () => {
        const count = 11
        await mapAsync([...Array(count)], async (_, i) => {
          await createPost({ description: `desc ${i}` })
        })

        const { docs, status } = await client.deleteMany<Post>({
          where: { title: { equals: 'title' } },
        })

        expect(status).toEqual(200)
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

        const result = await client.deleteMany({
          slug: errorOnHookSlug,
          where: { text: { equals: 'test' } },
        })

        expect(result.status).toEqual(400)
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
          const { doc } = await client.create({
            data: { id: customId, name: customIdName },
            slug: customIdSlug,
          })
          expect(doc.id).toEqual(customId)
          expect(doc.name).toEqual(customIdName)
        })

        it('should find', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await client.create({
            data: { id: customId, name: 'custom-id-name' },
            slug: customIdSlug,
          })
          const { doc: foundDoc } = await client.findByID({ id: customId, slug: customIdSlug })

          expect(foundDoc.id).toEqual(doc.id)
        })

        it('should query - equals', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await client.create({
            data: { id: customId, name: 'custom-id-name' },
            slug: customIdSlug,
          })
          const { result } = await client.find({
            query: { id: { equals: customId } },
            slug: customIdSlug,
          })

          expect(result.docs.map(({ id }) => id)).toContain(doc.id)
        })

        it('should query - like', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await client.create({
            data: { id: customId, name: 'custom-id-name' },
            slug: customIdSlug,
          })
          const { result } = await client.find({
            query: { id: { like: 'custom' } },
            slug: customIdSlug,
          })

          expect(result.docs.map(({ id }) => id)).toContain(doc.id)
        })

        it('should update', async () => {
          const customId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
          const { doc } = await client.create({
            data: { id: customId, data: { name: 'custom-id-name' } },
            slug: customIdSlug,
          })
          const { doc: updatedDoc } = await client.update({
            id: doc.id,
            data: { name: 'updated' },
            slug: customIdSlug,
          })
          expect(updatedDoc.name).toEqual('updated')
        })
      })

      describe('number', () => {
        it('should create', async () => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await client.create({
            data: { id: customId, name: 'custom-id-number-name' },
            slug: customIdNumberSlug,
          })
          expect(doc.id).toEqual(customId)
        })

        it('should find', async () => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await client.create({
            data: { id: customId, name: 'custom-id-number-name' },
            slug: customIdNumberSlug,
          })
          const { doc: foundDoc } = await client.findByID({
            id: customId,
            slug: customIdNumberSlug,
          })
          expect(foundDoc.id).toEqual(doc.id)
        })

        it('should update', async () => {
          const customId = Math.floor(Math.random() * 1_000_000) + 1
          const { doc } = await client.create({
            data: { id: customId, name: 'custom-id-number-name' },
            slug: customIdNumberSlug,
          })
          const { doc: updatedDoc } = await client.update({
            id: doc.id,
            data: { name: 'updated' },
            slug: customIdNumberSlug,
          })
          expect(updatedDoc.name).toEqual('updated')
        })

        it('should allow querying by in', async () => {
          const id = 98234698237
          await client.create({
            data: { id, name: 'query using in operator' },
            slug: customIdNumberSlug,
          })

          const {
            result: { docs },
          } = await client.find({
            query: {
              id: {
                in: `${id}, ${2349856723948764}`,
              },
            },
            slug: customIdNumberSlug,
          })

          expect(docs).toHaveLength(1)
        })
      })
    })

    it('should delete', async () => {
      const { id } = await createPost()

      const { doc, status } = await client.delete<Post>(id)

      expect(status).toEqual(200)
      expect(doc.id).toEqual(id)
    })

    it('should include metadata', async () => {
      await createPosts(11)

      const { result } = await client.find<Post>()

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
        ;({ doc: relation } = await client.create<Relation>({
          data: {
            name: nameToQuery,
          },
          slug: relationSlug,
        }))
        ;({ doc: relation2 } = await client.create<Relation>({
          data: {
            name: nameToQuery2,
          },
          slug: relationSlug,
        }))

        post = await createPost({
          relationField: relation.id,
        })

        await createPost() // Extra post to allow asserting totalDoc count
      })

      describe('regular relationship', () => {
        it('query by property value', async () => {
          const { result, status } = await client.find<Post>({
            query: {
              'relationField.name': {
                equals: relation.name,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.docs).toEqual([post])
          expect(result.totalDocs).toEqual(1)
        })

        it('query by id', async () => {
          const { result, status } = await client.find<Post>({
            query: {
              relationField: {
                equals: relation.id,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.docs).toEqual([post])
          expect(result.totalDocs).toEqual(1)
        })

        it('should query LIKE by ID', async () => {
          const post = await payload.create({
            collection: slug,
            data: {
              title: 'find me buddy',
            },
          })

          const { result, status } = await client.find<Post>({
            query: {
              id: {
                like: post.id,
              },
            },
          })

          expect(status).toStrictEqual(200)
          expect(result.totalDocs).toStrictEqual(1)
        })
      })

      it('should query nested relationship - hasMany', async () => {
        const post1 = await createPost({
          relationHasManyField: [relation.id, relation2.id],
        })

        const { result, status } = await client.find<Post>({
          query: {
            'relationHasManyField.name': {
              equals: relation.name,
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)

        // Query second relationship
        const { result: result2, status: status2 } = await client.find<Post>({
          query: {
            'relationHasManyField.name': {
              equals: relation2.name,
            },
          },
        })

        expect(status2).toEqual(200)
        expect(result2.docs).toEqual([post1])
        expect(result2.totalDocs).toEqual(1)
      })

      describe('relationTo multi', () => {
        it('nested by id', async () => {
          const post1 = await createPost({
            relationMultiRelationTo: { relationTo: relationSlug, value: relation.id },
          })
          await createPost()

          const { result, status } = await client.find<Post>({
            query: {
              'relationMultiRelationTo.value': {
                equals: relation.id,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.docs).toEqual([post1])
          expect(result.totalDocs).toEqual(1)
        })
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

          const { result, status } = await client.find<Post>({
            query: {
              'relationMultiRelationToHasMany.value': {
                equals: relation.id,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.docs).toEqual([post1])
          expect(result.totalDocs).toEqual(1)

          // Query second relation
          const { result: result2, status: status2 } = await client.find<Post>({
            query: {
              'relationMultiRelationToHasMany.value': {
                equals: relation.id,
              },
            },
          })

          expect(status2).toEqual(200)
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

        const { result, status } = await client.find({
          query: {
            fakeLocalization: {
              equals: test,
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.docs).toHaveLength(1)
      })

      it('should not error when attempting to sort on a field that does not exist', async () => {
        const { status } = await client.find({
          sort: 'fake',
        })

        expect(status).toStrictEqual(200)
      })
    })

    describe('Operators', () => {
      it('equals', async () => {
        const valueToQuery = 'valueToQuery'
        const post1 = await createPost({ title: valueToQuery })
        await createPost()
        const { result, status } = await client.find<Post>({
          query: {
            title: {
              equals: valueToQuery,
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([post1])
      })

      it('not_equals', async () => {
        const post1 = await createPost({ title: 'not-equals' })
        const post2 = await createPost()
        const post3 = await createPost({ title: undefined })
        const { result, status } = await client.find<Post>({
          query: {
            title: {
              not_equals: post1.title,
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.totalDocs).toEqual(2)
        expect(result.docs).toEqual([post3, post2])
      })

      it('in', async () => {
        const post1 = await createPost({ title: 'my-title' })
        await createPost()
        const { result, status } = await client.find<Post>({
          query: {
            title: {
              in: [post1.title],
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      it('not_in', async () => {
        const post1 = await createPost({ title: 'not-me' })
        const post2 = await createPost()
        const { result, status } = await client.find<Post>({
          query: {
            title: {
              not_in: [post1.title],
            },
          },
        })

        expect(status).toEqual(200)
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
        const { result, status } = await client.find<Post>({
          query: {
            relationField: {
              not_in: [relationship.id],
            },
          },
        })

        // do not want to error for empty arrays
        const { status: emptyNotInStatus } = await client.find<Post>({
          query: {
            relationField: {
              not_in: [],
            },
          },
        })

        expect(emptyNotInStatus).toEqual(200)

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post2])
        expect(result.totalDocs).toEqual(1)
      })

      it('in (relationships)', async () => {
        const relationship = await payload.create({
          collection: relationSlug,
          data: {},
        })

        const post1 = await createPost({ relationField: relationship.id, title: 'me' })
        // await createPost({ relationMultiRelationTo: relationship.id, title: 'not-me' })
        await createPost({ title: 'not-me' })
        const { result, status } = await client.find<Post>({
          query: {
            relationField: {
              in: [relationship.id],
            },
          },
        })

        // do not want to error for empty arrays
        const { status: emptyNotInStatus } = await client.find<Post>({
          query: {
            relationField: {
              in: [],
            },
          },
        })

        expect(emptyNotInStatus).toEqual(200)

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      it('like', async () => {
        const post1 = await createPost({ title: 'prefix-value' })

        const { result, status } = await client.find<Post>({
          query: {
            title: {
              like: post1.title?.substring(0, 6),
            },
          },
        })

        expect(status).toEqual(200)
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

            const query = {
              query: {
                title: {
                  like: character,
                },
              },
            }

            const { result, status } = await client.find<Post>(query)

            expect(status).toEqual(200)
            expect(result.docs).toEqual([post1])
            expect(result.totalDocs).toEqual(1)
          },
        )
      })

      it('like - cyrillic characters', async () => {
        const post1 = await createPost({ title: 'Тест' })

        const { result, status } = await client.find<Post>({
          query: {
            title: {
              like: 'Тест',
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      it('like - cyrillic characters in multiple words', async () => {
        const post1 = await createPost({ title: 'привет, это тест полезной нагрузки' })

        const { result, status } = await client.find<Post>({
          query: {
            title: {
              like: 'привет нагрузки',
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post1])
        expect(result.totalDocs).toEqual(1)
      })

      it('like - partial word match', async () => {
        const post = await createPost({ title: 'separate words should partially match' })

        const { result, status } = await client.find<Post>({
          query: {
            title: {
              like: 'words partial',
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.docs).toEqual([post])
        expect(result.totalDocs).toEqual(1)
      })

      it('exists - true', async () => {
        const postWithDesc = await createPost({ description: 'exists' })
        await createPost({ description: undefined })
        const { result, status } = await client.find<Post>({
          query: {
            description: {
              exists: true,
            },
          },
        })

        expect(status).toEqual(200)
        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([postWithDesc])
      })

      it('exists - false', async () => {
        const postWithoutDesc = await createPost({ description: undefined })
        await createPost({ description: 'exists' })
        const { result, status } = await client.find<Post>({
          query: {
            description: {
              exists: false,
            },
          },
        })

        expect(status).toEqual(200)
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
          const { result, status } = await client.find<Post>({
            query: {
              number: {
                greater_than: 1,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.totalDocs).toEqual(1)
          expect(result.docs).toEqual([post2])
        })

        it('greater_than_equal', async () => {
          const { result, status } = await client.find<Post>({
            query: {
              number: {
                greater_than_equal: 1,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.totalDocs).toEqual(2)
          const expectedDocs = [post1, post2]
          expect(result.docs).toHaveLength(expectedDocs.length)
          expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
        })

        it('less_than', async () => {
          const { result, status } = await client.find<Post>({
            query: {
              number: {
                less_than: 2,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.totalDocs).toEqual(1)
          expect(result.docs).toEqual([post1])
        })

        it('less_than_equal', async () => {
          const { result, status } = await client.find<Post>({
            query: {
              number: {
                less_than_equal: 2,
              },
            },
          })

          expect(status).toEqual(200)
          expect(result.totalDocs).toEqual(2)
          const expectedDocs = [post1, post2]
          expect(result.docs).toHaveLength(expectedDocs.length)
          expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
        })
      })

      if (['mongoose'].includes(process.env.PAYLOAD_DATABASE)) {
        describe('near', () => {
          const point = [10, 20]
          const [lat, lng] = point
          it('should return a document near a point', async () => {
            const near = `${lat + 0.01}, ${lng + 0.01}, 10000`
            const { result, status } = await client.find({
              query: {
                point: {
                  near,
                },
              },
              slug: pointSlug,
            })

            expect(status).toEqual(200)
            expect(result.docs).toHaveLength(1)
          })

          it('should not return a point far away', async () => {
            const near = `${lng + 1}, ${lat - 1}, 5000`
            const { result, status } = await client.find({
              query: {
                point: {
                  near,
                },
              },
              slug: pointSlug,
            })

            expect(status).toEqual(200)
            expect(result.docs).toHaveLength(0)
          })

          it('should sort find results by nearest distance', async () => {
            // creating twice as many records as we are querying to get a random sample
            await mapAsync([...Array(10)], async () => {
              // setTimeout used to randomize the creation timestamp
              setTimeout(async () => {
                await payload.create({
                  collection: pointSlug,
                  data: {
                    // only randomize longitude to make distance comparison easy
                    point: [Math.random(), 0],
                  },
                })
              }, Math.random())
            })

            const { result } = await client.find({
              limit: 5,
              query: {
                // querying large enough range to include all docs
                point: { near: '0, 0, 100000, 0' },
              },
              slug: pointSlug,
            })
            const { docs } = result
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
            // There should be 1 total points document populated by default with the point [10, 20]
            const { result, status } = await client.find({
              query: {
                point: {
                  within: {
                    coordinates: [polygon],
                    type: 'Polygon',
                  },
                },
              },
              slug: pointSlug,
            })

            expect(status).toEqual(200)
            expect(result.docs).toHaveLength(1)
          })

          it('should not return a document with the point outside a smaller polygon', async () => {
            const { result, status } = await client.find({
              query: {
                point: {
                  within: {
                    coordinates: [polygon.map((vertex) => vertex.map((coord) => coord * 0.1))], // Reduce polygon to 10% of its size
                    type: 'Polygon',
                  },
                },
              },
              slug: pointSlug,
            })

            expect(status).toEqual(200)
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
            // There should be 1 total points document populated by default with the point [10, 20]
            const { result, status } = await client.find({
              query: {
                point: {
                  intersects: {
                    coordinates: [polygon],
                    type: 'Polygon',
                  },
                },
              },
              slug: pointSlug,
            })

            expect(status).toEqual(200)
            expect(result.docs).toHaveLength(1)
          })

          it('should not return a document with the point not intersecting a smaller polygon', async () => {
            const { result, status } = await client.find({
              query: {
                point: {
                  intersects: {
                    coordinates: [polygon.map((vertex) => vertex.map((coord) => coord * 0.1))], // Reduce polygon to 10% of its size
                    type: 'Polygon',
                  },
                },
              },
              slug: pointSlug,
            })

            expect(status).toEqual(200)
            expect(result.docs).toHaveLength(0)
          })
        })
      }

      it('or', async () => {
        const post1 = await createPost({ title: 'post1' })
        const post2 = await createPost({ title: 'post2' })
        await createPost()

        const { result, status } = await client.find<Post>({
          query: {
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
        })

        expect(status).toEqual(200)
        const expectedDocs = [post1, post2]
        expect(result.totalDocs).toEqual(expectedDocs.length)
        expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
      })

      it('or - 1 result', async () => {
        const post1 = await createPost({ title: 'post1' })
        await createPost()

        const { result, status } = await client.find<Post>({
          query: {
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
        })

        expect(status).toEqual(200)
        const expectedDocs = [post1]
        expect(result.totalDocs).toEqual(expectedDocs.length)
        expect(result.docs).toEqual(expect.arrayContaining(expectedDocs))
      })

      it('and', async () => {
        const description = 'description'
        const post1 = await createPost({ description, title: 'post1' })
        await createPost({ description, title: 'post2' }) // Diff title, same desc
        await createPost()

        const { result, status } = await client.find<Post>({
          query: {
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
        })

        expect(status).toEqual(200)
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
          await mapAsync([...Array(10)], async (_, i) => {
            await createPost({
              number: i,
              relationField: relatedDoc.id as string,
              title: 'paginate-test',
            })
          })
        })

        it('should paginate with where query', async () => {
          const { result: page1 } = await client.find({
            limit: 4,
            query: {
              title: {
                equals: 'paginate-test',
              },
            },
          })

          const { result: page2 } = await client.find({
            limit: 4,
            page: 2,
            query: {
              title: {
                equals: 'paginate-test',
              },
            },
          })

          const { result: page3 } = await client.find({
            limit: 4,
            page: 3,
            query: {
              title: {
                equals: 'paginate-test',
              },
            },
          })

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
          const { result: page1 } = await client.find({
            limit: 4,
            query: {
              relationField: {
                equals: relatedDoc.id,
              },
            },
          })

          const { result: page2 } = await client.find({
            limit: 4,
            page: 2,
            query: {
              relationField: {
                equals: relatedDoc.id,
              },
            },
          })

          const { result: page3 } = await client.find({
            limit: 4,
            page: 3,
            query: {
              relationField: {
                equals: relatedDoc.id,
              },
            },
          })

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
            await mapAsync([...Array(50)], async (_, i) =>
              createPost({ number: i, title: 'limit-test' }),
            )
          })

          it('should query a limited set of docs', async () => {
            const { result, status } = await client.find<Post>({
              limit: 15,
              query: {
                title: {
                  equals: 'limit-test',
                },
              },
            })

            expect(status).toStrictEqual(200)
            expect(result.docs).toHaveLength(15)
          })

          it('should query all docs when limit=0', async () => {
            const { result, status } = await client.find<Post>({
              limit: 0,
              query: {
                title: {
                  equals: 'limit-test',
                },
              },
            })

            expect(status).toStrictEqual(200)
            expect(result.docs).toHaveLength(50)
            expect(result.totalPages).toStrictEqual(1)
          })
        })
      })

      it('can query deeply nested fields within rows, tabs, collapsibles', async () => {
        const withDeeplyNestedField = await createPost({
          D1: { D2: { D3: { D4: 'nested message' } } },
        })

        const { result } = await client.find<Post>({
          query: {
            'D1.D2.D3.D4': {
              equals: 'nested message',
            },
          },
        })

        expect(result.totalDocs).toEqual(1)
        expect(result.docs).toEqual([withDeeplyNestedField])
      })
    })
  })

  describe('Error Handler', () => {
    it('should return the minimum allowed information about internal errors', async () => {
      const { data, status } = await client.endpoint('/api/internal-error-here')
      expect(status).toBe(500)
      expect(Array.isArray(data.errors)).toEqual(true)
      expect(data.errors[0].message).toStrictEqual('Something went wrong.')
    })
  })
})

async function createPost(overrides?: Partial<Post>) {
  const { doc } = await client.create<Post>({ data: { title: 'title', ...overrides } })
  return doc
}

async function createPosts(count: number) {
  await mapAsync([...Array(count)], async () => {
    await createPost()
  })
}

async function clearDocs(): Promise<void> {
  await payload.delete({
    collection: slug,
    where: { id: { exists: true } },
  })
}
