import { describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../../types/index.js'

import { canCreateOrUpdateAPIKey } from './canCreateOrUpdateAPIKey.js'

const createRequest = () => {
  const find = vi.fn()

  const req = {
    payload: {
      config: { admin: { user: 'users' } },
      find,
    },
  } as unknown as PayloadRequest

  return { find, req }
}

describe('canCreateOrUpdateAPIKey', () => {
  it('rejects unauthenticated API key writes without querying the admin collection', async () => {
    const { find, req } = createRequest()

    await expect(canCreateOrUpdateAPIKey({ req } as never)).resolves.toBe(false)
    expect(find).not.toHaveBeenCalled()
  })
})
