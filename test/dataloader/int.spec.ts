import type { Payload } from '../../packages/payload/src'

import { getPayload } from '../../packages/payload/src'
import { devUser } from '../credentials'
import { NextRESTClient } from '../helpers/NextRESTClient'
import { startMemoryDB } from '../startMemoryDB'
import configPromise from './config'
import { postDoc } from './config'

let restClient: NextRESTClient
let payload: Payload
let token: string

describe('dataloader', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)

    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    if (loginResult.token) token = loginResult.token
  })

  describe('graphql', () => {
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
        collection: 'relation-a',
        id: relationA.id,
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
              children: [
                {
                  text: '',
                },
              ],
              type: 'relationship',
              value: {
                id: relationB.id,
              },
              relationTo: 'relation-b',
            },
          ],
        },
      })

      const relationANoDepth = await payload.findByID({
        collection: 'relation-a',
        id: relationA.id,
        depth: 0,
      })

      expect(relationANoDepth.relationship).toStrictEqual(relationB.id)

      const relationAWithDepth = await payload.findByID({
        collection: 'relation-a',
        id: relationA.id,
        depth: 4,
      })

      const innerMostRelationship =
        relationAWithDepth.relationship.relationship.richText[1].value.relationship.relationship

      expect(innerMostRelationship).toStrictEqual(relationB.id)
    })
  })
})
