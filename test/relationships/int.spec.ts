import type { Payload, PayloadRequest } from 'payload'

import { randomBytes, randomUUID } from 'crypto'
import { Types } from 'mongoose'
import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import type {
  ChainedRelation,
  CustomIdNumberRelation,
  CustomIdRelation,
  Director,
  Post,
  PostsLocalized,
  Relation,
} from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
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

type EasierChained = { id: string; relation: EasierChained }

test.suite({ config: './config.ts' })('Relationships', () => {
  test.beforeEach(async ({ restClient }) => {
    await restClient.login({ slug: usersSlug, credentials: devUser })
  })

  test.describe('Querying', () => {
    test.describe('Relationships', () => {
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

      test.beforeEach(async ({ payload }) => {
        relation = await payload.create({
          collection: relationSlug,
          data: {
            name: nameToQuery,
          },
          overrideAccess: true,
        })

        filteredRelation = await payload.create({
          collection: relationSlug,
          data: {
            name: nameToQuery,
            disableRelation: false,
          },
          overrideAccess: true,
        })

        defaultAccessRelation = await payload.create({
          collection: defaultAccessRelSlug,
          data: {
            name: 'default access',
          },
          overrideAccess: true,
        })

        chained3 = await payload.create({
          collection: chainedRelSlug,
          data: {
            name: 'chain3',
          },
          overrideAccess: true,
        })

        chained2 = await payload.create({
          collection: chainedRelSlug,
          data: {
            name: 'chain2',
            relation: chained3.id,
          },
          overrideAccess: true,
        })

        chained = await payload.create({
          collection: chainedRelSlug,
          data: {
            name: 'chain1',
            relation: chained2.id,
          },
          overrideAccess: true,
        })

        chained3 = await payload.update({
          id: chained3.id,
          collection: chainedRelSlug,
          data: {
            name: 'chain3',
            relation: chained.id,
          },
          overrideAccess: true,
        })

        generatedCustomId = `custom-${randomBytes(32).toString('hex').slice(0, 12)}`
        customIdRelation = await payload.create({
          collection: customIdSlug,
          data: {
            id: generatedCustomId,
            name: 'custom-id',
          },
          overrideAccess: true,
        })

        generatedCustomIdNumber = Math.floor(Math.random() * 1_000_000) + 1
        customIdNumberRelation = await payload.create({
          collection: customIdNumberSlug,
          data: {
            id: generatedCustomIdNumber,
            name: 'custom-id-number',
          },
          overrideAccess: true,
        })

        post = await createPost(
          { payload },
          {
            chainedRelation: chained.id,
            customIdNumberRelation: customIdNumberRelation.id,
            customIdRelation: customIdRelation.id,
            defaultAccessRelation: defaultAccessRelation.id,
            filteredRelation: filteredRelation.id,
            maxDepthRelation: relation.id,
            relationField: relation.id,
          },
        )

        await createPost({ payload }) // Extra post to allow asserting totalDoc count
      })

      test('should prevent an unauthorized population of strict access', async ({ restClient }) => {
        const doc = await restClient
          .GET(`/${slug}/${post.id}`, { auth: false })
          .then((res) => res.json())
        expect(doc.defaultAccessRelation).toEqual(defaultAccessRelation.id)
      })

      test('should populate strict access when authorized', async ({ restClient }) => {
        const doc = await restClient.GET(`/${slug}/${post.id}`).then((res) => res.json())
        expect(doc.defaultAccessRelation).toEqual(defaultAccessRelation)
      })

      test('should use filterOptions to limit relationship options', async ({ restClient }) => {
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

      test('should count totalDocs correctly when using or in where query and relation contains hasMany relationship fields', async ({
        payload,
      }) => {
        const user = (
          await payload.find({
            collection: 'users',
            overrideAccess: true,
          })
        ).docs[0]

        const user2 = await payload.create({
          collection: 'users',
          data: {
            email: '1@test.com',
            password: 'fwefe',
          },
          overrideAccess: true,
        })
        const user3 = await payload.create({
          collection: 'users',
          data: {
            email: '2@test.com',
            password: 'fwsefe',
          },
          overrideAccess: true,
        })
        const user4 = await payload.create({
          collection: 'users',
          data: {
            email: '3@test.com',
            password: 'fwddsefe',
          },
          overrideAccess: true,
        })
        await payload.create({
          collection: 'movieReviews',
          data: {
            likes: [user3.id, user2.id, user.id, user4.id],
            movieReviewer: user.id,
            visibility: 'public',
          },
          overrideAccess: true,
        })
        await payload.create({
          collection: 'movieReviews',
          data: {
            movieReviewer: user2.id,
            visibility: 'public',
          },
          overrideAccess: true,
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
          overrideAccess: true,
        })
        expect(query.totalDocs).toEqual(2)
      })

      // https://github.com/payloadcms/payload/issues/4240
      test('should allow querying by relationship id field', async ({ payload }) => {
        /**
         * This test shows something which breaks on postgres but not on mongodb.
         */
        const someDirector = await payload.create({
          collection: 'directors',
          data: {
            name: 'Quentin Tarantino',
          },
          overrideAccess: true,
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction',
          },
          overrideAccess: true,
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction',
          },
          overrideAccess: true,
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Harry Potter',
          },
          overrideAccess: true,
        })

        await payload.create({
          collection: 'movies',
          data: {
            name: 'Lord of the Rings is boring',
            director: someDirector.id,
          },
          overrideAccess: true,
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
          overrideAccess: true,
        })

        expect(query.totalDocs).toEqual(3)
        expect(query.docs).toHaveLength(1) // Due to limit: 1
      })

      test('should allow querying by relationships with an object where as AND', async ({
        payload,
      }) => {
        const director = await payload.create({
          collection: 'directors',
          data: { name: 'Director1', localized: 'Director1_Localized' },
          overrideAccess: true,
        })

        const movie = await payload.create({
          collection: 'movies',
          data: { director: director.id },
          depth: 0,
          overrideAccess: true,
        })

        const { docs: trueRes } = await payload.find({
          collection: 'movies',
          depth: 0,
          where: {
            'director.name': { equals: 'Director1' },
            'director.localized': { equals: 'Director1_Localized' },
          },
          overrideAccess: true,
        })

        expect(trueRes).toStrictEqual([movie])

        const { docs: falseRes } = await payload.find({
          collection: 'movies',
          depth: 0,
          where: {
            'director.name': { equals: 'Director1_Fake' },
            'director.localized': { equals: 'Director1_Localized' },
          },
          overrideAccess: true,
        })

        expect(falseRes).toStrictEqual([])
      })

      test('should allow querying within blocks', async ({ payload }) => {
        const rel = await payload.create({
          collection: relationSlug,
          data: {
            name: 'test',
            disableRelation: false,
          },
          overrideAccess: true,
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
          overrideAccess: true,
        })

        const { docs } = await payload.find({
          collection: slug,
          where: { 'blocks.relationField': { equals: rel.id } },
          overrideAccess: true,
        })

        expect(docs[0].id).toBe(doc.id)
      })

      test('should allow querying within tabs-blocks-tabs', async ({ payload }) => {
        const movie = await payload.create({ collection: 'movies', data: { name: 'Pulp Fiction' }, overrideAccess: true })

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
          overrideAccess: true,
        })

        const result = await payload.find({
          collection: 'deep-nested',
          where: {
            'content.blocks.meta.movie': {
              equals: movie.id,
            },
          },
          overrideAccess: true,
        })

        expect(result.totalDocs).toBe(1)
        expect(result.docs[0].id).toBe(id)
      })

      test('should allow query hasMany select in relationship', async ({ payload }) => {
        const movie = await payload.create({ collection: 'movies', data: { select: ['a', 'b'] }, overrideAccess: true })
        const doc = await payload.create({
          collection: 'directors',
          data: { name: 'Mega Director', movie },
          overrideAccess: true,
        })

        const res = await payload.find({
          collection: 'directors',
          where: { 'movie.select': { equals: 'a' } },
          overrideAccess: true,
        })
        expect(res.docs).toHaveLength(1)
        expect(res.docs[0].id).toBe(doc.id)
      })

      test('should query through a transitive has-many join using the related table alias', async ({
        payload,
      }) => {
        const artist = await payload.create({
          collection: 'transitive-join-artists',
          data: {},
          overrideAccess: true,
        })
        const album = await payload.create({
          collection: 'transitive-join-albums',
          data: { artist: artist.id },
          overrideAccess: true,
        })
        const song = await payload.create({
          collection: 'transitive-join-songs',
          data: { albums: [album.id], name: 'Aliased song' },
          overrideAccess: true,
        })

        const { docs } = await payload.find({
          collection: 'transitive-join-artists',
          where: {
            'album.song.name': { equals: song.name },
          },
          overrideAccess: true,
        })

        expect(docs).toHaveLength(1)
        expect(docs[0]?.id).toBe(artist.id)
      })

      test('should allow 4x deep querying', async ({ payload }) => {
        const movie_1 = await payload.create({
          collection: 'movies',
          data: { name: 'random_movie_1' },
          overrideAccess: true,
        })
        const director_1 = await payload.create({
          collection: 'directors',
          data: { name: 'random_director_1', movie: movie_1.id },
          overrideAccess: true,
        })
        const movie_2 = await payload.create({
          collection: 'movies',
          data: { name: 'random_movie_2', director: director_1.id },
          overrideAccess: true,
        })
        const director_2 = await payload.create({
          collection: 'directors',
          data: { name: 'random_director_2', movie: movie_2.id },
          overrideAccess: true,
        })

        const res = await payload.find({
          collection: 'directors',
          where: { 'movie.director.movie.name': { equals: 'random_movie_1' } },
          overrideAccess: true,
        })

        expect(res.totalDocs).toBe(1)
        expect(res.docs[0].id).toBe(director_2.id)
      })

      // MongoDB dedupes $in at execution, so the bug is only visible in the
      // filter Payload hands to Mongoose — not in the returned docs.
      test.options({ db: 'mongo' })(
        'should not duplicate IDs in $in when querying through a relationship',
        async ({ payload }) => {
          const movie = await payload.create({
            collection: 'movies',
            data: { name: 'dup_test_movie' },
            overrideAccess: true,
          })

          const Model = (payload.db as any).collections.directors
          const originalPaginate = Model.paginate.bind(Model)
          let capturedQuery: any
          Model.paginate = (query: any, ...rest: any[]) => {
            capturedQuery = query
            return originalPaginate(query, ...rest)
          }

          try {
            await payload.find({
              collection: 'directors',
              where: { 'movie.name': { equals: 'dup_test_movie' } },
              overrideAccess: true,
            })
          } finally {
            Model.paginate = originalPaginate
          }

          expect(capturedQuery.$and[0].movie.$in).toHaveLength(1)

          await payload.delete({ collection: 'movies', id: movie.id, overrideAccess: true })
        },
      )

      test.describe('hasMany relationships', () => {
        test.describe('has-many relationship operators', () => {
          let directorWithoutMovies: Director
          let electricCarsDirector: Director
          let electricCarsMovieID: number | string
          let mixedDirector: Director
          let recallsDirector: Director
          let recallsMovieID: number | string

          test.beforeEach(async ({ payload }) => {
            const recallsMovie = await payload.create({
              collection: 'movies',
              data: { name: 'recalls', select: ['a'] },
              overrideAccess: true,
            })

            const electricCarsMovie = await payload.create({
              collection: 'movies',
              data: { name: 'electric-cars', select: ['a', 'b'] },
              overrideAccess: true,
            })

            recallsMovieID = recallsMovie.id
            electricCarsMovieID = electricCarsMovie.id

            mixedDirector = await payload.create({
              collection: 'directors',
              data: { name: 'mixed', movies: [recallsMovie.id, electricCarsMovie.id] },
              overrideAccess: true,
            })

            recallsDirector = await payload.create({
              collection: 'directors',
              data: { name: 'recalls', movies: [recallsMovie.id] },
              overrideAccess: true,
            })

            electricCarsDirector = await payload.create({
              collection: 'directors',
              data: { name: 'electric-cars', movies: [electricCarsMovie.id] },
              overrideAccess: true,
            })

            directorWithoutMovies = await payload.create({
              collection: 'directors',
              data: { name: 'empty', movies: [] },
              overrideAccess: true,
            })
          })

          test('should find documents where some related documents match', async ({ payload }) => {
            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  contains: { name: { equals: 'recalls' } },
                },
              },
              overrideAccess: true,
            })

            const foundDirectorIDs = docs.map(({ id }) => id)
            expect(foundDirectorIDs).toHaveLength(2)
            expect(foundDirectorIDs).toContain(mixedDirector.id)
            expect(foundDirectorIDs).toContain(recallsDirector.id)
          })

          test('should find documents where no related documents match', async ({ payload }) => {
            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  not_equals: { name: { equals: 'recalls' } },
                },
              },
              overrideAccess: true,
            })

            const foundDirectorIDs = docs.map(({ id }) => id)
            expect(foundDirectorIDs).toHaveLength(2)
            expect(foundDirectorIDs).toContain(electricCarsDirector.id)
            expect(foundDirectorIDs).toContain(directorWithoutMovies.id)
          })

          test('should find documents where every related document matches', async ({
            payload,
          }) => {
            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  equals: { name: { equals: 'electric-cars' } },
                },
              },
              overrideAccess: true,
            })

            const foundDirectorIDs = docs.map(({ id }) => id)
            expect(foundDirectorIDs).toHaveLength(2)
            expect(foundDirectorIDs).toContain(electricCarsDirector.id)
            expect(foundDirectorIDs).toContain(directorWithoutMovies.id)
          })

          test('should query has-many relationship operators through REST', async ({
            restClient,
          }) => {
            const response = await restClient.GET('/directors', {
              query: {
                depth: 0,
                where: {
                  movies: { not_equals: { name: { equals: 'recalls' } } },
                },
              },
            })
            const { docs } = await response.json()

            const foundDirectorIDs = docs.map(({ id }) => id)
            expect(response.status).toBe(200)
            expect(foundDirectorIDs).toHaveLength(2)
            expect(foundDirectorIDs).toContain(electricCarsDirector.id)
            expect(foundDirectorIDs).toContain(directorWithoutMovies.id)
          })

          test('should support direct relationship ID conditions', async ({ payload }) => {
            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: { not_equals: { id: { equals: recallsMovieID } } },
              },
              overrideAccess: true,
            })

            const foundDirectorIDs = docs.map(({ id }) => id)
            expect(foundDirectorIDs).toHaveLength(2)
            expect(foundDirectorIDs).toContain(electricCarsDirector.id)
            expect(foundDirectorIDs).toContain(directorWithoutMovies.id)
          })

          test('should apply a compound query to the same related document', async ({
            payload,
          }) => {
            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  contains: {
                    and: [{ name: { equals: 'recalls' } }, { id: { equals: electricCarsMovieID } }],
                  },
                },
              },
              overrideAccess: true,
            })

            expect(docs).toHaveLength(0)
          })

          test('should evaluate nested equals against related documents instead of joined rows', async ({
            payload,
          }) => {
            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  equals: { select: { equals: 'a' } },
                },
              },
              overrideAccess: true,
            })

            expect(docs).toHaveLength(4)
          })

          test('should support nested has-many operators on a localized relationship inside a block', async ({
            payload,
          }) => {
            const mixedBlock = await payload.create({
              collection: 'blocks',
              data: {
                blocks: [
                  {
                    blockType: 'some',
                    directors: [mixedDirector.id, electricCarsDirector.id],
                  },
                ],
              },
              overrideAccess: true,
            })

            const electricCarsBlock = await payload.create({
              collection: 'blocks',
              data: {
                blocks: [{ blockType: 'some', directors: [electricCarsDirector.id] }],
              },
              overrideAccess: true,
            })

            const blockWithoutDirectors = await payload.create({
              collection: 'blocks',
              data: { blocks: [{ blockType: 'some', directors: [] }] },
              overrideAccess: true,
            })

            const { docs } = await payload.find({
              collection: 'blocks',
              depth: 0,
              locale: 'en',
              where: {
                and: [
                  {
                    id: {
                      in: [mixedBlock.id, electricCarsBlock.id, blockWithoutDirectors.id],
                    },
                  },
                  {
                    'blocks.directors': {
                      not_equals: {
                        movies: { contains: { name: { equals: 'recalls' } } },
                      },
                    },
                  },
                ],
              },
              overrideAccess: true,
            })

            const foundBlockIDs = docs.map(({ id }) => id)
            expect(foundBlockIDs).toHaveLength(2)
            expect(foundBlockIDs).toContain(electricCarsBlock.id)
            expect(foundBlockIDs).toContain(blockWithoutDirectors.id)
          })

          // `near` on a point field is not implemented by the drizzle sqlite adapter
          test.options({ db: (adapter) => !adapter.startsWith('sqlite') })(
            'should support equals with a geospatial nested query',
            async ({ payload }) => {
              const nearbyMovie = await payload.create({
                collection: 'movies',
                data: { name: 'nearby', location: [10, 20] },
                overrideAccess: true,
              })

              const nearbyDirector = await payload.create({
                collection: 'directors',
                data: { name: 'nearby', movies: [nearbyMovie.id] },
                overrideAccess: true,
              })

              const { docs } = await payload.find({
                collection: 'directors',
                depth: 0,
                where: {
                  movies: { equals: { location: { near: '10,20,100000' } } },
                },
                overrideAccess: true,
              })

              expect(docs.map(({ id }) => id)).toContain(nearbyDirector.id)
            },
          )
        })

        test('should query two hasMany levels deep when the middle document has multiple relations', async ({
          payload,
        }) => {
          const alpha = await payload.create({
            collection: 'movies',
            data: { name: 'Alpha' },
            overrideAccess: true,
          })

          const beta = await payload.create({
            collection: 'movies',
            data: { name: 'Beta' },
            overrideAccess: true,
          })

          const child = await payload.create({
            collection: 'directors',
            data: { name: 'child', movies: [alpha.id, beta.id] },
            overrideAccess: true,
          })

          const parent = await payload.create({
            collection: 'directors',
            data: { name: 'parent', directors: [child.id] },
            overrideAccess: true,
          })

          const { docs } = await payload.find({
            collection: 'directors',
            depth: 0,
            where: {
              'directors.movies.name': { equals: 'Alpha' },
            },
            overrideAccess: true,
          })

          expect(docs.map(({ id }) => id)).toStrictEqual([parent.id])
        })

        test('should retrieve totalDocs correctly with hasMany,', async ({ payload }) => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {},
            overrideAccess: true,
          })
          const movie2 = await payload.create({
            collection: 'movies',
            data: {},
            overrideAccess: true,
          })

          const movie3 = await payload.create({
            collection: 'movies',
            data: { name: 'some-name' },
            overrideAccess: true,
          })

          const movie4 = await payload.create({
            collection: 'movies',
            data: { name: 'some-name' },
            overrideAccess: true,
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id, movie1.id, movie3.id, movie4.id],
            },
            overrideAccess: true,
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
            overrideAccess: true,
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
            overrideAccess: true,
          })

          expect(res_2.totalDocs).toBe(1)

          const dir_1 = await payload.create({ collection: 'directors', data: { name: 'dir' }, overrideAccess: true })
          const dir_2 = await payload.create({ collection: 'directors', data: { name: 'dir' }, overrideAccess: true })

          const dir_3 = await payload.create({
            collection: 'directors',
            data: { directors: [dir_1.id, dir_2.id] },
            overrideAccess: true,
          })

          const result = await payload.find({
            collection: 'directors',
            where: {
              'directors.name': { equals: 'dir' },
            },
            overrideAccess: true,
          })

          expect(result.totalDocs).toBe(1)
          expect(result.docs).toHaveLength(1)
          expect(result.docs[0]?.id).toBe(dir_3.id)
        })

        test('should query using "contains" by hasMany relationship field', async ({ payload }) => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {},
            overrideAccess: true,
          })
          const movie2 = await payload.create({
            collection: 'movies',
            data: {},
            overrideAccess: true,
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id, movie1.id],
            },
            overrideAccess: true,
          })

          await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie2.id],
            },
            overrideAccess: true,
          })

          const query1 = await payload.find({
            collection: 'directors',
            depth: 0,
            where: {
              movies: {
                contains: movie1.id,
              },
            },
            overrideAccess: true,
          })
          const query2 = await payload.find({
            collection: 'directors',
            depth: 0,
            where: {
              movies: {
                contains: movie2.id,
              },
            },
            overrideAccess: true,
          })

          expect(query1.totalDocs).toStrictEqual(1)
          expect(query2.totalDocs).toStrictEqual(2)
        })

        test.options({ db: 'mongo' })(
          'should treat an ObjectId as a relationship ID',
          async ({ payload }) => {
            const movie = await payload.create({ collection: 'movies', data: {}, overrideAccess: true })

            const director = await payload.create({
              collection: 'directors',
              data: {
                movies: [movie.id],
              },
              overrideAccess: true,
            })

            const { docs } = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  contains: new Types.ObjectId(String(movie.id)),
                },
              },
              overrideAccess: true,
            })

            expect(docs).toHaveLength(1)
            expect(docs[0]?.id).toBe(director.id)
          },
        )

        // all operator is not supported in Postgres yet for any fields
        test.options({ db: 'mongo' })(
          'should query using "all" by hasMany relationship field',
          async ({ payload }) => {
            const movie1 = await payload.create({
              collection: 'movies',
              data: {},
              overrideAccess: true,
            })
            const movie2 = await payload.create({
              collection: 'movies',
              data: {},
              overrideAccess: true,
            })

            await payload.create({
              collection: 'directors',
              data: {
                name: 'Quentin Tarantino',
                movies: [movie2.id, movie1.id],
              },
              overrideAccess: true,
            })

            await payload.create({
              collection: 'directors',
              data: {
                name: 'Quentin Tarantino',
                movies: [movie2.id],
              },
              overrideAccess: true,
            })

            const query1 = await payload.find({
              collection: 'directors',
              depth: 0,
              where: {
                movies: {
                  all: [movie1.id],
                },
              },
              overrideAccess: true,
            })

            expect(query1.totalDocs).toStrictEqual(1)
          },
        )

        test('should query using "in" by hasMany relationship field', async ({ payload }) => {
          const tree1 = await payload.create({
            collection: treeSlug,
            data: {
              text: 'Tree 1',
            },
            overrideAccess: true,
          })

          const tree2 = await payload.create({
            collection: treeSlug,
            data: {
              parent: tree1.id,
              text: 'Tree 2',
            },
            overrideAccess: true,
          })

          const tree3 = await payload.create({
            collection: treeSlug,
            data: {
              parent: tree2.id,
              text: 'Tree 3',
            },
            overrideAccess: true,
          })

          const tree4 = await payload.create({
            collection: treeSlug,
            data: {
              parent: tree3.id,
              text: 'Tree 4',
            },
            overrideAccess: true,
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
            overrideAccess: true,
          })
          // should only return tree3 and tree4

          expect(query.totalDocs).toEqual(2)
          expect(query.docs[0].text).toEqual('Tree 3')
          expect(query.docs[1].text).toEqual('Tree 4')
        })
      })

      test.describe('sorting by relationships', () => {
        test('should sort by a property of a relationship', async ({ payload }) => {
          await payload.delete({ collection: 'directors', where: {}, overrideAccess: true })
          await payload.delete({ collection: 'movies', where: {}, overrideAccess: true })

          const director_2 = await payload.create({
            collection: 'directors',
            data: { name: 'Mr. Dan', localized: 'Mr. Dan' },
            overrideAccess: true,
          })

          await payload.update({
            collection: 'directors',
            id: director_2.id,
            locale: 'de',
            data: { localized: 'Dan' },
            overrideAccess: true,
          })

          const director_1 = await payload.create({
            collection: 'directors',
            data: { name: 'Dan', localized: 'Dan' },
            overrideAccess: true,
          })

          await payload.update({
            collection: 'directors',
            id: director_1.id,
            locale: 'de',
            data: { localized: 'Mr. Dan' },
            overrideAccess: true,
          })

          const movie_1 = await payload.create({
            collection: 'movies',
            depth: 0,
            data: { director: director_1.id, name: 'Some Movie 1' },
            overrideAccess: true,
          })

          const movie_2 = await payload.create({
            collection: 'movies',
            depth: 0,
            data: { director: director_2.id, name: 'Some Movie 2' },
            overrideAccess: true,
          })

          const res_1 = await payload.find({
            collection: 'movies',
            sort: '-director.name',
            depth: 0,
            overrideAccess: true,
          })
          const res_2 = await payload.find({
            collection: 'movies',
            sort: 'director.name',
            depth: 0,
            overrideAccess: true,
          })

          expect(res_1.docs).toStrictEqual([movie_2, movie_1])
          expect(res_2.docs).toStrictEqual([movie_1, movie_2])

          const draft_res_1 = await payload.find({
            collection: 'movies',
            sort: '-director.name',
            depth: 0,
            draft: true,
            overrideAccess: true,
          })
          const draft_res_2 = await payload.find({
            collection: 'movies',
            sort: 'director.name',
            depth: 0,
            draft: true,
            overrideAccess: true,
          })

          expect(draft_res_1.docs).toStrictEqual([movie_2, movie_1])
          expect(draft_res_2.docs).toStrictEqual([movie_1, movie_2])

          const localized_res_1 = await payload.find({
            collection: 'movies',
            sort: 'director.localized',
            depth: 0,
            locale: 'de',
            overrideAccess: true,
          })
          const localized_res_2 = await payload.find({
            collection: 'movies',
            sort: 'director.localized',
            depth: 0,
            overrideAccess: true,
          })

          expect(localized_res_1.docs).toStrictEqual([movie_2, movie_1])
          expect(localized_res_2.docs).toStrictEqual([movie_1, movie_2])
        })

        test('should sort by a property of a nested relationship', async ({ payload }) => {
          await payload.delete({ collection: 'directors', where: {}, overrideAccess: true })
          await payload.delete({ collection: 'movies', where: {}, overrideAccess: true })

          const director = await payload.create({ collection: 'directors', data: {}, overrideAccess: true })

          const movie = await payload.create({
            collection: 'movies',
            data: { director: director.id, name: 'movie 1' },
            overrideAccess: true,
          })

          await payload.update({
            collection: 'directors',
            id: director.id,
            data: { movie: movie.id },
            overrideAccess: true,
          })

          const director_2 = await payload.create({ collection: 'directors', data: {}, overrideAccess: true })

          const movie_2 = await payload.create({
            collection: 'movies',
            data: { director: director_2.id, name: 'movie 2' },
            overrideAccess: true,
          })

          await payload.update({
            collection: 'directors',
            id: director_2.id,
            data: { movie: movie_2.id },
            overrideAccess: true,
          })

          const res = await payload.find({ collection: 'movies', sort: 'director.movie.name', overrideAccess: true })
          expect(res.docs[0].id).toBe(movie.id)
          expect(res.docs[1].id).toBe(movie_2.id)

          const res_2 = await payload.find({ collection: 'movies', sort: '-director.movie.name', overrideAccess: true })
          expect(res_2.docs[0].id).toBe(movie_2.id)
          expect(res_2.docs[1].id).toBe(movie.id)
        })

        test('should sort by multiple properties of a relationship', async ({ payload }) => {
          await payload.delete({ collection: 'directors', where: {}, overrideAccess: true })
          await payload.delete({ collection: 'movies', where: {}, overrideAccess: true })

          const createDirector = {
            collection: 'directors',
            overrideAccess: true,
            data: {
              name: 'Dan',
            },
          } as const

          const director_1 = await payload.create(createDirector)
          const director_2 = await payload.create(createDirector)

          const movie_1 = await payload.create({
            collection: 'movies',
            depth: 0,
            data: { director: director_1.id, name: 'Some Movie 1' },
            overrideAccess: true,
          })

          const movie_2 = await payload.create({
            collection: 'movies',
            depth: 0,
            data: { director: director_2.id, name: 'Some Movie 2' },
            overrideAccess: true,
          })

          const res_1 = await payload.find({
            collection: 'movies',
            sort: ['director.name', 'director.createdAt'],
            depth: 0,
            overrideAccess: true,
          })
          const res_2 = await payload.find({
            collection: 'movies',
            sort: ['director.name', '-director.createdAt'],
            depth: 0,
            overrideAccess: true,
          })

          expect(res_1.docs).toStrictEqual([movie_1, movie_2])
          expect(res_2.docs).toStrictEqual([movie_2, movie_1])
        })

        test('should sort by a property of a hasMany relationship', async ({ payload }) => {
          const movie1 = await payload.create({
            collection: 'movies',
            data: {
              name: 'Pulp Fiction',
            },
            overrideAccess: true,
          })

          const movie2 = await payload.create({
            collection: 'movies',
            data: {
              name: 'Inception',
            },
            overrideAccess: true,
          })

          await payload.delete({ collection: 'directors', where: {}, overrideAccess: true })

          const director1 = await payload.create({
            collection: 'directors',
            data: {
              name: 'Quentin Tarantino',
              movies: [movie1.id],
            },
            overrideAccess: true,
          })
          const director2 = await payload.create({
            collection: 'directors',
            data: {
              name: 'Christopher Nolan',
              movies: [movie2.id],
            },
            overrideAccess: true,
          })

          const result = await payload.find({
            collection: 'directors',
            depth: 0,
            sort: '-movies.name',
            overrideAccess: true,
          })

          expect(result.docs[0].id).toStrictEqual(director1.id)
        })
      })

      test.describe('Custom ID', () => {
        test('should query a custom id relation', async ({ restClient }) => {
          const { customIdRelation } = await restClient
            .GET(`/${slug}/${post.id}`)
            .then((res) => res.json())
          expect(customIdRelation).toMatchObject({ id: generatedCustomId })
        })

        test('should query a custom id number relation', async ({ restClient }) => {
          const { customIdNumberRelation } = await restClient
            .GET(`/${slug}/${post.id}`)
            .then((res) => res.json())
          expect(customIdNumberRelation).toMatchObject({ id: generatedCustomIdNumber })
        })
      })

      test.describe('depth', () => {
        test('should populate one level by default', async ({ restClient }) => {
          const doc = await restClient.GET(`/${slug}/${post.id}`).then((res) => res.json())
          const chainedRel = doc?.chainedRelation as EasierChained

          expect(chainedRel.id).toEqual(chained.id)
          expect(chainedRel.relation).toEqual(chained2.id)
        })

        test('should populate to depth', async ({ restClient }) => {
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

        test('should only populate ID if depth 0', async ({ restClient }) => {
          const doc = await restClient
            .GET(`/${slug}/${post.id}`, {
              query: {
                depth: 0,
              },
            })
            .then((res) => res.json())
          expect(doc?.chainedRelation).toEqual(chained.id)
        })

        test('should respect maxDepth at field level', async ({ restClient }) => {
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

        test.describe('Local API', () => {
          test('should populate to depth via local API find', async ({ payload }) => {
            const result = await payload.find({
              collection: slug,
              depth: 2,
              where: {
                id: { equals: post.id },
              },
              overrideAccess: true,
            })

            const doc = result.docs[0]
            const chainedRel = doc?.chainedRelation as EasierChained

            expect(chainedRel.id).toEqual(chained.id)
            expect(chainedRel.relation.id).toEqual(chained2.id)
            expect(chainedRel.relation.relation as unknown as string).toEqual(chained3.id)
          })

          test('should only populate ID if depth 0 via local API find', async ({ payload }) => {
            const result = await payload.find({
              collection: slug,
              depth: 0,
              where: {
                id: { equals: post.id },
              },
              overrideAccess: true,
            })

            const doc = result.docs[0]

            expect(doc?.chainedRelation).toEqual(chained.id)
          })

          test('should respect maxDepth at field level via local API find', async ({ payload }) => {
            const result = await payload.find({
              collection: slug,
              depth: 1,
              where: {
                id: { equals: post.id },
              },
              overrideAccess: true,
            })

            const doc = result.docs[0]

            expect(doc?.maxDepthRelation).toEqual(relation.id)
            expect(doc?.maxDepthRelation).not.toHaveProperty('name')
            // should not affect other fields
            expect(doc?.relationField).toMatchObject({ id: relation.id, name: relation.name })
          })

          test('should use depth option even if req.query.depth is set', async ({ payload }) => {
            const result = await payload.find({
              collection: slug,
              depth: 0,
              where: {
                id: { equals: post.id },
              },
              req: { query: { depth: 5 } } as Partial<PayloadRequest> as PayloadRequest,
              overrideAccess: true,
            })

            const doc = result.docs[0]

            // depth: 0 from options should be used, not depth: 5 from req.query
            expect(doc?.chainedRelation).toEqual(chained.id)
          })

          test('should ignore req.query.depth when no depth option is provided', async ({
            payload,
          }) => {
            // When no depth option is provided, req.query.depth should be ignored
            // and the default depth behavior should apply
            const result = await payload.find({
              collection: slug,
              where: {
                id: { equals: post.id },
              },
              req: { query: { depth: 0 } } as Partial<PayloadRequest> as PayloadRequest,
              overrideAccess: true,
            })

            const doc = result.docs[0]

            const chainedRel = doc?.chainedRelation as EasierChained

            expect(chainedRel.id).toEqual(chained.id)
            expect(chainedRel.relation).toEqual(chained2.id)
          })
        })
      })

      test.describe('with localization', () => {
        let relation1: Relation
        let relation2: Relation
        let localizedPost1: PostsLocalized
        let localizedPost2: PostsLocalized

        test.beforeEach(async ({ payload }) => {
          relation1 = await payload.create<Relation>({
            collection: relationSlug,
            data: {
              name: 'english',
            },
            overrideAccess: true,
          })

          relation2 = await payload.create<Relation>({
            collection: relationSlug,
            data: {
              name: 'german',
            },
            overrideAccess: true,
          })

          localizedPost1 = await payload.create<'postsLocalized'>({
            collection: slugWithLocalizedRel,
            data: {
              title: 'english',
              relationField: relation1.id,
            },
            locale: 'en',
            overrideAccess: true,
          })

          await payload.update({
            id: localizedPost1.id,
            collection: slugWithLocalizedRel,
            locale: 'de',
            data: {
              relationField: relation2.id,
            },
            overrideAccess: true,
          })

          localizedPost2 = await payload.create({
            collection: slugWithLocalizedRel,
            data: {
              title: 'german',
              relationField: relation2.id,
            },
            locale: 'de',
            overrideAccess: true,
          })
        })
        test('should find two docs for german locale', async ({ payload }) => {
          const { docs } = await payload.find<PostsLocalized>({
            collection: slugWithLocalizedRel,
            locale: 'de',
            where: {
              relationField: {
                equals: relation2.id,
              },
            },
            overrideAccess: true,
          })

          const mappedIds = docs.map((doc) => doc?.id)
          expect(mappedIds).toContain(localizedPost1.id)
          expect(mappedIds).toContain(localizedPost2.id)
        })

        test("shouldn't find a relationship query outside of the specified locale", async ({
          payload,
        }) => {
          const { docs } = await payload.find<PostsLocalized>({
            collection: slugWithLocalizedRel,
            locale: 'en',
            where: {
              relationField: {
                equals: relation2.id,
              },
            },
            overrideAccess: true,
          })

          expect(docs.map((doc) => doc?.id)).not.toContain(localizedPost2.id)
        })

        test('should query a non-localized hasMany relationship nested under a localized array', async ({
          payload,
        }) => {
          const movie = await payload.create({
            collection: 'movies',
            data: { name: 'Jackie Brown' },
            overrideAccess: true,
          })

          const director = await payload.create({
            collection: 'directors',
            data: { name: 'Quentin Tarantino', movies: [movie.id] },
            overrideAccess: true,
          })

          const post = await payload.create({
            collection: slugWithLocalizedRel,
            data: { localizedDirectors: [{ director: director.id }], title: 'english' },
            locale: 'en',
            overrideAccess: true,
          })

          const { docs } = await payload.find({
            collection: slugWithLocalizedRel,
            locale: 'en',
            where: {
              'localizedDirectors.director.movies.name': { equals: 'Jackie Brown' },
            },
            overrideAccess: true,
          })

          expect(docs.map(({ id }) => id)).toStrictEqual([post.id])
        })
      })

      test('should allow update removing a relationship', async ({ restClient }) => {
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

    test.describe('Nested Querying', () => {
      let thirdLevelID: string
      let secondLevelID: string
      let firstLevelID: string

      test.beforeEach(async ({ payload }) => {
        const thirdLevelDoc = await payload.create({
          collection: 'chained',
          data: {
            name: 'third',
          },
          overrideAccess: true,
        })

        thirdLevelID = thirdLevelDoc.id

        const secondLevelDoc = await payload.create({
          collection: 'chained',
          data: {
            name: 'second',
            relation: thirdLevelID,
          },
          overrideAccess: true,
        })

        secondLevelID = secondLevelDoc.id

        const firstLevelDoc = await payload.create({
          collection: 'chained',
          data: {
            name: 'first',
            relation: secondLevelID,
          },
          overrideAccess: true,
        })

        firstLevelID = firstLevelDoc.id
      })

      test('should allow querying one level deep', async ({ payload }) => {
        const query1 = await payload.find({
          collection: 'chained',
          where: {
            'relation.name': {
              equals: 'second',
            },
          },
          overrideAccess: true,
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
          overrideAccess: true,
        })

        expect(query2.docs).toHaveLength(1)
        expect(query2.docs[0].id).toStrictEqual(secondLevelID)
      })

      test('should allow querying two levels deep', async ({ payload }) => {
        const query = await payload.find({
          collection: 'chained',
          where: {
            'relation.relation.name': {
              equals: 'third',
            },
          },
          overrideAccess: true,
        })

        expect(query.docs).toHaveLength(1)
        expect(query.docs[0].id).toStrictEqual(firstLevelID)
      })

      test('should allow querying on id two levels deep', async ({ payload, restClient }) => {
        const query = await payload.find({
          collection: 'chained',
          where: {
            'relation.relation.id': {
              equals: thirdLevelID,
            },
          },
          overrideAccess: true,
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

      test('should allow querying within array nesting', async ({ payload }) => {
        const page = await payload.create({
          collection: 'pages',
          data: {
            menu: [
              {
                label: 'hello',
              },
            ],
          },
          overrideAccess: true,
        })

        const rel = await payload.create({ collection: 'rels-to-pages', data: { page: page.id }, overrideAccess: true })

        const resEquals = await payload.find({
          collection: 'rels-to-pages',
          where: { 'page.menu.label': { equals: 'hello' } },
          overrideAccess: true,
        })

        expect(resEquals.totalDocs).toBe(1)
        expect(resEquals.docs[0].id).toBe(rel.id)

        const resIn = await payload.find({
          collection: 'rels-to-pages',
          where: { 'page.menu.label': { in: ['hello'] } },
          overrideAccess: true,
        })

        expect(resIn.totalDocs).toBe(1)
        expect(resIn.docs[0].id).toBe(rel.id)
      })
    })

    test('should allow querying within block nesting', async ({ payload }) => {
      const director = await payload.create({
        collection: 'directors',
        data: { name: 'Test Director' },
        overrideAccess: true,
      })

      const director_false = await payload.create({
        collection: 'directors',
        data: { name: 'False Director' },
        overrideAccess: true,
      })

      const doc = await payload.create({
        collection: 'blocks',
        data: { blocks: [{ blockType: 'some', director: director.id }] },
        overrideAccess: true,
      })

      await payload.create({
        collection: 'blocks',
        data: { blocks: [{ blockType: 'some', director: director_false.id }] },
        overrideAccess: true,
      })

      const result = await payload.find({
        collection: 'blocks',
        where: { 'blocks.director.name': { equals: 'Test Director' } },
        overrideAccess: true,
      })

      expect(result.totalDocs).toBe(1)
      expect(result.docs[0]!.id).toBe(doc.id)
    })

    test('should allow querying polymorphic in an array', async ({ payload }) => {
      const director = await payload.create({
        collection: 'directors',
        data: { name: 'direcotr' },
        overrideAccess: true,
      })
      const movie = await payload.create({
        collection: 'movies',
        data: { array: [{ polymorphic: { relationTo: 'directors', value: director.id } }] },
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'movies',
        where: { 'array.polymorphic': { equals: { value: director.id, relationTo: 'directors' } } },
        overrideAccess: true,
      })
      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(movie.id)
    })

    test('should allow querying hasMany in array', async ({ payload }) => {
      const director = await payload.create({
        collection: 'directors',
        data: { name: 'Test Director1337' },
        overrideAccess: true,
      })
      const movie = await payload.create({
        collection: 'movies',
        data: { array: [{ director: [director.id] }] },
        overrideAccess: true,
      })
      const res = await payload.find({
        collection: 'movies',
        where: { 'array.director': { equals: director.id } },
        overrideAccess: true,
      })
      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(movie.id)
      const res2 = await payload.find({
        collection: 'movies',
        where: { 'array.director.name': { equals: 'Test Director1337' } },
        overrideAccess: true,
      })
      expect(res2.docs).toHaveLength(1)
      expect(res2.docs[0].id).toBe(movie.id)
    })

    test.describe('Nested Querying Separate Collections', () => {
      let director: Director

      test.beforeEach(async ({ payload }) => {
        // 1. create a director
        director = await payload.create({
          collection: 'directors',
          data: {
            name: 'Quentin Tarantino',
          },
          overrideAccess: true,
        })

        // 2. create a movie
        const movie = await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction',
            director: director.id,
          },
          overrideAccess: true,
        })

        // 3. create a screening
        await payload.create({
          collection: 'screenings',
          data: {
            name: 'Pulp Fiction Screening',
            movie: movie.id,
          },
          overrideAccess: true,
        })
      })

      test('should allow querying two levels deep', async ({ payload }) => {
        const query = await payload.find({
          collection: 'screenings',
          where: {
            'movie.director.name': {
              equals: director.name,
            },
          },
          overrideAccess: true,
        })

        expect(query.docs).toHaveLength(1)
      })
    })
    test.describe('Multiple Docs', () => {
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

      test.beforeEach(async ({ payload }) => {
        await Promise.all(
          movieList.map(async (movie) => {
            return await payload.create({
              collection: 'movies',
              data: {
                name: movie,
              },
              overrideAccess: true,
            })
          }),
        )
      })

      test('should return more than 10 docs in relationship', async ({ payload }) => {
        const allMovies = await payload.find({
          collection: 'movies',
          limit: 20,
          overrideAccess: true,
        })

        const movieIDs = allMovies.docs.map((doc) => doc.id)

        await payload.create({
          collection: 'directors',
          data: {
            name: 'Quentin Tarantino',
            movies: movieIDs,
          },
          overrideAccess: true,
        })

        const director = await payload.find({
          collection: 'directors',
          where: {
            name: {
              equals: 'Quentin Tarantino',
            },
          },
          overrideAccess: true,
        })

        expect(director.docs[0].movies.length).toBeGreaterThan(10)
      })

      test('should allow clearing hasMany relationships', async ({ payload }) => {
        const fiveMovies = await payload.find({
          collection: 'movies',
          depth: 0,
          limit: 5,
          overrideAccess: true,
        })

        const movieIDs = fiveMovies.docs.map((doc) => doc.id)

        const stanley = await payload.create({
          collection: 'directors',
          data: {
            name: 'Stanley Kubrick',
            movies: movieIDs,
          },
          overrideAccess: true,
        })

        expect(stanley.movies).toHaveLength(5)

        const stanleyNeverMadeMovies = await payload.update({
          id: stanley.id,
          collection: 'directors',
          data: {
            movies: null,
          },
          overrideAccess: true,
        })

        expect(stanleyNeverMadeMovies.movies).toHaveLength(0)
      })
    })

    test.describe('Hierarchy', () => {
      test('finds 1 root item with equals', async ({ payload }) => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { equals: null },
          },
          overrideAccess: true,
        })
        expect(count).toBe(1)
        expect(item.text).toBe('root')
      })

      test('finds 1 root item with exists', async ({ payload }) => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { exists: false },
          },
          overrideAccess: true,
        })
        expect(count).toBe(1)
        expect(item.text).toBe('root')
      })

      test('finds 1 sub item with equals', async ({ payload }) => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { not_equals: null },
          },
          overrideAccess: true,
        })
        expect(count).toBe(1)
        expect(item.text).toBe('sub')
      })

      test('finds 1 sub item with exists', async ({ payload }) => {
        const {
          docs: [item],
          totalDocs: count,
        } = await payload.find({
          collection: treeSlug,
          where: {
            parent: { exists: true },
          },
          overrideAccess: true,
        })
        expect(count).toBe(1)
        expect(item.text).toBe('sub')
      })
    })
  })

  test.describe('Writing', () => {
    test.describe('With transactions', () => {
      test('should be able to create filtered relations within a transaction', async ({
        payload,
      }) => {
        const req = {} as PayloadRequest
        req.transactionID = await payload.db.beginTransaction?.()
        const related = await payload.create({
          collection: relationSlug,
          data: {
            name: 'parent',
          },
          req,
          overrideAccess: true,
        })
        const withRelation = await payload.create({
          collection: slug,
          data: {
            filteredRelation: related.id,
          },
          req,
          overrideAccess: true,
        })

        if (req.transactionID) {
          await payload.db.commitTransaction?.(req.transactionID)
        }

        expect(withRelation.filteredRelation.id).toEqual(related.id)
      })
    })

    test.describe('With passing an object', () => {
      test('should create with passing an object', async ({ payload }) => {
        const movie = await payload.create({ collection: 'movies', data: {}, overrideAccess: true })
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
          overrideAccess: true,
        })

        expect(result.many[0]).toStrictEqual(movie)
        expect(result.one).toStrictEqual(movie)
        expect(result.manyPoly[0]).toStrictEqual({ relationTo: 'movies', value: movie })
        expect(result.onePoly).toStrictEqual({ relationTo: 'movies', value: movie })
      })

      test('should update with passing an object', async ({ payload }) => {
        const movie = await payload.create({ collection: 'movies', data: {}, overrideAccess: true })
        const { id } = await payload.create({ collection: 'object-writes', data: {}, overrideAccess: true })
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
          overrideAccess: true,
        })

        expect(result.many[0]).toStrictEqual(movie)
        expect(result.one).toStrictEqual(movie)
        expect(result.manyPoly[0]).toStrictEqual({ relationTo: 'movies', value: movie })
        expect(result.onePoly).toStrictEqual({ relationTo: 'movies', value: movie })
      })

      test('should allow a localized hasMany relationship inside a block', async ({ payload }) => {
        const director1 = await payload.create({
          collection: 'directors',
          data: { name: 'director-1' },
          overrideAccess: true,
        })
        const director2 = await payload.create({
          collection: 'directors',
          data: { name: 'director-2' },
          overrideAccess: true,
        })
        const result = await payload.create({
          collection: 'blocks',
          data: {
            blocks: [
              {
                blockType: 'some',
                directors: [director1.id, director2.id],
              },
            ],
          },
          overrideAccess: true,
        })

        expect(result.blocks[0]?.directors[0].id).toBe(director1.id)
        expect(result.blocks[0]?.directors[1].id).toBe(director2.id)
      })
    })
  })

  test.describe('Polymorphic Relationships', () => {
    test('should allow REST querying on polymorphic relationships', async ({
      payload,
      restClient,
    }) => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
        overrideAccess: true,
      })
      await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphic: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
        overrideAccess: true,
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
    test.options({ db: 'mongo' })(
      'should allow REST all querying on polymorphic relationships',
      async ({ payload, restClient }) => {
        const movie = await payload.create({
          collection: 'movies',
          data: {
            name: 'Pulp Fiction 2',
          },
          overrideAccess: true,
        })
        await payload.create({
          collection: polymorphicRelationshipsSlug,
          data: {
            polymorphic: {
              relationTo: 'movies',
              value: movie.id,
            },
          },
          overrideAccess: true,
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

        expect(queryOne.docs).toHaveLength(1)
      },
    )

    test('should allow querying on polymorphic relationships with an object syntax', async ({
      payload,
    }) => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
        overrideAccess: true,
      })
      await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphic: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
        overrideAccess: true,
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
        overrideAccess: true,
      })

      expect(res.docs).toHaveLength(1)

      const res_2 = await payload.find({
        collection: 'polymorphic-relationships',
        where: {
          polymorphic: {
            equals: {
              relationTo: 'movies',
              value:
                payload.db.idType === 'uuid' || payload.db.idType === 'uuidv7' ? randomUUID() : 99,
            },
          },
        },
        overrideAccess: true,
      })
      expect(res_2.docs).toHaveLength(0)
    })

    test('should allow querying on hasMany polymorphic relationships with an object syntax', async ({
      payload,
    }) => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(id)
    })

    test('should allow querying on localized polymorphic relationships with an object syntax', async ({
      payload,
    }) => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
        overrideAccess: true,
      })

      const { id } = await payload.create({
        collection: polymorphicRelationshipsSlug,
        data: {
          polymorphicLocalized: {
            relationTo: 'movies',
            value: movie.id,
          },
        },
        overrideAccess: true,
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
        overrideAccess: true,
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(id)
    })

    test('should allow querying on hasMany localized polymorphic relationships with an object syntax', async ({
      payload,
    }) => {
      const movie = await payload.create({
        collection: 'movies',
        data: {
          name: 'Pulp Fiction 2',
        },
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
      })

      expect(res.docs).toHaveLength(1)
      expect(res.docs[0].id).toBe(id)
    })

    test('should update document that polymorphicaly joined to another collection', async ({
      payload,
    }) => {
      const item = await payload.create({ collection: 'items', data: { status: 'pending' }, overrideAccess: true })

      await payload.create({
        collection: 'relations',
        data: { item: { relationTo: 'items', value: item } },
        overrideAccess: true,
      })

      const updated = await payload.update({
        collection: 'items',
        data: { status: 'completed' },
        id: item.id,
        overrideAccess: true,
      })

      expect(updated.status).toBe('completed')
    })

    test('should validate the format of text id relationships', async ({ payload }) => {
      await expect(async () =>
        createPost(
          { payload },
          {
            // @ts-expect-error Sending bad data to test error handling
            customIdRelation: 1234,
          },
        ),
      ).rejects.toThrow('The following field is invalid: Custom Id Relation')
    })

    test('should validate the format of number id relationships', async ({ payload }) => {
      await expect(async () =>
        createPost(
          { payload },
          {
            // @ts-expect-error Sending bad data to test error handling
            customIdNumberRelation: 'bad-input',
          },
        ),
      ).rejects.toThrow('The following field is invalid: Custom Id Number Relation')
    })

    test('should query a polymorphic relationship field with mixed custom ids and default', async ({
      payload,
    }) => {
      const customIDNumber = await payload.create({
        collection: 'custom-id-number',
        data: { id: 999 },
        overrideAccess: true,
      })

      const customIDText = await payload.create({
        collection: 'custom-id',
        data: { id: 'custom-id' },
        overrideAccess: true,
      })

      const page = await payload.create({
        collection: 'pages',
        data: {},
        overrideAccess: true,
      })

      const relToCustomIdText = await payload.create({
        collection: 'rels-to-pages-and-custom-text-ids',
        data: {
          rel: {
            relationTo: 'custom-id',
            value: customIDText.id,
          },
        },
        overrideAccess: true,
      })

      const relToCustomIdNumber = await payload.create({
        collection: 'rels-to-pages-and-custom-text-ids',
        data: {
          rel: {
            relationTo: 'custom-id-number',
            value: customIDNumber.id,
          },
        },
        overrideAccess: true,
      })

      const relToPage = await payload.create({
        collection: 'rels-to-pages-and-custom-text-ids',
        data: {
          rel: {
            relationTo: 'pages',
            value: page.id,
          },
        },
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
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
        overrideAccess: true,
      })

      expect(inResult_3.totalDocs).toBe(3)
      expect(inResult_3.docs.some((each) => each.id === relToCustomIdText.id)).toBeTruthy()
      expect(inResult_3.docs.some((each) => each.id === relToCustomIdNumber.id)).toBeTruthy()
      expect(inResult_3.docs.some((each) => each.id === relToPage.id)).toBeTruthy()
    })
  })
})

async function createPost({ payload }: { payload: Payload }, overrides?: Partial<Post>) {
  return payload.create({ collection: slug, data: { title: 'title', ...overrides }, overrideAccess: true })
}
