import { describe, expect, it, vi } from 'vitest'

import { createImagesClient } from './client.js'
import { readBody } from './validation.js'
import { createCloudflareImagesHandler } from './worker.js'

function createBinding() {
  const handle = {
    output: vi.fn(async () => ({
      response: () => new Response('image', { headers: { 'Content-Type': 'image/png' } }),
    })),
    transform: vi.fn(() => handle),
  }

  return {
    info: vi.fn(async () => ({ fileSize: 5, format: 'image/png', height: 30, width: 40 })),
    input: vi.fn(() => handle),
  }
}

function remoteRequest({
  operation = 'transform',
  options = JSON.stringify({ output: { format: 'image/png' }, transforms: [{ width: 100 }] }),
  type = 'image/png',
  token = 'secret',
} = {}) {
  const form = new FormData()

  form.set('file', new File(['image'], 'test.png', { type }))
  form.set('operation', operation)
  form.set('options', options)

  return new Request('https://images.example.com', {
    body: form,
    headers: { Authorization: `Bearer ${token}` },
    method: 'POST',
  })
}

describe('Cloudflare companion Worker protocol', () => {
  it('should reject an incorrect secret before touching Images', async () => {
    const binding = createBinding()
    const handler = createCloudflareImagesHandler({ binding, token: 'secret' })
    const response = await handler(remoteRequest({ token: 'wrong' }))

    expect(response.status).toBe(401)
    expect(binding.input).not.toHaveBeenCalled()
  })

  it('should accept only POST after authentication', async () => {
    const handler = createCloudflareImagesHandler({ binding: createBinding(), token: 'secret' })
    const response = await handler(
      new Request('https://images.example.com', { headers: { Authorization: 'Bearer secret' } }),
    )

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST')
  })

  it.each([
    '{',
    'null',
    JSON.stringify({ output: { format: 'image/svg+xml' }, transforms: [] }),
    JSON.stringify({ output: { format: 'image/png', quality: 101 }, transforms: [] }),
    JSON.stringify({ output: { format: 'image/png' }, transforms: [{ width: 0 }] }),
    JSON.stringify({ output: { format: 'image/png' }, transforms: [{ width: '100' }] }),
    JSON.stringify({
      output: { format: 'image/png' },
      transforms: [{ gravity: { mode: 'box-center', x: 2 } }],
    }),
    JSON.stringify({
      output: { format: 'image/png' },
      transforms: [{ url: 'https://private.example.com' }],
    }),
    JSON.stringify({ output: { format: 'image/png' }, transforms: Array(5).fill({ width: 100 }) }),
  ])(
    'should reject malformed transformation options (%s) before calling Images',
    async (options) => {
      const binding = createBinding()
      const handler = createCloudflareImagesHandler({ binding, token: 'secret' })
      const response = await handler(remoteRequest({ options }))

      expect(response.status).toBe(400)
      expect(binding.input).not.toHaveBeenCalled()
    },
  )

  it('should reject unsupported input types', async () => {
    const binding = createBinding()
    const handler = createCloudflareImagesHandler({ binding, token: 'secret' })
    const response = await handler(remoteRequest({ type: 'image/svg+xml' }))

    expect(response.status).toBe(400)
    expect(binding.input).not.toHaveBeenCalled()
  })

  it('should return image metadata without creating a transformation', async () => {
    const binding = createBinding()
    const handler = createCloudflareImagesHandler({ binding, token: 'secret' })
    const response = await handler(remoteRequest({ operation: 'info' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      fileSize: 5,
      format: 'image/png',
      height: 30,
      width: 40,
    })
    expect(binding.input).not.toHaveBeenCalled()
  })

  it('should hide service error details from remote callers', async () => {
    const binding = createBinding()

    binding.info.mockRejectedValue(new Error('internal details'))
    const handler = createCloudflareImagesHandler({ binding, token: 'secret' })
    const response = await handler(remoteRequest({ operation: 'info' }))

    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('internal details')
  })
})

describe('Cloudflare client boundaries', () => {
  it('should reject a successful HTTP response with an unexpected MIME type', async () => {
    const client = createImagesClient({
      transport: {
        mode: 'remote',
        url: 'https://images.example.com',
        token: 'secret',
        fetch: async () =>
          new Response('<html>error</html>', { headers: { 'Content-Type': 'text/html' } }),
      },
    })

    await expect(
      client.transform({
        file: new File(['image'], 'test.png', { type: 'image/png' }),
        output: { format: 'image/png' },
        req: {} as never,
        transforms: [{ width: 100 }],
      }),
    ).rejects.toThrow('invalid transformation response')
  })

  it('should reject corrupt image dimensions from the remote service', async () => {
    const client = createImagesClient({
      transport: {
        mode: 'remote',
        url: 'https://images.example.com',
        token: 'secret',
        fetch: async () =>
          Response.json({ fileSize: 5, format: 'image/png', height: -1, width: 40 }),
      },
    })

    await expect(
      client.info({
        file: new File(['image'], 'test.png', { type: 'image/png' }),
        req: {} as never,
      }),
    ).rejects.toThrow('positive integer')
  })

  it('should refuse redirects and attach the configured timeout to remote calls', async () => {
    const fetch = vi.fn(async () =>
      Response.json({ fileSize: 5, format: 'image/png', height: 30, width: 40 }),
    )
    const client = createImagesClient({
      transport: {
        mode: 'remote',
        url: 'https://images.example.com',
        token: 'secret',
        timeout: 1234,
        fetch,
      },
    })

    await client.info({
      file: new File(['image'], 'test.png', { type: 'image/png' }),
      req: {} as never,
    })

    expect(fetch).toHaveBeenCalledWith(
      new URL('https://images.example.com'),
      expect.objectContaining({ redirect: 'error', signal: expect.any(AbortSignal) }),
    )
  })

  it('should reject an oversized input before sending it remotely', async () => {
    const fetch = vi.fn()
    const client = createImagesClient({
      transport: { mode: 'remote', url: 'https://images.example.com', token: 'secret', fetch },
    })
    const file = new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'test.png', { type: 'image/png' })

    await expect(client.info({ file, req: {} as never })).rejects.toThrow('20 MiB')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should stop reading and cancel a stream when its actual bytes exceed the limit', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(4))
        controller.enqueue(new Uint8Array(4))
      },
      cancel,
    })

    await expect(readBody({ body, maxBytes: 5 })).rejects.toThrow('byte limit')
    expect(cancel).toHaveBeenCalledOnce()
  })
})
