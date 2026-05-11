import type { AcceptedLanguages } from '@payloadcms/translations'
import type { ImportMap, LanguageOptions, SanitizedConfig } from 'payload'

import { getNavPrefs } from '@payloadcms/ui/elements/Nav/getNavPrefs'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { applyLocaleFiltering } from 'payload/shared'

import type { RootLayoutData } from './index.js'

import { getRequestTheme } from '../../utilities/getRequestTheme.js'
import { initReq } from '../../utilities/initReq.server.js'

export type GetLayoutDataArgs = {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
}

/**
 * Fetches all data needed by the root admin layout.
 * Call this in your TanStack Start root route loader.
 */
export async function getLayoutData({
  configPromise,
  importMap,
}: GetLayoutDataArgs): Promise<RootLayoutData> {
  const {
    cookies,
    headers,
    languageCode,
    permissions,
    req,
    req: {
      payload: { config },
    },
  } = await initReq({ configPromise, importMap })

  const theme = getRequestTheme({ config, cookies, headers })

  const languageOptions: LanguageOptions = Object.entries(
    config.i18n.supportedLanguages || {},
  ).reduce((acc, [language, languageConfig]) => {
    if (Object.keys(config.i18n.supportedLanguages).includes(language)) {
      acc.push({
        label: languageConfig.translations.general.thisLanguage,
        value: language as AcceptedLanguages,
      })
    }
    return acc
  }, [] as LanguageOptions)

  const navPrefs = await getNavPrefs(req)

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: req.user ?? true,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  return {
    clientConfig,
    dateFNSKey: req.i18n.dateFNSKey,
    fallbackLang: config.i18n.fallbackLanguage,
    isNavOpen: navPrefs?.open ?? true,
    languageCode,
    languageOptions,
    locale: req.locale ?? undefined,
    permissions,
    theme,
    translations: req.i18n.translations,
    user: req.user,
  }
}
