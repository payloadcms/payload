import type { ImportMap, SanitizedConfig, ServerAdapter } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initReq } from './initReq.server.js'

const { getRequest, payloadInitReq, tanstackServerAdapter } = vi.hoisted(() => ({
  getRequest: vi.fn(),
  payloadInitReq: vi.fn(),
  tanstackServerAdapter: {
    getHeaders: vi.fn(),
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest,
}))

vi.mock('payload', () => ({
  initReq: payloadInitReq,
}))

vi.mock('./serverAdapter.server.js', () => ({
  tanstackServerAdapter,
}))

describe('TanStack Start initReq', () => {
  beforeEach(() => {
    getRequest.mockReturnValue({
      url: 'https://example.com/admin?locale=es',
    })
    payloadInitReq.mockReset().mockResolvedValue({})
  })

  it('should bind the active request URL and default server adapter', async () => {
    const configPromise = Promise.resolve({} as SanitizedConfig)
    const importMap = {} as ImportMap

    await initReq({
      configPromise,
      importMap,
    })

    expect(payloadInitReq).toHaveBeenCalledWith({
      configPromise,
      importMap,
      requestURL: 'https://example.com/admin?locale=es',
      serverAdapter: tanstackServerAdapter,
    })
  })

  it('should allow the page render to override the server adapter', async () => {
    const configPromise = Promise.resolve({} as SanitizedConfig)
    const importMap = {} as ImportMap
    const pageServerAdapter = {
      getHeaders: vi.fn(),
    } as unknown as ServerAdapter

    await initReq({
      configPromise,
      importMap,
      serverAdapter: pageServerAdapter,
    })

    expect(payloadInitReq).toHaveBeenCalledWith({
      configPromise,
      importMap,
      requestURL: 'https://example.com/admin?locale=es',
      serverAdapter: pageServerAdapter,
    })
  })
})
