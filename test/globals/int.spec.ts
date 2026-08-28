import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import testConfig, {
  accessControlSlug,
  arraySlug,
  defaultValueSlug,
  englishLocale,
  slug,
  spanishLocale,
} from './config.js'

test.suite({ config: testConfig })('globals', () => {
  test.describe('REST', () => {
    test('should create', async ({ restClient }) => {
      const title = 'update'
      const data = {
        title,
      }
      const response = await restClient.POST(`/globals/${slug}`, {
        body: JSON.stringify(data),
      })
      const { result } = await response.json()

      expect(response.status).toEqual(200)
      expect(result).toMatchObject(data)
    })

    test('should read', async ({ restClient }) => {
      const title = 'read'
      const data = {
        title,
      }
      await restClient.POST(`/globals/${slug}`, {
        body: JSON.stringify(data),
      })
      const response = await restClient.GET(`/globals/${slug}`)
      const globalDoc = await response.json()

      expect(response.status).toEqual(200)
      expect(globalDoc.globalType).toEqual(slug)
      expect(globalDoc).toMatchObject(data)
    })

    test('should update with localization', async ({ restClient }) => {
      const array = [
        {
          text: 'one',
        },
      ]

      const response = await restClient.POST(`/globals/${arraySlug}`, {
        body: JSON.stringify({
          array,
        }),
      })
      const { result } = await response.json()

      expect(response.status).toBe(200)
      expect(result.array).toHaveLength(1)
      expect(result.array).toMatchObject(array)
      expect(result.id).toBeDefined()
    })
  })

  test.describe('local', () => {
    test('should save empty json objects', async ({ payload }) => {
      const createdJSON: any = await payload.updateGlobal({
        data: {
          json: {
            state: {},
          },
        },
        slug,
      })

      expect(createdJSON.json.state).toEqual({})
    })

    test('should create', async ({ payload }) => {
      const data = {
        title: 'title',
      }
      const doc = await payload.updateGlobal({
        data,
        slug,
      })
      expect(doc).toMatchObject(data)
    })

    test('should read', async ({ payload }) => {
      const title = 'read'
      const data = {
        title,
      }
      await payload.updateGlobal({
        data,
        slug,
      })
      const doc = await payload.findGlobal({
        slug,
      })

      expect(doc.globalType).toEqual(slug)
      expect(doc).toMatchObject(data)
    })

    test('should update with localization', async ({ payload }) => {
      const localized = {
        en: {
          array: [
            {
              text: 'one',
            },
          ],
        },
        es: {
          array: [
            {
              text: 'uno',
            },
          ],
        },
      }

      await payload.updateGlobal({
        data: {
          array: localized.en.array,
        },
        locale: englishLocale,
        slug: arraySlug,
      })

      await payload.updateGlobal({
        data: {
          array: localized.es.array,
        },
        locale: spanishLocale,
        slug: arraySlug,
      })

      const en = await payload.findGlobal({
        locale: englishLocale,
        slug: arraySlug,
      })

      const es = await payload.findGlobal({
        locale: spanishLocale,
        slug: arraySlug,
      })

      expect(en).toMatchObject(localized.en)
      expect(es).toMatchObject(localized.es)
    })

    test('should return null when user is unauthorised and using findGlobal with disableErrors: true', async ({
      payload,
    }) => {
      const doc = await payload.findGlobal({
        disableErrors: true,
        overrideAccess: false,
        slug: accessControlSlug,
      })

      expect(doc).toBeNull()
    })

    test('should respect valid access query constraint', async ({ payload }) => {
      const emptyGlobal = await payload.findGlobal({
        overrideAccess: false,
        slug: accessControlSlug,
      })

      expect(Object.keys(emptyGlobal)).toHaveLength(0)

      await payload.updateGlobal({
        data: {
          enabled: true,
        },
        slug: accessControlSlug,
      })

      const hasAccess = await payload.findGlobal({
        overrideAccess: false,
        slug: accessControlSlug,
      })

      expect(hasAccess.title).toBeDefined()
    })

    test('should get globals with defaultValues populated before first creation', async ({
      payload,
    }) => {
      const defaultValueGlobal = await payload.findGlobal({
        slug: defaultValueSlug,
      })

      expect(defaultValueGlobal.text).toStrictEqual('test')
      // @ts-expect-error
      expect(defaultValueGlobal.group.text).toStrictEqual('test')
    })
  })

  test.describe('graphql', () => {
    test('should create', async ({ restClient }) => {
      const title = 'graphql-title'
      const query = `mutation {
          updateGlobal(data: {title: "${title}"}) {
          title
        }
      }`

      const { data } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(data.updateGlobal).toMatchObject({ title })
    })

    test('should read', async ({ payload, restClient }) => {
      const data = {
        title: 'updated graphql',
      }
      await payload.updateGlobal({
        data,
        slug,
      })

      const query = `query {
        Global {
          title
        }
      }`

      const { data: queryResult } = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(queryResult.Global).toMatchObject(data)
    })

    test('should not show globals with disabled graphql', async ({ restClient }) => {
      const query = `query {
        WithoutGraphql { __typename }
      }`
      const response = await restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
        })
        .then((res) => res.json())

      expect(response.errors[0].message).toMatch(
        'Cannot query field "WithoutGraphql" on type "Query".',
      )
    })
  })
})
