'use server'

import type { ImportMap, SanitizedConfig } from 'payload'

import { applyLocaleFiltering, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React from 'react'

import type { InitAdminContextFn } from '../Root/index.js'

/* eslint-disable payload/no-imports-from-exports-dir -- Server component must reference exports/client bundle for proper client boundary in prod builds */
import { NotFoundClient, PageConfigProvider } from '../../exports/client/index.js'

/* eslint-enable payload/no-imports-from-exports-dir */
import { DefaultTemplate } from '../../templates/Default/index.js'
import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'

export type RenderNotFoundPageArgs = {
  config: Promise<SanitizedConfig>
  importMap: ImportMap
  initAdminContext: InitAdminContextFn
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export const renderNotFoundPage = async ({
  config: configPromise,
  importMap,
  initAdminContext,
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: RenderNotFoundPageArgs) => {
  const config = await configPromise
  const { routes: { admin: adminRoute } = {} } = config

  const searchParams = await searchParamsPromise
  const queryString = `${qs.stringify(searchParams ?? {}, { addQueryPrefix: true })}`

  const {
    locale,
    permissions,
    req,
    req: { payload },
    user,
  } = await initAdminContext({
    configPromise: config,
    importMap,
    key: 'RootLayout',
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      // intentionally omit `serverURL` to keep URL relative
      urlSuffix: `${formatAdminURL({ adminRoute, path: '/not-found' })}${searchParams ? queryString : ''}`,
    },
  })

  if (!req.user || !permissions.canAccessAdmin) {
    return <NotFoundClient />
  }

  const params = await paramsPromise
  const visibleEntities = getVisibleEntities({ req })

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  return (
    <PageConfigProvider config={clientConfig}>
      <DefaultTemplate
        i18n={req.i18n}
        locale={locale}
        params={params}
        payload={payload}
        permissions={permissions}
        req={req}
        searchParams={searchParams}
        user={user}
        visibleEntities={visibleEntities}
      >
        <NotFoundClient />
      </DefaultTemplate>
    </PageConfigProvider>
  )
}
