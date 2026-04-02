import { describe, expect, it } from 'vitest'

describe('tanstackStartAdapter', () => {
  it('should export tanstackStartAdapter function', async () => {
    const { tanstackStartAdapter } = await import('@payloadcms/tanstack-start')
    expect(typeof tanstackStartAdapter).toBe('function')
  })

  it('should return AdminAdapterResult with name and init', async () => {
    const { tanstackStartAdapter } = await import('@payloadcms/tanstack-start')
    const result = tanstackStartAdapter()
    expect(result.name).toBe('tanstack-start')
    expect(typeof result.init).toBe('function')
  })

  it('should export TanStackRouterProvider', async () => {
    const { TanStackRouterProvider } = await import('@payloadcms/tanstack-start')
    expect(typeof TanStackRouterProvider).toBe('function')
  })

  it('should export handleServerFunctions', async () => {
    const { handleServerFunctions } = await import('@payloadcms/tanstack-start')
    expect(typeof handleServerFunctions).toBe('function')
  })

  it('should export initReq', async () => {
    const { initReq } = await import('@payloadcms/tanstack-start')
    expect(typeof initReq).toBe('function')
  })

  it('should export TanStackAdminPage from views', async () => {
    const { TanStackAdminPage } = await import('@payloadcms/tanstack-start/views')
    expect(typeof TanStackAdminPage).toBe('function')
  })

  it('should export getPageState from the views entrypoint', async () => {
    const { getPageState } = await import('@payloadcms/tanstack-start/views/getPageState')
    expect(typeof getPageState).toBe('function')
  })
})
