import type { I18nClient } from '@payloadcms/translations'
import type { Metadata } from 'next'
import type {
  AdminViewAdapterEntry,
  AdminViewServerProps,
  ImportMap,
  SanitizedConfig,
} from 'payload'
import type React from 'react'

import { initReq } from '@payloadcms/ui/utilities/initReq'
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
import { renderNotFoundPage } from '@payloadcms/ui/views/NotFound/page'
import { renderRoot } from '@payloadcms/ui/views/Root'
import { UnauthorizedView, UnauthorizedViewWithGutter } from '@payloadcms/ui/views/Unauthorized'
import { generateUnauthorizedMetadata } from '@payloadcms/ui/views/Unauthorized/metadata'
import { Verify as VerifyView } from '@payloadcms/ui/views/Verify'
import { generateVerifyMetadata } from '@payloadcms/ui/views/Verify/metadata'
import { notFound, redirect } from 'next/navigation.js'

import { getNextRequestI18n } from '../utilities/getNextRequestI18n.js'
import { nextServerAdapter } from './server.js'

const boundInitReq: Parameters<typeof renderRoot>[0]['initReq'] = (args) =>
  initReq({ ...args, serverAdapter: nextServerAdapter })

export type GenerateViewMetadata = (args: {
  config: SanitizedConfig
  i18n: I18nClient
  isEditing?: boolean
  params?: { [key: string]: string | string[] }
}) => Promise<Metadata>

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

type PageProps = {
  readonly config: Promise<SanitizedConfig>
  readonly importMap: ImportMap
  readonly params: Promise<{
    segments: string[]
  }>
  readonly searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const RootPage = (props: PageProps) =>
  renderRoot({ ...props, adminViews, initReq: boundInitReq, notFound, redirect })

export const NotFoundPage = (props: PageProps) =>
  renderNotFoundPage({ ...props, initReq: boundInitReq })

export const generateNotFoundViewMetadata = async ({
  config: configPromise,
}: {
  config: Promise<SanitizedConfig> | SanitizedConfig
  params?: { [key: string]: string | string[] }
}): Promise<Metadata> => {
  const config = await configPromise

  const i18n = await getNextRequestI18n({
    config,
  })

  return {
    title: i18n.t('general:notFound'),
  }
}