import type { AdminViewAdapter, AdminViewServerProps, MetaConfig } from 'payload'

import React from 'react'

import { AccountView } from '../Account/index.js'
import { generateAccountMetadata } from '../Account/metadata.js'
import { CreateFirstUserView } from '../CreateFirstUser/index.js'
import { generateCreateFirstUserMetadata } from '../CreateFirstUser/metadata.js'
import { DashboardView } from '../Dashboard/index.js'
import { generateDashboardMetadata } from '../Dashboard/metadata.js'
import { ForgotPasswordView } from '../ForgotPassword/index.js'
import { generateForgotPasswordMetadata } from '../ForgotPassword/metadata.js'
import { LoginView } from '../Login/index.js'
import { generateLoginMetadata } from '../Login/metadata.js'
import { LogoutView } from '../Logout/index.js'
import { generateLogoutMetadata } from '../Logout/metadata.js'
import { NotFoundView } from '../NotFound/index.js'
import { generateNotFoundMetadata } from '../NotFound/metadata.js'
import { ResetPassword as ResetPasswordView } from '../ResetPassword/index.js'
import { generateResetPasswordMetadata } from '../ResetPassword/metadata.js'
import { UnauthorizedView, UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { generateUnauthorizedMetadata } from '../Unauthorized/metadata.js'
import { Verify as VerifyView } from '../Verify/index.js'
import { generateVerifyMetadata } from '../Verify/metadata.js'

const LogoutInactivityView: React.FC<AdminViewServerProps> = (props) => (
  <LogoutView inactivity {...props} />
)

/**
 * Default `AdminViewAdapter` shared by all framework adapters. Each entry pairs a
 * server component with a `MetaConfig`-returning metadata generator. Framework
 * adapters re-export this registry and cast `MetaConfig` → their framework's
 * metadata type at the boundary.
 */
export const defaultAdminViews: AdminViewAdapter<AdminViewServerProps, MetaConfig> = {
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
}
