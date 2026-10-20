import type { RootLayoutData as UIRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'
import type { RenderableServerComponent } from '@tanstack/react-start/rsc'
import type { ImportMap, SanitizedConfig, ServerProps } from 'payload'
import type { ReactElement, ReactNode } from 'react'

import { NestProviders } from '@payloadcms/ui/layouts/NestProviders'
import { getRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import { createElement } from 'react'

// eslint-disable-next-line payload/no-imports-from-exports-dir -- Register the client boundary in the Flight model.
import { PayloadRootProviders } from '../../exports/client/layout.js'
import { initAdminContext } from '../../utilities/initAdminContext.server.js'
import { PayloadOutlet } from './outlet.js'

export type LoadLayoutDataResult = {
  layout: RenderableServerComponent<ReactElement>
} & Pick<
  RootLayoutData,
  'dir' | 'highContrastMode' | 'languageCode' | 'suppressHydrationWarning' | 'theme' | 'themeSource'
>

export type RootLayoutData = {
  /** Custom admin providers wrapping the Outlet. */
  providers?: ReactNode
} & UIRootLayoutData

export type GetLayoutDataArgs = {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
}

/** Fetches the admin layout data for the TanStack layout route loader. */
export async function getLayoutData({
  configPromise,
  importMap,
}: GetLayoutDataArgs): Promise<RootLayoutData> {
  const context = await initAdminContext({ configPromise, importMap })

  const { cookies, permissions, req, user } = context

  const data = await getRootLayoutData({
    cookies,
    importMap,
    permissions,
    req,
    user,
  })

  const providerPaths = req.payload.config.admin?.components?.providers

  let providers: ReactNode

  if (Array.isArray(providerPaths) && providerPaths.length > 0) {
    const serverProps: ServerProps = {
      i18n: req.i18n,
      params: {},
      payload: req.payload,
      permissions,
      searchParams: {},
      server: req.server!,
      user: user ?? undefined,
    }

    providers = createElement(NestProviders, {
      children: createElement(PayloadOutlet),
      importMap,
      providers: providerPaths,
      serverProps,
    })
  }

  return { ...data, providers }
}

/** Keeps document attributes ordinary and sends the complete layout model through Flight. */
export async function loadLayoutData({
  config,
  importMap,
}: {
  config: SanitizedConfig
  importMap: ImportMap
}): Promise<LoadLayoutDataResult> {
  const data = await getLayoutData({ configPromise: config, importMap })
  const { dir, highContrastMode, languageCode, suppressHydrationWarning, theme, themeSource } = data

  return {
    dir,
    highContrastMode,
    languageCode,
    layout: await renderServerComponent(createElement(PayloadRootProviders, { data })),
    suppressHydrationWarning,
    theme,
    themeSource,
  }
}
