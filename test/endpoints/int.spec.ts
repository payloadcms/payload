import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
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

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Endpoints', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
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

    it('should call custom OPTIONS endpoint with custom CORS headers', async () => {
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

  describe('Open Graph image', () => {
    it('should ignore description characters beyond the length limit', async () => {
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

    it('should render a description within the length limit intact', async () => {
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
})
