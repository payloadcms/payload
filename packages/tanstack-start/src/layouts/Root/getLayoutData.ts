import type { AcceptedLanguages } from '@payloadcms/translations'
import type { ImportMap, LanguageOptions, SanitizedConfig, ServerProps } from 'payload'

import { getNavPrefs } from '@payloadcms/ui/elements/Nav/getNavPrefs'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { Outlet } from '@tanstack/react-router'
import { applyLocaleFiltering } from 'payload/shared'
import { createElement } from 'react'

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

  // Build the custom admin provider tree (`config.admin.components.providers`)
  // nested around the router `<Outlet />`, mirroring the Next adapter's
  // `NestProviders`. Returned as an unrendered element; the caller's server
  // function renders it to an RSC payload (so server-component providers run
  // server-side and client providers wrap the live Outlet). `undefined` when
  // no custom providers are configured — the caller falls back to `<Outlet />`.
  const providerPaths = config.admin?.components?.providers
  let providers: React.ReactNode = undefined
  if (Array.isArray(providerPaths) && providerPaths.length > 0) {
    const serverProps: ServerProps = {
      i18n: req.i18n,
      params: {},
      payload: req.payload,
      permissions,
      searchParams: {},
      server: req.server!,
      user: req.user ?? undefined,
    }
    // Mirror the Next adapter's `NestProviders`: render each configured provider
    // via `RenderServerComponent` so the entry's own `clientProps`/`serverProps`
    // (e.g. plugin-multi-tenant's `userHasAccessToAllTenants`) are merged in, and
    // server components receive `serverProps` while client components get only
    // `clientProps`. Nested around the router `<Outlet />` instead of `children`.
    providers = providerPaths.reduceRight<React.ReactNode>(
      (children, provider) =>
        RenderServerComponent({
          clientProps: { children },
          Component: provider,
          importMap,
          serverProps,
        }),
      createElement(Outlet),
    )
  }

  return {
    clientConfig,
    dateFNSKey: req.i18n.dateFNSKey,
    fallbackLang: config.i18n.fallbackLanguage,
    isNavOpen: navPrefs?.open ?? true,
    languageCode,
    languageOptions,
    locale: req.locale ?? undefined,
    permissions,
    providers,
    theme,
    translations: req.i18n.translations,
    user: req.user,
  }
}
