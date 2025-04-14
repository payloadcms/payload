import type { Payload, PayloadRequest } from 'payload'

import { randomBytes, randomUUID } from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type {
  ChainedRelation,
  CustomIdNumberRelation,
  CustomIdRelation,
  Director,
  Page,
  Post,
  PostsLocalized,
  Relation,
} from './payload-types.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { isMongoose } from '../helpers/isMongoose.js'
import {
  chainedRelSlug,
  customIdNumberSlug,
  customIdSlug,
  defaultAccessRelSlug,
  polymorphicRelationshipsSlug,
  relationSlug,
  slug,
  slugWithLocalizedRel,
  treeSlug,
  usersSlug,
} from './shared.js'

let restClient: NextRESTClient
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

type EasierChained = { id: string; relation: EasierChained }

const mongoIt = process.env.PAYLOAD_DATABASE === 'mongodb' ? it : it.skip

describe('Relationships', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    await restClient.login({ slug: usersSlug })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  beforeEach(async () => {
    await clearDocs()
  })

  describe('Querying', () => {
    describe('Relationships', () => {
      let post: Post
      let relation: Relation
      let filteredRelation: Relation
      let defaultAccessRelation: Relation
      let chained: ChainedRelation
      let chained2: ChainedRelation
      let chained3: ChainedRelation
      let customIdRelation: CustomIdRelation
      let customIdNumberRelation: CustomIdNumberRelation
      let generatedCustomId: string
      let generatedCustomIdNumber: number
      const nameToQuery = 'name'

      beforeEach(async () => {
        relation = await payload.create({
          collection: relationSlug,
          data: {
            name: nameToQuery,
          },
        })

        filteredRelation = await payload.create({
          collection: relationSlug,
          data: {
            name: nameToQuery,
            disableRelation: false,
          },
        })

        defaultAccessRelation = await payload.create({
          collection: defaultAccessRelSlug,
          data: {
            name: 'default access',
          },
        })

        chained3 = await payload.create({
          collection: chainedRelSlug,
          data: {
            name: 'chain3',
          },
        })

        chained2 = await payload.create({
          collection: chainedRelSlug,
          data: {
            name: 'chain2',
            relation: chained3.id,
          },
        })

        chained = await payload.create({
          collection: chainedRelSlug,
          data: {
            name: 'chain1',
            relation: chained2.id,
          },
        })

        chained3 = await payload.update({
          id: chained3.id,
          collection: chainedRelSlug,
          data: {
            name: 'chain3',
            relation: chained.id,
          },
        })

        generatedCustomId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
        customIdRelation = await payload.create({
          collection: customIdSlug,
          data: {
            id: generatedCustomId,
            name: 'custom-id',
          },
        })

        generatedCustomIdNumber = Math.floor(Math.random() * 1_000_000) + 1
        customIdNumberRelation = await payload.create({
          collection: customIdNumberSlug,
          data: {
            id: generatedCustomIdNumber,
            name: 'custom-id-number',
          },
        })

        post = await createPost({
          chainedRelation: chained.id,
          customIdNumberRelation: customIdNumberRelation.id,
          customIdRelation: customIdRelation.id,
          defaultAccessRelation: defaultAccessRelation.id,
          filteredRelation: filteredRelation.id,
          maxDepthRelation: relation.id,
          relationField: relation.id,
        })

        await createPost() // Extra post to allow asserting totalDoc count
      })

      it('should prevent an unauthorized population of strict access', async () => {
        const doc = await restClient
          .GET(`/${slug}/${post.id}`, { auth: false })
          .then((res) => res.json())
        expect(doc.defaultAccessRelation).toEqual(defaultAccessRelation.id)
      })

      it('should populate strict access when authorized', async () => {
        const doc = await restClient.GET(`/${slug}/${post.id}`).then((res) => res.json())
        expect(doc.defaultAccessRelation).toEqual(defaultAccessRelation)
      })

      it('should use filterOptions to limit relationship options', async () => {
        const doc = await restClient.GET(`/${slug}/${post.id}`).then((res) => res.json())

        expect(doc.filteredRelation).toMatchObject({ id: filteredRelation.id })

        await restClient.PATCH(`/${relationSlug}/${filteredRelation.id}`, {
          body: JSON.stringify({
            disableRelation: true,
          }),
        })

        const updatedDoc = await restClient.GET(`/${slug}/${post.id}`).then((res) => res.json())

        // No change to existing relation
        expect(updatedDoc.filteredRelation).toMatchObject({ id: filteredRelation.id })

        // Attempt to update post with a now filtered relation
        const response = await restClient.PATCH(`/${slug}/${post.id}`, {
          body: JSON.stringify({
            filteredRelation: filteredRelation.id,
          }),
        })
        const result = await response.json()

        expect(result.errors?.[0]).toMatchObject({
          name: 'ValidationError',
          data: expect.anything(),
          message: expect.any(String),
        })
        expect(response.status).toEqual(400)
      })

      it('should count totalDocs correctly when using or in where query and relation contains hasMany relationship fields', async () => {
        const user = (
          await payload.find({
            collection: 'users',
          })
        ).docs[0]

        const user2 = await payload.create({
          collection: 'users',
          data: {
            email: '1@test.com',
            password: 'fwefe',
          },
        })
        const user3 = await payload.create({
          collection: 'users',
          data: {
            email: '2@test.com',
            password: 'fwsefe',
          },
        })
        const user4 = await payload.create({
          collection: 'users',
          data: {
            email: '3@test.com',
            password: 'fwddsefe',
          },
        })
        await payload.create({
          collection: 'movieReviews',
          data: {
            likes: [user3.id, user2.id, user.id, user4.id],
            movieReviewer: user.id,
            visibility: 'public',
          },
        })
        await payload.create({
          collection: 'movieReviews',
          data: {
            movieReviewer: user2.id,
            visibility: 'public',
          },
        })

        const query = await payload.find({
          collection: 'movieReviews',
          depth: 1,
          where: {
            or: [
              {
                visibility: {
                  equals: 'public',
                },
              },
              {
                movieReviewer: {
                  equals: user.id,
                },
              },
            ],
          },
        })
        expect(query.totalDocs).toEqual(2)
      })

      // https://github.com/payloadcms/payload/issues/4240
      it('should allow querying by relationship id field', async () => {
        /**
         * This test shows something which breaks on postgres but not on mongodb.
         */
        const someDirector = await payload.create({
          collection: 'directors',
          data: {
            name: 'Quentin Tarantino',
          },
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction',
          },
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction',
          },
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Harry Potter',
          },
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Lord of the Rings is boring',
            director: someDirector.id,
          },
        })

        // This causes the following error:
        // "Your "id" field references a column "directors"."id", but the table "directors" is not part of the query! Did you forget to join it?"
        // This only happens on postgres, not on mongodb
        const query = await payload.find({
          collection: 'movies',
          depth: 5,
          limit: 1,
          where: {
            or: [
              {
                name: {
                  equals: 'Pulp Fiction',
                },
              },
              {
                'director.id': {
                  equals: someDirector.id,
                },
              },
            ],
          },
        })

        expect(query.totalDocs).toEqual(3)
        expect(query.docs).toHaveLength(1) // Due to limit: 1
      })

      it('should allow querying by relationships with an object where as AND', async () => {
        const director = await payload.create({
          collection: 'directors',
          data: { name: 'Director1', localized: 'Director1_Localized' },
        })

        const movie = await payload.create({
          collection: 'movies',
          data: { director: director.id },
          depth: 0,
        })

        const { docs: trueRes } = await payload.find({
          collection: 'movies',
          depth: 0,
          where: {
            'director.name': { equals: 'Director1' },
            'director.localized': { equals: 'Director1_Localized' },
          },
        })

        expect(trueRes).toStrictEqual([movie])

        const { docs: falseRes } = await payload.find({
          collection: 'movies',
          depth: 0,
          where: {
            'director.name': { equals: 'Director1_Fake' },
            'director.localized': { equals: 'Director1_Localized' },
          },
        })

        expect(falseRes).toStrictEqual([])
      })

      it('should allow querying within blocks', async () => {
        const rel = await payload.create({
          collection: relationSlug,
          data: {
            name: 'test',
            disableRelation: false,
          },
        })

        const doc = await payload.create({
          collection: slug,
          data: {
            blocks: [
              {
                blockType: 'block',
                relationField: rel.id,
              },
            ],
          },
        })

        const { docs } = await payload.find({
          collection: slug,
          where: { 'blocks.relationField': { equals: rel.id } },
        })

        expect(docs[0].id).toBe(doc.id)
      })

      it('should allow querying within tabs-blocks-tabs', async () => {
        const movie = await payload.create({ collection: 'movies', data: { name: 'Pulp Fiction' } })

        const { id } = await payload.create({
          collection: 'deep-nested',
          data: {
            content: {
              blocks: [
                {
                  blockType: 'testBlock',
                  meta: {
                    movie: movie.id,
                  },
                },
              ],
            },
          },
        })

        const result = await payload.find({
          collection: 'deep-nested',
          where: {
            'content.blocks.meta.movie': {
              equals: movie.id,
            },
          },
        })

        expect(result.totalDocs).toBe(1)
        expect(result.docs[0].id).toBe(id)
      })

      describe('hasMany relationships', () => {
        it('should retrieve totalDocs correctly with hasMany,', async () => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {},
          })
          const movie2 = await payload.create({
            collection: 'movies',
            data: {},
          })

          const movie3 = await payload.create({
            collection: 'movies',
            data: { name: 'some-name' },
          })

          const movie4 = await payload.create({
            collection: 'movies',
            data: { name: 'some-name' },
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id, movie1.id, movie3.id, movie4.id],
            },
          })

          const res = await payload.find({
            collection: 'directors',
            limit: 10,
            where: {
              or: [
                {
                  movies: {
                    equals: movie2.id,
                  },
                },
                {
                  movies: {
                    equals: movie1.id,
                  },
                },
                {
                  movies: {
                    equals: movie1.id,
                  },
                },
              ],
            },
          })

          expect(res.totalDocs).toBe(1)

          const res_2 = await payload.find({
            collection: 'directors',
            limit: 10,
            where: {
              or: [
                {
                  'movies.name': {
                    equals: 'some-name',
                  },
                },
              ],
            },
          })

          expect(res_2.totalDocs).toBe(1)

          const dir_1 = await payload.create({ collection: 'directors', data: { name: 'dir' } })
          const dir_2 = await payload.create({ collection: 'directors', data: { name: 'dir' } })

          const dir_3 = await payload.create({
            collection: 'directors',
            data: { directors: [dir_1.id, dir_2.id] },
          })

          const result = await payload.find({
            collection: 'directors',
            where: {
              'directors.name': { equals: 'dir' },
            },
          })

          expect(result.totalDocs).toBe(1)
          expect(result.docs).toHaveLength(1)
          expect(result.docs[0]?.id).toBe(dir_3.id)
        })

        it('should query using "contains" by hasMany relationship field', async () => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {},
          })
          const movie2 = await payload.create({
            collection: 'movies',
            data: {},
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id, movie1.id],
            },
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id],
            },
          })

          const query1 = await payload.find({
            collection: 'directors',
            depth: 0,
            where: {
              movies: {
                contains: movie1.id,
              },
            },
          })
          const query2 = await payload.find({
            collection: 'directors',
            depth: 0,
            where: {
              movies: {
                contains: movie2.id,
              },
            },
          })

          expect(query1.totalDocs).toStrictEqual(1)
          expect(query2.totalDocs).toStrictEqual(2)
        })

        // all operator is not supported in Postgres yet for any fields
        mongoIt('should query using "all" by hasMany relationship field', async () => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {},
          })
          const movie2 = await payload.create({
            collection: 'movies',
            data: {},
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id, movie1.id],
            },
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id],
            },
          })

          const query1 = await payload.find({
            collection: 'directors',
            depth: 0,
            where: {
              movies: {
                all: [movie1.id],
              },
            },
          })

          // eslint-disable-next-line jest/no-standalone-expect
          expect(query1.totalDocs).toStrictEqual(1)
        })

        it('should query using "in" by hasMany relationship field', async () => {
          const tree1 = await payload.create({
            collection: treeSlug,
            data: {
              text: 'Tree 1',
            },
          })

          const tree2 = await payload.create({
            collection: treeSlug,
            data: {
              parent: tree1.id,
              text: 'Tree 2',
            },
          })

          const tree3 = await payload.create({
            collection: treeSlug,
            data: {
              parent: tree2.id,
              text: 'Tree 3',
            },
          })

          const tree4 = await payload.create({
            collection: treeSlug,
            data: {
              parent: tree3.id,
              text: 'Tree 4',
            },
          })

          const validParents = [tree2.id, tree3.id]

          const query = await payload.find({
            collection: treeSlug,
            depth: 0,
            sort: 'createdAt',
            where: {
              parent: {
                in: validParents,
              },
            },
          })
          // should only return tree3 and tree4

          expect(query.totalDocs).toEqual(2)
          expect(query.docs[0].text).toEqual('Tree 3')
          expect(query.docs[1].text).toEqual('Tree 4')
        })
      })

      describe('sorting by relationships', () => {
        it('should sort by a property of a relationship', async () => {
          await payload.delete({ collection: 'directors', where: {} })
          await payload.delete({ collection: 'movies', where: {} })

          const director_1 = await payload.create({
            collection: 'directors',
            data: { name: 'Dan', localized: 'Dan' },
          })

          await payload.update({
            collection: 'directors',
            id: director_1.id,
            locale: 'de',
            data: { localized: 'Mr. Dan' },
          })

          const director_2 = await payload.create({
            collection: 'directors',
            data: { name: 'Mr. Dan', localized: 'Mr. Dan' },
          })

          await payload.update({
            collection: 'directors',
            id: director_2.id,
            locale: 'de',
            data: { localized: 'Dan' },
          })

          const movie_1 = await payload.create({
            collection: 'movies',
            depth: 0,
            data: { director: director_1.id, name: 'Some Movie 1' },
          })

          const movie_2 = await payload.create({
            collection: 'movies',
            depth: 0,
            data: { director: director_2.id, name: 'Some Movie 2' },
          })

          const res_1 = await payload.find({
            collection: 'movies',
            sort: '-director.name',
            depth: 0,
          })
          const res_2 = await payload.find({
            collection: 'movies',
            sort: 'director.name',
            depth: 0,
          })

          expect(res_1.docs).toStrictEqual([movie_2, movie_1])
          expect(res_2.docs).toStrictEqual([movie_1, movie_2])

          const draft_res_1 = await payload.find({
            collection: 'movies',
            sort: '-director.name',
            depth: 0,
            draft: true,
          })
          const draft_res_2 = await payload.find({
            collection: 'movies',
            sort: 'director.name',
            depth: 0,
            draft: true,
          })

          expect(draft_res_1.docs).toStrictEqual([movie_2, movie_1])
          expect(draft_res_2.docs).toStrictEqual([movie_1, movie_2])

          const localized_res_1 = await payload.find({
            collection: 'movies',
            sort: 'director.localized',
            depth: 0,
            locale: 'de',
          })
          const localized_res_2 = await payload.find({
            collection: 'movies',
            sort: 'director.localized',
            depth: 0,
          })

          expect(localized_res_1.docs).toStrictEqual([movie_2, movie_1])
          expect(localized_res_2.docs).toStrictEqual([movie_1, movie_2])
        })

        it('should sort by a property of a hasMany relationship', async () => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {
              name: 'Pulp Fiction',
            },
          })

          const movie2 = await payload.create({
            collection: 'movies',
            data: {
              name: 'Inception',
            },
          })

          await payload.delete({ collection: 'directors', where: {} })

          const director1 = await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie1.id],
            },
          })
          const director2 = await payload.create({
            collection: 'directors',
            data: {
              name: 'Christopher Nolan',
              movies: [movie2.id],
            },
          })

          const result = await payload.find({
            collection: 'directors',
            depth: 0,
            sort: '-movies.name',
          })

          expect(result.docs[0].id).toStrictEqual(director1.id)
        })
      })

      describe('Custom ID', () => {
        it('should query a custom id relation', async () => {
          const { customIdRelation } = await restClient
            .GET(`/${slug}/${post.id}`)
            .then((res) => res.json())
          expect(customIdRelation).toMatchObject({ id: generatedCustomId })
        })

        it('should query a custom id number relation', async () => {
          const { customIdNumberRelation } = await restClient
            .GET(`/${slug}/${post.id}`)
            .then((res) => res.json())
          expect(customIdNumberRelation).toMatchObject({ id: generatedCustomIdNumber })
        })
      })

      describe('depth', () => {
        it('should populate to depth', async () => {
          const doc = await restClient
            .GET(`/${slug}/${post.id}`, {
              query: {
                depth: 2,
              },
            })
            .then((res) => res.json())
          const depth0 = doc?.chainedRelation as EasierChained
          expect(depth0.id).toEqual(chained.id)
          expect(depth0.relation.id).toEqual(chained2.id)
          expect(depth0.relation.relation as unknown as string).toEqual(chained3.id)
          expect(depth0.relation.relation).toEqual(chained3.id)
        })

        it('should only populate ID if depth 0', async () => {
          const doc = await restClient
            .GET(`/${slug}/${post.id}`, {
              query: {
                depth: 0,
              },
            })
            .then((res) => res.json())
          expect(doc?.chainedRelation).toEqual(chained.id)
        })

        it('should respect maxDepth at field level', async () => {
          const doc = await restClient
            .GET(`/${slug}/${post.id}`, {
              query: {
                depth: 1,
              },
            })
            .then((res) => res.json())
          expect(doc?.maxDepthRelation).toEqual(relation.id)
          expect(doc?.maxDepthRelation).not.toHaveProperty('name')
          // should not affect other fields
          expect(doc?.relationField).toMatchObject({ id: relation.id, name: relation.name })
        })
      })

      describe('with localization', () => {
        let relation1: Relation
        let relation2: Relation
        let localizedPost1: PostsLocalized
        let localizedPost2: PostsLocalized

        beforeAll(async () => {
          relation1 = await payload.create<Relation>({
            collection: relationSlug,
            data: {
              name: 'english',
            },
          })

          relation2 = await payload.create<Relation>({
            collection: relationSlug,
            data: {
              name: 'german',
            },
          })

          localizedPost1 = await payload.create<'postsLocalized'>({
            collection: slugWithLocalizedRel,
            data: {
              title: 'english',
              relationField: relation1.id,
            },
            locale: 'en',
          })

          await payload.update({
            id: localizedPost1.id,
            collection: slugWithLocalizedRel,
            locale: 'de',
            data: {
              relationField: relation2.id,
            },
          })

          localizedPost2 = await payload.create({
            collection: slugWithLocalizedRel,
            data: {
              title: 'german',
              relationField: relation2.id,
            },
            locale: 'de',
          })
        })
        it('should find two docs for german locale', async () => {
          const { docs } = await payload.find<PostsLocalized>({
            collection: slugWithLocalizedRel,
            locale: 'de',
            where: {
              relationField: {
                equals: relation2.id,
              },
            },
          })

          const mappedIds = docs.map((doc) => doc?.id)
          expect(mappedIds).toContain(localizedPost1.id)
          expect(mappedIds).toContain(localizedPost2.id)
        })

        it("shouldn't find a relationship query outside of the specified locale", async () => {
          const { docs } = await payload.find<PostsLocalized>({
            collection: slugWithLocalizedRel,
            locale: 'en',
            where: {
              relationField: {
                equals: relation2.id,
              },
            },
          })

          expect(docs.map((doc) => doc?.id)).not.toContain(localizedPost2.id)
        })
      })

      it('should allow update removing a relationship', async () => {
        const response = await restClient.PATCH(`/${slug}/${post.id}`, {
          body: JSON.stringify({
            customIdRelation: null,
            relationField: null,
          }),
        })
        const doc = await response.json()

        expect(response.status).toEqual(200)
        expect(doc.relationField).toBeFalsy()
      })
    })

    describe('Nested Querying', () => {
      let thirdLevelID: string
      let secondLevelID: string
      let firstLevelID: string

      beforeAll(async () => {
        const thirdLevelDoc = await payload.create({
          collection: 'chained',
          data: {
            name: 'third',
          },
        })

        thirdLevelID = thirdLevelDoc.id

        const secondLevelDoc = await payload.create({
          collection: 'chained',
          data: {
            name: 'second',
            relation: thirdLevelID,
          },
        })

        secondLevelID = secondLevelDoc.id

        const firstLevelDoc = await payload.create({
          collection: 'chained',
          data: {
            name: 'first',
            relation: secondLevelID,
          },
        })

        firstLevelID = firstLevelDoc.id
      })

      it('should allow querying one level deep', async () => {
        const query1 = await payload.find({
          collection: 'chained',
          where: {
            'relation.name': {
              equals: 'second',
            },
          },
        })

        expect(query1.docs).toHaveLength(1)
        expect(query1.docs[0].id).toStrictEqual(firstLevelID)

        const query2 = await payload.find({
          collection: 'chained',
          where: {
            'relation.name': {
              equals: 'third',
            },
          },
        })

        expect(query2.docs).toHaveLength(1)
        expect(query2.docs[0].id).toStrictEqual(secondLevelID)
      })

      it('should allow querying two levels deep', async () => {
        const query = await payload.find({
          collection: 'chained',
          where: {
            'relation.relation.name': {
              equals: 'third',
            },
          },
        })

        expect(query.docs).toHaveLength(1)
        expect(query.docs[0].id).toStrictEqual(firstLevelID)
      })

      it('should allow querying on id two levels deep', async () => {
        const query = await payload.find({
          collection: 'chained',
          where: {
            'relation.relation.id': {
              equals: thirdLevelID,
            },
          },
        })

        expect(query.docs).toHaveLength(1)
        expect(query.docs[0].id).toStrictEqual(firstLevelID)

        const queryREST = await restClient
          .GET(`/chained`, {
            query: {
              where: {
                'relation.relation.id': {
                  equals: thirdLevelID,
                },
              },
            },
          })
          .then((res) => res.json())

        expect(queryREST.docs).toHaveLength(1)
        expect(queryREST.docs[0].id).toStrictEqual(firstLevelID)
      })

      it('should allow querying within array nesting', async () => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            menu: [
              {
                label: 'hello',
              },
            ],
          },
        })

        const rel = await payload.create({ collection: 'rels-to-pages', data: { page: page.id } })

        const resEquals = await payload.find({
          collection: 'rels-to-pages',
          where: { 'page.menu.label': { equals: 'hello' } },
        })

        expect(resEquals.totalDocs).toBe(1)
        expect(resEquals.docs[0].id).toBe(rel.id)

        const resIn = await payload.find({
          collection: 'rels-to-pages',
          where: { 'page.menu.label': { in: ['hello'] } },
        })

        expect(resIn.totalDocs).toBe(1)
        expect(resIn.docs[0].id).toBe(rel.id)
      })
    })

    it('should allow querying within block nesting', async () => {
      const director = await payload.create({
        collection: 'directors',
        data: { name: 'Test Director' },
      })

      const director_false = await payload.create({
        collection: 'directors',
        data: { name: 'False Director' },
      })

      const doc = await payload.create({
        collection: 'blocks',
        data: { blocks: [{ blockType: 'some', director: director.id }] },
      })

      await payload.create({
        collection: 'blocks',
        data: { blocks: [{ blockType: 'some', director: director_false.id }] },
      })

      const result = await payload.find({
        collection: 'blocks',
        where: { 'blocks.director.name': { equals: 'Test Director' } },
      })

      expect(result.totalDocs).toBe(1)
      expect(result.docs[0]!.id).toBe(doc.id)
    })

    describe('Nested Querying Separate Collections', () => {
      let director: Director

      beforeAll(async () => {
        // 1. create a director
        director = await payload.create({
          collection: 'directors',
          data: {
            name: 'Quentin Tarantino',
          },
        })

        // 2. create a movie
        const movie = await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction',
            director: director.id,
          },
        })

        // 3. create a screening
        await payload.create({
          collection: 'screenings',
          data: {
            name: 'Pulp Fiction Screening',
            movie: movie.id,
          },
        })
      })

      it('should allow querying two levels deep', async () => {
        const query = await payload.find({
          collection: 'screenings',
          where: {
            'movie.director.name': {
              equals: director.name,
            },
          },
        })

        expect(query.docs).toHaveLength(1)
      })
    })
    describe('Multiple Docs', () => {
      const movieList = [
        'Pulp Fiction',
        'Reservoir Dogs',
        'Once Upon a Time in Hollywood',
        'Shrek',
        'Shrek 2',
        'Shrek 3',
        'Scream',
        'The Matrix',
        'The Matrix Reloaded',
        'The Matrix Revolutions',
        'The Matrix Resurrections',
        'The Haunting',
        'The Haunting of Hill House',
        'The Haunting of Bly Manor',
        'Insidious',
      ]

      beforeAll(async () => {
        await Promise.all(
          movieList.map(async (movie) => {
            return await payload.create({
              collection: 'movies',
              data: {
                name: movie,
              },
            })
          }),
        )
      })

      it('should return more than 10 docs in relationship', async () => {
        const allMovies = await payload.find({
          collection: 'movies',
          limit: 20,
        })

        const movieIDs = allMovies.docs.map((doc) => doc.id)

        await payload.create({
          collection: 'directors',
          data: {
            name: 'Quentin Tarantino',
            movies: movieIDs,
          },
        })

        const director = await payload.find({
          collection: 'directors',
          where: {
            name: {
              equals: 'Quentin Tarantino',
            },
          },
        })

        expect(director.docs[0].movies.length).toBeGreaterThan(10)
      })

      it('should allow clearing hasMany relationships', async () => {
        const fiveMovies = await payload.find({
          collection: 'movies',
          depth: 0,
          limit: 5,
        })

        const movieIDs = fiveMovies.docs.map((doc) => doc.id)

        const stanley = await payload.create({
          collection: 'directors',
          data: {
            name: 'Stanley Kubrick',
            movies: movieIDs,
          },
        })

        expect(stanley.movies).toHaveLength(5)

        const stanleyNeverMadeMovies = await payload.update({
          id: stanley.id,
          collection: 'directors',
          data: {
            movies: null,
          },
        })

        expect(stanleyNeverMadeMovies.movies).toHaveLength(0)
      })
    })

    describe('Hierarchy', () => {
      beforeAll(async () => {
        await payload.delete({
          collection: treeSlug,
          where: { id: { exists: true } },
        })

        const root = await payload.create({
          collection: 'tree',
          data: {
            text: 'root',
          },
        })

        await payload.create({
          collection: 'tree',
          data: {
            parent: root.id,
            text: 'sub',
          },
        })
      })

      it('finds 1 root item with equals', async () => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { equals: null },
          },
        })
        expect(count).toBe(1)
        expect(item.text).toBe('root')
      })

      it('finds 1 root item with exists', async () => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { exists: false },
          },
        })
        expect(count).toBe(1)
        expect(item.text).toBe('root')
      })

      it('finds 1 sub item with equals', async () => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { not_equals: null },
          },
        })
        expect(count).toBe(1)
        expect(item.text).toBe('sub')
      })

      it('finds 1 sub item with exists', async () => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { exists: true },
          },
        })
        expect(count).toBe(1)
        expect(item.text).toBe('sub')
      })
    })
  })

  describe('Writing', () => {
    describe('With transactions', () => {
      it('should be able to create filtered relations within a transaction', async () => {
        const req = {} as PayloadRequest
        req.transactionID = await payload.db.beginTransaction?.()
        const related = await payload.create({
          collection: relationSlug,
          data: {
            name: 'parent',
          },
          req,
        })
        const withRelation = await payload.create({
          collection: slug,
          data: {
            filteredRelation: related.id,
          },
          req,
        })

        if (req.transactionID) {
          await payload.db.commitTransaction?.(req.transactionID)
        }

        expect(withRelation.filteredRelation.id).toEqual(related.id)
      })
    })

    describe('With passing an object', () => {
      it('should create with passing an object', async () => {
        const movie = await payload.create({ collection: 'movies', data: {} })
        const result = await payload.create({
          collection: 'object-writes',
          data: {
            many: [movie],
            manyPoly: [{ relationTo: 'movies', value: movie }],
            one: movie,
            onePoly: {
              relationTo: 'movies',
              value: movie,
            },
          },
        })

        expect(result.many[0]).toStrictEqual(movie)
        expect(result.one).toStrictEqual(movie)
        expect(result.manyPoly[0]).toStrictEqual({ relationTo: 'movies', value: movie })
        expect(result.onePoly).toStrictEqual({ relationTo: 'movies', value: movie })
      })

      it('should update with passing an object', async () => {
        const movie = await payload.create({ collection: 'movies', data: {} })
        const { id } = await payload.create({ collection: 'object-writes', data: {} })
        const result = await payload.update({
          collection: 'object-writes',
          id,
          data: {
            many: [movie],
            manyPoly: [{ relationTo: 'movies', value: movie }],
            one: movie,
            onePoly: {
              relationTo: 'movies',
              value: movie,
            },
          },
        })

        expect(result.many[0]).toStrictEqual(movie)
        expect(result.one).toStrictEqual(movie)
        expect(result.manyPoly[0]).toStrictEqual({ relationTo: 'movies', value: movie })
        expect(result.onePoly).toStrictEqual({ relationTo: 'movies', value: movie })
      })
    })
  })

  describe('Polymorphic Relationships', () => {
    it('should allow REST querying on polymorphic relationships', async () => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
      })
      await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphic: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
      })

      const queryOne = await restClient
        .GET(`/${polymorphicRelationshipsSlug}`, {
          query: {
            where: {
              and: [
                {
                  'polymorphic.value': {
                    equals: movie.id,
                  },
                },
                {
                  'polymorphic.relationTo': {
                    equals: 'movies',
                  },
                },
              ],
            },
          },
        })
        .then((res) => res.json())

      const queryTwo = await restClient
        .GET(`/${polymorphicRelationshipsSlug}`, {
          query: {
            where: {
              and: [
                {
                  'polymorphic.relationTo': {
                    equals: 'movies',
                  },
                },
                {
                  'polymorphic.value': {
                    equals: movie.id,
                  },
                },
              ],
            },
          },
        })
        .then((res) => res.json())

      expect(queryOne.docs).toHaveLength(1)
      expect(queryTwo.docs).toHaveLength(1)
    })

    // all operator is not supported in Postgres yet for any fields
    mongoIt('should allow REST all querying on polymorphic relationships', async () => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
      })
      await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphic: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
      })

      const queryOne = await restClient
        .GET(`/${polymorphicRelationshipsSlug}`, {
          query: {
            where: {
              'polymorphic.value': {
                all: [movie.id],
              },
            },
          },
        })
        .then((res) => res.json())

      // eslint-disable-next-line jest/no-standalone-expect
      expect(queryOne.docs).toHaveLength(1)
    })

    it('should allow querying on polymorphic relationships with an object syntax', async () => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
      })
      await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphic: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
      })

      const res = await payload.find({
        collection: 'polymorphic-relationships',
        where: {
          polymorphic: {
            equals: {
              relationTo: 'movies',
              value: movie.id,
            },
          },
        },
      })

      expect(res.docs).toHaveLength(1)

      const res_2 = await payload.find({
        collection: 'polymorphic-relationships',
        where: {
          polymorphic: {
            equals: {
              relationTo: 'movies',
              value: payload.db.idType === 'uuid' ? randomUUID() : 99,
            },
          },
        },
      })
      expect(res_2.docs).toHaveLength(0)
    })

    it('should allow querying on hasMany polymorphic relationships with an object syntax', async () => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
      })

      const { id } = await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphicMany: [
            {
              relationTo: 'movies',
              value: movie.id,
            },
          ],
        },
      })

      const res = await payload.find({
        collection: 'polymorphic-relationships',
        where: {
          polymorphicMany: {
            equals: {
              relationTo: 'movies',
              value: movie.id,
            },
          },
        },
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(id)
    })

    it('should allow querying on localized polymorphic relationships with an object syntax', async () => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
      })

      const { id } = await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphicLocalized: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
      })

      const res = await payload.find({
        collection: 'polymorphic-relationships',
        where: {
          polymorphicLocalized: {
            equals: {
              relationTo: 'movies',
              value: movie.id,
            },
          },
        },
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(id)
    })

    it('should allow querying on hasMany localized polymorphic relationships with an object syntax', async () => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
      })

      const { id } = await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphicManyLocalized: [
            {
              relationTo: 'movies',
              value: movie.id,
            },
          ],
        },
      })

      const res = await payload.find({
        collection: 'polymorphic-relationships',
        where: {
          polymorphicManyLocalized: {
            equals: {
              relationTo: 'movies',
              value: movie.id,
            },
          },
        },
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(id)
    })

    it('should update document that polymorphicaly joined to another collection', async () => {
      const item = await payload.create({ collection: 'items', data: { status: 'pending' } })

      await payload.create({
        collection: 'relations',
        data: { item: { relationTo: 'items', value: item } },
      })

      const updated = await payload.update({
        collection: 'items',
        data: { status: 'completed' },
        id: item.id,
      })

      expect(updated.status).toBe('completed')
    })

    it('should validate the format of text id relationships', async () => {
      await expect(async () =>
        createPost({
          // @ts-expect-error Sending bad data to test error handling
          customIdRelation: 1234,
        }),
      ).rejects.toThrow('The following field is invalid: Custom Id Relation')
    })

    it('should validate the format of number id relationships', async () => {
      await expect(async () =>
        createPost({
          // @ts-expect-error Sending bad data to test error handling
          customIdNumberRelation: 'bad-input',
        }),
      ).rejects.toThrow('The following field is invalid: Custom Id Number Relation')
    })

    it('should query a polymorphic relationship field with mixed custom ids and default', async () => {
      const customIDNumber = await payload.create({
        collection: 'custom-id-number',
        data: { id: 999 },
      })

      const customIDText = await payload.create({
        collection: 'custom-id',
        data: { id: 'custom-id' },
      })

      const page = await payload.create({
        collection: 'pages',
        data: {},
      })

      const relToCustomIdText = await payload.create({
        collection: 'rels-to-pages-and-custom-text-ids',
        data: {
          rel: {
            relationTo: 'custom-id',
            value: customIDText.id,
          },
        },
      })

      const relToCustomIdNumber = await payload.create({
        collection: 'rels-to-pages-and-custom-text-ids',
        data: {
          rel: {
            relationTo: 'custom-id-number',
            value: customIDNumber.id,
          },
        },
      })

      const relToPage = await payload.create({
        collection: 'rels-to-pages-and-custom-text-ids',
        data: {
          rel: {
            relationTo: 'pages',
            value: page.id,
          },
        },
      })

      const pageResult = await payload.find({
        collection: 'rels-to-pages-and-custom-text-ids',
        where: {
          and: [
            {
              'rel.value': {
                equals: page.id,
              },
            },
            {
              'rel.relationTo': {
                equals: 'pages',
              },
            },
          ],
        },
      })

      expect(pageResult.totalDocs).toBe(1)
      expect(pageResult.docs[0].id).toBe(relToPage.id)

      const customIDResult = await payload.find({
        collection: 'rels-to-pages-and-custom-text-ids',
        where: {
          and: [
            {
              'rel.value': {
                equals: customIDText.id,
              },
            },
            {
              'rel.relationTo': {
                equals: 'custom-id',
              },
            },
          ],
        },
      })

      expect(customIDResult.totalDocs).toBe(1)
      expect(customIDResult.docs[0].id).toBe(relToCustomIdText.id)

      const customIDNumberResult = await payload.find({
        collection: 'rels-to-pages-and-custom-text-ids',
        where: {
          and: [
            {
              'rel.value': {
                equals: customIDNumber.id,
              },
            },
            {
              'rel.relationTo': {
                equals: 'custom-id-number',
              },
            },
          ],
        },
      })

      expect(customIDNumberResult.totalDocs).toBe(1)
      expect(customIDNumberResult.docs[0].id).toBe(relToCustomIdNumber.id)

      const inResult_1 = await payload.find({
        collection: 'rels-to-pages-and-custom-text-ids',
        where: {
          'rel.value': {
            in: [page.id, customIDNumber.id],
          },
        },
      })

      expect(inResult_1.totalDocs).toBe(2)
      expect(inResult_1.docs.some((each) => each.id === relToPage.id)).toBeTruthy()
      expect(inResult_1.docs.some((each) => each.id === relToCustomIdNumber.id)).toBeTruthy()

      const inResult_2 = await payload.find({
        collection: 'rels-to-pages-and-custom-text-ids',
        where: {
          'rel.value': {
            in: [customIDNumber.id, customIDText.id],
          },
        },
      })

      expect(inResult_2.totalDocs).toBe(2)
      expect(inResult_2.docs.some((each) => each.id === relToCustomIdText.id)).toBeTruthy()
      expect(inResult_2.docs.some((each) => each.id === relToCustomIdNumber.id)).toBeTruthy()

      const inResult_3 = await payload.find({
        collection: 'rels-to-pages-and-custom-text-ids',
        where: {
          'rel.value': {
            in: [customIDNumber.id, customIDText.id, page.id],
          },
        },
      })

      expect(inResult_3.totalDocs).toBe(3)
      expect(inResult_3.docs.some((each) => each.id === relToCustomIdText.id)).toBeTruthy()
      expect(inResult_3.docs.some((each) => each.id === relToCustomIdNumber.id)).toBeTruthy()
      expect(inResult_3.docs.some((each) => each.id === relToPage.id)).toBeTruthy()
    })
  })
})

async function createPost(overrides?: Partial<Post>) {
  return payload.create({ collection: slug, data: { title: 'title', ...overrides } })
}

async function clearDocs(): Promise<void> {
  await payload.delete({
    collection: slug,
    where: { id: { exists: true } },
  })
}
