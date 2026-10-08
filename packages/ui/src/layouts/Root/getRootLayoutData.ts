import type { AcceptedLanguages, I18nClient } from '@payloadcms/translations'
import type {
  AdminContext,
  ClientConfig,
  ImportMap,
  LanguageOptions,
  SanitizedPermissions,
  User,
} from 'payload'

import { applyLocaleFiltering } from 'payload/shared'

import type { Theme } from '../../providers/Theme/shared.js'
import type { RequestThemeSource } from '../../utilities/getRequestTheme.js'

import { getNavPrefs } from '../../elements/Nav/getNavPrefs.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getLanguageDir } from '../../utilities/getLanguageDir.js'
import { getRequestEmbed } from '../../utilities/getRequestEmbed.js'
import { getRequestHighContrast } from '../../utilities/getRequestHighContrast.js'
import { getRequestTheme } from '../../utilities/getRequestTheme.js'

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
  permissions: null | SanitizedPermissions
  suppressHydrationWarning: boolean
  theme: Theme
  /** The request input used to resolve the theme. */
  themeSource: RequestThemeSource
  translations: I18nClient['translations']
  user: null | User
}

type Args = {
  importMap: ImportMap
} & Pick<AdminContext, 'cookies' | 'permissions' | 'req' | 'user'>

export async function getRootLayoutData({
  cookies,
  importMap,
  permissions,
  req,
  user,
}: Args): Promise<RootLayoutData> {
  const {
    headers,
    i18n: { language: languageCode },
    payload: { config },
  } = req

  const { theme, themeSource } = getRequestTheme({ config, cookies, headers })

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
    user,
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
    permissions: user ? permissions : null,
    suppressHydrationWarning:
      config.admin.theme === 'all' || Boolean(config.admin.suppressHydrationWarning),
    theme,
    themeSource,
    translations: req.i18n.translations,
    user: user ?? null,
  }
}
