import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PayloadRequest } from '../../types/index.js'

const { meOperationMock } = vi.hoisted(() => ({
  meOperationMock: vi.fn(),
}))

vi.mock('../../utilities/getRequestEntity.js', () => ({
  getRequestCollection: () => ({
    config: {
      auth: {
        removeTokenFromResponses: false,
      },
    },
  }),
}))

vi.mock('../../utilities/headersWithCors.js', () => ({
  headersWithCors: () => new Headers(),
}))

vi.mock('../extractJWT.js', () => ({
  extractJWT: () => 'token',
}))

vi.mock('../operations/me.js', () => ({
  meOperation: meOperationMock,
}))

import { meHandler } from './me.js'

describe('meHandler', () => {
  beforeEach(() => {
    meOperationMock.mockReset()
    meOperationMock.mockResolvedValue({ user: {} })
  })

  it('should read draft from URL search parameters', async () => {
    const req = {
      query: {},
      searchParams: new URLSearchParams('draft=true'),
      t: () => 'account',
    } as unknown as PayloadRequest

    await meHandler(req)

    expect(meOperationMock).toHaveBeenCalledWith(expect.objectContaining({ draft: true }))
  })
})
