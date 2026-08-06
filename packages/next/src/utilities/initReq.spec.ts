import type { ImportMap, SanitizedConfig } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initReq } from '@payloadcms/next/server'

const { nextServerAdapter, payloadInitReq } = vi.hoisted(() => ({
  nextServerAdapter: {
    getHeaders: vi.fn(),
  },
  payloadInitReq: vi.fn(),
}))

vi.mock('payload', () => ({
  initReq: payloadInitReq,
}))

vi.mock('../adapters/server.js', () => ({
  nextServerAdapter,
}))

describe('Next initReq', () => {
  beforeEach(() => {
    payloadInitReq.mockReset().mockResolvedValue({})
  })

  it('should bind the Next server adapter and React request cache', async () => {
    const configPromise = Promise.resolve({} as SanitizedConfig)
    const importMap = {} as ImportMap

    await initReq({
      configPromise,
      importMap,
      key: 'RootLayout',
    })

    expect(payloadInitReq).toHaveBeenCalledWith({
      cache: {
        getPartial: expect.any(Function),
        getRequest: expect.any(Function),
      },
      configPromise,
      importMap,
      key: 'RootLayout',
      serverAdapter: nextServerAdapter,
    })
  })
})
