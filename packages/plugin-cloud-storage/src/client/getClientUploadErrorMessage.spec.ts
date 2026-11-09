import { describe, expect, it } from 'vitest'

import { getClientUploadErrorMessage } from './getClientUploadErrorMessage.js'

describe('getClientUploadErrorMessage', () => {
  it('should return the message from a Payload error response', async () => {
    const response = Response.json(
      { errors: [{ message: 'SVG and XML files must be uploaded through Payload.' }] },
      { status: 400 },
    )

    await expect(getClientUploadErrorMessage(response, 'fallback')).resolves.toBe(
      'SVG and XML files must be uploaded through Payload.',
    )
  })

  it('should join multiple messages', async () => {
    const response = Response.json(
      { errors: [{ message: 'First.' }, { message: 'Second.' }] },
      { status: 400 },
    )

    await expect(getClientUploadErrorMessage(response, 'fallback')).resolves.toBe('First., Second.')
  })

  it('should return the fallback for a non-JSON response', async () => {
    const response = new Response('<html>Bad Gateway</html>', { status: 502 })

    await expect(getClientUploadErrorMessage(response, 'fallback')).resolves.toBe('fallback')
  })

  it('should return the fallback when the body has no messages', async () => {
    const response = Response.json({ errors: [{}] }, { status: 400 })

    await expect(getClientUploadErrorMessage(response, 'fallback')).resolves.toBe('fallback')
  })
})
