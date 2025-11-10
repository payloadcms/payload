import type { Access } from 'payload'

/**
 * Internal access function for guest cart access via secret query parameter.
 * Only active when allowGuestCarts is enabled.
 *
 * @param allowGuestCarts - Whether guest cart access is enabled
 * @returns Access function that checks for valid cart secret in query params
 */
export const hasCartSecretAccess = (allowGuestCarts: boolean): Access => {
  return ({ req }) => {
    if (!allowGuestCarts) {
      return false
    }

    const cartSecret = req.query?.secret

    if (!cartSecret || typeof cartSecret !== 'string') {
      return false
    }

    return {
      secret: {
        equals: cartSecret,
      },
    }
  }
}
