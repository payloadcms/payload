import type { PayloadTypesShape } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { PayloadSDK } from './index.js'

describe('SDK version arguments', () => {
  it.each(['GET', 'POST', 'PATCH', 'PUT'] as const)(
    'should reject retired arguments before a %s request reaches fetch',
    async (method) => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{}'))
      const sdk = new PayloadSDK({ baseURL: 'https://example.com/api', fetch })

      for (const key of ['draft', 'publishAllLocales', 'unpublishAllLocales']) {
        await expect(
          sdk.request({
            path: '/posts',
            method,
            args: { [key]: false, version: 'published' },
            json: { _status: 'published' },
          }),
        ).rejects.toThrow(`The "${key}" parameter has been removed`)
      }
      expect(fetch).not.toHaveBeenCalled()
    },
  )

  it('should reject retired arguments even when read errors are disabled', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{}'))
    const sdk = new PayloadSDK<PayloadTypesShape>({ baseURL: 'https://example.com/api', fetch })
    const options = {
      id: '1',
      collection: 'posts',
      slug: 'settings',
      disableErrors: true,
      draft: false,
    }

    await expect(sdk.findByID(options)).rejects.toThrow('The "draft" parameter has been removed')
    await expect(sdk.findVersionByID(options)).rejects.toThrow(
      'The "draft" parameter has been removed',
    )
    await expect(sdk.findGlobalVersionByID(options)).rejects.toThrow(
      'The "draft" parameter has been removed',
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should retain disabled errors for missing records', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () => new Response('{}', { status: 404 }))
    const sdk = new PayloadSDK<PayloadTypesShape>({ baseURL: 'https://example.com/api', fetch })
    const options = { id: '1', collection: 'posts', slug: 'settings', disableErrors: true }

    await expect(sdk.findByID(options)).resolves.toBeNull()
    await expect(sdk.findVersionByID(options)).resolves.toBeNull()
    await expect(sdk.findGlobalVersionByID(options)).resolves.toBeNull()
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('should send locale and version selectors to fetch', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{}'))
    const sdk = new PayloadSDK({ baseURL: 'https://example.com/api', fetch })

    await sdk.request({ path: '/posts', method: 'GET', args: { version: 'latest', locale: 'all' } })

    const url = new URL(fetch.mock.calls[0]![0] as string)
    expect(url.searchParams.get('version')).toBe('latest')
    expect(url.searchParams.get('locale')).toBe('all')
    expect(fetch).toHaveBeenCalledOnce()
  })
})
