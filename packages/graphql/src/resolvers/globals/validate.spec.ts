import type { PayloadRequest, SanitizedGlobalConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { validateResolver } from './validate.js'

const createContext = (validateGlobal: (args: { req: PayloadRequest }) => Promise<unknown>) => ({
  req: {
    locale: 'en',
    payload: {
      config: { localization: false },
      validateGlobal,
    },
  } as unknown as PayloadRequest,
})

describe('globals validateResolver', () => {
  it('isolates transactionID from the shared GraphQL request context', async () => {
    const validateGlobal = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      req.transactionID = 'validate-transaction'
      return { errors: [], valid: true }
    })
    const context = createContext(validateGlobal)
    const globalConfig = { slug: 'settings' } as unknown as SanitizedGlobalConfig

    await validateResolver(globalConfig)(null, { data: { title: 'x' } }, context)

    expect(context.req.transactionID).toBeUndefined()
  })
})
