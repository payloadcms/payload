import type { Metadata } from 'next'
import type {
  AdminViewAdapterEntry,
  AdminViewServerProps,
  GenerateMetadataDescriptor,
} from 'payload'
import type React from 'react'

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

import { formatNextMetadata } from '../utilities/meta.js'

const LogoutInactivityView: React.FC<AdminViewServerProps> = (props) => (
  <LogoutView inactivity {...props} />
)

const formatDashboardMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateDashboardMetadata(args))

const formatCreateFirstUserMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateCreateFirstUserMetadata(args))

const formatLoginMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateLoginMetadata(args))

const formatForgotPasswordMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateForgotPasswordMetadata(args))

const formatLogoutMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateLogoutMetadata(args))

const formatResetPasswordMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateResetPasswordMetadata(args))

const formatUnauthorizedMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateUnauthorizedMetadata(args))

const formatNotFoundMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateNotFoundMetadata(args))

const formatVerifyMetadata = async (
  args: Parameters<GenerateMetadataDescriptor>[0],
): Promise<Metadata> => formatNextMetadata(await generateVerifyMetadata(args))

export const adminViews: Record<string, AdminViewAdapterEntry<AdminViewServerProps, Metadata>> = {
  createFirstUser: {
    Component: CreateFirstUserView,
    generateMetadata: formatCreateFirstUserMetadata,
  },
  dashboard: {
    Component: DashboardView,
    generateMetadata: formatDashboardMetadata,
  },
  forgot: {
    Component: ForgotPasswordView,
    generateMetadata: formatForgotPasswordMetadata,
  },
  login: {
    Component: LoginView,
    generateMetadata: formatLoginMetadata,
  },
  logout: {
    Component: LogoutView,
    generateMetadata: formatLogoutMetadata,
  },
  logoutInactivity: {
    Component: LogoutInactivityView,
    generateMetadata: formatLogoutMetadata,
  },
  notFound: {
    Component: NotFoundView,
    generateMetadata: formatNotFoundMetadata,
  },
  reset: {
    Component: ResetPasswordView,
    generateMetadata: formatResetPasswordMetadata,
  },
  unauthorized: {
    Component: UnauthorizedView,
    generateMetadata: formatUnauthorizedMetadata,
  },
  unauthorizedWithGutter: {
    Component: UnauthorizedViewWithGutter,
    generateMetadata: formatUnauthorizedMetadata,
  },
  verify: {
    Component: VerifyView,
    generateMetadata: formatVerifyMetadata,
  },
}
