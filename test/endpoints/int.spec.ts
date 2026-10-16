import { fileURLToPath } from 'url'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  applicationEndpoint,
  collectionSlug,
  customCorsEndpoint,
  globalEndpoint,
  globalSlug,
  noEndpointsCollectionSlug,
  noEndpointsGlobalSlug,
  rootEndpoint,
  userEndpoint,
} from './shared.js'

test.suite('Endpoints', { config: './config.ts' }, () => {
  test.describe('Collections', () => {
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

  test.describe('Globals', () => {
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

  test.describe('API', () => {
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

  test.describe('Root', () => {
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

  test.describe('Open Graph image', () => {
    test('should ignore description characters beyond the length limit', async ({ restClient }) => {
      // Whitespace collapses when rendered, so any text visible past the first 200 characters
      // would only appear in the image if the description were not clamped
      const clampedDescription = ' '.repeat(200)

      const clampedResponse = await restClient.GET('/og', {
        auth: false,
        query: { description: clampedDescription },
      })
      const overflowingResponse = await restClient.GET('/og', {
        auth: false,
        query: { description: `${clampedDescription}${'Overflow '.repeat(1_000)}` },
      })

      expect(clampedResponse.status).toBe(200)
      expect(overflowingResponse.status).toBe(200)
      expect(overflowingResponse.headers.get('Content-Type')).toBe('image/png')

      const clampedImage = Buffer.from(await clampedResponse.arrayBuffer())
      const overflowingImage = Buffer.from(await overflowingResponse.arrayBuffer())

      expect(overflowingImage.equals(clampedImage)).toBe(true)
    })

    test('should render a description within the length limit intact', async ({ restClient }) => {
      // Dropping the final character changes the image only if the full description is rendered
      const description = 'A normal description that fits well within the length limit.'

      const fullResponse = await restClient.GET('/og', {
        auth: false,
        query: { description },
      })
      const shortenedResponse = await restClient.GET('/og', {
        auth: false,
        query: { description: description.slice(0, -1) },
      })

      expect(fullResponse.status).toBe(200)
      expect(shortenedResponse.status).toBe(200)

      const fullImage = Buffer.from(await fullResponse.arrayBuffer())
      const shortenedImage = Buffer.from(await shortenedResponse.arrayBuffer())

      expect(fullImage.equals(shortenedImage)).toBe(false)
    })
  })

  test.describe('Authentication', () => {
    test('should not authenticate requests to endpoints with disableAuth', async ({
      restClient,
    }) => {
      const { token } = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: devUser.email, password: devUser.password }),
        })
        .then((res) => res.json())
      const headers = { Authorization: `JWT ${token}` }

      const authenticated = await restClient.GET(`/${userEndpoint}`, { headers })
      const withoutAuth = await restClient.GET(`/${userEndpoint}/without-auth`, { headers })

      await expect(authenticated.json()).resolves.toEqual({ email: devUser.email })
      await expect(withoutAuth.json()).resolves.toEqual({ email: null })
    })
  })
})
