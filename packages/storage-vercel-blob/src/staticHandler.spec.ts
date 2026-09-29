import { afterEach, describe, expect, it, vi } from 'vitest'

import { head } from '@vercel/blob'

vi.mock('@vercel/blob', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@vercel/blob')>()),
  head: vi.fn(async () => ({
    contentDisposition: 'inline',
    contentType: 'image/png',
    size: 4,
    uploadedAt: new Date('2026-01-01'),
  })),
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

import { createVercelBlobAdapter } from './adapter.js'

describe('static handler document locations', () => {
  it('should read the checked document without another lookup', async () => {
    const fetchMock = vi.fn(async () => new Response('file'))

    vi.stubGlobal('fetch', fetchMock)
    const adapter = createVercelBlobAdapter({
      access: 'public',
      baseUrl: 'https://example.com',
      cacheControlMaxAge: 60,
      token: 'token',
    })
    const find = vi.fn(async () => ({ docs: [{ prefix: 'database' }] }))
    const generatedAdapter = adapter({
      collection: {
        fields: [],
        slug: 'media',
        upload: {},
      },
      prefix: 'media',
    })
    const doc = {
      id: 'authorized',
      prefix: 'legacy',
    }
    const response = await generatedAdapter.staticHandler(
      {
        headers: new Headers(),
        payload: { find, logger: { error: vi.fn() } },
      } as never,
      {
        doc,
        params: { collection: 'media', filename: 'original.png' },
      },
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('file')
    expect(head).toHaveBeenCalledWith(`https://example.com/legacy/original.png`, { token: 'token' })
    expect(fetchMock).toHaveBeenCalledWith(
      `https://example.com/legacy/original.png?2026-01-01T00:00:00.000Z`,
      expect.any(Object),
    )
    expect(find).not.toHaveBeenCalled()
  })
})
