import { describe, expect, it } from 'vitest'

import { getReorderErrorMessage } from './getReorderErrorMessage.js'

const defaultMessage =
  'Failed to reorder. This can happen if you reorder several rows too quickly. Please try again.'

const jsonResponse = ({ body, status }: { body: unknown; status: number }): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })

describe('getReorderErrorMessage', () => {
  it('should return the error message from the response', async () => {
    const response = jsonResponse({
      body: { errors: [{ message: 'This document is locked' }] },
      status: 400,
    })

    await expect(getReorderErrorMessage({ response })).resolves.toBe('This document is locked')
  })

  it('should return the generic message for internal server errors', async () => {
    const response = jsonResponse({
      body: { errors: [{ message: 'Something went wrong.' }] },
      status: 500,
    })

    await expect(getReorderErrorMessage({ response })).resolves.toBe(defaultMessage)
  })

  it('should return the generic message when the response has no errors array', async () => {
    const response = jsonResponse({
      body: { error: 'docsToMove must be a non-empty array' },
      status: 400,
    })

    await expect(getReorderErrorMessage({ response })).resolves.toBe(defaultMessage)
  })

  it('should return the generic message when the response is not JSON', async () => {
    const response = new Response('Bad Gateway', { status: 502 })

    await expect(getReorderErrorMessage({ response })).resolves.toBe(defaultMessage)
  })
})
