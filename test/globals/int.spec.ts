import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  accessControlSlug,
  arraySlug,
  defaultValueSlug,
  englishLocale,
  slug,
  spanishLocale,
} from './config.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('globals', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('REST', () => {
    it('should create', async () => {
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

    it('should read', async () => {
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

    it('should update with localization', async () => {
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

  describe('local', () => {
    it('should save empty json objects', async () => {
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

    it('should create', async () => {
      const data = {
        title: 'title',
      }
      const doc = await payload.updateGlobal({
        data,
        slug,
      })
      expect(doc).toMatchObject(data)
    })

    it('should read', async () => {
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

    it('should update with localization', async () => {
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

    it('should respect valid access query constraint', async () => {
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

    it('should get globals with defaultValues populated before first creation', async () => {
      const defaultValueGlobal = await payload.findGlobal({
        slug: defaultValueSlug,
      })

      expect(defaultValueGlobal.text).toStrictEqual('test')
      // @ts-expect-error
      expect(defaultValueGlobal.group.text).toStrictEqual('test')
    })
  })

  describe('graphql', () => {
    it('should create', async () => {
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

    it('should read', async () => {
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

    it('should not show globals with disabled graphql', async () => {
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
