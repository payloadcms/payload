import type { Payload } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
import { getFileByPath, mapAsync } from 'payload'
import { wait } from 'payload/shared'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Post } from './payload-types.js'

import { idToString } from '../helpers/idToString.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { errorOnHookSlug, pointSlug, relationSlug, slug } from './config.js'

const title = 'title'

let restClient: NextRESTClient
let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('collections-graphql', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('CRUD', () => {
    let existingDoc: Post
    let existingDocGraphQLID

    beforeEach(async () => {
      existingDoc = await createPost()
      existingDocGraphQLID = idToString(existingDoc.id, payload)
    })

    it('should create', async () => {
      const query = `mutation {
          createPost(data: {title: "${title}"}) {
          id
          title
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      const doc: Post = data.createPost

      expect(doc).toMatchObject({ title })
      expect(doc.id).toBeDefined()
    })

    it('should create using graphql variables', async () => {
      const query = `mutation Create($title: String!) {
          createPost(data: {title: $title}) {
          id
          title
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query,
            variables: { title },
          }),
        })
        .then((res) => res.json())

      const doc: Post = data.createPost

      expect(doc).toMatchObject({ title })
      expect(doc.id).toBeDefined()
    })

    it('should read', async () => {
      const query = `query {
        Post(id: ${existingDocGraphQLID}) {
          id
          title
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const doc: Post = data.Post

      expect(doc).toMatchObject({ id: existingDoc.id, title })
    })

    it('should find', async () => {
      const query = `query {
        Posts {
          docs {
            id
            title
          }
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const { docs } = data.Posts

      expect(docs).toContainEqual(expect.objectContaining({ id: existingDoc.id }))
    })

    it('should count', async () => {
      const query = `query {
        countPosts {
          totalDocs
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const { totalDocs } = data.countPosts

      expect(typeof totalDocs).toBe('number')
    })

    it('should read using multiple queries', async () => {
      const query = `query {
          postIDs: Posts {
            docs {
              id
            }
          }
          posts: Posts {
            docs {
              id
              title
            }
          }
          singlePost: Post(id: ${existingDocGraphQLID}) {
            id
            title
          }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const { postIDs, posts, singlePost } = data
      expect(postIDs.docs).toBeDefined()
      expect(posts.docs).toBeDefined()
      expect(singlePost.id).toBeDefined()
    })

    it('should commit or rollback multiple mutations independently', async () => {
      const firstTitle = 'first title'
      const secondTitle = 'second title'
      const first = await payload.create({
        collection: errorOnHookSlug,
        data: {
          errorBeforeChange: true,
          title: firstTitle,
        },
      })
      const second = await payload.create({
        collection: errorOnHookSlug,
        data: {
          errorBeforeChange: true,
          title: secondTitle,
        },
      })

      const updated = 'updated title'

      const query = `mutation {
          createPost(data: {title: "${title}"}) {
              id
              title
            }
          updateFirst: updateErrorOnHook(id: ${idToString(
            first.id,
            payload,
          )}, data: {title: "${updated}"}) {
            title
          }
          updateSecond: updateErrorOnHook(id: ${idToString(
            second.id,
            payload,
          )}, data: {title: "${updated}"}) {
            id
            title
          }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())

      const createdResult = await payload.findByID({
        id: data.createPost.id,
        collection: slug,
      })
      const updateFirstResult = await payload.findByID({
        id: first.id,
        collection: errorOnHookSlug,
      })
      const updateSecondResult = await payload.findByID({
        id: second.id,
        collection: errorOnHookSlug,
      })

      expect(data?.createPost.id).toBeDefined()
      expect(data?.updateFirst).toBeNull()
      expect(data?.updateSecond).toBeNull()

      expect(createdResult).toMatchObject(data.createPost)
      expect(updateFirstResult).toMatchObject(first)
      expect(updateSecondResult).toStrictEqual(second)
    })

    it('should retain payload api', async () => {
      const query = `
        query {
          PayloadApiTestTwos {
            docs {
              id
              payloadAPI
              relation {
                payloadAPI
              }
            }
          }
        }
      `
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const res = data.PayloadApiTestTwos

      expect(res.docs[0].relation.payloadAPI).toStrictEqual('GraphQL')
    })

    it('should have access to headers in resolver', async () => {
      const query = `query {
        ContentTypes {
          docs {
            contentType
          }
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      expect(data.ContentTypes?.docs[0]?.contentType).toEqual('application/json')
    })

    it('should update existing', async () => {
      const updatedTitle = 'updated title'

      const query = `mutation {
        updatePost(id: ${existingDocGraphQLID}, data: { title: "${updatedTitle}"}) {
          id
          title
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({ body: JSON.stringify({ query }) })
        .then((res) => res.json())
      const doc: Post = data.updatePost

      expect(doc).toMatchObject({ id: existingDoc.id, title: updatedTitle })
    })

    it('should delete', async () => {
      const query = `mutation {
        deletePost(id: ${existingDocGraphQLID}) {
          id
          title
        }
      }`
      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({
            query,
          }),
        })
        .then((res) => res.json())
      const doc: Post = data.deletePost

      expect(doc).toMatchObject({ id: existingDoc.id })
    })
  })

  describe('Querying', () => {
    describe('Operators', () => {
      let post1: Post
      let post2: Post

      beforeEach(async () => {
        post1 = await createPost({ title: 'post1' })
        post2 = await createPost({ title: 'post2' })
      })

      it('equals', async () => {
        const query = `query {
          Posts(where:{title: {equals:"${post1.title}"}}) {
            docs {
              id
              title
            }
          }
        }`
        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id, title: post1.title }))
      })

      it('not_equals', async () => {
        const query = `query {
          Posts(where:{title: {not_equals:"${post1.title}"}}) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts
        const docsWithWhereTitleNotEqualPostTitle = docs.filter(
          (post) => post.title === post1.title,
        )

        expect(docsWithWhereTitleNotEqualPostTitle).toHaveLength(0)
      })

      it('like', async () => {
        const postWithWords = await createPost({ title: 'the quick brown fox' })
        const query = `query {
          Posts(where:{title: {like:"${postWithWords.title?.split(' ')[1]}"}}) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs[0]).toMatchObject({ id: postWithWords.id, title: postWithWords.title })
      })

      it('contains', async () => {
        const query = `query {
          Posts(where:{title: {contains:"${post1.title?.slice(0, 4)}"}}) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id, title: post1.title }))
        expect(docs).toContainEqual(expect.objectContaining({ id: post2.id, title: post2.title }))
      })

      it('exists - true', async () => {
        const withDescription = await createPost({ description: 'description' })
        const query = `query {
          Posts(where:{description: {exists:true}}) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(
          expect.objectContaining({ id: withDescription.id, title: withDescription.title }),
        )
      })

      it('exists - false', async () => {
        const withDescription = await createPost({ description: 'description' })
        const query = `query {
          Posts(where:{description: {exists:false}}) {
            docs {
              id
              title
            }
          }
        }`
        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).not.toContainEqual(expect.objectContaining({ id: withDescription.id }))
        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id }))
      })

      describe('numbers', () => {
        let numPost1: Post
        let numPost2: Post

        beforeEach(async () => {
          numPost1 = await createPost({ number: 1 })
          numPost2 = await createPost({ number: 2 })
        })

        it('greater_than', async () => {
          const query = `query {
            Posts(where:{number: {greater_than:1}}) {
              docs {
                id
                title
                number
              }
            }
          }`
          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Posts
          expect(docs.map(({ id }) => id)).toContain(numPost2.id)
        })

        it('greater_than_equal', async () => {
          const query = `query {
            Posts(where:{number: {greater_than_equal:1}}) {
              docs {
                id
                title
              }
            }
          }`
          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Posts

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost1.id }))
          expect(docs).toContainEqual(expect.objectContaining({ id: numPost2.id }))
        })

        it('less_than', async () => {
          const query = `query {
            Posts(where:{number: {less_than:2}}) {
              docs {
                id
                title
              }
            }
          }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Posts

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost1.id }))
        })

        it('less_than_equal', async () => {
          const query = `query {
            Posts(where:{number: {less_than_equal:2}}) {
              docs {
                id
                title
              }
            }
          }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Posts

          expect(docs).toContainEqual(expect.objectContaining({ id: numPost1.id }))
          expect(docs).toContainEqual(expect.objectContaining({ id: numPost2.id }))
        })
      })

      it('or', async () => {
        const query = `query {
          Posts(
            where: {OR: [{ title: { equals: "${post1.title}" } }, { title: { equals: "${post2.title}" } }]
          }) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id }))
        expect(docs).toContainEqual(expect.objectContaining({ id: post2.id }))
      })

      it('or - 1 result', async () => {
        const query = `query {
          Posts(
            where: {OR: [{ title: { equals: "${post1.title}" } }, { title: { equals: "nope" } }]
          }) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(expect.objectContaining({ id: post1.id }))
        expect(docs).not.toContainEqual(expect.objectContaining({ id: post2.id }))
      })

      it('and', async () => {
        const specialPost = await createPost({ description: 'special-123123' })

        const query = `query {
          Posts(
            where: {
              AND: [
                { title: { equals: "${specialPost.title}" } }
                { description: { equals: "${specialPost.description}" } }
              ]
          }) {
            docs {
              id
              title
            }
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(expect.objectContaining({ id: specialPost.id }))
      })

      describe('near', () => {
        const point = [10, 20]
        const [lat, lng] = point

        it('should return a document near a point', async () => {
          if (payload.db.name === 'sqlite') {
            return
          }
          const nearQuery = `
              query {
                Points(
                  where: {
                    point: {
                      near: [${lat + 0.01}, ${lng + 0.01}, 10000]
                    }
                  }
                ) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query: nearQuery }) })
            .then((res) => res.json())
          const { docs } = data.Points

          expect(docs).toHaveLength(1)
        })

        it('should not return a point far away', async () => {
          if (payload.db.name === 'sqlite') {
            return
          }
          const nearQuery = `
              query {
                Points(
                  where: {
                    point: {
                      near: [${lng + 1}, ${lat - 1}, 5000]
                    }
                  }
                ) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query: nearQuery }) })
            .then((res) => res.json())
          const { docs } = data.Points

          expect(docs).toHaveLength(0)
        })

        it('should sort find results by nearest distance', async () => {
          if (payload.db.name === 'sqlite') {
            return
          }
          // creating twice as many records as we are querying to get a random sample
          await mapAsync([...Array(10)], async () => {
            // randomize the creation timestamp
            await wait(Math.random())
            await payload.create({
              collection: pointSlug,
              data: {
                // only randomize longitude to make distance comparison easy
                point: [Math.random(), 0],
              },
            })
          })

          const nearQuery = `
              query {
                Points(
                  where: {
                    point: {
                      near: [0, 0, 100000, 0]
                    }
                  },
                  sort: "point",
                  limit: 5
                ) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query: nearQuery }) })
            .then((res) => res.json())
          const { docs } = data.Points

          let previous = 0
          docs.forEach(({ point: coordinates }) => {
            // The next document point should always be greater than the one before
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
          const query = `
              query {
                Points(
                  where: {
                    point: {
                      within: {
                        type: "Polygon",
                        coordinates: ${JSON.stringify([polygon])}
                      }
                    }
                }) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Points

          expect(docs).toHaveLength(1)
          expect(docs[0].point).toEqual([10, 20])
        })

        it('should not return a document with the point outside the polygon', async () => {
          if (payload.db.name === 'sqlite') {
            return
          }
          const reducedPolygon = polygon.map((vertex) => vertex.map((coord) => coord * 0.1))
          const query = `
              query {
                Points(
                  where: {
                    point: {
                      within: {
                        type: "Polygon",
                        coordinates: ${JSON.stringify([reducedPolygon])}
                      }
                    }
                }) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Points

          expect(docs).toHaveLength(0)
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
          const query = `
              query {
                Points(
                  where: {
                    point: {
                      intersects: {
                        type: "Polygon",
                        coordinates: ${JSON.stringify([polygon])}
                      }
                    }
                }) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Points

          expect(docs).toHaveLength(1)
          expect(docs[0].point).toEqual([10, 20])
        })

        it('should not return a document with the point not intersecting a smaller polygon', async () => {
          if (payload.db.name === 'sqlite') {
            return
          }
          const reducedPolygon = polygon.map((vertex) => vertex.map((coord) => coord * 0.1))
          const query = `
              query {
                Points(
                  where: {
                    point: {
                      within: {
                        type: "Polygon",
                        coordinates: ${JSON.stringify([reducedPolygon])}
                      }
                    }
                }) {
                  docs {
                    id
                    point
                  }
                }
              }`

          const { data } = await restClient
            .GRAPHQL_POST({ body: JSON.stringify({ query }) })
            .then((res) => res.json())
          const { docs } = data.Points

          expect(docs).toHaveLength(0)
        })
      })

      it('can query deeply nested fields within rows, tabs, collapsibles', async () => {
        const withNestedField = await createPost({ D1: { D2: { D3: { D4: 'nested message' } } } })
        const query = `{
          Posts(where: { D1__D2__D3__D4: { equals: "nested message" } }) {
            docs {
              id
              D1 {
                D2 {
                  D3 {
                    D4
                  }
                }
              }
            }
          }
        }`
        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs).toContainEqual(
          expect.objectContaining({
            id: withNestedField.id,
            D1: { D2: { D3: { D4: 'nested message' } } },
          }),
        )
      })
    })

    describe('relationships', () => {
      it('should query on relationships with custom IDs', async () => {
        const query = `query {
          Posts(where: { title: { equals: "has custom ID relation" }}) {
            docs {
              id
              title
              relationToCustomID {
                id
              }
            }
            totalDocs
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs, totalDocs } = data.Posts

        expect(totalDocs).toStrictEqual(1)
        expect(docs[0].relationToCustomID.id).toStrictEqual(1)
      })

      it('should query on relationships with custom IDs - count', async () => {
        const query = `query {
          countPosts(where: { title: { equals: "has custom ID relation" }}) {
            totalDocs
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { totalDocs } = data.countPosts

        expect(totalDocs).toStrictEqual(1)
      })

      it('should query a document with a deleted relationship', async () => {
        const relation = await payload.create({
          collection: relationSlug,
          data: {
            name: 'test',
          },
        })

        await payload.create({
          collection: slug,
          data: {
            relationField: relation.id,
            title: 'has deleted relation',
          },
        })

        await payload.delete({
          id: relation.id,
          collection: relationSlug,
        })

        const query = `query {
          Posts(where: { title: { equals: "has deleted relation" }}) {
            docs {
              id
              title
              relationField {
                id
              }
            }
            totalDocs
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs[0].relationField).toBeFalsy()
      })

      it('should query a document with a deleted relationship hasMany', async () => {
        const relation = await payload.create({
          collection: relationSlug,
          data: {
            name: 'test',
          },
        })

        await payload.create({
          collection: slug,
          data: {
            relationHasManyField: [relation.id],
            title: 'has deleted relation hasMany',
          },
        })

        await payload.delete({
          id: relation.id,
          collection: relationSlug,
        })

        const query = `query {
          Posts(where: { title: { equals: "has deleted relation hasMany" }}) {
            docs {
              id
              title
              relationHasManyField {
                id
              }
            }
            totalDocs
          }
        }`

        const { data } = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())
        const { docs } = data.Posts

        expect(docs[0].relationHasManyField).toHaveLength(0)
      })

      it('should query relationships with locale', async () => {
        const newDoc = await payload.create({
          collection: 'cyclical-relationship',
          data: {
            title: {
              en: 'English title',
              es: 'Spanish title',
            },
          },
          locale: '*',
        })

        await payload.update({
          id: newDoc.id,
          collection: 'cyclical-relationship',
          data: {
            relationToSelf: newDoc.id,
          },
        })

        const query = `query {
          CyclicalRelationships(locale: es) {
            docs {
              title
              relationToSelf {
                title
              }
            }
          }
        }`
        const res = await restClient
          .GRAPHQL_POST({ body: JSON.stringify({ query }) })
          .then((res) => res.json())

        const queriedDoc = res.data.CyclicalRelationships.docs[0]
        expect(queriedDoc.title).toEqual(queriedDoc.relationToSelf.title)
      })
    })
  })

  it('should query correctly with draft argument', async () => {
    const publishValue = '1'
    const draftValue = '2'

    // publish doc
    const newDoc = await payload.create({
      collection: 'cyclical-relationship',
      data: {
        title: publishValue,
      },
      draft: false,
    })

    // create cyclical relationship
    await payload.update({
      id: newDoc.id,
      collection: 'cyclical-relationship',
      data: {
        relationToSelf: newDoc.id,
      },
    })

    // save new version
    await payload.update({
      id: newDoc.id,
      collection: 'cyclical-relationship',
      data: {
        title: draftValue,
      },
      draft: true,
    })

    const draftParentPublishedChild = `{
      CyclicalRelationships(draft: true) {
        docs {
          title
          relationToSelf(draft: false) {
            title
          }
        }
      }
    }`
    const res1 = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({ query: draftParentPublishedChild }),
      })
      .then((res) => res.json())

    const queriedDoc = res1.data.CyclicalRelationships.docs[0]
    expect(queriedDoc.title).toEqual(draftValue)
    expect(queriedDoc.relationToSelf.title).toEqual(publishValue)

    const publishedParentDraftChild = `{
      CyclicalRelationships(draft: false) {
        docs {
          title
          relationToSelf(draft: true) {
            title
          }
        }
      }
    }`
    const res2 = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({ query: publishedParentDraftChild }),
      })
      .then((res) => res.json())

    const queriedDoc2 = res2.data.CyclicalRelationships.docs[0]
    expect(queriedDoc2.title).toEqual(publishValue)
    expect(queriedDoc2.relationToSelf.title).toEqual(draftValue)
  })

  it('should query upload enabled docs', async () => {
    const file = await getFileByPath(path.resolve(dirname, '../uploads/test-image.jpg'))

    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        title: 'example',
      },
      file,
    })

    // doc with upload relation
    const newDoc = await payload.create({
      collection: 'cyclical-relationship',
      data: {
        media: mediaDoc.id,
      },
    })

    const query = `{
      CyclicalRelationship(id: ${typeof newDoc.id === 'number' ? newDoc.id : `"${newDoc.id}"`}) {
        media {
          id
          title
        }
      }
    }`
    const res = await restClient
      .GRAPHQL_POST({
        body: JSON.stringify({ query }),
      })
      .then((res) => res.json())
    const queriedDoc = res.data.CyclicalRelationship
    expect(queriedDoc.media.id).toEqual(mediaDoc.id)
    expect(queriedDoc.media.title).toEqual('example')
  })

  describe('Error Handler', () => {
    it('should return have an array of errors when making a bad request', async () => {
      const query = `query {
          Posts(where: { title: { exists: true }}) {
              docs {
                  badFieldName
              }
          }
      }`
      const { errors } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())
      expect(Array.isArray(errors)).toBe(true)
      expect(typeof errors[0].message).toBe('string')
    })

    it('should return have an array of errors when failing to pass validation', async () => {
      const query = `mutation {
          createPost(data: {min: 1}) {
              id
              min
              createdAt
              updatedAt
          }
      }`

      const { errors } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())
      expect(Array.isArray(errors)).toBe(true)
      expect(errors[0].message).toEqual('The following field is invalid: Min')
      expect(typeof errors[0].locations).toBeDefined()
    })

    it('should return have an array of errors when failing multiple mutations', async () => {
      const query = `mutation createTest {
          test1:createUser(data: { email: "test@test.com", password: "test" }) {
              email
          }

          test2:createUser(data: { email: "test2@test.com", password: "" }) {
              email
          }

          test3:createUser(data: { email: "test@test.com", password: "test" }) {
              email
          }

          test4:createUser(data: { email: "", password: "test" }) {
              email
          }
      }`

      const { errors } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(Array.isArray(errors)).toBe(true)

      expect(Array.isArray(errors[0].locations)).toEqual(true)
      expect(errors[0].message).toEqual('The following field is invalid: password')
      expect(errors[0].path[0]).toEqual('test2')
      expect(errors[0].extensions.name).toEqual('ValidationError')
      expect(errors[0].extensions.data.errors[0].message).toEqual('This field is required.')
      expect(errors[0].extensions.data.errors[0].path).toEqual('password')

      expect(Array.isArray(errors[1].locations)).toEqual(true)
      expect(errors[1].message).toEqual('The following field is invalid: email')
      expect(errors[1].path[0]).toEqual('test3')
      expect(errors[1].extensions.name).toEqual('ValidationError')
      expect(errors[1].extensions.data.errors[0].message).toEqual(
        'A user with the given email is already registered.',
      )
      expect(errors[1].extensions.data.errors[0].path).toEqual('email')

      expect(Array.isArray(errors[2].locations)).toEqual(true)
      expect(errors[2].message).toEqual('The following field is invalid: Email')
      expect(errors[2].path[0]).toEqual('test4')
      expect(errors[2].extensions.name).toEqual('ValidationError')
      expect(errors[2].extensions.data.errors[0].message).toEqual(
        'Please enter a valid email address.',
      )
      expect(errors[2].extensions.data.errors[0].path).toEqual('email')
    })

    it('should return the minimum allowed information about internal errors', async () => {
      let error
      // language=graphQL
      const query = `query {
          QueryWithInternalError {
              text
          }
      }`

      const { errors } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(Array.isArray(errors)).toBe(true)
      expect(Array.isArray(errors[0].locations)).toEqual(true)
      expect(errors[0].message).toEqual('Something went wrong.')
      expect(errors[0].path[0]).toEqual('QueryWithInternalError')
      expect(errors[0].extensions.statusCode).toEqual(500)
      expect(errors[0].extensions.name).toEqual('Error')
    })
  })
})

async function createPost(overrides?: Partial<Post>) {
  const doc = await payload.create({
    collection: slug,
    data: { title: 'title', ...overrides },
  })
  return doc
}
