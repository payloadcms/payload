import type { ImportMap, LanguageOptions, SanitizedConfig, ServerFunctionClient } from 'payload'

import { defaultTheme, ProgressBar, RootProvider } from '@payloadcms/ui'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { applyLocaleFiltering } from 'payload/shared'
import React from 'react'
import { setCookie } from 'vinxi/http'

import { TanStackRouterProvider } from '../../adapter/RouterProvider.js'
import { getNavPrefs } from '../../utilities/getNavPrefs.js'
import { initReq } from '../../utilities/initReq.js'

import '@payloadcms/ui/scss/app.scss'

type RootLayoutProps = {
  readonly children: React.ReactNode
  readonly config: Promise<SanitizedConfig> | SanitizedConfig
  readonly importMap: ImportMap
  readonly serverFunction: ServerFunctionClient
}

function getRequestTheme(cookies: Map<string, string>, config: SanitizedConfig): 'dark' | 'light' {
  const themeCookie = cookies.get(`${config.cookiePrefix || 'payload'}-theme`)
  if (themeCookie === 'dark' || themeCookie === 'light') {
    return themeCookie
  }
  if (config.admin.theme !== 'all') {
    return config.admin.theme
  }
  return defaultTheme as 'dark' | 'light'
}

export const RootLayout = async ({
  children,
  config: configPromise,
  importMap,
  serverFunction,
}: RootLayoutProps) => {
  const {
    cookies,
    languageCode,
    permissions,
    req,
    req: {
      payload: { config },
    },
  } = await initReq({ config: configPromise, importMap, key: 'RootLayout' })

  const theme = getRequestTheme(cookies, config)

  const languageOptions: LanguageOptions = Object.entries(
    config.i18n.supportedLanguages || {},
  ).reduce<LanguageOptions>((acc, [language, languageConfig]) => {
    if (Object.keys(config.i18n.supportedLanguages).includes(language)) {
      acc.push({
        label: languageConfig.translations.general.thisLanguage,
        value: language,
      })
    }
    return acc
  }, [])

  // eslint-disable-next-line @typescript-eslint/require-await
  const switchLanguageServerAction = async (lang: string): Promise<void> => {
    'use server'
    setCookie(`${config.cookiePrefix || 'payload'}-lng`, lang, { path: '/' })
  }

  const navPrefs = await getNavPrefs(req)

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  return (
    <TanStackRouterProvider>
      <RootProvider
        config={clientConfig}
        dateFNSKey={req.i18n.dateFNSKey}
        fallbackLang={config.i18n.fallbackLanguage}
        isNavOpen={navPrefs?.open ?? true}
        languageCode={languageCode}
        languageOptions={languageOptions}
        locale={req.locale}
        permissions={req.user ? permissions : null}
        serverFunction={serverFunction}
        switchLanguageServerAction={switchLanguageServerAction}
        theme={theme}
        translations={req.i18n.translations}
        user={req.user}
      >
        <ProgressBar />
        {children}
      </RootProvider>
    </TanStackRouterProvider>
  )
}
