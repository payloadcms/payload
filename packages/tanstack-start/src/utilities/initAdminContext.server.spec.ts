import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequest, initPayloadAdminContext, tanstackServerAdapter } = vi.hoisted(() => ({
  getRequest: vi.fn(),
  initPayloadAdminContext: vi.fn(),
  tanstackServerAdapter: {
    getHeaders: vi.fn(),
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest,
}))

vi.mock('payload/internal', () => ({
  initAdminContext: initPayloadAdminContext,
}))

vi.mock('./devConfigReload.server.js', () => ({}))

vi.mock('./serverAdapter.server.js', () => ({
  tanstackServerAdapter,
}))

import { initAdminContext } from './initAdminContext.server.js'

describe('initAdminContext', () => {
  beforeEach(() => {
    getRequest.mockReset().mockReturnValue(new Request('http://localhost/admin?locale=es'))
    initPayloadAdminContext.mockReset().mockResolvedValue({})
  })

  it('should provide the active request URL and default server adapter', async () => {
    const args = {
      configPromise: Promise.resolve({} as never),
      importMap: {},
    }

    await initAdminContext(args)

    expect(initPayloadAdminContext).toHaveBeenCalledWith({
      ...args,
      requestURL: 'http://localhost/admin?locale=es',
      serverAdapter: tanstackServerAdapter,
    })
  })

  it('should forward an explicit server adapter', async () => {
    const serverAdapter = {
      getHeaders: vi.fn(),
    }

    await initAdminContext({
      configPromise: Promise.resolve({} as never),
      importMap: {},
      serverAdapter: serverAdapter as never,
    })

    expect(initPayloadAdminContext).toHaveBeenCalledWith(
      expect.objectContaining({
        serverAdapter,
      }),
    )
  })
})
