import type { ComponentType } from 'react'

import type { SerializablePageState } from './Root/types.js'

import { CreateFirstUserView } from './CreateFirstUser/index.js'
import { ForgotPasswordView } from './ForgotPassword/index.js'
import { LoginView } from './Login/index.js'
import { LogoutView } from './Logout/index.js'
import { ResetPasswordView } from './ResetPassword/index.js'
import { UnauthorizedView } from './Unauthorized/index.js'
import { VerifyView } from './Verify/index.js'

type TanStackPageViewComponent = ComponentType<{
  pageState: SerializablePageState
}>

export const getAuthViewByType = (
  viewType: SerializablePageState['viewType'],
): TanStackPageViewComponent | undefined => {
  switch (viewType) {
    case 'createFirstUser':
      return CreateFirstUserView
    case 'forgot':
      return ForgotPasswordView
    case 'inactivity':
    case 'logout':
      return LogoutView
    case 'login':
      return LoginView
    case 'reset':
      return ResetPasswordView
    case 'unauthorized':
      return UnauthorizedView
    case 'verify':
      return VerifyView
    default:
      return undefined
  }
}
