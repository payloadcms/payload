import { afterEach, describe, expect, it, vi } from 'vitest'

import { processMultipartFormdata } from './index.js'

describe('processMultipartFormdata', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should avoid stream reader context loss in Cloudflare Workers', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })
    expect(navigator.userAgent).toBe('Cloudflare-Workers')

    const formData = new FormData()
    formData.set('email', 'admin@example.com')
    const request = new Request('https://example.com/api/users/login', {
      body: formData,
      method: 'POST',
    })
    const bufferedBody = await request.clone().arrayBuffer()
    const body = request.body

    expect(body).not.toBeNull()
    if (!body) {
      throw new Error('Expected a multipart request body.')
    }

    const getReader = vi.spyOn(body, 'getReader').mockImplementation(() => {
      throw new Error('The stream reader resumed outside the active request context.')
    })
    const arrayBuffer = vi.spyOn(request, 'arrayBuffer').mockResolvedValue(bufferedBody)

    await expect(processMultipartFormdata({ request })).resolves.toMatchObject({
      fields: { email: 'admin@example.com' },
    })
    expect(getReader).not.toHaveBeenCalled()
    expect(arrayBuffer).toHaveBeenCalledOnce()
  })

  it('should preserve multipart streaming outside Cloudflare Workers', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Node.js/24' })

    const formData = new FormData()
    formData.set('email', 'admin@example.com')
    const request = new Request('https://example.com/api/users/login', {
      body: formData,
      method: 'POST',
    })
    const arrayBuffer = vi
      .spyOn(request, 'arrayBuffer')
      .mockRejectedValue(new Error('Expected Payload to stream this request.'))

    await expect(processMultipartFormdata({ request })).resolves.toMatchObject({
      fields: { email: 'admin@example.com' },
    })
    expect(arrayBuffer).not.toHaveBeenCalled()
  })

  it('should preserve multipart file size limits in Cloudflare Workers', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' })

    const formData = new FormData()
    formData.set('file', new Blob(['too large']), 'oversized.txt')
    const request = new Request('https://example.com/api/media', {
      body: formData,
      method: 'POST',
    })

    await expect(
      processMultipartFormdata({
        options: {
          abortOnLimit: true,
          limits: { fileSize: 1 },
          responseOnLimit: 'Test file is too large',
        },
        request,
      }),
    ).rejects.toMatchObject({
      message: 'Test file is too large',
      status: 413,
    })
  })
})
