import { beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('./devConfigReload.server.js', () => ({}))

vi.mock('./serverAdapter.server.js', () => ({
  tanstackServerAdapter,
}))

import { initReq } from './initReq.server.js'

describe('initReq', () => {
  beforeEach(() => {
    getRequest.mockReset().mockReturnValue(new Request('http://localhost/admin?locale=es'))
    payloadInitReq.mockReset().mockResolvedValue({})
  })

  it('should provide the active request URL and default server adapter', async () => {
    const args = {
      configPromise: Promise.resolve({} as never),
      importMap: {},
    }

    await initReq(args)

    expect(payloadInitReq).toHaveBeenCalledWith({
      ...args,
      requestURL: 'http://localhost/admin?locale=es',
      serverAdapter: tanstackServerAdapter,
    })
  })

  it('should forward an explicit server adapter', async () => {
    const serverAdapter = {
      getHeaders: vi.fn(),
    }

    await initReq({
      configPromise: Promise.resolve({} as never),
      importMap: {},
      serverAdapter: serverAdapter as never,
    })

    expect(payloadInitReq).toHaveBeenCalledWith(
      expect.objectContaining({
        serverAdapter,
      }),
    )
  })
})
