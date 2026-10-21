import type { useAuth } from '@payloadcms/ui'
import type { MouseEventHandler } from 'react'

import { describe, expect, test } from 'tstyche'

type LogOut = ReturnType<typeof useAuth>['logOut']

describe('auth logout compatibility', () => {
  test('should remain assignable to direct React and DOM event handlers', () => {
    expect<LogOut>().type.toBeAssignableTo<MouseEventHandler<HTMLButtonElement>>()
    expect<LogOut>().type.toBeAssignableTo<EventListener>()
    expect<() => Promise<boolean>>().type.toBeAssignableTo<LogOut>()
  })

  test('should accept no arguments or a server collection fallback', () => {
    expect<LogOut>().type.toBeCallableWith()
    expect<LogOut>().type.toBeCallableWith({ fallbackCollection: 'public-users' })
    expect<LogOut>().type.not.toBeCallableWith({ fallbackCollection: 123 })
  })
})
