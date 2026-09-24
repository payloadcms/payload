import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getRequest, createPayloadAdminContext, tanstackServerAdapter } = vi.hoisted(() => ({
  getRequest: vi.fn(),
  createPayloadAdminContext: vi.fn(),
  tanstackServerAdapter: {
    getHeaders: vi.fn(),
  },
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequest,
}))

vi.mock('payload/internal', () => ({
  createAdminContext: createPayloadAdminContext,
}))

vi.mock('./devConfigReload.server.js', () => ({}))

vi.mock('./serverAdapter.server.js', () => ({
  tanstackServerAdapter,
}))

import { createAdminContext } from './createAdminContext.server.js'

describe('createAdminContext', () => {
  beforeEach(() => {
    getRequest.mockReset().mockReturnValue(new Request('http://localhost/admin?locale=es'))
    createPayloadAdminContext.mockReset().mockResolvedValue({})
  })

  it('should provide the active request URL and default server adapter', async () => {
    const args = {
      configPromise: Promise.resolve({} as never),
      importMap: {},
    }

    await createAdminContext(args)

    expect(createPayloadAdminContext).toHaveBeenCalledWith({
      ...args,
      requestURL: 'http://localhost/admin?locale=es',
      serverAdapter: tanstackServerAdapter,
    })
  })

  it('should forward an explicit server adapter', async () => {
    const serverAdapter = {
      getHeaders: vi.fn(),
    }

    await createAdminContext({
      configPromise: Promise.resolve({} as never),
      importMap: {},
      serverAdapter: serverAdapter as never,
    })

    expect(createPayloadAdminContext).toHaveBeenCalledWith(
      expect.objectContaining({
        serverAdapter,
      }),
    )
  })
})
