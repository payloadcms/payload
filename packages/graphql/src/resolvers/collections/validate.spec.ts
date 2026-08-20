import type { Collection, PayloadRequest } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { validateResolver } from './validate.js'

const createContext = (validate: (args: { req: PayloadRequest }) => Promise<unknown>) => ({
  req: {
    locale: 'en',
    payload: {
      config: { localization: false },
      validate,
    },
  } as unknown as PayloadRequest,
})

describe('collections validateResolver', () => {
  it('isolates transactionID from the shared GraphQL request context', async () => {
    const validate = vi.fn(async ({ req }: { req: PayloadRequest }) => {
      req.transactionID = 'validate-transaction'
      return { errors: [], valid: true }
    })
    const context = createContext(validate)
    const collection = { config: { slug: 'posts' } } as unknown as Collection

    await validateResolver(collection)(null, { data: { title: 'x' } }, context)

    expect(context.req.transactionID).toBeUndefined()
  })
})
