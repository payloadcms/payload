import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { describe, suite, test } from '../__helpers/int/vitest.js'
import {
  applicationEndpoint,
  collectionSlug,
  customCorsEndpoint,
  globalEndpoint,
  globalSlug,
  noEndpointsCollectionSlug,
  noEndpointsGlobalSlug,
  rootEndpoint,
} from './shared.js'

suite('Endpoints', { config: './config.ts' }, () => {
  describe('Collections', () => {
    test('should GET a static endpoint', async ({ restClient }) => {
      const response = await restClient.GET(`/${collectionSlug}/say-hello/joe-bloggs`)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.message).toStrictEqual('Hey Joey!')
    })

    test('should GET an endpoint with a parameter', async ({ restClient }) => {
      const name = 'George'
      const response = await restClient.GET(`/${collectionSlug}/say-hello/${name}`)
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.message).toStrictEqual(`Hello ${name}!`)
    })

    test('should POST an endpoint with data', async ({ restClient }) => {
      const params = { name: 'George', age: 29 }
      const response = await restClient.POST(`/${collectionSlug}/whoami`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()
      expect(response.status).toBe(200)
      expect(data.name).toStrictEqual(params.name)
      expect(data.age).toStrictEqual(params.age)
    })

    test('should disable built-in endpoints when false', async ({ restClient }) => {
      const response = await restClient.GET(`/${noEndpointsCollectionSlug}`)
      expect(response.status).toBe(501)
    })
  })

  describe('Globals', () => {
    test('should call custom endpoint', async ({ restClient }) => {
      const params = { globals: 'response' }
      const response = await restClient.POST(`/globals/${globalSlug}/${globalEndpoint}`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(params).toMatchObject(data)
    })
    test('should disable built-in endpoints when false', async ({ restClient }) => {
      const response = await restClient.GET(`/globals/${noEndpointsGlobalSlug}`)
      expect(response.status).toBe(501)
    })
  })

  describe('API', () => {
    test('should call custom endpoint', async ({ restClient }) => {
      const params = { app: 'response' }
      const response = await restClient.POST(`/${applicationEndpoint}`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(params).toMatchObject(data)
    })

    test('should have i18n on req', async ({ restClient }) => {
      const response = await restClient.GET(`/${applicationEndpoint}/i18n`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toStrictEqual('Updated successfully.')
    })
  })

  describe('Root', () => {
    test('should call custom root endpoint', async ({ restClient }) => {
      const params = { root: 'response' }
      const response = await restClient.POST(`/${rootEndpoint}`, {
        body: JSON.stringify(params),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(params).toMatchObject(data)
    })

    test('should call custom OPTIONS endpoint with custom CORS headers', async ({ restClient }) => {
      const response = await restClient.OPTIONS(`/${customCorsEndpoint}`)
      const data = await response.json()

      // Custom OPTIONS handler should be called and return custom response
      expect(response.status).toBe(200)
      expect(data.message).toBe('Custom OPTIONS handler')

      // Custom CORS headers should be present
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://custom-domain.com')
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, GET, OPTIONS')
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('X-Custom-Header')
    })
  })
})
