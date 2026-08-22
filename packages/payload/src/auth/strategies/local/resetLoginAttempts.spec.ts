import { describe, expect, it } from 'vitest'

import { resetLoginAttempts } from './resetLoginAttempts.js'

describe('resetLoginAttempts', () => {
  it('should reject writes made through an active validation request', async () => {
    await expect(
      resetLoginAttempts({
        collection: { slug: 'users' } as any,
        doc: { id: '1', loginAttempts: 3 } as any,
        payload: {} as any,
        req: { operation: 'validate' } as any,
      }),
    ).rejects.toThrow(/not allowed during validation/i)
  })
})
