import { randomBytes } from 'crypto'

import type { Payload } from '../../packages/payload/src/index.js'
import type {
  ChainedRelation,
  CustomIdNumberRelation,
  CustomIdRelation,
  Director,
  Post,
  Relation,
} from './payload-types.js'

import { getPayload } from '../../packages/payload/src/index.js'
import { NextRESTClient } from '../helpers/NextRESTClient.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'
import {
  chainedRelSlug,
  customIdNumberSlug,
  customIdSlug,
  defaultAccessRelSlug,
  polymorphicRelationshipsSlug,
  relationSlug,
  slug,
  treeSlug,
  usersSlug,
} from './shared.js'

let restClient: NextRESTClient
let payload: Payload

type EasierChained = { id: string; relation: EasierChained }

describe('Relationships', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)
    await restClient.login({ slug: usersSlug })
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy(payload)
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
        relation = await payload.create<Relation>({
          collection: relationSlug,
          data: {
            name: nameToQuery,
          },
        })

        filteredRelation = await payload.create<Relation>({
          collection: relationSlug,
          data: {
            name: nameToQuery,
            disableRelation: false,
          },
        })

        defaultAccessRelation = await payload.create<Relation>({
          collection: defaultAccessRelSlug,
          data: {
            name: 'default access',
          },
        })

        chained3 = await payload.create<ChainedRelation>({
          collection: chainedRelSlug,
          data: {
            name: 'chain3',
          },
        })

        chained2 = await payload.create<ChainedRelation>({
          collection: chainedRelSlug,
          data: {
            name: 'chain2',
            relation: chained3.id,
          },
        })

        chained = await payload.create<ChainedRelation>({
          collection: chainedRelSlug,
          data: {
            name: 'chain1',
            relation: chained2.id,
          },
        })

        chained3 = await payload.update<ChainedRelation>({
          id: chained3.id,
          collection: chainedRelSlug,
          data: {
            name: 'chain3',
            relation: chained.id,
          },
        })

        generatedCustomId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
        customIdRelation = await payload.create<CustomIdRelation>({
          collection: customIdSlug,
          data: {
            id: generatedCustomId,
            name: 'custom-id',
          },
        })

        generatedCustomIdNumber = Math.floor(Math.random() * 1_000_000) + 1
        customIdNumberRelation = await payload.create<CustomIdNumberRelation>({
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
        await Promise.all([
          payload.create({
            collection: 'movieReviews',
            data: {
              likes: [user3.id, user2.id, user.id, user4.id],
              movieReviewer: user.id,
              visibility: 'public',
            },
          }),
          payload.create({
            collection: 'movieReviews',
            data: {
              movieReviewer: user2.id,
              visibility: 'public',
            },
          }),
        ])

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

        it('should validate the format of text id relationships', async () => {
          await expect(async () =>
            createPost({
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error Sending bad data to test error handling
              customIdRelation: 1234,
            }),
          ).rejects.toThrow('The following field is invalid: customIdRelation')
        })

        it('should validate the format of number id relationships', async () => {
          await expect(async () =>
            createPost({
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error Sending bad data to test error handling
              customIdNumberRelation: 'bad-input',
            }),
          ).rejects.toThrow('The following field is invalid: customIdNumberRelation')
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
