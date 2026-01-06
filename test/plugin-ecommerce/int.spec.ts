import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('ecommerce', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
  })

  it('should add a variants collection', async () => {
    const variants = await payload.find({
      collection: 'variants',
      depth: 0,
      limit: 1,
    })

    expect(variants).toBeTruthy()
  })

  describe('guest cart access', () => {
    it('should allow guest users to create carts', async () => {
      // Create a cart without authentication
      const cartResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      expect(cartResponse).toBeTruthy()
      expect(cartResponse.doc.id).toBeTruthy()
      expect(cartResponse.doc.secret).toBeTruthy() // Secret should be returned on creation
    })

    it('should allow access to cart with valid secret', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id
      const cartSecret = createResponse.doc.secret

      // Read the cart with the secret
      const readResponse = await restClient
        .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
        .then((res) => res.json())

      expect(readResponse).toBeTruthy()
      expect(readResponse.id).toBe(cartId)
      expect(readResponse.secret).toBeUndefined() // Secret should NOT be returned on subsequent reads
    })

    it('should allow updating cart with valid secret', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id
      const cartSecret = createResponse.doc.secret

      // Update the cart with the secret
      const updateResponse = await restClient
        .PATCH(`/carts/${cartId}?secret=${cartSecret}`, {
          auth: false,
          body: JSON.stringify({
            purchasedAt: new Date().toISOString(),
          }),
        })
        .then((res) => res.json())

      expect(updateResponse).toBeTruthy()
      expect(updateResponse.doc.id).toBe(cartId)
      expect(updateResponse.doc.purchasedAt).toBeTruthy()
    })

    it('should allow deleting cart with valid secret', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id
      const cartSecret = createResponse.doc.secret

      // Delete the cart with the secret
      const deleteResponse = await restClient
        .DELETE(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
        .then((res) => res.json())

      expect(deleteResponse).toBeTruthy()
    })

    it('should deny access without valid secret', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id

      // Try to read the cart without the secret
      const readResponse = await restClient.GET(`/carts/${cartId}`, { auth: false })

      // Should return 403 Forbidden since access is denied
      expect(readResponse.status).toBe(403)
    })

    it('should deny access with incorrect secret', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id

      // Try to read the cart with an incorrect secret
      const readResponse = await restClient.GET(`/carts/${cartId}?secret=incorrect-secret`, {
        auth: false,
      })

      expect(readResponse.status).toBe(404)
    })

    it('should not expose secret field directly', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id
      const cartSecret = createResponse.doc.secret

      // Try to read only the secret field
      const readResponse = await restClient
        .GET(`/carts/${cartId}?select=secret&secret=${cartSecret}`, { auth: false })
        .then((res) => res.json())

      // Secret should not be included even with select query
      expect(readResponse.secret).toBeUndefined()
    })

    it('should deny creating cart with custom secret', async () => {
      // Try to create a cart with a custom secret
      const createResponse = await restClient.POST('/carts', {
        auth: false,
        body: JSON.stringify({
          items: [],
          secret: 'custom-secret',
        }),
      })

      const result = await createResponse.json()

      // The custom secret should be rejected by field access control
      expect(result.doc.secret).not.toBe('custom-secret')
    })

    it('should deny updating secret field', async () => {
      // Create a cart without authentication
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createResponse.doc.id
      const cartSecret = createResponse.doc.secret

      // Try to update the secret
      const updateResponse = await restClient
        .PATCH(`/carts/${cartId}?secret=${cartSecret}`, {
          auth: false,
          body: JSON.stringify({
            secret: 'new-secret',
          }),
        })
        .then((res) => res.json())

      // Secret should not have been updated
      expect(updateResponse.doc.secret).toBeUndefined()

      // Verify cart is still accessible with original secret
      const verifyResponse = await restClient
        .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
        .then((res) => res.json())

      expect(verifyResponse.id).toBe(cartId)
    })
  })
})
