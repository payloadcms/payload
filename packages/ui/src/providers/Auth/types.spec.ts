import type { ClientUser, TypedUser } from 'payload'
import { describe, expectTypeOf, it } from 'vitest'

import type { AuthContext } from './types.js'

describe('AuthContext backwards compatibility', () => {
  it('preserves the 3.x auth method return types', () => {
    expectTypeOf<AuthContext['refreshCookieAsync']>().toEqualTypeOf<() => Promise<ClientUser>>()
    expectTypeOf<AuthContext['fetchFullUser']>().toEqualTypeOf<() => Promise<null | TypedUser>>()
  })
})
