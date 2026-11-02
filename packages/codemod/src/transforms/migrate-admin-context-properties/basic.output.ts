import type { AdminContext } from 'payload'
import type { InitAdminContextArgs } from 'payload/internal'

import { getRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'
import { initAdminContext } from 'payload/internal'

type LayoutArgs = Pick<AdminContext, 'cookies' | 'req'>

type LanguageCode = AdminContext['req']['i18n']['language']

export async function getLayoutData(args: InitAdminContextArgs) {
  const context = await initAdminContext(args)

  const { cookies, permissions, req, user } = context

  const data = await getRootLayoutData({
    cookies,
    importMap: args.importMap,
    permissions,
    req,
    user,
  })

  return { data, userAgent: context.req.headers.get('user-agent') }
}

export async function getTheme(args: InitAdminContextArgs) {
  const { req: { headers: requestHeaders, i18n: { language: languageCode } }, user } = await initAdminContext(args)

  return { languageCode, theme: requestHeaders.get('sec-ch-prefers-color-scheme'), user }
}

export const getUserAgent = async (args: InitAdminContextArgs) =>
  (await initAdminContext(args)).req.headers.get('user-agent')

export const getDirection = (context: AdminContext) =>
  context.req.i18n.language === 'ar' ? 'rtl' : 'ltr'

export const getAcceptLanguage = ({ req: { headers } }: AdminContext) => headers.get('accept-language')
