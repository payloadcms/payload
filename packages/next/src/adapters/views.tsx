import type { Metadata } from 'next'
import type { AdminViewAdapterEntry, AdminViewServerProps } from 'payload'
import type React from 'react'

import { AccountView } from '@payloadcms/ui/views/Account'
import { generateAccountMetadata } from '@payloadcms/ui/views/Account/metadata'
import { CreateFirstUserView } from '@payloadcms/ui/views/CreateFirstUser'
import { generateCreateFirstUserMetadata } from '@payloadcms/ui/views/CreateFirstUser/metadata'
import { DashboardView } from '@payloadcms/ui/views/Dashboard'
import { generateDashboardMetadata } from '@payloadcms/ui/views/Dashboard/metadata'
import { ForgotPasswordView } from '@payloadcms/ui/views/ForgotPassword'
import { generateForgotPasswordMetadata } from '@payloadcms/ui/views/ForgotPassword/metadata'
import { LoginView } from '@payloadcms/ui/views/Login'
import { generateLoginMetadata } from '@payloadcms/ui/views/Login/metadata'
import { LogoutView } from '@payloadcms/ui/views/Logout'
import { generateLogoutMetadata } from '@payloadcms/ui/views/Logout/metadata'
import { NotFoundView } from '@payloadcms/ui/views/NotFound'
import { generateNotFoundMetadata } from '@payloadcms/ui/views/NotFound/metadata'
import { ResetPassword as ResetPasswordView } from '@payloadcms/ui/views/ResetPassword'
import { generateResetPasswordMetadata } from '@payloadcms/ui/views/ResetPassword/metadata'
import { UnauthorizedView, UnauthorizedViewWithGutter } from '@payloadcms/ui/views/Unauthorized'
import { generateUnauthorizedMetadata } from '@payloadcms/ui/views/Unauthorized/metadata'
import { Verify as VerifyView } from '@payloadcms/ui/views/Verify'
import { generateVerifyMetadata } from '@payloadcms/ui/views/Verify/metadata'

const LogoutInactivityView: React.FC<AdminViewServerProps> = (props) => (
  <LogoutView inactivity {...props} />
)

// MetaConfig uses DeepClone<Metadata> which strips method signatures, so a direct type assignment
// is not possible — cast through unknown at the boundary.
export const adminViews = {
  account: { Component: AccountView, generateMetadata: generateAccountMetadata },
  createFirstUser: {
    Component: CreateFirstUserView,
    generateMetadata: generateCreateFirstUserMetadata,
  },
  dashboard: { Component: DashboardView, generateMetadata: generateDashboardMetadata },
  forgot: { Component: ForgotPasswordView, generateMetadata: generateForgotPasswordMetadata },
  login: { Component: LoginView, generateMetadata: generateLoginMetadata },
  logout: { Component: LogoutView, generateMetadata: generateLogoutMetadata },
  logoutInactivity: { Component: LogoutInactivityView, generateMetadata: generateLogoutMetadata },
  notFound: { Component: NotFoundView, generateMetadata: generateNotFoundMetadata },
  reset: { Component: ResetPasswordView, generateMetadata: generateResetPasswordMetadata },
  unauthorized: { Component: UnauthorizedView, generateMetadata: generateUnauthorizedMetadata },
  unauthorizedWithGutter: {
    Component: UnauthorizedViewWithGutter,
    generateMetadata: generateUnauthorizedMetadata,
  },
  verify: { Component: VerifyView, generateMetadata: generateVerifyMetadata },
} as unknown as Record<string, AdminViewAdapterEntry<AdminViewServerProps, Metadata>>
