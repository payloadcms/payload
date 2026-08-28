import type { CollectionSlug } from 'payload'

import { buildDefaultEditorState } from '@payloadcms/richtext-lexical'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { expect, vitest } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import testConfig, { postDoc } from './config.js'

let token: string

test.suite({ config: testConfig })('dataloader', () => {
  test.beforeEach(async ({ payload }) => {
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

  test.describe('graphql', () => {
    test('should allow multiple parallel queries', async ({ restClient }) => {
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

    test('should allow querying via graphql', async ({ restClient }) => {
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

    test('should avoid infinite loops', async ({ payload }) => {
      const relationA = await payload.create({
        collection: 'relation-a',
        data: {
          richText: buildDefaultEditorState({ text: 'relation a' }),
        },
      })

      const relationB = await payload.create({
        collection: 'relation-b',
        data: {
          relationship: relationA.id,
          richText: buildDefaultEditorState({ text: 'relation b' }),
        },
      })

      expect(relationA.id).toBeDefined()
      expect(relationB.id).toBeDefined()

      await payload.update({
        id: relationA.id,
        collection: 'relation-a',
        data: {
          relationship: relationB.id,
          richText: buildDefaultEditorState({
            text: 'relation a',
            nodes: [
              {
                type: 'relationship',
                format: 'left',
                relationTo: 'relation-b',
                value: relationB.id,
                version: 0,
              },
            ],
          }),
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
        relationAWithDepth.relationship.relationship.richText.root.children[1].value.relationship
          .relationship

      expect(innerMostRelationship).toStrictEqual(relationB.id)
    })
  })

  test.describe('find', () => {
    test('should call the same query only once in a request', async ({ payload }) => {
      const req = await createLocalReq({}, payload)
      const spy = vitest.spyOn(payload, 'find')

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
