import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequest, getPayloadAdminContext, tanstackServerAdapter } = vi.hoisted(() => ({
  getRequest: vi.fn(),
  getPayloadAdminContext: vi.fn(),
  tanstackServerAdapter: {
    getHeaders: vi.fn(),
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest,
}))

vi.mock('payload/internal', () => ({
  getAdminContext: getPayloadAdminContext,
}))

vi.mock('./devConfigReload.server.js', () => ({}))

vi.mock('./serverAdapter.server.js', () => ({
  tanstackServerAdapter,
}))

import { getAdminContext } from './getAdminContext.server.js'

describe('getAdminContext', () => {
  beforeEach(() => {
    getRequest.mockReset().mockReturnValue(new Request('http://localhost/admin?locale=es'))
    getPayloadAdminContext.mockReset().mockResolvedValue({})
  })

  it('should provide the active request URL and default server adapter', async () => {
    const args = {
      configPromise: Promise.resolve({} as never),
      importMap: {},
    }

    await getAdminContext(args)

    expect(getPayloadAdminContext).toHaveBeenCalledWith({
      ...args,
      requestURL: 'http://localhost/admin?locale=es',
      serverAdapter: tanstackServerAdapter,
    })
  })

  it('should forward an explicit server adapter', async () => {
    const serverAdapter = {
      getHeaders: vi.fn(),
    }

    await getAdminContext({
      configPromise: Promise.resolve({} as never),
      importMap: {},
      serverAdapter: serverAdapter as never,
    })

    expect(getPayloadAdminContext).toHaveBeenCalledWith(
      expect.objectContaining({
        serverAdapter,
      }),
    )
  })
})
