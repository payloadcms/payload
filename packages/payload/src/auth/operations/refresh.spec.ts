import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  updateOne: vi.fn(),
}))

vi.mock('../../../errors/index.js', () => ({
  APIError: class APIError extends Error {},
  Forbidden: class Forbidden extends Error {
    status = 403
    constructor() {
      super()
      this.name = 'Forbidden'
    }
  },
  NotFound: class NotFound extends Error {},
}))

vi.mock('../../../collections/operations/utilities/buildAfterOperation.js', () => ({
  buildAfterOperation: vi.fn(({ args }) => args),
}))
vi.mock('../../../collections/operations/utilities/buildBeforeOperation.js', () => ({
  buildBeforeOperation: vi.fn(({ args }) => args),
}))
vi.mock('../../../utilities/appendNonTrashedFilter.js', () => ({
  appendNonTrashedFilter: vi.fn(({ where }) => where),
}))
vi.mock('../../../utilities/commitTransaction.js', () => ({
  commitTransaction: vi.fn(),
}))
vi.mock('../../../utilities/initTransaction.js', () => ({
  initTransaction: vi.fn().mockResolvedValue(false),
}))
vi.mock('../../../utilities/killTransaction.js', () => ({
  killTransaction: vi.fn(),
}))
vi.mock('../../applyUserReadAccess.js', () => ({
  applyUserReadAccess: vi.fn(({ user }) => user),
}))
vi.mock('../../getFieldsToSign.js', () => ({
  getFieldsToSign: vi.fn(),
}))
vi.mock('../../jwt.js', () => ({
  jwtSign: vi.fn().mockResolvedValue({ exp: 0, token: 'token' }),
}))
vi.mock('../../sessions.js', () => ({
  removeExpiredSessions: vi.fn((sessions) => sessions),
}))

import { refreshOperation } from './refresh.js'

const makeArgs = (sessions: unknown[]) =>
  ({
    collection: {
      config: {
        auth: {
          disableLocalStrategy: false,
          tokenExpiration: 3600,
          useSessions: true,
        },
        hooks: { afterRefresh: [], refresh: [] },
        slug: 'users',
      },
    },
    req: {
      payload: {
        config: { routes: { graphQL: '/graphql' } },
        db: {
          findOne: mocks.findOne,
          updateOne: mocks.updateOne,
        },
      },
      t: vi.fn(),
      url: 'http://localhost/api/users/refresh-token',
      user: { _sid: 1, collection: 'users', id: 'userId' },
    },
  }) as never

describe('refreshOperation with sessions', () => {
  it('throws Forbidden when the session was revoked after JWT authentication', async () => {
    mocks.findOne.mockResolvedValue({ id: 'userId', sessions: [] })

    await expect(refreshOperation(makeArgs([]))).rejects.toMatchObject({
      name: 'Forbidden',
      status: 403,
    })
    expect(mocks.updateOne).not.toHaveBeenCalled()
  })
})
