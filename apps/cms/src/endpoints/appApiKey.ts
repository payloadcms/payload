import type { PayloadRequest } from 'payload'

import crypto from 'node:crypto'

/**
 * Key check of the endpoints for the VgemsAI app's backend (awoz-api), which calls them server to server with
 * `X-API-Key: <APP_API_KEY>`. They use an API key instead of a login because every login must pass two-factor
 * (src/proxy.ts), which a server can't do.
 *
 * Returns the response to send when the request may not continue: 404 while APP_API_KEY is empty, as if the
 * endpoint didn't exist, and 401 for a missing or wrong key. Returns null when the key is right.
 */
export const refuseWithoutAppApiKey = (req: PayloadRequest): null | Response => {
  const apiKey = process.env.APP_API_KEY

  if (!apiKey) {
    return Response.json({ errors: [{ message: 'Not Found' }] }, { status: 404 })
  }

  if (!isSameSecret(req.headers.get('x-api-key') ?? '', apiKey)) {
    return Response.json({ errors: [{ message: 'Invalid API key.' }] }, { status: 401 })
  }

  return null
}

/** Constant-time comparison; hashing first makes both sides the same length */
const isSameSecret = (given: string, expected: string) =>
  crypto.timingSafeEqual(
    crypto.createHash('sha256').update(given).digest(),
    crypto.createHash('sha256').update(expected).digest(),
  )
