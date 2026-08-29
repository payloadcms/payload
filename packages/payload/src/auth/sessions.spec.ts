import { describe, expect, it } from 'vitest'

import { addSessionToUser, revokeSession } from './sessions.js'

const validationRequest = { operation: 'validate' } as any
const collectionConfig = { auth: { useSessions: true }, slug: 'users' } as any

describe('session helpers reject writes made through an active validation request', () => {
  it('addSessionToUser should reject before writing a session', async () => {
    await expect(
      addSessionToUser({
        collectionConfig,
        payload: {} as any,
        req: validationRequest,
        user: { id: '1' } as any,
      }),
    ).rejects.toThrow(/not allowed during validation/i)
  })

  it('revokeSession should reject before writing a session', async () => {
    await expect(
      revokeSession({
        collectionConfig,
        payload: {} as any,
        req: validationRequest,
        sid: 'session-id',
        user: { id: '1', sessions: [{ id: 'session-id' }] } as any,
      }),
    ).rejects.toThrow(/not allowed during validation/i)
  })
})
