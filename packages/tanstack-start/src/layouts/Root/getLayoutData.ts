import type { RootLayoutData as UIRootLayoutData } from '@payloadcms/ui/utilities/getRootLayoutData'
import type { ImportMap, SanitizedConfig, ServerProps } from 'payload'
import type { ReactNode } from 'react'

import { NestProviders } from '@payloadcms/ui/layouts/NestProviders'
import { getRootLayoutData } from '@payloadcms/ui/utilities/getRootLayoutData'
import { Outlet } from '@tanstack/react-router'
import { createElement } from 'react'

import { initAdminContext } from '../../utilities/initAdminContext.server.js'

export type RootLayoutData = {
  /** Custom admin providers wrapping the Outlet, rendered to an RSC payload before serialization. */
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

  const { permissions, req, user } = context

  const data = await getRootLayoutData({
    clientConfigUser: user ?? true,
    context,
    importMap,
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
      children: createElement(Outlet),
      importMap,
      providers: providerPaths,
      serverProps,
    })
  }

  return { ...data, providers }
}
