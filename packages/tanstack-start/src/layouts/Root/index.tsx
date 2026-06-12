import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type { Theme } from '@payloadcms/ui'
import type {
  ClientConfig,
  LanguageOptions,
  SanitizedPermissions,
  ServerFunctionClient,
  TypedUser,
} from 'payload'

import { rtlLanguages } from '@payloadcms/translations'
import { ProgressBar, RootProvider } from '@payloadcms/ui'
import React from 'react'
import '@payloadcms/ui/scss/app.scss'

import { TanStackRouterAdapter } from '../../elements/RouterAdapter/index.js'

export type RootLayoutData = {
  clientConfig: ClientConfig
  dateFNSKey: I18nClient['dateFNSKey']
  fallbackLang: string
  isNavOpen: boolean
  languageCode: string
  languageOptions: LanguageOptions
  locale?: string
  permissions: SanitizedPermissions
  /**
   * Custom admin provider tree (`config.admin.components.providers`) nested
   * around the router `<Outlet />`. Built unrendered by `getLayoutData`; the
   * layout server function renders it to an RSC payload before it reaches the
   * client. `undefined` when no custom providers are configured.
   */
  providers?: React.ReactNode
  theme: Theme
  translations: I18nClient['translations']
  user: null | TypedUser
}

export type RootLayoutProps = {
  readonly children: React.ReactNode
  readonly data: RootLayoutData
  readonly serverFunction: ServerFunctionClient
}

export function RootLayout({ children, data, serverFunction }: RootLayoutProps) {
  const dir = (rtlLanguages as unknown as string[]).includes(data.languageCode) ? 'RTL' : 'LTR'

  return (
    <html data-theme={data.theme} dir={dir} lang={data.languageCode} suppressHydrationWarning>
      <head>
        <style>{`@layer payload-default, payload;`}</style>
      </head>
      <body>
        <RootProvider
          config={data.clientConfig}
          dateFNSKey={data.dateFNSKey}
          fallbackLang={data.fallbackLang as AcceptedLanguages}
          highContrastMode={false}
          isNavOpen={data.isNavOpen}
          languageCode={data.languageCode}
          languageOptions={data.languageOptions}
          locale={data.locale}
          permissions={(data.user ? data.permissions : null) as unknown as SanitizedPermissions}
          RouterAdapter={TanStackRouterAdapter}
          serverFunction={serverFunction}
          theme={data.theme}
          translations={data.translations}
          user={data.user}
        >
          <ProgressBar />
          {children}
        </RootProvider>
        <div id="portal" />
      </body>
    </html>
  )
}
