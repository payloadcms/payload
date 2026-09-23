import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequest, initPayloadReq, tanstackServerAdapter } = vi.hoisted(() => ({
  getRequest: vi.fn(),
  initPayloadReq: vi.fn(),
  tanstackServerAdapter: {
    getHeaders: vi.fn(),
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest,
}))

vi.mock('payload/internal', () => ({
  initReq: initPayloadReq,
}))

vi.mock('./devConfigReload.server.js', () => ({}))

vi.mock('./serverAdapter.server.js', () => ({
  tanstackServerAdapter,
}))

import { initReq } from './initReq.server.js'

describe('initReq', () => {
  beforeEach(() => {
    getRequest.mockReset().mockReturnValue(new Request('http://localhost/admin?locale=es'))
    initPayloadReq.mockReset().mockResolvedValue({})
  })

  it('should provide the active request URL and default server adapter', async () => {
    const args = {
      configPromise: Promise.resolve({} as never),
      importMap: {},
    }

    await initReq(args)

    expect(initPayloadReq).toHaveBeenCalledWith({
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

    expect(initPayloadReq).toHaveBeenCalledWith(
      expect.objectContaining({
        serverAdapter,
      }),
    )
  })
})
