import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import {
  applicationEndpoint,
  collectionSlug,
  globalEndpoint,
  globalSlug,
  noEndpointsCollectionSlug,
  noEndpointsGlobalSlug,
  rootEndpoint,
} from './shared.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Endpoints', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  describe('Collections', () => {
    it('should GET a static endpoint', async () => {
      const response = await restClient.GET(`/${collectionSlug}/say-hello/joe-bloggs`)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.message).toStrictEqual('Hey Joey!')
    })

    it('should GET an endpoint with a parameter', async () => {
      const name = 'George'
      const response = await restClient.GET(`/${collectionSlug}/say-hello/${name}`)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.message).toStrictEqual(`Hello ${name}!`)
    })

    it('should POST an endpoint with data', async () => {
      const params = { name: 'George', age: 29 }
      const response = await restClient.POST(`/${collectionSlug}/whoami`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.name).toStrictEqual(params.name)
      expect(data.age).toStrictEqual(params.age)
    })

    it('should disable built-in endpoints when false', async () => {
      const response = await restClient.GET(`/${noEndpointsCollectionSlug}`)
      expect(response.status).toBe(501)
    })
  })

  describe('Globals', () => {
    it('should call custom endpoint', async () => {
      const params = { globals: 'response' }
      const response = await restClient.POST(`/globals/${globalSlug}/${globalEndpoint}`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(params).toMatchObject(data)
    })
    it('should disable built-in endpoints when false', async () => {
      const response = await restClient.GET(`/globals/${noEndpointsGlobalSlug}`)
      expect(response.status).toBe(501)
    })
  })

  describe('API', () => {
    it('should call custom endpoint', async () => {
      const params = { app: 'response' }
      const response = await restClient.POST(`/${applicationEndpoint}`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(params).toMatchObject(data)
    })

    it('should have i18n on req', async () => {
      const response = await restClient.GET(`/${applicationEndpoint}/i18n`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toStrictEqual('Updated successfully.')
    })
  })

  describe('Root', () => {
    it('should call custom root endpoint', async () => {
      const params = { root: 'response' }
      const response = await restClient.POST(`/${rootEndpoint}`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(params).toMatchObject(data)
    })
  })
})
