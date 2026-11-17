import type { PayloadRequest } from '../types/index.js'

import { describe, expect, it } from 'vitest'

import { defaultAdminPanelUserAccess } from './defaultAdminPanelUserAccess.js'

const createRequest = ({ user }: { user: { collection: string } | null }): PayloadRequest =>
  ({
    payload: {
      config: {
        admin: {
          user: 'admins',
        },
      },
    },
    user,
  }) as unknown as PayloadRequest

describe('defaultAdminPanelUserAccess', () => {
  it('should return true for a user from the admin auth collection', () => {
    const req = createRequest({
      user: {
        collection: 'admins',
      },
    })

    expect(defaultAdminPanelUserAccess({ req })).toBe(true)
  })

  it('should return false for a user from a non-admin auth collection', () => {
    const req = createRequest({
      user: {
        collection: 'customers',
      },
    })

    expect(defaultAdminPanelUserAccess({ req })).toBe(false)
  })

  it('should return false when there is no authenticated user', () => {
    const req = createRequest({
      user: null,
    })

    expect(defaultAdminPanelUserAccess({ req })).toBe(false)
  })
})
