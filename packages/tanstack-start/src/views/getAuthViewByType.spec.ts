import { describe, expect, it } from 'vitest'

import { CreateFirstUserView } from './CreateFirstUser/index.js'
import { ForgotPasswordView } from './ForgotPassword/index.js'
import { getAuthViewByType } from './getAuthViewByType'
import { LoginView } from './Login/index.js'
import { LogoutView } from './Logout/index.js'
import { ResetPasswordView } from './ResetPassword/index.js'
import { UnauthorizedView } from './Unauthorized/index.js'
import { VerifyView } from './Verify/index.js'

describe('getAuthViewByType', () => {
  it('should return auth and minimal TanStack view components by view type', () => {
    expect(getAuthViewByType('createFirstUser')).toBe(CreateFirstUserView)
    expect(getAuthViewByType('forgot')).toBe(ForgotPasswordView)
    expect(getAuthViewByType('inactivity')).toBe(LogoutView)
    expect(getAuthViewByType('login')).toBe(LoginView)
    expect(getAuthViewByType('logout')).toBe(LogoutView)
    expect(getAuthViewByType('reset')).toBe(ResetPasswordView)
    expect(getAuthViewByType('unauthorized')).toBe(UnauthorizedView)
    expect(getAuthViewByType('verify')).toBe(VerifyView)
  })

  it('should return undefined for non-auth TanStack view types', () => {
    expect(getAuthViewByType('dashboard')).toBeUndefined()
    expect(getAuthViewByType('document')).toBeUndefined()
    expect(getAuthViewByType('list')).toBeUndefined()
    expect(getAuthViewByType(undefined)).toBeUndefined()
  })
})
