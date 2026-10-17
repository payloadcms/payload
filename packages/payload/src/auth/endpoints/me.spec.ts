import { describe, expect, it, vi } from 'vitest'

// Intercept meOperation before the module under test imports it
vi.mock('../operations/me.js', () => ({
  meOperation: vi.fn().mockResolvedValue({ user: { id: '1' }, token: 'tok' }),
}))

vi.mock('../../utilities/getRequestEntity.js', () => ({
  getRequestCollection: vi.fn().mockReturnValue({
    config: { auth: { removeTokenFromResponses: false } },
  }),
}))

vi.mock('../extractJWT.js', () => ({ extractJWT: vi.fn().mockReturnValue('tok') }))
vi.mock('../../utilities/headersWithCors.js', () => ({
  headersWithCors: vi.fn().mockReturnValue(new Headers()),
}))
vi.mock('../../utilities/sanitizeJoinParams.js', () => ({ sanitizeJoinParams: vi.fn() }))
vi.mock('../../utilities/sanitizePopulateParam.js', () => ({ sanitizePopulateParam: vi.fn() }))
vi.mock('../../utilities/sanitizeSelectParam.js', () => ({ sanitizeSelectParam: vi.fn() }))

import { meOperation } from '../operations/me.js'
import { meHandler } from './me.js'

const makeReq = (search: string) =>
  ({
    searchParams: new URLSearchParams(search),
    query: {},
    t: (k: string) => k,
    headers: new Headers(),
    payload: { config: {} },
  }) as any

describe('meHandler — searchParams parsing', () => {
  it('passes draft=true when ?draft=true is in searchParams', async () => {
    await meHandler(makeReq('draft=true'), {} as any)
    expect(meOperation).toHaveBeenCalledWith(expect.objectContaining({ draft: true }))
  })

  it('passes draft=false when ?draft is absent', async () => {
    await meHandler(makeReq(''), {} as any)
    expect(meOperation).toHaveBeenCalledWith(expect.objectContaining({ draft: false }))
  })

  it('passes draft=false when only ?depth is present (regression: was reading depth for draft)', async () => {
    await meHandler(makeReq('depth=2'), {} as any)
    expect(meOperation).toHaveBeenCalledWith(expect.objectContaining({ draft: false }))
  })
})
