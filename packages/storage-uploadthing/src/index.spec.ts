import type { Config, Payload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { uploadthingStorage } from './index.js'

describe('uploadthingStorage deprecation', () => {
  it('should log a deprecation warning mentioning removal in v5 on init', async () => {
    const adapter = uploadthingStorage({
      collections: {
        media: true,
      },
      enabled: false,
      options: {
        token: 'test-token',
      },
    })

    const resultConfig = adapter.init({} as Config)

    expect(resultConfig.onInit).toBeTypeOf('function')

    const warn = vi.fn()
    await resultConfig.onInit!({ logger: { warn } } as unknown as Payload)

    expect(warn).toHaveBeenCalledOnce()

    const warningMessage = warn.mock.calls[0]![0] as string
    expect(warningMessage).toContain('deprecated')
    expect(warningMessage).toContain('v5')
  })

  it('should preserve an existing onInit when wrapping with the deprecation warning', async () => {
    const existingOnInit = vi.fn()

    const adapter = uploadthingStorage({
      collections: {
        media: true,
      },
      enabled: false,
      options: {
        token: 'test-token',
      },
    })

    const warn = vi.fn()
    const resultConfig = adapter.init({ onInit: existingOnInit } as unknown as Config)

    await resultConfig.onInit!({ logger: { warn } } as unknown as Payload)

    expect(warn).toHaveBeenCalledOnce()
    expect(existingOnInit).toHaveBeenCalledOnce()
  })
})
