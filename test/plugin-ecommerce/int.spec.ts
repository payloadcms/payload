import path from 'path'
import { type Payload } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import {
  mockState,
  resetMockAdapterOptions,
  resetMockState,
  setMockAdapterOptions,
} from './mockPaymentAdapter.js'

let payload: Payload
let restClient: NextRESTClient

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Helper to create a guest cart with items
async function createGuestCartWithItems(
  client: NextRESTClient,
  productId: string,
  variantId?: string,
) {
  const createResponse = await client
    .POST('/carts', {
      auth: false,
      body: JSON.stringify({
        items: [],
        currency: 'USD',
      }),
    })
    .then((res) => res.json())

  const cartId = createResponse.doc.id
  const cartSecret = createResponse.doc.secret

  // Add an item using the add-item endpoint
  await client
    .POST(`/carts/${cartId}/add-item`, {
      auth: false,
      body: JSON.stringify({
        item: {
          product: productId,
          ...(variantId ? { variant: variantId } : {}),
        },
        quantity: 1,
        secret: cartSecret,
      }),
    })
    .then((res) => res.json())

  return { cartId, cartSecret }
}

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

  it('should only merge plugin translations for supportedLanguages', () => {
    // The shared test buildConfig defaults supportedLanguages to { de, en, es }.
    const supportedLangKeys = Object.keys(payload.config.i18n.supportedLanguages).sort()
    expect(supportedLangKeys).toEqual(['de', 'en', 'es'])

    for (const lang of supportedLangKeys) {
      expect(payload.config.i18n.translations[lang]).toHaveProperty('plugin-ecommerce')
    }

    // Plugin must not pollute non-supported languages (e.g. ar, fr).
    const arTranslations = payload.config.i18n.translations.ar as
      | Record<string, unknown>
      | undefined

    expect(arTranslations?.['plugin-ecommerce']).toBeUndefined()
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

  describe('cart item endpoints', () => {
    let productId: string
    let variantId: string

    beforeAll(async () => {
      // Get an existing product and variant from seed data
      const products = await payload.find({
        collection: 'products',
        limit: 1,
      })
      productId = products.docs[0]?.id as string

      const variants = await payload.find({
        collection: 'variants',
        limit: 1,
      })
      variantId = variants.docs[0]?.id as string
    })

    describe('add-item endpoint', () => {
      it('should add an item to a guest cart', async () => {
        // Create a cart without authentication
        const createResponse = await restClient
          .POST('/carts', {
            auth: false,
            body: JSON.stringify({
              items: [],
              currency: 'USD',
            }),
          })
          .then((res) => res.json())

        const cartId = createResponse.doc.id
        const cartSecret = createResponse.doc.secret

        // Add an item using the endpoint
        const addItemResponse = await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: {
                product: productId,
              },
              quantity: 2,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(addItemResponse.success).toBe(true)
        expect(addItemResponse.message).toBeTruthy()

        // Verify item was added
        const cartResponse = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartResponse.items).toHaveLength(1)
        expect(cartResponse.items[0].quantity).toBe(2)
      })

      it('should add item with variant to cart', async () => {
        const createResponse = await restClient
          .POST('/carts', {
            auth: false,
            body: JSON.stringify({
              items: [],
              currency: 'USD',
            }),
          })
          .then((res) => res.json())

        const cartId = createResponse.doc.id
        const cartSecret = createResponse.doc.secret

        const addItemResponse = await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: {
                product: productId,
                variant: variantId,
              },
              quantity: 1,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(addItemResponse.success).toBe(true)

        const cartResponse = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartResponse.items).toHaveLength(1)
        expect(cartResponse.items[0].variant).toBeTruthy()
      })

      it('should increment quantity when adding same item', async () => {
        const createResponse = await restClient
          .POST('/carts', {
            auth: false,
            body: JSON.stringify({
              items: [],
              currency: 'USD',
            }),
          })
          .then((res) => res.json())

        const cartId = createResponse.doc.id
        const cartSecret = createResponse.doc.secret

        // Add item first time
        await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: { product: productId },
              quantity: 2,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        // Add same item again
        await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: { product: productId },
              quantity: 3,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        const cartResponse = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        // Should have single item with combined quantity
        expect(cartResponse.items).toHaveLength(1)
        expect(cartResponse.items[0].quantity).toBe(5)
      })

      it('should require cart ID to add item', async () => {
        const addItemResponse = await restClient.POST(`/carts/nonexistent-cart-id/add-item`, {
          auth: false,
          body: JSON.stringify({
            item: { product: productId },
            quantity: 1,
            secret: 'any-secret',
          }),
        })

        // Should return 404 or error when cart doesn't exist
        expect(addItemResponse.status).not.toBe(200)
      })

      it('should require product in add item request', async () => {
        const createResponse = await restClient
          .POST('/carts', {
            auth: false,
            body: JSON.stringify({
              items: [],
              currency: 'USD',
            }),
          })
          .then((res) => res.json())

        const cartId = createResponse.doc.id
        const cartSecret = createResponse.doc.secret

        const addItemResponse = await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              quantity: 1,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(addItemResponse.success).toBe(false)
      })
    })

    describe('remove-item endpoint', () => {
      it('should remove an item from cart', async () => {
        const { cartId, cartSecret } = await createGuestCartWithItems(restClient, productId)

        // Get cart to find item ID
        const cartBefore = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartBefore.items).toHaveLength(1)
        const itemId = cartBefore.items[0].id

        // Remove the item
        const removeResponse = await restClient
          .POST(`/carts/${cartId}/remove-item`, {
            auth: false,
            body: JSON.stringify({
              itemID: itemId,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(removeResponse.success).toBe(true)

        // Verify item was removed
        const cartAfter = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartAfter.items).toHaveLength(0)
      })

      it('should fail to remove nonexistent item', async () => {
        const { cartId, cartSecret } = await createGuestCartWithItems(restClient, productId)

        const removeResponse = await restClient
          .POST(`/carts/${cartId}/remove-item`, {
            auth: false,
            body: JSON.stringify({
              itemID: 'nonexistent-item-id',
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(removeResponse.success).toBe(false)
      })
    })

    describe('update-item endpoint', () => {
      it('should update item quantity directly', async () => {
        const { cartId, cartSecret } = await createGuestCartWithItems(restClient, productId)

        const cartBefore = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        const itemId = cartBefore.items[0].id

        // Set quantity to 5
        const updateResponse = await restClient
          .POST(`/carts/${cartId}/update-item`, {
            auth: false,
            body: JSON.stringify({
              itemID: itemId,
              quantity: 5,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(updateResponse.success).toBe(true)

        const cartAfter = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartAfter.items[0].quantity).toBe(5)
      })

      it('should increment item quantity with $inc operator', async () => {
        const { cartId, cartSecret } = await createGuestCartWithItems(restClient, productId)

        const cartBefore = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        const itemId = cartBefore.items[0].id
        const initialQuantity = cartBefore.items[0].quantity

        // Increment by 3
        const updateResponse = await restClient
          .POST(`/carts/${cartId}/update-item`, {
            auth: false,
            body: JSON.stringify({
              itemID: itemId,
              quantity: { $inc: 3 },
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(updateResponse.success).toBe(true)

        const cartAfter = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartAfter.items[0].quantity).toBe(initialQuantity + 3)
      })

      it('should decrement item quantity with $inc operator', async () => {
        // First create a cart with quantity > 1
        const createResponse = await restClient
          .POST('/carts', {
            auth: false,
            body: JSON.stringify({
              items: [],
              currency: 'USD',
            }),
          })
          .then((res) => res.json())

        const cartId = createResponse.doc.id
        const cartSecret = createResponse.doc.secret

        // Add item with quantity 5
        await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: { product: productId },
              quantity: 5,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        const cartBefore = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        const itemId = cartBefore.items[0].id

        // Decrement by 2
        const updateResponse = await restClient
          .POST(`/carts/${cartId}/update-item`, {
            auth: false,
            body: JSON.stringify({
              itemID: itemId,
              quantity: { $inc: -2 },
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(updateResponse.success).toBe(true)

        const cartAfter = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartAfter.items[0].quantity).toBe(3)
      })

      it('should remove item when quantity reaches zero', async () => {
        const { cartId, cartSecret } = await createGuestCartWithItems(restClient, productId)

        const cartBefore = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        const itemId = cartBefore.items[0].id

        // Set quantity to 0
        await restClient
          .POST(`/carts/${cartId}/update-item`, {
            auth: false,
            body: JSON.stringify({
              itemID: itemId,
              quantity: 0,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        const cartAfter = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartAfter.items).toHaveLength(0)
      })
    })

    describe('clear endpoint', () => {
      it('should clear all items from cart', async () => {
        // Create cart with multiple items
        const createResponse = await restClient
          .POST('/carts', {
            auth: false,
            body: JSON.stringify({
              items: [],
              currency: 'USD',
            }),
          })
          .then((res) => res.json())

        const cartId = createResponse.doc.id
        const cartSecret = createResponse.doc.secret

        // Add multiple items
        await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: { product: productId },
              quantity: 2,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        await restClient
          .POST(`/carts/${cartId}/add-item`, {
            auth: false,
            body: JSON.stringify({
              item: { product: productId, variant: variantId },
              quantity: 1,
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        // Verify items exist
        const cartBefore = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartBefore.items.length).toBeGreaterThan(0)

        // Clear the cart
        const clearResponse = await restClient
          .POST(`/carts/${cartId}/clear`, {
            auth: false,
            body: JSON.stringify({
              secret: cartSecret,
            }),
          })
          .then((res) => res.json())

        expect(clearResponse.success).toBe(true)

        // Verify cart is empty
        const cartAfter = await restClient
          .GET(`/carts/${cartId}?secret=${cartSecret}`, { auth: false })
          .then((res) => res.json())

        expect(cartAfter.items).toHaveLength(0)
      })

      it('should fail to clear nonexistent cart', async () => {
        const clearResponse = await restClient.POST(`/carts/nonexistent-cart-id/clear`, {
          auth: false,
          body: JSON.stringify({
            secret: 'any-secret',
          }),
        })

        expect(clearResponse.status).not.toBe(200)
      })
    })
  })

  describe('cart merge endpoint', () => {
    let productId: string
    let variantId: string

    beforeAll(async () => {
      const products = await payload.find({
        collection: 'products',
        limit: 1,
      })
      productId = products.docs[0]?.id as string

      const variants = await payload.find({
        collection: 'variants',
        limit: 1,
      })
      variantId = variants.docs[0]?.id as string
    })

    it('should merge guest cart into user cart', async () => {
      // Create a guest cart with items
      const { cartId: guestCartId, cartSecret } = await createGuestCartWithItems(
        restClient,
        productId,
      )

      // Create a user and log in
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `merge-test-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      // Create a cart for the user with different items
      const userCartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      const userCartId = userCartResponse.doc.id

      // Add different item to user's cart
      await restClient
        .POST(`/carts/${userCartId}/add-item`, {
          body: JSON.stringify({
            item: { product: productId, variant: variantId },
            quantity: 2,
          }),
        })
        .then((res) => res.json())

      // Merge guest cart into user cart
      const mergeResponse = await restClient
        .POST(`/carts/${userCartId}/merge`, {
          body: JSON.stringify({
            sourceCartID: guestCartId,
            sourceSecret: cartSecret,
          }),
        })
        .then((res) => res.json())

      expect(mergeResponse.success).toBe(true)

      // Verify merged cart has all items
      const mergedCart = await restClient.GET(`/carts/${userCartId}`).then((res) => res.json())

      // Should have items from both carts
      expect(mergedCart.items.length).toBeGreaterThanOrEqual(1)
    })

    it('should combine quantities when merging same items', async () => {
      // Create guest cart with product (quantity 3)
      const createResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
            currency: 'USD',
          }),
        })
        .then((res) => res.json())

      const guestCartId = createResponse.doc.id
      const cartSecret = createResponse.doc.secret

      await restClient
        .POST(`/carts/${guestCartId}/add-item`, {
          auth: false,
          body: JSON.stringify({
            item: { product: productId },
            quantity: 3,
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      // Create a user and log in
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `merge-combine-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      // Create user cart with same product (quantity 2)
      const userCartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      const userCartId = userCartResponse.doc.id

      await restClient
        .POST(`/carts/${userCartId}/add-item`, {
          body: JSON.stringify({
            item: { product: productId },
            quantity: 2,
          }),
        })
        .then((res) => res.json())

      // Merge
      await restClient
        .POST(`/carts/${userCartId}/merge`, {
          body: JSON.stringify({
            sourceCartID: guestCartId,
            sourceSecret: cartSecret,
          }),
        })
        .then((res) => res.json())

      // Verify quantities were combined
      const mergedCart = await restClient.GET(`/carts/${userCartId}`).then((res) => res.json())

      const mergedItem = mergedCart.items.find(
        (item: { product: string }) =>
          item.product === productId || (item.product as { id: string })?.id === productId,
      )
      expect(mergedItem.quantity).toBe(5) // 3 + 2
    })

    it('should delete source cart after merge', async () => {
      const { cartId: guestCartId, cartSecret } = await createGuestCartWithItems(
        restClient,
        productId,
      )

      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `merge-delete-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      const userCartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      await restClient
        .POST(`/carts/${userCartResponse.doc.id}/merge`, {
          body: JSON.stringify({
            sourceCartID: guestCartId,
            sourceSecret: cartSecret,
          }),
        })
        .then((res) => res.json())

      // Try to access guest cart - should fail
      const guestCartResponse = await restClient.GET(`/carts/${guestCartId}?secret=${cartSecret}`, {
        auth: false,
      })

      expect(guestCartResponse.status).toBe(404)
    })

    it('should require authentication for merge', async () => {
      const { cartId: guestCartId, cartSecret } = await createGuestCartWithItems(
        restClient,
        productId,
      )

      // Create another guest cart to try to merge into
      const targetCartResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            items: [],
            currency: 'USD',
          }),
        })
        .then((res) => res.json())

      const targetCartId = targetCartResponse.doc.id

      // Try to merge without authentication
      const mergeResponse = await restClient
        .POST(`/carts/${targetCartId}/merge`, {
          auth: false,
          body: JSON.stringify({
            sourceCartID: guestCartId,
            sourceSecret: cartSecret,
          }),
        })
        .then((res) => res.json())

      expect(mergeResponse.success).toBe(false)
      expect(mergeResponse.message).toContain('Authentication required')
    })

    it('should fail merge with invalid source secret', async () => {
      const { cartId: guestCartId } = await createGuestCartWithItems(restClient, productId)

      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `merge-invalid-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      const userCartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      const mergeResponse = await restClient
        .POST(`/carts/${userCartResponse.doc.id}/merge`, {
          body: JSON.stringify({
            sourceCartID: guestCartId,
            sourceSecret: 'invalid-secret',
          }),
        })
        .then((res) => res.json())

      expect(mergeResponse.success).toBe(false)
    })
  })

  describe('authenticated user cart operations', () => {
    let productId: string

    beforeAll(async () => {
      const products = await payload.find({
        collection: 'products',
        limit: 1,
      })
      productId = products.docs[0]?.id as string
    })

    it('should allow authenticated users to access their cart without secret', async () => {
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `auth-cart-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      // Create cart for user
      const cartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      const cartId = cartResponse.doc.id

      // Access cart without secret (authenticated)
      const getResponse = await restClient.GET(`/carts/${cartId}`).then((res) => res.json())

      expect(getResponse.id).toBe(cartId)
    })

    it('should allow authenticated users to add items without secret', async () => {
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `auth-add-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      const cartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      const cartId = cartResponse.doc.id

      // Add item without secret
      const addItemResponse = await restClient
        .POST(`/carts/${cartId}/add-item`, {
          body: JSON.stringify({
            item: { product: productId },
            quantity: 1,
          }),
        })
        .then((res) => res.json())

      expect(addItemResponse.success).toBe(true)
    })

    it('should not generate secret for authenticated user carts', async () => {
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `auth-nosecret-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      const cartResponse = await restClient
        .POST('/carts', {
          body: JSON.stringify({
            items: [],
            currency: 'USD',
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      // Secret should not be returned for authenticated user carts
      expect(cartResponse.doc.secret).toBeUndefined()
    })
  })

  describe('cart transfer to user', () => {
    let productId: string

    beforeAll(async () => {
      const products = await payload.find({
        collection: 'products',
        limit: 1,
      })
      productId = products.docs[0]?.id as string
    })

    it('should allow transferring guest cart to user by updating customer field', async () => {
      // Create guest cart with items
      const { cartId: guestCartId, cartSecret } = await createGuestCartWithItems(
        restClient,
        productId,
      )

      // Create a user
      const testUser = await payload.create({
        collection: 'users',
        data: {
          email: `transfer-${Date.now()}@test.com`,
          password: 'test123',
        },
      })

      // Login as the user
      await restClient.login({
        slug: 'users',
        credentials: {
          email: testUser.email,
          password: 'test123',
        },
      })

      // Transfer the cart by updating customer field
      // Using the secret to access the guest cart for update
      const transferResponse = await restClient
        .PATCH(`/carts/${guestCartId}?secret=${cartSecret}`, {
          auth: false,
          body: JSON.stringify({
            customer: testUser.id,
          }),
        })
        .then((res) => res.json())

      // Customer field may be populated (object) or just ID depending on depth
      const customerId =
        typeof transferResponse.doc.customer === 'object'
          ? transferResponse.doc.customer.id
          : transferResponse.doc.customer
      expect(customerId).toBe(testUser.id)

      // User should now be able to access cart without secret
      const userCartResponse = await restClient
        .GET(`/carts/${guestCartId}`)
        .then((res) => res.json())

      expect(userCartResponse.id).toBe(guestCartId)
      expect(userCartResponse.items).toHaveLength(1)
    })
  })

  describe('payment hooks', () => {
    let productId: string
    const createdCartIds: string[] = []
    const createdOrderIds: string[] = []
    const createdTransactionIds: string[] = []

    beforeAll(async () => {
      const product = await payload.create({
        collection: 'products',
        data: {
          name: 'Hook Test Product',
          inventory: 100,
          priceInUSDEnabled: true,
          priceInUSD: 1999,
        },
      })
      productId = product.id
    })

    afterAll(async () => {
      await payload.delete({ id: productId, collection: 'products' }).catch(() => null)
    })

    afterEach(async () => {
      resetMockState()
      resetMockAdapterOptions()

      for (const id of createdTransactionIds) {
        await payload.delete({ id, collection: 'transactions' }).catch(() => null)
      }
      createdTransactionIds.length = 0

      for (const id of createdOrderIds) {
        await payload.delete({ id, collection: 'orders' }).catch(() => null)
      }
      createdOrderIds.length = 0

      for (const id of createdCartIds) {
        await payload.delete({ id, collection: 'carts' }).catch(() => null)
      }
      createdCartIds.length = 0
    })

    const createCartAndAddProduct = async () => {
      const { cartId, cartSecret } = await createGuestCartWithItems(restClient, productId)
      createdCartIds.push(cartId)
      return { cartId, cartSecret }
    }

    it('should call both plugin-level and adapter-level beforeInitiatePayment hooks', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      const response = await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      if (response.transactionID) {
        createdTransactionIds.push(response.transactionID)
      }

      expect(mockState.pluginBeforeInitiatePayment).toHaveLength(1)
      expect(mockState.adapterBeforeInitiatePayment).toHaveLength(1)
      expect(mockState.pluginBeforeInitiatePayment[0]?.summary.lines[0]?.amount).toBe(1999)
      expect(mockState.adapterBeforeInitiatePayment[0]?.summary.lines[0]?.amount).toBe(1999)
    })

    it('should include hook-appended lines in the summary passed to the adapter', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      setMockAdapterOptions({
        appendLines: [
          { amount: 500, label: 'Shipping', type: 'shipping' },
          { amount: 200, label: 'Tax', type: 'tax' },
        ],
      })

      await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      expect(mockState.initiateCalls).toHaveLength(1)
      const summary = mockState.initiateCalls[0]?.summary
      expect(summary?.lines).toHaveLength(3)
      expect(summary?.lines[0]?.type).toBe('subtotal')
      expect(summary?.lines[0]?.amount).toBe(1999)
      expect(summary?.total).toBe(1999 + 500 + 200)
    })

    it('should pass cumulative lines between hooks in order (plugin then adapter)', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      setMockAdapterOptions({
        appendLines: [{ amount: 300, label: 'Adapter line', type: 'custom' }],
      })

      await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      expect(mockState.pluginBeforeInitiatePayment[0]?.summary.lines).toHaveLength(1)
      expect(mockState.adapterBeforeInitiatePayment[0]?.summary.lines).toHaveLength(1)
      expect(mockState.initiateCalls[0]?.summary.lines).toHaveLength(2)
      expect(mockState.initiateCalls[0]?.summary.total).toBe(1999 + 300)
    })

    it('should abort payment when a beforeInitiatePayment hook throws', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      setMockAdapterOptions({ throwInBeforeInitiatePayment: true })

      const response = await restClient.POST('/payments/mock/initiate', {
        auth: false,
        body: JSON.stringify({
          cartID: cartId,
          customerEmail: 'hooks-test@example.com',
          secret: cartSecret,
        }),
      })

      expect(response.status).toBe(400)
      expect(mockState.initiateCalls).toHaveLength(0)
    })

    it('should call beforeConfirmOrder and afterConfirmOrder hooks', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      const initiateResponse = await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      const confirmResponse = await restClient
        .POST('/payments/mock/confirm-order', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            mockPaymentID: initiateResponse.mockPaymentID,
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      if (confirmResponse.orderID) {
        createdOrderIds.push(confirmResponse.orderID)
      }

      expect(mockState.pluginBeforeConfirmOrder).toHaveLength(1)
      expect(mockState.adapterBeforeConfirmOrder).toHaveLength(1)
      expect(mockState.pluginAfterConfirmOrder).toHaveLength(1)
      expect(mockState.adapterAfterConfirmOrder).toHaveLength(1)
      expect(mockState.pluginAfterConfirmOrder[0]?.orderID).toBe(confirmResponse.orderID)
    })

    it('should abort confirmation when a beforeConfirmOrder hook throws', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      const initiateResponse = await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      setMockAdapterOptions({ throwInBeforeConfirmOrder: true })

      const confirmResponse = await restClient.POST('/payments/mock/confirm-order', {
        auth: false,
        body: JSON.stringify({
          cartID: cartId,
          customerEmail: 'hooks-test@example.com',
          mockPaymentID: initiateResponse.mockPaymentID,
          secret: cartSecret,
        }),
      })

      expect(confirmResponse.status).toBe(400)
      expect(mockState.confirmOrderCalls).toHaveLength(0)
      expect(mockState.pluginAfterConfirmOrder).toHaveLength(0)
    })

    it('should charge subtotal plus 10% adjustment end-to-end and persist the final amount on the order', async () => {
      const cleanProduct = await payload.create({
        collection: 'products',
        data: {
          name: 'Clean Price Product',
          inventory: 100,
          priceInUSDEnabled: true,
          priceInUSD: 10000,
        },
      })
      const cleanProductId = cleanProduct.id

      const quantity = 2
      const expectedSubtotal = 10000 * quantity
      const expectedTax = Math.round(expectedSubtotal * 0.1)
      const expectedTotal = expectedSubtotal + expectedTax

      const createCartResponse = await restClient
        .POST('/carts', {
          auth: false,
          body: JSON.stringify({
            currency: 'USD',
            items: [],
          }),
        })
        .then((res) => res.json())

      const cartId = createCartResponse.doc.id as string
      const cartSecret = createCartResponse.doc.secret as string
      createdCartIds.push(cartId)

      await restClient
        .POST(`/carts/${cartId}/add-item`, {
          auth: false,
          body: JSON.stringify({
            item: { product: cleanProductId },
            quantity,
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      const cartAfterAdd = await payload.findByID({
        id: cartId,
        collection: 'carts',
        overrideAccess: true,
      })
      expect(cartAfterAdd.subtotal).toBe(expectedSubtotal)

      setMockAdapterOptions({ addTenPercentTax: true })

      const initiateResponse = await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'e2e-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      expect(mockState.initiateCalls).toHaveLength(1)
      const summary = mockState.initiateCalls[0]?.summary
      expect(summary?.lines[0]?.type).toBe('subtotal')
      expect(summary?.lines[0]?.amount).toBe(expectedSubtotal)
      expect(summary?.total).toBe(expectedTotal)
      expect(summary?.lines).toHaveLength(2)
      expect(summary?.lines[1]?.type).toBe('tax')
      expect(summary?.lines[1]?.amount).toBe(expectedTax)

      expect(initiateResponse.summary).toBeDefined()
      expect(initiateResponse.summary.total).toBe(expectedTotal)
      expect(initiateResponse.summary.lines).toHaveLength(2)
      expect(initiateResponse.summary.lines[0].type).toBe('subtotal')
      expect(initiateResponse.summary.lines[1].type).toBe('tax')

      const transactions = await payload.find({
        collection: 'transactions',
        depth: 0,
        overrideAccess: true,
        where: {
          'mock.mockPaymentID': { equals: initiateResponse.mockPaymentID },
        },
      })
      const transactionDoc = transactions.docs[0] as { id: string; summary?: any } | undefined
      expect(transactionDoc?.amount).toBe(expectedTotal)
      expect(transactionDoc?.summary).toBeDefined()
      expect(transactionDoc?.summary?.total).toBe(expectedTotal)
      expect(transactionDoc?.summary?.currency).toBe('USD')
      expect(transactionDoc?.summary?.lines).toHaveLength(2)
      expect(transactionDoc?.summary?.lines[0]?.type).toBe('subtotal')
      expect(transactionDoc?.summary?.lines[0]?.amount).toBe(expectedSubtotal)
      expect(transactionDoc?.summary?.lines[1]?.type).toBe('tax')
      expect(transactionDoc?.summary?.lines[1]?.amount).toBe(expectedTax)
      if (transactionDoc?.id) {
        createdTransactionIds.push(transactionDoc.id)
      }

      const confirmResponse = await restClient
        .POST('/payments/mock/confirm-order', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'e2e-test@example.com',
            mockPaymentID: initiateResponse.mockPaymentID,
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      expect(confirmResponse.orderID).toBeTruthy()
      createdOrderIds.push(confirmResponse.orderID)

      expect(confirmResponse.summary).toBeDefined()
      expect(confirmResponse.summary.total).toBe(expectedTotal)
      expect(confirmResponse.summary.lines).toHaveLength(2)
      expect(confirmResponse.summary.lines[0].type).toBe('subtotal')
      expect(confirmResponse.summary.lines[1].type).toBe('tax')

      const order = (await payload.findByID({
        id: confirmResponse.orderID,
        collection: 'orders',
        overrideAccess: true,
      })) as { amount: number; currency: string; summary?: any }

      expect(order.amount).toBe(expectedTotal)
      expect(order.amount).not.toBe(expectedSubtotal)
      expect(order.currency).toBe('USD')
      expect(order.summary).toBeDefined()
      expect(order.summary?.total).toBe(expectedTotal)
      expect(order.summary?.lines).toHaveLength(2)
      expect(order.summary?.lines[0]?.type).toBe('subtotal')
      expect(order.summary?.lines[1]?.type).toBe('tax')

      await payload.delete({ id: cleanProductId, collection: 'products' }).catch(() => null)
    })

    it('should not fail order when an afterConfirmOrder hook throws', async () => {
      const { cartId, cartSecret } = await createCartAndAddProduct()

      const initiateResponse = await restClient
        .POST('/payments/mock/initiate', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      setMockAdapterOptions({ throwInAfterConfirmOrder: true })

      const confirmResponse = await restClient
        .POST('/payments/mock/confirm-order', {
          auth: false,
          body: JSON.stringify({
            cartID: cartId,
            customerEmail: 'hooks-test@example.com',
            mockPaymentID: initiateResponse.mockPaymentID,
            secret: cartSecret,
          }),
        })
        .then((res) => res.json())

      if (confirmResponse.orderID) {
        createdOrderIds.push(confirmResponse.orderID)
      }

      expect(confirmResponse.orderID).toBeTruthy()
      expect(mockState.adapterAfterConfirmOrder).toHaveLength(1)
    })
  })
})
