import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Payload } from '../index.js'

import {
  resetOverrideAccessWarnings,
  warnMissingOverrideAccess,
} from './warnMissingOverrideAccess.js'

const createPayload = () => ({ logger: { warn: vi.fn() } }) as unknown as Payload

describe('warnMissingOverrideAccess', () => {
  beforeEach(() => {
    resetOverrideAccessWarnings()
  })

  it('warns naming the operation', () => {
    const payload = createPayload()

    warnMissingOverrideAccess({ operation: 'payload.find', payload })

    expect(payload.logger.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(payload.logger.warn).mock.calls[0]![0]).toContain('payload.find')
    expect(vi.mocked(payload.logger.warn).mock.calls[0]![0]).toContain('overrideAccess')
  })

  it('warns only once per operation', () => {
    const payload = createPayload()

    warnMissingOverrideAccess({ operation: 'payload.find', payload })
    warnMissingOverrideAccess({ operation: 'payload.find', payload })
    warnMissingOverrideAccess({ operation: 'payload.find', payload })

    expect(payload.logger.warn).toHaveBeenCalledTimes(1)
  })

  it('warns separately for a different operation', () => {
    const payload = createPayload()

    warnMissingOverrideAccess({ operation: 'payload.find', payload })
    warnMissingOverrideAccess({ operation: 'payload.create', payload })

    expect(payload.logger.warn).toHaveBeenCalledTimes(2)
  })

  it('warns in production', () => {
    const payload = createPayload()

    vi.stubEnv('NODE_ENV', 'production')
    warnMissingOverrideAccess({ operation: 'payload.find', payload })

    expect(payload.logger.warn).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })
})
