import { GraphQLClient } from 'graphql-request'

import payload from '../../packages/payload/src'
import { initPayloadTest } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import configPromise, {
  accessControlSlug,
  arraySlug,
  defaultValueSlug,
  englishLocale,
  slug,
  spanishLocale,
} from './config'

describe('globals', () => {
  let serverURL
  beforeAll(async () => {
    const init = await initPayloadTest({ __dirname, init: { local: false } })
    serverURL = init.serverURL
  })
  describe('REST', () => {
    let client: RESTClient
    beforeAll(async () => {
      const config = await configPromise
      client = new RESTClient(config, { defaultSlug: slug, serverURL })
    })
    it('should create', async () => {
      const title = 'update'
      const data = {
        title,
      }
      const { doc, status } = await client.updateGlobal({ data })

      expect(status).toEqual(200)
      expect(doc).toMatchObject(data)
    })

    it('should read', async () => {
      const title = 'read'
      const data = {
        title,
      }
      await client.updateGlobal({ data })
      const { doc, status } = await client.findGlobal()

      expect(status).toEqual(200)
      expect(doc.globalType).toEqual(slug)
      expect(doc).toMatchObject(data)
    })

    it('should update with localization', async () => {
      const array = [
        {
          text: 'one',
        },
      ]

      const { doc, status } = await client.updateGlobal({
        data: {
          array,
        },
        slug: arraySlug,
      })

      expect(status).toBe(200)
      expect(doc.array).toHaveLength(1)
      expect(doc.array).toMatchObject(array)
      expect(doc.id).toBeDefined()
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
      // @ts-ignore
      expect(defaultValueGlobal.group.text).toStrictEqual('test')
    })
  })

  describe('graphql', () => {
    let client: GraphQLClient
    beforeAll(async () => {
      const config = await configPromise
      const url = `${serverURL}${config.routes.api}${config.routes.graphQL}`
      client = new GraphQLClient(url)
    })

    it('should create', async () => {
      const title = 'graphql-title'
      const query = `mutation {
          updateGlobal(data: {title: "${title}"}) {
          title
        }
      }`

      const response = await client.request(query)
      const doc = response.updateGlobal

      expect(doc).toMatchObject({ title })
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

      const response = await client.request(query)
      const doc = response.Global

      expect(doc).toMatchObject(data)
    })

    it('should not show globals with disabled graphql', async () => {
      const query = `query {
        WithoutGraphql { __typename }
      }`

      await expect(client.request(query)).rejects.toHaveProperty('message')
    })
  })
})
