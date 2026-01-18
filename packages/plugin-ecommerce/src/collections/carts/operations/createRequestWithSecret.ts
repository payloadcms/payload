import type { PayloadRequest } from '@ruya.sa/payload'

/**
 * Creates a modified request object with the cart secret injected into context.
 * This allows the access control (hasCartSecretAccess) to properly verify guest cart access.
 *
 * @param req - The original PayloadRequest
 * @param secret - The cart secret to inject
 * @returns A new request object with the secret in context, or the original if no secret
 */
export const createRequestWithSecret = (
  req: PayloadRequest | undefined,
  secret: string | undefined,
): PayloadRequest | undefined => {
  if (!secret || !req) {
    return req
  }

  return {
    ...req,
    context: {
      ...req.context,
      cartSecret: secret,
    },
  } as PayloadRequest
}
