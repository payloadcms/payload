import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type {
  AdminContext,
  ClientConfig,
  CreateClientConfigArgs,
  ImportMap,
  LanguageOptions,
  SanitizedPermissions,
  User,
} from 'payload'

import { applyLocaleFiltering } from 'payload/shared'

import type { Theme } from '../providers/Theme/shared.js'

import { getNavPrefs } from '../elements/Nav/getNavPrefs.js'
import { getClientConfig } from './getClientConfig.js'
import { getLanguageDir } from './getLanguageDir.js'
import { getRequestEmbed } from './getRequestEmbed.js'
import { getRequestHighContrast } from './getRequestHighContrast.js'
import { getRequestTheme } from './getRequestTheme.js'

export type RootLayoutData = {
  clientConfig: ClientConfig
  dateFNSKey: I18nClient['dateFNSKey']
  dir: 'ltr' | 'rtl'
  fallbackLang: AcceptedLanguages
  highContrastMode: boolean
  isEmbedded: boolean
  isNavOpen: boolean
  languageCode: string
  languageOptions: LanguageOptions
  locale?: string
  permissions: SanitizedPermissions
  suppressHydrationWarning: boolean
  theme: Theme
  translations: I18nClient['translations']
  user: null | User
}

type Args = {
  /** Overrides client-config visibility without changing the authenticated user. */
  clientConfigUser?: CreateClientConfigArgs['user']
  context: AdminContext
  importMap: ImportMap
}

export async function getRootLayoutData({
  clientConfigUser,
  context: { cookies, headers, languageCode, permissions, req, user },
  importMap,
}: Args): Promise<RootLayoutData> {
  const { config } = req.payload

  const languageOptions: LanguageOptions = Object.entries(config.i18n.supportedLanguages || {}).map(
    ([language, languageConfig]) => ({
      label: languageConfig.translations.general.thisLanguage,
      value: language as AcceptedLanguages,
    }),
  )

  const navPrefs = await getNavPrefs(req)

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: clientConfigUser === undefined ? user : clientConfigUser,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  return {
    clientConfig,
    dateFNSKey: req.i18n.dateFNSKey,
    dir: getLanguageDir({ languageCode }),
    fallbackLang: config.i18n.fallbackLanguage,
    highContrastMode: getRequestHighContrast({ config, cookies, headers }),
    isEmbedded: getRequestEmbed({ config, cookies }),
    isNavOpen: navPrefs?.open ?? true,
    languageCode,
    languageOptions,
    locale: req.locale ?? undefined,
    permissions,
    suppressHydrationWarning: config.admin?.suppressHydrationWarning ?? false,
    theme: getRequestTheme({ config, cookies, headers }),
    translations: req.i18n.translations,
    user: user ?? null,
  }
}
