import { describe, expect, it, vi } from 'vitest'

vi.mock('@vercel/blob/client', () => {
  throw new Error('client upload code must not load from the server entry')
})

describe('storage-vercel-blob server entrypoint', () => {
  it('loads the plugin without importing client upload code', async () => {
    const mod = await import('./server.js')

    expect(mod.vercelBlobStorage).toBeTypeOf('function')
  }, 30_000)
})
