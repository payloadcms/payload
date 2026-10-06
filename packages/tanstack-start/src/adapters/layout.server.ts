import type { RootLayoutData as UIRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'
import type { ImportMap, SanitizedConfig, ServerProps } from 'payload'
import type { ReactNode } from 'react'

import { NestProviders } from '@payloadcms/ui/layouts/NestProviders'
import { getRootLayoutData } from '@payloadcms/ui/layouts/Root/getRootLayoutData'
import { Outlet } from '@tanstack/react-router'
import { renderServerComponent } from '@tanstack/react-start/rsc'
import { createElement } from 'react'

import type { SerializableRecord } from '../utilities/toSerializable.js'

import { initAdminContext } from '../utilities/initAdminContext.server.js'
import { toSerializable } from '../utilities/toSerializable.js'

export type LoadLayoutDataResult = SerializableRecord

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

/**
 * Resolves the admin layout data for TanStack Start and returns a serializable
 * payload for the `/_payload` route loader. The framework adapter wraps this in
 * a `createServerFn` that supplies the app's `config` and generated `importMap`.
 *
 * `toSerializable` strips React elements, so the custom-providers element tree
 * (`config.admin.components.providers`) is rendered to an RSC payload separately
 * and re-attached.
 */
export async function loadLayoutData({
  config,
  importMap,
}: {
  config: SanitizedConfig
  importMap: ImportMap
}): Promise<LoadLayoutDataResult> {
  const { providers, ...data } = await getLayoutData({ configPromise: config, importMap })

  return toSerializable(data, {
    providers: providers ? await renderServerComponent(providers as any) : undefined,
  })
}
