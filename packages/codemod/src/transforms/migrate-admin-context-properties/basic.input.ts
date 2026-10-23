import type { AdminContext } from 'payload'
import type { InitAdminContextArgs } from 'payload/internal'

import { getRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'
import { initAdminContext } from 'payload/internal'

type LayoutArgs = Pick<AdminContext, 'cookies' | 'headers' | 'languageCode' | 'req'>

type LanguageCode = AdminContext['languageCode']

export async function getLayoutData(args: InitAdminContextArgs) {
  const context = await initAdminContext(args)

  const { cookies, headers, languageCode, permissions, req, user } = context

  const data = await getRootLayoutData({
    cookies,
    headers,
    importMap: args.importMap,
    languageCode,
    permissions,
    req,
    user,
  })

  return { data, userAgent: context.headers.get('user-agent') }
}

export async function getTheme(args: InitAdminContextArgs) {
  const { headers: requestHeaders, languageCode, user } = await initAdminContext(args)

  return { languageCode, theme: requestHeaders.get('sec-ch-prefers-color-scheme'), user }
}

export const getUserAgent = async (args: InitAdminContextArgs) =>
  (await initAdminContext(args)).headers.get('user-agent')

export const getDirection = (context: AdminContext) =>
  context.languageCode === 'ar' ? 'rtl' : 'ltr'

export const getAcceptLanguage = ({ headers }: AdminContext) => headers.get('accept-language')
