import type { CollectionSlug, Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { devUser } from '../credentials.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { postDoc } from './config.js'

let restClient: NextRESTClient
let payload: Payload
let token: string

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('dataloader', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    if (loginResult.token) {
      token = loginResult.token
    }
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('graphql', () => {
    it('should allow multiple parallel queries', async () => {
      for (let i = 0; i < 100; i++) {
        const query = `
          query {
            Shops {
              docs {
                name
                items {
                  name
                }
              }
            }
            Items {
              docs {
                name
                itemTags {
                  name
                }
              }
            }
          }`
        const { data } = await restClient
          .GRAPHQL_POST({
            body: JSON.stringify({ query }),
            headers: {
              Authorization: `JWT ${token}`,
            },
          })
          .then((res) => res.json())

        const normalizedResponse = JSON.parse(JSON.stringify(data))

        expect(normalizedResponse).toStrictEqual({
          Items: { docs: [{ name: 'item1', itemTags: [{ name: 'tag1' }] }] },
          Shops: { docs: [{ name: 'shop1', items: [{ name: 'item1' }] }] },
        })
      }
    })

    it('should allow querying via graphql', async () => {
      const query = `query {
        Posts {
          docs {
            title
            owner {
              email
            }
          }
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        .then((res) => res.json())

      const { docs } = data.Posts
      expect(docs[0].title).toStrictEqual(postDoc.title)
    })

    it('should avoid infinite loops', async () => {
      const relationA = await payload.create({
        collection: 'relation-a',
        data: {
          richText: [
            {
              children: [
                {
                  text: 'relation a',
                },
              ],
            },
          ],
        },
      })

      const relationB = await payload.create({
        collection: 'relation-b',
        data: {
          relationship: relationA.id,
          richText: [
            {
              children: [
                {
                  text: 'relation b',
                },
              ],
            },
          ],
        },
      })

      expect(relationA.id).toBeDefined()
      expect(relationB.id).toBeDefined()

      await payload.update({
        id: relationA.id,
        collection: 'relation-a',
        data: {
          relationship: relationB.id,
          richText: [
            {
              children: [
                {
                  text: 'relation a',
                },
              ],
            },
            {
              type: 'relationship',
              children: [
                {
                  text: '',
                },
              ],
              relationTo: 'relation-b',
              value: {
                id: relationB.id,
              },
            },
          ],
        },
      })

      const relationANoDepth = await payload.findByID({
        id: relationA.id,
        collection: 'relation-a',
        depth: 0,
      })

      expect(relationANoDepth.relationship).toStrictEqual(relationB.id)

      const relationAWithDepth = await payload.findByID({
        id: relationA.id,
        collection: 'relation-a',
        depth: 4,
      })

      const innerMostRelationship =
        // @ts-expect-error Deep typing not worth doing
        relationAWithDepth.relationship.relationship.richText[1].value.relationship.relationship

      expect(innerMostRelationship).toStrictEqual(relationB.id)
    })
  })

  describe('find', () => {
    it('should call the same query only once in a request', async () => {
      const req = await createLocalReq({}, payload)
      const spy = jest.spyOn(payload, 'find')

      const findArgs = {
        collection: 'items' as CollectionSlug,
        req,
        depth: 0,
        where: {
          name: { exists: true },
        },
      }

      void req.payloadDataLoader.find(findArgs)
      void req.payloadDataLoader.find(findArgs)
      await req.payloadDataLoader.find(findArgs)

      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
